-- Table/sequence/function-level grants for the `authenticated` and
-- `service_role` Postgres roles. RLS policies (already defined in
-- 20260730120200_rls_policies.sql) are what actually restrict *which rows*
-- each role can touch -- these GRANTs are the separate, required
-- prerequisite: Postgres denies all access to a table until the role has
-- at least a base grant, regardless of RLS policies. Missing this is why
-- an authenticated user got "permission denied for table users" even
-- though the correct RLS policy existed.
--
-- `anon` is deliberately NOT granted anything here: every table in this
-- app requires a signed-in user, and the app never queries a table before
-- confirming a session exists (see lib/auth/session.ts) -- so there's no
-- legitimate use for anonymous table access, unlike Supabase's default
-- template which grants broadly to anon by convention.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;
alter default privileges in schema public grant execute on functions to authenticated, service_role;
