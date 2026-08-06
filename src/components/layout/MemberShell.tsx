import type { ReactNode } from "react";
import { Gauge, Heart, Inbox, Search, UserRound } from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";
import { DEFAULT_FILTERS } from "@/lib/browse";

const NAV: PortalNavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge, exact: true },
  { to: "/profile", label: "My profile", icon: UserRound },
  { to: "/browse", label: "Browse members", icon: Search, search: DEFAULT_FILTERS },
  { to: "/requests", label: "Interest requests", icon: Inbox },
  { to: "/match", label: "Active match", icon: Heart },
];

export function MemberShell({
  title,
  description,
  actions,
  wide = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <PortalShell
      items={NAV}
      homeTo="/dashboard"
      roleLabel="Member"
      title={title}
      description={description}
      actions={actions}
      wide={wide}
      footerNote="Nikkah+ — Faith. Family. Future. Your details stay private and are only shared with your mosque for verification."
    >
      {children}
    </PortalShell>
  );
}
