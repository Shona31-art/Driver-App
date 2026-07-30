import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getUsersList } from "@/lib/queries/users";
import { UsersTable } from "@/components/users/users-table";

export const metadata: Metadata = { title: "Users | Driver TMS" };

export default async function UsersPage() {
  const user = await requireRole("super_admin");
  const users = await getUsersList();

  return <UsersTable users={users} currentUserId={user.id} />;
}
