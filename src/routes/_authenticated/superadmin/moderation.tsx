import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { REPORT_STATUS_LABEL, SUPER_META, formatDateTime, logActivity } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/superadmin/moderation")({
  head: () => SUPER_META("Moderation", "Review conduct reports and act to keep members safe."),
  component: ModerationPage,
});

type Report = {
  id: string;
  reported_profile_id: string;
  reported_by: string;
  reason: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  marriage_profiles: { id: string; display_name: string | null; user_id: string } | null;
};

type Action = "warn" | "suspend" | "dismiss";

const ACTION_COPY: Record<Action, { title: string; body: string; status: string }> = {
  warn: {
    title: "Record a warning",
    status: "action_taken",
    body: "Note the warning given to this member. Their account stays active.",
  },
  suspend: {
    title: "Suspend the reported member",
    status: "action_taken",
    body: "The account will be suspended immediately and the member loses access.",
  },
  dismiss: {
    title: "Dismiss this report",
    status: "dismissed",
    body: "No further action will be taken. Explain the reasoning for the record.",
  },
};

function ModerationPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState<{ report: Report; action: Action } | null>(null);
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin", "reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conduct_reports")
        .select(
          "id, reported_profile_id, reported_by, reason, status, resolution_notes, created_at, resolved_at, marriage_profiles(id, display_name, user_id)",
        )
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as Report[];
    },
  });

  const rows = useMemo(
    () => (data ?? []).filter((r) => (tab === "all" ? true : r.status === tab)),
    [data, tab],
  );

  const resolve = useMutation({
    mutationFn: async ({ report, action }: { report: Report; action: Action }) => {
      const copy = ACTION_COPY[action];
      const { error } = await supabase
        .from("conduct_reports")
        .update({
          status: copy.status as never,
          resolution_notes: notes.trim() || null,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", report.id);
      if (error) throw error;

      if (action === "suspend" && report.marriage_profiles?.user_id) {
        const { error: suspendError } = await supabase
          .from("profiles")
          .update({ account_status: "suspended" as never })
          .eq("id", report.marriage_profiles.user_id);
        if (suspendError) throw suspendError;
      }

      await logActivity(`conduct_report_${action}`, "conduct_reports", report.id);
    },
    onSuccess: () => {
      toast.success("Report resolved.");
      setPending(null);
      setNotes("");
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SuperAdminShell
      title="Moderation queue"
      description="Conduct reports raised by members and mosque admins. Handle every report with care and discretion."
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {["pending", "action_taken", "dismissed", "all"].map((t) => (
            <TabsTrigger key={t} value={t}>
              {t === "all" ? "All" : (REPORT_STATUS_LABEL[t] ?? t)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing in this queue.</p>
          ) : (
            rows.map((report) => (
              <div key={report.id} className="surface-card rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      Report about {report.marriage_profiles?.display_name ?? "a member"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Raised {formatDateTime(report.created_at)}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm text-foreground">{report.reason}</p>
                    {report.resolution_notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Resolution: {report.resolution_notes}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={report.status === "pending" ? "outline" : "secondary"}>
                    {REPORT_STATUS_LABEL[report.status] ?? report.status}
                  </Badge>
                </div>
                {report.status === "pending" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setPending({ report, action: "warn" })}>
                      Warn member
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPending({ report, action: "suspend" })}
                    >
                      Suspend member
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPending({ report, action: "dismiss" })}
                    >
                      Dismiss
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(pending)} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending ? ACTION_COPY[pending.action].title : ""}</DialogTitle>
            <DialogDescription>{pending ? ACTION_COPY[pending.action].body : ""}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Resolution notes for the record"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              disabled={!notes.trim() || resolve.isPending}
              onClick={() => pending && resolve.mutate(pending)}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminShell>
  );
}
