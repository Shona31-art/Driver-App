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
// come from order_status_history where available, but "reached" itself is
// derived from the stage's position relative to the order's current status,
// not from history alone: an order created with a driver already assigned
// goes straight to status "assigned" on insert, which the history trigger
// (an UPDATE-only trigger) never logs a row for -- treating that as
// "not reached" would be wrong for an order that has clearly moved past it.
export function OrderStatusTimeline({ history, currentStatus }: { history: HistoryRow[]; currentStatus: OrderStatus }) {
  const currentIndex = STAGES.findIndex((s) => s.status === currentStatus);

  return (
    <ol className="flex items-start">
      {STAGES.map((stage, index) => {
        const reachedAt = history.find((h) => h.to_status === stage.status)?.changed_at;
        const isReached = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isFirst = index === 0;
        const isLast = index === STAGES.length - 1;

        return (
          <li key={stage.status} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={cn("h-px flex-1", isFirst ? "invisible" : index - 1 < currentIndex ? "bg-brand" : "bg-line")}
              />
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
              <span
                className={cn("h-px flex-1", isLast ? "invisible" : index < currentIndex ? "bg-brand" : "bg-line")}
              />
            </div>
            <div className="mt-2 max-w-20 px-1 text-center sm:max-w-none">
              <p className={cn("text-xs font-medium sm:text-sm", isReached || isCurrent ? "text-ink" : "text-mist")}>
                {stage.label}
              </p>
              {reachedAt ? (
                <p className="font-mono text-[0.65rem] text-slate sm:text-xs">
                  {format(new Date(reachedAt), "dd MMM HH:mm")}
                </p>
              ) : (
                <p className="text-[0.65rem] text-mist sm:text-xs">{isCurrent ? "In progress" : "Pending"}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
