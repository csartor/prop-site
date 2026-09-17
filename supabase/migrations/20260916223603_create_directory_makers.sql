create table public.makers (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null unique references public.maker_nominations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,63}$'),
  display_name text not null check (char_length(display_name) between 2 and 160),
  descriptor text not null check (char_length(descriptor) between 2 and 200),
  description text not null check (char_length(description) between 20 and 400),
  location text not null check (char_length(location) between 2 and 160),
  website_url text,
  instagram_url text,
  patreon_url text,
  facebook_url text,
  accepting_commissions boolean not null default false,
  thumbnail_path text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maker_fandoms (
  maker_id uuid not null references public.makers (id) on delete cascade,
  filter_option_id uuid not null references public.maker_filter_options (id) on delete restrict,
  primary key (maker_id, filter_option_id)
);

create index makers_published_at_idx
  on public.makers (published_at desc)
  where published_at is not null;
create index maker_fandoms_filter_maker_idx
  on public.maker_fandoms (filter_option_id, maker_id);

alter table public.makers enable row level security;
alter table public.maker_fandoms enable row level security;

create policy "Published makers are publicly visible"
  on public.makers for select
  to anon, authenticated
  using (published_at is not null);

create policy "Admins can manage makers"
  on public.makers for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Published maker fandoms are publicly visible"
  on public.maker_fandoms for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.makers
      where makers.id = maker_fandoms.maker_id
        and makers.published_at is not null
    )
  );

create policy "Admins can manage maker fandoms"
  on public.maker_fandoms for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.makers, public.maker_fandoms to anon, authenticated;
grant insert, update, delete on public.makers, public.maker_fandoms to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'maker-assets',
  'maker-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
);

create policy "Admins can create maker assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'maker-assets'
    and (select public.is_admin())
  );

create policy "Admins can update maker assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'maker-assets'
    and (select public.is_admin())
  )
  with check (
    bucket_id = 'maker-assets'
    and (select public.is_admin())
  );

create policy "Admins can delete maker assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'maker-assets'
    and (select public.is_admin())
  );
