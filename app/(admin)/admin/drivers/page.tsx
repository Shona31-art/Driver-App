import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getDriversList } from "@/lib/queries/drivers";
import { DriversTable } from "@/components/drivers/drivers-table";

export const metadata: Metadata = { title: "Drivers | Driver TMS" };

export default async function DriversPage() {
  await requireRole("super_admin", "admin");
  const drivers = await getDriversList();

  return (
    <div className="space-y-8">
      <h1 className="text-display text-ink">Drivers</h1>
      <p className="text-sm text-slate">
        View-only. To add, edit, or deactivate a driver, use the Users page.
      </p>
      <DriversTable drivers={drivers} />
    </div>
  );
}
