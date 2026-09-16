create table if not exists public.maker_nominations (
  id uuid primary key default gen_random_uuid(),
  submitter_user_id uuid not null references auth.users (id) on delete cascade,
  relationship text not null check (relationship in ('self', 'recommendation')),
  contact_email text not null,
  maker_name text not null check (char_length(maker_name) between 2 and 160),
  descriptor text not null check (char_length(descriptor) between 2 and 200),
  description text not null check (char_length(description) between 20 and 400),
  location text not null check (char_length(location) between 2 and 160),
  website_url text,
  instagram_url text,
  patreon_url text,
  facebook_url text,
  accepting_commissions boolean not null default false,
  thumbnail_path text,
  terms_confirmed boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submitter_user_id)
);

create table if not exists public.maker_nomination_fandoms (
  nomination_id uuid not null references public.maker_nominations (id) on delete cascade,
  filter_option_id uuid not null references public.maker_filter_options (id) on delete restrict,
  primary key (nomination_id, filter_option_id)
);

create index if not exists maker_nominations_submitter_idx
  on public.maker_nominations (submitter_user_id);

alter table public.maker_nominations enable row level security;
alter table public.maker_nomination_fandoms enable row level security;

create policy "Users can read their nominations"
  on public.maker_nominations for select
  to authenticated
  using ((select auth.uid()) = submitter_user_id);

create policy "Users can create nomination drafts"
  on public.maker_nominations for insert
  to authenticated
  with check (
    (select auth.uid()) = submitter_user_id
    and status = 'draft'
  );

create policy "Users can update their draft nominations"
  on public.maker_nominations for update
  to authenticated
  using (
    (select auth.uid()) = submitter_user_id
    and status = 'draft'
  )
  with check (
    (select auth.uid()) = submitter_user_id
    and status in ('draft', 'submitted')
  );

create policy "Users can read their nomination fandoms"
  on public.maker_nomination_fandoms for select
  to authenticated
  using (
    exists (
      select 1 from public.maker_nominations
      where maker_nominations.id = maker_nomination_fandoms.nomination_id
        and maker_nominations.submitter_user_id = (select auth.uid())
    )
  );

create policy "Users can manage their draft nomination fandoms"
  on public.maker_nomination_fandoms for all
  to authenticated
  using (
    exists (
      select 1 from public.maker_nominations
      where maker_nominations.id = maker_nomination_fandoms.nomination_id
        and maker_nominations.submitter_user_id = (select auth.uid())
        and maker_nominations.status = 'draft'
    )
  )
  with check (
    exists (
      select 1
      from public.maker_nominations
      join public.maker_filter_options
        on maker_filter_options.id = maker_nomination_fandoms.filter_option_id
      where maker_nominations.id = maker_nomination_fandoms.nomination_id
        and maker_nominations.submitter_user_id = (select auth.uid())
        and maker_nominations.status = 'draft'
        and maker_filter_options.category = 'fandom'
        and maker_filter_options.enabled
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'maker-nomination-assets',
  'maker-nomination-assets',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their nomination assets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'maker-nomination-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can upload their nomination assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'maker-nomination-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can update their nomination assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'maker-nomination-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'maker-nomination-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can delete their nomination assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'maker-nomination-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

grant select, insert, update on public.maker_nominations to authenticated;
grant select, insert, update, delete on public.maker_nomination_fandoms to authenticated;
