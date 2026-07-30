import Link from "next/link";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { OrderStatus } from "@/lib/supabase/types";

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  pickup_date: string;
  delivery_date: string;
  driver_name: string | null;
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
        No orders yet. Click &quot;New Order&quot; to create the first one.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]">
      <Table>
        <TableHeader>
          <TableRow className="bg-canvas/60 hover:bg-canvas/60">
            <TableHead className="h-11 px-4 text-label text-ink">Order #</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Customer</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Driver</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Pickup</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Delivery</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="px-4 py-3.5 font-mono text-sm">
                <Link href={`/admin/orders/${order.id}`} className="text-slate hover:text-brand hover:underline">
                  {order.order_number}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-slate">{order.customer_name}</TableCell>
              <TableCell className="px-4 py-3.5 text-slate">{order.driver_name ?? "Unassigned"}</TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-sm text-slate">
                {format(new Date(order.pickup_date), "dd MMM yyyy")}
              </TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-sm text-slate">
                {format(new Date(order.delivery_date), "dd MMM yyyy")}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <OrderStatusBadge status={order.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
