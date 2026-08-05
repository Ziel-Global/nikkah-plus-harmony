import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

export const Route = createFileRoute("/_authenticated/superadmin/mosques")({
  head: () => SUPER_META("Mosques", "Add, edit and approve the mosques partnered with Nikkah+."),
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
    onError: (error: Error) => toast.error(error.message),
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
    onError: (error: Error) => toast.error(error.message),
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
                  <Button size="sm" onClick={() => setStatus.mutate({ mosque: m, status: "active" })}>
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
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(m);
                    setForm({
                      name: m.name,
                      address: m.address ?? "",
                      city: m.city ?? "",
                      country: m.country ?? "",
                      contact_email: m.contact_email ?? "",
                      contact_phone: m.contact_phone ?? "",
                      description: m.description ?? "",
                    });
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

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
              ).map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={`mosque-${key}`}>{label}</Label>
                  <Input
                    id={`mosque-${key}`}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-1"
                  />
                </div>
              ))}
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
              disabled={!form?.name.trim() || save.isPending}
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
