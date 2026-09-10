-- 1. Update handle_new_auth_user() to natively set role = 'mosque_admin' and mosque_id when passed in metadata
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_phone text;
  v_meta_role text;
  v_meta_mosque_id text;
  v_role public.user_role;
  v_mosque_id uuid;
BEGIN
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  v_meta_role := nullif(trim(coalesce(new.raw_user_meta_data ->> 'role', '')), '');
  v_meta_mosque_id := nullif(trim(coalesce(new.raw_user_meta_data ->> 'mosque_id', '')), '');

  -- Safely parse role: allow mosque_admin, otherwise default to NULL for onboarding
  IF v_meta_role = 'mosque_admin' THEN
    v_role := 'mosque_admin'::public.user_role;
  ELSIF v_meta_role IN ('male_user', 'female_user') THEN
    v_role := v_meta_role::public.user_role;
  ELSE
    v_role := NULL;
  END IF;

  -- Parse mosque_id if present
  IF v_meta_mosque_id IS NOT NULL THEN
    BEGIN
      v_mosque_id := v_meta_mosque_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_mosque_id := NULL;
    END;
  ELSE
    v_mosque_id := NULL;
  END IF;

  -- Check if phone is already taken by another profile to avoid unique constraint failure
  IF v_phone IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE phone = v_phone AND id <> new.id) THEN
    v_phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, phone, gender, role, mosque_id)
  VALUES (
    new.id,
    new.email,
    v_phone,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'gender', '')), ''),
    v_role,
    v_mosque_id
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    mosque_id = COALESCE(public.profiles.mosque_id, EXCLUDED.mosque_id);

  -- Automatically insert mosque_admin_mosques record if mosque_admin role and mosque_id are present
  IF v_role = 'mosque_admin'::public.user_role AND v_mosque_id IS NOT NULL THEN
    INSERT INTO public.mosque_admin_mosques (admin_id, mosque_id, assigned_by)
    VALUES (new.id, v_mosque_id, new.id)
    ON CONFLICT (admin_id, mosque_id) DO NOTHING;
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.profiles (id, email, gender, role, mosque_id)
    VALUES (new.id, new.email, null, v_role, v_mosque_id)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        role = COALESCE(public.profiles.role, EXCLUDED.role),
        mosque_id = COALESCE(public.profiles.mosque_id, EXCLUDED.mosque_id);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN new;
END;
$function$;

-- 2. Update protect_profile_restricted_fields to allow setting mosque_admin role and mosque_id
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

  -- Allow role assignment during admin assignment OR when assigning mosque_admin OR trusted onboarding RPC
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

  -- Account status & Mosque affiliation protection
  IF NOT v_in_admin_assignment AND OLD.role IS NOT NULL AND OLD.role <> 'mosque_admin'::public.user_role AND (NEW.account_status IS DISTINCT FROM OLD.account_status OR NEW.mosque_id IS DISTINCT FROM OLD.mosque_id) THEN
    RAISE EXCEPTION 'You cannot change your own role, account status, or mosque affiliation directly.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Data Repair: Repair existing Mosque Admin profiles stuck with role = NULL
DO $$
DECLARE
  r record;
BEGIN
  -- Set transaction-scoped admin assignment flag to bypass triggers
  PERFORM set_config('app.in_admin_assignment', 'true', true);

  FOR r IN (
    SELECT mam.admin_id, mam.mosque_id
    FROM public.mosque_admin_mosques mam
    JOIN public.profiles p ON p.id = mam.admin_id
    WHERE p.role IS NULL OR p.role <> 'mosque_admin'::public.user_role
  ) LOOP
    UPDATE public.profiles
    SET role = 'mosque_admin'::public.user_role,
        mosque_id = r.mosque_id
    WHERE id = r.admin_id;
  END LOOP;
END;
$$;

-- Notify PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
