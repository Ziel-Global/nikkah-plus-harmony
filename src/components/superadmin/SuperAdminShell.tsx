import type { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  Flag,
  Gauge,
  IdCard,
  ShieldAlert,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";
import { PLATFORM_NOTE } from "@/lib/superadmin";

const NAV: PortalNavItem[] = [
  { to: "/superadmin", label: "Dashboard", icon: Gauge, exact: true },
  { to: "/superadmin/users", label: "Users", icon: Users },
  { to: "/superadmin/profiles", label: "Profiles", icon: IdCard },
  { to: "/superadmin/mosques", label: "Mosques", icon: Building2 },
  { to: "/superadmin/requests", label: "Requests & matches", icon: ShieldCheck },
  { to: "/superadmin/moderation", label: "Moderation", icon: Flag },
  { to: "/superadmin/flags", label: "Inactive flags", icon: ShieldAlert },
  { to: "/superadmin/analytics", label: "Reports", icon: BarChart3 },
  { to: "/superadmin/audit", label: "Audit log", icon: Activity },
  { to: "/superadmin/settings", label: "Settings", icon: Settings },
];

export function SuperAdminShell({
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
      badge="Platform admin"
      homeTo="/superadmin"
      roleLabel="Platform administrator"
      title={title}
      description={description}
      actions={actions}
      footerNote={PLATFORM_NOTE}
      wide
    >
      {children}
    </PortalShell>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="surface-card flex flex-col gap-1 rounded-xl border border-border p-4">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span className="text-3xl font-bold text-foreground">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
