-- Allow superadmin to update a mosque admin's password
CREATE OR REPLACE FUNCTION public.update_mosque_admin_password(p_mosque_id uuid, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_admin_user_id uuid;
  v_actor_role text;
BEGIN
  -- 1. Ensure the caller is a super_admin
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  IF v_actor_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only super administrators can reset passwords.';
  END IF;

  -- 2. Find the mosque admin for this mosque
  SELECT id INTO v_admin_user_id 
  FROM public.profiles 
  WHERE mosque_id = p_mosque_id AND role = 'mosque_admin' 
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No mosque admin found for this mosque.';
  END IF;

  -- 3. Update the password in auth.users
  UPDATE auth.users 
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_admin_user_id;

END;
$$;
