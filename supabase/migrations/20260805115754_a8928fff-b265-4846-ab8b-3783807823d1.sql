create or replace function public.escalation_in_my_mosque(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.interest_requests ir
    where ir.id = p_request_id
      and (ir.requester_mosque_id in (select public.my_mosque_ids())
        or ir.target_mosque_id in (select public.my_mosque_ids()))
  );
$$;

revoke execute on function public.escalation_in_my_mosque(uuid) from public, anon;
grant execute on function public.escalation_in_my_mosque(uuid) to authenticated;

create policy "escalation_select_mosque_admin" on public.escalations
for select to authenticated
using (public.escalation_in_my_mosque(request_id));

create policy "escalation_update_mosque_admin" on public.escalations
for update to authenticated
using (public.escalation_in_my_mosque(request_id))
with check (public.escalation_in_my_mosque(request_id));

create policy "mosques_update_mosque_admin" on public.mosques
for update to authenticated
using (id in (select public.my_mosque_ids()))
with check (id in (select public.my_mosque_ids()));