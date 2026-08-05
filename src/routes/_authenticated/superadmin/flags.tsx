import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUPER_META, formatDateTime, logActivity } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/superadmin/flags")({
  head: () =>
    SUPER_META("Inactive flags", "Review accounts flagged as dormant and decide what happens next."),
  component: FlagsPage,
});

type FlagRow = {
  id: string;
  user_id: string;
  flag_reason: string;
  flagged_at: string;
  reviewed_at: string | null;
  action_taken: string;
  profiles: { email: string; account_status: string; last_login_at: string | null } | null;
};

const ACTION_LABEL: Record<string, string> = {
  none: "Awaiting review",
  suspended: "Suspended",
  dismissed: "Dismissed",
};

function FlagsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("none");

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin", "flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_flags")
        .select(
          "id, user_id, flag_reason, flagged_at, reviewed_at, action_taken, profiles!account_flags_user_id_fkey(email, account_status, last_login_at)",
        )
        .order("flagged_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as FlagRow[];
    },
  });

  const rows = useMemo(
    () => (data ?? []).filter((r) => (tab === "all" ? true : r.action_taken === tab)),
    [data, tab],
  );

  const act = useMutation({
    mutationFn: async ({ row, action }: { row: FlagRow; action: "suspended" | "dismissed" }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("account_flags")
        .update({
          action_taken: action as never,
          reviewed_by: auth.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;

      if (action === "suspended") {
        const { error: suspendError } = await supabase
          .from("profiles")
          .update({ account_status: "suspended" as never })
          .eq("id", row.user_id);
        if (suspendError) throw suspendError;
      }

      await logActivity(`account_flag_${action}`, "account_flags", row.id);
    },
    onSuccess: () => {
      toast.success("Flag reviewed.");
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SuperAdminShell
      title="Flagged inactive accounts"
      description="Accounts flagged for long dormancy. Reviewing a flag either suspends the account or clears it."
    >
      <div className="surface-card rounded-xl border border-border p-4 text-sm text-muted-foreground">
        Flags are created by a scheduled dormancy check against each member's last sign-in. That
        scheduled job is not yet running — this queue shows any flags already recorded.
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="flex-wrap">
          {["none", "suspended", "dismissed", "all"].map((t) => (
            <TabsTrigger key={t} value={t}>
              {t === "all" ? "All" : (ACTION_LABEL[t] ?? t)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No flags in this view.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="surface-card rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{row.profiles?.email ?? row.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Flagged {formatDateTime(row.flagged_at)} · last sign-in{" "}
                      {formatDateTime(row.profiles?.last_login_at ?? null)}
                    </p>
                    <p className="mt-2 text-sm text-foreground">{row.flag_reason}</p>
                  </div>
                  <Badge variant={row.action_taken === "none" ? "outline" : "secondary"}>
                    {ACTION_LABEL[row.action_taken] ?? row.action_taken}
                  </Badge>
                </div>
                {row.action_taken === "none" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={act.isPending}
                      onClick={() => act.mutate({ row, action: "suspended" })}
                    >
                      Suspend account
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={act.isPending}
                      onClick={() => act.mutate({ row, action: "dismissed" })}
                    >
                      Dismiss flag
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </SuperAdminShell>
  );
}
