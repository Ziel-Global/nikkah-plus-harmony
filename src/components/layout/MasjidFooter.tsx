import { Link } from "@tanstack/react-router";
import { MasjidLogo } from "@/components/brand/MasjidLogo";
import { MASAIL_URL } from "@/components/layout/MasjidHeader";
import { HeartHandshake, BookOpen, ExternalLink } from "lucide-react";

export function MasjidFooter() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white text-[#0F172A]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <MasjidLogo />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#64748B]">
              My Local Masjid brings essential Islamic community initiatives under one modern
              digital roof — connecting congregants with local mosques for imam-verified matrimony
              and authentic scholar guidance.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm text-[#0F172A] uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-[#64748B]">
              <li>
                <a href="#about" className="transition-colors hover:text-[#2563EB]">
                  About Us
                </a>
              </li>
              <li>
                <a href="#what-we-do" className="transition-colors hover:text-[#2563EB]">
                  What We Do
                </a>
              </li>
              <li>
                <a href="#services" className="transition-colors hover:text-[#2563EB]">
                  What We Provide
                </a>
              </li>
              <li>
                <a href="#faq" className="transition-colors hover:text-[#2563EB]">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Projects */}
          <div>
            <h4 className="font-bold text-sm text-[#0F172A] uppercase tracking-wider">
              Our Projects
            </h4>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-[#0F172A]">
              <li>
                <Link
                  to="/marriage"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#DBEAFE]/50 px-3 py-1.5 text-xs text-[#2563EB] font-bold hover:bg-[#2563EB] hover:text-white transition-colors"
                >
                  <HeartHandshake className="size-3.5" />
                  Marriage Database
                </Link>
              </li>
              <li>
                <a
                  href={MASAIL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#DBEAFE]/50 px-3 py-1.5 text-xs text-[#3B82F6] font-bold hover:bg-[#3B82F6] hover:text-white transition-colors"
                >
                  <BookOpen className="size-3.5" />
                  Masail Portal
                  <ExternalLink className="size-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#E2E8F0] pt-8 text-center text-xs text-[#64748B] sm:flex-row">
          <p>© {new Date().getFullYear()} My Local Masjid. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-[#2563EB]">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#2563EB]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
