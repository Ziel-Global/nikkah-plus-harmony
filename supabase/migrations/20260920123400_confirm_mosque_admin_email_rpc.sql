-- Allow superadmin to auto-confirm a newly created admin's email
CREATE OR REPLACE FUNCTION public.confirm_mosque_admin_email(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_actor_role text;
BEGIN
  -- 1. Ensure caller is super_admin
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  IF v_actor_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only super administrators can confirm emails manually.';
  END IF;

  -- 2. Confirm the email in auth.users
  UPDATE auth.users 
  SET email_confirmed_at = now() 
  WHERE email = p_email AND email_confirmed_at IS NULL;

END;
$$;
