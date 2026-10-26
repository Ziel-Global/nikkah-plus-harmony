import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BrandingEditor,
  brandingValueIsValid,
  emptyBrandingValue,
  type BrandingEditorValue,
} from "@/components/branding/BrandingEditor";
import { SsaShell } from "@/components/ssa/SsaShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  resetSuperAdminPassword,
  setSuperAdminActive,
  updateSuperAdmin,
} from "@/lib/ssa.functions";
import { SSA_META } from "@/lib/ssa";
import { formatDay } from "@/lib/superadmin";
import {
  friendlyError,
  validatePassword,
  validatePhone,
  validateRequiredText,
} from "@/lib/validation";
import { brandingFrom } from "@/lib/branding";

export const Route = createFileRoute("/_authenticated/ssa/super-admins/$saId")({
  head: () => SSA_META("Super admin", "View and edit a super admin circle."),
  component: SuperAdminDetailPage,
});

type CircleDetail = {
  id: string;
  tenant_id: string;
  super_admin_id: string;
  circle_name: string;
  is_active: boolean;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  button_bg_color?: string | null;
  button_text_color?: string | null;
  button_hover_bg_color?: string | null;
  button_active_bg_color?: string | null;
  success_color?: string | null;
  warning_color?: string | null;
  error_color?: string | null;
  dark_mode_default?: boolean | null;
  logo_url?: string | null;
};

type MosqueRow = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

type MemberRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  role: string;
  account_status: string;
  mosque_id: string | null;
  created_at: string;
};

