import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RecentDriver {
  id: string;
  full_name: string;
  phone: string | null;
}

export function RecentDriversTable({ drivers }: { drivers: RecentDriver[] }) {
  if (drivers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
        No drivers yet. Add one from the Users page.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]">
      <Table>
        <TableHeader>
          <TableRow className="bg-canvas/60 hover:bg-canvas/60">
            <TableHead className="h-11 px-4 text-label text-ink">Name</TableHead>
            <TableHead className="h-11 px-4 text-label text-ink">Phone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell className="px-4 py-3.5 text-slate">{driver.full_name}</TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-sm text-slate">{driver.phone ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
