import { useEffect, useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ChevronDown, HeartHandshake, BookOpen, ExternalLink } from "lucide-react";
import { MasjidLogo } from "@/components/brand/MasjidLogo";
import { cn } from "@/lib/utils";

export const MASAIL_URL = "https://masail.lovable.app";

export function MasjidHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProjectsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
            ? "max-w-5xl rounded-full border border-[#E2E8F0] bg-white/95 px-5 py-2.5 shadow-xl shadow-[#2563EB]/5 backdrop-blur-md"
            : "max-w-6xl rounded-none border border-transparent bg-transparent px-4 py-4 shadow-none sm:px-6",
        )}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex min-w-0 items-center focus:outline-none"
          aria-label="My Local Masjid home"
        >
          <MasjidLogo />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden items-center gap-1 md:flex">
          <a
            href="#about"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            About Us
          </a>

          <a
            href="#what-we-do"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            What We Do
          </a>

          {/* Projects Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProjectsOpen((v) => !v)}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none",
                projectsOpen
                  ? "bg-[#2563EB] text-white"
                  : "text-[#0F172A] hover:bg-[#DBEAFE] hover:text-[#2563EB]",
              )}
            >
              <span>Projects</span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  projectsOpen
                    ? "rotate-180 text-white"
                    : "text-[#64748B] group-hover:text-[#2563EB]",
                )}
              />
            </button>

            {/* Dropdown Menu Overlay */}
            {projectsOpen && (
              <div className="absolute left-0 mt-3 w-80 animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-2xl shadow-[#2563EB]/15 z-50">
                <Link
                  to="/marriage"
                  onClick={() => setProjectsOpen(false)}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[#DBEAFE]/60"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
                    <HeartHandshake className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A]">Marriage Database</div>
                    <p className="mt-0.5 text-xs leading-normal text-[#64748B]">
                      Community-based matrimonial matching verified by your local imam.
                    </p>
                  </div>
                </Link>

                <a
                  href={MASAIL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setProjectsOpen(false)}
                  className="mt-1 flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[#DBEAFE]/60"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6] text-white shadow-sm">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                      <span>Masail Portal</span>
                      <ExternalLink className="size-3.5 text-[#64748B]" />
                    </div>
                    <p className="mt-0.5 text-xs leading-normal text-[#64748B]">
                      Direct Islamic Q&A portal connecting congregants with verified scholars.
                    </p>
                  </div>
                </a>
              </div>
            )}
          </div>

          <a
            href="#services"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            What We Provide
          </a>

          <a
            href="#faq"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE] hover:text-[#2563EB]"
          >
            FAQ
          </a>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#2563EB] transition-colors hover:bg-[#DBEAFE] md:hidden"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="mx-auto mt-2 max-w-5xl px-3 sm:px-0 md:hidden">
          <nav
            aria-label="Mobile Navigation"
            className="flex flex-col gap-1.5 p-4 shadow-2xl shadow-[#2563EB]/15 rounded-2xl border border-[#E2E8F0] bg-white"
          >
            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#DBEAFE] hover:text-[#2563EB]"
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

            {/* Mobile Projects Menu */}
            <div className="my-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <p className="px-1 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Active Projects
              </p>
              <div className="mt-2 space-y-2">
                <Link
                  to="/marriage"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg bg-white p-2.5 text-sm font-bold text-[#0F172A] border border-[#E2E8F0] hover:border-[#2563EB]"
                >
                  <span className="flex items-center gap-2">
                    <HeartHandshake className="size-4 text-[#2563EB]" />
                    Marriage Database
                  </span>
                  <span className="text-xs text-[#2563EB]">Visit →</span>
                </Link>

                <a
                  href={MASAIL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg bg-white p-2.5 text-sm font-bold text-[#0F172A] border border-[#E2E8F0] hover:border-[#3B82F6]"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="size-4 text-[#3B82F6]" />
                    Masail Portal
                  </span>
                  <ExternalLink className="size-3.5 text-[#64748B]" />
                </a>
              </div>
            </div>

            <a
              href="#services"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#DBEAFE] hover:text-[#2563EB]"
            >
              What We Provide
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
