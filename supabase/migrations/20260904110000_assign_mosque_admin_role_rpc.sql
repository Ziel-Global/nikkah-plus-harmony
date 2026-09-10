-- 1. Create SECURITY DEFINER function allowing Super Admin to assign mosque_admin role & mosque_id
CREATE OR REPLACE FUNCTION public.assign_mosque_admin_role(p_user_id uuid, p_mosque_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role text;
BEGIN
  -- Verify actor is super_admin
  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_actor_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Only super administrators can assign mosque admin roles.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Set transaction-scoped admin assignment flag to pass profile protection trigger
  PERFORM set_config('app.in_admin_assignment', 'true', true);

  -- Update profiles setting mosque_admin role and mosque_id
  UPDATE public.profiles
  SET role = 'mosque_admin'::public.user_role,
      mosque_id = p_mosque_id
  WHERE id = p_user_id;

  -- Ensure mosque_admin_mosques mapping exists
  INSERT INTO public.mosque_admin_mosques (admin_id, mosque_id, assigned_by)
  VALUES (p_user_id, p_mosque_id, auth.uid())
  ON CONFLICT (admin_id, mosque_id) DO NOTHING;
END;
$$;

-- 2. Update protect_profile_restricted_fields function to respect admin assignment flag
CREATE OR REPLACE FUNCTION public.protect_profile_restricted_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_in_onboarding boolean;
  v_in_admin_assignment boolean;
BEGIN
  v_in_onboarding := (current_setting('app.in_onboarding', true) = 'true');
  v_in_admin_assignment := (current_setting('app.in_admin_assignment', true) = 'true');

  -- Allow role assignment during admin assignment OR trusted onboarding RPC
  IF v_in_admin_assignment THEN
    NULL;
  ELSIF v_in_onboarding AND (OLD.role IS NULL OR TG_OP = 'INSERT') AND NEW.role IN ('male_user'::public.user_role, 'female_user'::public.user_role) THEN
    NULL;
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'You cannot change your own role, account status, or mosque affiliation directly.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Account status & Mosque affiliation protection (allow under admin assignment)
  IF NOT v_in_admin_assignment AND (NEW.account_status IS DISTINCT FROM OLD.account_status OR NEW.mosque_id IS DISTINCT FROM OLD.mosque_id) THEN
    RAISE EXCEPTION 'You cannot change your own role, account status, or mosque affiliation directly.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- Grant execution permissions
REVOKE EXECUTE ON FUNCTION public.assign_mosque_admin_role(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_mosque_admin_role(uuid, uuid) TO authenticated, service_role;

-- Notify PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
