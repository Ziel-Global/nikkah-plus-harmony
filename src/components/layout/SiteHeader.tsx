import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";

export function SiteHeader({ hideAuthButtons }: { hideAuthButtons?: boolean }) {
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
            ? "max-w-6xl rounded-[28px] border border-[#E2E8F0] bg-white/95 px-4 py-2.5 shadow-xl shadow-[#2563EB]/5 backdrop-blur sm:px-6"
            : "max-w-6xl rounded-none border border-transparent bg-transparent px-4 py-4 shadow-none sm:px-6",
        )}
      >
        <Link
          to="/marriage"
          className="flex min-w-0 items-center"
          aria-label="Marriage Database home"
        >
          <Logo variant="lockup" className="hidden sm:inline-flex" />
          <Logo variant="monogram" className="sm:hidden" />
        </Link>

        {/* Marriage Database Complete Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden items-center gap-1 xl:flex">
          <a
            href="#about"
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            About Us
          </a>
          <a
            href="#what-we-do"
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            What We Do
          </a>
          <a
            href="#how-it-works"
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            How It Works
          </a>
          <a
            href="#for-mosques"
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            For Mosques
          </a>
          <a
            href="#trust"
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            Trust & Safety
          </a>
          <a
            href="#faq"
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            FAQ
          </a>
        </nav>

        {!hideAuthButtons && (
          <div className="flex shrink-0 items-center gap-2">
            {signedIn ? (
              <Button
                asChild
                className="hidden min-h-11 rounded-xl bg-[#2563EB] font-bold text-white shadow-md hover:bg-[#1D4ED8] sm:inline-flex"
              >
                <Link to="/onboarding">My account</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden min-h-11 rounded-xl font-bold text-[#0F172A] hover:bg-[#DBEAFE]/60 hover:text-[#2563EB] sm:inline-flex"
                >
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button
                  asChild
                  className="hidden min-h-11 rounded-xl bg-[#2563EB] font-bold text-white shadow-md shadow-[#2563EB]/25 hover:bg-[#1D4ED8] sm:inline-flex"
                >
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#2563EB] transition-colors hover:bg-[#DBEAFE] xl:hidden"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {menuOpen && (
        <div className="mx-auto mt-2 max-w-5xl px-3 sm:px-0 xl:hidden">
          <nav
            aria-label="Mobile Navigation"
            className="flex flex-col gap-1 p-4 shadow-xl shadow-[#2563EB]/10 rounded-2xl border border-[#E2E8F0] bg-white"
          >
            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#DBEAFE] hover:text-[#2563EB]"
            >
              About Us
            </a>
            <a
              href="#what-we-do"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#DBEAFE] hover:text-[#2563EB]"
            >
              What We Do
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#DBEAFE] hover:text-[#2563EB]"
            >
              How It Works
            </a>
            <a
              href="#for-mosques"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#DBEAFE] hover:text-[#2563EB]"
            >
              For Mosques
            </a>
            <a
              href="#trust"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#DBEAFE] hover:text-[#2563EB]"
            >
              Trust & Safety
            </a>
            <a
              href="#faq"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#DBEAFE] hover:text-[#2563EB]"
            >
              FAQ
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
