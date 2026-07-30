import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export interface UserListRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  driver: {
    phone: string | null;
    drivers_license: string | null;
    pdp_number: string | null;
    horse_registration: string | null;
  } | null;
}

// Two queries merged in JS rather than a single embedded select -- keeps
// the one-to-one users<->drivers join predictable regardless of how
// PostgREST infers the relationship's cardinality.
export async function getUsersList(): Promise<UserListRow[]> {
  const supabase = await createClient();

  const [usersResult, driversResult] = await Promise.all([
    supabase.from("users").select("id, email, full_name, role, active, created_at").order("created_at", { ascending: false }),
    supabase.from("drivers").select("user_id, phone, drivers_license, pdp_number, horse_registration"),
  ]);

  if (usersResult.error) {
    console.error("getUsersList: users query failed", usersResult.error);
    return [];
  }
  if (driversResult.error) {
    console.error("getUsersList: drivers query failed", driversResult.error);
  }

  const driverByUserId = new Map((driversResult.data ?? []).map((d) => [d.user_id, d]));

  return (usersResult.data ?? []).map((user) => ({
    ...user,
    driver: driverByUserId.get(user.id) ?? null,
  }));
}
