"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markLoaded } from "@/lib/actions/driver-orders";
import { uploadFileDirect } from "@/lib/uploads/upload-file";
import type { UploadedFileMeta } from "@/lib/validations/document";
import type { OrderStatus } from "@/lib/supabase/types";

// Inlined step content (no Dialog) -- same fields/validation/actions as the
// old MarkLoadedDialog, just rendered directly as the wizard's "Load" step
// rather than behind a modal trigger.
export function LoadStepForm({
  orderId,
  status,
  beginKm,
  onAdvance,
}: {
  orderId: string;
  status: OrderStatus;
  beginKm: number | null;
  onAdvance: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (status === "assigned") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm text-mist ring-1 ring-ink/8">
        <Lock className="size-4 shrink-0" />
        Complete the Confirm step first.
      </div>
    );
  }

  if (status !== "confirmed") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm text-slate ring-1 ring-ink/8">
        <CheckCircle2 className="size-4 shrink-0 text-success" />
        Loaded -- Begin KM: <span className="font-mono text-ink">{beginKm}</span>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const beginKmValue = Number(formData.get("beginKm"));
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
    const result = await markLoaded({ orderId, beginKm: beginKmValue, loadingDocuments });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Marked as loaded -- offload PIN generated");
    onAdvance();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]">
      <p className="text-sm text-slate">Once you&apos;ve collected the load, provide your begin KM and loading documents.</p>
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
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {statusMessage && <p className="text-sm text-slate">{statusMessage}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Confirm Loaded
        </Button>
      </div>
    </form>
  );
}
