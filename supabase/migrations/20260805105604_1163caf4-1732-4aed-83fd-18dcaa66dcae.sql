create or replace function public.send_interest_request(p_profile_id uuid, p_message text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me record;
  target record;
  new_id uuid;
begin
  select p.id, p.gender, p.mosque_id into me
  from public.profiles p where p.id = auth.uid();

  if me.id is null then
    raise exception 'You must be signed in to send an interest request.';
  end if;

  select mp.user_id, pr.gender, pr.mosque_id into target
  from public.marriage_profiles mp
  join public.profiles pr on pr.id = mp.user_id
  where mp.id = p_profile_id
    and mp.status = 'approved'
    and pr.account_status = 'active';

  if target.user_id is null then
    raise exception 'This profile is no longer available.';
  end if;

  if target.gender is null or me.gender is null or target.gender = me.gender then
    raise exception 'This profile is not available to you.';
  end if;

  if exists (
    select 1 from public.interest_requests
    where status in ('submitted', 'active_match', 'awaiting_feedback_female', 'awaiting_feedback_male')
      and ((requester_id = me.id and target_id = target.user_id)
        or (requester_id = target.user_id and target_id = me.id))
  ) then
    raise exception 'There is already an open request between you and this member.';
  end if;

  insert into public.interest_requests
    (requester_id, target_id, requester_mosque_id, target_mosque_id, message, status)
  values (me.id, target.user_id, me.mosque_id, target.mosque_id, nullif(btrim(coalesce(p_message, '')), ''), 'submitted')
  returning id into new_id;

  return new_id;
end;
$$;

revoke execute on function public.send_interest_request(uuid, text) from public, anon;
grant execute on function public.send_interest_request(uuid, text) to authenticated, service_role;