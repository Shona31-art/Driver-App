import Image from "next/image";
import { cn } from "@/lib/utils";

// Real logo (provided by the client) -- lives at public/logo.png. The
// source file is a single flattened lockup (mark + wordmark + tagline),
// so it's rendered as one image rather than separate icon/text elements.
// imgClassName controls the rendered size (default suits a compact nav
// header); width/height below are the source's intrinsic dimensions, used
// only so Next can preserve aspect ratio -- actual display size comes from
// imgClassName.
export function BrandMark({ className, imgClassName = "h-9 w-auto" }: { className?: string; imgClassName?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image src="/logo.png" alt="MindRift" width={3692} height={2446} priority className={imgClassName} />
    </div>
  );
}
