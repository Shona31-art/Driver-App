import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/supabase/types";

export interface TrackingOrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  driver_name: string | null;
  history: { id: string; from_status: OrderStatus; to_status: OrderStatus; changed_at: string }[];
}

// Batches the order_status_history fetch for every order in one query
// (rather than one query per order) and groups it back up in JS -- same
// N+1-avoidance pattern used for driver-name lookups elsewhere in this app.
async function attachHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orders: { id: string }[],
): Promise<Map<string, TrackingOrderRow["history"]>> {
  if (orders.length === 0) return new Map();

  const { data: history } = await supabase
    .from("order_status_history")
    .select("id, order_id, from_status, to_status, changed_at")
    .in(
      "order_id",
      orders.map((o) => o.id),
    )
    .order("changed_at", { ascending: true });

  const byOrderId = new Map<string, TrackingOrderRow["history"]>();
  for (const entry of history ?? []) {
    const existing = byOrderId.get(entry.order_id) ?? [];
    existing.push(entry);
    byOrderId.set(entry.order_id, existing);
  }
  return byOrderId;
}

// Admin/Super Admin: every order still in progress (completed orders are
// done tracking, so they're left off this page -- still visible on the
// main Orders list for historical/reporting purposes).
export async function getAdminTrackingOverview(): Promise<TrackingOrderRow[]> {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, status, driver_id")
    .neq("status", "completed")
    .order("created_at", { ascending: false });

  if (error || !orders) {
    console.error("getAdminTrackingOverview failed", error);
    return [];
  }

  const driverIds = [...new Set(orders.map((o) => o.driver_id).filter((id): id is string => !!id))];
  let driversById = new Map<string, string>();
  if (driverIds.length > 0) {
    const { data: drivers } = await supabase.from("drivers").select("id, full_name").in("id", driverIds);
    driversById = new Map((drivers ?? []).map((d) => [d.id, d.full_name]));
  }

  const historyByOrderId = await attachHistory(supabase, orders);

  return orders.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    status: order.status,
    driver_name: order.driver_id ? (driversById.get(order.driver_id) ?? null) : null,
    history: historyByOrderId.get(order.id) ?? [],
  }));
}

// Driver: their own in-progress orders only (RLS would already scope this,
// this filter just also matches the "completed" cutoff used above).
export async function getDriverTrackingOverview(userId: string): Promise<TrackingOrderRow[]> {
  const supabase = await createClient();

  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).single();
  if (!driver) return [];

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, status")
    .eq("driver_id", driver.id)
    .neq("status", "completed")
    .order("created_at", { ascending: false });

  if (error || !orders) {
    console.error("getDriverTrackingOverview failed", error);
    return [];
  }

  const historyByOrderId = await attachHistory(supabase, orders);

  return orders.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    status: order.status,
    driver_name: null,
    history: historyByOrderId.get(order.id) ?? [],
  }));
}
