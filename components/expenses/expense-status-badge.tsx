import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ExpenseStatus = "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "border-transparent bg-warning-tint text-warning" },
  approved: { label: "Approved", className: "border-transparent bg-success-tint text-success" },
  rejected: { label: "Rejected", className: "border-transparent bg-danger-tint text-danger" },
};

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("font-mono text-[0.6875rem] tracking-wide uppercase", config.className)}>
      {config.label}
    </Badge>
  );
}
