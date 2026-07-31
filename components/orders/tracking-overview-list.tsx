import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import type { TrackingOrderRow } from "@/lib/queries/tracking";

// Shared between the admin and driver Tracking pages -- detailUrlPrefix
// points each order's link at the right role's order detail route.
export function TrackingOverviewList({
  orders,
  detailUrlPrefix,
  showDriverName,
}: {
  orders: TrackingOrderRow[];
  detailUrlPrefix: string;
  showDriverName: boolean;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
        Nothing in progress right now.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`${detailUrlPrefix}/${order.id}`}
                className="font-mono text-sm text-slate hover:text-brand hover:underline"
              >
                {order.order_number}
              </Link>
              <p className="truncate text-ink">{order.customer_name}</p>
              {showDriverName && <p className="text-sm text-mist">{order.driver_name ?? "Unassigned"}</p>}
            </div>
            <OrderStatusBadge status={order.status} className="shrink-0" />
          </div>
          <OrderStatusTimeline history={order.history} currentStatus={order.status} />
        </div>
      ))}
    </div>
  );
}
