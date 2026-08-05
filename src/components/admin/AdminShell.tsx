import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
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
import { Logo } from "@/components/brand/Logo";
import { signOutAndRedirect } from "@/hooks/useSession";
import { OVERSIGHT_NOTE } from "@/lib/admin";

const NAV: { to: string; label: string; icon: typeof Gauge; exact?: boolean }[] = [
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
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin" aria-label="Mosque admin home">
              <Logo variant="lockup" />
            </Link>
            <span className="hidden rounded-md border border-border bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
              Mosque admin
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
          aria-label="Mosque admin"
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
          {OVERSIGHT_NOTE}
        </div>
      </footer>
    </div>
  );
}
