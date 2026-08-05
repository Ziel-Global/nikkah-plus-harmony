import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

const TABS = [
  { to: "/superadmin/settings", label: "General", exact: true },
  { to: "/superadmin/settings/branding", label: "Branding & theme" },
  { to: "/superadmin/settings/workflow", label: "Workflow" },
  { to: "/superadmin/settings/roles", label: "Roles & permissions" },
];

export function SettingsNav() {
  return (
    <div className="mb-6 space-y-4">
      <nav aria-label="Platform settings" className="flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.exact ?? false }}
            className="rounded-md border border-transparent px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-primary data-[status=active]:border-primary/30 data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <p
        role="note"
        className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Platform admin only.</strong> Changes saved here apply
          to the entire platform immediately — every member, mosque admin and public visitor sees
          them on their next page load.
        </span>
      </p>
    </div>
  );
}
