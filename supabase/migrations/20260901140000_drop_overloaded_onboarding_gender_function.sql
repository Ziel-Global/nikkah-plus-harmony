-- Explicitly drop obsolete two-argument overloaded versions of set_onboarding_gender
DROP FUNCTION IF EXISTS public.set_onboarding_gender(uuid, text);
DROP FUNCTION IF EXISTS public.set_onboarding_gender(text, uuid);

-- Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
