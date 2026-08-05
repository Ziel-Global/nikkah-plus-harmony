CREATE POLICY "logs_insert_super_admin"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin() AND actor_id = auth.uid());