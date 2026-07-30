"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExpenseDraft, attachExpenseReceipt } from "@/lib/actions/expenses";
import { uploadFileDirect } from "@/lib/uploads/upload-file";

const EXPENSE_TYPES = [
  { value: "tfn", label: "TFN" },
  { value: "diesel", label: "Diesel" },
  { value: "overnight", label: "Overnight" },
  { value: "truck_wash", label: "Truck Wash" },
  { value: "oil", label: "Oil" },
];

type ExpenseLineItem = {
  id: string;
  type: string;
  amount: string;
  receiptFile: File | null;
};

function newLineItem(id: string): ExpenseLineItem {
  return { id, type: "diesel", amount: "", receiptFile: null };
}

// Fixed rather than crypto.randomUUID() -- this is the id embedded in the
// very first render, which happens once on the server and once again on
// the client during hydration. A random value would differ between the
// two and React would flag a hydration mismatch. Items added later via
// the "Add another expense" button are a client-only interaction (never
// part of the server-rendered pass), so a random id there is safe.
const FIRST_ITEM_ID = "expense-line-0";

// Submitted from the standalone Expenses page -- the driver can optionally
// link the expense to one of their own orders (by order number) rather
// than it always being tied to whichever order they happened to be
// viewing, per the Phase 2 decision to keep expense logging on one screen.
//
// A driver can log more than one expense type in a single submission (e.g.
// diesel + toll from the same trip) -- each type gets its own amount and
// receipt and becomes its own expense row, so admins can review/approve
// each independently. Date, notes, and the linked order are shared across
// the whole submission since they describe the one trip, not a single line
// item.
export function ExpenseForm({
  orders,
  initialOrderId,
  onSubmitted,
}: {
  orders: { id: string; order_number: string; customer_name: string }[];
  initialOrderId?: string;
  onSubmitted?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [items, setItems] = useState<ExpenseLineItem[]>([newLineItem(FIRST_ITEM_ID)]);
  const [orderId, setOrderId] = useState(initialOrderId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function updateItem(id: string, patch: Partial<ExpenseLineItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    for (const item of items) {
      if (!item.amount || Number(item.amount) <= 0) {
        toast.error("Enter an amount for each expense.");
        return;
      }
      if (!item.receiptFile) {
        toast.error("Please upload a receipt for each expense.");
        return;
      }
    }

    const formData = new FormData(formRef.current);
    const expenseDate = formData.get("expenseDate") as string;
    const notes = (formData.get("notes") as string) || undefined;

    setIsSubmitting(true);

    for (const [index, item] of items.entries()) {
      setStatusMessage(items.length > 1 ? `Submitting expense ${index + 1} of ${items.length}...` : "Submitting...");

      const draft = await createExpenseDraft({
        type: item.type,
        amount: Number(item.amount),
        expenseDate,
        notes,
        orderId,
      });
      if (!draft.success) {
        setIsSubmitting(false);
        setStatusMessage(null);
        toast.error(draft.error);
        return;
      }

      const uploaded = await uploadFileDirect("expenses", draft.expenseId, "receipt", item.receiptFile as File);
      if (!uploaded.success) {
        setIsSubmitting(false);
        setStatusMessage(null);
        toast.error(uploaded.error);
        return;
      }

      const result = await attachExpenseReceipt({ expenseId: draft.expenseId, receipt: uploaded.meta });
      if (!result.success) {
        setIsSubmitting(false);
        setStatusMessage(null);
        toast.error(result.error);
        return;
      }
    }

    setIsSubmitting(false);
    setStatusMessage(null);
    toast.success(items.length > 1 ? `${items.length} expenses submitted` : "Expense submitted");
    formRef.current.reset();
    setItems([newLineItem(FIRST_ITEM_ID)]);
    setOrderId("");
    onSubmitted?.();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="orderId">Order (optional)</Label>
        <Select value={orderId || "none"} onValueChange={(value) => setOrderId(value === "none" ? "" : value)}>
          <SelectTrigger id="orderId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not linked to a specific order</SelectItem>
            {orders.map((order) => (
              <SelectItem key={order.id} value={order.id}>
                {order.order_number} — {order.customer_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-xl border border-line p-3">
            {items.length > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-label text-mist">Expense {index + 1}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                  <X className="size-4" />
                  Remove
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`type-${item.id}`}>Type</Label>
              <Select value={item.type} onValueChange={(value) => updateItem(item.id, { type: value })}>
                <SelectTrigger id={`type-${item.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`amount-${item.id}`}>Amount (ZAR)</Label>
              <Input
                id={`amount-${item.id}`}
                type="number"
                step="0.01"
                min="0"
                value={item.amount}
                onChange={(event) => updateItem(item.id, { amount: event.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`receipt-${item.id}`}>Upload slip</Label>
              <Input
                id={`receipt-${item.id}`}
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(event) => updateItem(item.id, { receiptFile: event.target.files?.[0] ?? null })}
                required
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setItems((prev) => [...prev, newLineItem(crypto.randomUUID())])}
        >
          <Plus className="size-4" />
          Add another expense
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expenseDate">Date</Label>
        <Input id="expenseDate" name="expenseDate" type="date" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {statusMessage && <p className="text-sm text-slate">{statusMessage}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {items.length > 1 ? "Submit expenses" : "Submit expense"}
        </Button>
      </div>
    </form>
  );
}
