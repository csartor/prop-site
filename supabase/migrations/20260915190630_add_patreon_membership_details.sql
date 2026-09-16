alter table public.patreon_memberships
  add column if not exists campaign_description text,
  add column if not exists campaign_is_monthly boolean,
  add column if not exists campaign_pledge_url text,
  add column if not exists tier_description text,
  add column if not exists last_charge_date timestamptz,
  add column if not exists last_charge_status text,
  add column if not exists lifetime_support_cents integer,
  add column if not exists is_follower boolean;
