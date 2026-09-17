alter table public.makers
  add column maker_type_option_id uuid
    references public.maker_filter_options (id) on delete set null;

create index makers_maker_type_option_id_idx
  on public.makers (maker_type_option_id)
  where published_at is not null;
