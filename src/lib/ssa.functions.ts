import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const brandingSchema = z.object({
  primary_color: z.string().min(1),
  secondary_color: z.string().min(1),
  button_bg_color: z.string().min(1),
  button_text_color: z.string().min(1),
  button_hover_bg_color: z.string().min(1),
  button_active_bg_color: z.string().min(1),
  success_color: z.string().min(1),
  warning_color: z.string().min(1),
  error_color: z.string().min(1),
  dark_mode_default: z.boolean(),
  logo_url: z.string().nullable().optional(),
});

async function assertIsSsa(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data?.role !== "super_super_admin") {
    throw new Error("Unauthorized: platform owner access required.");
  }
  return supabaseAdmin;
}

async function tenantIdForSa(
  admin: Awaited<ReturnType<typeof assertIsSsa>>,
  saId: string,
): Promise<string> {
  const { data, error } = await admin
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", saId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.role !== "super_admin" || !data.tenant_id) {
    throw new Error("Super admin tenant not found.");
  }
  return data.tenant_id;
}

async function rollbackAuthUser(
  admin: Awaited<ReturnType<typeof assertIsSsa>>,
  userId: string | undefined,
) {
  if (!userId) return;
  try {
    await admin.auth.admin.deleteUser(userId);
  } catch {
    // best-effort cleanup
  }
}

export const createSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        first_name: z.string().min(1).max(80),
        last_name: z.string().min(1).max(80),
        circle_name: z.string().min(1).max(120),
        phone: z.string().min(5).max(40),
        password: z.string().min(8),
        branding: brandingSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertIsSsa(context.userId);
    const fullName = `${data.first_name} ${data.last_name}`.trim();
    let createdUserId: string | undefined;
    let tenantId: string | undefined;

    try {
      const { data: tenant, error: tenantError } = await admin
        .from("tenants")
        .insert({
          name: data.circle_name.trim(),
          logo_url: data.branding.logo_url ?? null,
          primary_color: data.branding.primary_color,
          secondary_color: data.branding.secondary_color,
          button_bg_color: data.branding.button_bg_color,
          button_text_color: data.branding.button_text_color,
          button_hover_bg_color: data.branding.button_hover_bg_color,
          button_active_bg_color: data.branding.button_active_bg_color,
          success_color: data.branding.success_color,
          warning_color: data.branding.warning_color,
          error_color: data.branding.error_color,
          dark_mode_default: data.branding.dark_mode_default,
          is_active: true,
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (tenantError) throw new Error(tenantError.message);
      tenantId = tenant.id;

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: data.email.trim(),
        password: data.password,
        email_confirm: true,
        user_metadata: {
          first_name: data.first_name,
          last_name: data.last_name,
          full_name: fullName,
          phone: data.phone,
        },
      });
      if (createError) throw new Error(createError.message);
      createdUserId = created.user?.id;
      if (!createdUserId) throw new Error("Failed to create auth user.");

      const { error: profileError } = await admin.from("profiles").upsert({
        id: createdUserId,
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        role: "super_admin" as never,
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: fullName,
        account_status: "active" as never,
        tenant_id: tenantId,
      } as never);
      if (profileError) throw new Error(profileError.message);

      await admin.from("activity_logs").insert({
        actor_id: context.userId,
        action: "ssa_create_super_admin",
        target_table: "tenants",
        target_id: tenantId,
        tenant_id: tenantId,
        metadata: {
          email: data.email.trim().toLowerCase(),
          tenant_name: data.circle_name,
          sa_id: createdUserId,
        },
      } as never);

      try {
        await admin.functions.invoke("send-notification-email", {
          body: {
            to: data.email.trim(),
            subject: "Your Super Admin account — Marriage Database",
            title: "Welcome, Super Admin",
            message: `Your tenant "${data.circle_name}" has been created. Sign in with this email to manage your mosques and members.`,
            actionUrl: "/auth",
          },
        });
      } catch {
        // email is best-effort
      }

      return { id: createdUserId, tenant_id: tenantId };
    } catch (error) {
      await rollbackAuthUser(admin, createdUserId);
      if (tenantId) {
        try {
          await admin.from("tenants").delete().eq("id", tenantId);
        } catch {
          // best-effort
        }
      }
      throw error;
    }
  });

