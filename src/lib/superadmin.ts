import { supabase } from "@/integrations/supabase/client";

export const PLATFORM_NOTE =
  "Platform oversight. Members and mosques are never matched or paired by administrators.";

export type PlatformProfile = {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  gender: string | null;
  mosque_id: string | null;
  account_status: string;
  verification_method: string | null;
  last_login_at: string | null;
  terms_accepted_at: string | null;
  created_at: string;
};

/** True when the signed-in account has the platform super admin role. */
export async function fetchIsSuperAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error) return false;
  return Boolean(data);
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const ROLE_LABEL: Record<string, string> = {
  male_user: "Member (brother)",
  female_user: "Member (sister)",
  mosque_admin: "Mosque admin",
  super_admin: "Platform admin",
};

export const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  deactivated: "Deactivated",
  flagged: "Flagged",
};

export const PROFILE_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted for review",
  mosque_verified: "Verified by mosque",
  approved: "Approved",
  rejected: "Returned for changes",
  inactive: "Inactive",
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  submitted: "Awaiting response",
  active_match: "Active match",
  awaiting_feedback_female: "Awaiting feedback",
  awaiting_feedback_male: "Awaiting feedback",
  closed_mutual: "Closed — mutual agreement",
  closed_declined: "Closed — declined",
  cancelled: "Cancelled",
};

export const REPORT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  reviewed: "Reviewed",
  dismissed: "Dismissed",
  action_taken: "Action taken",
};

export const SUPER_META = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Marriage Database platform admin` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Marriage Database platform admin` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/og-image.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: "/og-image.png" },
  ],
});

/** Best-effort audit trail entry; never blocks the caller's action. */
export async function logActivity(
  action: string,
  targetTable: string,
  targetId: string | null,
  metadata?: Record<string, unknown>,
) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("activity_logs").insert({
      actor_id: auth.user?.id ?? null,
      action,
      target_table: targetTable,
      target_id: targetId,
      metadata: (metadata ?? {}) as never,
    });
  } catch {
    /* audit logging is advisory only */
  }
}
