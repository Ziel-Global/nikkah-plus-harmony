-- Automatically delete the old mosque admin account when the mosque's contact email is changed
CREATE OR REPLACE FUNCTION public.handle_mosque_contact_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  -- Only trigger if the email actually changed and the old email existed
  IF NEW.contact_email IS DISTINCT FROM OLD.contact_email AND OLD.contact_email IS NOT NULL THEN
    -- Delete the old admin user from auth.users (which cascades to public.profiles)
    DELETE FROM auth.users WHERE email = OLD.contact_email;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_mosque_contact_email_change ON public.mosques;
CREATE TRIGGER on_mosque_contact_email_change
AFTER UPDATE OF contact_email ON public.mosques
FOR EACH ROW
EXECUTE FUNCTION public.handle_mosque_contact_email_change();
