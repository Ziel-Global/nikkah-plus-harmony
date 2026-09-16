import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/validation";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PROFILE_STATUS_LABEL, SUPER_META, formatDateTime, logActivity } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/superadmin/profiles")({
  head: () =>
    SUPER_META("Profiles", "Review, approve and correct marriage profiles across every mosque."),
  component: ProfilesPage,
});

type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  date_of_birth: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  personal_bio: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles: { email: string; gender: string | null; mosques: { name: string } | null } | null;
};

function ProfilesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("submitted");
  const [search, setSearch] = useState("");
  const [rejecting, setRejecting] = useState<ProfileRow | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["superadmin", "profiles"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("marriage_profiles")
        .select(
          "id, user_id, display_name, date_of_birth, city, country, profession, personal_bio, status, created_at, updated_at, profiles!marriage_profiles_user_id_fkey(email, gender, mosques!profiles_mosque_id_fkey(name)), profile_rejection_history(reason, rejected_at)",
        )
        .order("updated_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as ProfileRow[];
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => (tab === "all" ? true : r.status === tab))
      .filter((r) =>
        term
          ? [
              r.display_name ?? "",
              r.profiles?.email ?? "",
              r.city ?? "",
              r.profiles?.mosques?.name ?? "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(term)
          : true,
      );
  }, [data, tab, search]);

  const review = useMutation({
    mutationFn: async ({
      row,
      approve,
      rejectionReason,
    }: {
      row: ProfileRow;
      approve: boolean;
      rejectionReason?: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();

      if (!approve && rejectionReason) {
        const { error: histErr } = await (supabase as any).from("profile_rejection_history").insert({
          profile_id: row.id,
          reason: rejectionReason,
          rejected_by: auth.user?.id,
        });
        if (histErr) throw histErr;
      }

      const { error } = await supabase
        .from("marriage_profiles")
        .update({
          status: (approve ? "approved" : "rejected") as never,
        })
        .eq("id", row.id);
      if (error) throw error;
      await logActivity(
        approve ? "profile_approved" : "profile_rejected",
        "marriage_profiles",
        row.id,
      );
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? "Profile approved." : "Profile returned for changes.");
      setRejecting(null);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  return (
    <SuperAdminShell
      title="Profiles"
      description="Platform-wide review queue with the ability to correct a profile when a mosque asks for help."
    >
      <div className="max-w-md">
        <Label htmlFor="profile-search">Search profiles</Label>
        <Input
          id="profile-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email, city or mosque"
          className="mt-1"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="flex-wrap">
          {["submitted", "approved", "rejected", "draft", "all"].map((t) => (
            <TabsTrigger key={t} value={t}>
              {t === "all" ? "All" : (PROFILE_STATUS_LABEL[t] ?? t)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : isError ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-center">
              <p className="font-semibold text-foreground">Could not load profiles</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "An unexpected error occurred."}
              </p>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here right now.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="surface-card rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {row.display_name ?? "Unnamed profile"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.profiles?.email} · {row.profiles?.mosques?.name ?? "No mosque"} · updated{" "}
                      {formatDateTime(row.updated_at)}
                    </p>
                    {row.personal_bio ? (
                      <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                        {row.personal_bio}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={row.status === "approved" ? "secondary" : "outline"}>
                    {PROFILE_STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.status !== "approved" ? (
                    <Button size="sm" onClick={() => review.mutate({ row, approve: true })}>
                      Approve
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => setRejecting(row)}>
                    Return for changes
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return this profile</DialogTitle>
            <DialogDescription>
              Explain kindly what needs changing. The member will see this note.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
            aria-invalid={reason.trim().length > 0 && reason.trim().length < 5 ? true : undefined}
            placeholder="Explain what needs changing so the member knows what to do next."
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
                review.mutate({ row: rejecting, approve: false, rejectionReason: reason })
              }
            >
              Return profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SuperAdminShell>
  );
}
