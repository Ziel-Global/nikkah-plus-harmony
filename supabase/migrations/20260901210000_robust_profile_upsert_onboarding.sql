-- 1. Bulletproof handle_new_auth_user trigger function to guarantee profile creation
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_phone text;
BEGIN
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');

  -- Check if phone is already taken by another profile to avoid unique constraint failure
  IF v_phone IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE phone = v_phone AND id <> new.id) THEN
    v_phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, phone, gender, role)
  VALUES (
    new.id,
    new.email,
    v_phone,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'gender', '')), ''),
    null
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback insert without phone if any metadata formatting issue occurs
  BEGIN
    INSERT INTO public.profiles (id, email, gender, role)
    VALUES (new.id, new.email, null, null)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN new;
END;
$function$;

-- 2. Update set_onboarding_gender RPC to use UPSERT and set trusted onboarding flag
CREATE OR REPLACE FUNCTION public.set_onboarding_gender(p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
BEGIN
  IF p_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'Invalid gender specified.';
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated.';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Set transaction-scoped trusted onboarding flag
  PERFORM set_config('app.in_onboarding', 'true', true);

  -- Perform UPSERT to guarantee profile row exists and receives gender/role
  INSERT INTO public.profiles (id, email, gender, role)
  VALUES (
    v_user_id,
    COALESCE(v_user_email, ''),
    p_gender,
    CASE WHEN p_gender = 'female' THEN 'female_user'::public.user_role ELSE 'male_user'::public.user_role END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    gender = EXCLUDED.gender,
    role = CASE WHEN EXCLUDED.gender = 'female' THEN 'female_user'::public.user_role ELSE 'male_user'::public.user_role END;
END;
$$;

-- Set execution permissions cleanly
REVOKE EXECUTE ON FUNCTION public.set_onboarding_gender(text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_onboarding_gender(text) TO anon, authenticated, service_role;

-- 3. Update profile protection trigger to allow initial onboarding role assignment via RPC
CREATE OR REPLACE FUNCTION public.protect_profile_restricted_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_in_onboarding boolean;
BEGIN
  v_in_onboarding := (current_setting('app.in_onboarding', true) = 'true');

  -- Allow role assignment ONLY during trusted onboarding RPC call when OLD.role IS NULL or on initial INSERT
  IF v_in_onboarding AND (OLD.role IS NULL OR TG_OP = 'INSERT') AND NEW.role IN ('male_user'::public.user_role, 'female_user'::public.user_role) THEN
    NULL;
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
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
