drop policy if exists "Profiles are publicly visible when published"
  on public.profiles;
drop policy if exists "Users can view their own profile"
  on public.profiles;

create policy "Public or owner profile reads"
  on public.profiles for select
  to anon, authenticated
  using (
    (visibility = 'public' and published_at is not null)
    or (select auth.uid()) = user_id
  );
