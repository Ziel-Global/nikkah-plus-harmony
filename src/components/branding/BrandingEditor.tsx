import { useEffect, useRef, useState } from "react";
import { ImageUp, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  COLOR_FIELDS,
  DEFAULT_BRANDING,
  applyBranding,
  resolveLogoUrl,
  type BrandingColors,
} from "@/lib/branding";
import { validateHexColor } from "@/lib/validation";

export type BrandingEditorValue = BrandingColors & {
  dark_mode_default: boolean;
  logo_url: string | null;
};

export function emptyBrandingValue(): BrandingEditorValue {
  return {
    ...DEFAULT_BRANDING,
    dark_mode_default: false,
    logo_url: null,
  };
}

type Props = {
  value: BrandingEditorValue;
  onChange: (next: BrandingEditorValue) => void;
  onUploadLogo: (file: File) => Promise<string>;
  readOnly?: boolean;
};

export function BrandingEditor({ value, onChange, onUploadLogo, readOnly = false }: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const url = await resolveLogoUrl(value.logo_url);
      if (!cancelled) setLogoPreview(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [value.logo_url]);

  useEffect(() => {
    applyBranding(value, previewRef.current);
  }, [value]);

  const updateColor = (key: keyof BrandingColors, color: string) =>
    onChange({ ...value, [key]: color });

  async function handleUpload(file: File) {
    if (readOnly) return;
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
      const path = await onUploadLogo(file);
      onChange({ ...value, logo_url: path });
      setLogoPreview(await resolveLogoUrl(path));
      toast.success("Logo uploaded.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const hasInvalidColor = COLOR_FIELDS.some((f) => validateHexColor(value[f.key]));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="surface-card space-y-4 rounded-xl p-5">
          <div>
            <h2 className="text-h3 text-foreground">Logo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PNG or SVG, square works best, 2 MB maximum.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain" />
              ) : (
                <span className="font-display text-lg font-bold text-primary">N+</span>
              )}
            </div>
            {!readOnly ? (
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
                {value.logo_url ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onChange({ ...value, logo_url: null })}
                  >
                    Remove logo
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="surface-card space-y-4 rounded-xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-h3 text-foreground">Colour palette</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The preview updates instantly. Nothing is published until you save.
              </p>
            </div>
            {!readOnly ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  onChange({
                    ...value,
                    ...DEFAULT_BRANDING,
                  })
                }
              >
                <RotateCcw aria-hidden="true" />
                Reset to defaults
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {COLOR_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`brand-${field.key}`}>{field.label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    id={`brand-${field.key}`}
                    type="color"
                    value={value[field.key]}
                    disabled={readOnly}
                    onChange={(event) => updateColor(field.key, event.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`${field.label} colour picker`}
                  />
                  <Input
                    value={value[field.key]}
                    disabled={readOnly}
                    onChange={(event) => updateColor(field.key, event.target.value)}
                    aria-label={`${field.label} hex value`}
                    aria-invalid={validateHexColor(value[field.key]) ? true : undefined}
                    className="font-mono uppercase"
                    maxLength={9}
                  />
                </div>
                {validateHexColor(value[field.key]) ? (
                  <p className="text-sm font-medium text-destructive">
                    {validateHexColor(value[field.key])}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
          {hasInvalidColor ? (
            <p className="text-sm text-destructive">Fix invalid colours before saving.</p>
          ) : null}
        </section>

        <section className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-xl p-5">
          <div>
            <h2 className="text-h3 text-foreground">Dark mode default</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              When on, this theme loads in dark mode by default.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="brand-dark-default"
              checked={value.dark_mode_default}
              disabled={readOnly}
              onCheckedChange={(dark) => onChange({ ...value, dark_mode_default: dark })}
            />
            <Label htmlFor="brand-dark-default">{value.dark_mode_default ? "On" : "Off"}</Label>
          </div>
        </section>
      </div>

      <aside
        ref={previewRef}
        className="surface-card h-fit space-y-4 rounded-xl p-5 lg:sticky lg:top-6"
        aria-label="Live theme preview"
      >
        <div>
          <h2 className="text-h3 text-foreground">Live preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sample elements using the palette above.</p>
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
                background: value.button_hover_bg_color,
                color: value.button_text_color,
              }}
            >
              Hover
            </Button>
            <Button
              type="button"
              style={{
                background: value.button_active_bg_color,
                color: value.button_text_color,
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
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Card</p>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="font-display text-lg font-bold text-primary">Amina, 28</p>
            <p className="text-sm text-muted-foreground">Manchester · Verified by mosque</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>Approved</Badge>
              <span
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-primary-foreground"
                style={{ background: value.success_color }}
              >
                Verified
              </span>
              <span
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-primary-foreground"
                style={{ background: value.warning_color }}
              >
                Pending
              </span>
              <span
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-primary-foreground"
                style={{ background: value.error_color }}
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
                title={`${field.label} ${value[field.key]}`}
                className="h-8 w-8 rounded-md border border-border"
                style={{ background: value[field.key] }}
              />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function brandingValueIsValid(value: BrandingEditorValue): boolean {
  return !COLOR_FIELDS.some((f) => validateHexColor(value[f.key]));
}
