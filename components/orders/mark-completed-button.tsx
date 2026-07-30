"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { markOrderCompleted } from "@/lib/actions/orders";

export function MarkCompletedButton({ orderId }: { orderId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleComplete() {
    setIsSubmitting(true);
    const result = await markOrderCompleted(orderId);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Order marked as completed");
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>
          <CheckCircle2 className="size-4" />
          Mark Completed
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark this order as completed?</AlertDialogTitle>
          <AlertDialogDescription>
            Confirm the delivery documents and POD have been reviewed. This closes out the order.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleComplete} disabled={isSubmitting}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
