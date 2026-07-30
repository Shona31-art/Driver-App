import "server-only";
import { createClient } from "@/lib/supabase/server";

// RLS (notifications_select: user_id = auth.uid()) already scopes these to
// the current session -- no explicit user filter needed here.
export async function getNotifications(limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, read_at, related_order_id, related_expense_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getNotifications failed", error);
    return [];
  }
  return data;
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    console.error("getUnreadNotificationCount failed", error);
    return 0;
  }
  return count ?? 0;
}
