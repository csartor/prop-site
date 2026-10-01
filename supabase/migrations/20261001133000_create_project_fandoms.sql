create table public.project_fandoms (
  project_id uuid not null references public.projects (id) on delete cascade,
  filter_option_id uuid not null references public.maker_filter_options (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, filter_option_id)
);

create index project_fandoms_option_project_idx
  on public.project_fandoms (filter_option_id, project_id);

alter table public.project_fandoms enable row level security;

create policy "Public or owner project fandoms are readable"
  on public.project_fandoms for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = project_fandoms.project_id
        and (
          projects.visibility = 'public'
          or projects.user_id = (select auth.uid())
        )
    )
  );

create policy "Owners can assign enabled fandoms"
  on public.project_fandoms for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.projects
      where projects.id = project_fandoms.project_id
        and projects.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.maker_filter_options
      where maker_filter_options.id = project_fandoms.filter_option_id
        and maker_filter_options.category = 'fandom'
        and maker_filter_options.enabled
    )
  );

create policy "Owners can remove their project fandoms"
  on public.project_fandoms for delete
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = project_fandoms.project_id
        and projects.user_id = (select auth.uid())
    )
  );

grant select on public.project_fandoms to anon, authenticated;
grant insert, delete on public.project_fandoms to authenticated;
