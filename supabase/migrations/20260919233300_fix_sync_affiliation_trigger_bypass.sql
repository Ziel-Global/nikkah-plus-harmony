-- Make the sync_mosque_affiliation trigger bypass the profile protection trigger
CREATE OR REPLACE FUNCTION public.sync_mosque_affiliation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Temporarily set the admin assignment flag so the profile trigger allows this update
    PERFORM set_config('app.in_admin_assignment', 'true', true);
    
    UPDATE public.profiles SET mosque_id = NEW.mosque_id WHERE id = NEW.user_id;
    
    -- Clear the flag
    PERFORM set_config('app.in_admin_assignment', '', true);
  END IF;
  RETURN NEW;
END;
$$;
