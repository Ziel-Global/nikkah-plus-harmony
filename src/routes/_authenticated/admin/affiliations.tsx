import { useState } from "react";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  User,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/validation";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  ADMIN_META,
  formatDateTime,
  formatDay,
  PROFILE_STATUS_LABEL,
  type AdminMosque,
} from "@/lib/admin";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/admin/affiliations")({
  head: () =>
    ADMIN_META(
      "Affiliation requests",
      "Verify members who have asked to be affiliated with your mosque.",
    ),
  component: AffiliationsPage,
});

type MarriageProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  date_of_birth: string | null;
  city: string | null;
  country: string | null;
  area: string | null;
  profession: string | null;
  education_level: string | null;
  marital_status: string | null;
  religious_practice_level: string | null;
  personal_bio: string | null;
  family_origin: string | null;
  household_background: string | null;
  family_values: string | null;
  status: string;
  updated_at: string;
};

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
  const { mosques } = useRouteContext({ from: "/_authenticated/admin" }) as {
    mosques: AdminMosque[];
  };
  const mosqueIds = mosques.map((m) => m.id);
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState<AffiliationRow | null>(null);
  const [inspecting, setInspecting] = useState<AffiliationRow | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "affiliations", mosqueIds],
    queryFn: async () => {
      const [{ data: requests, error: rErr }, { data: marriage, error: mErr }] = await Promise.all([
        supabase
          .from("mosque_affiliation_requests")
          .select(
            "id, user_id, mosque_id, status, rejection_reason, created_at, reviewed_at, profiles:profiles!mosque_affiliation_requests_user_id_fkey(email, phone, gender, role)",
          )
          .in("mosque_id", mosqueIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("marriage_profiles")
          .select(
            "id, user_id, display_name, date_of_birth, city, country, area, profession, education_level, marital_status, religious_practice_level, personal_bio, family_origin, household_background, family_values, status, updated_at",
          ),
      ]);

      if (rErr) throw rErr;
      if (mErr) throw mErr;

      const marriageMap = new Map(
        ((marriage ?? []) as MarriageProfile[]).map((m) => [m.user_id, m]),
      );
      return {
        rows: (requests ?? []) as unknown as AffiliationRow[],
        marriageMap,
      };
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

      if (approve) {
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ mosque_id: row.mosque_id })
          .eq("id", row.user_id);
        if (profileErr) throw profileErr;
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.approve
          ? "Affiliation verified and member linked."
          : "Request returned to the member.",
      );
      setRejecting(null);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: Error) =>
      toast.error(friendlyError(error, "We couldn't update that request just now.")),
  });

  const rows = data?.rows ?? [];
  const marriageMap = data?.marriageMap ?? new Map();
  const byStatus = (status: string) => rows.filter((r) => r.status === status);

  const inspectedMarriage = inspecting ? marriageMap.get(inspecting.user_id) : undefined;

  const renderList = (list: AffiliationRow[], showActions: boolean) => {
    if (isLoading) return <Skeleton className="h-32 w-full" />;
    if (list.length === 0)
      return <p className="text-sm text-muted-foreground">Nothing here at the moment.</p>;

    return (
      <ul className="space-y-4">
        {list.map((row) => {
          const mProf = marriageMap.get(row.user_id);
          const location = [mProf?.area, mProf?.city, mProf?.country].filter(Boolean).join(", ");
          const displayName = mProf?.display_name ?? row.profiles?.email ?? "Member";

          return (
            <li key={row.id} className="surface-card rounded-xl border border-border p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-h3 font-bold text-foreground">{displayName}</h3>
                    {mProf?.status && (
                      <Badge variant="outline">
                        {PROFILE_STATUS_LABEL[mProf.status] ?? mProf.status}
                      </Badge>
                    )}
                  </div>

                  <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
                      <span className="truncate">{row.profiles?.email ?? "Not provided"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
                      <span>{row.profiles?.phone ?? "Phone not provided"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
                      <span>Registered as: {row.profiles?.gender ?? "Not stated"}</span>
                    </div>

                    {location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
                        <span>{location}</span>
                      </div>
                    )}

                    {mProf?.profession && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
                        <span>{mProf.profession}</span>
                      </div>
                    )}

                    {mProf?.marital_status && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
                        <span>{mProf.marital_status}</span>
                      </div>
                    )}

                    {mProf?.education_level && (
                      <div className="flex items-center gap-2">
                        <GraduationCap
                          className="h-4 w-4 text-secondary shrink-0"
                          aria-hidden="true"
                        />
                        <span>{mProf.education_level}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
                      <span>Requested: {formatDateTime(row.created_at)}</span>
                    </div>
                  </dl>

                  {row.rejection_reason && (
                    <p className="mt-2 text-sm text-destructive">
                      Reason given: {row.rejection_reason}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge variant={row.status === "approved" ? "default" : "secondary"}>
                    {row.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-primary hover:text-primary"
                    onClick={() => setInspecting(row)}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Inspect details
                  </Button>
                </div>
              </div>

              {showActions && (
                <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
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
          );
        })}
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
          <TabsTrigger value="approved">Verified ({byStatus("approved").length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({byStatus("rejected").length})</TabsTrigger>
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

      <Sheet open={Boolean(inspecting)} onOpenChange={(open) => !open && setInspecting(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {inspectedMarriage?.display_name ?? inspecting?.profiles?.email ?? "Member Details"}
            </SheetTitle>
            <SheetDescription>
              Complete details submitted by the member for mosque affiliation verification.
            </SheetDescription>
          </SheetHeader>
          <dl className="space-y-3 px-1 py-4 text-sm">
            <div className="pt-1 text-h3 text-foreground font-semibold">Account Information</div>
            <DetailRow label="Email" value={inspecting?.profiles?.email} />
            <DetailRow label="Phone" value={inspecting?.profiles?.phone ?? "Not provided"} />
            <DetailRow label="Gender / Role" value={inspecting?.profiles?.gender ?? "Not stated"} />
            <DetailRow
              label="Requested At"
              value={inspecting ? formatDateTime(inspecting.created_at) : "—"}
            />

            <div className="pt-3 text-h3 text-foreground font-semibold">
              Marriage Profile Information
            </div>
            {inspectedMarriage ? (
              <>
                <DetailRow
                  label="Profile Status"
                  value={PROFILE_STATUS_LABEL[inspectedMarriage.status] ?? inspectedMarriage.status}
                />
                <DetailRow
                  label="Location"
                  value={
                    [inspectedMarriage.area, inspectedMarriage.city, inspectedMarriage.country]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <DetailRow label="Profession" value={inspectedMarriage.profession ?? "—"} />
                <DetailRow
                  label="Education Level"
                  value={inspectedMarriage.education_level ?? "—"}
                />
                <DetailRow label="Marital Status" value={inspectedMarriage.marital_status ?? "—"} />
                <DetailRow
                  label="Religious Practice"
                  value={inspectedMarriage.religious_practice_level ?? "—"}
                />
                <DetailRow label="Family Origin" value={inspectedMarriage.family_origin ?? "—"} />
                <DetailRow
                  label="Household Background"
                  value={inspectedMarriage.household_background ?? "—"}
                />
                <DetailRow label="Family Values" value={inspectedMarriage.family_values ?? "—"} />
                {inspectedMarriage.personal_bio && (
                  <div className="space-y-1 border-b border-border pb-2 pt-1">
                    <dt className="text-muted-foreground font-medium">Personal Bio</dt>
                    <dd className="text-foreground whitespace-pre-wrap">
                      {inspectedMarriage.personal_bio}
                    </dd>
                  </div>
                )}
                <DetailRow label="Last Updated" value={formatDay(inspectedMarriage.updated_at)} />
              </>
            ) : (
              <p className="text-muted-foreground">
                This member has not filled out a marriage profile yet.
              </p>
            )}
          </dl>

          {inspecting?.status === "pending" && (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
              <Button
                className="flex-1 min-h-11"
                disabled={review.isPending}
                onClick={() => {
                  const target = inspecting;
                  setInspecting(null);
                  review.mutate({ row: target, approve: true });
                }}
              >
                Verify affiliation
              </Button>
              <Button
                variant="outline"
                className="flex-1 min-h-11"
                onClick={() => {
                  const target = inspecting;
                  setInspecting(null);
                  setRejecting(target);
                  setReason("");
                }}
              >
                Reject
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
            maxLength={1000}
            aria-invalid={reason.trim().length > 0 && reason.trim().length < 5 ? true : undefined}
            placeholder="For example: we could not find a record of this member attending the mosque. Please speak to the office."
          />
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-destructive">
              {reason.trim().length > 0 && reason.trim().length < 5
                ? "Please give a little more detail."
                : ""}
            </p>
            <p className="shrink-0 text-xs text-muted-foreground">{reason.length} / 1000</p>
          </div>
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

function DetailRow({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <dt className="text-muted-foreground font-medium">{label}</dt>
      <dd className="text-right text-foreground">{value ?? "—"}</dd>
    </div>
  );
}
