-- Create SECURITY DEFINER function to verify photo access permissions for photo signing
CREATE OR REPLACE FUNCTION public.get_accessible_photo_urls(p_user_id uuid, p_paths text[])
RETURNS TABLE (photo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ph.photo_url
  FROM public.profile_photos ph
  JOIN public.marriage_profiles mp ON mp.id = ph.profile_id
  WHERE ph.photo_url = ANY(p_paths)
    AND (
      mp.user_id = p_user_id
      OR (ph.visibility = 'public' AND mp.status = 'approved')
      OR EXISTS (
        SELECT 1 FROM public.interest_requests ir
        JOIN public.contact_consents cc1 ON cc1.request_id = ir.id AND cc1.user_id = p_user_id
        JOIN public.contact_consents cc2 ON cc2.request_id = ir.id AND cc2.user_id = mp.user_id
        WHERE (ir.requester_id = p_user_id AND ir.target_id = mp.user_id)
           OR (ir.requester_id = mp.user_id AND ir.target_id = p_user_id)
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_accessible_photo_urls(uuid, text[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_accessible_photo_urls(uuid, text[]) TO authenticated, service_role;
