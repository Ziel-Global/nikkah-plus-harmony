import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_META, formatDateTime, type AdminMosque } from "@/lib/admin";
import { STATUS_LABEL, type RequestStatus } from "@/lib/requests";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/matches")({
  head: () =>
    ADMIN_META(
      "Requests & matches",
      "A read-only view of introductions connected to your mosque.",
    ),
  component: MatchesPage,
});

type RequestRow = {
  id: string;
  requester_id: string;
  target_id: string;
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
};

function MatchesPage() {
  const { mosques } = useRouteContext({ from: "/_authenticated/admin" }) as { mosques: AdminMosque[] };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "matches", mosques.map((m) => m.id)],
    queryFn: async () => {
      const [{ data: requests, error }, { data: profiles, error: pErr }] = await Promise.all([
        supabase
          .from("interest_requests")
          .select("id, requester_id, target_id, status, created_at, responded_at")
          .order("created_at", { ascending: false }),
        supabase.from("marriage_profiles").select("user_id, display_name"),
      ]);
      if (error) throw error;
      if (pErr) throw pErr;
      const names = new Map(
        ((profiles ?? []) as { user_id: string; display_name: string | null }[]).map((p) => [
          p.user_id,
          p.display_name,
        ]),
      );
      return { requests: (requests ?? []) as RequestRow[], names };
    },
  });

  const label = (id: string) => data?.names.get(id) ?? "Member outside your mosque";

  return (
    <AdminShell
      title="Requests & matches"
      description="Oversight only. You can see that introductions exist so you can support your community, and nothing more."
    >
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-secondary/50 bg-secondary/10 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="font-semibold text-foreground">Read-only — mosques do not control matches</p>
          <p className="mt-1 text-sm text-muted-foreground">
            There are no accept, decline or close actions on this page by design. Members and their
            families decide who they proceed with; messages, shared contact details and closing
            feedback are never shown to mosque admins.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (data?.requests.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">
          No introductions involving your mosque yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {data?.requests.map((row) => (
            <li
              key={row.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {label(row.requester_id)} → {label(row.target_id)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Started {formatDateTime(row.created_at)}
                  {row.responded_at ? ` · answered ${formatDateTime(row.responded_at)}` : ""}
                </p>
              </div>
              <Badge variant="secondary">{STATUS_LABEL[row.status] ?? row.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
