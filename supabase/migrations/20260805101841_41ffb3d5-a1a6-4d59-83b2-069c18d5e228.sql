-- 1. Restrict public-read policies to authenticated users
DROP POLICY IF EXISTS "mp_select_approved_public" ON public.marriage_profiles;
CREATE POLICY "mp_select_approved_authenticated" ON public.marriage_profiles
  FOR SELECT TO authenticated USING (status = 'approved'::profile_status_enum);

DROP POLICY IF EXISTS "photos_select_public_approved" ON public.profile_photos;
CREATE POLICY "photos_select_public_approved" ON public.profile_photos
  FOR SELECT TO authenticated USING (
    visibility = 'public' AND profile_id IN (
      SELECT mp.id FROM public.marriage_profiles mp WHERE mp.status = 'approved'::profile_status_enum
    )
  );

DROP POLICY IF EXISTS "mosques_select_all" ON public.mosques;
CREATE POLICY "mosques_select_authenticated" ON public.mosques
  FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.mosques FROM anon;
REVOKE SELECT ON public.marriage_profiles FROM anon;
REVOKE SELECT ON public.profile_photos FROM anon;

-- 2. Lock down search_path on remaining functions
ALTER FUNCTION public.enforce_match_exclusivity() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- 3. Remove direct API execute access to SECURITY DEFINER / internal functions
REVOKE EXECUTE ON FUNCTION public.close_match_on_dual_feedback() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_affiliation_before_submit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_match_exclusivity() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_interest_request_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public."current_role"() FROM anon, authenticated;
-- is_super_admin() and my_mosque_ids() are referenced inside RLS policies, so signed-in
-- users must retain EXECUTE for those policies to evaluate. Anonymous access is revoked.
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_mosque_ids() FROM anon;