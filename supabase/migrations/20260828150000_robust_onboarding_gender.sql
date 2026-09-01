-- 1. Drop NOT NULL constraint on public.profiles.role so initial registration can have role = NULL
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- 2. Update handle_new_auth_user trigger function to keep role & gender NULL upon initial sign-up
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, phone, gender, role)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'gender'), ''),
    null
  );
  return new;
end;
$function$;

-- 3. Create Security Definer RPC function taking explicit user_id to set gender & role during onboarding
CREATE OR REPLACE FUNCTION public.set_onboarding_gender(p_user_id uuid, p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_target_id uuid;
BEGIN
  IF p_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'Invalid gender specified.';
  END IF;

  v_target_id := COALESCE(p_user_id, auth.uid());
  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be provided.';
  END IF;

  UPDATE public.profiles
  SET
    gender = p_gender,
    role = CASE WHEN p_gender = 'female' THEN 'female_user'::public.user_role ELSE 'male_user'::public.user_role END
  WHERE id = v_target_id;
END;
$$;

-- Also support single argument version for backward compatibility
CREATE OR REPLACE FUNCTION public.set_onboarding_gender(p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.set_onboarding_gender(auth.uid(), p_gender);
END;
$$;

-- Grant execution permissions to anon, authenticated, and service_role
REVOKE EXECUTE ON FUNCTION public.set_onboarding_gender(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_onboarding_gender(uuid, text) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.set_onboarding_gender(text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_onboarding_gender(text) TO anon, authenticated, service_role;
