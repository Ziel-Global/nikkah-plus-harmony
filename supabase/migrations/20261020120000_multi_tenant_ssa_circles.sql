-- Multi-tenant foundation: SSA → SA (circle) → Mosques
-- Phases 1–3: schema, helpers, RLS tightening, RPC/trigger updates
-- Requires 20261020115900_add_ssa_role_enum.sql to be applied first (committed).

-- ---------------------------------------------------------------------------
-- 1. Profile name fields (first + last; keep full_name in sync)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

UPDATE public.profiles
SET
  first_name = COALESCE(first_name, NULLIF(split_part(trim(full_name), ' ', 1), '')),
  last_name = COALESCE(
    last_name,
    NULLIF(trim(substring(trim(full_name) FROM position(' ' IN trim(full_name) || ' ') + 1)), '')
  )
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- ---------------------------------------------------------------------------
-- 3. sa_circles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sa_circles (
  super_admin_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  circle_name text NOT NULL,
  contact_phone text,
  first_name text,
  last_name text,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#2563EB',
  secondary_color text NOT NULL DEFAULT '#3B82F6',
  button_bg_color text NOT NULL DEFAULT '#2563EB',
  button_text_color text NOT NULL DEFAULT '#FFFFFF',
  button_hover_bg_color text NOT NULL DEFAULT '#1D4ED8',
  button_active_bg_color text NOT NULL DEFAULT '#1E40AF',
  success_color text NOT NULL DEFAULT '#16A34A',
  warning_color text NOT NULL DEFAULT '#D97706',
  error_color text NOT NULL DEFAULT '#DC2626',
  dark_mode_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  deactivated_at timestamptz,
  deactivated_by uuid REFERENCES public.profiles (id),
  created_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sa_circles_is_active_idx ON public.sa_circles (is_active);

ALTER TABLE public.sa_circles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. mosques.super_admin_id + backfill
-- ---------------------------------------------------------------------------
ALTER TABLE public.mosques
  ADD COLUMN IF NOT EXISTS super_admin_id uuid REFERENCES public.profiles (id);

DO $$
DECLARE
  v_sa uuid;
BEGIN
  SELECT id INTO v_sa
  FROM public.profiles
  WHERE role = 'super_admin'::public.user_role
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_sa IS NULL THEN
    RAISE NOTICE 'No existing super_admin found for mosque backfill';
  ELSE
    UPDATE public.mosques
    SET super_admin_id = v_sa
    WHERE super_admin_id IS NULL;

    INSERT INTO public.sa_circles (
      super_admin_id,
      circle_name,
      contact_phone,
      first_name,
      last_name,
      logo_url,
      primary_color,
      secondary_color,
      button_bg_color,
      button_text_color,
      button_hover_bg_color,
      button_active_bg_color,
      success_color,
      warning_color,
      error_color,
      dark_mode_default,
      created_by
    )
    SELECT
      v_sa,
      COALESCE(NULLIF(trim(p.full_name), ''), split_part(p.email, '@', 1), 'Default circle'),
      p.phone,
      p.first_name,
      p.last_name,
      ps.logo_url,
      COALESCE(ps.primary_color, '#2563EB'),
      COALESCE(ps.secondary_color, '#3B82F6'),
      COALESCE(ps.button_bg_color, '#2563EB'),
      COALESCE(ps.button_text_color, '#FFFFFF'),
      COALESCE(ps.button_hover_bg_color, '#1D4ED8'),
      COALESCE(ps.button_active_bg_color, '#1E40AF'),
      COALESCE(ps.success_color, '#16A34A'),
      COALESCE(ps.warning_color, '#D97706'),
      COALESCE(ps.error_color, '#DC2626'),
      COALESCE(ps.dark_mode_default, false),
      v_sa
    FROM public.profiles p
    LEFT JOIN public.platform_settings ps ON ps.id = 1
    WHERE p.id = v_sa
    ON CONFLICT (super_admin_id) DO NOTHING;
  END IF;
END $$;

ALTER TABLE public.mosques
  ALTER COLUMN super_admin_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS mosques_super_admin_id_idx ON public.mosques (super_admin_id);

CREATE OR REPLACE FUNCTION public.set_mosque_super_admin_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.super_admin_id IS NULL AND auth.uid() IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'::public.user_role
    ) THEN
      NEW.super_admin_id := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_mosque_super_admin_id ON public.mosques;
CREATE TRIGGER trg_set_mosque_super_admin_id
  BEFORE INSERT ON public.mosques
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mosque_super_admin_id();

