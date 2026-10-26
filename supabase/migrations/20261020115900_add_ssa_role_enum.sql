-- Must run in its own transaction before the rest of the multi-tenant migration.
DO $$
BEGIN
  ALTER TYPE public.user_role ADD VALUE 'super_super_admin';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
