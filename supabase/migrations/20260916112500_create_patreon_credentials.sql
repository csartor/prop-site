create table if not exists public.patreon_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  updated_at timestamptz not null default now()
);

alter table public.patreon_credentials enable row level security;

create policy "Users can read their encrypted Patreon credentials"
  on public.patreon_credentials for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their encrypted Patreon credentials"
  on public.patreon_credentials for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their encrypted Patreon credentials"
  on public.patreon_credentials for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.patreon_credentials to authenticated;
