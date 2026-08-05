import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";
import { SettingsNav } from "@/components/superadmin/SettingsNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPER_META, logActivity } from "@/lib/superadmin";
import { savePlatformSettings } from "@/lib/platform-settings";
import { PLATFORM_SETTINGS_KEY, useBranding } from "@/components/branding/BrandingProvider";

export const Route = createFileRoute("/_authenticated/superadmin/settings/workflow")({
  head: () => SUPER_META("Workflow settings", "Dormancy thresholds and review workflow rules."),
  component: WorkflowSettingsPage,
});

function WorkflowSettingsPage() {
  const { settings, refresh } = useBranding();
  const queryClient = useQueryClient();
  const [days, setDays] = useState("180");

  useEffect(() => {
    if (settings) setDays(String(settings.inactivity_threshold_days ?? 180));
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const value = Number(days);
      if (!Number.isInteger(value) || value < 7 || value > 1095) {
        throw new Error("Enter a whole number of days between 7 and 1095.");
      }
      await savePlatformSettings({ inactivity_threshold_days: value });
      await logActivity("platform_workflow_updated", "platform_settings", null, {
        inactivity_threshold_days: value,
      });
    },
    onSuccess: () => {
      toast.success("Workflow settings saved.");
      void queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_KEY });
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SuperAdminShell
      title="Settings"
      description="Configuration that applies to the whole Nikkah+ platform."
    >
      <SettingsNav />

      <section className="surface-card max-w-2xl space-y-5 rounded-xl p-5">
        <div>
          <h2 className="text-h3 text-foreground">Inactivity threshold</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts with no sign-in for longer than this are surfaced under Inactive flags for
            review. Flagging is a prompt for a human check — no account is ever suspended
            automatically.
          </p>
        </div>

        <div className="max-w-xs space-y-2">
          <Label htmlFor="inactivity-days">Days without signing in</Label>
          <Input
            id="inactivity-days"
            type="number"
            min={7}
            max={1095}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Between 7 and 1095 days.</p>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save workflow settings"}
        </Button>
      </section>
    </SuperAdminShell>
  );
}
