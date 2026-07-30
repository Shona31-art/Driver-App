import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getExpensesList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, driver_id, order_id, type, amount, currency, expense_date, status, notes, rejection_reason")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getExpensesList failed", error);
    return [];
  }

  const driverIds = [...new Set(data.map((e) => e.driver_id))];
  let driversById = new Map<string, string>();
  if (driverIds.length > 0) {
    const { data: drivers } = await supabase.from("drivers").select("id, full_name").in("id", driverIds);
    driversById = new Map((drivers ?? []).map((d) => [d.id, d.full_name]));
  }

  return data.map((expense) => ({ ...expense, driver_name: driversById.get(expense.driver_id) ?? "Unknown" }));
}

export async function getDriverExpenses(userId: string) {
  const supabase = await createClient();
  const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).single();
  if (!driver) return [];

  const { data, error } = await supabase
    .from("expenses")
    .select("id, type, amount, currency, expense_date, status, notes, rejection_reason, order_id")
    .eq("driver_id", driver.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getDriverExpenses failed", error);
    return [];
  }
  return data;
}