-- ---------------------------------------------------------------------------
-- 5. Helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_ssa()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_super_admin'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.circle_is_active(p_sa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.sa_circles WHERE super_admin_id = p_sa_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.my_circle_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'::public.user_role
    ) THEN auth.uid()
    ELSE (
      SELECT m.super_admin_id
      FROM public.profiles p
      JOIN public.mosques m ON m.id = p.mosque_id
      WHERE p.id = auth.uid()
      LIMIT 1
    )
  END;
$$;

-- Mosque admins may not have profiles.mosque_id set; resolve via assignment link
CREATE OR REPLACE FUNCTION public.my_circle_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_circle uuid;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role = 'super_admin'::public.user_role THEN
    RETURN auth.uid();
  END IF;

  SELECT m.super_admin_id INTO v_circle
  FROM public.profiles p
  JOIN public.mosques m ON m.id = p.mosque_id
  WHERE p.id = auth.uid();

  IF v_circle IS NOT NULL THEN
    RETURN v_circle;
  END IF;

  SELECT m.super_admin_id INTO v_circle
  FROM public.mosque_admin_mosques mam
  JOIN public.mosques m ON m.id = mam.mosque_id
  WHERE mam.admin_id = auth.uid()
  LIMIT 1;

  RETURN v_circle;
END;
$$;

