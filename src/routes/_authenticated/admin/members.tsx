import { useState } from "react";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_META, formatDay, PROFILE_STATUS_LABEL, type AdminMosque, OVERSIGHT_NOTE } from "@/lib/admin";
import { ProfileReviewModal } from "./ProfileReviewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/admin/members")({
  head: () =>
    ADMIN_META("Linked members", "Members affiliated with your mosque and their profile status."),
  component: MembersPage,
});

type MemberRow = {
  id: string;
  email: string;
  phone: string | null;
  gender: string | null;
  role: string;
  account_status: string;
  created_at: string;
  last_login_at: string | null;
  full_name: string | null;
};

type MarriageProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  status: string;
  city: string | null;
  country: string | null;
  profession: string | null;
  education_level: string | null;
  marital_status: string | null;
  religious_practice_level: string | null;
  updated_at: string;
  rejection_reason: string | null;
};

function MembersPage() {
  const { mosques } = useRouteContext({ from: "/_authenticated/admin" }) as {
    mosques: AdminMosque[];
  };
  const mosqueIds = mosques.map((m) => m.id);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "brother" | "sister">("all");
  const [selected, setSelected] = useState<MemberRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "members", mosqueIds],
    queryFn: async () => {
      // 1. Fetch approved affiliation request user_ids for these mosques
      const { data: approvedAffiliations } = await supabase
        .from("mosque_affiliation_requests")
        .select("user_id, mosque_id")
        .in("mosque_id", mosqueIds)
        .eq("status", "approved");

      const approvedUserIds = Array.from(
        new Set((approvedAffiliations ?? []).map((a) => a.user_id)),
      );

      // Auto-backfill/sync profiles.mosque_id for any approved affiliations
      if (approvedAffiliations && approvedAffiliations.length > 0) {
        for (const aff of approvedAffiliations) {
          void supabase.from("profiles").update({ mosque_id: aff.mosque_id }).eq("id", aff.user_id);
        }
      }

      // 2. Fetch profiles directly linked to mosque_id OR having an approved affiliation request (excluding admin roles)
      const [{ data: profiles, error }, { data: marriage, error: mErr }] = await Promise.all([
        approvedUserIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, email, phone, gender, role, account_status, created_at, last_login_at, full_name")
              .or(`mosque_id.in.(${mosqueIds.join(",")}),id.in.(${approvedUserIds.join(",")})`)
              .neq("role", "mosque_admin")
              .neq("role", "super_admin")
              .order("created_at", { ascending: false })
          : supabase
              .from("profiles")
              .select("id, email, phone, gender, role, account_status, created_at, last_login_at, full_name")
              .in("mosque_id", mosqueIds)
              .neq("role", "mosque_admin")
              .neq("role", "super_admin")
              .order("created_at", { ascending: false }),
        supabase
          .from("marriage_profiles")
          .select(`
            *,
            wali_details (*),
            profile_rejection_history (*)
          `),
      ]);

      if (error) throw error;
      if (mErr) throw mErr;
      return {
        members: (profiles ?? []) as MemberRow[],
        profilesByUser: new Map(((marriage ?? []) as MarriageProfile[]).map((p) => [p.user_id, p])),
      };
    },
  });

  const counts = (data?.members ?? []).reduce(
    (acc, m) => {
      acc.all++;
      const g = m.gender?.toLowerCase();
      if (g === "male" || g === "brother" || m.role === "male_user") acc.brothers++;
      else if (g === "female" || g === "sister" || m.role === "female_user") acc.sisters++;
      return acc;
    },
    { all: 0, brothers: 0, sisters: 0 },
  );

  const members = (data?.members ?? []).filter((m) => {
    if (genderFilter === "brother") {
      const g = m.gender?.toLowerCase();
      if (g !== "male" && g !== "brother" && m.role !== "male_user") return false;
    } else if (genderFilter === "sister") {
      const g = m.gender?.toLowerCase();
      if (g !== "female" && g !== "sister" && m.role !== "female_user") return false;
    }
    return search.trim() ? m.email.toLowerCase().includes(search.trim().toLowerCase()) : true;
  });

  const selectedProfile = selected ? data?.profilesByUser.get(selected.id) : undefined;

  return (
    <AdminShell
      title="Linked members"
      description="Everyone affiliated with your mosque. These records are read-only: you can see whether someone has completed a marriage profile, but not manage their introductions."
    >
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email"
          className="max-w-sm"
          aria-label="Search members by email"
        />

        <div className="w-full sm:w-60">
          <Select
            value={genderFilter}
            onValueChange={(val) => setGenderFilter(val as "all" | "brother" | "sister")}
          >
            <SelectTrigger aria-label="Filter members by gender">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members ({counts.all})</SelectItem>
              <SelectItem value="brother">Brothers ({counts.brothers})</SelectItem>
              <SelectItem value="sister">Sisters ({counts.sisters})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members are linked to your mosque yet.</p>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => {
            const profile = data?.profilesByUser.get(member.id);
            return (
              <li
                key={member.id}
                className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {member.full_name ?? profile?.display_name ?? member.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.email} · joined {formatDay(member.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {profile
                      ? (PROFILE_STATUS_LABEL[profile.status] ?? profile.status)
                      : "No profile yet"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="View member details"
                    aria-label="View member details"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setSelected(member)}
                  >
                    <Eye className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ProfileReviewModal 
        isOpen={Boolean(selected)} 
        onClose={() => setSelected(null)} 
        member={selected} 
        profile={selectedProfile as any} 
      />
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value ?? "—"}</dd>
    </div>
  );
}
