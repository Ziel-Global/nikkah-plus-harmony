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

const EDITABLE = [
  { key: "display_name", label: "Display name" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "profession", label: "Profession" },
] as const;

function ProfilesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("submitted");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<ProfileRow | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marriage_profiles")
        .select(
          "id, user_id, display_name, date_of_birth, city, country, profession, personal_bio, status, rejection_reason, created_at, updated_at, profiles(email, gender, mosques(name))",
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
          ? [r.display_name ?? "", r.profiles?.email ?? "", r.city ?? "", r.profiles?.mosques?.name ?? ""]
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
      const { error } = await supabase
        .from("marriage_profiles")
        .update({
          status: (approve ? "approved" : "rejected") as never,
          rejection_reason: approve ? null : (rejectionReason ?? null),
          reviewed_by: auth.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;
      await logActivity(approve ? "profile_approved" : "profile_rejected", "marriage_profiles", row.id);
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? "Profile approved." : "Profile returned for changes.");
      setRejecting(null);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  const saveEdit = useMutation({
    mutationFn: async (row: ProfileRow) => {
      const { error } = await supabase
        .from("marriage_profiles")
        .update(draft as never)
        .eq("id", row.id);
      if (error) throw error;
      await logActivity("profile_edited_by_platform_admin", "marriage_profiles", row.id, draft);
    },
    onSuccess: () => {
      toast.success("Profile updated.");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  function openEdit(row: ProfileRow) {
    setEditing(row);
    setDraft({
      display_name: row.display_name ?? "",
      city: row.city ?? "",
      country: row.country ?? "",
      profession: row.profession ?? "",
      personal_bio: row.personal_bio ?? "",
    });
  }

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
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
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
                  <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                    Edit override
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
                rejecting && review.mutate({ row: rejecting, approve: false, rejectionReason: reason })
              }
            >
              Return profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit override</DialogTitle>
            <DialogDescription>
              Use sparingly — corrections are recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {EDITABLE.map((field) => (
              <div key={field.key}>
                <Label htmlFor={`edit-${field.key}`}>{field.label}</Label>
                <Input
                  id={`edit-${field.key}`}
                  value={draft[field.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                  className="mt-1"
                />
              </div>
            ))}
            <div>
              <Label htmlFor="edit-bio">Personal introduction</Label>
              <Textarea
                id="edit-bio"
                rows={4}
                value={draft["personal_bio"] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, personal_bio: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button disabled={saveEdit.isPending} onClick={() => editing && saveEdit.mutate(editing)}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminShell>
  );
}
