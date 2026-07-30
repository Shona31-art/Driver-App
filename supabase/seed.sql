-- Local development seed data. Runs automatically after `supabase db reset`
-- against your LOCAL Supabase instance only -- never run this against a
-- shared/production project, it creates auth users with a known password.
--
-- Login credentials (local dev only): password "Password123!" for all three.
--   Super Admin : superadmin@example.com
--   Admin       : admin@example.com
--   Driver      : driver@example.com

do $$
declare
  super_admin_id uuid := gen_random_uuid();
  admin_id uuid := gen_random_uuid();
  driver_user_id uuid := gen_random_uuid();
  driver_row_id uuid;
  sample_order_id uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
  (
    '00000000-0000-0000-0000-000000000000', super_admin_id, 'authenticated', 'authenticated',
    'superadmin@example.com', crypt('Password123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Super Admin","role":"super_admin"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
    'admin@example.com', crypt('Password123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Ops Admin","role":"admin"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', driver_user_id, 'authenticated', 'authenticated',
    'driver@example.com', crypt('Password123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Sipho Driver","role":"driver"}',
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values
  (gen_random_uuid(), super_admin_id, jsonb_build_object('sub', super_admin_id::text, 'email', 'superadmin@example.com'), 'email', super_admin_id::text, now(), now(), now()),
  (gen_random_uuid(), admin_id, jsonb_build_object('sub', admin_id::text, 'email', 'admin@example.com'), 'email', admin_id::text, now(), now(), now()),
  (gen_random_uuid(), driver_user_id, jsonb_build_object('sub', driver_user_id::text, 'email', 'driver@example.com'), 'email', driver_user_id::text, now(), now(), now());

  -- public.users rows for all three are created automatically by the
  -- handle_new_auth_user trigger from raw_user_meta_data above.

  insert into public.drivers (user_id, full_name, phone, drivers_license, pdp_number, horse_registration)
  values (driver_user_id, 'Sipho Driver', '+27821234567', 'EC1234567', 'PDP998877', 'CA 123-456')
  returning id into driver_row_id;

  insert into public.orders (
    customer_name, pickup_address, delivery_address, pickup_date, delivery_date,
    weight_tons, horse_registration, loading_number, notes, status, driver_id, created_by
  ) values (
    'Acme Logistics (Pty) Ltd', '12 Voortrekker Rd, Bellville, Cape Town', '45 Sandton Drive, Sandton, Johannesburg',
    current_date + 1, current_date + 3, 24.5, 'CA 123-456', 'LN-2026-0001', 'Fragile load, handle with care',
    'assigned', driver_row_id, super_admin_id
  )
  returning id into sample_order_id;

  insert into public.orders (
    customer_name, pickup_address, delivery_address, pickup_date, delivery_date,
    weight_tons, horse_registration, loading_number, status, created_by
  ) values (
    'Karoo Grain Co-op', '8 Church St, Beaufort West', '100 Market St, Cape Town',
    current_date + 2, current_date + 4, 30.0, 'TBD', 'LN-2026-0002', 'unassigned', super_admin_id
  );

  insert into public.expenses (driver_id, order_id, type, amount, expense_date, notes, status)
  values (driver_row_id, sample_order_id, 'diesel', 850.00, current_date, 'Fuel top-up en route', 'pending');
end $$;
