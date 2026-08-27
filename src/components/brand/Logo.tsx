import { cn } from "@/lib/utils";
import { useBranding } from "@/components/branding/BrandingProvider";

/**
 * Marriage Database Brand Lockup with elegant Masjid SVG icon.
 */
export function Logo({
  variant = "lockup",
  className,
}: {
  variant?: "lockup" | "monogram";
  className?: string;
}) {
  const { platformName, logoUrl } = useBranding();

  if (variant === "monogram") {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={platformName}
          className={cn("h-10 w-10 rounded-lg object-contain", className)}
        />
      );
    }
    return (
      <span
        aria-label={platformName}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/25 ring-2 ring-[#DBEAFE]",
          className,
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className="size-6 text-white">
          {/* Mosque Dome & Minaret SVG */}
          <path
            d="M16 4 C16 4 16 6 16 6 M14.5 5 H17.5 M16 3 A 1 1 0 1 0 16 5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M16 7 C11.5 10.5 10 16 10 21 H22 C22 16 20.5 10.5 16 7 Z"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M5 15 L7 13.5 L9 15 V26 H5 V15 Z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M23 15 L25 13.5 L27 15 V26 H23 V15 Z" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M3 26 H29 M14 26 V20 C14 18.9 14.9 18 16 18 C17.1 18 18 18.9 18 20 V26"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      aria-label={platformName}
      className={cn("inline-flex items-center gap-3 select-none", className)}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
      ) : (
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/25 ring-2 ring-[#DBEAFE]">
          <svg viewBox="0 0 32 32" fill="none" className="size-6 text-white">
            {/* Mosque Dome & Minaret SVG */}
            <path
              d="M16 4 C16 4 16 6 16 6 M14.5 5 H17.5 M16 3 A 1 1 0 1 0 16 5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M16 7 C11.5 10.5 10 16 10 21 H22 C22 16 20.5 10.5 16 7 Z"
              fill="currentColor"
              fillOpacity="0.3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M5 15 L7 13.5 L9 15 V26 H5 V15 Z" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M23 15 L25 13.5 L27 15 V26 H23 V15 Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M3 26 H29 M14 26 V20 C14 18.9 14.9 18 16 18 C17.1 18 18 18.9 18 20 V26"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      <span className="flex flex-col leading-none">
        <span className="font-serif text-xl font-bold tracking-tight text-[#0F172A]">
          {platformName}
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
          Faith. Family. Future.
        </span>
      </span>
    </span>
  );
}
