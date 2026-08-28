import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Eye, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSiteOrigin } from "@/lib/config";
import {
  friendlyError,
  validateOptionalEmail,
  validatePassword,
  validatePhone,
} from "@/lib/validation";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    SUPER_META("Mosques", "Add, edit and manage partner mosques and their portal credentials."),
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
  admin_password: "",
};

function MosquesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editing, setEditing] = useState<Mosque | null>(null);
  const [viewTarget, setViewTarget] = useState<Mosque | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mosque | null>(null);
  const [copied, setCopied] = useState(false);

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
        .select(
          "id, name, address, city, country, contact_email, contact_phone, description, status, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Mosque[];
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((m) =>
      [m.name, m.city ?? "", m.country ?? "", m.contact_email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [data, search]);

  const nameError = form
    ? form.name.trim().length < 2
      ? "Please enter the mosque's name."
      : null
    : null;
  const emailError = form
    ? !form.contact_email.trim()
      ? "Contact email (login username) is required."
      : validateOptionalEmail(form.contact_email)
    : null;
  const passwordError = form && !editing ? validatePassword(form.admin_password) : null;
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
          .insert({ ...payload, status: "active" as never, created_by: auth.user?.id ?? null })
          .select("id")
          .single();
        if (error || !inserted) throw error || new Error("Could not insert mosque record.");

        let adminUserId: string | null = null;

        // Create or register Mosque Admin user account in Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.contact_email.trim(),
          password: form.admin_password,
          options: {
            data: { role: "mosque_admin" },
          },
        });

        if (signUpData?.user?.id) {
          adminUserId = signUpData.user.id;
        } else if (signUpError) {
          // If account already exists, fetch existing user profile ID
          const { data: existingUser } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", form.contact_email.trim())
            .maybeSingle();
          if (existingUser) adminUserId = existingUser.id;
        }

        if (adminUserId) {
          // Ensure profile role is set to mosque_admin
          await supabase
            .from("profiles")
            .update({ role: "mosque_admin", mosque_id: inserted.id })
            .eq("id", adminUserId);

          // Assign admin to mosque in mosque_admin_mosques
          await supabase.from("mosque_admin_mosques").insert({
            admin_id: adminUserId,
            mosque_id: inserted.id,
            assigned_by: auth.user?.id ?? null,
          });
        }

        await logActivity("mosque_created", "mosques", inserted.id);
      }
    },
    onSuccess: () => {
      toast.success(
        editing ? "Mosque updated." : "Mosque and Admin credentials created successfully.",
      );
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

  const handleCopyCredentials = (mosque: Mosque) => {
    const portalUrl = `${getSiteOrigin()}/admin`;
    const text = [
      `Mosque: ${mosque.name}`,
      `Portal Link: ${portalUrl}`,
      `Email (Username): ${mosque.contact_email ?? "Not set"}`,
    ].join("\n");

    void navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Mosque credentials copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SuperAdminShell
      title="Mosques"
      description="Manage partner mosques and their mosque admin login access."
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
          placeholder="Name, city, country or email"
          className="mt-1"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mosques found.</p>
        ) : (
          <div className="surface-card overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mosque Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-semibold text-foreground">{m.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[m.city, m.country].filter(Boolean).join(", ") || "Location not set"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.contact_email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === "active" ? "secondary" : "outline"}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDay(m.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View mosque details"
                          aria-label="View mosque details"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setViewTarget(m)}
                        >
                          <Eye className="size-4" />
                        </Button>

                        {m.status !== "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setStatus.mutate({ mosque: m, status: "active" })}
                          >
                            Approve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setStatus.mutate({ mosque: m, status: "suspended" })}
                          >
                            Suspend
                          </Button>
                        )}

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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* View Mosque Details Modal with Copy Credentials Icon */}
      <Dialog open={Boolean(viewTarget)} onOpenChange={(open) => !open && setViewTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-h3 text-foreground">{viewTarget?.name}</DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                Partner Mosque & Admin Account Details
              </DialogDescription>
            </div>
            {viewTarget && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleCopyCredentials(viewTarget)}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy details"}
              </Button>
            )}
          </DialogHeader>

          {viewTarget && (
            <div className="space-y-3 pt-2 text-sm">
              <div className="grid grid-cols-2 gap-2 border-b border-border/60 pb-2">
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className="mt-0.5">
                    <Badge variant={viewTarget.status === "active" ? "secondary" : "outline"}>
                      {viewTarget.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Added Date</span>
                  <p className="mt-0.5 font-medium text-foreground">
                    {formatDay(viewTarget.created_at)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-border/60 pb-2">
                <div>
                  <span className="text-xs text-muted-foreground">City</span>
                  <p className="mt-0.5 font-medium text-foreground">{viewTarget.city ?? "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Country</span>
                  <p className="mt-0.5 font-medium text-foreground">{viewTarget.country ?? "—"}</p>
                </div>
              </div>

              <div className="border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Address</span>
                <p className="mt-0.5 font-medium text-foreground">{viewTarget.address ?? "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-border/60 pb-2">
                <div>
                  <span className="text-xs text-muted-foreground">Contact Email (Admin Login)</span>
                  <p className="mt-0.5 font-medium text-foreground">
                    {viewTarget.contact_email ?? "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Contact Phone</span>
                  <p className="mt-0.5 font-medium text-foreground">
                    {viewTarget.contact_phone ?? "—"}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Description</span>
                <p className="mt-0.5 text-muted-foreground">
                  {viewTarget.description ?? "No description provided."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setViewTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Add Mosque Modal */}
      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a mosque</DialogTitle>
            <DialogDescription>
              Enter the mosque details and create the Mosque Admin's login password.
            </DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="mosque-name">Mosque name *</Label>
                <Input
                  id="mosque-name"
                  value={form.name}
                  aria-invalid={nameError ? true : undefined}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1"
                />
                {nameError ? (
                  <p className="mt-1 text-sm font-medium text-destructive">{nameError}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="mosque-contact_email">Contact Email (Admin Username) *</Label>
                <Input
                  id="mosque-contact_email"
                  type="email"
                  value={form.contact_email}
                  aria-invalid={emailError ? true : undefined}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="admin@mosque.org"
                  className="mt-1"
                />
                {emailError ? (
                  <p className="mt-1 text-sm font-medium text-destructive">{emailError}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="mosque-admin_password">Admin Password *</Label>
                <PasswordInput
                  id="mosque-admin_password"
                  value={form.admin_password}
                  aria-invalid={passwordError ? true : undefined}
                  onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="mt-1"
                />
                {passwordError ? (
                  <p className="mt-1 text-sm font-medium text-destructive">{passwordError}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="mosque-city">City</Label>
                  <Input
                    id="mosque-city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="mosque-country">Country</Label>
                  <Input
                    id="mosque-country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mosque-address">Address</Label>
                <Input
                  id="mosque-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mosque-contact_phone">Contact Phone</Label>
                <Input
                  id="mosque-contact_phone"
                  value={form.contact_phone}
                  aria-invalid={phoneError ? true : undefined}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="mt-1"
                />
                {phoneError ? (
                  <p className="mt-1 text-sm font-medium text-destructive">{phoneError}</p>
                ) : null}
              </div>

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
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                Boolean(nameError || emailError || passwordError || phoneError) || save.isPending
              }
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Creating..." : "Add mosque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminShell>
  );
}
