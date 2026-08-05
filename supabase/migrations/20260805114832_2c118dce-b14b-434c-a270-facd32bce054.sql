drop policy if exists feedback_select_participant on public.match_feedback;
create policy feedback_select_own on public.match_feedback
for select to authenticated
using (user_id = auth.uid());

create or replace function public.get_match_feedback_state(p_request_id uuid)
returns table(
  my_submitted boolean,
  my_outcome feedback_outcome_enum,
  my_notes text,
  their_submitted boolean,
  both_submitted boolean,
  request_status request_status_enum
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  req record;
  other_id uuid;
  mine record;
begin
  select * into req from public.interest_requests where id = p_request_id;
  if req.id is null or auth.uid() not in (req.requester_id, req.target_id) then
    raise exception 'This match is not available to you.';
  end if;

  other_id := case when req.requester_id = auth.uid() then req.target_id else req.requester_id end;

  select f.feedback_outcome, f.feedback_notes into mine
  from public.match_feedback f
  where f.request_id = p_request_id and f.user_id = auth.uid()
  limit 1;

  my_submitted := mine.feedback_outcome is not null;
  my_outcome := mine.feedback_outcome;
  my_notes := mine.feedback_notes;
  their_submitted := exists (
    select 1 from public.match_feedback f
    where f.request_id = p_request_id and f.user_id = other_id
  );
  both_submitted := my_submitted and their_submitted;
  request_status := req.status;

  return next;
end;
$$;

revoke execute on function public.get_match_feedback_state(uuid) from public, anon;
grant execute on function public.get_match_feedback_state(uuid) to authenticated;