-- 1. Create/replace profile restriction trigger function with narrow onboarding exception
CREATE OR REPLACE FUNCTION public.protect_profile_restricted_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Narrow Exception for Initial Onboarding:
  -- Allow assigning role ONLY when current role is NULL (unassigned) and target role is male_user or female_user.
  IF OLD.role IS NULL AND NEW.role IN ('male_user'::public.user_role, 'female_user'::public.user_role) THEN
    -- Initial onboarding role assignment allowed
    NULL;
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Blocking changes to any already-assigned role
    RAISE EXCEPTION 'You cannot change your own role, account status, or mosque affiliation directly.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Account status and Mosque affiliation protection remain 100% unchanged
  IF NEW.account_status IS DISTINCT FROM OLD.account_status OR NEW.mosque_id IS DISTINCT FROM OLD.mosque_id THEN
    RAISE EXCEPTION 'You cannot change your own role, account status, or mosque affiliation directly.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Bind/Rebind BEFORE UPDATE trigger to public.profiles
DROP TRIGGER IF EXISTS protect_profile_restricted_fields_trigger ON public.profiles;
DROP TRIGGER IF EXISTS prevent_profile_restricted_updates_trigger ON public.profiles;

CREATE TRIGGER protect_profile_restricted_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_restricted_fields();
