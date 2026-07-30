import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DocumentType } from "@/lib/supabase/types";
import { assertPathInFolder, type UploadedFileMeta } from "@/lib/validations/document";
import type { ActionResult } from "@/lib/actions/types";

// The client has already uploaded the file bytes directly to Storage (see
// lib/uploads/upload-file.ts) -- this just records the resulting metadata
// against the order, with uploaded_by set from the trusted server-side
// session rather than anything the client sent.
export async function recordOrderDocument(
  supabase: SupabaseClient<Database>,
  params: { orderId: string; meta: UploadedFileMeta; type: DocumentType; uploadedBy: string },
): Promise<ActionResult> {
  const pathError = assertPathInFolder(params.meta.filePath, "orders", params.orderId);
  if (pathError) return { success: false, error: pathError };

  const { error: dbError } = await supabase.from("documents").insert({
    order_id: params.orderId,
    type: params.type,
    file_path: params.meta.filePath,
    file_name: params.meta.fileName,
    file_size: params.meta.fileSize,
    mime_type: params.meta.mimeType,
    uploaded_by: params.uploadedBy,
  });

  if (dbError) {
    console.error("recordOrderDocument: documents insert failed", dbError);
    return { success: false, error: "Failed to save document details. Please try again." };
  }

  return { success: true };
}

export async function recordExpenseDocument(
  supabase: SupabaseClient<Database>,
  params: { expenseId: string; meta: UploadedFileMeta; uploadedBy: string },
): Promise<ActionResult> {
  const pathError = assertPathInFolder(params.meta.filePath, "expenses", params.expenseId);
  if (pathError) return { success: false, error: pathError };

  const { error: dbError } = await supabase.from("documents").insert({
    expense_id: params.expenseId,
    type: "receipt",
    file_path: params.meta.filePath,
    file_name: params.meta.fileName,
    file_size: params.meta.fileSize,
    mime_type: params.meta.mimeType,
    uploaded_by: params.uploadedBy,
  });

  if (dbError) {
    console.error("recordExpenseDocument: documents insert failed", dbError);
    return { success: false, error: "Failed to save document details. Please try again." };
  }

  return { success: true };
}
