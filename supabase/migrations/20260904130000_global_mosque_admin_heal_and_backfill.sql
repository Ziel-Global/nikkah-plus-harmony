-- Global Mosque Admin Data Backfill & Self-Healing Trigger

DO $$
DECLARE
  r RECORD;
  v_mosque_id UUID;
BEGIN
  -- Set override flag to bypass RLS restrictions during backfill
  PERFORM set_config('app.in_admin_assignment', 'true', true);

  -- 1. Backfill all auth users who are intended to be mosque admins:
  --    - metadata role = 'mosque_admin'
  --    - email matches a mosque contact_email
  --    - already linked in mosque_admin_mosques
  FOR r IN (
    SELECT 
      u.id AS user_id, 
      u.email AS user_email,
      u.raw_user_meta_data ->> 'mosque_id' AS meta_mosque_id,
      m.id AS contact_mosque_id
    FROM auth.users u
    LEFT JOIN public.mosques m ON lower(m.contact_email) = lower(u.email)
    WHERE u.raw_user_meta_data ->> 'role' = 'mosque_admin'
       OR m.id IS NOT NULL
       OR EXISTS (SELECT 1 FROM public.mosque_admin_mosques mam WHERE mam.admin_id = u.id)
  ) LOOP
    -- Determine target mosque_id
    v_mosque_id := NULL;
    IF r.meta_mosque_id IS NOT NULL THEN
      BEGIN
        v_mosque_id := r.meta_mosque_id::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_mosque_id := NULL;
      END;
    END IF;

    IF v_mosque_id IS NULL THEN
      v_mosque_id := r.contact_mosque_id;
    END IF;

    IF v_mosque_id IS NULL THEN
      SELECT mosque_id INTO v_mosque_id 
      FROM public.mosque_admin_mosques 
      WHERE admin_id = r.user_id 
      LIMIT 1;
    END IF;

    -- Ensure profile exists with role = 'mosque_admin'
    INSERT INTO public.profiles (id, email, role, mosque_id)
    VALUES (r.user_id, r.user_email, 'mosque_admin'::public.user_role, v_mosque_id)
    ON CONFLICT (id) DO UPDATE
    SET role = 'mosque_admin'::public.user_role,
        mosque_id = COALESCE(public.profiles.mosque_id, EXCLUDED.mosque_id);

    -- Ensure link in mosque_admin_mosques exists
    IF v_mosque_id IS NOT NULL THEN
      INSERT INTO public.mosque_admin_mosques (admin_id, mosque_id, assigned_by)
      VALUES (r.user_id, v_mosque_id, r.user_id)
      ON CONFLICT (admin_id, mosque_id) DO NOTHING;
    END IF;

    -- Sync raw_user_meta_data
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', 'mosque_admin') || 
      CASE WHEN v_mosque_id IS NOT NULL THEN jsonb_build_object('mosque_id', v_mosque_id::text) ELSE '{}'::jsonb END
    WHERE id = r.user_id;

  END LOOP;
END;
$$;

-- 2. Enhanced handle_new_auth_user trigger to match mosque contact_email if role not explicitly passed
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
BEGIN
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  v_meta_role := nullif(trim(coalesce(new.raw_user_meta_data ->> 'role', '')), '');
  v_meta_mosque_id := nullif(trim(coalesce(new.raw_user_meta_data ->> 'mosque_id', '')), '');

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

NOTIFY pgrst, 'reload schema';
