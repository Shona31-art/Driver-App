"use client";

import { useState } from "react";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignDriver } from "@/lib/actions/orders";

export function AssignDriverDialog({
  orderId,
  currentDriverId,
  drivers,
  label,
}: {
  orderId: string;
  currentDriverId: string | null;
  drivers: { id: string; full_name: string }[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(currentDriverId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAssign() {
    if (!selected) {
      toast.error("Please select a driver.");
      return;
    }

    setIsSubmitting(true);
    const result = await assignDriver({ orderId, driverId: selected });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Driver assigned");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Truck className="size-4" />
        {label}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>

        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button onClick={handleAssign} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
