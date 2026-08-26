import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_META, formatDateTime } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/escalations")({
  head: () =>
    ADMIN_META("Escalations", "Members who have asked your mosque for support with a match."),
  component: EscalationsPage,
});

type EscalationRow = {
  id: string;
  request_id: string;
  raised_by: string;
  mosque_admin_id: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

function EscalationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "escalations"],
    queryFn: async () => {
      const [{ data: rows, error }, { data: profiles, error: pErr }] = await Promise.all([
        supabase
          .from("escalations")
          .select(
            "id, request_id, raised_by, mosque_admin_id, reason, status, created_at, resolved_at",
          )
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
      return { rows: (rows ?? []) as EscalationRow[], names };
    },
  });

  const resolve = useMutation({
    mutationFn: async (row: EscalationRow) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("escalations")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          mosque_admin_id: row.mosque_admin_id ?? auth.user?.id ?? null,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as resolved.");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = data?.rows ?? [];
  const list = (status: string) => rows.filter((r) => r.status === status);

  const render = (items: EscalationRow[], canResolve: boolean) => {
    if (isLoading) return <Skeleton className="h-32 w-full" />;
    if (items.length === 0)
      return <p className="text-sm text-muted-foreground">Nothing here at the moment.</p>;
    return (
      <ul className="space-y-3">
        {items.map((row) => (
          <li key={row.id} className="surface-card rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  Raised by {data?.names.get(row.raised_by) ?? "a member of your mosque"}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {row.reason?.trim() || "No further detail was given."}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDateTime(row.created_at)}
                  {row.resolved_at ? ` · resolved ${formatDateTime(row.resolved_at)}` : ""}
                  {row.mosque_admin_id ? "" : " · not yet picked up by an admin"}
                </p>
              </div>
              <Badge variant={row.status === "open" ? "default" : "secondary"}>{row.status}</Badge>
            </div>
            {canResolve && (
              <Button
                className="mt-4 min-h-11"
                disabled={resolve.isPending}
                onClick={() => resolve.mutate(row)}
              >
                Mark as resolved
              </Button>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <AdminShell
      title="Escalations"
      description="Members can ask their mosque for guidance during a match. Support them pastorally — you can close the escalation, but not the match itself."
    >
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({list("open").length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">
          {render(list("open"), true)}
        </TabsContent>
        <TabsContent value="resolved" className="mt-4">
          {render(list("resolved"), false)}
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
