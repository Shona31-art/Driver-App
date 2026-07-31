"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteTruck } from "@/lib/actions/trucks";

// Confirms before a hard, unrecoverable delete. The Server Action itself
// also refuses if the truck has order history (foreign key RESTRICT on
// orders.truck_id), surfaced here as a toast -- mark it inactive instead
// in that case.
export function DeleteTruckDialog({
  truckId,
  registration,
  open,
  onOpenChange,
}: {
  truckId: string;
  registration: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteTruck(truckId);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      onOpenChange(false);
      return;
    }

    toast.success(`${registration} deleted`);
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {registration}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes this truck from the list. This cannot be undone. If it has order history,
            mark it inactive instead of deleting it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
