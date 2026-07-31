import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

// Convenience routing only -- redirects unauthenticated users to /login and
// keeps signed-in users out of the wrong role's section, so there's no
// flash-of-wrong-content round trip. This is NOT the authorization boundary:
// every Server Component/Action re-checks the session and role itself via
// requireRole() (lib/auth/session.ts), per the standing rule that this
// proxy is never assumed to have already covered a specific action.
//
// Named "proxy" (not "middleware") per Next.js 16's renamed convention --
// same request-interception mechanism, new file/export name.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not add logic between createServerClient and getUser(): this call is
  // what refreshes the session token, and it must run on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user) {
    if (path === "/" || (!isPublicPath && path !== "/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const { data: profile } = await supabase.from("users").select("role, active").eq("id", user.id).single();

  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=account_disabled", request.url));
  }

  const homePath = profile.role === "driver" ? "/driver/dashboard" : "/admin/dashboard";

  if (path === "/" || path === "/login") {
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  if (path.startsWith("/admin") && profile.role === "driver") {
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  if (path.startsWith("/driver") && profile.role !== "driver") {
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
