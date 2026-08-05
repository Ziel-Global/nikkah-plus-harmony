import { Logo } from "@/components/brand/Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo variant="lockup" className="hidden sm:inline-flex" />
        <Logo variant="monogram" className="sm:hidden" />
        {/* Navigation and account controls are added once pages exist. */}
        <nav aria-label="Main" className="flex items-center gap-2" />
      </div>
    </header>
  );
}
