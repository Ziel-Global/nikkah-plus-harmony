import { supabase } from "@/integrations/supabase/client";
import type { PlatformSettings } from "@/lib/branding";

/**
 * Writes to the single shared `platform_settings` row (id = 1) and stamps the
 * acting platform admin. RLS restricts this update to super admins.
 */
export async function savePlatformSettings(
  patch: Partial<Omit<PlatformSettings, "id" | "updated_at" | "updated_by">>,
) {
  const { data: auth } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("platform_settings")
    .update({
      ...patch,
      updated_by: auth?.user?.id ?? null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", 1);

  if (error) throw new Error(error.message);
}
