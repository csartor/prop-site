alter table public.buyer_requests
  add column routing_status text not null default 'new'
    check (routing_status in ('new', 'reviewed', 'routed', 'quoted', 'selected', 'lost', 'completed')),
  add column selected_maker_user_id uuid references auth.users (id) on delete set null,
  add column loss_reason text,
  add column completed_at timestamptz;

create index buyer_requests_routing_status_idx
  on public.buyer_requests (routing_status, created_at desc);
create index buyer_requests_filters_idx
  on public.buyer_requests (category, buyer_location, deadline, budget_max_cents);
create index buyer_requests_selected_maker_idx
  on public.buyer_requests (selected_maker_user_id)
  where selected_maker_user_id is not null;

create table public.request_assignments (
  id uuid primary key default gen_random_uuid(),
  buyer_request_id uuid not null references public.buyer_requests (id) on delete cascade,
  maker_user_id uuid not null references auth.users (id) on delete cascade,
  assigned_by uuid not null references auth.users (id),
  invite_status text not null default 'sent'
    check (invite_status in ('sent', 'opened', 'quoted', 'declined', 'expired')),
  quote_deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_request_id, maker_user_id)
);

create index request_assignments_request_idx
  on public.request_assignments (buyer_request_id, created_at);
create index request_assignments_maker_idx
  on public.request_assignments (maker_user_id, invite_status, created_at desc);

create table public.request_admin_notes (
  id uuid primary key default gen_random_uuid(),
  buyer_request_id uuid not null references public.buyer_requests (id) on delete cascade,
  author_user_id uuid not null references auth.users (id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index request_admin_notes_request_idx
  on public.request_admin_notes (buyer_request_id, created_at desc);

create table public.request_quotes (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.request_assignments (id) on delete cascade,
  buyer_request_id uuid not null references public.buyer_requests (id) on delete cascade,
  maker_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'submitted')),
  price_min_cents integer check (price_min_cents is null or price_min_cents >= 0),
  price_max_cents integer check (price_max_cents is null or price_max_cents >= price_min_cents),
  turnaround_days smallint check (turnaround_days is null or turnaround_days between 1 and 730),
  scope_included text not null default '',
  exclusions text not null default '',
  assumptions text not null default '',
  questions text not null default '',
  shipping_notes text not null default '',
  rush_fee_cents integer check (rush_fee_cents is null or rush_fee_cents >= 0),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'draft' or (
    price_min_cents is not null
    and price_max_cents is not null
    and turnaround_days is not null
    and char_length(scope_included) > 0
  ))
);

create index request_quotes_request_idx
  on public.request_quotes (buyer_request_id, status, submitted_at);
create index request_quotes_maker_idx
  on public.request_quotes (maker_user_id, status, updated_at desc);

create or replace function public.set_routing_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger request_assignments_set_updated_at
before update on public.request_assignments
for each row execute function public.set_routing_updated_at();

create trigger request_quotes_set_updated_at
before update on public.request_quotes
for each row execute function public.set_routing_updated_at();

create or replace function public.sync_request_quote_lifecycle()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'submitted' and (
    tg_op = 'INSERT'
    or (tg_op = 'UPDATE' and old.status is distinct from 'submitted')
  ) then
    new.submitted_at := coalesce(new.submitted_at, now());
    update public.request_assignments
      set invite_status = 'quoted'
      where id = new.assignment_id;
    update public.buyer_requests
      set routing_status = case
        when routing_status in ('new', 'reviewed', 'routed') then 'quoted'
        else routing_status
      end,
      updated_at = now()
      where id = new.buyer_request_id;
  end if;
  return new;
end;
$$;

create trigger request_quotes_sync_lifecycle
before insert or update on public.request_quotes
for each row execute function public.sync_request_quote_lifecycle();

alter table public.request_assignments enable row level security;
alter table public.request_admin_notes enable row level security;
alter table public.request_quotes enable row level security;

create policy "Admins manage request assignments"
  on public.request_assignments for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Makers read their assignments"
  on public.request_assignments for select to authenticated
  using ((select auth.uid()) = maker_user_id);
create policy "Makers update their assignment status"
  on public.request_assignments for update to authenticated
  using ((select auth.uid()) = maker_user_id)
  with check ((select auth.uid()) = maker_user_id);

create policy "Admins manage request notes"
  on public.request_admin_notes for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()) and (select auth.uid()) = author_user_id);

create policy "Admins manage request quotes"
  on public.request_quotes for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Makers manage their own quotes"
  on public.request_quotes for all to authenticated
  using ((select auth.uid()) = maker_user_id)
  with check (
    (select auth.uid()) = maker_user_id
    and exists (
      select 1 from public.request_assignments assignment
      where assignment.id = assignment_id
        and assignment.maker_user_id = (select auth.uid())
    )
  );

create policy "Buyers read selected quotes"
  on public.request_quotes for select to authenticated
  using (
    exists (
      select 1 from public.buyer_requests request
      where request.id = buyer_request_id
        and request.buyer_user_id = (select auth.uid())
        and request.selected_maker_user_id = maker_user_id
    )
  );

create policy "Admins manage routing fields"
  on public.buyer_requests for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update, delete on public.request_assignments,
  public.request_admin_notes, public.request_quotes to authenticated;

create view public.maker_assignment_briefs
with (security_barrier = true)
as
select
  assignment.id as assignment_id,
  assignment.maker_user_id,
  assignment.invite_status,
  assignment.quote_deadline,
  assignment.created_at as assigned_at,
  request.id as buyer_request_id,
  request.title,
  request.category,
  request.description,
  request.intent,
  request.finish_tier,
  request.deadline,
  request.budget_min_cents,
  request.budget_max_cents,
  request.buyer_location,
  request.fulfillment_method,
  request.measurements,
  request.functionality_needs,
  request.created_at
from public.request_assignments assignment
join public.buyer_requests request on request.id = assignment.buyer_request_id
where assignment.maker_user_id = (select auth.uid());

grant select on public.maker_assignment_briefs to authenticated;
