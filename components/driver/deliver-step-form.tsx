"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrderRouteMap } from "@/components/orders/order-route-map-loader";
import { markDelivered } from "@/lib/actions/driver-orders";
import { uploadFileDirect } from "@/lib/uploads/upload-file";
import type { UploadedFileMeta } from "@/lib/validations/document";
import type { OrderStatus } from "@/lib/supabase/types";

// Inlined step content (no Dialog) -- same fields/validation/actions as the
// old MarkDeliveredDialog, plus the offload PIN / delivery address / route
// map content that used to sit alongside it directly on the page.
export function DeliverStepForm({
  orderId,
  status,
  offloadPin,
  deliveryAddress,
  deliveryGoogleMapsUrl,
  routeLink,
  pickup,
  delivery,
  endKm,
  onAdvance,
}: {
  orderId: string;
  status: OrderStatus;
  offloadPin: string | null;
  deliveryAddress: string;
  deliveryGoogleMapsUrl: string;
  routeLink: string;
  pickup: { lat: number; lng: number } | null;
  delivery: { lat: number; lng: number } | null;
  endKm: number | null;
  onAdvance: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (status === "assigned" || status === "confirmed") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm text-mist ring-1 ring-ink/8">
        <Lock className="size-4 shrink-0" />
        Complete the Load step first.
      </div>
    );
  }

  async function uploadAll(
    files: File[],
    type: "delivery_document" | "pod",
    label: string,
  ): Promise<UploadedFileMeta[] | null> {
    const results: UploadedFileMeta[] = [];
    for (const [index, file] of files.entries()) {
      setStatusMessage(`Uploading ${label} ${index + 1} of ${files.length}...`);
      const uploaded = await uploadFileDirect("orders", orderId, type, file);
      if (!uploaded.success) {
        toast.error(uploaded.error);
        return null;
      }
      results.push(uploaded.meta);
    }
    return results;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const endKmValue = Number(formData.get("endKm"));
    const notes = (formData.get("notes") as string) || undefined;
    const deliveryFiles = formData.getAll("deliveryDocuments").filter((f): f is File => f instanceof File && f.size > 0);
    const podFiles = formData.getAll("podDocuments").filter((f): f is File => f instanceof File && f.size > 0);

    if (deliveryFiles.length === 0) {
      toast.error("Please upload at least one delivery document.");
      return;
    }
    if (podFiles.length === 0) {
      toast.error("Please upload the completed driver POD.");
      return;
    }

    setIsSubmitting(true);

    const deliveryDocuments = await uploadAll(deliveryFiles, "delivery_document", "delivery document");
    if (!deliveryDocuments) {
      setIsSubmitting(false);
      setStatusMessage(null);
      return;
    }

    const podDocuments = await uploadAll(podFiles, "pod", "POD");
    if (!podDocuments) {
      setIsSubmitting(false);
      setStatusMessage(null);
      return;
    }

    setStatusMessage(null);
    const result = await markDelivered({ orderId, endKm: endKmValue, notes, deliveryDocuments, podDocuments });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Marked as delivered");
    onAdvance();
  }

  return (
    <div className="space-y-4">
      {offloadPin && (
        <div className="rounded-xl border border-accent-tint bg-accent-tint p-4 text-center">
          <p className="text-label text-mist">Offload PIN -- quote this at the delivery point</p>
          <p className="font-mono text-3xl font-semibold tracking-widest text-ink">{offloadPin}</p>
        </div>
      )}

      <div className="space-y-2 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
        <p className="text-label text-mist">Delivery</p>
        <p className="text-sm text-slate">{deliveryAddress}</p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={deliveryGoogleMapsUrl} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
          </Button>
        </div>
      </div>

      {pickup && delivery && (
        <div className="space-y-3 rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03] p-4">
          <h2 className="text-h2 text-ink">Route</h2>
          <OrderRouteMap pickup={pickup} delivery={delivery} className="h-56 overflow-hidden rounded-lg sm:h-72" />
          <Button asChild variant="outline" size="sm">
            <a href={routeLink} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
          </Button>
        </div>
      )}

      {status !== "loaded" ? (
        <div className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm text-slate ring-1 ring-ink/8">
          <CheckCircle2 className="size-4 shrink-0 text-success" />
          Delivered -- End KM: <span className="font-mono text-ink">{endKm}</span>
        </div>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]"
        >
          <p className="text-sm text-slate">
            Thank you, please offload at the delivery address above. Once done, submit your End KM and documents.
          </p>
          <div className="space-y-2">
            <Label htmlFor="endKm">End KM</Label>
            <Input id="endKm" name="endKm" type="number" step="0.1" min="0" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryDocuments">Delivery documents (PDF, JPG, or PNG)</Label>
            <Input
              id="deliveryDocuments"
              name="deliveryDocuments"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              multiple
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="podDocuments">Completed Driver POD</Label>
            <Input
              id="podDocuments"
              name="podDocuments"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              multiple
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {statusMessage && <p className="text-sm text-slate">{statusMessage}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Confirm Delivered
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
