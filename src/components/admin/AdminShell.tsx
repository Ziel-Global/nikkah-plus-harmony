import type { ReactNode } from "react";
import {
  Building2,
  ClipboardCheck,
  Flag,
  Gauge,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";
import { OVERSIGHT_NOTE } from "@/lib/admin";

const NAV: PortalNavItem[] = [
  { to: "/admin", label: "Overview", icon: Gauge, exact: true },
  { to: "/admin/affiliations", label: "Affiliation requests", icon: ClipboardCheck },
  { to: "/admin/members", label: "Linked members", icon: Users },
  { to: "/admin/matches", label: "Requests & matches", icon: ShieldCheck },
  { to: "/admin/escalations", label: "Escalations", icon: LifeBuoy },
  { to: "/admin/conduct", label: "Conduct reports", icon: Flag },
  { to: "/admin/mosque", label: "Mosque profile", icon: Building2 },
  { to: "/admin/settings", label: "Account settings", icon: Settings },
];

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PortalShell
      items={NAV}
      badge="Mosque admin"
      homeTo="/admin"
      roleLabel="Mosque administrator"
      title={title}
      description={description}
      actions={actions}
      footerNote={OVERSIGHT_NOTE}
      wide
    >
      {children}
    </PortalShell>
  );
}
