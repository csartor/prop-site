create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null check (char_length(btrim(description)) between 1 and 2000),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  tags text[] not null default '{}' check (public.posts_tags_valid(tags)),
  started_on date,
  completed_on date,
  material text check (material is null or char_length(btrim(material)) between 1 and 200),
  scale text check (scale is null or char_length(btrim(scale)) between 1 and 200),
  techniques text check (techniques is null or char_length(btrim(techniques)) between 1 and 200),
  tools text check (tools is null or char_length(btrim(tools)) between 1 and 200),
  build_code text not null unique
    default ('BLD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4))),
  cover_path text check (cover_path is null or char_length(cover_path) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts
  add column project_id uuid references public.projects (id) on delete set null;

create index projects_user_id_idx on public.projects (user_id, created_at desc);
create index posts_project_id_idx on public.posts (project_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.posts_set_updated_at();

alter table public.projects enable row level security;

create policy "Public projects are visible"
  on public.projects for select
  to anon, authenticated
  using (visibility = 'public');

create policy "Users can view their own projects"
  on public.projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own projects"
  on public.projects for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy "Users can create their own posts" on public.posts;
drop policy "Users can update their own posts" on public.posts;

create policy "Users can create their own posts"
  on public.posts for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      project_id is null
      or exists (
        select 1
        from public.projects
        where projects.id = posts.project_id
          and projects.user_id = (select auth.uid())
      )
    )
  );

create policy "Users can update their own posts"
  on public.posts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      project_id is null
      or exists (
        select 1
        from public.projects
        where projects.id = posts.project_id
          and projects.user_id = (select auth.uid())
      )
    )
  );

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
