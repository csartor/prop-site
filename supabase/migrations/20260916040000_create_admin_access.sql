create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

insert into public.admin_users (user_id)
select id
from auth.users
where email = 'craigmsartor@gmail.com'
on conflict (user_id) do nothing;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy "Admins can read admin membership"
  on public.admin_users for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Admins can review buyer requests"
  on public.buyer_requests for select to authenticated
  using ((select public.is_admin()));
create policy "Admins can update buyer requests"
  on public.buyer_requests for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins can read buyer references"
  on public.buyer_request_references for select to authenticated
  using ((select public.is_admin()));

create policy "Admins can review maker applications"
  on public.maker_applications for select to authenticated
  using ((select public.is_admin()));
create policy "Admins can update maker applications"
  on public.maker_applications for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins can read maker portfolios"
  on public.maker_application_portfolio_items for select to authenticated
  using ((select public.is_admin()));

create policy "Admins can read request uploads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'buyer-request-references'
    and (select public.is_admin())
  );
create policy "Admins can read maker portfolio uploads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'maker-application-portfolio'
    and (select public.is_admin())
  );
