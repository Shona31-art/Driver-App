"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { confirmAssignment } from "@/lib/actions/driver-orders";

export function ConfirmAssignmentButton({ orderId }: { orderId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    const result = await confirmAssignment(orderId);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Assignment confirmed");
  }

  return (
    <Button onClick={handleConfirm} disabled={isSubmitting}>
      {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
      Confirm Assignment
    </Button>
  );
}