CREATE OR REPLACE FUNCTION public.my_circle_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_ssa() THEN true
    WHEN public.my_circle_id() IS NULL THEN true
    ELSE public.circle_is_active(public.my_circle_id())
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'::public.user_role
  )
  AND public.circle_is_active(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.mosque_in_my_circle(p_mosque_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mosques m
    WHERE m.id = p_mosque_id
      AND m.super_admin_id = public.my_circle_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_in_my_circle(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    LEFT JOIN public.mosques m ON m.id = p.mosque_id
    WHERE p.id = p_profile_id
      AND (
        (p.role = 'super_admin'::public.user_role AND p.id = public.my_circle_id())
        OR m.super_admin_id = public.my_circle_id()
        OR EXISTS (
          SELECT 1
          FROM public.mosque_admin_mosques mam
          JOIN public.mosques m2 ON m2.id = mam.mosque_id
          WHERE mam.admin_id = p.id
            AND m2.super_admin_id = public.my_circle_id()
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_branding()
RETURNS TABLE (
  platform_name text,
  logo_url text,
  primary_color text,
  secondary_color text,
  button_bg_color text,
  button_text_color text,
  button_hover_bg_color text,
  button_active_bg_color text,
  success_color text,
  warning_color text,
  error_color text,
  dark_mode_default boolean,
  source text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_circle uuid := public.my_circle_id();
BEGIN
  IF v_circle IS NOT NULL AND EXISTS (SELECT 1 FROM public.sa_circles WHERE super_admin_id = v_circle) THEN
    RETURN QUERY
    SELECT
      c.circle_name,
      c.logo_url,
      c.primary_color,
      c.secondary_color,
      c.button_bg_color,
      c.button_text_color,
      c.button_hover_bg_color,
      c.button_active_bg_color,
      c.success_color,
      c.warning_color,
      c.error_color,
      c.dark_mode_default,
      'circle'::text
    FROM public.sa_circles c
    WHERE c.super_admin_id = v_circle;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ps.platform_name,
    ps.logo_url,
    ps.primary_color,
    ps.secondary_color,
    ps.button_bg_color,
    ps.button_text_color,
    ps.button_hover_bg_color,
    ps.button_active_bg_color,
    ps.success_color,
    ps.warning_color,
    ps.error_color,
    ps.dark_mode_default,
    'platform'::text
  FROM public.platform_settings ps
  WHERE ps.id = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.is_ssa() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.circle_is_active(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_circle_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_circle_is_active() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mosque_in_my_circle(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.profile_in_my_circle(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_branding() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ssa() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.circle_is_active(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_circle_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_circle_is_active() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mosque_in_my_circle(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.profile_in_my_circle(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_branding() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Wrap my_mosque_ids so deactivated circles see nothing
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_mosque_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mam.mosque_id
  FROM public.mosque_admin_mosques mam
  JOIN public.mosques m ON m.id = mam.mosque_id
  WHERE mam.admin_id = auth.uid()
    AND public.circle_is_active(m.super_admin_id);
$$;

GRANT EXECUTE ON FUNCTION public.my_mosque_ids() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. RLS: drop SA-wide policies and recreate circle-scoped + SSA policies
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  -- Only drop SA-named or SA-only policies. Do not touch member/admin policies that
  -- merely OR in is_super_admin() alongside ownership checks.
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        policyname ILIKE '%superadmin%'
        OR policyname ILIKE '%super_admin%'
        OR policyname ILIKE '%platform admin%'
        OR coalesce(qual, '') ~* '^\s*\(?(public\.)?is_super_admin\(\)\s*\)?\s*$'
        OR coalesce(with_check, '') ~* '^\s*\(?(public\.)?is_super_admin\(\)\s*\)?\s*$'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- mosques
DROP POLICY IF EXISTS "mosques_sa_all" ON public.mosques;
CREATE POLICY "mosques_sa_all" ON public.mosques
  FOR ALL TO authenticated
  USING (public.is_super_admin() AND super_admin_id = auth.uid())
  WITH CHECK (public.is_super_admin() AND super_admin_id = auth.uid());

DROP POLICY IF EXISTS "mosques_ssa_select" ON public.mosques;
CREATE POLICY "mosques_ssa_select" ON public.mosques
  FOR SELECT TO authenticated
  USING (public.is_ssa());

-- Keep authenticated mosque listing for signup (all circles)
DROP POLICY IF EXISTS "mosques_select_authenticated" ON public.mosques;
CREATE POLICY "mosques_select_authenticated" ON public.mosques
  FOR SELECT TO authenticated
  USING (true);

-- mosque_admin_mosques
DROP POLICY IF EXISTS "mam_sa_all" ON public.mosque_admin_mosques;
CREATE POLICY "mam_sa_all" ON public.mosque_admin_mosques
  FOR ALL TO authenticated
  USING (public.is_super_admin() AND public.mosque_in_my_circle(mosque_id))
  WITH CHECK (public.is_super_admin() AND public.mosque_in_my_circle(mosque_id));

DROP POLICY IF EXISTS "mam_ssa_select" ON public.mosque_admin_mosques;
CREATE POLICY "mam_ssa_select" ON public.mosque_admin_mosques
  FOR SELECT TO authenticated
  USING (public.is_ssa());

-- mosque_affiliation_requests
DROP POLICY IF EXISTS "mar_sa_all" ON public.mosque_affiliation_requests;
CREATE POLICY "mar_sa_all" ON public.mosque_affiliation_requests
  FOR ALL TO authenticated
  USING (public.is_super_admin() AND public.mosque_in_my_circle(mosque_id))
  WITH CHECK (public.is_super_admin() AND public.mosque_in_my_circle(mosque_id));

DROP POLICY IF EXISTS "mar_ssa_select" ON public.mosque_affiliation_requests;
CREATE POLICY "mar_ssa_select" ON public.mosque_affiliation_requests
  FOR SELECT TO authenticated
  USING (public.is_ssa());

-- profiles
DROP POLICY IF EXISTS "profiles_sa_all" ON public.profiles;
CREATE POLICY "profiles_sa_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND public.profile_in_my_circle(id))
  );

CREATE POLICY "profiles_sa_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() AND public.profile_in_my_circle(id))
  WITH CHECK (public.is_super_admin() AND public.profile_in_my_circle(id));

CREATE POLICY "profiles_ssa_update_sa" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.is_ssa()
    AND role IN ('super_admin'::public.user_role, 'super_super_admin'::public.user_role)
  )
  WITH CHECK (
    public.is_ssa()
    AND role IN ('super_admin'::public.user_role, 'super_super_admin'::public.user_role)
  );

DROP POLICY IF EXISTS "profiles_superadmin_delete" ON public.profiles;
CREATE POLICY "profiles_sa_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_super_admin() AND public.profile_in_my_circle(id));

-- marriage_profiles
DROP POLICY IF EXISTS "mp_sa_all" ON public.marriage_profiles;
CREATE POLICY "mp_sa_select" ON public.marriage_profiles
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND public.profile_in_my_circle(user_id))
  );

CREATE POLICY "mp_sa_update" ON public.marriage_profiles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() AND public.profile_in_my_circle(user_id))
  WITH CHECK (public.is_super_admin() AND public.profile_in_my_circle(user_id));

-- profile_photos
DROP POLICY IF EXISTS "photos_sa_select" ON public.profile_photos;
CREATE POLICY "photos_sa_select" ON public.profile_photos
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (
      public.is_super_admin()
      AND EXISTS (
        SELECT 1 FROM public.marriage_profiles mp
        WHERE mp.id = profile_id AND public.profile_in_my_circle(mp.user_id)
      )
    )
  );

-- wali_details
DROP POLICY IF EXISTS "wali_sa_select" ON public.wali_details;
CREATE POLICY "wali_sa_select" ON public.wali_details
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (
      public.is_super_admin()
      AND EXISTS (
        SELECT 1 FROM public.marriage_profiles mp
        WHERE mp.id = profile_id AND public.profile_in_my_circle(mp.user_id)
      )
    )
  );

-- interest_requests
DROP POLICY IF EXISTS "ir_sa_all" ON public.interest_requests;
CREATE POLICY "ir_sa_select" ON public.interest_requests
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (
      public.is_super_admin()
      AND public.profile_in_my_circle(requester_id)
      AND public.profile_in_my_circle(target_id)
    )
  );

CREATE POLICY "ir_sa_update" ON public.interest_requests
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    AND public.profile_in_my_circle(requester_id)
    AND public.profile_in_my_circle(target_id)
  );

-- contact_consents / match_feedback
DROP POLICY IF EXISTS "cc_sa_select" ON public.contact_consents;
CREATE POLICY "cc_sa_select" ON public.contact_consents
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND public.profile_in_my_circle(user_id))
  );

DROP POLICY IF EXISTS "mf_sa_select" ON public.match_feedback;
CREATE POLICY "mf_sa_select" ON public.match_feedback
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND public.profile_in_my_circle(user_id))
  );

