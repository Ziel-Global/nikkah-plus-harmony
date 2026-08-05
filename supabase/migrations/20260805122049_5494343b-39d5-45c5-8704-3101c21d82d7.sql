CREATE POLICY "branding_read_all" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'branding');

CREATE POLICY "branding_insert_super_admin" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding' AND public.is_super_admin());

CREATE POLICY "branding_update_super_admin" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'branding' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'branding' AND public.is_super_admin());

CREATE POLICY "branding_delete_super_admin" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'branding' AND public.is_super_admin());