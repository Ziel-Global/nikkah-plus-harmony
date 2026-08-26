import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REQUEST_STATUS_LABEL, SUPER_META, formatDateTime } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/superadmin/requests")({
  head: () =>
    SUPER_META(
      "Requests & matches",
      "Oversight of every introduction requested across the platform.",
    ),
  component: RequestsMonitor,
});

type RequestRow = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  requester_mosque_id: string | null;
  target_mosque_id: string | null;
  requester: { email: string } | null;
  target: { email: string } | null;
};

function RequestsMonitor() {
  const [status, setStatus] = useState("all");
  const [mosque, setMosque] = useState("all");
  const [search, setSearch] = useState("");

  const mosques = useQuery({
    queryKey: ["superadmin", "mosque-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mosques").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin", "requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interest_requests")
        .select(
          "id, status, message, created_at, responded_at, requester_mosque_id, target_mosque_id, requester:profiles!interest_requests_requester_id_fkey(email), target:profiles!interest_requests_target_id_fkey(email)",
        )
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as RequestRow[];
    },
  });

  const mosqueName = (id: string | null) =>
    (mosques.data ?? []).find((m) => m.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => (status === "all" ? true : r.status === status))
      .filter((r) =>
        mosque === "all" ? true : r.requester_mosque_id === mosque || r.target_mosque_id === mosque,
      )
      .filter((r) =>
        term
          ? [r.requester?.email ?? "", r.target?.email ?? ""].join(" ").toLowerCase().includes(term)
          : true,
      );
  }, [data, status, mosque, search]);

  return (
    <SuperAdminShell
      title="Requests & matches"
      description="View only. Administrators observe introductions; they never create, accept or decline them."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(REQUEST_STATUS_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Mosque</Label>
          <Select value={mosque} onValueChange={setMosque}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All mosques</SelectItem>
              {(mosques.data ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="request-search">Search member</Label>
          <Input
            id="request-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email"
            className="mt-1"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No introductions match these filters.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="surface-card rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {row.requester?.email ?? "Member"} → {row.target?.email ?? "Member"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mosqueName(row.requester_mosque_id)} · {mosqueName(row.target_mosque_id)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatDateTime(row.created_at)}
                    {row.responded_at ? ` · answered ${formatDateTime(row.responded_at)}` : ""}
                  </p>
                </div>
                <Badge variant={row.status === "active_match" ? "secondary" : "outline"}>
                  {REQUEST_STATUS_LABEL[row.status] ?? row.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-6 text-caption">
        Contact details exchanged between members are never shown in any administrator screen.
      </p>
    </SuperAdminShell>
  );
}