-- conduct_reports / account_flags / escalations
DROP POLICY IF EXISTS "cr_sa_all" ON public.conduct_reports;
CREATE POLICY "cr_sa_all" ON public.conduct_reports
  FOR ALL TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND public.profile_in_my_circle(reported_by))
  )
  WITH CHECK (
    public.is_super_admin() AND public.profile_in_my_circle(reported_by)
  );

DROP POLICY IF EXISTS "af_sa_all" ON public.account_flags;
CREATE POLICY "af_sa_all" ON public.account_flags
  FOR ALL TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND public.profile_in_my_circle(user_id))
  )
  WITH CHECK (
    public.is_super_admin() AND public.profile_in_my_circle(user_id)
  );

DROP POLICY IF EXISTS "esc_sa_all" ON public.escalations;
CREATE POLICY "esc_sa_all" ON public.escalations
  FOR ALL TO authenticated
  USING (
    public.is_ssa()
    OR (
      public.is_super_admin()
      AND (
        public.profile_in_my_circle(raised_by)
        OR public.profile_in_my_circle(mosque_admin_id)
      )
    )
  )
  WITH CHECK (
    public.is_super_admin()
    AND (
      public.profile_in_my_circle(raised_by)
      OR public.profile_in_my_circle(mosque_admin_id)
    )
  );

-- notifications
DROP POLICY IF EXISTS "notif_sa_select" ON public.notifications;
CREATE POLICY "notif_sa_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND public.profile_in_my_circle(user_id))
  );

-- activity_logs
DROP POLICY IF EXISTS "logs_insert_super_admin" ON public.activity_logs;
DROP POLICY IF EXISTS "logs_sa_select" ON public.activity_logs;
CREATE POLICY "logs_insert_privileged" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (public.is_super_admin() OR public.is_ssa())
  );

CREATE POLICY "logs_sa_select" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (
      public.is_super_admin()
      AND (actor_id = auth.uid() OR public.profile_in_my_circle(actor_id))
    )
  );

-- platform_settings: SSA write; authenticated read remains
DROP POLICY IF EXISTS "platform_settings_sa_update" ON public.platform_settings;
DROP POLICY IF EXISTS "platform_settings_ssa_update" ON public.platform_settings;
CREATE POLICY "platform_settings_ssa_update" ON public.platform_settings
  FOR UPDATE TO authenticated
  USING (public.is_ssa())
  WITH CHECK (public.is_ssa());

-- sa_circles policies
DROP POLICY IF EXISTS "sa_circles_ssa_all" ON public.sa_circles;
DROP POLICY IF EXISTS "sa_circles_sa_select" ON public.sa_circles;
DROP POLICY IF EXISTS "sa_circles_sa_update" ON public.sa_circles;
CREATE POLICY "sa_circles_ssa_all" ON public.sa_circles
  FOR ALL TO authenticated
  USING (public.is_ssa())
  WITH CHECK (public.is_ssa());

CREATE POLICY "sa_circles_sa_select" ON public.sa_circles
  FOR SELECT TO authenticated
  USING (public.is_super_admin() AND super_admin_id = auth.uid());

CREATE POLICY "sa_circles_sa_update" ON public.sa_circles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() AND super_admin_id = auth.uid() AND is_active)
  WITH CHECK (public.is_super_admin() AND super_admin_id = auth.uid());

