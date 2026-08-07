import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/validation";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SUPER_META, formatDay, logActivity } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/superadmin/mosque-admins")({
  head: () =>
    SUPER_META("Mosque admins", "Assign and reassign the people who verify members for each mosque."),
  component: MosqueAdminsPage,
});

type Assignment = {
  id: string;
  admin_id: string;
  mosque_id: string;
  created_at: string;
  profiles: { email: string; role: string } | null;
  mosques: { name: string } | null;
};

function MosqueAdminsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [mosqueId, setMosqueId] = useState("");
  const [removing, setRemoving] = useState<Assignment | null>(null);

  const assignments = useQuery({
    queryKey: ["superadmin", "mosque-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosque_admin_mosques")
        .select("id, admin_id, mosque_id, created_at, profiles!mosque_admin_mosques_admin_id_fkey(email, role), mosques(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Assignment[];
    },
  });

  const candidates = useQuery({
    queryKey: ["superadmin", "admin-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("role", "mosque_admin")
        .order("email");
      if (error) throw error;
      return (data ?? []) as { id: string; email: string; role: string }[];
    },
  });

  const mosques = useQuery({
    queryKey: ["superadmin", "mosque-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mosques").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assignments.data ?? [];
    return (assignments.data ?? []).filter((a) =>
      [a.profiles?.email ?? "", a.mosques?.name ?? ""].join(" ").toLowerCase().includes(term),
    );
  }, [assignments.data, search]);

  const alreadyAssigned =
    Boolean(adminId) &&
    Boolean(mosqueId) &&
    (assignments.data ?? []).some((a) => a.admin_id === adminId && a.mosque_id === mosqueId);

  const assign = useMutation({
    mutationFn: async () => {
      if (alreadyAssigned) {
        throw new Error("This admin is already linked to that mosque.");
      }
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("mosque_admin_mosques")
        .insert({ admin_id: adminId, mosque_id: mosqueId, assigned_by: auth.user?.id ?? null });
      if (error) throw error;
      await logActivity("mosque_admin_assigned", "mosque_admin_mosques", null, { adminId, mosqueId });
    },
    onSuccess: () => {
      toast.success("Mosque admin assigned.");
      setOpen(false);
      setAdminId("");
      setMosqueId("");
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  const unassign = useMutation({
    mutationFn: async (row: Assignment) => {
      const { error } = await supabase.from("mosque_admin_mosques").delete().eq("id", row.id);
      if (error) throw error;
      await logActivity("mosque_admin_unassigned", "mosque_admin_mosques", row.id);
    },
    onSuccess: () => {
      toast.success("Assignment removed.");
      setRemoving(null);
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  return (
    <SuperAdminShell
      title="Mosque admins"
      description="Accounts with the mosque admin role can be linked to one or more mosques. Change the account's role from the Users page first."
      actions={<Button onClick={() => setOpen(true)}>Assign admin</Button>}
    >
      <div className="max-w-md">
        <Label htmlFor="admin-search">Search assignments</Label>
        <Input
          id="admin-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Admin email or mosque"
          className="mt-1"
        />
      </div>

      <div className="mt-6 space-y-3">
        {assignments.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mosque admins assigned yet.</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div>
                <p className="font-semibold text-foreground">{row.profiles?.email ?? row.admin_id}</p>
                <p className="text-xs text-muted-foreground">
                  {row.mosques?.name ?? "Unknown mosque"} · assigned {formatDay(row.created_at)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setRemoving(row)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a mosque admin</DialogTitle>
            <DialogDescription>
              Only accounts already set to the mosque admin role can be assigned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Admin account</Label>
              <Select value={adminId} onValueChange={setAdminId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {(candidates.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(candidates.data ?? []).length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  No accounts have the mosque admin role yet.
                </p>
              ) : null}
            </div>
            <div>
              <Label>Mosque</Label>
              <Select value={mosqueId} onValueChange={setMosqueId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a mosque" />
                </SelectTrigger>
                <SelectContent>
                  {(mosques.data ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!adminId || !mosqueId || alreadyAssigned || assign.isPending}
              onClick={() => assign.mutate()}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removing)} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove assignment</DialogTitle>
            <DialogDescription>
              {removing?.profiles?.email} will lose access to {removing?.mosques?.name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={unassign.isPending}
              onClick={() => removing && unassign.mutate(removing)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminShell>
  );
}
