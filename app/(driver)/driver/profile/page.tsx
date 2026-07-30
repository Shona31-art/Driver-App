import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getOwnDriverProfile } from "@/lib/queries/driver-profile";
import { ProfileForm } from "@/components/driver/profile-form";

export const metadata: Metadata = { title: "Profile | Driver TMS" };

export default async function DriverProfilePage() {
  const user = await requireRole("driver");
  const profile = await getOwnDriverProfile(user.id);

  return (
    <div className="space-y-8">
      <h1 className="text-display text-ink">Profile</h1>
      <ProfileForm
        fullName={profile?.full_name ?? user.fullName}
        email={user.email}
        phone={profile?.phone ?? null}
        driversLicense={profile?.drivers_license ?? null}
        pdpNumber={profile?.pdp_number ?? null}
      />
    </div>
  );
}
