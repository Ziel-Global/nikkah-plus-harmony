-- Allow superadmin to update a mosque admin's password or create a new admin
CREATE OR REPLACE FUNCTION public.set_mosque_admin_credentials(p_mosque_id uuid, p_email text, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_actor_role text;
  v_existing_user_id uuid;
BEGIN
  -- 1. Ensure caller is super_admin
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  IF v_actor_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only super administrators can set credentials.';
  END IF;

  -- 2. Check if the user already exists in auth.users
  SELECT id INTO v_existing_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_existing_user_id IS NOT NULL THEN
    -- User exists, update their password if provided
    IF p_password IS NOT NULL AND p_password != '' THEN
      UPDATE auth.users 
      SET encrypted_password = crypt(p_password, gen_salt('bf'))
      WHERE id = v_existing_user_id;
    END IF;
  ELSE
    -- User does not exist, create them in auth.users
    IF p_password IS NULL OR p_password = '' THEN
      RAISE EXCEPTION 'A password is required when creating a new mosque admin.';
    END IF;

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
      p_email, crypt(p_password, gen_salt('bf')), now(), 
      now(), now(), '{"provider": "email", "providers": ["email"]}', '{}', false
    );
    -- The handle_new_auth_user trigger will automatically create their profile and link them to the mosque.
  END IF;
END;
$$;
