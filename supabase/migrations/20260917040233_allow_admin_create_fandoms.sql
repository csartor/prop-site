grant insert on table public.maker_filter_options to authenticated;

create policy "Admins can create filter options"
  on public.maker_filter_options for insert
  to authenticated
  with check ((select public.is_admin()));
