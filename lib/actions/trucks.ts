"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/actions/audit";
import { createTruckSchema, updateTruckSchema, type CreateTruckInput, type UpdateTruckInput } from "@/lib/validations/truck";
import type { ActionResult } from "@/lib/actions/types";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function createTruck(input: CreateTruckInput): Promise<ActionResult> {
  const actor = await requireRole("super_admin", "admin");

  const parsed = createTruckSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { data: truck, error } = await supabase
    .from("trucks")
    .insert({
      registration: data.registration,
      make_model: data.makeModel || null,
      max_capacity_tons: data.maxCapacityTons ?? null,
      created_by: actor.id,
    })
    .select("id")
    .single();

  if (error || !truck) {
    console.error("createTruck failed", error);
    const message = /duplicate key/i.test(error?.message ?? "") ? "A truck with this registration already exists." : GENERIC_ERROR;
    return { success: false, error: message };
  }

  await logAuditEvent({ actorId: actor.id, action: "truck.created", targetType: "truck", targetId: truck.id });

  revalidatePath("/admin/trucks");
  return { success: true };
}

export async function updateTruck(input: UpdateTruckInput): Promise<ActionResult> {
  const actor = await requireRole("super_admin", "admin");

  const parsed = updateTruckSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("trucks")
    .update({
      registration: data.registration,
      make_model: data.makeModel || null,
      max_capacity_tons: data.maxCapacityTons ?? null,
      active: data.active,
      updated_by: actor.id,
    })
    .eq("id", data.id);

  if (error) {
    console.error("updateTruck failed", error);
    const message = /duplicate key/i.test(error.message) ? "A truck with this registration already exists." : GENERIC_ERROR;
    return { success: false, error: message };
  }

  await logAuditEvent({ actorId: actor.id, action: "truck.updated", targetType: "truck", targetId: data.id });

  revalidatePath("/admin/trucks");
  return { success: true };
}

// Hard delete. Super Admin only, per the permission matrix -- same tier as
// deleting an order. Blocked at the database level (FK RESTRICT from
// orders.truck_id) if the truck has any order history, so a truck actually
// used on a load can't be silently deleted out from under that record.
export async function deleteTruck(truckId: string): Promise<ActionResult> {
  const actor = await requireRole("super_admin");

  const supabase = await createClient();
  const { error } = await supabase.from("trucks").delete().eq("id", truckId);

  if (error) {
    console.error("deleteTruck failed", error);
    const message =
      error.code === "23503" || /foreign key/i.test(error.message)
        ? "This truck has order history and cannot be deleted. Mark it inactive instead."
        : GENERIC_ERROR;
    return { success: false, error: message };
  }

  await logAuditEvent({ actorId: actor.id, action: "truck.deleted", targetType: "truck", targetId: truckId });

  revalidatePath("/admin/trucks");
  return { success: true };
}
