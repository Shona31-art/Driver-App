import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the one-time code Supabase Auth puts in invite/password-reset
// email links for a real session. Every such email link points here first
// (via `redirectTo`), then this hands off to wherever the flow should
// continue (e.g. /reset-password to set a new password).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
