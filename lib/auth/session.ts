import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
}

// Uses auth.getUser() rather than getSession(): getUser() revalidates the
// token against the Supabase Auth server on every call instead of trusting
// the session cookie's contents, which matters because this is the
// server-side source of truth every route/action authorization check relies
// on.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, role, active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    active: profile.active,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

// Redirects a signed-in user with the wrong role to their own dashboard
// rather than showing an error -- e.g. a driver hitting an /admin/* URL
// lands back on /driver/dashboard, an admin hitting /admin/users lands on
// /admin/dashboard. Use this at the top of every role-gated Server
// Component/Action; never rely on middleware or the route's folder alone.
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(user.role === "driver" ? "/driver/dashboard" : "/admin/dashboard");
  }
  return user;
}
