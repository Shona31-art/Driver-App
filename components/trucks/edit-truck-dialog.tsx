"use client";

import { toast } from "sonner";
import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditTruckForm } from "@/components/trucks/edit-truck-form";
import { updateTruck } from "@/lib/actions/trucks";
import type { UpdateTruckInput } from "@/lib/validations/truck";

export function EditTruckDialog({
  truck,
  open,
  onOpenChange,
}: {
  truck: UpdateTruckInput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: UpdateTruckInput) {
    setIsSubmitting(true);
    const result = await updateTruck(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Truck updated");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit truck</DialogTitle>
        </DialogHeader>
        <EditTruckForm truck={truck} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}
