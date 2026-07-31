import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { X } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getOrderById, getOrderStatusHistory } from "@/lib/queries/orders";
import { getOrderDocuments, getSignedDocumentUrl } from "@/lib/queries/documents";
import { getDriversList } from "@/lib/queries/drivers";
import { buildMapLinks, buildRouteLink } from "@/lib/utils/map-links";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { EditOrderDialog } from "@/components/orders/edit-order-dialog";
import { AssignDriverDialog } from "@/components/orders/assign-driver-dialog";
import { MarkCompletedButton } from "@/components/orders/mark-completed-button";
import { DeleteOrderDialog } from "@/components/orders/delete-order-dialog";
import { OrderDocumentsList } from "@/components/orders/order-documents-list";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { OrderRouteMap } from "@/components/orders/order-route-map-loader";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order | Driver TMS" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("super_admin", "admin");
  const { id } = await params;

  const order = await getOrderById(id);
  if (!order) notFound();

  const [drivers, documents, history] = await Promise.all([
    getDriversList(),
    getOrderDocuments(id),
    getOrderStatusHistory(id),
  ]);

  const documentsWithUrls = await Promise.all(
    documents.map(async (doc) => ({ ...doc, signedUrl: await getSignedDocumentUrl(doc.file_path) })),
  );

  const activeDrivers = drivers.filter((d) => d.active);
  const currentDriver = order.driver_id ? drivers.find((d) => d.id === order.driver_id) : undefined;

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
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-slate">{order.order_number}</p>
          <h1 className="text-display text-ink">{order.customer_name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <Button asChild variant="ghost" size="icon" aria-label="Close and return to Orders">
            <Link href="/admin/orders">
              <X className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <EditOrderDialog
          order={{
            id: order.id,
            customerName: order.customer_name,
            pickupAddress: order.pickup_address,
            deliveryAddress: order.delivery_address,
            pickupDate: order.pickup_date,
            deliveryDate: order.delivery_date,
            weightTons: order.weight_tons,
            horseRegistration: order.horse_registration,
            loadingNumber: order.loading_number ?? "",
            notes: order.notes ?? "",
          }}
        />
        <AssignDriverDialog
          orderId={order.id}
          currentDriverId={order.driver_id}
          drivers={activeDrivers}
          label={order.driver_id ? "Reassign driver" : "Assign driver"}
        />
        {order.status === "delivered" && <MarkCompletedButton orderId={order.id} />}
        {user.role === "super_admin" && <DeleteOrderDialog orderId={order.id} orderNumber={order.order_number} />}
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4 sm:grid-cols-2">
        <div>
          <p className="text-label text-mist">Driver</p>
          <p className="text-slate">{currentDriver?.full_name ?? "Unassigned"}</p>
        </div>
        <div>
          <p className="text-label text-mist">Horse registration</p>
          <p className="font-mono text-slate">{order.horse_registration}</p>
        </div>
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
          <p className="text-label text-mist">Loading number</p>
          <p className="font-mono text-slate">{order.loading_number || "—"}</p>
        </div>
        {order.begin_km != null && (
          <div>
            <p className="text-label text-mist">Begin KM</p>
            <p className="font-mono text-slate">{order.begin_km}</p>
          </div>
        )}
        {order.end_km != null && (
          <div>
            <p className="text-label text-mist">End KM</p>
            <p className="font-mono text-slate">{order.end_km}</p>
          </div>
        )}
        {order.offload_pin && (
          <div>
            <p className="text-label text-mist">Offload PIN</p>
            <p className="font-mono text-lg text-slate">{order.offload_pin}</p>
          </div>
        )}
        {order.notes && (
          <div className="sm:col-span-2">
            <p className="text-label text-mist">Notes</p>
            <p className="whitespace-pre-wrap text-slate">{order.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>

      {order.pickup_lat != null && order.pickup_lng != null && order.delivery_lat != null && order.delivery_lng != null && (
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

      <div className="space-y-4">
        <h2 className="text-h2 text-ink">Documents</h2>
        <OrderDocumentsList documents={documentsWithUrls} />
      </div>

      <div className="space-y-4">
        <h2 className="text-h2 text-ink">Status history</h2>
        <OrderStatusTimeline history={history} currentStatus={order.status} />
      </div>
    </div>
  );
}
