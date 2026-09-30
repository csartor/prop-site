create function public.posts_tags_valid(tags text[])
returns boolean
language sql
immutable
as $$
  select cardinality(tags) <= 10
    and not exists (
      select 1
      from unnest(tags) as tag
      where char_length(btrim(tag)) not between 1 and 40
    );
$$;

revoke all on function public.posts_tags_valid(text[]) from public;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  tags text[] not null default '{}' check (public.posts_tags_valid(tags)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null check (char_length(storage_path) between 1 and 500),
  sort_order integer not null check (sort_order >= 0),
  unique (post_id, sort_order)
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_user_id_idx on public.posts (user_id);
create index post_images_post_id_sort_idx on public.post_images (post_id, sort_order);

create function public.posts_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.posts_set_updated_at();

alter table public.posts enable row level security;
alter table public.post_images enable row level security;

create policy "Posts are publicly visible"
  on public.posts for select
  to anon, authenticated
  using (true);

create policy "Users can create their own posts"
  on public.posts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Post images are publicly visible"
  on public.post_images for select
  to anon, authenticated
  using (true);

create policy "Users can add images to their posts"
  on public.post_images for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.posts
      where posts.id = post_images.post_id
        and posts.user_id = (select auth.uid())
    )
  );

create policy "Users can update images on their posts"
  on public.post_images for update
  to authenticated
  using (
    exists (
      select 1
      from public.posts
      where posts.id = post_images.post_id
        and posts.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.posts
      where posts.id = post_images.post_id
        and posts.user_id = (select auth.uid())
    )
  );

create policy "Users can delete images from their posts"
  on public.post_images for delete
  to authenticated
  using (
    exists (
      select 1
      from public.posts
      where posts.id = post_images.post_id
        and posts.user_id = (select auth.uid())
    )
  );

grant select on public.posts, public.post_images to anon, authenticated;
grant insert, update, delete on public.posts, public.post_images to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-assets',
  'post-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
);

create policy "Post assets are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'post-assets');

create policy "Users can upload their post assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their post assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'post-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their post assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