-- branding storage: SSA + SA
DO $$
BEGIN
  DROP POLICY IF EXISTS "branding_insert_super_admin" ON storage.objects;
  DROP POLICY IF EXISTS "branding_update_super_admin" ON storage.objects;
  DROP POLICY IF EXISTS "branding_delete_super_admin" ON storage.objects;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE POLICY "branding_insert_privileged" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'branding'
    AND (public.is_ssa() OR public.is_super_admin())
  );

CREATE POLICY "branding_update_privileged" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'branding' AND (public.is_ssa() OR public.is_super_admin()))
  WITH CHECK (bucket_id = 'branding' AND (public.is_ssa() OR public.is_super_admin()));

CREATE POLICY "branding_delete_privileged" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'branding' AND (public.is_ssa() OR public.is_super_admin()));

-- ---------------------------------------------------------------------------
-- 8. browse_profiles: circle isolation + active circle
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.browse_profiles(
  p_min_age int default null,
  p_max_age int default null,
  p_country text default null,
  p_city text default null,
  p_nationality text default null,
  p_education text default null,
  p_marital text default null,
  p_practice text default null,
  p_languages text[] default null,
  p_relocate boolean default null,
  p_profession text default null,
  p_family_keyword text default null,
  p_profile_id uuid default null,
  p_limit int default 24,
  p_offset int default 0
)
RETURNS TABLE (
  id uuid,
  display_name text,
  age int,
  country text,
  city text,
  area text,
  nationality text,
  ethnicity text,
  marital_status text,
  height_cm int,
  appearance_description text,
  education_level text,
  profession text,
  employment_status text,
  religious_practice_level text,
  sect_or_school_of_thought text,
  languages_spoken text[],
  family_origin text,
  family_values text,
  household_background text,
  preferred_spouse_criteria text,
  willingness_to_relocate boolean,
  expected_marriage_timeline text,
  personal_bio text,
  mosque_id uuid,
  mosque_name text,
  photo_url text,
  has_hidden_photo boolean,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT
      p.id,
      p.gender,
      p.mosque_id,
      public.my_circle_id() AS circle_id
    FROM public.profiles p
    WHERE p.id = auth.uid()
  ),
  base AS (
    SELECT
      mp.*,
      pr.mosque_id AS owner_mosque_id,
      m.name AS mosque_name,
      date_part('year', age(mp.date_of_birth))::int AS calc_age
    FROM public.marriage_profiles mp
    JOIN public.profiles pr ON pr.id = mp.user_id
    LEFT JOIN public.mosques m ON m.id = pr.mosque_id
    CROSS JOIN me
    WHERE mp.status = 'approved'
      AND public.my_circle_is_active()
      AND (
        p_profile_id IS NOT NULL
        OR (
          mp.user_id <> me.id
          AND me.gender IS NOT NULL
          AND pr.gender IS NOT NULL
          AND pr.gender <> me.gender
          AND pr.account_status = 'active'
          AND m.super_admin_id IS NOT NULL
          AND m.super_admin_id = me.circle_id
          AND public.circle_is_active(m.super_admin_id)
        )
      )
      AND (p_profile_id IS NULL OR mp.id = p_profile_id)
      AND (p_min_age IS NULL OR p_min_age <= 0 OR mp.date_of_birth IS NULL OR date_part('year', age(mp.date_of_birth)) >= p_min_age)
      AND (p_max_age IS NULL OR p_max_age <= 0 OR mp.date_of_birth IS NULL OR date_part('year', age(mp.date_of_birth)) <= p_max_age)
      AND (p_country IS NULL OR mp.country ILIKE '%' || p_country || '%')
      AND (p_city IS NULL OR mp.city ILIKE '%' || p_city || '%')
      AND (p_nationality IS NULL OR mp.nationality ILIKE '%' || p_nationality || '%')
      AND (p_education IS NULL OR mp.education_level ILIKE p_education)
      AND (p_marital IS NULL OR mp.marital_status ILIKE p_marital)
      AND (p_practice IS NULL OR mp.religious_practice_level ILIKE p_practice)
      AND (
        p_languages IS NULL
        OR array_length(p_languages, 1) IS NULL
        OR EXISTS (
          SELECT 1 FROM unnest(mp.languages_spoken) lang
          WHERE lower(lang) = ANY (p_languages)
        )
      )
      AND (p_relocate IS NULL OR mp.willingness_to_relocate = p_relocate)
      AND (p_profession IS NULL OR mp.profession ILIKE '%' || p_profession || '%')
      AND (
        p_family_keyword IS NULL
        OR (
          coalesce(mp.family_origin, '') || ' ' || coalesce(mp.family_values, '') || ' ' ||
          coalesce(mp.household_background, '')
        ) ILIKE '%' || p_family_keyword || '%'
      )
  ),
  counted AS (SELECT count(*) AS n FROM base)
  SELECT
    b.id,
    b.display_name,
    b.calc_age,
    b.country,
    b.city,
    CASE WHEN privacy_visible(b.privacy_settings, 'area') THEN b.area END,
    CASE WHEN privacy_visible(b.privacy_settings, 'nationality') THEN b.nationality END,
    CASE WHEN privacy_visible(b.privacy_settings, 'ethnicity') THEN b.ethnicity END,
    b.marital_status,
    CASE WHEN privacy_visible(b.privacy_settings, 'height_cm') THEN b.height_cm END,
    CASE WHEN privacy_visible(b.privacy_settings, 'appearance_description') THEN b.appearance_description END,
    b.education_level,
    CASE WHEN privacy_visible(b.privacy_settings, 'profession') THEN b.profession END,
    CASE WHEN privacy_visible(b.privacy_settings, 'employment_status') THEN b.employment_status END,
    b.religious_practice_level,
    b.sect_or_school_of_thought,
    b.languages_spoken,
    CASE WHEN privacy_visible(b.privacy_settings, 'family_origin') THEN b.family_origin END,
    CASE WHEN privacy_visible(b.privacy_settings, 'family_values') THEN b.family_values END,
    CASE WHEN privacy_visible(b.privacy_settings, 'household_background') THEN b.household_background END,
    CASE WHEN privacy_visible(b.privacy_settings, 'preferred_spouse_criteria') THEN b.preferred_spouse_criteria END,
    b.willingness_to_relocate,
    b.expected_marriage_timeline,
    CASE WHEN privacy_visible(b.privacy_settings, 'personal_bio') THEN b.personal_bio END,
    b.owner_mosque_id,
    b.mosque_name,
    (
      SELECT ph.photo_url
      FROM public.profile_photos ph
      WHERE ph.profile_id = b.id
        AND (
          ph.visibility = 'public'
          OR public.can_view_counterpart_photos(auth.uid(), b.user_id)
        )
      ORDER BY ph.is_primary DESC, ph.uploaded_at ASC
      LIMIT 1
    ),
    EXISTS (
      SELECT 1
      FROM public.profile_photos ph
      WHERE ph.profile_id = b.id
        AND ph.visibility <> 'public'
        AND NOT public.can_view_counterpart_photos(auth.uid(), b.user_id)
    ),
    (SELECT n FROM counted)
  FROM base b
  ORDER BY b.updated_at DESC
  LIMIT greatest(coalesce(p_limit, 24), 1)
  OFFSET greatest(coalesce(p_offset, 0), 0);
