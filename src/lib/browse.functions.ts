import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Signs storage paths for photos that members are authorized to view (own photos,
 * public photos on approved profiles, or mutual-consent matched photos).
 */
export const signPublicPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ paths: z.array(z.string()).max(60) }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.paths.length === 0) return { urls: {} as Record<string, string> };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: allowed, error } = await supabaseAdmin.rpc("get_accessible_photo_urls", {
      p_user_id: context.userId,
      p_paths: data.paths,
    });

    if (error) throw error;

    const allowedPaths = [...new Set((allowed ?? []).map((r) => r.photo_url))];
    if (allowedPaths.length === 0) return { urls: {} as Record<string, string> };

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("profile-photos")
      .createSignedUrls(allowedPaths, 3600);

    if (signErr) throw signErr;

    const urls: Record<string, string> = {};
    for (let i = 0; i < allowedPaths.length; i++) {
      const p = allowedPaths[i];
      const item = signed?.[i];
      if (item?.signedUrl) {
        urls[p] = item.signedUrl;
      }
    }
    return { urls };
  });
