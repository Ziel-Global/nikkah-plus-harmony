import { supabase } from "@/integrations/supabase/client";

/** Signs storage paths the current user is allowed to read (enforced by storage RLS). */
export async function signProfilePhotoPaths(
  paths: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return {};

  const urls: Record<string, string> = {};
  await Promise.all(
    unique.map(async (path) => {
      const { data, error } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(path, 3600);
      if (!error && data?.signedUrl) {
        urls[path] = data.signedUrl;
      }
    }),
  );
  return urls;
}
