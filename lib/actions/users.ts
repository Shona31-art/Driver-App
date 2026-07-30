"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/actions/audit";
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "@/lib/validations/user";
import type { ActionResult } from "@/lib/actions/types";

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Creates the auth user (via Supabase's invite-by-email, so the person sets
// their own password on first login rather than us generating one) and, for
// driver accounts, the linked drivers profile row. If the drivers insert
// fails we roll back the auth user rather than leaving an inconsistent
// driver-with-no-profile account behind.
export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  const actor = await requireRole("super_admin");

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const admin = createAdminClient();
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(data.email, {
    data: { full_name: data.fullName, role: data.role },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/reset-password`,
  });

  if (inviteError || !inviteData.user) {
    console.error("createUser: invite failed", inviteError);
    const message = inviteError?.code === "email_exists" ? "A user with this email already exists." : GENERIC_ERROR;
    return { success: false, error: message };
  }

  const newUserId = inviteData.user.id;

  if (data.role === "driver") {
    const { error: driverError } = await admin.from("drivers").insert({
      user_id: newUserId,
      full_name: data.fullName,
      phone: data.phone || null,
      drivers_license: data.driversLicense || null,
      pdp_number: data.pdpNumber || null,
      horse_registration: data.horseRegistration || null,
    });

    if (driverError) {
      console.error("createUser: driver profile insert failed, rolling back auth user", driverError);
      await admin.auth.admin.deleteUser(newUserId);
      return { success: false, error: GENERIC_ERROR };
    }
  }

  await logAuditEvent({
    actorId: actor.id,
    action: "user.created",
    targetType: "user",
    targetId: newUserId,
    metadata: { email: data.email, role: data.role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// Updates profile fields on an existing user. Driver-specific fields are
// upserted into drivers (onConflict: user_id) so switching a non-driver
// account to the driver role creates the profile row rather than failing.
export async function updateUser(input: UpdateUserInput): Promise<ActionResult> {
  const actor = await requireRole("super_admin");

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = await createClient();

  const { error: userError } = await supabase
    .from("users")
    .update({ full_name: data.fullName, role: data.role, active: data.active, updated_by: actor.id })
    .eq("id", data.id);

  if (userError) {
    console.error("updateUser: users update failed", userError);
    return { success: false, error: GENERIC_ERROR };
  }

  if (data.role === "driver") {
    const { error: driverError } = await supabase.from("drivers").upsert(
      {
        user_id: data.id,
        full_name: data.fullName,
        phone: data.phone || null,
        drivers_license: data.driversLicense || null,
        pdp_number: data.pdpNumber || null,
        horse_registration: data.horseRegistration || null,
      },
      { onConflict: "user_id" },
    );

    if (driverError) {
      console.error("updateUser: driver profile upsert failed", driverError);
      return { success: false, error: GENERIC_ERROR };
    }
  }

  await logAuditEvent({
    actorId: actor.id,
    action: "user.updated",
    targetType: "user",
    targetId: data.id,
    metadata: { role: data.role, active: data.active },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function setUserActive(id: string, active: boolean): Promise<ActionResult> {
  const actor = await requireRole("super_admin");

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ active, updated_by: actor.id })
    .eq("id", id);

  if (error) {
    console.error("setUserActive failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  await logAuditEvent({
    actorId: actor.id,
    action: active ? "user.activated" : "user.deactivated",
    targetType: "user",
    targetId: id,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// Hard delete. Blocked at the database level (foreign key RESTRICT from
// orders/expenses to drivers) if the account has order or expense history --
// that's deliberate: business-critical records must not be silently
// orphaned or lost. Deactivating is the correct action for a driver who has
// worked before; delete is only for detach-clean accounts (e.g. a mistaken
// invite).
export async function deleteUser(id: string): Promise<ActionResult> {
  const actor = await requireRole("super_admin");

  if (id === actor.id) {
    return { success: false, error: "You cannot delete your own account." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    console.error("deleteUser failed", error);
    const message = error.code === "23503" || /foreign key/i.test(error.message)
      ? "This user has order or expense history and cannot be deleted. Deactivate the account instead."
      : GENERIC_ERROR;
    return { success: false, error: message };
  }

  await logAuditEvent({ actorId: actor.id, action: "user.deleted", targetType: "user", targetId: id });

  revalidatePath("/admin/users");
  return { success: true };
}

// Sends Supabase's standard password-reset email -- no temporary password
// is ever generated (Phase 1 decision). Looked up server-side by id rather
// than trusting a client-supplied email, so a Super Admin can't be tricked
// into emailing a reset link to an address that doesn't belong to the
// account being acted on.
export async function resetUserPassword(id: string): Promise<ActionResult> {
  const actor = await requireRole("super_admin");

  const supabase = await createClient();
  const { data: user, error: lookupError } = await supabase
    .from("users")
    .select("email")
    .eq("id", id)
    .single();

  if (lookupError || !user) {
    console.error("resetUserPassword: lookup failed", lookupError);
    return { success: false, error: GENERIC_ERROR };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("resetUserPassword: send failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  await logAuditEvent({ actorId: actor.id, action: "user.password_reset_requested", targetType: "user", targetId: id });

  return { success: true };
}
