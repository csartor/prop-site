create table if not exists public.patreon_memberships (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  patreon_membership_id text not null,
  campaign_id text not null,
  campaign_name text,
  tier_name text,
  patron_status text,
  is_paid boolean not null default false,
  entitled_amount_cents integer,
  tier_amount_cents integer,
  synced_at timestamptz not null default now(),
  unique (user_id, patreon_membership_id)
);

alter table public.patreon_memberships enable row level security;

drop policy if exists "Users can view their own Patreon memberships"
  on public.patreon_memberships;
create policy "Users can view their own Patreon memberships"
  on public.patreon_memberships for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own Patreon memberships"
  on public.patreon_memberships;
create policy "Users can insert their own Patreon memberships"
  on public.patreon_memberships for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Patreon memberships"
  on public.patreon_memberships;
create policy "Users can update their own Patreon memberships"
  on public.patreon_memberships for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own Patreon memberships"
  on public.patreon_memberships;
create policy "Users can delete their own Patreon memberships"
  on public.patreon_memberships for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.patreon_memberships to authenticated;
grant usage, select
  on sequence public.patreon_memberships_id_seq to authenticated;
