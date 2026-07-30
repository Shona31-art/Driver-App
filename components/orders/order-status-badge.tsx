import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/supabase/types";

// Never rely on color alone: label text always accompanies the color.
const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  unassigned: { label: "Unassigned", className: "border-line-strong bg-canvas text-slate" },
  assigned: { label: "Assigned", className: "border-transparent bg-brand-tint text-brand" },
  confirmed: { label: "Confirmed", className: "border-transparent bg-brand-tint text-brand" },
  loaded: { label: "Loaded", className: "border-transparent bg-warning-tint text-warning" },
  delivered: { label: "Delivered", className: "border-transparent bg-warning-tint text-warning" },
  completed: { label: "Completed", className: "border-transparent bg-success-tint text-success" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("font-mono text-[0.6875rem] tracking-wide uppercase", config.className)}>
      {config.label}
    </Badge>
  );
}
