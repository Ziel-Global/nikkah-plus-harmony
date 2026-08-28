-- Enable DELETE on public.profiles for authenticated users
GRANT DELETE ON public.profiles TO authenticated;

-- RLS Policy allowing super_admin users to delete profiles
DROP POLICY IF EXISTS "profiles_superadmin_delete" ON public.profiles;
CREATE POLICY "profiles_superadmin_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- RPC Function: delete_user_profile
-- Permanently cleans up all profile associations, records, and auth user account.
CREATE OR REPLACE FUNCTION public.delete_user_profile(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_role text;
  v_profile_ids uuid[];
BEGIN
  -- 1. Security check: Only super_admin or the account owner can delete
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'super_admin' AND auth.uid() <> target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can delete user profiles.';
  END IF;

  -- 2. Fetch associated marriage profile IDs
  SELECT ARRAY(
    SELECT id FROM public.marriage_profiles WHERE user_id = target_user_id
  ) INTO v_profile_ids;

  -- 3. Delete dependent rows in child tables
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  DELETE FROM public.profile_photos WHERE profile_id = ANY(v_profile_ids);
  DELETE FROM public.wali_details WHERE profile_id = ANY(v_profile_ids);
  DELETE FROM public.contact_consents WHERE user_id = target_user_id;
  DELETE FROM public.match_feedback WHERE user_id = target_user_id;
  DELETE FROM public.conduct_reports WHERE reported_by = target_user_id OR reported_profile_id = ANY(v_profile_ids);
  DELETE FROM public.account_flags WHERE user_id = target_user_id OR reviewed_by = target_user_id;
  DELETE FROM public.escalations WHERE raised_by = target_user_id OR mosque_admin_id = target_user_id;
  DELETE FROM public.interest_requests WHERE requester_id = target_user_id OR target_id = target_user_id;
  DELETE FROM public.mosque_affiliation_requests WHERE user_id = target_user_id OR reviewed_by = target_user_id;
  DELETE FROM public.mosque_admin_mosques WHERE admin_id = target_user_id OR assigned_by = target_user_id;
  DELETE FROM public.marriage_profiles WHERE user_id = target_user_id;

  -- 4. Anonymize activity log references
  UPDATE public.activity_logs SET actor_id = NULL WHERE actor_id = target_user_id;

  -- 5. Delete public profile
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 6. Delete auth user
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Security grant for RPC
REVOKE ALL ON FUNCTION public.delete_user_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_profile(uuid) TO authenticated, service_role;
