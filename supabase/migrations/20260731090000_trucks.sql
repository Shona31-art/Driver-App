-- Trucks become a managed entity instead of free-text "horse registration"
-- on orders (and drivers) -- lets admins maintain one canonical list and
-- pick from it when creating a load, rather than re-typing a registration
-- every time (and risking typos splitting one truck into several
-- effectively-duplicate values). A truck is assigned per order, not tied
-- to a specific driver: real haulage operations don't always run a fixed
-- driver-truck pairing, so drivers.horse_registration is retired too
-- rather than kept alongside this as a second, now-redundant concept.

create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  registration text not null unique,
  make_model text,
  active boolean not null default true,
  created_by uuid references public.users (id),
  updated_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trucks_set_updated_at before update on public.trucks
  for each row execute function public.set_updated_at();

alter table public.trucks enable row level security;

-- Drivers can view the truck list (they see the registration on their own
-- orders) but only Admin/Super Admin manage it; only Super Admin can
-- delete, matching the same tier as deleting an order.
create policy trucks_select on public.trucks
  for select
  using (public.current_user_role() in ('super_admin', 'admin', 'driver'));

create policy trucks_insert on public.trucks
  for insert
  with check (public.current_user_role() in ('super_admin', 'admin'));

create policy trucks_update on public.trucks
  for update
  using (public.current_user_role() in ('super_admin', 'admin'));

create policy trucks_delete on public.trucks
  for delete
  using (public.current_user_role() = 'super_admin');

-- Backfill: one truck per distinct registration already in use anywhere,
-- so no existing data is lost in the switch to a managed list.
insert into public.trucks (registration)
select distinct horse_registration from public.orders
where horse_registration is not null and horse_registration <> ''
on conflict (registration) do nothing;

insert into public.trucks (registration)
select distinct horse_registration from public.drivers
where horse_registration is not null and horse_registration <> ''
on conflict (registration) do nothing;

alter table public.orders add column truck_id uuid references public.trucks (id);

update public.orders o
set truck_id = t.id
from public.trucks t
where t.registration = o.horse_registration;

alter table public.orders alter column truck_id set not null;

alter table public.orders drop column horse_registration;
alter table public.drivers drop column horse_registration;
