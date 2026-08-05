GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enforce_affiliation_before_submit() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enforce_match_exclusivity() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.notify_on_interest_request_change() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.close_match_on_dual_feedback() TO authenticated, service_role;