import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TruckRowActions } from "@/components/trucks/truck-row-actions";
import type { TruckListRow } from "@/lib/queries/trucks";

export function TrucksTable({ trucks, canDelete }: { trucks: TruckListRow[]; canDelete: boolean }) {
  if (trucks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
        No trucks yet. Click &quot;Add Truck&quot; to add your first one.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]">
      <Table>
        <TableHeader>
          <TableRow className="bg-canvas/60 hover:bg-canvas/60">
            <TableHead className="h-11 px-4 text-label text-ink">Horse</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Make / model</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Weight</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Status</TableHead>
            <TableHead className="h-11 w-10 px-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {trucks.map((truck) => (
            <TableRow key={truck.id}>
              <TableCell className="px-4 py-3.5 font-mono text-sm text-slate">{truck.registration}</TableCell>
              <TableCell className="px-4 py-3.5 text-slate">{truck.make_model ?? "—"}</TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-sm text-slate">
                {truck.max_capacity_tons != null ? `${truck.max_capacity_tons} t` : "—"}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <Badge
                  variant="outline"
                  className={
                    truck.active
                      ? "border-transparent bg-success-tint text-success"
                      : "border-transparent bg-danger-tint text-danger"
                  }
                >
                  {truck.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <TruckRowActions truck={truck} canDelete={canDelete} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
