"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notification-actions";

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  read_at: string | null;
  related_order_id: string | null;
  related_expense_id: string | null;
  created_at: string;
}

export function NotificationBell({
  notifications,
  unreadCount,
  role,
}: {
  notifications: NotificationRow[];
  unreadCount: number;
  role: "super_admin" | "admin" | "driver";
}) {
  const router = useRouter();

  async function handleClick(notification: NotificationRow) {
    if (!notification.read_at) {
      await markNotificationRead(notification.id);
    }
    if (notification.related_order_id) {
      router.push(role === "driver" ? `/driver/orders/${notification.related_order_id}` : `/admin/orders/${notification.related_order_id}`);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllNotificationsRead()}
              className="text-xs font-normal text-brand hover:underline"
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="p-3 text-center text-sm text-slate">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleClick(notification)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span className={`text-sm ${notification.read_at ? "text-slate" : "font-medium text-ink"}`}>
                {notification.title}
              </span>
              <span className="text-xs text-mist">{notification.message}</span>
              <span className="text-xs text-mist">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
