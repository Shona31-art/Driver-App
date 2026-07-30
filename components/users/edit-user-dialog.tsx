"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditUserForm } from "@/components/users/edit-user-form";
import { updateUser } from "@/lib/actions/users";
import type { UpdateUserInput } from "@/lib/validations/user";
import type { UserListRow } from "@/lib/queries/users";

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserListRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: UpdateUserInput) {
    setIsSubmitting(true);
    const result = await updateUser(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("User updated");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <EditUserForm user={user} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}
