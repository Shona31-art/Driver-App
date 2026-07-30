import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getDriverDashboardData(userId: string) {
  const supabase = await createClient();

  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).single();

  if (!driver) {
    return { currentLoad: null, completedLoadsCount: 0 };
  }

  const [{ data: currentLoad }, { count: completedLoadsCount }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, customer_name, status, pickup_date, delivery_date")
      .eq("driver_id", driver.id)
      .in("status", ["assigned", "confirmed", "loaded", "delivered"])
      .maybeSingle(),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driver.id)
      .eq("status", "completed"),
  ]);

  return { currentLoad, completedLoadsCount: completedLoadsCount ?? 0 };
}
