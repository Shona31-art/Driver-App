import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getExpensesList } from "@/lib/queries/expenses";
import { ExpensesTable } from "@/components/expenses/expenses-table";

export const metadata: Metadata = { title: "Expenses | Driver TMS" };

export default async function AdminExpensesPage() {
  await requireRole("super_admin", "admin");
  const expenses = await getExpensesList();

  return (
    <div className="space-y-8">
      <h1 className="text-display text-ink">Expenses</h1>
      <ExpensesTable expenses={expenses} />
    </div>
  );
}
