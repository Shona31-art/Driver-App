import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

// Middleware already redirects "/" based on session + role; this is the
// server-side fallback for that same logic, consistent with never relying
// on middleware alone for a routing/authorization decision.
export default async function RootPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  redirect(user.role === "driver" ? "/driver/dashboard" : "/admin/dashboard");
}
