create table public.account_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('buyer', 'maker')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.buyer_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  category text not null,
  description text not null check (char_length(description) between 20 and 5000),
  intent text not null check (intent in ('wearable', 'display_only', 'either')),
  finish_tier text not null check (finish_tier in ('raw', 'paint_ready', 'display', 'screen_accurate')),
  deadline date not null,
  budget_min_cents integer not null check (budget_min_cents >= 0),
  budget_max_cents integer not null check (budget_max_cents >= budget_min_cents),
  buyer_location text not null,
  fulfillment_method text not null check (fulfillment_method in ('shipping', 'pickup', 'either')),
  measurements text,
  functionality_needs text,
  file_ownership text not null check (file_ownership in ('none', 'own_stl', 'licensed_stl', 'custom_files')),
  contact_name text not null,
  contact_email text not null,
  contact_method text not null check (contact_method in ('email', 'discord', 'instagram')),
  contact_handle text,
  status text not null default 'new' check (status in ('new', 'in_review', 'matched', 'closed')),
  review_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.buyer_request_references (
  id uuid primary key default gen_random_uuid(),
  buyer_request_id uuid not null references public.buyer_requests (id) on delete cascade,
  kind text not null check (kind in ('url', 'upload')),
  value text not null,
  sort_order smallint not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table public.maker_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  maker_name text not null check (char_length(maker_name) between 2 and 160),
  location text not null,
  contact_email text not null,
  contact_links text[] not null default '{}',
  service_categories text[] not null check (cardinality(service_categories) > 0),
  process_tags text[] not null default '{}',
  lead_time_days smallint not null check (lead_time_days between 1 and 730),
  budget_min_cents integer not null check (budget_min_cents >= 0),
  budget_max_cents integer not null check (budget_max_cents >= budget_min_cents),
  service_regions text[] not null check (cardinality(service_regions) > 0),
  declined_jobs text,
  specialties_notes text,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected', 'needs_follow_up')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maker_application_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  maker_application_id uuid not null references public.maker_applications (id) on delete cascade,
  kind text not null check (kind in ('url', 'upload')),
  value text not null,
  caption text,
  sort_order smallint not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index buyer_requests_owner_created_idx
  on public.buyer_requests (buyer_user_id, created_at desc);
create index buyer_request_references_request_idx
  on public.buyer_request_references (buyer_request_id, sort_order);
create index maker_applications_review_status_idx
  on public.maker_applications (review_status, created_at desc);
create index maker_application_portfolio_application_idx
  on public.maker_application_portfolio_items (maker_application_id, sort_order);

create function public.set_buyer_request_defaults()
returns trigger
language plpgsql
as $$
begin
  new.status := 'new';
  new.review_flags := array_remove(array[
    case when new.deadline <= current_date + 21 then 'urgent' end,
    case when new.fulfillment_method = 'pickup' then 'local_only' end,
    case when new.budget_max_cents < 15000 and new.finish_tier in ('display', 'screen_accurate') then 'unrealistic_budget' end
  ], null);
  new.updated_at := now();
  return new;
end;
$$;

create trigger buyer_requests_set_defaults
before insert or update on public.buyer_requests
for each row execute function public.set_buyer_request_defaults();

create function public.set_maker_application_defaults()
returns trigger
language plpgsql
as $$
begin
  new.review_status := 'pending';
  new.updated_at := now();
  return new;
end;
$$;

create trigger maker_applications_set_defaults
before insert or update on public.maker_applications
for each row execute function public.set_maker_application_defaults();

alter table public.account_roles enable row level security;
alter table public.buyer_requests enable row level security;
alter table public.buyer_request_references enable row level security;
alter table public.maker_applications enable row level security;
alter table public.maker_application_portfolio_items enable row level security;

create policy "Users can read their own role"
  on public.account_roles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own role"
  on public.account_roles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Buyers can manage their own requests"
  on public.buyer_requests for all to authenticated
  using ((select auth.uid()) = buyer_user_id)
  with check ((select auth.uid()) = buyer_user_id);
create policy "Buyers can manage their own references"
  on public.buyer_request_references for all to authenticated
  using (buyer_request_id in (
    select id from public.buyer_requests where buyer_user_id = (select auth.uid())
  ))
  with check (buyer_request_id in (
    select id from public.buyer_requests where buyer_user_id = (select auth.uid())
  ));

create policy "Makers can manage their own application"
  on public.maker_applications for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Makers can manage their own portfolio"
  on public.maker_application_portfolio_items for all to authenticated
  using (maker_application_id in (
    select id from public.maker_applications where user_id = (select auth.uid())
  ))
  with check (maker_application_id in (
    select id from public.maker_applications where user_id = (select auth.uid())
  ));

grant select, insert, update, delete on public.account_roles, public.buyer_requests,
  public.buyer_request_references, public.maker_applications,
  public.maker_application_portfolio_items to authenticated;

insert into storage.buckets (id, name, public)
values ('buyer-request-references', 'buyer-request-references', false),
       ('maker-application-portfolio', 'maker-application-portfolio', false)
on conflict (id) do nothing;

create policy "Users can access their request reference uploads"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'buyer-request-references'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'buyer-request-references'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can access their application portfolio uploads"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'maker-application-portfolio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'maker-application-portfolio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
