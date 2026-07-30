-- Helper functions, business-rule triggers, and housekeeping triggers.

-- SECURITY DEFINER so RLS policies can call this without recursing into the
-- RLS-protected users table (the classic Supabase "role lookup" pattern).
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_driver_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.drivers where user_id = auth.uid();
$$;

-- Creates the public.users profile row whenever a Super Admin creates a new
-- auth user via the Supabase Admin API. role/full_name come from the
-- user_metadata passed at creation time (see lib/actions/users.ts).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role, active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'driver'),
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger drivers_set_updated_at before update on public.drivers
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger expenses_set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

create or replace function public.set_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null then
    new.order_number := 'ORD-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger orders_set_order_number before insert on public.orders
  for each row execute function public.set_order_number();

-- Enforces the order state machine at the database level (defense in depth
-- alongside the Server Action check) and writes the audit trail. Runs as
-- SECURITY DEFINER so the history insert isn't subject to the acting user's
-- RLS grants -- no one gets a direct INSERT policy on order_status_history.
create or replace function public.enforce_order_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if old.status = 'completed' and new.driver_id is distinct from old.driver_id then
    raise exception 'Cannot reassign driver on a completed order';
  end if;

  if new.status = old.status then
    return new;
  end if;

  allowed := (old.status, new.status) in (
    ('unassigned', 'assigned'),
    ('assigned', 'confirmed'),
    ('confirmed', 'loaded'),
    ('loaded', 'delivered'),
    ('delivered', 'completed')
  );

  if not allowed then
    raise exception 'Invalid order status transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'loaded' and new.begin_km is null then
    raise exception 'begin_km is required before marking an order as loaded';
  end if;

  if new.status = 'delivered' and new.end_km is null then
    raise exception 'end_km is required before marking an order as delivered';
  end if;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by)
  values (new.id, old.status, new.status, auth.uid());

  return new;
end;
$$;

create trigger orders_status_transition before update on public.orders
  for each row execute function public.enforce_order_status_transition();
