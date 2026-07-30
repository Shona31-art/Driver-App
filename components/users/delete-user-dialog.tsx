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
import { deleteUser } from "@/lib/actions/users";
import type { UserListRow } from "@/lib/queries/users";

// Confirms before a hard, unrecoverable delete -- required for any
// destructive action per the standing security rules. The Server Action
// itself will also refuse if the account has order/expense history
// (foreign key RESTRICT), surfaced here as a toast.
export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserListRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteUser(user.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      onOpenChange(false);
      return;
    }

    toast.success(`${user.full_name} deleted`);
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {user.full_name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes their account and sign-in access. This cannot be undone. If they have order or
            expense history, deactivate the account instead of deleting it.
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
