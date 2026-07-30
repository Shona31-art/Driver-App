"use client";

import dynamic from "next/dynamic";

// react-leaflet must never be part of the server-rendered pass (it touches
// `window` at import time), so the actual map is only pulled in client-side.
// This wrapper is the one piece that's allowed to call dynamic(..., {ssr:
// false}) -- Next.js only permits that inside a Client Component, not a
// Server Component -- so order detail pages import OrderRouteMap from here
// rather than from order-route-map.tsx directly.
const Map = dynamic(() => import("@/components/orders/order-route-map").then((m) => m.OrderRouteMap), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-canvas" />,
});

export function OrderRouteMap({
  pickup,
  delivery,
  className,
}: {
  pickup: { lat: number; lng: number };
  delivery: { lat: number; lng: number };
  className?: string;
}) {
  return (
    <div className={className}>
      <Map pickup={pickup} delivery={delivery} />
    </div>
  );
}
