import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getOrderDocuments(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, type, file_name, file_path, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getOrderDocuments failed", error);
    return [];
  }
  return data;
}

export async function getExpenseDocuments(expenseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, type, file_name, file_path, created_at")
    .eq("expense_id", expenseId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getExpenseDocuments failed", error);
    return [];
  }
  return data;
}

// Bucket is private, so every download link is a short-lived signed URL
// rather than a public path.
export async function getSignedDocumentUrl(filePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("uploads").createSignedUrl(filePath, 60 * 10);

  if (error || !data) {
    console.error("getSignedDocumentUrl failed", error);
    return null;
  }
  return data.signedUrl;
}
