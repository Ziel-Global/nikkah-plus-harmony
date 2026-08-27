import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SUPER_META, formatDateTime } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/superadmin/audit")({
  head: () =>
    SUPER_META("Audit log", "A read-only record of administrative actions on Marriage Database."),
  component: AuditPage,
});

type LogRow = {
  id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: unknown;
  created_at: string;
  profiles: { email: string } | null;
};

function AuditPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["superadmin", "audit"],
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(
          "id, action, target_table, target_id, metadata, created_at, profiles!activity_logs_actor_id_fkey(email)",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const rawProfiles = r["profiles"];
        return {
          ...r,
          profiles: Array.isArray(rawProfiles) ? (rawProfiles[0] ?? null) : rawProfiles,
        };
      }) as LogRow[];
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((r) =>
      [r.action, r.target_table ?? "", r.profiles?.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [data, search]);

  return (
    <SuperAdminShell
      title="Audit log"
      description="Read-only. Every administrative action recorded on the platform, newest first."
    >
      <div className="max-w-md">
        <Label htmlFor="audit-search">Search the log</Label>
        <Input
          id="audit-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Action, table or administrator"
          className="mt-1"
        />
      </div>

      <div className="surface-card mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Administrative activity log</caption>
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                When
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Administrator
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Action
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Record
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-4">
                  <Skeleton className="h-6 w-full" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-muted-foreground">
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </td>
                  <td className="px-4 py-3 text-foreground">{row.profiles?.email ?? "System"}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.action.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.target_table ?? "—"}
                    {row.target_id ? ` · ${row.target_id.slice(0, 8)}` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SuperAdminShell>
  );
}
