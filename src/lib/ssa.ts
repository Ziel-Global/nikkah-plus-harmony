export const SSA_NOTE =
  "Platform ownership. Super admins manage their own tenants; members are never matched by the platform owner.";

export type SaCircleListRow = {
  id: string;
  tenant_id: string;
  super_admin_id: string;
  circle_name: string;
  is_active: boolean;
  created_at: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  mosque_count: number;
  member_count: number;
};

export const ROLE_LABEL: Record<string, string> = {
  male_user: "Member (brother)",
  female_user: "Member (sister)",
  mosque_admin: "Mosque admin",
  super_admin: "Super admin",
  super_super_admin: "Platform owner",
};

export const SSA_META = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Marriage Database platform owner` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Marriage Database platform owner` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/og-image.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: "/og-image.png" },
  ],
});
