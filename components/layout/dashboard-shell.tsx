"use client";

import { useState, type ReactNode } from "react";
import { LogOut, Menu } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNavItems } from "@/components/layout/nav-items";
import { signOut } from "@/lib/actions/auth";
import { NotificationBell, type NotificationRow } from "@/components/layout/notification-bell";
import type { UserRole } from "@/lib/supabase/types";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function DashboardShell({
  userName,
  userRoleLabel,
  userRole,
  notifications,
  unreadCount,
  children,
}: {
  userName: string;
  userRoleLabel: string;
  userRole: UserRole;
  notifications: NotificationRow[];
  unreadCount: number;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Computed client-side, not passed in from the server layout: nav items
  // carry Lucide icon component references, which React can't serialize
  // across the Server -> Client Component boundary. getNavItems has no
  // server-only dependency, so it's safe to call directly in this client
  // component instead.
  const navItems = getNavItems(userRole);

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <BrandMark />
        </div>
        <SidebarNav items={navItems} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 shadow-sm shadow-ink/[0.02] sm:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center border-b border-border px-6">
                <BrandMark />
              </div>
              <SidebarNav items={navItems} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <NotificationBell notifications={notifications} unreadCount={unreadCount} role={userRole === "driver" ? "driver" : userRole} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2.5 px-2" aria-label="Account menu">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-brand-tint text-xs font-semibold text-brand">
                    {initials(userName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-ink sm:inline">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink">{userName}</span>
                  <span className="text-label text-mist">{userRoleLabel}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
