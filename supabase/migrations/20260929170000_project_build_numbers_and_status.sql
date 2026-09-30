create sequence public.projects_build_number_seq as integer start with 412;

alter table public.projects
  add column build_number integer;

with numbered as (
  select
    id,
    411 + row_number() over (order by created_at, id) as build_number
  from public.projects
)
update public.projects as project
set build_number = numbered.build_number
from numbered
where project.id = numbered.id;

select setval(
  'public.projects_build_number_seq',
  greatest(coalesce((select max(build_number) from public.projects), 411), 411)
);

alter table public.projects
  alter column build_number set default nextval('public.projects_build_number_seq'),
  alter column build_number set not null;

alter sequence public.projects_build_number_seq owned by public.projects.build_number;

alter table public.projects
  add constraint projects_build_number_key unique (build_number);

alter table public.projects
  drop column build_code;

do $$
declare
  constraint_name text;
begin
  select con.conname
  into constraint_name
  from pg_constraint as con
  join pg_class as rel on rel.oid = con.conrelid
  join pg_namespace as nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'projects'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%status%';

  if constraint_name is not null then
    execute format('alter table public.projects drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.projects
  add constraint projects_status_check
  check (status in ('in_progress', 'completed', 'paused', 'cancelled'));

grant usage, select on sequence public.projects_build_number_seq to authenticated;
