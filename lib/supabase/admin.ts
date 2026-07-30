import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service-role client. Bypasses RLS entirely -- only ever call this from
// Server Actions/Route Handlers, after the caller's own role has already
// been checked with a session-bound client. Never import into a Client
// Component; the `server-only` import above makes that a build-time error.
// Used for: the Auth Admin API (create/delete/deactivate users, since that
// API requires the service role) and writing system-generated notifications
// on behalf of another user.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
