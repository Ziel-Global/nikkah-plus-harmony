import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SsaShell, StatCard } from "@/components/ssa/SsaShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SSA_META, SSA_NOTE } from "@/lib/ssa";
import { fetchSaTenantRows } from "@/lib/ssa-queries";
import { formatDay } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/ssa/")({
  head: () => SSA_META("Dashboard", "Overview of super admin tenants across the platform."),
  component: SsaDashboard,
});

function SsaDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["ssa", "tenants"],
    queryFn: fetchSaTenantRows,
  });

  const total = data?.length ?? 0;
  const active = data?.filter((r) => r.is_active).length ?? 0;
  const inactive = total - active;

  if (isLoading || !data) {
    return (
      <SsaShell title="Platform owner dashboard" description={SSA_NOTE}>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </SsaShell>
    );
  }

  return (
    <SsaShell
      title="Platform owner dashboard"
      description={`Tenants and super admins at a glance. ${SSA_NOTE}`}
    >
      <section aria-labelledby="ssa-kpis">
        <h2 id="ssa-kpis" className="text-h3 text-foreground">
          Super admins
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total tenants" value={total} />
          <StatCard label="Active" value={active} hint="Tenants currently available" />
          <StatCard label="Inactive" value={inactive} hint="Temporarily unavailable" />
        </div>
      </section>

      <section aria-labelledby="ssa-tenants" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ssa-tenants" className="text-h3 text-foreground">
            Tenants
          </h2>
          <Link
            to="/ssa/super-admins"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Manage super admins
          </Link>
        </div>

        <div className="surface-card mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Super admin tenants</caption>
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Tenant
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Super admin
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Mosques
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Members
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-muted-foreground">
                    No super admin tenants yet.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.tenant_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link
                        to="/ssa/super-admins/$saId"
                        params={{ saId: row.super_admin_id }}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {row.circle_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {[row.first_name, row.last_name].filter(Boolean).join(" ") ||
                        row.email ||
                        "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={row.is_active ? "success" : "secondary"}>
                        {row.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.mosque_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.member_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDay(row.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </SsaShell>
  );
}
