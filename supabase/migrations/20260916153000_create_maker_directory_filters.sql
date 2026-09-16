create table if not exists public.maker_filter_options (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('maker_type', 'fandom', 'availability')),
  label text not null check (char_length(label) between 1 and 100),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order smallint not null default 0 check (sort_order >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, slug)
);

create table if not exists public.profile_filter_options (
  profile_user_id uuid not null references public.profiles (user_id) on delete cascade,
  filter_option_id uuid not null references public.maker_filter_options (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_user_id, filter_option_id)
);

create index if not exists profile_filter_options_option_user_idx
  on public.profile_filter_options (filter_option_id, profile_user_id);

alter table public.maker_filter_options enable row level security;
alter table public.profile_filter_options enable row level security;

create policy "Enabled maker directory options are public"
  on public.maker_filter_options for select
  to anon, authenticated
  using (enabled);

create policy "Public or owner filter assignments are readable"
  on public.profile_filter_options for select
  to anon, authenticated
  using (
    (select auth.uid()) = profile_user_id
    or exists (
      select 1
      from public.profiles
      where profiles.user_id = profile_filter_options.profile_user_id
        and profiles.visibility = 'public'
        and profiles.published_at is not null
    )
  );

create policy "Users can assign their own enabled filter options"
  on public.profile_filter_options for insert
  to authenticated
  with check (
    (select auth.uid()) = profile_user_id
    and exists (
      select 1
      from public.maker_filter_options
      where maker_filter_options.id = filter_option_id
        and maker_filter_options.enabled
    )
  );

create policy "Users can remove their own filter options"
  on public.profile_filter_options for delete
  to authenticated
  using ((select auth.uid()) = profile_user_id);

grant select on public.maker_filter_options, public.profile_filter_options to anon, authenticated;
grant insert, delete on public.profile_filter_options to authenticated;

insert into public.maker_filter_options (category, label, slug, sort_order)
values
  ('maker_type', 'Model Makers', 'model-makers', 1),
  ('maker_type', 'Prop/Cosplay', 'prop-cosplay', 2),
  ('maker_type', 'Electronics Makers', 'electronics-makers', 3),
  ('maker_type', 'Print Services', 'print-services', 4),
  ('fandom', 'Star Wars', 'star-wars', 1),
  ('fandom', 'Marvel', 'marvel', 2),
  ('fandom', 'DC', 'dc', 3),
  ('fandom', 'Halo', 'halo', 4),
  ('fandom', 'Warhammer', 'warhammer', 5),
  ('fandom', 'Anime', 'anime', 6),
  ('fandom', 'Historical / Military', 'historical-military', 7),
  ('availability', 'Commissions Open', 'commissions-open', 1)
on conflict (category, slug) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    enabled = true;
