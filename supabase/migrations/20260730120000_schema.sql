-- Core schema: enums, tables, indexes.
-- Single-tenant TMS: no organization/tenant layer (confirmed in Phase 1 scoping).

create extension if not exists pgcrypto;

create type public.user_role as enum ('super_admin', 'admin', 'driver');

create type public.order_status as enum (
  'unassigned',
  'assigned',
  'confirmed',
  'loaded',
  'delivered',
  'completed'
);

create type public.expense_type as enum ('tfn', 'diesel', 'overnight', 'truck_wash', 'oil');

create type public.expense_status as enum ('pending', 'approved', 'rejected');

create type public.document_type as enum (
  'loading_document',
  'delivery_document',
  'pod',
  'receipt'
);

create type public.notification_type as enum (
  'load_assigned',
  'order_status_changed',
  'expense_approved',
  'expense_rejected'
);

-- public.users mirrors auth.users 1:1 (see handle_new_user trigger in
-- 20260730120100_functions_triggers.sql). Auth identity lives in auth.users;
-- this table holds the app-facing profile and role.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.user_role not null default 'driver',
  active boolean not null default true,
  created_by uuid references public.users (id),
  updated_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Driver-specific profile fields, kept separate from auth/role data per
-- Phase 1 decision: one users row (auth + role) to one drivers row (profile).
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  full_name text not null,
  phone text,
  drivers_license text,
  pdp_number text,
  horse_registration text, -- driver's usual/assigned vehicle; orders.horse_registration below is per-trip and can differ
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  pickup_address text not null,
  pickup_lat double precision,
  pickup_lng double precision,
  delivery_address text not null,
  delivery_lat double precision,
  delivery_lng double precision,
  pickup_date date not null,
  delivery_date date not null,
  weight_tons numeric(10, 2) not null,
  horse_registration text not null,
  loading_number text,
  notes text,
  status public.order_status not null default 'unassigned',
  driver_id uuid references public.drivers (id),
  begin_km numeric(10, 1),
  end_km numeric(10, 1),
  created_by uuid not null references public.users (id),
  updated_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_end_km_after_begin check (end_km is null or begin_km is null or end_km >= begin_km)
);

create index orders_driver_id_idx on public.orders (driver_id);
create index orders_status_idx on public.orders (status);

-- Immutable audit trail of every status change. Rows are written only by the
-- enforce_order_status_transition trigger (SECURITY DEFINER) -- see
-- 20260730120100_functions_triggers.sql -- never by direct client insert.
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status not null,
  to_status public.order_status not null,
  changed_by uuid references public.users (id),
  notes text,
  changed_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on public.order_status_history (order_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers (id),
  order_id uuid references public.orders (id),
  type public.expense_type not null,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'ZAR',
  expense_date date not null,
  notes text,
  status public.expense_status not null default 'pending',
  reviewed_by uuid references public.users (id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_driver_id_idx on public.expenses (driver_id);
create index expenses_status_idx on public.expenses (status);

-- Polymorphic upload metadata; the file itself lives in Supabase Storage
-- under the path stored in file_path. Exactly one of order_id/expense_id is
-- set, enforced by documents_target_check below.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id),
  expense_id uuid references public.expenses (id),
  type public.document_type not null,
  file_path text not null,
  file_name text not null,
  file_size integer not null check (file_size > 0 and file_size <= 20971520), -- 20 MB
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  uploaded_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_target_check check (
    (type in ('loading_document', 'delivery_document', 'pod') and order_id is not null and expense_id is null)
    or
    (type = 'receipt' and expense_id is not null and order_id is null)
  )
);

create index documents_order_id_idx on public.documents (order_id);
create index documents_expense_id_idx on public.documents (expense_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  related_order_id uuid references public.orders (id),
  related_expense_id uuid references public.expenses (id),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_unread_idx on public.notifications (user_id, read_at);
