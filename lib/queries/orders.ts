import "server-only";
import { createClient } from "@/lib/supabase/server";

// Driver names merged in JS from a separate query, same pattern as
// getUsersList -- avoids relying on PostgREST's relationship-embedding
// inference for a plain lookup.
export async function getOrdersList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, status, pickup_date, delivery_date, driver_id")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getOrdersList failed", error);
    return [];
  }

  const driverIds = [...new Set(data.map((o) => o.driver_id).filter((id): id is string => !!id))];
  let driversById = new Map<string, string>();
  if (driverIds.length > 0) {
    const { data: drivers } = await supabase.from("drivers").select("id, full_name").in("id", driverIds);
    driversById = new Map((drivers ?? []).map((d) => [d.id, d.full_name]));
  }

  return data.map((order) => ({
    ...order,
    driver_name: order.driver_id ? (driversById.get(order.driver_id) ?? null) : null,
  }));
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();

  if (error) {
    console.error("getOrderById failed", error);
    return null;
  }
  if (!data) return null;

  const { data: truck } = await supabase.from("trucks").select("registration").eq("id", data.truck_id).maybeSingle();

  return { ...data, truck_registration: truck?.registration ?? "Unknown" };
}

export async function getOrderStatusHistory(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_status_history")
    .select("id, from_status, to_status, changed_at")
    .eq("order_id", orderId)
    .order("changed_at", { ascending: true });

  if (error) {
    console.error("getOrderStatusHistory failed", error);
    return [];
  }
  return data;
}
