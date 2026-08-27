import { cn } from "@/lib/utils";

export function MasjidLogo({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      {/* Mosque Dome & Minaret SVG Icon */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-2 text-white shadow-md shadow-[#2563EB]/25 ring-2 ring-[#DBEAFE]">
        <svg viewBox="0 0 48 48" fill="none" className="size-full">
          {/* Crescent Star Top */}
          <path
            d="M24 4 C24 4 24 7 24 7 M22 5.5 H26 M24 2.5 A 1.5 1.5 0 1 0 24 5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Dome */}
          <path
            d="M24 10 C17 15 15 23 15 30 H33 C33 23 31 15 24 10 Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Left Minaret */}
          <path d="M8 22 L11 20 L14 22 V38 H8 V22 Z" stroke="currentColor" strokeWidth="1.5" />
          {/* Right Minaret */}
          <path d="M34 22 L37 20 L40 22 V38 H34 V22 Z" stroke="currentColor" strokeWidth="1.5" />
          {/* Base Arch */}
          <path
            d="M5 38 H43 M21 38 V30 C21 28.3 22.3 27 24 27 C25.7 27 27 28.3 27 30 V38"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span className="font-serif text-xl font-bold tracking-tight text-[#0F172A]">
          My Local Masjid
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
          Community Portal
        </span>
      </div>
    </div>
  );
}
