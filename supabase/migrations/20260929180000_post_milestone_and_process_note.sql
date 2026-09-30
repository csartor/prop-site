alter table public.posts
  add column milestone text,
  add column process_note text;

alter table public.posts
  add constraint posts_milestone_length
    check (milestone is null or char_length(btrim(milestone)) between 1 and 40),
  add constraint posts_process_note_length
    check (process_note is null or char_length(btrim(process_note)) between 1 and 160);
