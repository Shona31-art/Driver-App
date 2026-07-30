import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseStatusBadge } from "@/components/expenses/expense-status-badge";
import { formatExpenseType } from "@/lib/format-expense";
import type { ExpenseType } from "@/lib/supabase/types";

interface ExpenseRow {
  id: string;
  type: ExpenseType;
  amount: number;
  currency: string;
  expense_date: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
}

export function DriverExpensesList({ expenses }: { expenses: ExpenseRow[] }) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
        You haven&apos;t submitted any expenses yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]">
      <Table>
        <TableHeader>
          <TableRow className="bg-canvas/60 hover:bg-canvas/60">
            <TableHead className="h-11 px-4 text-label text-ink">Type</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Amount</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Date</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="px-4 py-3.5 text-slate">{formatExpenseType(expense.type)}</TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-sm text-slate">
                {expense.currency} {expense.amount.toFixed(2)}
              </TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-sm text-slate">
                {format(new Date(expense.expense_date), "dd MMM yyyy")}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <div className="flex flex-col gap-1">
                  <ExpenseStatusBadge status={expense.status} />
                  {expense.status === "rejected" && expense.rejection_reason && (
                    <span className="text-xs text-slate">{expense.rejection_reason}</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
