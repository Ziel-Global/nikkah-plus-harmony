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
          {["submitted", "approved", "all"].map((t) => (
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

              </div>
            ))
          )}
        </TabsContent>
      </Tabs>



    </SuperAdminShell>
  );
}
