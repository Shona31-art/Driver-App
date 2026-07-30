"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { reviewExpense } from "@/lib/actions/expenses";

export function ExpenseReviewActions({ expenseId }: { expenseId: string }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApprove() {
    setIsSubmitting(true);
    const result = await reviewExpense({ expenseId, decision: "approved" });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Expense approved");
  }

  async function handleReject() {
    setIsSubmitting(true);
    const result = await reviewExpense({ expenseId, decision: "rejected", rejectionReason: reason });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Expense rejected");
    setRejectOpen(false);
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleApprove} disabled={isSubmitting}>
        <Check className="size-4" />
        Approve
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} disabled={isSubmitting}>
          <X className="size-4" />
          Reject
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject expense</DialogTitle>
            <DialogDescription>Let the driver know why this expense was rejected.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting || !reason.trim()}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
