import { z } from "zod";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB, matches the documents table check constraint and storage bucket limit
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;

export function validateUploadedFile(file: File): string | null {
  if (file.size === 0) return "File is empty.";
  if (file.size > MAX_FILE_SIZE_BYTES) return "File must be 20 MB or smaller.";
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return "Only PDF, PNG, and JPEG files are allowed.";
  }
  return null;
}

// Describes a file the client has already uploaded directly to Supabase
// Storage (see lib/uploads/upload-file.ts) -- Server Actions receive this
// instead of the raw File so upload bytes never pass through the Server
// Action body (which Next.js caps at 1 MB by default).
export const uploadedFileMetaSchema = z.object({
  filePath: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
});
export type UploadedFileMeta = z.infer<typeof uploadedFileMetaSchema>;

// Defence in depth: confirms a client-supplied file path actually falls
// under the folder the caller is authorized to write to, before it's
// recorded in the documents table. Storage RLS already stops a driver from
// *writing* outside their own order/expense folder, and read access is
// separately gated by signed-URL RLS, so this can't leak another driver's
// file -- it just stops an obviously-wrong path from being recorded as if
// it belonged here.
export function assertPathInFolder(filePath: string, folder: "orders" | "expenses", ownerId: string): string | null {
  if (!filePath.startsWith(`${folder}/${ownerId}/`)) return "Invalid file path.";
  return null;
}
