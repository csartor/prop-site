create policy "Admins can read maker assets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'maker-assets'
    and (select public.is_admin())
  );
