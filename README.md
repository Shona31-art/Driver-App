# Driver TMS

A Transport Management System for a single transport company: Super Admins
manage users and see everything, Admins create and assign orders, and
Drivers see only their own loads and expenses.

**Status: Phase 1 and Phase 2 complete** -- Authentication, User
Management, role-based dashboards, Orders (create/edit/assign/reassign/
complete/delete), the full driver workflow (confirm assignment -> mark
Loaded with begin KM + loading docs -> offload PIN -> mark Delivered with
end KM + delivery docs + POD -> inline expense logging), Expenses
(submit/approve/reject), Documents (private Storage uploads with signed
view links), and Notifications (in-app bell + Resend email on
assignment). See "What's not built yet" below for the one known gap and
Phase 3 items still outstanding.

## Tech stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Storage, Row Level Security)
- React Hook Form + Zod
- Resend (transactional email)
- date-fns (date formatting)

Data access is via the Supabase client directly (no ORM) so every query
goes through the same Row Level Security policies the database enforces --
see "Architecture notes" below for why.

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Supabase

You need a Supabase project -- either the hosted dashboard
(supabase.com) or a local instance via the
[Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase init`,
`supabase start`). Either way, apply the migrations in
`supabase/migrations/` **in order** (they're plain numbered SQL files --
run them via the Supabase SQL editor, or `supabase db push` / `supabase
db reset` if you're using the CLI):

1. `20260730120000_schema.sql` -- tables, enums
2. `20260730120100_functions_triggers.sql` -- role-lookup helpers, order
   status state machine trigger
3. `20260730120200_rls_policies.sql` -- Row Level Security
4. `20260730120300_storage.sql` -- private `uploads` bucket + policies
5. `20260730120400_audit_log.sql` -- sensitive-action audit trail
6. `20260730120500_grants.sql` -- table/sequence/function GRANTs for the
   `authenticated`/`service_role` Postgres roles (**required** -- RLS
   policies alone don't grant access; Postgres denies everything until
   these run)
7. `20260730120600_offload_pin.sql` -- adds the 6-digit offload PIN
   generated when an order is marked Loaded

If your Supabase project came from a template with pre-existing tables,
wipe the `public` schema first (see the SQL in "Architecture notes" if
needed) before applying these.

For local development, `supabase/seed.sql` creates three test accounts
(password `Password123!` for all three) plus a couple of sample orders:

| Role        | Email                    |
|-------------|--------------------------|
| Super Admin | superadmin@example.com   |
| Admin       | admin@example.com        |
| Driver      | driver@example.com       |

**Do not run seed.sql against a shared or production project** -- it
creates real auth accounts with a known password.

**Also check Authentication -> Hooks in your Supabase dashboard** for any
pre-existing Auth Hook (e.g. a "Customize Access Token" hook pointing at
a function that doesn't exist in this schema) -- if one is left over from
a template, every sign-in will fail with a 500 until it's removed.

### 3. Set up Resend (email)

Create a free account at [resend.com](https://resend.com), grab an API
key. For local testing you can send from their shared `onboarding@resend.dev`
address without verifying a domain (only delivers to your own Resend
account's email); for anything real, verify your own sending domain in
the Resend dashboard first.

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (Project Settings -> API) -- the bare origin, e.g. `https://xxxx.supabase.co`, not the `/rest/v1/` REST endpoint URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key -- safe for the browser, RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key -- **server-side only**, bypasses RLS. Used for the Auth Admin API (create/delete users) and system-written notifications |
| `RESEND_API_KEY` | Resend API key, for the load-assignment notification email |
| `RESEND_FROM_EMAIL` | The verified sending address for that email |
| `NEXT_PUBLIC_SITE_URL` | Base URL of this app (`http://localhost:3000` locally), used to build Supabase Auth email redirect links |

### 5. Run it

```bash
pnpm dev
```

Visit `http://localhost:3000` and sign in with one of the seeded accounts.

## Other commands

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm test        # vitest (unit tests for validation/business-rule logic)
pnpm build       # production build
```

All four run in CI on every push/PR to `main` and `dev` (see
`.github/workflows/ci.yml`).

## Deployment

Deploy to Vercel: connect the repo, set the environment variables above in
the Vercel project settings (Production and Preview environments both need
them -- point Preview at a separate/dev Supabase project if you have one,
since `dev` branch pushes deploy to Preview automatically).

Branch workflow: work on `dev` (or feature branches merged into `dev`) --
Vercel deploys every branch to its own Preview URL automatically. Only
merge `dev` -> `main` when a change is confirmed ready for production.

## Where things live

| I want to change... | Go to... |
|---|---|
| Login/forgot-password/reset-password pages | `app/(auth)/`, `components/auth/` |
| Role-based redirect logic | `proxy.ts` (coarse routing) + `lib/auth/session.ts` (`requireRole` -- the actual authorization check every page/action makes) |
| Sidebar nav items | `components/layout/nav-items.ts` |
| Dashboard layout (sidebar/topbar/notification bell) | `components/layout/dashboard-shell.tsx`, `components/layout/notification-bell.tsx` |
| User management (Super Admin) | `app/(admin)/admin/users/`, `components/users/`, `lib/actions/users.ts` |
| Orders (admin) | `app/(admin)/admin/orders/`, `components/orders/`, `lib/actions/orders.ts` |
| Driver order workflow | `app/(driver)/driver/orders/`, `components/driver/`, `lib/actions/driver-orders.ts` |
| Expenses | `app/(admin)/admin/expenses/`, `app/(driver)/driver/expenses/`, `components/expenses/`, `lib/actions/expenses.ts` |
| Document upload/signed URLs | `lib/actions/documents.ts`, `lib/queries/documents.ts` |
| Map deep links / geocoding | `lib/utils/map-links.ts`, `lib/utils/geocode.ts` |
| Email templates | `lib/email/resend.ts` |
| Database schema / RLS policies | `supabase/migrations/` (numbered SQL files, applied in order) |
| Aperture design tokens (colors, fonts, type scale) | `app/globals.css` |
| Zod validation schemas | `lib/validations/` |
| Server Actions (all mutations) | `lib/actions/` |
| Supabase client setup | `lib/supabase/client.ts` (browser), `server.ts` (Server Components/Actions, RLS-bound), `admin.ts` (service role, trusted server code only) |

## Architecture notes

- **No ORM.** Every query goes through the Supabase client (browser or
  server) so Row Level Security is the single, always-enforced
  authorization layer -- there's no separate code path that could
  accidentally bypass it.
- **RLS + a database trigger, not just RLS.** RLS controls which *rows* a
  driver can touch; a Postgres trigger
  (`enforce_order_status_transition` in
  `supabase/migrations/20260730120100_functions_triggers.sql`) validates
  that order status only moves through the correct sequence
  (unassigned -> assigned -> confirmed -> loaded -> delivered ->
  completed), generates the 6-digit offload PIN the moment an order is
  marked Loaded, and blocks reassigning a driver on a completed order --
  all as a database-level backstop alongside the same checks in the
  Server Action layer.
- **Table-level GRANTs are required alongside RLS.** Postgres denies all
  access to a table until the role has a base GRANT, regardless of RLS
  policies -- this bit us once already (an `authenticated` user got
  "permission denied" despite a correct RLS policy). See migration
  `20260730120500_grants.sql`. `anon` is deliberately granted nothing:
  every table in this app requires a signed-in user.
- **Document uploads**: Server Actions accept `FormData` (including
  `File` entries) directly -- files are uploaded to the private
  `uploads` Storage bucket via the session-bound Supabase client (so
  Storage's RLS policies apply as the acting user), then a `documents`
  row is written with the path. Viewing a document generates a
  short-lived signed URL (`lib/queries/documents.ts`) rather than a
  public link, since the bucket is private.
- **Offload PIN**: a 6-digit operational code (not a cryptographic
  secret) generated server-side the moment an order transitions to
  `loaded`, shown to the driver and to Admin/Super Admin for delivery-
  site verification.
- **`lib/supabase/types.ts` is hand-written**, not generated, and matches
  the exact `GenericTable`/`GenericSchema` shape `@supabase/postgrest-js`
  expects (including `Relationships: []` on every table) -- omitting
  that shape silently makes every query infer `never` instead of erroring
  loudly, which cost real debugging time here. Once you have a live
  Supabase project, regenerate it for accuracy:
  ```bash
  supabase gen types typescript --local > lib/supabase/types.ts
  ```
- **Audit log.** Sensitive account actions (create/deactivate/reactivate/
  delete user, admin-triggered password reset) are logged to
  `audit_log` (actor, action, target, timestamp) -- Super Admin only can
  read it; only trusted server code can write to it.
- **Wiping the `public` schema** (only needed if starting from a project
  with leftover tables from a template):
  ```sql
  drop schema public cascade;
  create schema public;
  grant usage on schema public to postgres, anon, authenticated, service_role;
  grant all on schema public to postgres, service_role;
  alter default privileges in schema public grant all on tables to postgres, service_role;
  alter default privileges in schema public grant all on sequences to postgres, service_role;
  alter default privileges in schema public grant all on routines to postgres, service_role;
  ```

## What's not built yet

- **Embedded map view**: the original scope asked for both an embedded
  Leaflet/OpenStreetMap view (with pickup/delivery markers) *and*
  an "Open in Google Maps" deep-link button. Only the deep link is
  built (matching the reference mockup you provided, which showed only
  a deep link) -- there is no embedded map on the order screens yet.
  `leaflet`/`react-leaflet` are installed but unused. Flag if you want
  the embedded map added back. (The Waze deep link that was previously
  here has been removed at your request.)
- **Reports** beyond the dashboards' live counts -- no CSV/PDF export.
- **Settings page** (Super Admin) -- not built; nothing in scope
  required it yet beyond the placeholder nav consideration.

## Known placeholders -- flagging before this goes anywhere near production

- **Logo**: no real logo file has been provided. `components/layout/brand-mark.tsx`
  renders an accent-colored square + text wordmark as a placeholder,
  per Aperture's default. Swap this the moment a real logo (SVG
  preferred) is available -- don't let this silently ship.
- **"Remember me"** on the login form is captured but not functionally
  wired to change session length -- Supabase's session/refresh-token
  cookie lifetime isn't independently toggleable per sign-in through the
  current client libraries without custom cookie handling.
- **Geocoding** uses OSM's free Nominatim API with no fallback pin-drop
  UI yet (a failed geocode just means no map pin -- the deep links still
  work off the raw address text either way). Revisit a paid geocoder
  (LocationIQ, Geoapify) if order volume grows past Nominatim's 1 req/sec
  fair-use limit.
- **Email is load-assignment only.** Expense approval/rejection and
  order-delivered notifications are in-app only for now, per the Phase 1
  scoping decision -- easy to extend in `lib/email/resend.ts` if wanted.

## What I verified vs. couldn't fully verify

**Verified against a real Supabase project** (not just placeholders):
`pnpm typecheck`/`lint`/`test` (29 unit tests)/`build` all pass clean;
sign-in works for all three seeded roles; RLS correctly restricts a
Driver to their own user row and own order. Beyond that, every
authenticated page was requested directly (by constructing a real
Supabase session cookie and hitting each route with curl -- not just
trusting `next build`'s static analysis), which caught a real bug:
`getNavItems()`'s result (containing Lucide icon component references)
was being computed in the server layout and passed as a prop into the
client `DashboardShell`, which React can't serialize across that
boundary -- it silently passed `next build` (dynamic routes aren't
statically rendered at build time) but 500'd on every real request. Fixed
by computing nav items inside the client component instead
(`components/layout/dashboard-shell.tsx`). After the fix, all of these
returned a real 200 with correct content for the signed-in role: both
dashboards, Orders list/create/detail, Drivers, Expenses (admin and
driver), Users, driver Profile, and a driver's order detail page (which
correctly showed the "Confirm Assignment" step matching that order's
actual `assigned` status).

**Not yet verified**: actually clicking through the mutating flows
(creating an order, confirming/loading/delivering it, uploading real
documents, submitting/approving an expense) -- there's no browser
automation in this environment, and simulating a Next.js Server Action
call via raw HTTP isn't practical. Please walk through each role's
critical path yourself: create an order -> assign a driver -> confirm ->
load with documents -> verify the PIN appears -> deliver with
documents+POD -> log an expense -> approve/reject it as Admin -> mark
Completed.
