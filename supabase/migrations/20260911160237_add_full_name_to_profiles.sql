ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_phone text;
  v_full_name text;
BEGIN
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  v_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  -- Check if phone is already taken by another profile to avoid unique constraint failure
  IF v_phone IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE phone = v_phone AND id <> new.id) THEN
    v_phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, phone, gender, role, full_name)
  VALUES (
    new.id,
    new.email,
    v_phone,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'gender', '')), ''),
    null,
    v_full_name
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback insert without phone if any metadata formatting issue occurs
  BEGIN
    INSERT INTO public.profiles (id, email, gender, role, full_name)
    VALUES (new.id, new.email, null, null, v_full_name)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN new;
END;
$function$;
