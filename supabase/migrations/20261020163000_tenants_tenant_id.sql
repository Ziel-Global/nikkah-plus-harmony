-- Migrate sa_circles / super_admin_id → tenants / tenant_id

-- ---------------------------------------------------------------------------
-- 1. tenants table + backfill from sa_circles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
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
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- temporary map column for backfill (dropped at end)
  legacy_sa_id uuid UNIQUE
);

CREATE INDEX IF NOT EXISTS tenants_is_active_idx ON public.tenants (is_active);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

INSERT INTO public.tenants (
  name, logo_url, primary_color, secondary_color, button_bg_color, button_text_color,
  button_hover_bg_color, button_active_bg_color, success_color, warning_color, error_color,
  dark_mode_default, is_active, deactivated_at, deactivated_by, created_by, created_at, updated_at,
  legacy_sa_id
)
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
  c.is_active,
  c.deactivated_at,
  c.deactivated_by,
  c.created_by,
  c.created_at,
  c.updated_at,
  c.super_admin_id
FROM public.sa_circles c
ON CONFLICT (legacy_sa_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Add tenant_id columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.mosques ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.mosque_affiliation_requests ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.mosque_admin_mosques ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.marriage_profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.interest_requests ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.conduct_reports ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.account_flags ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.escalations ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.contact_consents ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
ALTER TABLE public.match_feedback ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);

-- ---------------------------------------------------------------------------
-- 3. Backfill tenant_id
-- ---------------------------------------------------------------------------
-- Super admins from legacy circle map
UPDATE public.profiles p
SET tenant_id = t.id
FROM public.tenants t
WHERE t.legacy_sa_id = p.id
  AND p.role = 'super_admin'::public.user_role
  AND p.tenant_id IS NULL;

-- Mosques from super_admin_id
UPDATE public.mosques m
SET tenant_id = t.id
FROM public.tenants t
WHERE t.legacy_sa_id = m.super_admin_id
  AND m.tenant_id IS NULL;

-- Members / mosque admins via mosque
UPDATE public.profiles p
SET tenant_id = m.tenant_id
FROM public.mosques m
WHERE p.mosque_id = m.id
  AND p.tenant_id IS NULL
  AND m.tenant_id IS NOT NULL;

-- Mosque admins via assignment link
UPDATE public.profiles p
SET tenant_id = m.tenant_id
FROM public.mosque_admin_mosques mam
JOIN public.mosques m ON m.id = mam.mosque_id
WHERE mam.admin_id = p.id
  AND p.tenant_id IS NULL
  AND m.tenant_id IS NOT NULL;

UPDATE public.mosque_admin_mosques mam
SET tenant_id = m.tenant_id
FROM public.mosques m
WHERE mam.mosque_id = m.id AND mam.tenant_id IS NULL;

UPDATE public.mosque_affiliation_requests mar
SET tenant_id = m.tenant_id
FROM public.mosques m
WHERE mar.mosque_id = m.id AND mar.tenant_id IS NULL;

UPDATE public.marriage_profiles mp
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE mp.user_id = p.id AND mp.tenant_id IS NULL;

UPDATE public.interest_requests ir
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE ir.requester_id = p.id AND ir.tenant_id IS NULL;

UPDATE public.notifications n
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE n.user_id = p.id AND n.tenant_id IS NULL;

UPDATE public.activity_logs al
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE al.actor_id = p.id AND al.tenant_id IS NULL;

UPDATE public.conduct_reports cr
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE cr.reported_by = p.id AND cr.tenant_id IS NULL;

UPDATE public.account_flags af
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE af.user_id = p.id AND af.tenant_id IS NULL;

UPDATE public.escalations e
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE e.raised_by = p.id AND e.tenant_id IS NULL;

UPDATE public.contact_consents cc
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE cc.user_id = p.id AND cc.tenant_id IS NULL;

UPDATE public.match_feedback mf
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE mf.user_id = p.id AND mf.tenant_id IS NULL;

-- Mosques must have tenant
ALTER TABLE public.mosques ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS mosques_tenant_id_idx ON public.mosques (tenant_id);
CREATE INDEX IF NOT EXISTS profiles_tenant_id_idx ON public.profiles (tenant_id);

