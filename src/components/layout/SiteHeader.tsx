import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "How it works", href: "#how-it-works" },
  { label: "For mosques", href: "#for-mosques" },
  { label: "FAQ", href: "#faq" },
  { label: "My Local Masjid", to: "/my-local-masjid" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { session } = useSession();
  const signedIn = Boolean(session);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out",
        scrolled ? "px-3 pt-3 sm:px-6 sm:pt-4" : "px-0 pt-0",
      )}
    >
      <header
        className={cn(
          "mx-auto flex w-full items-center justify-between gap-3 transition-all duration-300 ease-out",
          scrolled
            ? "max-w-5xl rounded-[28px] border border-border bg-background/95 px-4 py-2.5 shadow-[var(--shadow-elevated)] backdrop-blur sm:px-6"
            : "max-w-6xl rounded-none border border-transparent bg-transparent px-4 py-4 shadow-none sm:px-6",
        )}
      >
        <a href="#top" className="flex min-w-0 items-center" aria-label="Nikkah+ home">
          <Logo variant="lockup" className="hidden sm:inline-flex" />
          <Logo variant="monogram" className="sm:hidden" />
        </a>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) =>
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                className="rounded-md px-3 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-primary"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-primary"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {signedIn ? (
            <Button asChild className="hidden min-h-11 md:inline-flex">
              <Link to="/onboarding">My account</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden min-h-11 md:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild className="hidden min-h-11 md:inline-flex">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-primary transition-colors hover:bg-accent md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mx-auto mt-2 max-w-5xl px-3 sm:px-0 md:hidden">
          <nav
            aria-label="Mobile"
            className="surface-card animate-fade-in flex flex-col gap-1 p-3 shadow-[var(--shadow-elevated)]"
          >
            {NAV_LINKS.map((link) =>
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-primary"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-primary"
                >
                  {link.label}
                </a>
              ),
            )}
            {signedIn ? (
              <Button asChild className="mt-2 min-h-11 w-full">
                <Link to="/onboarding" onClick={() => setMenuOpen(false)}>
                  My account
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="secondary" className="mt-2 min-h-11 w-full">
                  <Link to="/auth" onClick={() => setMenuOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild className="mt-2 min-h-11 w-full">
                  <Link to="/register" onClick={() => setMenuOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
