-- 1. Restore the correct handle_new_auth_user logic and include full_name
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
  v_contact_mosque_id uuid;
  v_full_name text;
BEGIN
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  v_meta_role := nullif(trim(coalesce(new.raw_user_meta_data ->> 'role', '')), '');
  v_meta_mosque_id := nullif(trim(coalesce(new.raw_user_meta_data ->> 'mosque_id', '')), '');
  v_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  -- Check if user's email matches an existing mosque's contact email
  IF new.email IS NOT NULL THEN
    SELECT id INTO v_contact_mosque_id
    FROM public.mosques
    WHERE lower(contact_email) = lower(new.email)
    LIMIT 1;
  END IF;

  -- Safely parse role: allow mosque_admin, or if email matches a mosque contact email
  IF v_meta_role = 'mosque_admin' OR v_contact_mosque_id IS NOT NULL THEN
    v_role := 'mosque_admin'::public.user_role;
  ELSIF v_meta_role IN ('male_user', 'female_user') THEN
    v_role := v_meta_role::public.user_role;
  ELSE
    v_role := NULL;
  END IF;

  -- Parse mosque_id if present, or fallback to contact_mosque_id
  IF v_meta_mosque_id IS NOT NULL THEN
    BEGIN
      v_mosque_id := v_meta_mosque_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_mosque_id := v_contact_mosque_id;
    END;
  ELSE
    v_mosque_id := v_contact_mosque_id;
  END IF;

  -- Check if phone is already taken by another profile
  IF v_phone IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE phone = v_phone AND id <> new.id) THEN
    v_phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, phone, gender, role, mosque_id, full_name)
  VALUES (
    new.id,
    new.email,
    v_phone,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'gender', '')), ''),
    v_role,
    v_mosque_id,
    v_full_name
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    mosque_id = COALESCE(public.profiles.mosque_id, EXCLUDED.mosque_id),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  -- Automatically insert mosque_admin_mosques record if mosque_admin role and mosque_id are present
  IF v_role = 'mosque_admin'::public.user_role AND v_mosque_id IS NOT NULL THEN
    INSERT INTO public.mosque_admin_mosques (admin_id, mosque_id, assigned_by)
    VALUES (new.id, v_mosque_id, new.id)
    ON CONFLICT (admin_id, mosque_id) DO NOTHING;
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.profiles (id, email, gender, role, mosque_id, full_name)
    VALUES (new.id, new.email, null, v_role, v_mosque_id, v_full_name)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        role = COALESCE(public.profiles.role, EXCLUDED.role),
        mosque_id = COALESCE(public.profiles.mosque_id, EXCLUDED.mosque_id),
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN new;
END;
$function$;

-- 2. Update set_onboarding_gender to also grab full_name from auth.users just in case it creates the profile
CREATE OR REPLACE FUNCTION public.set_onboarding_gender(p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_full_name text;
BEGIN
  IF p_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'Invalid gender specified.';
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated.';
  END IF;

  SELECT email, nullif(trim(coalesce(raw_user_meta_data ->> 'full_name', '')), '') 
  INTO v_user_email, v_full_name 
  FROM auth.users WHERE id = v_user_id;

  -- Set transaction-scoped trusted onboarding flag
  PERFORM set_config('app.in_onboarding', 'true', true);

  -- Perform UPSERT to guarantee profile row exists and receives gender/role
  INSERT INTO public.profiles (id, email, gender, role, full_name)
  VALUES (
    v_user_id,
    COALESCE(v_user_email, ''),
    p_gender,
    CASE WHEN p_gender = 'female' THEN 'female_user'::public.user_role ELSE 'male_user'::public.user_role END,
    v_full_name
  )
  ON CONFLICT (id) DO UPDATE
  SET
    gender = EXCLUDED.gender,
    role = CASE WHEN EXCLUDED.gender = 'female' THEN 'female_user'::public.user_role ELSE 'male_user'::public.user_role END,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
END;
$$;
