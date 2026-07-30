import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getSuperAdminDashboardStats() {
  const supabase = await createClient();

  const [totalDrivers, activeDrivers, totalOrders, completedOrders] = await Promise.all([
    supabase.from("drivers").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "driver").eq("active", true),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
  ]);

  return {
    totalDrivers: totalDrivers.count ?? 0,
    activeDrivers: activeDrivers.count ?? 0,
    totalOrders: totalOrders.count ?? 0,
    completedOrders: completedOrders.count ?? 0,
  };
}

export async function getAdminDashboardStats() {
  const supabase = await createClient();

  const [assignedOrders, activeDrivers, pendingDeliveries] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["assigned", "confirmed", "loaded"]),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "driver").eq("active", true),
    supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["loaded", "delivered"]),
  ]);

  return {
    assignedOrders: assignedOrders.count ?? 0,
    activeDrivers: activeDrivers.count ?? 0,
    pendingDeliveries: pendingDeliveries.count ?? 0,
  };
}

export async function getRecentOrders(limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, status, pickup_date, delivery_date")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentOrders failed", error);
    return [];
  }
  return data;
}

export async function getRecentDrivers(limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("id, full_name, phone, horse_registration, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentDrivers failed", error);
    return [];
  }
  return data;
}
