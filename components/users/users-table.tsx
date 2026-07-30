"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { UserRowActions } from "@/components/users/user-row-actions";
import { formatRoleLabel } from "@/lib/format";
import type { UserListRow } from "@/lib/queries/users";

export function UsersTable({ users, currentUserId }: { users: UserListRow[]; currentUserId: string }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-display text-ink">Users</h1>
        <CreateUserDialog />
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
          No users yet. Click &quot;Add User&quot; to invite your first Admin or Driver.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]">
          <Table>
            <TableHeader>
              <TableRow className="bg-canvas/60 hover:bg-canvas/60">
                <TableHead className="h-11 px-4 text-label text-ink">Name</TableHead>
                <TableHead className="h-11 px-4 text-label text-ink">Email</TableHead>
                <TableHead className="h-11 px-4 text-label text-ink">Role</TableHead>
                <TableHead className="h-11 px-4 text-label text-ink">Status</TableHead>
                <TableHead className="h-11 px-4 text-label text-ink">Created</TableHead>
                <TableHead className="h-11 w-10 px-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-3.5 text-slate">{user.full_name}</TableCell>
                  <TableCell className="px-4 py-3.5 text-slate">{user.email}</TableCell>
                  <TableCell className="px-4 py-3.5 text-slate">{formatRoleLabel(user.role)}</TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Badge
                      variant="outline"
                      className={
                        user.active
                          ? "border-transparent bg-success-tint text-success"
                          : "border-transparent bg-danger-tint text-danger"
                      }
                    >
                      {user.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 font-mono text-sm text-slate">
                    {format(new Date(user.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <UserRowActions user={user} currentUserId={currentUserId} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
