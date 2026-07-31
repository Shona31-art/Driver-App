import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getOrderById } from "@/lib/queries/orders";
import { buildMapLinks, buildRouteLink } from "@/lib/utils/map-links";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderWizard } from "@/components/driver/order-wizard";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order | Driver TMS" };

export default async function DriverOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("driver");
  const { id } = await params;

  // RLS already scopes this to the signed-in driver's own order -- a
  // mismatched id resolves to null, same as "not found".
  const order = await getOrderById(id);
  if (!order) notFound();

  const pickupLinks = buildMapLinks({ address: order.pickup_address, lat: order.pickup_lat, lng: order.pickup_lng });
  const deliveryLinks = buildMapLinks({
    address: order.delivery_address,
    lat: order.delivery_lat,
    lng: order.delivery_lng,
  });
  const routeLink = buildRouteLink({
    pickupAddress: order.pickup_address,
    pickupLat: order.pickup_lat,
    pickupLng: order.pickup_lng,
    deliveryAddress: order.delivery_address,
    deliveryLat: order.delivery_lat,
    deliveryLng: order.delivery_lng,
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-slate">{order.order_number}</p>
          <h1 className="text-display text-ink">{order.customer_name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <Button asChild variant="ghost" size="icon" aria-label="Close and return to My Orders">
            <Link href="/driver/orders">
              <X className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <OrderWizard
        order={order}
        pickupGoogleMapsUrl={pickupLinks.googleMaps}
        deliveryGoogleMapsUrl={deliveryLinks.googleMaps}
        routeLink={routeLink}
      />
    </div>
  );
}
