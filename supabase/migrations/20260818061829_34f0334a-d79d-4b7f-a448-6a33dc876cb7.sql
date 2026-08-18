create or replace function public.close_match_on_dual_feedback()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  req record;
  fb_count int;
  both_mutual boolean;
begin
  select * into req from public.interest_requests where id = new.request_id;

  select count(*) into fb_count
  from public.match_feedback
  where request_id = new.request_id
    and user_id in (req.requester_id, req.target_id);

  if fb_count = 2 then
    select bool_and(feedback_outcome = 'mutual_agreement') into both_mutual
    from public.match_feedback
    where request_id = new.request_id
      and user_id in (req.requester_id, req.target_id);

    update public.interest_requests
    set status = (case when both_mutual then 'closed_mutual' else 'closed_declined' end)::request_status_enum,
        responded_at = now()
    where id = new.request_id;
  end if;

  return new;
end;
$function$;