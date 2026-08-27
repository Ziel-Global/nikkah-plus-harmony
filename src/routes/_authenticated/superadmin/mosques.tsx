import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, validateOptionalEmail, validatePhone } from "@/lib/validation";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SUPER_META, formatDay, logActivity } from "@/lib/superadmin";
import { EditMosqueModal } from "@/components/superadmin/EditMosqueModal";
import { ConfirmDeleteModal } from "@/components/superadmin/ConfirmDeleteModal";

export const Route = createFileRoute("/_authenticated/superadmin/mosques")({
  head: () =>
    SUPER_META("Mosques", "Add, edit and approve the mosques partnered with Marriage Database."),
  component: MosquesPage,
});

type Mosque = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
  status: string;
  created_at: string;
};

const EMPTY = {
  name: "",
  address: "",
  city: "",
  country: "",
  contact_email: "",
  contact_phone: "",
  description: "",
};

function MosquesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editing, setEditing] = useState<Mosque | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mosque | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mosques").delete().eq("id", id);
      if (error) throw error;
      await logActivity("delete_mosque", "mosques", id, {});
    },
    onSuccess: () => {
      toast.success("Mosque deleted successfully.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin", "mosques"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosques")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Mosque[];
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((m) =>
      [m.name, m.city ?? "", m.country ?? ""].join(" ").toLowerCase().includes(term),
    );
  }, [data, search]);

  const nameError = form
    ? form.name.trim().length < 2
      ? "Please enter the mosque's name."
      : null
    : null;
  const emailError = form ? validateOptionalEmail(form.contact_email) : null;
  const phoneError =
    form && form.contact_phone.trim() !== "" ? validatePhone(form.contact_phone) : null;
  const duplicateWarning =
    form && !editing && form.name.trim().length > 1
      ? (data ?? []).some(
          (m: Mosque) =>
            m.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
            (m.city ?? "").trim().toLowerCase() === form.city.trim().toLowerCase(),
        )
        ? "A mosque with this name already exists in this city. Please double-check before adding it again."
        : null
      : null;

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        description: form.description.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("mosques").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logActivity("mosque_updated", "mosques", editing.id);
      } else {
        const { data: auth } = await supabase.auth.getUser();
        const { data: inserted, error } = await supabase
          .from("mosques")
          .insert({ ...payload, status: "pending" as never, created_by: auth.user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        await logActivity("mosque_created", "mosques", inserted?.id ?? null);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Mosque updated." : "Mosque added.");
      setForm(null);
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  const setStatus = useMutation({
    mutationFn: async ({ mosque, status }: { mosque: Mosque; status: string }) => {
      const { error } = await supabase
        .from("mosques")
        .update({ status: status as never })
        .eq("id", mosque.id);
      if (error) throw error;
      await logActivity("mosque_status_changed", "mosques", mosque.id, { to: status });
    },
    onSuccess: () => {
      toast.success("Mosque status updated.");
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  return (
    <SuperAdminShell
      title="Mosques"
      description="Partner mosques verify their own members. Approve a mosque before it appears at registration."
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ ...EMPTY });
          }}
        >
          Add mosque
        </Button>
      }
    >
      <div className="max-w-md">
        <Label htmlFor="mosque-search">Search mosques</Label>
        <Input
          id="mosque-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, city or country"
          className="mt-1"
        />
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mosques yet.</p>
        ) : (
          rows.map((m) => (
            <div key={m.id} className="surface-card rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[m.city, m.country].filter(Boolean).join(", ") || "Location not set"} · added{" "}
                    {formatDay(m.created_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.contact_email ?? "No contact email"} · {m.contact_phone ?? "No phone"}
                  </p>
                </div>
                <Badge variant={m.status === "active" ? "secondary" : "outline"}>{m.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.status !== "active" ? (
                  <Button
                    size="sm"
                    onClick={() => setStatus.mutate({ mosque: m, status: "active" })}
                  >
                    Approve mosque
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus.mutate({ mosque: m, status: "suspended" })}
                  >
                    Suspend
                  </Button>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Edit mosque details"
                    aria-label="Edit mosque details"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setEditing(m)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Delete mosque"
                    aria-label="Delete mosque"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(m)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Mosque Modal */}
      <EditMosqueModal mosque={editing} onOpenChange={(open) => !open && setEditing(null)} />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="Are you sure you want to delete this mosque? This action cannot be undone and may affect members affiliated with this mosque."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit mosque" : "Add a mosque"}</DialogTitle>
            <DialogDescription>
              New mosques start as pending until you approve them.
            </DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="space-y-3">
              {(
                [
                  ["name", "Mosque name"],
                  ["address", "Address"],
                  ["city", "City"],
                  ["country", "Country"],
                  ["contact_email", "Contact email"],
                  ["contact_phone", "Contact phone"],
                ] as const
              ).map(([key, label]) => {
                const err =
                  key === "name"
                    ? nameError
                    : key === "contact_email"
                      ? emailError
                      : key === "contact_phone"
                        ? phoneError
                        : null;
                return (
                  <div key={key}>
                    <Label htmlFor={`mosque-${key}`}>{label}</Label>
                    <Input
                      id={`mosque-${key}`}
                      value={form[key]}
                      aria-invalid={err ? true : undefined}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1"
                    />
                    {err ? (
                      <p className="mt-1 text-sm font-medium text-destructive">{err}</p>
                    ) : null}
                  </div>
                );
              })}
              {duplicateWarning ? (
                <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  {duplicateWarning}
                </p>
              ) : null}
              <div>
                <Label htmlFor="mosque-description">Description</Label>
                <Textarea
                  id="mosque-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              disabled={Boolean(nameError || emailError || phoneError) || save.isPending}
              onClick={() => save.mutate()}
            >
              {editing ? "Save changes" : "Add mosque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminShell>
  );
}
