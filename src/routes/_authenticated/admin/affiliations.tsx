import { useState } from "react";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_META, formatDateTime type AdminMosque } from "@/lib/admin";
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

export const Route = createFileRoute("/_authenticated/admin/affiliations")({
  head: () =>
    ADMIN_META(
      "Affiliation requests",
      "Verify members who have asked to be affiliated with your mosque.",
    ),
  component: AffiliationsPage,
});

type AffiliationRow = {
  id: string;
  user_id: string;
  mosque_id: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles: { email: string; phone: string | null; gender: string | null; role: string } | null;
};

function AffiliationsPage() {
  const { mosques } = useRouteContext({ from: "/_authenticated/admin" }) as { mosques: AdminMosque[] };
  const mosqueIds = mosques.map((m) => m.id);
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState<AffiliationRow | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "affiliations", mosqueIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosque_affiliation_requests")
        .select("id, user_id, mosque_id, status, rejection_reason, created_at, reviewed_at, profiles(email, phone, gender, role)")
        .in("mosque_id", mosqueIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AffiliationRow[];
    },
  });

  const review = useMutation({
    mutationFn: async ({
      row,
      approve,
      rejectionReason,
    }: {
      row: AffiliationRow;
      approve: boolean;
      rejectionReason?: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("mosque_affiliation_requests")
        .update({
          status: approve ? "approved" : "rejected",
          rejection_reason: approve ? null : (rejectionReason ?? null),
          reviewed_by: auth.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? "Affiliation verified." : "Request returned to the member.");
      setRejecting(null);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = data ?? [];
  const byStatus = (status: string) => rows.filter((r) => r.status === status);

  const renderList = (list: AffiliationRow[], showActions: boolean) => {
    if (isLoading) return <Skeleton className="h-32 w-full" />;
    if (list.length === 0)
      return <p className="text-sm text-muted-foreground">Nothing here at the moment.</p>;

    return (
      <ul className="space-y-3">
        {list.map((row) => (
          <li key={row.id} className="surface-card rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{row.profiles?.email ?? "Member"}</p>
                <dl className="mt-2 grid gap-1 text-sm text-muted-foreground">
                  <div>Phone: {row.profiles?.phone ?? "Not provided"}</div>
                  <div>Registered as: {row.profiles?.gender ?? "Not stated"}</div>
                  <div>Mosque: {mosques.find((m) => m.id === row.mosque_id)?.name}</div>
                  <div>Requested: {formatDateTime(row.created_at)}</div>
                  {row.reviewed_at && <div>Reviewed: {formatDateTime(row.reviewed_at)}</div>}
                  {row.rejection_reason && (
                    <div className="text-foreground">Reason given: {row.rejection_reason}</div>
                  )}
                </dl>
              </div>
              <Badge variant={row.status === "approved" ? "default" : "secondary"}>
                {row.status}
              </Badge>
            </div>

            {showActions && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  className="min-h-11"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ row, approve: true })}
                >
                  Verify affiliation
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => {
                    setRejecting(row);
                    setReason("");
                  }}
                >
                  Reject
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <AdminShell
      title="Affiliation requests"
      description="Confirm that each member genuinely belongs to your community. Verification only unlocks the platform for them — it does not decide who they may be introduced to."
    >
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({byStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          {renderList(byStatus("pending"), true)}
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          {renderList(byStatus("approved"), false)}
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          {renderList(byStatus("rejected"), false)}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this affiliation request</DialogTitle>
            <DialogDescription>
              A reason is required so the member understands what to do next. Keep it factual and
              respectful.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            placeholder="For example: we could not find a record of this member attending the mosque. Please speak to the office."
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              disabled={reason.trim().length < 5 || review.isPending}
              onClick={() =>
                rejecting &&
                review.mutate({ row: rejecting, approve: false, rejectionReason: reason.trim() })
              }
            >
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
