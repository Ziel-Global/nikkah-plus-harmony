CREATE TABLE public.profile_rejection_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.marriage_profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profile_rejection_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rejection history for their mosques"
ON public.profile_rejection_history FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.marriage_profiles mp
    JOIN public.profiles p ON p.id = mp.user_id
    WHERE mp.id = profile_rejection_history.profile_id
    AND p.mosque_id IN (SELECT my_mosque_ids())
  )
);

CREATE POLICY "Users can view their own rejection history"
ON public.profile_rejection_history FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.marriage_profiles mp
    WHERE mp.id = profile_rejection_history.profile_id
    AND mp.user_id = auth.uid()
  )
);

CREATE POLICY "Superadmins can view all rejection history"
ON public.profile_rejection_history FOR SELECT TO authenticated
USING (is_super_admin());

CREATE POLICY "Admins can insert rejection history"
ON public.profile_rejection_history FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.marriage_profiles mp
    JOIN public.profiles p ON p.id = mp.user_id
    WHERE mp.id = profile_id
    AND p.mosque_id IN (SELECT my_mosque_ids())
  )
);


-- Migrate existing data
INSERT INTO public.profile_rejection_history (profile_id, reason, rejected_at)
SELECT id, rejection_reason, updated_at
FROM public.marriage_profiles
WHERE rejection_reason IS NOT NULL;

-- Drop the column
ALTER TABLE public.marriage_profiles DROP COLUMN rejection_reason;

-- Lock down wali_details
ALTER TABLE public.wali_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wali details"
ON public.wali_details FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.marriage_profiles mp
    WHERE mp.id = wali_details.profile_id
    AND mp.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view wali details for their mosques"
ON public.wali_details FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.marriage_profiles mp
    JOIN public.profiles p ON p.id = mp.user_id
    WHERE mp.id = wali_details.profile_id
    AND p.mosque_id IN (SELECT my_mosque_ids())
  )
);

CREATE POLICY "Superadmins can view all wali details"
ON public.wali_details FOR SELECT TO authenticated
USING (is_super_admin());
