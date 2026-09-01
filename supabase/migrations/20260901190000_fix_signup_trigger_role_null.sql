-- Update handle_new_auth_user trigger function to explicitly insert role = NULL and gender = NULL upon initial sign-up
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
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'gender'), ''),
    null
  );
  RETURN new;
END;
$function$;

-- Notify PostgREST schema cache to refresh
NOTIFY pgrst, 'reload schema';
