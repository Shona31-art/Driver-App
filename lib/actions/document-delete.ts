"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/actions/audit";
import type { ActionResult } from "@/lib/actions/types";

// Admin/Super Admin only -- matches the permission tier chosen for the
// Documents overview page. Deletes the DB row first: if that fails,
// nothing is removed (consistent); if the follow-up storage delete fails,
// the result is an orphaned storage object with no dangling reference in
// the UI, which is the safer failure direction of the two.
export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const actor = await requireRole("super_admin", "admin");

  const supabase = await createClient();

  const { data: doc, error: lookupError } = await supabase
    .from("documents")
    .select("file_path, order_id")
    .eq("id", documentId)
    .maybeSingle();

  if (lookupError || !doc) {
    return { success: false, error: "This document wasn't found." };
  }

  const { error: deleteError } = await supabase.from("documents").delete().eq("id", documentId);
  if (deleteError) {
    console.error("deleteDocument: db delete failed", deleteError);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  const { error: storageError } = await supabase.storage.from("uploads").remove([doc.file_path]);
  if (storageError) {
    console.error("deleteDocument: storage cleanup failed (db row already removed)", storageError);
  }

  await logAuditEvent({
    actorId: actor.id,
    action: "document.deleted",
    targetType: "document",
    targetId: documentId,
    metadata: { order_id: doc.order_id },
  });

  revalidatePath("/admin/documents");
  revalidatePath("/driver/documents");
  if (doc.order_id) {
    revalidatePath(`/admin/orders/${doc.order_id}`);
    revalidatePath(`/driver/orders/${doc.order_id}`);
  }

  return { success: true };
}
