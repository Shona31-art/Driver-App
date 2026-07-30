"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { markLoaded } from "@/lib/actions/driver-orders";
import { uploadFileDirect } from "@/lib/uploads/upload-file";
import type { UploadedFileMeta } from "@/lib/validations/document";

export function MarkLoadedDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const beginKm = Number(formData.get("beginKm"));
    const files = formData.getAll("loadingDocuments").filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      toast.error("Please upload at least one loading document.");
      return;
    }

    setIsSubmitting(true);

    const loadingDocuments: UploadedFileMeta[] = [];
    for (const [index, file] of files.entries()) {
      setStatusMessage(`Uploading document ${index + 1} of ${files.length}...`);
      const uploaded = await uploadFileDirect("orders", orderId, "loading_document", file);
      if (!uploaded.success) {
        setIsSubmitting(false);
        setStatusMessage(null);
        toast.error(uploaded.error);
        return;
      }
      loadingDocuments.push(uploaded.meta);
    }

    setStatusMessage(null);
    const result = await markLoaded({ orderId, beginKm, loadingDocuments });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Marked as loaded -- offload PIN generated");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Package className="size-4" />
        Loaded
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Loaded</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
          <div className="space-y-2">
            <Label htmlFor="beginKm">Begin KM</Label>
            <Input id="beginKm" name="beginKm" type="number" step="0.1" min="0" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loadingDocuments">Loading documents (PDF, JPG, or PNG)</Label>
            <Input
              id="loadingDocuments"
              name="loadingDocuments"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              multiple
              required
            />
          </div>
          <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {statusMessage && <p className="text-sm text-slate">{statusMessage}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Confirm Loaded
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
