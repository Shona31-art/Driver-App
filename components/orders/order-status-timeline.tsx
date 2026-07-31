import { format } from "date-fns";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/supabase/types";

interface HistoryRow {
  id: string;
  from_status: OrderStatus;
  to_status: OrderStatus;
  changed_at: string;
}

const STAGES: { status: OrderStatus; label: string }[] = [
  { status: "assigned", label: "Assigned" },
  { status: "confirmed", label: "Confirmed" },
  { status: "loaded", label: "Loaded" },
  { status: "delivered", label: "Delivered" },
  { status: "completed", label: "Completed" },
];

// Read-only visual progress tracker for the order lifecycle -- used on the
// admin order detail page and at the top of the driver wizard. Timestamps
// come from order_status_history (the to_status column already records
// exactly when each stage was first reached); a stage with no matching
// history entry hasn't happened yet.
export function OrderStatusTimeline({ history, currentStatus }: { history: HistoryRow[]; currentStatus: OrderStatus }) {
  const currentIndex = STAGES.findIndex((s) => s.status === currentStatus);

  return (
    <ol className="space-y-0">
      {STAGES.map((stage, index) => {
        const reachedAt = history.find((h) => h.to_status === stage.status)?.changed_at;
        const isReached = reachedAt != null;
        const isCurrent = index === currentIndex;
        const isLast = index === STAGES.length - 1;

        return (
          <li key={stage.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCurrent
                    ? "bg-brand text-white ring-4 ring-brand-tint"
                    : isReached
                      ? "bg-brand text-white"
                      : "bg-canvas text-mist ring-1 ring-line-strong",
                )}
              >
                {isReached && !isCurrent ? <Check className="size-4" /> : index + 1}
              </span>
              {!isLast && <span className={cn("w-px flex-1 min-h-6", isReached ? "bg-brand" : "bg-line")} />}
            </div>
            <div className="pb-6">
              <p className={cn("text-sm font-medium", isReached || isCurrent ? "text-ink" : "text-mist")}>
                {stage.label}
              </p>
              {reachedAt ? (
                <p className="font-mono text-xs text-slate">{format(new Date(reachedAt), "dd MMM yyyy HH:mm")}</p>
              ) : (
                <p className="text-xs text-mist">{isCurrent ? "In progress" : "Not yet reached"}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
