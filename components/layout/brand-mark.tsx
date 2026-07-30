import { cn } from "@/lib/utils";

// PLACEHOLDER MARK -- no real logo file has been provided yet (confirmed
// with the client at Phase 3 kickoff: proceed with a placeholder, flag
// again before anything ships as final). This is an inline SVG abstract
// aperture/iris glyph standing in for a real mark. Swap for an <Image> of
// the real logo the moment one is provided; do not let this quietly
// survive to a production deploy.
export function BrandMark({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand shadow-sm shadow-brand/30"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="12" y1="4" x2="12" y2="8" transform="rotate(0 12 12)" />
          <line x1="12" y1="4" x2="12" y2="8" transform="rotate(60 12 12)" />
          <line x1="12" y1="4" x2="12" y2="8" transform="rotate(120 12 12)" />
          <line x1="12" y1="4" x2="12" y2="8" transform="rotate(180 12 12)" />
          <line x1="12" y1="4" x2="12" y2="8" transform="rotate(240 12 12)" />
          <line x1="12" y1="4" x2="12" y2="8" transform="rotate(300 12 12)" />
        </svg>
      </div>
      {showWordmark && <span className="text-h2 tracking-tight text-ink">Driver TMS</span>}
    </div>
  );
}
