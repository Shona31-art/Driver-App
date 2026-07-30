import type { ExpenseType } from "@/lib/supabase/types";

const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  tfn: "TFN",
  diesel: "Diesel",
  overnight: "Overnight",
  truck_wash: "Truck Wash",
  oil: "Oil",
};

export function formatExpenseType(type: ExpenseType): string {
  return EXPENSE_TYPE_LABELS[type];
}
