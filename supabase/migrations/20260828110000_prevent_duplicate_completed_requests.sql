-- Update send_interest_request to block duplicate requests even after completion or closure
CREATE OR REPLACE FUNCTION public.send_interest_request(p_profile_id uuid, p_message text default null)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me record;
  target record;
  new_id uuid;
BEGIN
  SELECT p.id, p.gender, p.mosque_id INTO me
  FROM public.profiles p WHERE p.id = auth.uid();

  IF me.id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to send an interest request.';
  END IF;

  SELECT mp.user_id, pr.gender, pr.mosque_id INTO target
  FROM public.marriage_profiles mp
  JOIN public.profiles pr ON pr.id = mp.user_id
  WHERE mp.id = p_profile_id
    AND mp.status = 'approved'
    AND pr.account_status = 'active';

  IF target.user_id IS NULL THEN
    RAISE EXCEPTION 'This profile is no longer available.';
  END IF;

  IF target.gender IS NULL OR me.gender IS NULL OR target.gender = me.gender THEN
    RAISE EXCEPTION 'This profile is not available to you.';
  END IF;

  -- Block new requests if any previous request exists between these two members (submitted, active, completed, closed, or cancelled)
  IF EXISTS (
    SELECT 1 FROM public.interest_requests
    WHERE (requester_id = me.id AND target_id = target.user_id)
       OR (requester_id = target.user_id AND target_id = me.id)
  ) THEN
    RAISE EXCEPTION 'An introduction request or completed match already exists between you and this member.';
  END IF;

  INSERT INTO public.interest_requests
    (requester_id, target_id, requester_mosque_id, target_mosque_id, message, status)
  VALUES (me.id, target.user_id, me.mosque_id, target.mosque_id, nullif(btrim(coalesce(p_message, '')), ''), 'submitted')
  RETURNING id INTO new_id;

  -- Create in-app notification for recipient
  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (
    target.user_id,
    'New Introduction Request',
    'A member has sent you an introduction request. Check your Interest Requests to view details.',
    'interest_request',
    jsonb_build_object('request_id', new_id, 'requester_id', me.id)
  );

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_interest_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_interest_request(uuid, text) TO authenticated, service_role;
