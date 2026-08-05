import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Signs storage paths for photos that members have marked as publicly visible.
 * The caller's own (RLS-scoped) client verifies each path really belongs to a
 * public photo on an approved profile before the admin client signs it.
 */
export const signPublicPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ paths: z.array(z.string()).max(60) }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.paths.length === 0) return { urls: {} as Record<string, string> };

    const { data: allowed, error } = await context.supabase
      .from("profile_photos")
      .select("photo_url")
      .eq("visibility", "public")
      .in("photo_url", data.paths);

    if (error) throw error;

    const allowedPaths = [...new Set((allowed ?? []).map((r) => r.photo_url))];
    if (allowedPaths.length === 0) return { urls: {} as Record<string, string> };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("profile-photos")
      .createSignedUrls(allowedPaths, 3600);

    if (signErr) throw signErr;

    const urls: Record<string, string> = {};
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
    }
    return { urls };
  });