-- ---------------------------------------------------------------------------
-- 4. Helper functions (tenant_*); keep circle_* aliases temporarily
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tenant_is_active(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_active FROM public.tenants WHERE id = p_tenant_id), false);
$$;

CREATE OR REPLACE FUNCTION public.my_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.profiles WHERE id = auth.uid();
  IF v_tenant IS NOT NULL THEN
    RETURN v_tenant;
  END IF;

  SELECT m.tenant_id INTO v_tenant
  FROM public.mosque_admin_mosques mam
  JOIN public.mosques m ON m.id = mam.mosque_id
  WHERE mam.admin_id = auth.uid()
  LIMIT 1;

  RETURN v_tenant;
END;
$$;

CREATE OR REPLACE FUNCTION public.my_tenant_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_ssa() THEN true
    WHEN public.my_tenant_id() IS NULL THEN true
    ELSE public.tenant_is_active(public.my_tenant_id())
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
      AND tenant_id IS NOT NULL
      AND public.tenant_is_active(tenant_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.mosque_in_my_tenant(p_mosque_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mosques m
    WHERE m.id = p_mosque_id AND m.tenant_id = public.my_tenant_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_in_my_tenant(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_profile_id AND p.tenant_id = public.my_tenant_id()
  );
$$;

-- Compatibility aliases used by existing app until cutover
CREATE OR REPLACE FUNCTION public.my_circle_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.my_tenant_id(); $$;

CREATE OR REPLACE FUNCTION public.my_circle_is_active()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.my_tenant_is_active(); $$;

CREATE OR REPLACE FUNCTION public.circle_is_active(p_sa_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.tenant_is_active(
    COALESCE(
      (SELECT tenant_id FROM public.profiles WHERE id = p_sa_id),
      (SELECT id FROM public.tenants WHERE legacy_sa_id = p_sa_id LIMIT 1)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.mosque_in_my_circle(p_mosque_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.mosque_in_my_tenant(p_mosque_id); $$;

CREATE OR REPLACE FUNCTION public.profile_in_my_circle(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.profile_in_my_tenant(p_profile_id); $$;

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
  v_tenant uuid := public.my_tenant_id();
BEGIN
  IF v_tenant IS NOT NULL AND EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant) THEN
    RETURN QUERY
    SELECT
      t.name,
      t.logo_url,
      t.primary_color,
      t.secondary_color,
      t.button_bg_color,
      t.button_text_color,
      t.button_hover_bg_color,
      t.button_active_bg_color,
      t.success_color,
      t.warning_color,
      t.error_color,
      t.dark_mode_default,
      'tenant'::text
    FROM public.tenants t
    WHERE t.id = v_tenant;
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
    AND public.tenant_is_active(m.tenant_id);
$$;

REVOKE ALL ON FUNCTION public.tenant_is_active(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_tenant_is_active() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mosque_in_my_tenant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.profile_in_my_tenant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tenant_is_active(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_tenant_is_active() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mosque_in_my_tenant(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.profile_in_my_tenant(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_branding() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_mosque_ids() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Mosque insert trigger → tenant_id
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_set_mosque_super_admin_id ON public.mosques;
DROP FUNCTION IF EXISTS public.set_mosque_super_admin_id();

CREATE OR REPLACE FUNCTION public.set_mosque_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.my_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_mosque_tenant_id
  BEFORE INSERT ON public.mosques
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mosque_tenant_id();

-- ---------------------------------------------------------------------------
-- 6. RLS: tenants + rewrite SA policies to tenant_id
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sa_circles_ssa_all" ON public.sa_circles;
DROP POLICY IF EXISTS "sa_circles_sa_select" ON public.sa_circles;
DROP POLICY IF EXISTS "sa_circles_sa_update" ON public.sa_circles;

DROP POLICY IF EXISTS "tenants_ssa_all" ON public.tenants;
DROP POLICY IF EXISTS "tenants_sa_select" ON public.tenants;
DROP POLICY IF EXISTS "tenants_sa_update" ON public.tenants;

CREATE POLICY "tenants_ssa_all" ON public.tenants
  FOR ALL TO authenticated
  USING (public.is_ssa())
  WITH CHECK (public.is_ssa());

CREATE POLICY "tenants_sa_select" ON public.tenants
  FOR SELECT TO authenticated
  USING (public.is_super_admin() AND id = public.my_tenant_id());

CREATE POLICY "tenants_sa_update" ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() AND id = public.my_tenant_id() AND is_active)
  WITH CHECK (public.is_super_admin() AND id = public.my_tenant_id());

GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

-- Drop and recreate SA-scoped policies for core tables
DROP POLICY IF EXISTS "mosques_sa_all" ON public.mosques;
CREATE POLICY "mosques_sa_all" ON public.mosques
  FOR ALL TO authenticated
  USING (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  WITH CHECK (public.is_super_admin() AND tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "mosques_ssa_select" ON public.mosques;
CREATE POLICY "mosques_ssa_select" ON public.mosques
  FOR SELECT TO authenticated
  USING (public.is_ssa());

DROP POLICY IF EXISTS "mam_sa_all" ON public.mosque_admin_mosques;
CREATE POLICY "mam_sa_all" ON public.mosque_admin_mosques
  FOR ALL TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  )
  WITH CHECK (public.is_super_admin() AND tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "mar_sa_all" ON public.mosque_affiliation_requests;
CREATE POLICY "mar_sa_all" ON public.mosque_affiliation_requests
  FOR ALL TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  )
  WITH CHECK (public.is_super_admin() AND tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "profiles_sa_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_sa_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_ssa_update_sa" ON public.profiles;
DROP POLICY IF EXISTS "profiles_sa_delete" ON public.profiles;

CREATE POLICY "profiles_sa_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  );

CREATE POLICY "profiles_sa_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  WITH CHECK (public.is_super_admin() AND tenant_id = public.my_tenant_id());

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

CREATE POLICY "profiles_sa_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_super_admin() AND tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "mp_sa_select" ON public.marriage_profiles;
DROP POLICY IF EXISTS "mp_sa_update" ON public.marriage_profiles;
CREATE POLICY "mp_sa_select" ON public.marriage_profiles
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  );
CREATE POLICY "mp_sa_update" ON public.marriage_profiles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  WITH CHECK (public.is_super_admin() AND tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "ir_sa_select" ON public.interest_requests;
DROP POLICY IF EXISTS "ir_sa_update" ON public.interest_requests;
CREATE POLICY "ir_sa_select" ON public.interest_requests
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  );
CREATE POLICY "ir_sa_update" ON public.interest_requests
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() AND tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "notif_sa_select" ON public.notifications;
CREATE POLICY "notif_sa_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  );

DROP POLICY IF EXISTS "logs_sa_select" ON public.activity_logs;
CREATE POLICY "logs_sa_select" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (
      public.is_super_admin()
      AND (actor_id = auth.uid() OR tenant_id = public.my_tenant_id())
    )
  );

DROP POLICY IF EXISTS "cr_sa_all" ON public.conduct_reports;
CREATE POLICY "cr_sa_all" ON public.conduct_reports
  FOR ALL TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  )
  WITH CHECK (public.is_super_admin() AND tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "af_sa_all" ON public.account_flags;
CREATE POLICY "af_sa_all" ON public.account_flags
  FOR ALL TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  )
  WITH CHECK (public.is_super_admin() AND tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "esc_sa_all" ON public.escalations;
CREATE POLICY "esc_sa_all" ON public.escalations
  FOR ALL TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  )
  WITH CHECK (public.is_super_admin() AND tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "cc_sa_select" ON public.contact_consents;
CREATE POLICY "cc_sa_select" ON public.contact_consents
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  );

DROP POLICY IF EXISTS "mf_sa_select" ON public.match_feedback;
CREATE POLICY "mf_sa_select" ON public.match_feedback
  FOR SELECT TO authenticated
  USING (
    public.is_ssa()
    OR (public.is_super_admin() AND tenant_id = public.my_tenant_id())
  );

-- ---------------------------------------------------------------------------
-- 7. browse_profiles + interest RPCs use tenant_id
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
    SELECT p.id, p.gender, p.mosque_id, public.my_tenant_id() AS tenant_id
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
      AND public.my_tenant_is_active()
      AND (
        p_profile_id IS NOT NULL
        OR (
          mp.user_id <> me.id
          AND me.gender IS NOT NULL
          AND pr.gender IS NOT NULL
          AND pr.gender <> me.gender
          AND pr.account_status = 'active'
          AND pr.tenant_id IS NOT NULL
          AND pr.tenant_id = me.tenant_id
          AND public.tenant_is_active(pr.tenant_id)
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
        p_languages IS NULL OR array_length(p_languages, 1) IS NULL
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
    b.id, b.display_name, b.calc_age, b.country, b.city,
    CASE WHEN privacy_visible(b.privacy_settings, 'area') THEN b.area END,
    CASE WHEN privacy_visible(b.privacy_settings, 'nationality') THEN b.nationality END,
    CASE WHEN privacy_visible(b.privacy_settings, 'ethnicity') THEN b.ethnicity END,
    b.marital_status,
    CASE WHEN privacy_visible(b.privacy_settings, 'height_cm') THEN b.height_cm END,
    CASE WHEN privacy_visible(b.privacy_settings, 'appearance_description') THEN b.appearance_description END,
    b.education_level,
    CASE WHEN privacy_visible(b.privacy_settings, 'profession') THEN b.profession END,
    CASE WHEN privacy_visible(b.privacy_settings, 'employment_status') THEN b.employment_status END,
    b.religious_practice_level, b.sect_or_school_of_thought, b.languages_spoken,
    CASE WHEN privacy_visible(b.privacy_settings, 'family_origin') THEN b.family_origin END,
    CASE WHEN privacy_visible(b.privacy_settings, 'family_values') THEN b.family_values END,
    CASE WHEN privacy_visible(b.privacy_settings, 'household_background') THEN b.household_background END,
    CASE WHEN privacy_visible(b.privacy_settings, 'preferred_spouse_criteria') THEN b.preferred_spouse_criteria END,
    b.willingness_to_relocate, b.expected_marriage_timeline,
    CASE WHEN privacy_visible(b.privacy_settings, 'personal_bio') THEN b.personal_bio END,
    b.owner_mosque_id, b.mosque_name,
    (
      SELECT ph.photo_url FROM public.profile_photos ph
      WHERE ph.profile_id = b.id
        AND (ph.visibility = 'public' OR public.can_view_counterpart_photos(auth.uid(), b.user_id))
      ORDER BY ph.is_primary DESC, ph.uploaded_at ASC LIMIT 1
    ),
    EXISTS (
      SELECT 1 FROM public.profile_photos ph
      WHERE ph.profile_id = b.id AND ph.visibility <> 'public'
        AND NOT public.can_view_counterpart_photos(auth.uid(), b.user_id)
    ),
    (SELECT n FROM counted)
  FROM base b
  ORDER BY b.updated_at DESC
  LIMIT greatest(coalesce(p_limit, 24), 1)
  OFFSET greatest(coalesce(p_offset, 0), 0);
$$;

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
BEGIN
  IF NOT public.my_tenant_is_active() THEN
    RAISE EXCEPTION 'This service is temporarily unavailable.';
  END IF;

  SELECT p.id, p.gender, p.mosque_id, p.tenant_id INTO me
  FROM public.profiles p WHERE p.id = auth.uid();

  IF me.id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to send an interest request.';
  END IF;

  SELECT mp.user_id, pr.gender, pr.mosque_id, pr.tenant_id INTO target
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

  IF me.tenant_id IS NULL OR target.tenant_id IS NULL OR me.tenant_id <> target.tenant_id THEN
    RAISE EXCEPTION 'You can only send interest requests within your tenant.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.interest_requests
    WHERE (requester_id = me.id AND target_id = target.user_id)
       OR (requester_id = target.user_id AND target_id = me.id)
  ) THEN
    RAISE EXCEPTION 'An introduction request or completed match already exists between you and this member.';
  END IF;

  INSERT INTO public.interest_requests
    (requester_id, target_id, requester_mosque_id, target_mosque_id, message, status, tenant_id)
  VALUES (
    me.id, target.user_id, me.mosque_id, target.mosque_id,
    nullif(btrim(coalesce(p_message, '')), ''), 'submitted', me.tenant_id
  )
  RETURNING id INTO new_id;

  INSERT INTO public.notifications (user_id, title, message, type, metadata, tenant_id)
  VALUES (
    target.user_id,
    'New Introduction Request',
    'A member has sent you an introduction request. Check your Interest Requests to view details.',
    'interest_request',
    jsonb_build_object('request_id', new_id, 'requester_id', me.id),
    me.tenant_id
  );

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_interest_request(p_request_id uuid, p_accept boolean)
RETURNS request_status_enum
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req record;
  new_status request_status_enum;
BEGIN
  IF NOT public.my_tenant_is_active() THEN
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

  IF req.tenant_id IS DISTINCT FROM public.my_tenant_id() THEN
    RAISE EXCEPTION 'Cross-tenant requests are not allowed.';
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

CREATE OR REPLACE FUNCTION public.can_view_counterpart_photos(p_viewer_id uuid, p_owner_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT p1.tenant_id FROM public.profiles p1 WHERE p1.id = p_viewer_id
    ) IS NOT DISTINCT FROM (
      SELECT p2.tenant_id FROM public.profiles p2 WHERE p2.id = p_owner_user_id
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

CREATE OR REPLACE FUNCTION public.assign_mosque_admin_role(p_user_id uuid, p_mosque_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.mosques WHERE id = p_mosque_id;

  IF NOT public.is_super_admin() AND NOT public.is_ssa() THEN
    IF auth.uid() IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  ELSIF public.is_super_admin() AND NOT public.mosque_in_my_tenant(p_mosque_id) THEN
    RAISE EXCEPTION 'Unauthorized: mosque is outside your tenant.';
  END IF;

  UPDATE public.profiles
  SET
    role = 'mosque_admin'::public.user_role,
    mosque_id = COALESCE(mosque_id, p_mosque_id),
    tenant_id = COALESCE(tenant_id, v_tenant)
  WHERE id = p_user_id;

  INSERT INTO public.mosque_admin_mosques (admin_id, mosque_id, assigned_by, tenant_id)
  VALUES (p_user_id, p_mosque_id, COALESCE(auth.uid(), p_user_id), v_tenant)
  ON CONFLICT (admin_id, mosque_id) DO UPDATE
  SET tenant_id = COALESCE(public.mosque_admin_mosques.tenant_id, EXCLUDED.tenant_id);
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
    IF NOT public.is_super_admin() OR NOT public.profile_in_my_tenant(target_user_id) THEN
      RAISE EXCEPTION 'Unauthorized: Only tenant administrators can delete user profiles in their tenant.';
    END IF;
  END IF;

  SELECT ARRAY(SELECT id FROM public.marriage_profiles WHERE user_id = target_user_id)
  INTO v_profile_ids;

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
      SELECT 1 FROM public.mosque_admin_mosques mam
      WHERE mam.admin_id = v_user_id AND public.mosque_in_my_tenant(mam.mosque_id)
    ) AND NOT public.profile_in_my_tenant(v_user_id) THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.mosques m
        WHERE lower(m.contact_email) = lower(p_email)
          AND m.tenant_id = public.my_tenant_id()
      ) THEN
        RAISE EXCEPTION 'Unauthorized: admin is outside your tenant.';
      END IF;
    END IF;
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE lower(email) = lower(p_email);
END;
$$;

-- Keep profiles.tenant_id in sync when mosque_id is set/changed
CREATE OR REPLACE FUNCTION public.sync_profile_tenant_from_mosque()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mosque_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.mosque_id IS DISTINCT FROM OLD.mosque_id) THEN
    SELECT tenant_id INTO NEW.tenant_id FROM public.mosques WHERE id = NEW.mosque_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_tenant_from_mosque ON public.profiles;
CREATE TRIGGER trg_sync_profile_tenant_from_mosque
  BEFORE INSERT OR UPDATE OF mosque_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_tenant_from_mosque();

-- ---------------------------------------------------------------------------
-- 8. Drop legacy circle columns/table
-- ---------------------------------------------------------------------------
ALTER TABLE public.mosques DROP COLUMN IF EXISTS super_admin_id;
DROP TABLE IF EXISTS public.sa_circles CASCADE;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS legacy_sa_id;
