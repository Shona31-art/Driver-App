import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface TruckListRow {
  id: string;
  registration: string;
  make_model: string | null;
  max_capacity_tons: number | null;
  active: boolean;
  created_at: string;
}

export async function getTrucksList(): Promise<TruckListRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("id, registration, make_model, max_capacity_tons, active, created_at")
    .order("registration", { ascending: true });

  if (error) {
    console.error("getTrucksList failed", error);
    return [];
  }
  return data;
}

// For the "Truck" dropdown when creating/editing an order -- active
// trucks only, so a decommissioned truck can't be picked for a new load.
export async function getActiveTrucks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("id, registration")
    .eq("active", true)
    .order("registration", { ascending: true });

  if (error) {
    console.error("getActiveTrucks failed", error);
    return [];
  }
  return data;
}
