-- Allow trusted updates (SECURITY DEFINER) or super_admin to bypass profile protection trigger
CREATE OR REPLACE FUNCTION public.protect_profile_restricted_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_in_onboarding boolean;
  v_in_admin_assignment boolean;
  v_actor_role text;
BEGIN
  -- 1. Trust updates made to OTHER profiles (which must be via SECURITY DEFINER, or super_admin).
  -- Normal users can't update others due to RLS. If RLS allows it, we trust it.
  IF auth.uid() IS DISTINCT FROM NEW.id THEN
    RETURN NEW;
  END IF;

  -- 2. Let super_admin bypass everything, even for their own profile
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  IF v_actor_role = 'super_admin' THEN
    RETURN NEW;
  END IF;

  v_in_onboarding := (current_setting('app.in_onboarding', true) = 'true');
  v_in_admin_assignment := (current_setting('app.in_admin_assignment', true) = 'true');

  -- 3. Allow role assignment during admin assignment OR when assigning mosque_admin OR trusted onboarding RPC
  IF v_in_admin_assignment THEN
    NULL;
  ELSIF (OLD.role IS NULL OR TG_OP = 'INSERT') AND NEW.role = 'mosque_admin'::public.user_role THEN
    NULL;
  ELSIF v_in_onboarding AND (OLD.role IS NULL OR TG_OP = 'INSERT') AND NEW.role IN ('male_user'::public.user_role, 'female_user'::public.user_role) THEN
    NULL;
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'You cannot change your own role, account status, or mosque affiliation directly.'
      USING ERRCODE = 'P0001';
  END IF;

  -- 4. Account status & Mosque affiliation protection
  IF NOT v_in_admin_assignment AND OLD.role IS NOT NULL AND OLD.role <> 'mosque_admin'::public.user_role AND (NEW.account_status IS DISTINCT FROM OLD.account_status OR NEW.mosque_id IS DISTINCT FROM OLD.mosque_id) THEN
    RAISE EXCEPTION 'You cannot change your own role, account status, or mosque affiliation directly.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;
