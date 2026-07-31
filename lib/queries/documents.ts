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

export interface DocumentOverviewRow {
  id: string;
  type: string;
  file_name: string;
  file_path: string;
  created_at: string;
  order_id: string;
  order_number: string;
}

// Every order-linked document (loading/delivery/pod -- not expense
// receipts, which link to an expense rather than an order number),
// grouped by order for the Documents overview page. Uses the
// session-bound client, so RLS naturally scopes this to "every order" for
// Admin/Super Admin and "my own orders only" for a driver -- no separate
// query needed per role.
export async function getDocumentsOverview(): Promise<DocumentOverviewRow[]> {
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, type, file_name, file_path, created_at, order_id")
    .not("order_id", "is", null)
    .order("created_at", { ascending: false });

  if (error || !documents) {
    console.error("getDocumentsOverview failed", error);
    return [];
  }

  const orderIds = [...new Set(documents.map((d) => d.order_id).filter((id): id is string => !!id))];
  let orderNumbersById = new Map<string, string>();
  if (orderIds.length > 0) {
    const { data: orders } = await supabase.from("orders").select("id, order_number").in("id", orderIds);
    orderNumbersById = new Map((orders ?? []).map((o) => [o.id, o.order_number]));
  }

  return documents.map((doc) => ({
    ...doc,
    order_id: doc.order_id!,
    order_number: orderNumbersById.get(doc.order_id!) ?? "Unknown",
  }));
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
