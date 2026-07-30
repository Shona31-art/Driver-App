"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditOrderForm } from "@/components/orders/edit-order-form";
import type { UpdateOrderInput } from "@/lib/validations/order";

export function EditOrderDialog({ order }: { order: UpdateOrderInput }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
        Edit
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit order</DialogTitle>
        </DialogHeader>
        <EditOrderForm order={order} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
