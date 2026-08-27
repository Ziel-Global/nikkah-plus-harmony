import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, HeartHandshake, BookOpen, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const MASAIL_URL = "https://masail.lovable.app";

export function ProjectsDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="group inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#DBEAFE]/60 hover:text-[#2563EB] focus:outline-none">
        <span>Projects</span>
        <ChevronDown
          className={`size-4 text-[#64748B] transition-transform duration-200 group-hover:text-[#2563EB] ${
            open ? "rotate-180 text-[#2563EB]" : ""
          }`}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-80 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-xl shadow-[#2563EB]/10 backdrop-blur-md"
      >
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-[#DBEAFE]/50">
          <Link to="/marriage" className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <HeartHandshake className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                Marriage Database
              </div>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Community-based halal matrimonial introductions verified by your local imam.
              </p>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-[#DBEAFE]/50">
          <a
            href={MASAIL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3"
          >
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
              <BookOpen className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                Masail (Islamic Q&A)
                <ExternalLink className="size-3 text-[#64748B]" />
              </div>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Direct Q&A platform connecting congregants with trusted local imams and scholars.
              </p>
            </div>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
