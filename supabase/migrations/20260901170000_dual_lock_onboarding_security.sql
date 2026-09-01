-- 1. Update set_onboarding_gender RPC to set a transaction-scoped trusted onboarding flag
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

  -- Set transaction-scoped configuration flag (3rd parameter true = is_local to current transaction)
  PERFORM set_config('app.in_onboarding', 'true', true);

  UPDATE public.profiles
  SET
    gender = p_gender,
    role = CASE WHEN p_gender = 'female' THEN 'female_user'::public.user_role ELSE 'male_user'::public.user_role END
  WHERE id = v_user_id;
END;
$$;

-- Ensure permissions are set cleanly for canonical set_onboarding_gender(text)
REVOKE EXECUTE ON FUNCTION public.set_onboarding_gender(text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_onboarding_gender(text) TO anon, authenticated, service_role;

-- 2. Update profile protection trigger to verify trusted onboarding flag + OLD.role IS NULL
CREATE OR REPLACE FUNCTION public.protect_profile_restricted_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_in_onboarding boolean;
BEGIN
  v_in_onboarding := (current_setting('app.in_onboarding', true) = 'true');

  -- Role protection logic:
  -- Allow initial assignment ONLY if coming from trusted set_onboarding_gender RPC (app.in_onboarding = 'true')
  -- AND current role is NULL AND target role is male_user or female_user.
  IF v_in_onboarding AND OLD.role IS NULL AND NEW.role IN ('male_user'::public.user_role, 'female_user'::public.user_role) THEN
    -- Trusted onboarding role assignment permitted
    NULL;
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Any direct REST API update or change to an existing role is strictly blocked
    RAISE EXCEPTION 'You cannot change your own role, account status, or mosque affiliation directly.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Account status & Mosque affiliation protection remain 100% untouched
  IF NEW.account_status IS DISTINCT FROM OLD.account_status OR NEW.mosque_id IS DISTINCT FROM OLD.mosque_id THEN
    RAISE EXCEPTION 'You cannot change your own role, account status, or mosque affiliation directly.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- Rebind trigger to public.profiles
DROP TRIGGER IF EXISTS protect_profile_restricted_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_restricted_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_restricted_fields();

-- Notify PostgREST schema cache to refresh
NOTIFY pgrst, 'reload schema';
