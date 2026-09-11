-- Allow mosque admins to view profiles of users who have requested affiliation
CREATE POLICY "profiles_select_affiliation_pending"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mosque_affiliation_requests mar
    WHERE mar.user_id = id
    AND mar.mosque_id IN (SELECT my_mosque_ids())
  )
);
