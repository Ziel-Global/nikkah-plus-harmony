import { cn } from "@/lib/utils";

/**
 * LOGO PLACEHOLDER — Nikkah+
 *
 * Drop the real artwork in `src/assets/` and swap the markup below:
 *   import logoLockup from "@/assets/nikkah-plus-lockup.svg";   // horizontal
 *   import logoMonogram from "@/assets/nikkah-plus-monogram.svg"; // compact
 *
 * Two variants are expected:
 *  - "lockup"   : horizontal wordmark for header / light backgrounds
 *  - "monogram" : mark only, for compact & mobile states
 */
export function Logo({
  variant = "lockup",
  className,
}: {
  variant?: "lockup" | "monogram";
  className?: string;
}) {
  if (variant === "monogram") {
    return (
      <span
        data-logo-placeholder="monogram"
        aria-label="Nikkah+"
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
      data-logo-placeholder="lockup"
      aria-label="Nikkah+"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-secondary bg-primary font-display text-base font-bold text-primary-foreground">
        N+
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold text-primary">Nikkah+</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Faith. Family. Future.
        </span>
      </span>
    </span>
  );
}
