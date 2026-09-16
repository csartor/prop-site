create or replace function public.set_buyer_request_defaults()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'new';
  end if;
  new.review_flags := array_remove(array[
    case when new.deadline <= current_date + 21 then 'urgent' end,
    case when new.fulfillment_method = 'pickup' then 'local_only' end,
    case when new.budget_max_cents < 15000 and new.finish_tier in ('display', 'screen_accurate') then 'unrealistic_budget' end
  ], null);
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.set_maker_application_defaults()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.review_status := 'pending';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
