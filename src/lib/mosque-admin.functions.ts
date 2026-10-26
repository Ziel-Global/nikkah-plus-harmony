import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertIsSuperAdminInCircle(userId: string, mosqueId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (profile?.role !== "super_admin") {
    throw new Error("Unauthorized: super admin access required.");
  }

  const { data: profileTenant } = await supabaseAdmin
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  const { data: mosque, error: mosqueError } = await supabaseAdmin
    .from("mosques")
    .select("id, tenant_id, name, city, country, address, contact_phone")
    .eq("id", mosqueId)
    .maybeSingle();
  if (mosqueError) throw new Error(mosqueError.message);
  if (!mosque || !profileTenant?.tenant_id || mosque.tenant_id !== profileTenant.tenant_id) {
    throw new Error("Unauthorized: mosque is outside your tenant.");
  }
  return { supabaseAdmin, mosque, tenantId: mosque.tenant_id as string };
}

export const createMosqueAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        mosque_id: z.string().uuid(),
        email: z.string().email(),
        password: z.string().min(8),
        full_name: z.string().min(1).max(120).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, mosque, tenantId } = await assertIsSuperAdminInCircle(
      context.userId,
      data.mosque_id,
    );

    // Global email uniqueness (all circles)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email.trim().toLowerCase())
      .maybeSingle();
    if (existingProfile) {
      throw new Error("This email is already registered on the platform.");
    }

    let createdUserId: string | undefined;
    try {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email.trim(),
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name ?? null,
        },
      });
      if (createError) throw new Error(createError.message);
      createdUserId = created.user?.id;
      if (!createdUserId) throw new Error("Failed to create mosque admin auth user.");

      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        id: createdUserId,
        email: data.email.trim().toLowerCase(),
        role: "mosque_admin" as never,
        mosque_id: data.mosque_id,
        tenant_id: tenantId,
        full_name: data.full_name ?? null,
        account_status: "active" as never,
      } as never);
      if (profileError) throw new Error(profileError.message);

      const { error: linkError } = await supabaseAdmin.from("mosque_admin_mosques").upsert(
        {
          admin_id: createdUserId,
          mosque_id: data.mosque_id,
          assigned_by: context.userId,
          tenant_id: tenantId,
        } as never,
        { onConflict: "admin_id,mosque_id" },
      );
      if (linkError) throw new Error(linkError.message);

      return {
        id: createdUserId,
        mosque_name: (mosque as { name?: string }).name ?? "Mosque",
      };
    } catch (error) {
      if (createdUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        } catch {
          // best-effort
        }
      }
      throw error;
    }
  });
