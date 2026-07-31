import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getTrucksList } from "@/lib/queries/trucks";
import { TrucksTable } from "@/components/trucks/trucks-table";
import { CreateTruckDialog } from "@/components/trucks/create-truck-dialog";

export const metadata: Metadata = { title: "Trucks | Driver TMS" };

export default async function TrucksPage() {
  const user = await requireRole("super_admin", "admin");
  const trucks = await getTrucksList();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-display text-ink">Trucks</h1>
        <CreateTruckDialog />
      </div>
      <TrucksTable trucks={trucks} canDelete={user.role === "super_admin"} />
    </div>
  );
}
