import { supabase } from "@/integrations/supabase/client";

export const OVERSIGHT_NOTE =
  "Mosques verify and oversee. They never control who matches with whom.";

export type AdminMosque = { id: string; name: string };

/** Mosques the signed-in admin is assigned to via mosque_admin_mosques. */
export async function fetchMyMosques(): Promise<AdminMosque[]> {
  const { data, error } = await supabase
    .from("mosque_admin_mosques")
    .select("mosque_id, mosques(id, name)");
  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const raw = row.mosques as unknown as
        { id: string; name: string } | { id: string; name: string }[] | null;
      const mosque = Array.isArray(raw) ? (raw[0] ?? null) : raw;
      return mosque && mosque.id && mosque.name ? { id: mosque.id, name: mosque.name } : null;
    })
    .filter((m): m is AdminMosque => Boolean(m));
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

export const PROFILE_STATUS_LABEL: Record<string, string> = {
  draft: "Draft — not yet submitted",
  submitted: "Submitted for review",
  mosque_verified: "Verified by mosque",
  approved: "Approved and visible",
  rejected: "Returned for changes",
  inactive: "Inactive",
};

export const ADMIN_META = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Nikkah+ mosque admin` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Nikkah+ mosque admin` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
