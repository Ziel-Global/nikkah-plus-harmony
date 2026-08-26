import { useState } from "react";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_META, formatDay, PROFILE_STATUS_LABEL, type AdminMosque } from "@/lib/admin";
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
      const [{ data: profiles, error }, { data: marriage, error: mErr }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, phone, gender, role, account_status, created_at, last_login_at")
          .in("mosque_id", mosqueIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("marriage_profiles")
          .select(
            "id, user_id, display_name, status, city, country, profession, education_level, marital_status, religious_practice_level, updated_at, rejection_reason",
          ),
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
                    {profile?.display_name ?? member.email}
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

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedProfile?.display_name ?? selected?.email}</SheetTitle>
            <SheetDescription>
              Read-only record. Mosques verify and oversee — they never control who matches with
              whom.
            </SheetDescription>
          </SheetHeader>
          <dl className="space-y-3 px-4 pb-6 text-sm">
            <Row label="Email" value={selected?.email} />
            <Row label="Phone" value={selected?.phone ?? "Not provided"} />
            <Row label="Registered as" value={selected?.gender ?? "Not stated"} />
            <Row label="Account status" value={selected?.account_status} />
            <Row label="Last signed in" value={formatDay(selected?.last_login_at ?? null)} />
            <div className="pt-2 text-h3 text-foreground">Marriage profile</div>
            {selectedProfile ? (
              <>
                <Row
                  label="Status"
                  value={PROFILE_STATUS_LABEL[selectedProfile.status] ?? selectedProfile.status}
                />
                <Row
                  label="Location"
                  value={
                    [selectedProfile.city, selectedProfile.country].filter(Boolean).join(", ") ||
                    "—"
                  }
                />
                <Row label="Profession" value={selectedProfile.profession ?? "—"} />
                <Row label="Education" value={selectedProfile.education_level ?? "—"} />
                <Row label="Marital status" value={selectedProfile.marital_status ?? "—"} />
                <Row label="Practice" value={selectedProfile.religious_practice_level ?? "—"} />
                <Row label="Last updated" value={formatDay(selectedProfile.updated_at)} />
                {selectedProfile.rejection_reason && (
                  <Row label="Review note" value={selectedProfile.rejection_reason} />
                )}
              </>
            ) : (
              <p className="text-muted-foreground">This member has not started a profile yet.</p>
            )}
          </dl>
        </SheetContent>
      </Sheet>
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
