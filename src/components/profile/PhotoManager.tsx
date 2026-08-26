import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PhotoRow = {
  id: string;
  photo_url: string;
  is_primary: boolean;
  visibility: string;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function PhotoManager({
  profileId,
  userId,
  readOnly,
}: {
  profileId: string | null;
  userId: string;
  readOnly?: boolean | undefined;
}) {
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!profileId) return;
    const { data, error } = await supabase
      .from("profile_photos")
      .select("id, photo_url, is_primary, visibility")
      .eq("profile_id", profileId)
      .order("uploaded_at", { ascending: true });

    if (error) {
      toast.error("We couldn't load your photos just now.");
      return;
    }
    const rows = (data ?? []) as PhotoRow[];
    setPhotos(rows);

    const signed: Record<string, string> = {};
    await Promise.all(
      rows.map(async (row) => {
        const { data: s } = await supabase.storage
          .from("profile-photos")
          .createSignedUrl(row.photo_url, 3600);
        if (s?.signedUrl) signed[row.id] = s.signedUrl;
      }),
    );
    setUrls(signed);
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onFile(file: File) {
    if (!profileId) {
      toast.error("Please save your basic information first — that creates your profile.");
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Please choose an image under 5MB.");
      return;
    }

    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (upErr) {
      setBusy(false);
      toast.error("That upload didn't complete. Please try again.");
      return;
    }

    const { error } = await supabase.from("profile_photos").insert({
      profile_id: profileId,
      photo_url: path,
      is_primary: photos.length === 0,
      visibility: "hidden_until_match",
    });

    setBusy(false);
    if (error) {
      toast.error("We saved the image but couldn't attach it to your profile.");
      return;
    }
    toast.success("Photo added. It stays hidden until a match is made.");
    void load();
  }

  async function makePrimary(id: string) {
    if (!profileId) return;
    setBusy(true);
    await supabase.from("profile_photos").update({ is_primary: false }).eq("profile_id", profileId);
    const { error } = await supabase
      .from("profile_photos")
      .update({ is_primary: true })
      .eq("id", id);
    setBusy(false);
    if (error) toast.error("We couldn't set that as your main photo.");
    else void load();
  }

  async function remove(row: PhotoRow) {
    setBusy(true);
    await supabase.storage.from("profile-photos").remove([row.photo_url]);
    const { error } = await supabase.from("profile_photos").delete().eq("id", row.id);
    setBusy(false);
    if (error) toast.error("We couldn't remove that photo.");
    else void load();
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((row) => (
            <li key={row.id} className="overflow-hidden rounded-lg border border-border bg-muted">
              <div className="aspect-[3/4] w-full bg-accent">
                {urls[row.id] ? (
                  <img
                    src={urls[row.id]}
                    alt="Your uploaded profile photograph"
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    row.is_primary ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {row.is_primary ? "Main photo" : "Additional"}
                </span>
                {readOnly ? null : (
                  <span className="flex items-center gap-1">
                    {row.is_primary ? null : (
                      <button
                        type="button"
                        aria-label="Set as main photo"
                        disabled={busy}
                        onClick={() => void makePrimary(row.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-primary"
                      >
                        <Star className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Remove photo"
                      disabled={busy}
                      onClick={() => void remove(row)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No photographs added yet. Photographs are optional and remain hidden until an introduction
          is agreed.
        </p>
      )}

      {readOnly ? null : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            Add a photograph
          </Button>
          <p className="text-caption">
            JPG, PNG or WEBP, up to 5MB. Every photograph is stored privately with the visibility
            “hidden until match”, so nobody browses your pictures.
          </p>
        </>
      )}
    </div>
  );
}
