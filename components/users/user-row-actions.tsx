"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, KeyRound, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
import { setUserActive, resetUserPassword } from "@/lib/actions/users";
import type { UserListRow } from "@/lib/queries/users";

export function UserRowActions({ user, currentUserId }: { user: UserListRow; currentUserId: string }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isSelf = user.id === currentUserId;

  async function handleToggleActive() {
    const result = await setUserActive(user.id, !user.active);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(user.active ? `${user.full_name} deactivated` : `${user.full_name} activated`);
  }

  async function handleResetPassword() {
    const result = await resetUserPassword(user.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Password reset email sent to ${user.email}`);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.full_name}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetPassword}>
            <KeyRound className="size-4" />
            Reset password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive} disabled={isSelf}>
            {user.active ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
            {user.active ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)} disabled={isSelf}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog user={user} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteUserDialog user={user} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
