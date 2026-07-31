import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getDriverTrackingOverview } from "@/lib/queries/tracking";
import { TrackingOverviewList } from "@/components/orders/tracking-overview-list";

export const metadata: Metadata = { title: "Tracking | Driver TMS" };

export default async function DriverTrackingPage() {
  const user = await requireRole("driver");
  const orders = await getDriverTrackingOverview(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display text-ink">Tracking</h1>
        <p className="mt-1 text-sm text-slate">Your loads still in progress, with their live status history.</p>
      </div>
      <TrackingOverviewList orders={orders} detailUrlPrefix="/driver/orders" showDriverName={false} />
    </div>
  );
}
