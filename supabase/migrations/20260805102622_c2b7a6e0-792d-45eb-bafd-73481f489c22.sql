GRANT SELECT, INSERT, UPDATE ON public.marriage_profiles TO authenticated;
GRANT ALL ON public.marriage_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wali_details TO authenticated;
GRANT ALL ON public.wali_details TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_photos TO authenticated;
GRANT ALL ON public.profile_photos TO service_role;

DROP POLICY IF EXISTS "mp_update_own_draft_or_rejected" ON public.marriage_profiles;
CREATE POLICY "mp_update_own_editable" ON public.marriage_profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND status = ANY (ARRAY['draft','rejected','submitted','approved']::profile_status_enum[])
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = ANY (ARRAY['draft','submitted']::profile_status_enum[])
  );

CREATE POLICY "storage_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);