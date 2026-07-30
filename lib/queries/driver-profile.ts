import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getOwnDriverProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("full_name, phone, drivers_license, pdp_number, horse_registration")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("getOwnDriverProfile failed", error);
    return null;
  }
  return data;
}
