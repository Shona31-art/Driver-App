"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

function endpointIcon(label: string) {
  return L.divIcon({
    className: "",
    html: `<span class="flex size-6 items-center justify-center rounded-full border-2 border-white bg-brand text-[10px] font-semibold text-white shadow-[0_1px_4px_rgba(0,0,0,0.35)]">${label}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Zooms/pans to fit both endpoints (and the route line, once it loads)
// instead of leaving the map at a fixed zoom centered on one point.
function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
  }, [map, points]);
  return null;
}

// Only ever rendered client-side via order-route-map-loader.tsx's dynamic
// import (ssr: false) -- react-leaflet touches `window` at import time,
// which crashes during Next.js's server render of the page.
export function OrderRouteMap({
  pickup,
  delivery,
}: {
  pickup: { lat: number; lng: number };
  delivery: { lat: number; lng: number };
}) {
  const [route, setRoute] = useState<LatLngExpression[] | null>(null);
  const [routeFailed, setRouteFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // OSRM's free public routing demo -- no API key, but it's a shared
    // third-party service with no uptime guarantee. If it's unreachable or
    // returns nothing usable, fall back to a straight line rather than
    // leaving the driver with no route context at all.
    async function fetchRoute() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("route request failed");
        const data = await res.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
        if (cancelled) return;
        if (coords?.length) {
          setRoute(coords.map(([lng, lat]) => [lat, lng] as LatLngExpression));
        } else {
          setRouteFailed(true);
        }
      } catch {
        if (!cancelled) setRouteFailed(true);
      }
    }

    fetchRoute();
    return () => {
      cancelled = true;
    };
  }, [pickup.lat, pickup.lng, delivery.lat, delivery.lng]);

  const pickupPos: LatLngExpression = [pickup.lat, pickup.lng];
  const deliveryPos: LatLngExpression = [delivery.lat, delivery.lng];
  const linePoints = route ?? (routeFailed ? [pickupPos, deliveryPos] : null);

  return (
    <MapContainer center={pickupPos} zoom={7} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={pickupPos} icon={endpointIcon("A")} />
      <Marker position={deliveryPos} icon={endpointIcon("B")} />
      {linePoints && (
        <>
          <Polyline positions={linePoints} pathOptions={{ color: "var(--brand-blue)", weight: 4, opacity: 0.8 }} />
          <FitBounds points={linePoints} />
        </>
      )}
    </MapContainer>
  );
}
