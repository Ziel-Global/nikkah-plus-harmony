import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Building2,
  Flag,
  Gauge,
  IdCard,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { signOutAndRedirect } from "@/hooks/useSession";
import { PLATFORM_NOTE } from "@/lib/superadmin";

const NAV: { to: string; label: string; icon: typeof Gauge; exact?: boolean }[] = [
  { to: "/superadmin", label: "Dashboard", icon: Gauge, exact: true },
  { to: "/superadmin/users", label: "Users", icon: Users },
  { to: "/superadmin/profiles", label: "Profiles", icon: IdCard },
  { to: "/superadmin/mosques", label: "Mosques", icon: Building2 },
  { to: "/superadmin/mosque-admins", label: "Mosque admins", icon: UserCog },
  { to: "/superadmin/requests", label: "Requests & matches", icon: ShieldCheck },
  { to: "/superadmin/moderation", label: "Moderation", icon: Flag },
  { to: "/superadmin/flags", label: "Inactive flags", icon: ShieldAlert },
  { to: "/superadmin/analytics", label: "Reports", icon: BarChart3 },
  { to: "/superadmin/audit", label: "Audit log", icon: Activity },
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
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/superadmin" aria-label="Platform admin home">
              <Logo variant="lockup" />
            </Link>
            <span className="hidden rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-primary sm:inline">
              Platform admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => void signOutAndRedirect()}
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </div>
        <nav
          aria-label="Platform admin"
          className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-2 pb-2 sm:px-4"
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-primary data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-h2 text-foreground">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
        <div className="mt-6">{children}</div>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-caption sm:px-6">
          {PLATFORM_NOTE}
        </div>
      </footer>
    </div>
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
