-- Widens document deletion from Super Admin only to Admin + Super Admin,
-- for the new Documents overview page -- matches the permission tier
-- chosen for that page (drivers can view/download their own order's
-- documents there, but only admin roles can delete).

drop policy documents_delete_super_admin on public.documents;

create policy documents_delete_admin on public.documents
  for delete
  using (public.current_user_role() in ('super_admin', 'admin'));
