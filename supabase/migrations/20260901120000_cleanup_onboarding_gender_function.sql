-- 1. Safely drop obsolete overloaded function versions
DROP FUNCTION IF EXISTS public.set_onboarding_gender(uuid, text);
DROP FUNCTION IF EXISTS public.set_onboarding_gender(text);

-- 2. Create single canonical SECURITY DEFINER set_onboarding_gender function
CREATE OR REPLACE FUNCTION public.set_onboarding_gender(p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'Invalid gender specified.';
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated.';
  END IF;

  UPDATE public.profiles
  SET
    gender = p_gender,
    role = CASE WHEN p_gender = 'female' THEN 'female_user'::public.user_role ELSE 'male_user'::public.user_role END
  WHERE id = v_user_id;
END;
$$;

-- 3. Set execution permissions cleanly
REVOKE EXECUTE ON FUNCTION public.set_onboarding_gender(text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_onboarding_gender(text) TO anon, authenticated, service_role;

-- 4. Notify PostgREST schema cache to refresh
NOTIFY pgrst, 'reload schema';
