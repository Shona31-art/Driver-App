"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/utils/geocode";
import { createNotification } from "@/lib/actions/notifications";
import { sendLoadAssignmentEmail } from "@/lib/email/resend";
import {
  createOrderSchema,
  updateOrderSchema,
  assignDriverSchema,
  type CreateOrderInput,
  type UpdateOrderInput,
  type AssignDriverInput,
} from "@/lib/validations/order";
import type { ActionResult } from "@/lib/actions/types";

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Best-effort: a flaky/rate-limited geocoder must never block creating or
// editing an order. Missing lat/lng just means no map pin yet.
async function geocodeBoth(pickupAddress: string, deliveryAddress: string) {
  const [pickup, delivery] = await Promise.all([geocodeAddress(pickupAddress), geocodeAddress(deliveryAddress)]);
  return {
    pickup_lat: pickup?.lat ?? null,
    pickup_lng: pickup?.lng ?? null,
    delivery_lat: delivery?.lat ?? null,
    delivery_lng: delivery?.lng ?? null,
  };
}

// Notifies (in-app + email) the driver newly assigned to an order. Reads
// through the session-bound client so it only ever sees data the acting
// Admin/Super Admin is already allowed to see.
async function notifyDriverOfAssignment(orderId: string, driverId: string) {
  const supabase = await createClient();

  const [{ data: order }, { data: driver }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "order_number, pickup_date, delivery_date, weight_tons, horse_registration, loading_number, pickup_address, delivery_address, pickup_lat, pickup_lng, notes",
      )
      .eq("id", orderId)
      .single(),
    supabase.from("drivers").select("user_id, full_name").eq("id", driverId).single(),
  ]);

  if (!order || !driver) return;

  const { data: driverUser } = await supabase.from("users").select("email").eq("id", driver.user_id).single();
  if (!driverUser) return;

  await createNotification({
    userId: driver.user_id,
    type: "load_assigned",
    title: "New load assigned",
    message: `Order ${order.order_number} has been assigned to you. Please confirm receipt.`,
    relatedOrderId: orderId,
  });

  await sendLoadAssignmentEmail({
    to: driverUser.email,
    driverName: driver.full_name,
    orderNumber: order.order_number,
    pickupDate: order.pickup_date,
    deliveryDate: order.delivery_date,
    weightTons: order.weight_tons,
    horseRegistration: order.horse_registration,
    loadingNumber: order.loading_number,
    pickupAddress: order.pickup_address,
    deliveryAddress: order.delivery_address,
    pickupLat: order.pickup_lat,
    pickupLng: order.pickup_lng,
    notes: order.notes,
    appUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  });
}

export async function createOrder(input: CreateOrderInput): Promise<ActionResult> {
  const actor = await requireRole("super_admin", "admin");

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const coords = await geocodeBoth(data.pickupAddress, data.deliveryAddress);
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      customer_name: data.customerName,
      pickup_address: data.pickupAddress,
      delivery_address: data.deliveryAddress,
      pickup_date: data.pickupDate,
      delivery_date: data.deliveryDate,
      weight_tons: data.weightTons,
      horse_registration: data.horseRegistration,
      loading_number: data.loadingNumber || null,
      notes: data.notes || null,
      driver_id: data.driverId || null,
      status: data.driverId ? "assigned" : "unassigned",
      created_by: actor.id,
      ...coords,
    })
    .select("id")
    .single();

  if (error || !order) {
    console.error("createOrder failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  if (data.driverId) {
    await notifyDriverOfAssignment(order.id, data.driverId);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function updateOrder(input: UpdateOrderInput): Promise<ActionResult> {
  await requireRole("super_admin", "admin");

  const parsed = updateOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const coords = await geocodeBoth(data.pickupAddress, data.deliveryAddress);
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      customer_name: data.customerName,
      pickup_address: data.pickupAddress,
      delivery_address: data.deliveryAddress,
      pickup_date: data.pickupDate,
      delivery_date: data.deliveryDate,
      weight_tons: data.weightTons,
      horse_registration: data.horseRegistration,
      loading_number: data.loadingNumber || null,
      notes: data.notes || null,
      ...coords,
    })
    .eq("id", data.id);

  if (error) {
    console.error("updateOrder failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.id}`);
  return { success: true };
}

// Handles both first assignment (unassigned -> assigned) and reassignment
// (driver_id change at any later stage). The order's current status is
// preserved on reassignment -- only unassigned orders advance to
// "assigned"; the enforce_order_status_transition trigger separately
// blocks any reassignment once the order is completed.
export async function assignDriver(input: AssignDriverInput): Promise<ActionResult> {
  await requireRole("super_admin", "admin");

  const parsed = assignDriverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = await createClient();

  const { data: existing, error: lookupError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", data.orderId)
    .single();

  if (lookupError || !existing) {
    return { success: false, error: GENERIC_ERROR };
  }

  const nextStatus = existing.status === "unassigned" ? "assigned" : existing.status;

  const { error } = await supabase
    .from("orders")
    .update({ driver_id: data.driverId, status: nextStatus })
    .eq("id", data.orderId);

  if (error) {
    console.error("assignDriver failed", error);
    const message = /reassign driver on a completed order/i.test(error.message)
      ? "This order is already completed and cannot be reassigned."
      : GENERIC_ERROR;
    return { success: false, error: message };
  }

  await notifyDriverOfAssignment(data.orderId, data.driverId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.orderId}`);
  return { success: true };
}

export async function markOrderCompleted(orderId: string): Promise<ActionResult> {
  await requireRole("super_admin", "admin");

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status: "completed" }).eq("id", orderId);

  if (error) {
    console.error("markOrderCompleted failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}

// Hard delete. Super Admin only, per the permission matrix -- Admin can
// create/edit orders but not delete them.
export async function deleteOrder(orderId: string): Promise<ActionResult> {
  await requireRole("super_admin");

  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);

  if (error) {
    console.error("deleteOrder failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}
