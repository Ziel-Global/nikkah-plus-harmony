import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_META, formatDateTime } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/conduct")({
  head: () =>
    ADMIN_META("Conduct reports", "Raise a conduct concern about a member of your mosque."),
  component: ConductPage,
});

type ReportRow = {
  id: string;
  reported_profile_id: string;
  reason: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
};

function ConductPage() {
  const queryClient = useQueryClient();
  const [profileId, setProfileId] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "conduct"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: reports, error: rErr }] = await Promise.all([
        supabase.from("marriage_profiles").select("id, display_name, user_id, status"),
        supabase
          .from("conduct_reports")
          .select("id, reported_profile_id, reason, status, resolution_notes, created_at, resolved_at")
          .order("created_at", { ascending: false }),
      ]);
      if (error) throw error;
      if (rErr) throw rErr;
      return {
        profiles: (profiles ?? []) as { id: string; display_name: string | null }[],
        reports: (reports ?? []) as ReportRow[],
      };
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("conduct_reports").insert({
        reported_profile_id: profileId,
        reported_by: auth.user?.id as string,
        reason: reason.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report filed. The platform team will review it.");
      setProfileId("");
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["admin", "conduct"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const nameFor = (id: string) =>
    data?.profiles.find((p) => p.id === id)?.display_name ?? "A member";

  return (
    <AdminShell
      title="Conduct reports"
      description="If a member behaves in a way that falls short of the community guidelines, raise it here. Reports go to the platform team — filing one does not end anybody's match."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="surface-card space-y-4 rounded-xl border border-border p-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate();
          }}
        >
          <h2 className="text-h3 text-foreground">Report a member</h2>

          <div className="space-y-2">
            <Label htmlFor="profile">Member</Label>
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger id="profile" className="min-h-11">
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {(data?.profiles ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name ?? "Unnamed profile"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">What happened?</Label>
            <Textarea
              id="reason"
              rows={5}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe the concern factually, including dates where you can."
            />
          </div>

          <Button
            type="submit"
            className="min-h-11"
            disabled={!profileId || reason.trim().length < 10 || submit.isPending}
          >
            File report
          </Button>
        </form>

        <div>
          <h2 className="text-h3 text-foreground">Reports you have filed</h2>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (data?.reports.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">You have not filed any reports.</p>
            ) : (
              data?.reports.map((report) => (
                <div key={report.id} className="surface-card rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-semibold text-foreground">
                      {nameFor(report.reported_profile_id)}
                    </p>
                    <Badge variant="secondary">{report.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{report.reason}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Filed {formatDateTime(report.created_at)}
                  </p>
                  {report.resolution_notes && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Outcome: {report.resolution_notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
