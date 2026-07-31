import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getDriversList } from "@/lib/queries/drivers";
import { getActiveTrucks } from "@/lib/queries/trucks";
import { CreateOrderForm } from "@/components/orders/create-order-form";

export const metadata: Metadata = { title: "New Order | Driver TMS" };

export default async function NewOrderPage() {
  await requireRole("super_admin", "admin");
  const [drivers, trucks] = await Promise.all([getDriversList(), getActiveTrucks()]);
  const activeDrivers = drivers.filter((d) => d.active);

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-display text-ink">New order</h1>
      <CreateOrderForm drivers={activeDrivers} trucks={trucks} />
    </div>
  );
}
