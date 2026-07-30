import type { Metadata } from "next";
import { Truck, UserCheck, Package, CheckCircle2, Clock3 } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import {
  getAdminDashboardStats,
  getRecentDrivers,
  getRecentOrders,
  getSuperAdminDashboardStats,
} from "@/lib/queries/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";
import { RecentDriversTable } from "@/components/dashboard/recent-drivers-table";

export const metadata: Metadata = { title: "Dashboard | Driver TMS" };

export default async function AdminDashboardPage() {
  const user = await requireRole("super_admin", "admin");

  if (user.role === "super_admin") {
    const [stats, recentOrders, recentDrivers] = await Promise.all([
      getSuperAdminDashboardStats(),
      getRecentOrders(),
      getRecentDrivers(),
    ]);

    return (
      <div className="space-y-8">
        <h1 className="text-display text-ink">Dashboard</h1>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard label="Total Drivers" value={stats.totalDrivers} icon={Truck} href="/admin/drivers" />
          <StatCard label="Active Drivers" value={stats.activeDrivers} icon={UserCheck} href="/admin/drivers" />
          <StatCard label="Total Orders" value={stats.totalOrders} icon={Package} href="/admin/orders" />
          <StatCard label="Completed Orders" value={stats.completedOrders} icon={CheckCircle2} href="/admin/orders" />
        </div>

        <div className="space-y-4">
          <h2 className="text-h2 text-ink">Recent Orders</h2>
          <RecentOrdersTable orders={recentOrders} />
        </div>

        <div className="space-y-4">
          <h2 className="text-h2 text-ink">Recent Drivers</h2>
          <RecentDriversTable drivers={recentDrivers} />
        </div>
      </div>
    );
  }

  const [stats, recentOrders] = await Promise.all([getAdminDashboardStats(), getRecentOrders()]);

  return (
    <div className="space-y-8">
      <h1 className="text-display text-ink">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Assigned Orders" value={stats.assignedOrders} icon={Package} href="/admin/orders" />
        <StatCard label="Drivers" value={stats.activeDrivers} icon={Truck} href="/admin/drivers" />
        <StatCard label="Pending Deliveries" value={stats.pendingDeliveries} icon={Clock3} href="/admin/orders" />
      </div>

      <div className="space-y-4">
        <h2 className="text-h2 text-ink">Orders</h2>
        <RecentOrdersTable orders={recentOrders} />
      </div>
    </div>
  );
}
