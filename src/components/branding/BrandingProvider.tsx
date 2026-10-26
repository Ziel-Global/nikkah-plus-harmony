import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
export const MY_BRANDING_KEY = ["my-branding"] as const;

type BrandingContextValue = {
  settings: PlatformSettings | null;
  colors: BrandingColors;
  platformName: string;
  logoUrl: string | null;
  refresh: () => void;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

type MyBrandingRow = {
  platform_name: string | null;
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
  source: string;
};

async function fetchSessionBranding(): Promise<PlatformSettings | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return fetchPlatformSettings();
  }

  const { data, error } = await supabase.rpc("get_my_branding" as never);
  if (error || !data) {
    return fetchPlatformSettings();
  }

  const row = (Array.isArray(data) ? data[0] : data) as MyBrandingRow | undefined;
  if (!row) return fetchPlatformSettings();

  return {
    id: 0,
    platform_name: row.platform_name || "Marriage Database",
    logo_url: row.logo_url,
    primary_color: row.primary_color,
    secondary_color: row.secondary_color,
    button_bg_color: row.button_bg_color,
    button_text_color: row.button_text_color,
    button_hover_bg_color: row.button_hover_bg_color,
    button_active_bg_color: row.button_active_bg_color,
    success_color: row.success_color,
    warning_color: row.warning_color,
    error_color: row.error_color,
    dark_mode_default: row.dark_mode_default,
    inactivity_threshold_days: 30,
    updated_at: null,
    updated_by: null,
  };
}

/**
 * Public pages use platform_settings. Signed-in users use get_my_branding()
 * (circle branding when available, otherwise platform defaults).
 */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["auth-session-for-branding"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user?.id ?? null;
    },
    staleTime: 30_000,
  });

  const { data: settings } = useQuery({
    queryKey: [...MY_BRANDING_KEY, session],
    queryFn: fetchSessionBranding,
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: MY_BRANDING_KEY });
      void queryClient.invalidateQueries({ queryKey: ["auth-session-for-branding"] });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const platformName = useMemo(() => {
    const raw = settings?.platform_name?.trim();
    if (!raw || raw.toLowerCase().includes("nikkah")) {
      return "Marriage Database";
    }
    return raw;
  }, [settings?.platform_name]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      settings: settings ?? null,
      colors,
      platformName,
      logoUrl: logoUrl ?? null,
      refresh: () => {
        void queryClient.invalidateQueries({ queryKey: MY_BRANDING_KEY });
        void queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_KEY });
      },
    }),
    [settings, colors, platformName, logoUrl, queryClient],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
  return (
    useContext(BrandingContext) ?? {
      settings: null,
      colors: brandingFrom(null),
      platformName: "Marriage Database",
      logoUrl: null,
      refresh: () => {},
    }
  );
}
