GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.mosques TO anon, authenticated;
GRANT ALL ON public.mosques TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.mosque_affiliation_requests TO authenticated;
GRANT ALL ON public.mosque_affiliation_requests TO service_role;