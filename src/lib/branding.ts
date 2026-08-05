/**
 * Runtime branding.
 *
 * The whole design system lives in CSS variables (src/styles.css). The single
 * `platform_settings` row (id = 1) is the source of truth for brand colours,
 * the logo, the platform name and the dark-mode default. `BrandingProvider`
 * loads that row once at app start and calls `applyBranding()`, so a change in
 * Settings -> Branding re-themes every screen for every user.
 */

import { supabase } from "@/integrations/supabase/client";

export type PlatformSettings = {
  id: number;
  platform_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  button_bg_color: string;
  button_text_color: string;
  button_hover_bg_color: string;
  button_active_bg_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  dark_mode_default: boolean;
  inactivity_threshold_days: number;
  updated_at: string | null;
  updated_by: string | null;
};

export type BrandingColors = Pick<
  PlatformSettings,
  | "primary_color"
  | "secondary_color"
  | "button_bg_color"
  | "button_text_color"
  | "button_hover_bg_color"
  | "button_active_bg_color"
  | "success_color"
  | "warning_color"
  | "error_color"
>;

/** Nikkah+ defaults — mirrors the palette baked into src/styles.css. */
export const DEFAULT_BRANDING: BrandingColors = {
  primary_color: "#6B1E2A",
  secondary_color: "#C9967A",
  button_bg_color: "#6B1E2A",
  button_text_color: "#FBF6F0",
  button_hover_bg_color: "#551722",
  button_active_bg_color: "#43121B",
  success_color: "#2F7A54",
  warning_color: "#B4761F",
  error_color: "#A83232",
};

export const COLOR_FIELDS: {
  key: keyof BrandingColors;
  label: string;
  hint: string;
}[] = [
  { key: "primary_color", label: "Primary", hint: "Headline accents, links and key surfaces." },
  { key: "secondary_color", label: "Secondary", hint: "Rose-gold accents and highlights." },
  { key: "button_bg_color", label: "Button background", hint: "Default state of primary buttons." },
  { key: "button_text_color", label: "Button text", hint: "Label colour inside primary buttons." },
  { key: "button_hover_bg_color", label: "Button hover", hint: "Background on pointer hover." },
  { key: "button_active_bg_color", label: "Button pressed", hint: "Background while pressed." },
  { key: "success_color", label: "Success", hint: "Approved, verified and confirmed states." },
  { key: "warning_color", label: "Warning", hint: "Pending and needs-attention states." },
  { key: "error_color", label: "Error", hint: "Destructive actions and validation errors." },
];

const VAR_MAP: Record<keyof BrandingColors, string[]> = {
  primary_color: ["--primary", "--sidebar-primary", "--accent-foreground"],
  secondary_color: ["--secondary", "--ring", "--sidebar-ring"],
  button_bg_color: ["--button-bg"],
  button_text_color: ["--primary-foreground", "--sidebar-primary-foreground", "--button-fg"],
  button_hover_bg_color: ["--primary-hover"],
  button_active_bg_color: ["--primary-active"],
  success_color: ["--success"],
  warning_color: ["--warning"],
  error_color: ["--destructive"],
};

function resolveTarget(root?: HTMLElement | null) {
  if (root) return root;
  return typeof document !== "undefined" ? document.documentElement : null;
}

/**
 * Applies branding colours (hex or any valid CSS colour) to `root`, defaulting
 * to the document root. Pass an element to scope a live preview.
 */
export function applyBranding(colors: Partial<BrandingColors>, root?: HTMLElement | null) {
  const target = resolveTarget(root);
  if (!target) return;

  for (const [key, cssVars] of Object.entries(VAR_MAP) as [keyof BrandingColors, string[]][]) {
    const value = colors[key];
    if (!value) continue;
    for (const cssVar of cssVars) target.style.setProperty(cssVar, value);
  }
}

/** Clears runtime overrides and falls back to the default Nikkah+ theme. */
export function resetBranding(root?: HTMLElement | null) {
  const target = resolveTarget(root);
  if (!target) return;
  for (const cssVars of Object.values(VAR_MAP)) {
    for (const cssVar of cssVars) target.style.removeProperty(cssVar);
  }
}

/** Toggles the class-based dark theme on <html>. */
export function applyDarkMode(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", enabled);
}

export function brandingFrom(settings: Partial<BrandingColors> | null | undefined): BrandingColors {
  return {
    ...DEFAULT_BRANDING,
    ...Object.fromEntries(
      Object.entries(settings ?? {}).filter(([, v]) => typeof v === "string" && v),
    ),
  } as BrandingColors;
}

/** Reads the single settings row. Readable by signed-out visitors too. */
export async function fetchPlatformSettings(): Promise<PlatformSettings | null> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) return null;
  return (data as unknown as PlatformSettings) ?? null;
}

/**
 * `logo_url` holds either an absolute URL or a path inside the private
 * "branding" storage bucket. Storage paths are resolved to a signed URL.
 */
export async function resolveLogoUrl(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  if (/^(https?:)?\/\//.test(logoUrl) || logoUrl.startsWith("data:")) return logoUrl;
  const { data, error } = await supabase.storage
    .from("branding")
    .createSignedUrl(logoUrl, 60 * 60 * 24 * 7);
  if (error) return null;
  return data?.signedUrl ?? null;
}
