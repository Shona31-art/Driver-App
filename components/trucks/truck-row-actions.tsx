"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditTruckDialog } from "@/components/trucks/edit-truck-dialog";
import { DeleteTruckDialog } from "@/components/trucks/delete-truck-dialog";
import type { TruckListRow } from "@/lib/queries/trucks";

// Delete is Super Admin only, same tier as deleting an order -- canDelete
// is computed server-side from the acting user's role, never trusted from
// the client.
export function TruckRowActions({ truck, canDelete }: { truck: TruckListRow; canDelete: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${truck.registration}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTruckDialog
        truck={{
          id: truck.id,
          registration: truck.registration,
          makeModel: truck.make_model ?? "",
          maxCapacityTons: truck.max_capacity_tons ?? undefined,
          active: truck.active,
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteTruckDialog
        truckId={truck.id}
        registration={truck.registration}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
