import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-muted">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Logo variant="lockup" />
            <p className="mt-3 text-sm text-muted-foreground">
              A community-based Muslim marriage platform, supported by your local mosque.
            </p>
          </div>
          {/* Footer link groups are added once pages exist. */}
          <nav aria-label="Footer" className="flex flex-col gap-2 text-sm" />
        </div>
        <div className="divider-gold my-8" />
        <p className="text-caption">© {year} Nikkah+. All rights reserved.</p>
      </div>
    </footer>
  );
}
