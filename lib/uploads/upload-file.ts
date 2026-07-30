import { createClient } from "@/lib/supabase/client";
import { validateUploadedFile, ALLOWED_MIME_TYPES, type UploadedFileMeta } from "@/lib/validations/document";
import type { DocumentType } from "@/lib/supabase/types";

// Uploads a file straight from the browser to Supabase Storage, bypassing
// the Server Action body limit entirely -- Storage RLS (uploads_insert in
// 20260730120300_storage.sql) still enforces that the signed-in driver can
// only write under an order/expense they actually own, so this is no less
// safe than uploading through a Server Action.
export async function uploadFileDirect(
  folder: "orders" | "expenses",
  ownerId: string,
  type: DocumentType,
  file: File,
): Promise<{ success: true; meta: UploadedFileMeta } | { success: false; error: string }> {
  const validationError = validateUploadedFile(file);
  if (validationError) return { success: false, error: validationError };

  const path = `${folder}/${ownerId}/${type}-${Date.now()}-${file.name}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type });

  if (error) {
    console.error("uploadFileDirect failed", error);
    return { success: false, error: "Failed to upload file. Please try again." };
  }

  return {
    success: true,
    // validateUploadedFile already confirmed file.type is one of these at
    // runtime; the cast just reflects that back to the type checker.
    meta: {
      filePath: path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type as (typeof ALLOWED_MIME_TYPES)[number],
    },
  };
}
