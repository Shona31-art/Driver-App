"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/driver-profile";
import type { ActionResult } from "@/lib/actions/types";

export async function updateOwnProfile(input: UpdateProfileInput): Promise<ActionResult> {
  const actor = await requireRole("driver");

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("drivers").update({ phone: parsed.data.phone }).eq("user_id", actor.id);

  if (error) {
    console.error("updateOwnProfile failed", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/driver/profile");
  return { success: true };
}