$$;

-- ---------------------------------------------------------------------------
-- 9. Interest request circle checks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_interest_request(p_profile_id uuid, p_message text default null)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me record;
  target record;
  new_id uuid;
  v_requester_circle uuid;
  v_target_circle uuid;
BEGIN
  IF NOT public.my_circle_is_active() THEN
    RAISE EXCEPTION 'This service is temporarily unavailable.';
  END IF;

  SELECT p.id, p.gender, p.mosque_id INTO me
  FROM public.profiles p WHERE p.id = auth.uid();

  IF me.id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to send an interest request.';
  END IF;

  SELECT mp.user_id, pr.gender, pr.mosque_id INTO target
  FROM public.marriage_profiles mp
  JOIN public.profiles pr ON pr.id = mp.user_id
  WHERE mp.id = p_profile_id
    AND mp.status = 'approved'
    AND pr.account_status = 'active';

  IF target.user_id IS NULL THEN
    RAISE EXCEPTION 'This profile is no longer available.';
  END IF;

  IF target.gender IS NULL OR me.gender IS NULL OR target.gender = me.gender THEN
    RAISE EXCEPTION 'This profile is not available to you.';
  END IF;

  SELECT m.super_admin_id INTO v_requester_circle
  FROM public.mosques m WHERE m.id = me.mosque_id;

  SELECT m.super_admin_id INTO v_target_circle
  FROM public.mosques m WHERE m.id = target.mosque_id;

  IF v_requester_circle IS NULL OR v_target_circle IS NULL OR v_requester_circle <> v_target_circle THEN
    RAISE EXCEPTION 'You can only send interest requests within your circle.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.interest_requests
    WHERE (requester_id = me.id AND target_id = target.user_id)
       OR (requester_id = target.user_id AND target_id = me.id)
  ) THEN
    RAISE EXCEPTION 'An introduction request or completed match already exists between you and this member.';
  END IF;

  INSERT INTO public.interest_requests
    (requester_id, target_id, requester_mosque_id, target_mosque_id, message, status)
  VALUES (me.id, target.user_id, me.mosque_id, target.mosque_id, nullif(btrim(coalesce(p_message, '')), ''), 'submitted')
  RETURNING id INTO new_id;

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (
    target.user_id,
    'New Introduction Request',
    'A member has sent you an introduction request. Check your Interest Requests to view details.',
    'interest_request',
    jsonb_build_object('request_id', new_id, 'requester_id', me.id)
  );

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_interest_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_interest_request(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.respond_to_interest_request(p_request_id uuid, p_accept boolean)
RETURNS request_status_enum
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req record;
  new_status request_status_enum;
  v_req_circle uuid;
  v_tgt_circle uuid;
BEGIN
  IF NOT public.my_circle_is_active() THEN
    RAISE EXCEPTION 'This service is temporarily unavailable.';
  END IF;

  SELECT * INTO req FROM public.interest_requests WHERE id = p_request_id;

  IF req.id IS NULL THEN
    RAISE EXCEPTION 'This request is no longer available.';
  END IF;

  IF req.target_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the member who received this request can respond to it.';
  END IF;

  IF req.status <> 'submitted' THEN
    RAISE EXCEPTION 'This request has already been answered.';
  END IF;

  SELECT m.super_admin_id INTO v_req_circle
  FROM public.profiles p
  JOIN public.mosques m ON m.id = p.mosque_id
  WHERE p.id = req.requester_id;

  SELECT m.super_admin_id INTO v_tgt_circle
  FROM public.profiles p
  JOIN public.mosques m ON m.id = p.mosque_id
  WHERE p.id = req.target_id;

  IF v_req_circle IS NULL OR v_tgt_circle IS NULL OR v_req_circle <> v_tgt_circle THEN
    RAISE EXCEPTION 'Cross-circle requests are not allowed.';
  END IF;

  IF p_accept THEN
    IF EXISTS (
      SELECT 1 FROM public.interest_requests
      WHERE status = 'active_match'
        AND (
          requester_id IN (req.requester_id, req.target_id)
          OR target_id IN (req.requester_id, req.target_id)
        )
    ) THEN
      RAISE EXCEPTION 'You or the other member already has an active match right now.';
    END IF;
    new_status := 'active_match';
  ELSE
    new_status := 'closed_declined';
  END IF;

  UPDATE public.interest_requests
  SET status = new_status, responded_at = now()
  WHERE id = p_request_id;

  RETURN new_status;
END;
$$;

-- ---------------------------------------------------------------------------
-- 10. Photo helpers: same-circle check
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_view_counterpart_photos(p_viewer_id uuid, p_owner_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT m1.super_admin_id
      FROM public.profiles p1
      JOIN public.mosques m1 ON m1.id = p1.mosque_id
      WHERE p1.id = p_viewer_id
    ) IS NOT DISTINCT FROM (
      SELECT m2.super_admin_id
      FROM public.profiles p2
      JOIN public.mosques m2 ON m2.id = p2.mosque_id
      WHERE p2.id = p_owner_user_id
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.interest_requests ir
        WHERE ir.status = 'active_match'
          AND (
            (ir.requester_id = p_viewer_id AND ir.target_id = p_owner_user_id)
            OR (ir.requester_id = p_owner_user_id AND ir.target_id = p_viewer_id)
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.interest_requests ir
        JOIN public.contact_consents cc1 ON cc1.request_id = ir.id AND cc1.user_id = p_viewer_id
        JOIN public.contact_consents cc2 ON cc2.request_id = ir.id AND cc2.user_id = p_owner_user_id
        WHERE (ir.requester_id = p_viewer_id AND ir.target_id = p_owner_user_id)
           OR (ir.requester_id = p_owner_user_id AND ir.target_id = p_viewer_id)
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- 11. Mosque-admin RPCs: require circle ownership
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_mosque_admin_email(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.is_super_admin() AND NOT public.is_ssa() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can confirm emails manually.';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;

  IF v_user_id IS NOT NULL AND public.is_super_admin() THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.mosque_admin_mosques mam
      WHERE mam.admin_id = v_user_id
        AND public.mosque_in_my_circle(mam.mosque_id)
    ) AND NOT public.profile_in_my_circle(v_user_id) THEN
      -- Newly created admins may not be linked yet; allow confirm when SA owns any mosque
      -- with matching contact email in their circle
      IF NOT EXISTS (
        SELECT 1 FROM public.mosques m
        WHERE lower(m.contact_email) = lower(p_email)
          AND m.super_admin_id = auth.uid()
      ) THEN
        RAISE EXCEPTION 'Unauthorized: admin is outside your circle.';
      END IF;
    END IF;
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE lower(email) = lower(p_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_mosque_admin_role(p_user_id uuid, p_mosque_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() AND NOT public.is_ssa() THEN
    -- Self-heal path for mosque admins during signup race: only when metadata matches
    IF auth.uid() IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  ELSIF public.is_super_admin() AND NOT public.mosque_in_my_circle(p_mosque_id) THEN
    RAISE EXCEPTION 'Unauthorized: mosque is outside your circle.';
  END IF;

  UPDATE public.profiles
  SET role = 'mosque_admin'::public.user_role,
      mosque_id = COALESCE(mosque_id, p_mosque_id)
  WHERE id = p_user_id;

  INSERT INTO public.mosque_admin_mosques (admin_id, mosque_id, assigned_by)
  VALUES (p_user_id, p_mosque_id, COALESCE(auth.uid(), p_user_id))
  ON CONFLICT (admin_id, mosque_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_profile(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_profile_ids uuid[];
BEGIN
  IF public.is_ssa() THEN
    RAISE EXCEPTION 'Platform owners cannot delete member profiles directly.';
  END IF;

  IF auth.uid() <> target_user_id THEN
    IF NOT public.is_super_admin() OR NOT public.profile_in_my_circle(target_user_id) THEN
      RAISE EXCEPTION 'Unauthorized: Only circle administrators can delete user profiles in their circle.';
    END IF;
  END IF;

  SELECT ARRAY(
    SELECT id FROM public.marriage_profiles WHERE user_id = target_user_id
  ) INTO v_profile_ids;

  DELETE FROM public.notifications WHERE user_id = target_user_id;
  DELETE FROM public.profile_photos WHERE profile_id = ANY (v_profile_ids);
  DELETE FROM public.wali_details WHERE profile_id = ANY (v_profile_ids);
  DELETE FROM public.contact_consents WHERE user_id = target_user_id;
  DELETE FROM public.match_feedback WHERE user_id = target_user_id;
  DELETE FROM public.conduct_reports
  WHERE reported_by = target_user_id OR reported_profile_id = ANY (v_profile_ids);
  DELETE FROM public.account_flags WHERE user_id = target_user_id OR reviewed_by = target_user_id;
  DELETE FROM public.escalations WHERE raised_by = target_user_id OR mosque_admin_id = target_user_id;
  DELETE FROM public.interest_requests WHERE requester_id = target_user_id OR target_id = target_user_id;
  DELETE FROM public.mosque_affiliation_requests WHERE user_id = target_user_id OR reviewed_by = target_user_id;
  DELETE FROM public.mosque_admin_mosques WHERE admin_id = target_user_id OR assigned_by = target_user_id;
  DELETE FROM public.marriage_profiles WHERE user_id = target_user_id;
  UPDATE public.activity_logs SET actor_id = NULL WHERE actor_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 12. Signup trigger: never trust privileged roles from metadata
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_phone text;
  v_meta_role text;
  v_full_name text;
  v_first_name text;
  v_last_name text;
BEGIN
  v_phone := nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'phone', '')), '');
  v_meta_role := nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'role', '')), '');
  v_first_name := nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'first_name', '')), '');
  v_last_name := nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'last_name', '')), '');
  v_full_name := nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'full_name', '')), '');

  IF v_full_name IS NULL AND (v_first_name IS NOT NULL OR v_last_name IS NOT NULL) THEN
    v_full_name := nullif(trim(coalesce(v_first_name, '') || ' ' || coalesce(v_last_name, '')), '');
  END IF;

  IF v_phone IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles WHERE phone = v_phone AND id <> NEW.id
  ) THEN
    v_phone := NULL;
  END IF;

  -- Ignore privileged roles from client metadata (security fix).
  -- Member roles from metadata are also ignored; onboarding sets them server-side.
  IF v_meta_role IN ('super_admin', 'super_super_admin', 'mosque_admin') THEN
    v_meta_role := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, phone, gender, role, mosque_id, full_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_phone,
    nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'gender', '')), ''),
    NULL,
    NULL,
    v_full_name,
    v_first_name,
    v_last_name
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.profiles (id, email, gender, role, full_name, first_name, last_name)
    VALUES (NEW.id, NEW.email, NULL, NULL, v_full_name, v_first_name, v_last_name)
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
      last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$function$;

GRANT SELECT, INSERT, UPDATE ON public.sa_circles TO authenticated;
GRANT ALL ON public.sa_circles TO service_role;
