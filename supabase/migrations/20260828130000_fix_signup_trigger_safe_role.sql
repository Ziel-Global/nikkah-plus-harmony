-- Fix handle_new_auth_user trigger to safely handle NULL or unassigned role metadata without enum errors
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
      v_user_role := null;
    end;
  else
    v_user_role := null;
  end if;

  insert into public.profiles (id, email, phone, gender, role)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'gender'), ''),
    v_user_role
  );
  return new;
end;
$function$;
