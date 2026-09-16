alter table public.patreon_memberships
  add column if not exists campaign_details jsonb;
