import type { ComponentType } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// When `href` is given, the whole card is a link to the page that explains
// the number (e.g. "Total Drivers" -> /admin/drivers) -- omit it for
// figures with no corresponding page to drill into (e.g. a notification
// count with no dedicated list view).
export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  className,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  className?: string;
}) {
  const classes = cn(
    "relative block overflow-hidden rounded-xl bg-card p-5 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] transition-shadow hover:shadow-md hover:shadow-ink/[0.06] motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform sm:p-6",
    href && "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    className,
  );

  const content = (
    <>
      <span className="absolute inset-x-0 top-0 h-1 bg-brand" aria-hidden="true" />
      <div className="flex items-center justify-between">
        <span className="text-label text-mist">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-tint">
          <Icon className="size-4 text-brand" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-ink">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
