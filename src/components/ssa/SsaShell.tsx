import type { ReactNode } from "react";
import { Activity, Gauge, Settings, Users } from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";
import { SSA_NOTE } from "@/lib/ssa";

const NAV: PortalNavItem[] = [
  { to: "/ssa", label: "Dashboard", icon: Gauge, exact: true },
  { to: "/ssa/super-admins", label: "Super admins", icon: Users },
  { to: "/ssa/settings", label: "Settings", icon: Settings },
  { to: "/ssa/audit", label: "Audit log", icon: Activity },
];

export function SsaShell({
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
      badge="Platform owner"
      homeTo="/ssa"
      roleLabel="Platform owner"
      title={title}
      description={description}
      actions={actions}
      footerNote={SSA_NOTE}
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
