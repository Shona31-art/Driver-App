import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Writes an audit_log row via the service role, bypassing RLS -- this is
// intentionally the only way rows land in that table (see the migration
// comment in supabase/migrations/20260730120400_audit_log.sql). Call this
// from Server Actions right after a sensitive account action succeeds
// (create/deactivate/reactivate/delete user, admin-triggered password
// reset), per the standing rule that such actions must be logged with who
// did what, when.
export async function logAuditEvent(params: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_log").insert({
    actor_id: params.actorId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    metadata: params.metadata ?? {},
  });

  if (error) {
    // Auditing must never block the underlying action or leak internals to
    // the user -- log server-side for the operator to notice and fix.
    console.error("Failed to write audit_log entry", params.action, error);
  }
}
