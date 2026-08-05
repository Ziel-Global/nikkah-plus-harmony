import { PRIVACY_FIELDS, type PrivacySettings, type PrivacyValue } from "@/lib/profile-options";
import { cn } from "@/lib/utils";

const OPTIONS: { value: PrivacyValue; label: string; hint: string }[] = [
  { value: "public", label: "Public", hint: "Visible to members you are matched with" },
  { value: "mosque_admin_only", label: "Mosque admin only", hint: "Only your mosque can see it" },
];

export function PrivacyPanel({
  settings,
  onChange,
  readOnly,
}: {
  settings: PrivacySettings;
  onChange: (next: PrivacySettings) => void;
  readOnly?: boolean | undefined;
}) {
  return (
    <div className="space-y-3">
      {PRIVACY_FIELDS.map((field) => {
        const current: PrivacyValue = settings[field.key] ?? "mosque_admin_only";
        return (
          <div
            key={field.key}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted p-3"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{field.label}</p>
              <p className="text-caption">
                {OPTIONS.find((o) => o.value === current)?.hint}
              </p>
            </div>
            <div
              role="group"
              aria-label={`${field.label} visibility`}
              className="inline-flex rounded-lg border border-border bg-card p-1"
            >
              {OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={readOnly}
                  aria-pressed={current === o.value}
                  onClick={() => onChange({ ...settings, [field.key]: o.value })}
                  className={cn(
                    "min-h-9 rounded-md px-3 text-xs font-semibold transition-colors",
                    current === o.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary",
                    readOnly && "cursor-not-allowed opacity-60",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
