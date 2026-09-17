create table public.site_settings (
  singleton boolean primary key default true check (singleton),
  utm_source text not null default 'makersforge'
    check (char_length(utm_source) between 1 and 80 and utm_source ~ '^[A-Za-z0-9._-]+$'),
  utm_medium text not null default 'directory'
    check (char_length(utm_medium) between 1 and 80 and utm_medium ~ '^[A-Za-z0-9._-]+$'),
  utm_campaign text not null default 'maker-directory'
    check (char_length(utm_campaign) between 1 and 80 and utm_campaign ~ '^[A-Za-z0-9._-]+$'),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (singleton)
values (true);

alter table public.site_settings enable row level security;

revoke all on table public.site_settings from anon, authenticated, public;
grant select on table public.site_settings to anon, authenticated;
grant update on table public.site_settings to authenticated;

create policy "Site settings are publicly readable"
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy "Admins can update site settings"
  on public.site_settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
