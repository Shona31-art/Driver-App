import { cn } from "@/lib/utils";

// Plain text wordmark -- no logo. The MindRift mark that was here briefly
// was removed at the client's request: this isn't officially MindRift's
// system, so it shouldn't carry their branding. Revisit if/when a real
// logo for this system specifically is provided.
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <span className="text-h2 tracking-tight text-ink">Driver TMS</span>
    </div>
  );
}
