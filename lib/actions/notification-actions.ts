"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("markNotificationRead failed", error);
    return { success: false, error: "Something went wrong." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("markAllNotificationsRead failed", error);
    return { success: false, error: "Something went wrong." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
