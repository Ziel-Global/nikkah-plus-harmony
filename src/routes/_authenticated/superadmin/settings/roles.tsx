import { createFileRoute } from "@tanstack/react-router";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { SettingsNav } from "@/components/superadmin/SettingsNav";
import { SUPER_META } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/superadmin/settings/roles")({
  head: () => SUPER_META("Roles & permissions", "Reference guide to what each role can do."),
  component: RolesSettingsPage,
});

const ROLES: { name: string; key: string; can: string[]; cannot: string[] }[] = [
  {
    name: "Member (brother)",
    key: "male_user",
    can: [
      "Create and edit their own marriage profile, with field-level privacy controls",
      "Browse approved sisters' profiles once their mosque affiliation is approved",
      "Send and respond to interest requests, one active match at a time",
      "Consent to sharing their contact details and submit closing feedback",
    ],
    cannot: [
      "See profiles of the same gender",
      "See any member's phone or email before mutual consent",
      "Approve their own profile or mosque affiliation",
    ],
  },
  {
    name: "Member (sister)",
    key: "female_user",
    can: [
      "Create and edit their own marriage profile, including wali/guardian details",
      "Browse approved brothers' profiles once their mosque affiliation is approved",
      "Accept or decline interest requests and loop in their wali",
      "Consent to sharing their contact details and submit closing feedback",
    ],
    cannot: [
      "See profiles of the same gender",
      "See any member's phone or email before mutual consent",
      "Approve their own profile or mosque affiliation",
    ],
  },
  {
    name: "Mosque admin",
    key: "mosque_admin",
    can: [
      "Approve or reject mosque affiliation requests for their assigned mosque(s)",
      "View linked members and verify their profiles",
      "See that a match is active, and resolve escalations raised to them",
      "File conduct reports and maintain their mosque's public details",
    ],
    cannot: [
      "Match, pair or introduce members — members choose for themselves",
      "See contact details shared between matched members",
      "See members or matches outside their assigned mosque(s)",
    ],
  },
  {
    name: "Platform admin",
    key: "super_admin",
    can: [
      "See and manage every account, profile, mosque and mosque admin",
      "Review and override profile approvals, moderate conduct reports",
      "Change platform branding, workflow settings and account standing",
      "Read the platform-wide audit log",
    ],
    cannot: [
      "See contact details exchanged between matched members",
      "Read a member's private closing feedback notes attributed to them",
      "Match or pair members",
    ],
  },
];

function RolesSettingsPage() {
  return (
    <SuperAdminShell
      title="Settings"
      description="Configuration that applies to the whole Marriage Database platform."
    >
      <SettingsNav />

      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Read-only reference. Permissions are enforced in the database itself, not just in these
        screens. Granular permission editing is a later phase.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((role) => (
          <section key={role.key} className="surface-card space-y-3 rounded-xl p-5">
            <div>
              <h2 className="text-h3 text-foreground">{role.name}</h2>
              <p className="font-mono text-xs text-muted-foreground">{role.key}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-success">Can</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                {role.can.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cannot
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {role.cannot.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </SuperAdminShell>
  );
}
