import Link from "next/link";
import { format } from "date-fns";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { OrderStatus } from "@/lib/supabase/types";

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  delivery_date: string;
}

export function PreviousOrdersList({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
        No completed loads yet.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/driver/orders/${order.id}`}
            className="flex items-center justify-between rounded-xl bg-card p-5 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] transition-shadow hover:shadow-md hover:shadow-ink/[0.06]"
          >
            <div>
              <p className="font-mono text-sm text-slate">{order.order_number}</p>
              <p className="text-ink">{order.customer_name}</p>
              <p className="font-mono text-xs text-mist">{format(new Date(order.delivery_date), "dd MMM yyyy")}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
