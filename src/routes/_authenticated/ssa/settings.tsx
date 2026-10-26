import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BrandingEditor,
  brandingValueIsValid,
  emptyBrandingValue,
  type BrandingEditorValue,
} from "@/components/branding/BrandingEditor";
import { useBranding, PLATFORM_SETTINGS_KEY } from "@/components/branding/BrandingProvider";
import { SsaShell } from "@/components/ssa/SsaShell";
import { Button } from "@/components/ui/button";
import { brandingFrom } from "@/lib/branding";
import { savePlatformSettings } from "@/lib/platform-settings";
import { SSA_META } from "@/lib/ssa";
import { logActivity } from "@/lib/superadmin";
import { friendlyError } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/ssa/settings")({
  head: () =>
    SSA_META(
      "Platform settings",
      "Default branding for Marriage Database when a circle has no custom theme.",
    ),
  component: SsaSettingsPage,
});

function SsaSettingsPage() {
  const { settings, refresh } = useBranding();
  const queryClient = useQueryClient();
  const [branding, setBranding] = useState<BrandingEditorValue>(emptyBrandingValue);

  useEffect(() => {
    if (!settings) return;
    setBranding({
      ...brandingFrom(settings),
      dark_mode_default: Boolean(settings.dark_mode_default),
      logo_url: settings.logo_url ?? null,
    });
  }, [settings]);

  const dirty = useMemo(() => {
    if (!settings) return false;
    const saved = {
      ...brandingFrom(settings),
      dark_mode_default: Boolean(settings.dark_mode_default),
      logo_url: settings.logo_url ?? null,
    };
    return (Object.keys(saved) as (keyof BrandingEditorValue)[]).some(
      (key) => saved[key] !== branding[key],
    );
  }, [settings, branding]);

  const save = useMutation({
    mutationFn: async () => {
      await savePlatformSettings({
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
      });
      await logActivity("platform_branding_updated", "platform_settings", null, {
        source: "ssa",
        dark_mode_default: branding.dark_mode_default,
      });
    },
    onSuccess: () => {
      toast.success("Platform default branding saved.");
      void queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_KEY });
      refresh();
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  async function uploadLogo(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `logo-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("branding")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw new Error(error.message);
    return path;
  }

  return (
    <SsaShell
      title="Settings"
      description="Platform-wide default branding. Super admins may override this for their own circle."
    >
      <BrandingEditor value={branding} onChange={setBranding} onUploadLogo={uploadLogo} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending || !dirty || !brandingValueIsValid(branding)}
        >
          {save.isPending ? "Saving…" : "Save platform branding"}
        </Button>
        {dirty ? <span className="text-sm text-muted-foreground">Unsaved changes.</span> : null}
      </div>
    </SsaShell>
  );
}
