import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { SettingsNav } from "@/components/superadmin/SettingsNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPER_META, formatDateTime, logActivity } from "@/lib/superadmin";
import { savePlatformSettings } from "@/lib/platform-settings";
import { useBranding, PLATFORM_SETTINGS_KEY } from "@/components/branding/BrandingProvider";

export const Route = createFileRoute("/_authenticated/superadmin/settings/")({
  head: () => SUPER_META("General settings", "Platform-wide name and general configuration."),
  component: GeneralSettingsPage,
});

function GeneralSettingsPage() {
  const { settings, refresh } = useBranding();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  useEffect(() => {
    if (settings) setName(settings.platform_name ?? "");
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const value = name.trim();
      if (!value) throw new Error("Platform name cannot be empty.");
      await savePlatformSettings({ platform_name: value });
      await logActivity("platform_settings_general_updated", "platform_settings", null, {
        platform_name: value,
      });
    },
    onSuccess: () => {
      toast.success("General settings saved.");
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

      <section className="surface-card max-w-2xl space-y-5 rounded-xl p-5">
        <div>
          <h2 className="text-h3 text-foreground">General</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The platform name appears in the header lockup, page titles and outgoing messages.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform-name">Platform name</Label>
          <Input
            id="platform-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Marriage Database"
            maxLength={80}
          />
        </div>

        <dl className="grid gap-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-semibold text-foreground">
              {formatDateTime(settings?.updated_at ?? null)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Settings record</dt>
            <dd className="font-semibold text-foreground">Single shared row (id 1)</dd>
          </div>
        </dl>

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save general settings"}
        </Button>
      </section>
    </SuperAdminShell>
  );
}
