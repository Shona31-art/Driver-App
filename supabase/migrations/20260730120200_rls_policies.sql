-- Row Level Security. Every table holding user data has RLS enabled with an
-- explicit policy per operation; anything not covered below defaults to
-- deny, which is intentional (e.g. no client INSERT policy on
-- order_status_history or notifications -- those are written by
-- SECURITY DEFINER triggers / trusted server-side code using the service
-- role, never directly by a browser session).

alter table public.users enable row level security;
alter table public.drivers enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.expenses enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;

-- users -----------------------------------------------------------------

create policy users_select on public.users
  for select
  using (id = auth.uid() or public.current_user_role() in ('super_admin', 'admin'));

create policy users_update_super_admin on public.users
  for update
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

create policy users_delete_super_admin on public.users
  for delete
  using (public.current_user_role() = 'super_admin');

-- No client INSERT policy: rows are created only by the
-- handle_new_auth_user trigger (SECURITY DEFINER) when Super Admin calls
-- the Supabase Auth Admin API with the service role key.

-- drivers -----------------------------------------------------------------

create policy drivers_select on public.drivers
  for select
  using (user_id = auth.uid() or public.current_user_role() in ('super_admin', 'admin'));

create policy drivers_insert_super_admin on public.drivers
  for insert
  with check (public.current_user_role() = 'super_admin');

-- Drivers may update their own row (phone number, etc.); the Server Action
-- layer restricts which fields a driver-originated request is allowed to
-- change (never role-equivalent fields, since those don't live on this
-- table) versus a full edit from Super Admin.
create policy drivers_update on public.drivers
  for update
  using (user_id = auth.uid() or public.current_user_role() = 'super_admin')
  with check (user_id = auth.uid() or public.current_user_role() = 'super_admin');

create policy drivers_delete_super_admin on public.drivers
  for delete
  using (public.current_user_role() = 'super_admin');

-- orders ------------------------------------------------------------------

create policy orders_select on public.orders
  for select
  using (
    driver_id = public.current_driver_id()
    or public.current_user_role() in ('super_admin', 'admin')
  );

create policy orders_insert on public.orders
  for insert
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- Admin/Super Admin can edit any field; a driver can update only their own
-- assigned order (status transitions, begin/end KM) -- the specific fields
-- and valid transitions are enforced by the Server Action plus the
-- enforce_order_status_transition trigger, not by RLS column granularity.
create policy orders_update on public.orders
  for update
  using (
    driver_id = public.current_driver_id()
    or public.current_user_role() in ('super_admin', 'admin')
  )
  with check (
    driver_id = public.current_driver_id()
    or public.current_user_role() in ('super_admin', 'admin')
  );

create policy orders_delete_super_admin on public.orders
  for delete
  using (public.current_user_role() = 'super_admin');

-- order_status_history ------------------------------------------------------

create policy order_status_history_select on public.order_status_history
  for select
  using (
    public.current_user_role() in ('super_admin', 'admin')
    or exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.driver_id = public.current_driver_id()
    )
  );

-- expenses ------------------------------------------------------------------

create policy expenses_select on public.expenses
  for select
  using (
    driver_id = public.current_driver_id()
    or public.current_user_role() in ('super_admin', 'admin')
  );

create policy expenses_insert on public.expenses
  for insert
  with check (driver_id = public.current_driver_id());

-- No driver UPDATE policy: expenses are immutable once submitted (Phase 1
-- decision) so only Admin/Super Admin can transition status.
create policy expenses_update_reviewers on public.expenses
  for update
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

create policy expenses_delete_super_admin on public.expenses
  for delete
  using (public.current_user_role() = 'super_admin');

-- documents -------------------------------------------------------------

create policy documents_select on public.documents
  for select
  using (
    public.current_user_role() in ('super_admin', 'admin')
    or exists (
      select 1 from public.orders o
      where o.id = documents.order_id and o.driver_id = public.current_driver_id()
    )
    or exists (
      select 1 from public.expenses e
      where e.id = documents.expense_id and e.driver_id = public.current_driver_id()
    )
  );

create policy documents_insert on public.documents
  for insert
  with check (
    public.current_user_role() in ('super_admin', 'admin')
    or exists (
      select 1 from public.orders o
      where o.id = documents.order_id and o.driver_id = public.current_driver_id()
    )
    or exists (
      select 1 from public.expenses e
      where e.id = documents.expense_id and e.driver_id = public.current_driver_id()
    )
  );

-- No UPDATE policy: uploaded documents are immutable (re-upload creates a
-- new row rather than mutating one) to preserve the audit trail.
create policy documents_delete_super_admin on public.documents
  for delete
  using (public.current_user_role() = 'super_admin');

-- notifications -------------------------------------------------------------

create policy notifications_select on public.notifications
  for select
  using (user_id = auth.uid());

-- Only allows flipping read_at on your own notifications; enforced further
-- by the Server Action only ever setting that one column.
create policy notifications_update_own on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No client INSERT policy: notifications are created from trusted
-- server-side code (Server Actions) using the service role, alongside the
-- event that triggers them (assignment, status change, expense decision).
