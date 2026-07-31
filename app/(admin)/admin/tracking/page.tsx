import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getAdminTrackingOverview } from "@/lib/queries/tracking";
import { TrackingOverviewList } from "@/components/orders/tracking-overview-list";

export const metadata: Metadata = { title: "Tracking | Driver TMS" };

export default async function AdminTrackingPage() {
  await requireRole("super_admin", "admin");
  const orders = await getAdminTrackingOverview();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display text-ink">Tracking</h1>
        <p className="mt-1 text-sm text-slate">Every order still in progress, with its live status history.</p>
      </div>
      <TrackingOverviewList orders={orders} detailUrlPrefix="/admin/orders" showDriverName />
    </div>
  );
}
