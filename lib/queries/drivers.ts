import "server-only";
import { createClient } from "@/lib/supabase/server";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export async function getDriversList() {
  const supabase = await createClient();

  const { data: drivers, error } = await supabase
    .from("drivers")
    .select("id, user_id, full_name, phone, drivers_license, pdp_number")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("getDriversList failed", error);
    return [];
  }

  const userIds = drivers.map((d) => d.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("id, email, active")
    .in("id", userIds.length ? userIds : [NIL_UUID]);
  const usersById = new Map((users ?? []).map((u) => [u.id, u]));

  return drivers.map((driver) => ({
    ...driver,
    email: usersById.get(driver.user_id)?.email ?? "",
    active: usersById.get(driver.user_id)?.active ?? false,
  }));
}
