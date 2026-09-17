alter table public.makers
  drop constraint makers_description_check;

alter table public.makers
  add constraint makers_description_check
  check (char_length(description) between 20 and 1000);
