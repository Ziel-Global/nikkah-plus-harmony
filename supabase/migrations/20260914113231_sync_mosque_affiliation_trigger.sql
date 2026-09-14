CREATE OR REPLACE FUNCTION public.sync_mosque_affiliation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    UPDATE public.profiles SET mosque_id = NEW.mosque_id WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_affiliation_approved ON public.mosque_affiliation_requests;
CREATE TRIGGER on_affiliation_approved
AFTER UPDATE ON public.mosque_affiliation_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_mosque_affiliation();

-- Backfill stuck users
UPDATE public.profiles p
SET mosque_id = a.mosque_id
FROM public.mosque_affiliation_requests a
WHERE p.id = a.user_id AND a.status = 'approved' AND p.mosque_id IS NULL;
