import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminShell, StatCard } from "@/components/superadmin/SuperAdminShell";
import { Skeleton } from "@/components/ui/skeleton";
import { REQUEST_STATUS_LABEL, SUPER_META } from "@/lib/superadmin";
import { fetchPlatformKpis } from "./index";

export const Route = createFileRoute("/_authenticated/superadmin/analytics")({
  head: () =>
    SUPER_META("Reports", "Platform breakdowns and mosque verification turnaround times."),
  component: AnalyticsPage,
});

type TurnaroundRow = {
  mosque_id: string;
  created_at: string;
  reviewed_at: string | null;
  mosques: { name: string } | null;
};

function hours(from: string, to: string) {
  return (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000;
}

function formatHours(value: number | null) {
  if (value === null) return "—";
  if (value < 24) return `${value.toFixed(1)} hrs`;
  return `${(value / 24).toFixed(1)} days`;
}

function AnalyticsPage() {
  const kpis = useQuery({ queryKey: ["superadmin", "kpis"], queryFn: fetchPlatformKpis });

  const turnaround = useQuery({
    queryKey: ["superadmin", "turnaround"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosque_affiliation_requests")
        .select(
          "mosque_id, created_at, reviewed_at, mosques!mosque_affiliation_requests_mosque_id_fkey(name)",
        )
        .not("reviewed_at", "is", null)
        .limit(2000);
      if (error) throw error;

      const rows = (data ?? []).map((r: Record<string, unknown>) => {
        const rawMosques = r["mosques"];
        return {
          ...r,
          mosques: Array.isArray(rawMosques) ? (rawMosques[0] ?? null) : rawMosques,
        };
      }) as TurnaroundRow[];
      const byMosque = new Map<string, { name: string; total: number; count: number }>();
      let grandTotal = 0;

      for (const row of rows) {
        if (!row.reviewed_at) continue;
        const h = hours(row.created_at, row.reviewed_at);
        grandTotal += h;
        const key = row.mosque_id;
        const existing = byMosque.get(key) ?? {
          name: row.mosques?.name ?? "Unknown mosque",
          total: 0,
          count: 0,
        };
        existing.total += h;
        existing.count += 1;
        byMosque.set(key, existing);
      }

      return {
        reviewed: rows.length,
        average: rows.length ? grandTotal / rows.length : null,
        mosques: [...byMosque.values()]
          .map((m) => ({ name: m.name, average: m.total / m.count, count: m.count }))
          .sort((a, b) => a.average - b.average),
      };
    },
  });

  return (
    <SuperAdminShell
      title="Reports & analytics"
      description="How the platform is performing, and how quickly mosques verify the members who join them."
    >
      <section aria-labelledby="breakdown-heading">
        <h2 id="breakdown-heading" className="text-h3 text-foreground">
          Platform breakdown
        </h2>
        {kpis.isLoading || !kpis.data ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total accounts" value={kpis.data.users} />
            <StatCard label="Brothers" value={kpis.data.male} />
            <StatCard label="Sisters" value={kpis.data.female} />
            <StatCard label="Suspended" value={kpis.data.suspended} />
            <StatCard label="Approved profiles" value={kpis.data.approvedProfiles} />
            <StatCard label="Awaiting review" value={kpis.data.submittedProfiles} />
            <StatCard label="Inactive profiles" value={kpis.data.inactiveProfiles} />
            <StatCard
              label="Mosques"
              value={kpis.data.mosques}
              hint={`${kpis.data.activeMosques} active`}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="requests-heading" className="mt-8">
        <h2 id="requests-heading" className="text-h3 text-foreground">
          Introductions by status
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.data
            ? Object.entries(kpis.data.byStatus).map(([status, value]) => (
                <StatCard
                  key={status}
                  label={REQUEST_STATUS_LABEL[status] ?? status}
                  value={value}
                />
              ))
            : null}
        </div>
      </section>

      <section aria-labelledby="turnaround-heading" className="mt-8">
        <h2 id="turnaround-heading" className="text-h3 text-foreground">
          Mosque verification turnaround
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Time between a member requesting affiliation and their mosque reviewing it.
        </p>
        {turnaround.isLoading || !turnaround.data ? (
          <Skeleton className="mt-3 h-40 rounded-xl" />
        ) : (
          <>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <StatCard label="Requests reviewed" value={turnaround.data.reviewed} />
              <StatCard
                label="Average turnaround"
                value={formatHours(turnaround.data.average)}
                hint="Across every mosque"
              />
            </div>
            <div className="surface-card mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Average verification turnaround per mosque</caption>
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Mosque
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Reviewed
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Average turnaround
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {turnaround.data.mosques.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-muted-foreground">
                        No affiliation requests have been reviewed yet.
                      </td>
                    </tr>
                  ) : (
                    turnaround.data.mosques.map((m) => (
                      <tr key={m.name} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.count}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatHours(m.average)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </SuperAdminShell>
  );
}
