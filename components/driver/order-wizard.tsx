"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { OrderDocumentsList } from "@/components/orders/order-documents-list";
import { ConfirmAssignmentButton } from "@/components/driver/confirm-assignment-button";
import { LoadStepForm } from "@/components/driver/load-step-form";
import { DeliverStepForm } from "@/components/driver/deliver-step-form";
import type { OrderStatus } from "@/lib/supabase/types";

const STEP_LABELS = ["Overview", "Load", "Deliver", "Documents & Expenses"];

function stepIndexForStatus(status: OrderStatus): number {
  if (status === "assigned") return 0;
  if (status === "confirmed") return 1;
  if (status === "loaded") return 2;
  return 3; // delivered or completed
}

interface WizardOrder {
  id: string;
  status: OrderStatus;
  pickup_date: string;
  delivery_date: string;
  weight_tons: number;
  horse_registration: string;
  loading_number: string | null;
  notes: string | null;
  pickup_address: string;
  delivery_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  begin_km: number | null;
  end_km: number | null;
  offload_pin: string | null;
}

interface HistoryRow {
  id: string;
  from_status: OrderStatus;
  to_status: OrderStatus;
  changed_at: string;
}

interface DocumentRow {
  id: string;
  type: string;
  file_name: string;
  signedUrl: string | null;
}

// One screen per step, Back/Next between them -- separate from the order's
// *actual* lifecycle status (only the step matching that real status ever
// shows a live actionable form; other steps show a locked preview or a
// completed read-only summary). Browsing ahead/behind with Back/Next is
// always allowed, since it's just viewing, not mutating anything.
export function OrderWizard({
  order,
  history,
  documents,
  pickupGoogleMapsUrl,
  deliveryGoogleMapsUrl,
  routeLink,
}: {
  order: WizardOrder;
  history: HistoryRow[];
  documents: DocumentRow[];
  pickupGoogleMapsUrl: string;
  deliveryGoogleMapsUrl: string;
  routeLink: string;
}) {
  const [stepIndex, setStepIndex] = useState(() => stepIndexForStatus(order.status));

  const pickup = order.pickup_lat != null && order.pickup_lng != null ? { lat: order.pickup_lat, lng: order.pickup_lng } : null;
  const delivery =
    order.delivery_lat != null && order.delivery_lng != null ? { lat: order.delivery_lat, lng: order.delivery_lng } : null;

  function goToNextStep() {
    setStepIndex((i) => Math.min(STEP_LABELS.length - 1, i + 1));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card p-4 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]">
        <OrderStatusTimeline history={history} currentStatus={order.status} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-label text-mist">
            Step {stepIndex + 1} of {STEP_LABELS.length}: {STEP_LABELS[stepIndex]}
          </p>
        </div>

        {stepIndex === 0 && (
          <div className="space-y-4">
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
                  <a href={pickupGoogleMapsUrl} target="_blank" rel="noopener noreferrer">
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>

            {order.status === "assigned" && (
              <div className="rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
                <p className="mb-3 text-sm text-slate">Please confirm receipt of this assignment.</p>
                <ConfirmAssignmentButton orderId={order.id} onSuccess={goToNextStep} />
              </div>
            )}
          </div>
        )}

        {stepIndex === 1 && (
          <LoadStepForm orderId={order.id} status={order.status} beginKm={order.begin_km} onAdvance={goToNextStep} />
        )}

        {stepIndex === 2 && (
          <DeliverStepForm
            orderId={order.id}
            status={order.status}
            offloadPin={order.offload_pin}
            deliveryAddress={order.delivery_address}
            deliveryGoogleMapsUrl={deliveryGoogleMapsUrl}
            routeLink={routeLink}
            pickup={pickup}
            delivery={delivery}
            endKm={order.end_km}
            onAdvance={goToNextStep}
          />
        )}

        {stepIndex === 3 && (
          <div className="space-y-4">
            <div className="space-y-3 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
              <h2 className="text-h2 text-ink">Documents</h2>
              <OrderDocumentsList documents={documents} />
            </div>

            {order.status === "delivered" && (
              <div className="space-y-3 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
                <h2 className="text-h2 text-ink">Log any expenses for this trip</h2>
                <p className="text-sm text-slate">
                  Optional -- log any expenses (e.g. diesel, toll, overnight) on the Expenses page, linked to this order.
                </p>
                <Button asChild variant="outline" size="sm">
                  <a href={`/driver/expenses?orderId=${order.id}`}>Log an expense for this order</a>
                </Button>
              </div>
            )}

            {order.status === "completed" && (
              <p className="rounded-xl border border-dashed border-line-strong p-4 text-center text-sm text-slate">
                This order is complete.
              </p>
            )}

            {order.status !== "delivered" && order.status !== "completed" && (
              <div className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm text-mist ring-1 ring-ink/8">
                Documents and expenses become available once the load is delivered.
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button type="button" variant="outline" onClick={goToNextStep} disabled={stepIndex === STEP_LABELS.length - 1}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
