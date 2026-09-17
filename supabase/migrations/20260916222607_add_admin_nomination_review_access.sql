create policy "Admins can view profiles"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can review maker nominations"
  on public.maker_nominations for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can update maker nominations"
  on public.maker_nominations for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can review nomination fandoms"
  on public.maker_nomination_fandoms for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can read nomination assets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'maker-nomination-assets'
    and (select public.is_admin())
  );
