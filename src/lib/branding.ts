/**
 * Runtime branding overrides.
 *
 * The design system lives entirely in CSS variables (src/styles.css), so a
 * future "Settings -> Branding" admin screen can read a row from the
 * `platform_settings` table and call `applyBranding()` to re-theme the app at
 * runtime without touching component code.
 *
 * `platform_settings` stores hex strings; we convert them to the same
 * variables the theme is built on.
 */

export type BrandingInput = {
  primary_color?: string | null;
  secondary_color?: string | null;
  button_bg_color?: string | null;
  button_text_color?: string | null;
  button_hover_bg_color?: string | null;
  button_active_bg_color?: string | null;
  success_color?: string | null;
  warning_color?: string | null;
  error_color?: string | null;
};

const VAR_MAP: Record<keyof BrandingInput, string> = {
  primary_color: "--primary",
  secondary_color: "--secondary",
  button_bg_color: "--primary",
  button_text_color: "--primary-foreground",
  button_hover_bg_color: "--primary-hover",
  button_active_bg_color: "--primary-active",
  success_color: "--success",
  warning_color: "--warning",
  error_color: "--destructive",
};

/** Applies branding values (hex or any valid CSS color) to the document root. */
export function applyBranding(settings: BrandingInput, root?: HTMLElement) {
  const target = root ?? (typeof document !== "undefined" ? document.documentElement : null);
  if (!target) return;

  for (const [key, cssVar] of Object.entries(VAR_MAP) as [keyof BrandingInput, string][]) {
    const value = settings[key];
    if (value) target.style.setProperty(cssVar, value);
  }
}

/** Clears runtime overrides and falls back to the default Nikkah+ theme. */
export function resetBranding(root?: HTMLElement) {
  const target = root ?? (typeof document !== "undefined" ? document.documentElement : null);
  if (!target) return;
  for (const cssVar of new Set(Object.values(VAR_MAP))) {
    target.style.removeProperty(cssVar);
  }
}
