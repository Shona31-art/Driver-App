"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/actions/notifications";
import { recordOrderDocument } from "@/lib/actions/documents";
import { markLoadedSchema, markDeliveredSchema } from "@/lib/validations/order";
import { uploadedFileMetaSchema } from "@/lib/validations/document";
import type { ActionResult } from "@/lib/actions/types";
import { z } from "zod";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const NOT_YOUR_ORDER_ERROR = "This order wasn't found, or isn't assigned to you.";

async function getOwnDriverId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("drivers").select("id").eq("user_id", userId).single();
  return data?.id ?? null;
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/driver/dashboard");
  revalidatePath("/driver/orders");
  revalidatePath(`/driver/orders/${orderId}`);
}

export async function confirmAssignment(orderId: string): Promise<ActionResult> {
  const actor = await requireRole("driver");
  const driverId = await getOwnDriverId(actor.id);
  if (!driverId) return { success: false, error: GENERIC_ERROR };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", orderId)
    .eq("driver_id", driverId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("confirmAssignment failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
  if (!data) return { success: false, error: NOT_YOUR_ORDER_ERROR };

  revalidateOrderPaths(orderId);
  return { success: true };
}

const markLoadedInputSchema = markLoadedSchema.extend({
  loadingDocuments: z.array(uploadedFileMetaSchema),
});
export type MarkLoadedActionInput = z.infer<typeof markLoadedInputSchema>;

// Requires at least one loading document to already be uploaded (by the
// client, directly to Storage -- see lib/uploads/upload-file.ts) before the
// status flips to "loaded" -- this is an application-level rule (the DB
// trigger only enforces begin_km being set), matching the Phase 2 decision
// that document-presence is checked here rather than in the database.
export async function markLoaded(input: MarkLoadedActionInput): Promise<ActionResult> {
  const actor = await requireRole("driver");
  const driverId = await getOwnDriverId(actor.id);
  if (!driverId) return { success: false, error: GENERIC_ERROR };

  const parsed = markLoadedInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (parsed.data.loadingDocuments.length === 0) {
    return { success: false, error: "Please upload at least one loading document." };
  }

  const supabase = await createClient();

  const { data: owned } = await supabase
    .from("orders")
    .select("id")
    .eq("id", parsed.data.orderId)
    .eq("driver_id", driverId)
    .maybeSingle();
  if (!owned) return { success: false, error: NOT_YOUR_ORDER_ERROR };

  for (const meta of parsed.data.loadingDocuments) {
    const result = await recordOrderDocument(supabase, {
      orderId: parsed.data.orderId,
      meta,
      type: "loading_document",
      uploadedBy: actor.id,
    });
    if (!result.success) return result;
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ begin_km: parsed.data.beginKm, status: "loaded" })
    .eq("id", parsed.data.orderId)
    .eq("driver_id", driverId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("markLoaded failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
  if (!data) return { success: false, error: NOT_YOUR_ORDER_ERROR };

  revalidateOrderPaths(parsed.data.orderId);
  return { success: true };
}

const markDeliveredInputSchema = markDeliveredSchema.extend({
  deliveryDocuments: z.array(uploadedFileMetaSchema),
  podDocuments: z.array(uploadedFileMetaSchema),
});
export type MarkDeliveredActionInput = z.infer<typeof markDeliveredInputSchema>;

export async function markDelivered(input: MarkDeliveredActionInput): Promise<ActionResult> {
  const actor = await requireRole("driver");
  const driverId = await getOwnDriverId(actor.id);
  if (!driverId) return { success: false, error: GENERIC_ERROR };

  const parsed = markDeliveredInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (parsed.data.deliveryDocuments.length === 0) {
    return { success: false, error: "Please upload at least one delivery document." };
  }
  if (parsed.data.podDocuments.length === 0) {
    return { success: false, error: "Please upload the completed driver POD." };
  }

  const supabase = await createClient();

  const { data: owned } = await supabase
    .from("orders")
    .select("id, notes")
    .eq("id", parsed.data.orderId)
    .eq("driver_id", driverId)
    .maybeSingle();
  if (!owned) return { success: false, error: NOT_YOUR_ORDER_ERROR };

  for (const meta of parsed.data.deliveryDocuments) {
    const result = await recordOrderDocument(supabase, {
      orderId: parsed.data.orderId,
      meta,
      type: "delivery_document",
      uploadedBy: actor.id,
    });
    if (!result.success) return result;
  }

  for (const meta of parsed.data.podDocuments) {
    const result = await recordOrderDocument(supabase, {
      orderId: parsed.data.orderId,
      meta,
      type: "pod",
      uploadedBy: actor.id,
    });
    if (!result.success) return result;
  }

  const combinedNotes = parsed.data.notes
    ? [owned.notes, `[Delivery note] ${parsed.data.notes}`].filter(Boolean).join("\n\n")
    : owned.notes;

  const { data, error } = await supabase
    .from("orders")
    .update({ end_km: parsed.data.endKm, status: "delivered", notes: combinedNotes })
    .eq("id", parsed.data.orderId)
    .eq("driver_id", driverId)
    .select("order_number")
    .maybeSingle();

  if (error) {
    console.error("markDelivered failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
  if (!data) return { success: false, error: NOT_YOUR_ORDER_ERROR };

  await notifyAdmins({
    type: "order_status_changed",
    title: "Order delivered",
    message: `Order ${data.order_number} has been marked as delivered and is ready for review.`,
    relatedOrderId: parsed.data.orderId,
  });

  revalidateOrderPaths(parsed.data.orderId);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
