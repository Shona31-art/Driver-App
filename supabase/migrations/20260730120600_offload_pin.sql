-- Adds the offload PIN: a 6-digit code generated automatically the moment
-- an order transitions to 'loaded', shown to the driver (and Admin/Super
-- Admin, who already see the full order) for site security verification at
-- the delivery point. Not a cryptographic secret -- an operational code,
-- so plain pseudo-random digits are sufficient.

alter table public.orders add column offload_pin text;

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

  if new.status = 'loaded' then
    if new.begin_km is null then
      raise exception 'begin_km is required before marking an order as loaded';
    end if;
    new.offload_pin := lpad(floor(random() * 1000000)::text, 6, '0');
  end if;

  if new.status = 'delivered' and new.end_km is null then
    raise exception 'end_km is required before marking an order as delivered';
  end if;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by)
  values (new.id, old.status, new.status, auth.uid());

  return new;
end;
$$;
