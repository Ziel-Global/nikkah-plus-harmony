-- Allow signed URL creation for own and matched/consented counterpart photos

DROP POLICY IF EXISTS "storage_select_own_profile_photos" ON storage.objects;
CREATE POLICY "storage_select_own_profile_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage_select_counterpart_profile_photos" ON storage.objects;
CREATE POLICY "storage_select_counterpart_profile_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND EXISTS (
      SELECT 1 FROM public.profile_photos ph
      JOIN public.marriage_profiles mp ON mp.id = ph.profile_id
      WHERE ph.photo_url = name
        AND public.can_view_counterpart_photos(auth.uid(), mp.user_id)
    )
  );