export const updateSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        sa_id: z.string().uuid(),
        first_name: z.string().min(1).max(80).optional(),
        last_name: z.string().min(1).max(80).optional(),
        circle_name: z.string().min(1).max(120).optional(),
        phone: z.string().min(5).max(40).optional(),
        branding: brandingSchema.partial().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertIsSsa(context.userId);
    const saId = data.sa_id;
    const tenantId = await tenantIdForSa(admin, saId);

    const profilePatch: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      full_name?: string;
    } = {};
    if (data.first_name !== undefined) profilePatch.first_name = data.first_name;
    if (data.last_name !== undefined) profilePatch.last_name = data.last_name;
    if (data.phone !== undefined) profilePatch.phone = data.phone;
    if (data.first_name !== undefined || data.last_name !== undefined) {
      const { data: existing } = await admin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", saId)
        .maybeSingle();
      const first = data.first_name ?? existing?.first_name ?? "";
      const last = data.last_name ?? existing?.last_name ?? "";
      profilePatch.full_name = `${first} ${last}`.trim();
    }

    if (Object.keys(profilePatch).length > 0) {
      const { error } = await admin.from("profiles").update(profilePatch as never).eq("id", saId);
      if (error) throw new Error(error.message);
    }

    const tenantPatch: Record<string, string | boolean | null> = {
      updated_at: new Date().toISOString(),
    };
    if (data.circle_name !== undefined) tenantPatch.name = data.circle_name;
    if (data.branding) {
      for (const [key, value] of Object.entries(data.branding)) {
        if (value !== undefined) tenantPatch[key] = value as string | boolean | null;
      }
    }

    if (Object.keys(tenantPatch).length > 1) {
      const { error: tenantError } = await admin
        .from("tenants")
        .update(tenantPatch as never)
        .eq("id", tenantId);
      if (tenantError) throw new Error(tenantError.message);
    }

    await admin.from("activity_logs").insert({
      actor_id: context.userId,
      action: "ssa_update_super_admin",
      target_table: "tenants",
      target_id: tenantId,
      tenant_id: tenantId,
      metadata: { fields: Object.keys(tenantPatch), sa_id: saId },
    } as never);

    return { ok: true };
  });

export const resetSuperAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ sa_id: z.string().uuid(), password: z.string().min(8) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertIsSsa(context.userId);
    const tenantId = await tenantIdForSa(admin, data.sa_id);

    const { error } = await admin.auth.admin.updateUserById(data.sa_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);

    await admin.from("activity_logs").insert({
      actor_id: context.userId,
      action: "ssa_reset_super_admin_password",
      target_table: "profiles",
      target_id: data.sa_id,
      tenant_id: tenantId,
      metadata: {},
    } as never);

    return { ok: true };
  });

export const setSuperAdminActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ sa_id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertIsSsa(context.userId);
    const tenantId = await tenantIdForSa(admin, data.sa_id);

    const { error } = await admin
      .from("tenants")
      .update({
        is_active: data.active,
        deactivated_at: data.active ? null : new Date().toISOString(),
        deactivated_by: data.active ? null : context.userId,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", tenantId);
    if (error) throw new Error(error.message);

    if (!data.active) {
      const { error: banError } = await admin.auth.admin.updateUserById(data.sa_id, {
        ban_duration: "876000h",
      });
      if (banError) throw new Error(banError.message);
    } else {
      const { error: unbanError } = await admin.auth.admin.updateUserById(data.sa_id, {
        ban_duration: "none",
      });
      if (unbanError) throw new Error(unbanError.message);
    }

    await admin.from("activity_logs").insert({
      actor_id: context.userId,
      action: data.active ? "ssa_activate_super_admin" : "ssa_deactivate_super_admin",
      target_table: "tenants",
      target_id: tenantId,
      tenant_id: tenantId,
      metadata: { active: data.active, sa_id: data.sa_id },
    } as never);

    return { ok: true };
  });
