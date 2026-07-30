import { LayoutDashboard, Users, Package, Truck, Receipt, UserCircle } from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const ADMIN_BASE: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/drivers", label: "Drivers", icon: Truck },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
];

const SUPER_ADMIN_ONLY: NavItem[] = [{ href: "/admin/users", label: "Users", icon: Users }];

const DRIVER_NAV: NavItem[] = [
  { href: "/driver/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/driver/orders", label: "My Orders", icon: Package },
  { href: "/driver/expenses", label: "Expenses", icon: Receipt },
  { href: "/driver/profile", label: "Profile", icon: UserCircle },
];

export function getNavItems(role: UserRole): NavItem[] {
  if (role === "driver") return DRIVER_NAV;
  if (role === "super_admin") return [...ADMIN_BASE, ...SUPER_ADMIN_ONLY];
  return ADMIN_BASE;
}
