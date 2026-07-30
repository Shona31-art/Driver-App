import { format } from "date-fns";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { OrderStatus } from "@/lib/supabase/types";

interface HistoryRow {
  id: string;
  from_status: OrderStatus;
  to_status: OrderStatus;
  changed_at: string;
}

export function OrderStatusTimeline({ history }: { history: HistoryRow[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate">No status changes yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {history.map((entry) => (
        <li key={entry.id} className="flex items-center gap-2 text-sm">
          <span className="font-mono text-xs text-mist">{format(new Date(entry.changed_at), "dd MMM yyyy HH:mm")}</span>
          <OrderStatusBadge status={entry.to_status} />
        </li>
      ))}
    </ol>
  );
}
