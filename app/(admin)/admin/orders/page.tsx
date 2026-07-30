import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getOrdersList } from "@/lib/queries/orders";
import { OrdersTable } from "@/components/orders/orders-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Orders | Driver TMS" };

export default async function OrdersPage() {
  await requireRole("super_admin", "admin");
  const orders = await getOrdersList();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-display text-ink">Orders</h1>
        <Button asChild>
          <Link href="/admin/orders/new">
            <Plus className="size-4" />
            New Order
          </Link>
        </Button>
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
}
