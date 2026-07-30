import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { formatRoleLabel } from "@/lib/format";
import { getNotifications, getUnreadNotificationCount } from "@/lib/queries/notifications";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("super_admin", "admin");
  const [notifications, unreadCount] = await Promise.all([getNotifications(), getUnreadNotificationCount()]);

  return (
    <DashboardShell
      userName={user.fullName}
      userRoleLabel={formatRoleLabel(user.role)}
      userRole={user.role}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
