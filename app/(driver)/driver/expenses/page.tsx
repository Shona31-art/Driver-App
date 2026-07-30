import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getDriverExpenses } from "@/lib/queries/expenses";
import { getDriverOrderOptions } from "@/lib/queries/driver-orders";
import { DriverExpensesList } from "@/components/expenses/driver-expenses-list";
import { CreateExpenseDialog } from "@/components/expenses/create-expense-dialog";

export const metadata: Metadata = { title: "Expenses | Driver TMS" };

export default async function DriverExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const user = await requireRole("driver");
  const [{ orderId }, expenses, orders] = await Promise.all([
    searchParams,
    getDriverExpenses(user.id),
    getDriverOrderOptions(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-display text-ink">Expenses</h1>
        <CreateExpenseDialog orders={orders} initialOrderId={orderId} />
      </div>
      <DriverExpensesList expenses={expenses} />
    </div>
  );
}
