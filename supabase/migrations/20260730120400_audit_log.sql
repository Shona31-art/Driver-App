-- Audit trail for sensitive account actions (create/deactivate/reactivate/
-- delete user, password reset triggered by Super Admin). Written only from
-- trusted server-side code via the service role (see lib/actions/audit.ts)
-- -- never by a direct client insert, so there is no INSERT policy here.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users (id),
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_target_idx on public.audit_log (target_type, target_id);

alter table public.audit_log enable row level security;

create policy audit_log_select_super_admin on public.audit_log
  for select
  using (public.current_user_role() = 'super_admin');
