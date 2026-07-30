"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { markDelivered } from "@/lib/actions/driver-orders";
import { uploadFileDirect } from "@/lib/uploads/upload-file";
import type { UploadedFileMeta } from "@/lib/validations/document";

export function MarkDeliveredDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
    const endKm = Number(formData.get("endKm"));
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
    const result = await markDelivered({ orderId, endKm, notes, deliveryDocuments, podDocuments });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Marked as delivered");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <PackageCheck className="size-4" />
        Delivered
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark as Delivered</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
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
          <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {statusMessage && <p className="text-sm text-slate">{statusMessage}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Confirm Delivered
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
