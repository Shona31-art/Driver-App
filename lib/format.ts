import type { UserRole } from "@/lib/supabase/types";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  driver: "Driver",
};

export function formatRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}
