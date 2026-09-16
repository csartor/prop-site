create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  bio text,
  location text,
  avatar_url text,
  specialties text[] not null default '{}',
  workshop_tools text[] not null default '{}',
  favorite_materials text[] not null default '{}',
  experience_level text,
  accepting_commissions boolean not null default false,
  open_to_collaboration boolean not null default false,
  twitter_handle text,
  instagram_handle text,
  github_handle text,
  website_url text,
  youtube_url text,
  visibility text not null default 'public'
    check (visibility in ('public', 'unlisted')),
  onboarding_step smallint not null default 1
    check (onboarding_step between 1 and 4),
  onboarding_completed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9][a-z0-9_-]{2,49}$')
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly visible when published"
  on public.profiles for select
  to anon, authenticated
  using (visibility = 'public' and published_at is not null);

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.profiles to anon, authenticated;
