import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getDriverCurrentOrder(userId: string) {
  const supabase = await createClient();
  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).single();
  if (!driver) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("driver_id", driver.id)
    .in("status", ["assigned", "confirmed", "loaded", "delivered"])
    .maybeSingle();

  if (error) {
    console.error("getDriverCurrentOrder failed", error);
    return null;
  }
  return data;
}

// Every order ever assigned to this driver, regardless of status -- used
// to populate the "link to an order" dropdown when submitting an expense,
// since a diesel/toll receipt can reasonably belong to a trip that's still
// in progress, not just a completed one.
export async function getDriverOrderOptions(userId: string) {
  const supabase = await createClient();
  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).single();
  if (!driver) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name")
    .eq("driver_id", driver.id)
    .order("pickup_date", { ascending: false });

  if (error) {
    console.error("getDriverOrderOptions failed", error);
    return [];
  }
  return data;
}

export async function getDriverPreviousOrders(userId: string) {
  const supabase = await createClient();
  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).single();
  if (!driver) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, status, pickup_date, delivery_date")
    .eq("driver_id", driver.id)
    .eq("status", "completed")
    .order("delivery_date", { ascending: false });

  if (error) {
    console.error("getDriverPreviousOrders failed", error);
    return [];
  }
  return data;
}
