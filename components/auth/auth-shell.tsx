import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/brand-mark";

export function AuthShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <BrandMark />
        </div>
        <div className="rounded-xl bg-card p-8 ring-1 ring-ink/8 shadow-md shadow-ink/[0.04] sm:p-10">
          <div className="mb-8 space-y-1.5 text-center">
            <h1 className="text-h2 text-ink">{title}</h1>
            {description && <p className="text-sm text-slate">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
