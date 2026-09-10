-- Make handle_new_auth_user database trigger function resilient with ON CONFLICT and EXCEPTION WHEN OTHERS fallback handling
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, phone, gender, role)
  VALUES (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'gender', '')), ''),
    null
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log warning and return new so auth.users creation always succeeds smoothly
  RAISE WARNING 'handle_new_auth_user exception: %', SQLERRM;
  RETURN new;
END;
$function$;

-- Notify PostgREST schema cache to refresh
NOTIFY pgrst, 'reload schema';
