import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/lib/supabase/types";

// Notifications are written via the service role rather than the acting
// user's own session, because they insert on behalf of a *different* user
// (the recipient) -- something no per-user RLS policy allows, by design
// (see migration comment in 20260730120200_rls_policies.sql). Call this
// from Server Actions right after the DB event that triggers it.
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedOrderId?: string;
  relatedExpenseId?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    related_order_id: params.relatedOrderId,
    related_expense_id: params.relatedExpenseId,
  });

  if (error) {
    console.error("createNotification failed", error);
  }
}

export async function notifyAdmins(params: {
  type: NotificationType;
  title: string;
  message: string;
  relatedOrderId?: string;
  relatedExpenseId?: string;
}) {
  const admin = createAdminClient();
  const { data: admins, error } = await admin.from("users").select("id").in("role", ["super_admin", "admin"]);

  if (error || !admins) {
    console.error("notifyAdmins: failed to look up admin users", error);
    return;
  }

  await Promise.all(admins.map((user) => createNotification({ ...params, userId: user.id })));
}
