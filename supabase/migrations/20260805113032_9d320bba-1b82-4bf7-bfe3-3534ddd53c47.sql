create or replace function public.get_match_contact_state(p_request_id uuid)
returns table(
  my_consent boolean,
  their_consent boolean,
  both_consented boolean,
  my_name text,
  my_phone text,
  my_email text,
  their_name text,
  their_phone text,
  their_email text
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  req record;
  other_id uuid;
  mine boolean;
  theirs boolean;
begin
  select * into req from public.interest_requests where id = p_request_id;
  if req.id is null or auth.uid() not in (req.requester_id, req.target_id) then
    raise exception 'This match is not available to you.';
  end if;
  if req.status <> 'active_match' then
    raise exception 'Contact sharing is only available while a match is active.';
  end if;

  other_id := case when req.requester_id = auth.uid() then req.target_id else req.requester_id end;

  select exists (select 1 from public.contact_consents c where c.request_id = p_request_id and c.user_id = auth.uid()) into mine;
  select exists (select 1 from public.contact_consents c where c.request_id = p_request_id and c.user_id = other_id) into theirs;

  my_consent := mine;
  their_consent := theirs;
  both_consented := mine and theirs;

  if both_consented then
    select mp.display_name, p.phone, p.email
      into my_name, my_phone, my_email
    from public.profiles p
    left join public.marriage_profiles mp on mp.user_id = p.id
    where p.id = auth.uid();

    select mp.display_name, p.phone, p.email
      into their_name, their_phone, their_email
    from public.profiles p
    left join public.marriage_profiles mp on mp.user_id = p.id
    where p.id = other_id;
  end if;

  return next;
end;
$$;

revoke execute on function public.get_match_contact_state(uuid) from public, anon;
grant execute on function public.get_match_contact_state(uuid) to authenticated;