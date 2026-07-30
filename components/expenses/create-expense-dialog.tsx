"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expenses/expense-form";

export function CreateExpenseDialog({
  orders,
  initialOrderId,
}: {
  orders: { id: string; order_number: string; customer_name: string }[];
  initialOrderId?: string;
}) {
  // Auto-open when arriving via the "Log an expense for this order" link on
  // an order's detail page (?orderId=...), so the driver lands with the
  // form already open and that order pre-selected.
  const [open, setOpen] = useState(() => Boolean(initialOrderId));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Submit Expense
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit expense</DialogTitle>
        </DialogHeader>
        <ExpenseForm orders={orders} initialOrderId={initialOrderId} onSubmitted={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
