import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminShell, StatCard } from "@/components/superadmin/SuperAdminShell";
import { Skeleton } from "@/components/ui/skeleton";
import { PLATFORM_NOTE, REQUEST_STATUS_LABEL, SUPER_META } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/superadmin/")({
  head: () =>
    SUPER_META("Dashboard", "Platform-wide oversight of members, mosques and introductions."),
  component: SuperDashboard,
});

const REQUEST_STATUSES = [
  "submitted",
  "active_match",
  "closed_mutual",
  "closed_declined",
  "cancelled",
] as const;

async function count(build: () => PromiseLike<{ count: number | null }>) {
  const { count: c } = await build();
  return c ?? 0;
}

export async function fetchPlatformKpis() {
  const [
    users,
    male,
    female,
    activeAccounts,
    suspended,
    approvedProfiles,
    submittedProfiles,
    inactiveProfiles,
    mosques,
    activeMosques,
    pendingReports,
    openFlags,
  ] = await Promise.all([
    count(() => supabase.from("profiles").select("id", { count: "exact", head: true })),
    count(() => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("gender", "male")),
    count(() => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("gender", "female")),
    count(() => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "active")),
    count(() => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "suspended")),
    count(() => supabase.from("marriage_profiles").select("id", { count: "exact", head: true }).eq("status", "approved")),
    count(() => supabase.from("marriage_profiles").select("id", { count: "exact", head: true }).eq("status", "submitted")),
    count(() => supabase.from("marriage_profiles").select("id", { count: "exact", head: true }).eq("status", "inactive")),
    count(() => supabase.from("mosques").select("id", { count: "exact", head: true })),
    count(() => supabase.from("mosques").select("id", { count: "exact", head: true }).eq("status", "active")),
    count(() => supabase.from("conduct_reports").select("id", { count: "exact", head: true }).eq("status", "pending")),
    count(() => supabase.from("account_flags").select("id", { count: "exact", head: true }).eq("action_taken", "none")),
  ]);

  const byStatus: Record<string, number> = {};
  for (const status of REQUEST_STATUSES) {
    byStatus[status] = await count(() =>
      supabase.from("interest_requests").select("id", { count: "exact", head: true }).eq("status", status),
    );
  }

  return {
    users,
    male,
    female,
    activeAccounts,
    suspended,
    approvedProfiles,
    submittedProfiles,
    inactiveProfiles,
    mosques,
    activeMosques,
    pendingReports,
    openFlags,
    byStatus,
  };
}

function SuperDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["superadmin", "kpis"],
    queryFn: fetchPlatformKpis,
  });

  if (isLoading || !data) {
    return (
      <SuperAdminShell title="Platform dashboard" description={PLATFORM_NOTE}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell
      title="Platform dashboard"
      description={`Everything happening across Nikkah+ at a glance. ${PLATFORM_NOTE}`}
    >
      <section aria-labelledby="people-heading">
        <h2 id="people-heading" className="text-h3 text-foreground">
          People
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total accounts" value={data.users} hint={`${data.activeAccounts} active`} />
          <StatCard label="Brothers" value={data.male} hint="Registered as male" />
          <StatCard label="Sisters" value={data.female} hint="Registered as female" />
          <StatCard label="Suspended accounts" value={data.suspended} hint="Access withdrawn" />
        </div>
      </section>

      <section aria-labelledby="profiles-heading" className="mt-8">
        <h2 id="profiles-heading" className="text-h3 text-foreground">
          Marriage profiles
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Approved & visible" value={data.approvedProfiles} />
          <StatCard label="Awaiting review" value={data.submittedProfiles} />
          <StatCard label="Inactive" value={data.inactiveProfiles} />
          <StatCard label="Mosques" value={data.mosques} hint={`${data.activeMosques} active`} />
        </div>
      </section>

      <section aria-labelledby="requests-heading" className="mt-8">
        <h2 id="requests-heading" className="text-h3 text-foreground">
          Introductions
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REQUEST_STATUSES.map((status) => (
            <StatCard
              key={status}
              label={REQUEST_STATUS_LABEL[status] ?? status}
              value={data.byStatus[status] ?? 0}
            />
          ))}
          <StatCard
            label="Successful matches"
            value={data.byStatus.closed_mutual ?? 0}
            hint="Closed with mutual agreement"
          />
        </div>
      </section>

      <section aria-labelledby="attention-heading" className="mt-8">
        <h2 id="attention-heading" className="text-h3 text-foreground">
          Needs attention
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Link
            to="/superadmin/moderation"
            className="surface-card rounded-xl border border-border p-4 transition-shadow hover:shadow-md"
          >
            <span className="text-sm font-semibold text-muted-foreground">Conduct reports pending</span>
            <p className="text-3xl font-bold text-foreground">{data.pendingReports}</p>
          </Link>
          <Link
            to="/superadmin/flags"
            className="surface-card rounded-xl border border-border p-4 transition-shadow hover:shadow-md"
          >
            <span className="text-sm font-semibold text-muted-foreground">Flagged accounts unreviewed</span>
            <p className="text-3xl font-bold text-foreground">{data.openFlags}</p>
          </Link>
        </div>
      </section>
    </SuperAdminShell>
  );
}
