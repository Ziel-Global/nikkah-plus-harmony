/**
 * Site configuration helper.
 * Provides the official website URL fallback and dynamic origin helper.
 */
export const SITE_URL = "https://nikkah-plus-harmony.vercel.app";

export function getSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_URL;
}
