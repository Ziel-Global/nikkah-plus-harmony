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
    coalesce(
      (new.raw_user_meta_data ->> 'role')::user_role,
      (case when new.raw_user_meta_data ->> 'gender' = 'female'
            then 'female_user' else 'male_user' end)::user_role
    )
  );
  return new;
end;
$function$;