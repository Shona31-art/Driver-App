import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { X } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getOrderById } from "@/lib/queries/orders";
import { getOrderDocuments, getSignedDocumentUrl } from "@/lib/queries/documents";
import { buildMapLinks, buildRouteLink } from "@/lib/utils/map-links";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderDocumentsList } from "@/components/orders/order-documents-list";
import { OrderRouteMap } from "@/components/orders/order-route-map-loader";
import { ConfirmAssignmentButton } from "@/components/driver/confirm-assignment-button";
import { MarkLoadedDialog } from "@/components/driver/mark-loaded-dialog";
import { MarkDeliveredDialog } from "@/components/driver/mark-delivered-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order | Driver TMS" };

export default async function DriverOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("driver");
  const { id } = await params;

  // RLS already scopes this to the signed-in driver's own order -- a
  // mismatched id resolves to null, same as "not found".
  const order = await getOrderById(id);
  if (!order) notFound();

  const documents = await getOrderDocuments(id);
  const documentsWithUrls = await Promise.all(
    documents.map(async (doc) => ({ ...doc, signedUrl: await getSignedDocumentUrl(doc.file_path) })),
  );

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

      <div className="grid grid-cols-2 gap-4 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4 sm:grid-cols-3">
        <div>
          <p className="text-label text-mist">Pickup date</p>
          <p className="font-mono text-slate">{format(new Date(order.pickup_date), "dd MMM yyyy")}</p>
        </div>
        <div>
          <p className="text-label text-mist">Delivery date</p>
          <p className="font-mono text-slate">{format(new Date(order.delivery_date), "dd MMM yyyy")}</p>
        </div>
        <div>
          <p className="text-label text-mist">Weight</p>
          <p className="font-mono text-slate">{order.weight_tons} t</p>
        </div>
        <div>
          <p className="text-label text-mist">Horse</p>
          <p className="font-mono text-slate">{order.horse_registration}</p>
        </div>
        <div>
          <p className="text-label text-mist">Loading #</p>
          <p className="font-mono text-slate">{order.loading_number || "N/A"}</p>
        </div>
        {order.notes && (
          <div className="col-span-2 sm:col-span-3">
            <p className="text-label text-mist">Notes</p>
            <p className="whitespace-pre-wrap text-slate">{order.notes}</p>
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
        <p className="text-label text-mist">Pickup</p>
        <p className="text-sm text-slate">{order.pickup_address}</p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={pickupLinks.googleMaps} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
          </Button>
        </div>
      </div>

      {order.status === "assigned" && (
        <div className="rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
          <p className="mb-3 text-sm text-slate">Please confirm receipt of this assignment.</p>
          <ConfirmAssignmentButton orderId={order.id} />
        </div>
      )}

      {order.status === "confirmed" && (
        <div className="rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
          <p className="mb-3 text-sm text-slate">
            Once you&apos;ve collected the load, tap Loaded and provide your begin KM and loading documents.
          </p>
          <MarkLoadedDialog orderId={order.id} />
        </div>
      )}

      {(order.status === "loaded" || order.status === "delivered" || order.status === "completed") && (
        <>
          {order.offload_pin && (
            <div className="rounded-xl border border-accent-tint bg-accent-tint p-4 text-center">
              <p className="text-label text-mist">Offload PIN -- quote this at the delivery point</p>
              <p className="font-mono text-3xl font-semibold tracking-widest text-ink">{order.offload_pin}</p>
            </div>
          )}

          <div className="space-y-2 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
            <p className="text-label text-mist">Delivery</p>
            <p className="text-sm text-slate">{order.delivery_address}</p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={deliveryLinks.googleMaps} target="_blank" rel="noopener noreferrer">
                  Open in Google Maps
                </a>
              </Button>
            </div>
          </div>

          {order.pickup_lat != null &&
            order.pickup_lng != null &&
            order.delivery_lat != null &&
            order.delivery_lng != null && (
              <div className="space-y-3 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
                <h2 className="text-h2 text-ink">Route</h2>
                <OrderRouteMap
                  pickup={{ lat: order.pickup_lat, lng: order.pickup_lng }}
                  delivery={{ lat: order.delivery_lat, lng: order.delivery_lng }}
                  className="h-56 overflow-hidden rounded-lg sm:h-72"
                />
                <Button asChild variant="outline" size="sm">
                  <a href={routeLink} target="_blank" rel="noopener noreferrer">
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            )}
        </>
      )}

      {order.status === "loaded" && (
        <div className="rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
          <p className="mb-3 text-sm text-slate">
            Thank you, please offload at the delivery address above. Once done, tap Delivered.
          </p>
          <MarkDeliveredDialog orderId={order.id} />
        </div>
      )}

      {(order.status === "delivered" || order.status === "completed") && (
        <div className="space-y-4">
          <h2 className="text-h2 text-ink">Documents</h2>
          <OrderDocumentsList documents={documentsWithUrls} />
        </div>
      )}

      {order.status === "delivered" && (
        <div className="space-y-3 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
          <h2 className="text-h2 text-ink">Log any expenses for this trip</h2>
          <p className="text-sm text-slate">Optional -- log any expenses (e.g. diesel, toll, overnight) on the Expenses page, linked to this order.</p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/driver/expenses?orderId=${order.id}`}>Log an expense for this order</Link>
          </Button>
        </div>
      )}

      {order.status === "completed" && (
        <p className="rounded-xl border border-dashed border-line-strong p-4 text-center text-sm text-slate">
          This order is complete.
        </p>
      )}
    </div>
  );
}
