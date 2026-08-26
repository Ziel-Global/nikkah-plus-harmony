import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCOUNT_STATUS_LABEL,
  ROLE_LABEL,
  SUPER_META,
  formatDateTime,
  logActivity,
  type PlatformProfile,
} from "@/lib/superadmin";
import { EditUserModal } from "@/components/superadmin/EditUserModal";
import { ConfirmDeleteModal } from "@/components/superadmin/ConfirmDeleteModal";

export const Route = createFileRoute("/_authenticated/superadmin/users")({
  head: () => SUPER_META("Users", "Search every Nikkah+ account and manage account standing."),
  component: UsersPage,
});

type Row = PlatformProfile & { mosques: { name: string } | null };

type UserTypeFilter = "all" | "brother" | "sister" | "mosque_admin" | "super_admin";

const ACTIONS = [
  { status: "active", label: "Reinstate", variant: "default" as const },
  { status: "suspended", label: "Suspend", variant: "destructive" as const },
  { status: "deactivated", label: "Deactivate", variant: "outline" as const },
];

function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserTypeFilter>("all");
  const [selected, setSelected] = useState<Row | null>(null);
  const [pending, setPending] = useState<{ row: Row; status: string } | null>(null);
  const [editingUser, setEditingUser] = useState<Row | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<Row | null>(null);

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      await logActivity("delete_user_profile", "profiles", id, {});
    },
    onSuccess: () => {
      toast.success("User profile deleted successfully.");
      setDeleteTargetUser(null);
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["superadmin", "users"],
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, phone, role, gender, mosque_id, account_status, verification_method, last_login_at, terms_accepted_at, created_at, mosques!profiles_mosque_id_fkey(name)",
        )
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const rawMosques = r["mosques"];
        return {
          ...r,
          mosques: Array.isArray(rawMosques) ? (rawMosques[0] ?? null) : rawMosques,
        };
      }) as Row[];
    },
  });

  const counts = useMemo(() => {
    const list = data ?? [];
    let brothers = 0;
    let sisters = 0;
    let mosqueAdmins = 0;
    let superAdmins = 0;

    for (const r of list) {
      if (r.role === "mosque_admin") {
        mosqueAdmins++;
      } else if (r.role === "super_admin") {
        superAdmins++;
      } else {
        const g = r.gender?.toLowerCase();
        const isBrother = g === "male" || g === "brother" || r.role === "male_user";
        const isSister = g === "female" || g === "sister" || r.role === "female_user";
        if (isBrother) brothers++;
        else if (isSister) sisters++;
        else {
          if (r.role === "male_user") brothers++;
          else if (r.role === "female_user") sisters++;
        }
      }
    }
    return {
      all: list.length,
      brother: brothers,
      sister: sisters,
      mosque_admin: mosqueAdmins,
      super_admin: superAdmins,
    };
  }, [data]);

  const rows = useMemo(() => {
    let list = data ?? [];

    if (roleFilter === "brother") {
      list = list.filter((r) => {
        if (r.role === "mosque_admin" || r.role === "super_admin") return false;
        const g = r.gender?.toLowerCase();
        return r.role === "male_user" || g === "male" || g === "brother";
      });
    } else if (roleFilter === "sister") {
      list = list.filter((r) => {
        if (r.role === "mosque_admin" || r.role === "super_admin") return false;
        const g = r.gender?.toLowerCase();
        return r.role === "female_user" || g === "female" || g === "sister";
      });
    } else if (roleFilter === "mosque_admin") {
      list = list.filter((r) => r.role === "mosque_admin");
    } else if (roleFilter === "super_admin") {
      list = list.filter((r) => r.role === "super_admin");
    }

    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) =>
      [r.email, r.phone ?? "", ROLE_LABEL[r.role] ?? r.role, r.mosques?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [data, search, roleFilter]);

  const changeStatus = useMutation({
    mutationFn: async ({ row, status }: { row: Row; status: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: status as never })
        .eq("id", row.id);
      if (error) throw error;
      await logActivity("profile_account_status_changed", "profiles", row.id, {
        from: row.account_status,
        to: status,
      });
    },
    onSuccess: (_d, vars) => {
      toast.success(`Account is now ${ACCOUNT_STATUS_LABEL[vars.status]?.toLowerCase()}.`);
      setPending(null);
      setSelected(null);
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SuperAdminShell
      title="Users"
      description="Every registered account on the platform. Changing standing takes effect immediately."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-md">
          <Label htmlFor="user-search">Search accounts</Label>
          <Input
            id="user-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email, phone, role or mosque"
            className="mt-1"
          />
        </div>

        <div className="w-full sm:w-64">
          <Label htmlFor="user-type-filter">Filter by user type</Label>
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val as UserTypeFilter)}>
            <SelectTrigger id="user-type-filter" className="mt-1">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users ({counts.all})</SelectItem>
              <SelectItem value="brother">Brothers ({counts.brother})</SelectItem>
              <SelectItem value="sister">Sisters ({counts.sister})</SelectItem>
              <SelectItem value="mosque_admin">Mosque Admins ({counts.mosque_admin})</SelectItem>
              <SelectItem value="super_admin">Platform Admins ({counts.super_admin})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : isError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-center">
            <p className="font-semibold text-foreground">Could not load users</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts match that search.</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{row.email}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABEL[row.role] ?? row.role} · {row.mosques?.name ?? "No mosque"} · joined{" "}
                  {formatDateTime(row.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={row.account_status === "active" ? "secondary" : "outline"}>
                  {ACCOUNT_STATUS_LABEL[row.account_status] ?? row.account_status}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="View details"
                    aria-label="View details"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setSelected(row)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Edit user profile"
                    aria-label="Edit user profile"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingUser(row)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Delete user profile"
                    aria-label="Delete user profile"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTargetUser(row)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal user={editingUser} onOpenChange={(open) => !open && setEditingUser(null)} />

      {/* Confirm Delete User Modal */}
      <ConfirmDeleteModal
        open={Boolean(deleteTargetUser)}
        onOpenChange={(open) => !open && setDeleteTargetUser(null)}
        title={`Delete account "${deleteTargetUser?.email}"?`}
        description="Are you sure you want to delete this user profile? This action cannot be undone and will permanently remove their access."
        loading={deleteUserMutation.isPending}
        onConfirm={() => deleteTargetUser && deleteUserMutation.mutate(deleteTargetUser.id)}
      />

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.email}</DialogTitle>
            <DialogDescription>Account detail and standing.</DialogDescription>
          </DialogHeader>
          {selected ? (
            <dl className="grid gap-2 text-sm">
              {[
                ["Role", ROLE_LABEL[selected.role] ?? selected.role],
                ["Gender", selected.gender ?? "—"],
                ["Phone", selected.phone ?? "—"],
                ["Mosque", selected.mosques?.name ?? "—"],
                ["Verification", selected.verification_method ?? "—"],
                ["Terms accepted", formatDateTime(selected.terms_accepted_at)],
                ["Last sign-in", formatDateTime(selected.last_login_at)],
                [
                  "Standing",
                  ACCOUNT_STATUS_LABEL[selected.account_status] ?? selected.account_status,
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border pb-1">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <DialogFooter className="flex-wrap gap-2">
            {ACTIONS.filter((a) => a.status !== selected?.account_status).map((action) => (
              <Button
                key={action.status}
                variant={action.variant}
                onClick={() => selected && setPending({ row: selected, status: action.status })}
              >
                {action.label}
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm change</DialogTitle>
            <DialogDescription>
              {pending
                ? `${pending.row.email} will be marked ${ACCOUNT_STATUS_LABEL[pending.status]?.toLowerCase()}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              disabled={changeStatus.isPending}
              onClick={() => pending && changeStatus.mutate(pending)}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminShell>
  );
}
