-- Fix handle_new_auth_user trigger to never insert NULL into NOT NULL role column
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_role_text text;
  v_user_role public.user_role;
begin
  v_role_text := nullif(trim(new.raw_user_meta_data ->> 'role'), '');
  
  if v_role_text is not null then
    begin
      v_user_role := v_role_text::public.user_role;
    exception when others then
      v_user_role := 'male_user'::public.user_role;
    end;
  else
    v_user_role := 'male_user'::public.user_role;
  end if;

  insert into public.profiles (id, email, phone, gender, role)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'gender'), ''),
    coalesce(v_user_role, 'male_user'::public.user_role)
  );
  return new;
end;
$function$;

-- Ensure set_onboarding_gender RPC function is available for smooth gender & role update
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
GRANT EXECUTE ON FUNCTION public.set_onboarding_gender(text) TO authenticated, service_role;
