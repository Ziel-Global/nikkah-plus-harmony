
create or replace function public.list_my_interest_requests()
returns table(
  id uuid,
  direction text,
  status request_status_enum,
  message text,
  created_at timestamptz,
  responded_at timestamptz,
  counterpart_profile_id uuid,
  counterpart_name text,
  counterpart_age int,
  counterpart_city text,
  counterpart_country text,
  counterpart_mosque_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ir.id,
    case when ir.requester_id = auth.uid() then 'sent' else 'received' end as direction,
    ir.status,
    ir.message,
    ir.created_at,
    ir.responded_at,
    mp.id,
    mp.display_name,
    case when mp.date_of_birth is null then null
         else date_part('year', age(mp.date_of_birth))::int end,
    mp.city,
    mp.country,
    m.name
  from public.interest_requests ir
  join public.profiles other
    on other.id = case when ir.requester_id = auth.uid() then ir.target_id else ir.requester_id end
  left join public.marriage_profiles mp on mp.user_id = other.id
  left join public.mosques m on m.id = other.mosque_id
  where auth.uid() in (ir.requester_id, ir.target_id)
  order by ir.created_at desc;
$$;

create or replace function public.respond_to_interest_request(p_request_id uuid, p_accept boolean)
returns request_status_enum
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
  new_status request_status_enum;
begin
  select * into req from public.interest_requests where id = p_request_id;

  if req.id is null then
    raise exception 'This request is no longer available.';
  end if;

  if req.target_id <> auth.uid() then
    raise exception 'Only the member who received this request can respond to it.';
  end if;

  if req.status <> 'submitted' then
    raise exception 'This request has already been answered.';
  end if;

  if p_accept then
    if exists (
      select 1 from public.interest_requests
      where status = 'active_match'
        and (requester_id in (req.requester_id, req.target_id)
          or target_id in (req.requester_id, req.target_id))
    ) then
      raise exception 'You or the other member already has an active match right now.';
    end if;
    new_status := 'active_match';
  else
    new_status := 'closed_declined';
  end if;

  update public.interest_requests
  set status = new_status, responded_at = now()
  where id = p_request_id;

  return new_status;
end;
$$;

revoke all on function public.list_my_interest_requests() from public, anon;
revoke all on function public.respond_to_interest_request(uuid, boolean) from public, anon;
grant execute on function public.list_my_interest_requests() to authenticated;
grant execute on function public.respond_to_interest_request(uuid, boolean) to authenticated;
