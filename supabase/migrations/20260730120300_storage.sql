-- Single private bucket for all uploads, folder-scoped by
-- orders/{order_id}/... or expenses/{expense_id}/.... Access mirrors the
-- documents table policies: a driver can only reach paths under an
-- order/expense they own; Admin/Super Admin can reach everything.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  false,
  20971520, -- 20 MB, matches documents.file_size check constraint
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do nothing;

create policy uploads_select on storage.objects
  for select
  using (
    bucket_id = 'uploads'
    and (
      public.current_user_role() in ('super_admin', 'admin')
      or (
        (storage.foldername(name))[1] = 'orders'
        and exists (
          select 1 from public.orders o
          where o.id::text = (storage.foldername(name))[2]
            and o.driver_id = public.current_driver_id()
        )
      )
      or (
        (storage.foldername(name))[1] = 'expenses'
        and exists (
          select 1 from public.expenses e
          where e.id::text = (storage.foldername(name))[2]
            and e.driver_id = public.current_driver_id()
        )
      )
    )
  );

create policy uploads_insert on storage.objects
  for insert
  with check (
    bucket_id = 'uploads'
    and (
      public.current_user_role() in ('super_admin', 'admin')
      or (
        (storage.foldername(name))[1] = 'orders'
        and exists (
          select 1 from public.orders o
          where o.id::text = (storage.foldername(name))[2]
            and o.driver_id = public.current_driver_id()
        )
      )
      or (
        (storage.foldername(name))[1] = 'expenses'
        and exists (
          select 1 from public.expenses e
          where e.id::text = (storage.foldername(name))[2]
            and e.driver_id = public.current_driver_id()
        )
      )
    )
  );

-- No update policy: uploads are write-once. Only Super Admin can remove a
-- file (e.g. an erroneous upload), matching the documents table's delete
-- policy.
create policy uploads_delete_super_admin on storage.objects
  for delete
  using (bucket_id = 'uploads' and public.current_user_role() = 'super_admin');
