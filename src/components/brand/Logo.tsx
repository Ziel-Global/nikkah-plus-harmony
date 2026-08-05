import { cn } from "@/lib/utils";
import { useBranding } from "@/components/branding/BrandingProvider";

/**
 * Brand lockup. When a platform admin uploads a logo in
 * Settings -> Branding, it is used here in place of the placeholder mark.
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
        data-logo-placeholder="monogram"
        aria-label={platformName}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-secondary bg-primary font-display text-lg font-bold text-primary-foreground",
          className,
        )}
      >
        N+
      </span>
    );
  }

  return (
    <span
      data-logo-placeholder={logoUrl ? undefined : "lockup"}
      aria-label={platformName}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
      ) : (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-secondary bg-primary font-display text-base font-bold text-primary-foreground">
          N+
        </span>
      )}
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold text-primary">{platformName}</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Faith. Family. Future.
        </span>
      </span>
    </span>
  );
}