function SuperAdminDetailPage() {
  const { saId } = Route.useParams();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [circleName, setCircleName] = useState("");
  const [phone, setPhone] = useState("");
  const [branding, setBranding] = useState<BrandingEditorValue>(emptyBrandingValue);
  const [newPassword, setNewPassword] = useState("");

  const detail = useQuery({
    queryKey: ["ssa", "super-admin", saId],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, phone, first_name, last_name, tenant_id, role")
        .eq("id", saId)
        .eq("role", "super_admin")
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.tenant_id) throw new Error("Super admin tenant not found.");

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id)
        .maybeSingle();
      if (tenantError) throw tenantError;
      if (!tenant) throw new Error("Tenant not found.");

      return {
        ...tenant,
        id: profile.id,
        tenant_id: tenant.id,
        super_admin_id: profile.id,
        circle_name: tenant.name,
        email: profile.email ?? null,
        phone: profile.phone ?? null,
        first_name: profile.first_name ?? null,
        last_name: profile.last_name ?? null,
      } as CircleDetail;
    },
  });

  const mosques = useQuery({
    queryKey: ["ssa", "super-admin", saId, "mosques", detail.data?.tenant_id],
    enabled: Boolean(detail.data?.tenant_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosques")
        .select("id, name, city, country, contact_email, contact_phone, created_at")
        .eq("tenant_id", detail.data!.tenant_id)
        .order("name");
      if (error) throw error;
      return (data ?? []) as MosqueRow[];
    },
  });

  const members = useQuery({
    queryKey: ["ssa", "super-admin", saId, "members", detail.data?.tenant_id],
    enabled: Boolean(detail.data?.tenant_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, phone, gender, role, account_status, mosque_id, created_at",
        )
        .eq("tenant_id", detail.data!.tenant_id)
        .neq("role", "super_admin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MemberRow[];
    },
  });

  useEffect(() => {
    if (!detail.data) return;
    const d = detail.data;
    setFirstName(d.first_name ?? "");
    setLastName(d.last_name ?? "");
    setCircleName(d.circle_name ?? "");
    setPhone(d.phone ?? "");
    const colorPatch: Partial<import("@/lib/branding").BrandingColors> = {};
    if (d.primary_color) colorPatch.primary_color = d.primary_color;
    if (d.secondary_color) colorPatch.secondary_color = d.secondary_color;
    if (d.button_bg_color) colorPatch.button_bg_color = d.button_bg_color;
    if (d.button_text_color) colorPatch.button_text_color = d.button_text_color;
    if (d.button_hover_bg_color) colorPatch.button_hover_bg_color = d.button_hover_bg_color;
    if (d.button_active_bg_color) colorPatch.button_active_bg_color = d.button_active_bg_color;
    if (d.success_color) colorPatch.success_color = d.success_color;
    if (d.warning_color) colorPatch.warning_color = d.warning_color;
    if (d.error_color) colorPatch.error_color = d.error_color;

    setBranding({
      ...brandingFrom(colorPatch),
      dark_mode_default: Boolean(d.dark_mode_default),
      logo_url: d.logo_url ?? null,
    });
  }, [detail.data]);

  const firstNameError = firstName.trim()
    ? validateRequiredText(firstName, "First name", 80)
    : null;
  const lastNameError = lastName.trim() ? validateRequiredText(lastName, "Last name", 80) : null;
  const circleError = circleName.trim()
    ? validateRequiredText(circleName, "Circle name", 120)
    : null;
  const phoneError = phone.trim() ? validatePhone(phone) : null;
  const passwordError = newPassword ? validatePassword(newPassword) : null;

  const save = useMutation({
    mutationFn: async () => {
      await updateSuperAdmin({
        data: {
          sa_id: saId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          circle_name: circleName.trim(),
          phone: phone.trim(),
          branding: {
            primary_color: branding.primary_color,
            secondary_color: branding.secondary_color,
            button_bg_color: branding.button_bg_color,
            button_text_color: branding.button_text_color,
            button_hover_bg_color: branding.button_hover_bg_color,
            button_active_bg_color: branding.button_active_bg_color,
            success_color: branding.success_color,
            warning_color: branding.warning_color,
            error_color: branding.error_color,
            dark_mode_default: branding.dark_mode_default,
            logo_url: branding.logo_url,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success("Super admin updated.");
      void queryClient.invalidateQueries({ queryKey: ["ssa"] });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      await resetSuperAdminPassword({
        data: { sa_id: saId, password: newPassword },
      });
    },
    onSuccess: () => {
      toast.success("Password reset.");
      setNewPassword("");
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  const toggleActive = useMutation({
    mutationFn: async (active: boolean) => {
      await setSuperAdminActive({
        data: { sa_id: saId, active },
      });
    },
    onSuccess: (_data, active) => {
      toast.success(active ? "Tenant activated." : "Tenant deactivated.");
      void queryClient.invalidateQueries({ queryKey: ["ssa"] });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  async function uploadLogo(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `tenants/${detail.data?.tenant_id ?? saId}/logo-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("branding")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw new Error(error.message);
    return path;
  }

  const mosqueNameById = new Map((mosques.data ?? []).map((m) => [m.id, m.name]));

  const memberGroups = useMemo(() => {
    const list = members.data ?? [];
    return {
      mosqueAdmins: list.filter((m) => m.role === "mosque_admin"),
      brothers: list.filter((m) => m.role === "male_user"),
      sisters: list.filter((m) => m.role === "female_user"),
    };
  }, [members.data]);

  if (detail.isLoading) {
    return (
      <SsaShell title="Super admin" description="Loading tenant details…">
        <Skeleton className="h-40 rounded-xl" />
      </SsaShell>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <SsaShell title="Super admin" description="This tenant could not be loaded.">
        <p className="text-sm text-destructive">
          {(detail.error as Error | null)?.message ?? "Not found."}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/ssa/super-admins">Back to list</Link>
        </Button>
      </SsaShell>
    );
  }

  const d = detail.data;
  const detailsSaveDisabled =
    !firstName.trim() ||
    !lastName.trim() ||
    !circleName.trim() ||
    !phone.trim() ||
    Boolean(firstNameError || lastNameError || circleError || phoneError) ||
    save.isPending;
  const brandingSaveDisabled = !brandingValueIsValid(branding) || save.isPending;

  return (
    <SsaShell
      title={d.circle_name}
      description={`${[d.first_name, d.last_name].filter(Boolean).join(" ") || "Super admin"} · ${d.email ?? "—"}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant={d.is_active ? "outline" : "default"}
            disabled={toggleActive.isPending}
            onClick={() => toggleActive.mutate(!d.is_active)}
          >
            {toggleActive.isPending
              ? "Updating…"
              : d.is_active
                ? "Deactivate tenant"
                : "Activate tenant"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/ssa/super-admins">Back</Link>
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant={d.is_active ? "success" : "secondary"}>
          {d.is_active ? "Active" : "Inactive"}
        </Badge>
        <span className="text-sm text-muted-foreground">Created {formatDay(d.created_at)}</span>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="mosques">
            Mosques
            {mosques.data ? ` (${mosques.data.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="members">
            People
            {members.data
              ? ` (${memberGroups.mosqueAdmins.length + memberGroups.brothers.length + memberGroups.sisters.length})`
              : ""}
          </TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <form
            className="surface-card space-y-4 rounded-xl p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!detailsSaveDisabled) save.mutate();
            }}
          >
            <div>
              <h2 className="text-h3 text-foreground">Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Super admin identity and tenant name.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email (login)</Label>
                <Input value={d.email ?? ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={phoneError ? true : undefined}
                />
                {phoneError ? <p className="text-sm text-destructive">{phoneError}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-first">First name</Label>
                <Input
                  id="edit-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={firstNameError ? true : undefined}
                />
                {firstNameError ? (
                  <p className="text-sm text-destructive">{firstNameError}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last">Last name</Label>
                <Input
                  id="edit-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-invalid={lastNameError ? true : undefined}
                />
                {lastNameError ? <p className="text-sm text-destructive">{lastNameError}</p> : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-circle">Tenant name</Label>
                <Input
                  id="edit-circle"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  aria-invalid={circleError ? true : undefined}
                />
                {circleError ? <p className="text-sm text-destructive">{circleError}</p> : null}
              </div>
            </div>
            <Button type="submit" disabled={detailsSaveDisabled}>
              {save.isPending ? "Saving…" : "Save details"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="mosques" className="mt-0">
          <div className="mb-3">
            <h2 className="text-h3 text-foreground">Mosques</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mosques belonging to this tenant.
            </p>
          </div>
          <div className="surface-card overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Location
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Contact
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {mosques.isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ) : (mosques.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-muted-foreground">
                      No mosques in this tenant yet.
                    </td>
                  </tr>
                ) : (
                  (mosques.data ?? []).map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {[m.city, m.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{m.contact_email ?? "—"}</div>
                        {m.contact_phone ? (
                          <div className="text-xs">{m.contact_phone}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDay(m.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-0 space-y-4">
          <div>
            <h2 className="text-h3 text-foreground">People</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mosque admins and members in this tenant, grouped by type.
            </p>
          </div>

          {members.isLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (
            <Tabs defaultValue="mosque-admins" className="w-full">
              <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
                <TabsTrigger value="mosque-admins">
                  Mosque admins ({memberGroups.mosqueAdmins.length})
                </TabsTrigger>
                <TabsTrigger value="brothers">
                  Brothers ({memberGroups.brothers.length})
                </TabsTrigger>
                <TabsTrigger value="sisters">
                  Sisters ({memberGroups.sisters.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mosque-admins" className="mt-0">
                <MemberGroupTable
                  empty="No mosque admins in this tenant yet."
                  rows={memberGroups.mosqueAdmins}
                  mosqueNameById={mosqueNameById}
                  showRole={false}
                />
              </TabsContent>
              <TabsContent value="brothers" className="mt-0">
                <MemberGroupTable
                  empty="No brothers in this tenant yet."
                  rows={memberGroups.brothers}
                  mosqueNameById={mosqueNameById}
                  showRole={false}
                />
              </TabsContent>
              <TabsContent value="sisters" className="mt-0">
                <MemberGroupTable
                  empty="No sisters in this tenant yet."
                  rows={memberGroups.sisters}
                  mosqueNameById={mosqueNameById}
                  showRole={false}
                />
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="branding" className="mt-0 space-y-4">
          <div>
            <h2 className="text-h3 text-foreground">Branding</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Logo and colours for members and mosque admins in this tenant.
            </p>
          </div>
          <BrandingEditor value={branding} onChange={setBranding} onUploadLogo={uploadLogo} />
          <Button
            type="button"
            disabled={brandingSaveDisabled}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : "Save branding"}
          </Button>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <section className="surface-card space-y-4 rounded-xl p-5">
            <div>
              <h2 className="text-h3 text-foreground">Reset password</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set a new login password for this super admin.
              </p>
            </div>
            <div className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="reset-password">New password</Label>
                <PasswordInput
                  id="reset-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={passwordError ? true : undefined}
                />
                {passwordError ? (
                  <p className="text-sm text-destructive">{passwordError}</p>
                ) : null}
              </div>
              <Button
                type="button"
                disabled={!newPassword || Boolean(passwordError) || resetPassword.isPending}
                onClick={() => resetPassword.mutate()}
              >
                {resetPassword.isPending ? "Resetting…" : "Reset password"}
              </Button>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </SsaShell>
  );
}

function MemberGroupTable({
  empty,
  rows,
  mosqueNameById,
  showRole = true,
}: {
  empty: string;
  rows: MemberRow[];
  mosqueNameById: Map<string, string>;
  showRole?: boolean;
}) {
  return (
    <div className="surface-card overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Name
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Mosque
            </th>
            {showRole ? (
              <th scope="col" className="px-4 py-3 font-semibold">
                Role
              </th>
            ) : null}
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Joined
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={showRole ? 5 : 4} className="px-4 py-4 text-muted-foreground">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{m.full_name ?? m.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {m.mosque_id ? (mosqueNameById.get(m.mosque_id) ?? "—") : "—"}
                </td>
                {showRole ? (
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.role.replace(/_/g, " ")}
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <Badge variant={m.account_status === "active" ? "success" : "secondary"}>
                    {m.account_status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDay(m.created_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
