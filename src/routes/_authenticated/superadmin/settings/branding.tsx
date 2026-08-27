import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageUp, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { SettingsNav } from "@/components/superadmin/SettingsNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SUPER_META, logActivity } from "@/lib/superadmin";
import { savePlatformSettings } from "@/lib/platform-settings";
import {
  COLOR_FIELDS,
  DEFAULT_BRANDING,
  applyBranding,
  brandingFrom,
  resolveLogoUrl,
  type BrandingColors,
} from "@/lib/branding";
import { PLATFORM_SETTINGS_KEY, useBranding } from "@/components/branding/BrandingProvider";

import { validateHexColor } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/superadmin/settings/branding")({
  head: () =>
    SUPER_META("Branding & theme", "Logo, colour palette and dark mode for the whole platform."),
  component: BrandingSettingsPage,
});

function BrandingSettingsPage() {
  const { settings, refresh, logoUrl } = useBranding();
  const queryClient = useQueryClient();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [colors, setColors] = useState<BrandingColors>(() => brandingFrom(null));
  const [dark, setDark] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setColors(brandingFrom(settings));
    setDark(Boolean(settings.dark_mode_default));
    setLogoPath(settings.logo_url ?? null);
  }, [settings]);

  useEffect(() => {
    setLogoPreview(logoUrl ?? null);
  }, [logoUrl]);

  // Scope the in-progress palette to the preview panel only, so nothing is
  // re-themed platform-wide until the admin saves.
  useEffect(() => {
    applyBranding(colors, previewRef.current);
  }, [colors]);

  const dirty = useMemo(() => {
    if (!settings) return false;
    const saved = brandingFrom(settings);
    return (
      COLOR_FIELDS.some((field) => saved[field.key] !== colors[field.key]) ||
      Boolean(settings.dark_mode_default) !== dark ||
      (settings.logo_url ?? null) !== logoPath
    );
  }, [settings, colors, dark, logoPath]);

  const update = (key: keyof BrandingColors, value: string) =>
    setColors((prev) => ({ ...prev, [key]: value }));

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logos must be 2 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `logo-${Date.now()}.${extension}`;
      const { error } = await supabase.storage
        .from("branding")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw new Error(error.message);
      setLogoPath(path);
      setLogoPreview(await resolveLogoUrl(path));
      toast.success("Logo uploaded. Save to publish it.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      await savePlatformSettings({
        ...colors,
        dark_mode_default: dark,
        logo_url: logoPath,
      });
      await logActivity("platform_branding_updated", "platform_settings", null, {
        ...colors,
        dark_mode_default: dark,
      });
    },
    onSuccess: () => {
      toast.success("Branding saved — the platform theme is updated for everyone.");
      void queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_KEY });
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SuperAdminShell
      title="Settings"
      description="Configuration that applies to the whole Marriage Database platform."
    >
      <SettingsNav />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="surface-card space-y-4 rounded-xl p-5">
            <div>
              <h2 className="text-h3 text-foreground">Logo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Shown in the header across member, mosque admin and public screens. PNG or SVG,
                square works best, 2 MB maximum.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Current platform logo"
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <span className="font-display text-lg font-bold text-primary">N+</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleUpload(file);
                    event.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <ImageUp aria-hidden="true" />
                  {uploading ? "Uploading…" : "Upload logo"}
                </Button>
                {logoPath ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setLogoPath(null);
                      setLogoPreview(null);
                    }}
                  >
                    Remove logo
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="surface-card space-y-4 rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-h3 text-foreground">Colour palette</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Defaults are the Marriage Database brand values. The preview updates instantly;
                  nothing is saved to your database until you click <strong>Save branding</strong>{" "}
                  below.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setColors({ ...DEFAULT_BRANDING })}
              >
                <RotateCcw aria-hidden="true" />
                Reset to Marriage Database defaults
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {COLOR_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id={field.key}
                      type="color"
                      value={colors[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                      aria-label={`${field.label} colour picker`}
                    />
                    <Input
                      value={colors[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                      aria-label={`${field.label} hex value`}
                      aria-invalid={validateHexColor(colors[field.key]) ? true : undefined}
                      className="font-mono uppercase"
                      maxLength={9}
                    />
                  </div>
                  {validateHexColor(colors[field.key]) ? (
                    <p className="text-sm font-medium text-destructive">
                      {validateHexColor(colors[field.key])}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-xl p-5">
            <div>
              <h2 className="text-h3 text-foreground">Dark mode default</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                When on, the platform loads in its dark theme for everyone by default.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="dark-default" checked={dark} onCheckedChange={setDark} />
              <Label htmlFor="dark-default">{dark ? "On" : "Off"}</Label>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => save.mutate()}
              disabled={
                save.isPending ||
                !dirty ||
                COLOR_FIELDS.some((f) => validateHexColor(colors[f.key]))
              }
            >
              {save.isPending ? "Saving…" : "Save branding"}
            </Button>
            {dirty ? <span className="text-sm text-muted-foreground">Unsaved changes.</span> : null}
          </div>
        </div>

        <aside
          ref={previewRef}
          className="surface-card h-fit space-y-4 rounded-xl p-5 lg:sticky lg:top-6"
          aria-label="Live theme preview"
        >
          <div>
            <h2 className="text-h3 text-foreground">Live preview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sample elements using the palette above.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Buttons
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button">Default</Button>
              <Button
                type="button"
                style={{
                  background: colors.button_hover_bg_color,
                  color: colors.button_text_color,
                }}
              >
                Hover
              </Button>
              <Button
                type="button"
                style={{
                  background: colors.button_active_bg_color,
                  color: colors.button_text_color,
                }}
              >
                Pressed
              </Button>
              <Button type="button" variant="outline">
                Secondary
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Card
            </p>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="font-display text-lg font-bold text-primary">Amina, 28</p>
              <p className="text-sm text-muted-foreground">Manchester · Verified by mosque</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>Approved</Badge>
                <span
                  className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-primary-foreground"
                  style={{ background: colors.success_color }}
                >
                  Verified
                </span>
                <span
                  className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-primary-foreground"
                  style={{ background: colors.warning_color }}
                >
                  Pending
                </span>
                <span
                  className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-primary-foreground"
                  style={{ background: colors.error_color }}
                >
                  Action needed
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Accents
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_FIELDS.map((field) => (
                <span
                  key={field.key}
                  title={`${field.label} ${colors[field.key]}`}
                  className="h-8 w-8 rounded-md border border-border"
                  style={{ background: colors[field.key] }}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </SuperAdminShell>
  );
}
