import { supabase } from "@/integrations/supabase/client";

/**
 * Central access model for Marriage Database.
 *
 * All route guarding decisions for authenticated routes are derived here so the
 * redirect logic lives in exactly one place. These are frontend UX guards only —
 * Row Level Security remains the real data-access boundary.
 */

export type AppRole = "male_user" | "female_user" | "mosque_admin" | "super_admin";
export type AffiliationStatus = "pending" | "approved" | "rejected" | null;

export type AccessState = {
  userId: string | null;
  role: AppRole | null;
  /** member onboarding: gender chosen, mosque requested, terms accepted */
  onboardingComplete: boolean;
  affiliationStatus: AffiliationStatus;
  /** mosque admins only: linked to at least one mosque */
  hasMosqueAssignment: boolean;
};

export const SIGNED_OUT: AccessState = {
  userId: null,
  role: null,
  onboardingComplete: false,
  affiliationStatus: null,
  hasMosqueAssignment: false,
};

/** Reads everything the guard needs in as few round-trips as possible. */
export async function fetchAccessState(): Promise<AccessState> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authError || !user) return SIGNED_OUT;

  let { data: profile } = await supabase
    .from("profiles")
    .select("role, gender, terms_accepted_at")
    .eq("id", user.id)
    .maybeSingle();

  // If user exists but profile isn't found, retry once after 500ms to allow DB trigger execution
  if (!profile) {
    await new Promise((res) => setTimeout(res, 500));
    const retry = await supabase
      .from("profiles")
      .select("role, gender, terms_accepted_at")
      .eq("id", user.id)
      .maybeSingle();
    profile = retry.data;
  }

  const role = (profile?.role as AppRole | undefined) ?? null;

  if (role === "super_admin") {
    return { ...SIGNED_OUT, userId: user.id, role };
  }

  if (role === "mosque_admin") {
    const { data: link } = await supabase
      .from("mosque_admin_mosques")
      .select("mosque_id")
      .limit(1)
      .maybeSingle();
    return {
      userId: user.id,
      role,
      onboardingComplete: true,
      affiliationStatus: null,
      hasMosqueAssignment: Boolean(link),
    };
  }

  const { data: affiliation } = await supabase
    .from("mosque_affiliation_requests")
    .select("status")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const affiliationStatus = (affiliation?.status as AffiliationStatus) ?? null;

  return {
    userId: user.id,
    role,
    onboardingComplete: Boolean(profile?.gender && profile?.terms_accepted_at && affiliationStatus),
    affiliationStatus,
    hasMosqueAssignment: false,
  };
}

const MEMBER_PREFIXES = ["/dashboard", "/browse", "/profile", "/requests", "/match", "/member"];

type Area = "onboarding" | "pending" | "member" | "admin" | "superadmin" | "other";

export function areaFor(pathname: string): Area {
  if (pathname.startsWith("/onboarding")) return "onboarding";
  if (pathname.startsWith("/pending")) return "pending";
  if (pathname.startsWith("/superadmin")) return "superadmin";
  if (pathname.startsWith("/admin")) return "admin";
  if (MEMBER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return "member";
  return "other";
}

/** Where a signed-in user belongs when they have no specific destination. */
export function landingPath(state: AccessState): string {
  if (state.role === "super_admin") return "/superadmin";
  if (state.role === "mosque_admin") return "/admin";
  if (!state.onboardingComplete) return "/onboarding";
  if (state.affiliationStatus === "approved") return "/dashboard";
  return "/pending";
}

/**
 * Returns the path to redirect to, or null when the user may stay.
 * Priority order matches the product access matrix.
 */
export function resolveRedirect(state: AccessState, pathname: string): string | null {
  if (!state.userId) return "/auth";

  const area = areaFor(pathname);
  const home = landingPath(state);

  if (state.role === "super_admin") {
    return area === "superadmin" ? null : "/superadmin";
  }

  if (state.role === "mosque_admin") {
    return area === "admin" ? null : "/admin";
  }

  // Members (male_user / female_user) and any unknown role.
  if (area === "admin" || area === "superadmin") return home;

  if (!state.onboardingComplete) {
    return area === "onboarding" ? null : "/onboarding";
  }

  if (state.affiliationStatus === "approved") {
    return area === "onboarding" || area === "pending" ? "/dashboard" : null;
  }

  if (state.affiliationStatus === "rejected") {
    // Not a dead end: they may reselect a mosque from /onboarding.
    return area === "pending" || area === "onboarding" ? null : "/pending";
  }

  // pending affiliation
  return area === "pending" ? null : "/pending";
}
