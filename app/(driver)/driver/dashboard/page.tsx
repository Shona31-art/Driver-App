import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Package, CheckCircle2, Bell, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getDriverDashboardData } from "@/lib/queries/driver-dashboard";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export const metadata: Metadata = { title: "Dashboard | Driver TMS" };

export default async function DriverDashboardPage() {
  const user = await requireRole("driver");
  const [{ currentLoad, completedLoadsCount }, unreadCount] = await Promise.all([
    getDriverDashboardData(user.id),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-display text-ink">Welcome, {user.fullName.split(" ")[0]}</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          label="Current Load"
          value={currentLoad ? currentLoad.order_number : "None"}
          icon={Package}
          href={currentLoad ? `/driver/orders/${currentLoad.id}` : undefined}
        />
        <StatCard label="Completed Loads" value={completedLoadsCount} icon={CheckCircle2} href="/driver/orders" />
        <StatCard label="Notifications" value={unreadCount} icon={Bell} />
      </div>

      <div className="space-y-4">
        <h2 className="text-h2 text-ink">Current Load</h2>
        {currentLoad ? (
          <Link
            href={`/driver/orders/${currentLoad.id}`}
            className="block rounded-xl bg-card p-5 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] transition-shadow hover:shadow-md hover:shadow-ink/[0.06]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-sm text-slate">{currentLoad.order_number}</p>
                <p className="truncate text-ink">{currentLoad.customer_name}</p>
              </div>
              <OrderStatusBadge status={currentLoad.status} className="shrink-0" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-label text-mist">Pickup</p>
                <p className="font-mono text-slate">{format(new Date(currentLoad.pickup_date), "dd MMM yyyy")}</p>
              </div>
              <div>
                <p className="text-label text-mist">Delivery</p>
                <p className="font-mono text-slate">{format(new Date(currentLoad.delivery_date), "dd MMM yyyy")}</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1 text-sm text-brand">
              Open order <ArrowRight className="size-3.5" />
            </p>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
            You have no active load right now.
          </div>
        )}
      </div>
    </div>
  );
}
