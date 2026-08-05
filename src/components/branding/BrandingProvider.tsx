import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyBranding,
  applyDarkMode,
  brandingFrom,
  fetchPlatformSettings,
  resolveLogoUrl,
  type BrandingColors,
  type PlatformSettings,
} from "@/lib/branding";

export const PLATFORM_SETTINGS_KEY = ["platform-settings"] as const;

type BrandingContextValue = {
  settings: PlatformSettings | null;
  colors: BrandingColors;
  platformName: string;
  logoUrl: string | null;
  refresh: () => void;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

/**
 * Loads the single `platform_settings` row once and pushes its colours onto
 * the document root, so every screen — public and signed-in — is themed by
 * whatever the platform admin saved in Settings -> Branding.
 */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: PLATFORM_SETTINGS_KEY,
    queryFn: fetchPlatformSettings,
    staleTime: 5 * 60 * 1000,
  });

  const { data: logoUrl } = useQuery({
    queryKey: ["platform-logo", settings?.logo_url ?? null],
    queryFn: () => resolveLogoUrl(settings?.logo_url ?? null),
    enabled: Boolean(settings?.logo_url),
  });

  const colors = useMemo(() => brandingFrom(settings), [settings]);

  useEffect(() => {
    applyBranding(colors);
  }, [colors]);

  useEffect(() => {
    if (settings) applyDarkMode(Boolean(settings.dark_mode_default));
  }, [settings?.dark_mode_default, settings]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      settings: settings ?? null,
      colors,
      platformName: settings?.platform_name?.trim() || "Nikkah+",
      logoUrl: logoUrl ?? null,
      refresh: () => void queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_KEY }),
    }),
    [settings, colors, logoUrl, queryClient],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
  return (
    useContext(BrandingContext) ?? {
      settings: null,
      colors: brandingFrom(null),
      platformName: "Nikkah+",
      logoUrl: null,
      refresh: () => {},
    }
  );
}
