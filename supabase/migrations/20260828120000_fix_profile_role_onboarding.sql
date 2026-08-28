-- 1. Update handle_new_auth_user trigger function to keep role NULL when gender is not set at signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, gender, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'gender',
    (new.raw_user_meta_data ->> 'role')::user_role
  );
  return new;
end;
$function$;

-- 2. Create Security Definer RPC function to safely set onboarding gender & role for current user
CREATE OR REPLACE FUNCTION public.set_onboarding_gender(p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'Invalid gender specified.';
  END IF;

  UPDATE public.profiles
  SET
    gender = p_gender,
    role = CASE WHEN p_gender = 'female' THEN 'female_user'::user_role ELSE 'male_user'::user_role END
  WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_onboarding_gender(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_onboarding_gender(text) TO authenticated;
