import { supabase } from "@/integrations/supabase/client";
import type { SaCircleListRow } from "@/lib/ssa";

/** Load SA rows joined to their tenant for the SSA portal. */
export async function fetchSaTenantRows(): Promise<SaCircleListRow[]> {
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name, is_active, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return Promise.all(
    (tenants ?? []).map(async (tenant) => {
      const { data: sa } = await supabase
        .from("profiles")
        .select("id, email, phone, first_name, last_name")
        .eq("tenant_id", tenant.id)
        .eq("role", "super_admin")
        .maybeSingle();

      const { count: mosqueCount } = await supabase
        .from("mosques")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      const { count: memberCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .neq("role", "super_admin");

      return {
        id: sa?.id ?? tenant.id,
        tenant_id: tenant.id,
        super_admin_id: sa?.id ?? tenant.id,
        circle_name: tenant.name,
        is_active: tenant.is_active,
        created_at: tenant.created_at,
        first_name: sa?.first_name ?? null,
        last_name: sa?.last_name ?? null,
        email: sa?.email ?? null,
        phone: sa?.phone ?? null,
        mosque_count: mosqueCount ?? 0,
        member_count: memberCount ?? 0,
      };
    }),
  );
}
