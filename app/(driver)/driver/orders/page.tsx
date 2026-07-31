import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getDriverCurrentOrder, getDriverPreviousOrders } from "@/lib/queries/driver-orders";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PreviousOrdersList } from "@/components/driver/previous-orders-list";

export const metadata: Metadata = { title: "My Orders | Driver TMS" };

export default async function DriverOrdersPage() {
  const user = await requireRole("driver");
  const [currentOrder, previousOrders] = await Promise.all([
    getDriverCurrentOrder(user.id),
    getDriverPreviousOrders(user.id),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-display text-ink">My Orders</h1>

      <div className="space-y-4">
        <h2 className="text-h2 text-ink">Current Order</h2>
        {currentOrder ? (
          <Link
            href={`/driver/orders/${currentOrder.id}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-card p-5 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] transition-shadow hover:shadow-md hover:shadow-ink/[0.06]"
          >
            <div className="min-w-0">
              <p className="font-mono text-sm text-slate">{currentOrder.order_number}</p>
              <p className="truncate text-ink">{currentOrder.customer_name}</p>
            </div>
            <OrderStatusBadge status={currentOrder.status} className="shrink-0" />
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
            You have no active load right now.
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-h2 text-ink">Previous Orders</h2>
        <PreviousOrdersList orders={previousOrders} />
      </div>
    </div>
  );
}
