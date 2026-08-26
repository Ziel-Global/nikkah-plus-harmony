import { createFileRoute } from "@tanstack/react-router";

// ============================================================================
// PROJECT URL PLACEHOLDERS
// Replace these URL strings with your desired destinations.
// ============================================================================
export const MARRIAGE_DATABASE_URL = "/"; // e.g. "/" or "https://marriage.mylocalmasjid.com"
export const MASAIL_URL = "https://masail.lovable.app";

export const Route = createFileRoute("/my-local-masjid")({
  head: () => ({
    meta: [
      { title: "My Local Masjid — Serving the Community" },
      {
        name: "description",
        content:
          "Serving the community. Strengthening imaan. Building together. Explore Marriage Database and Masail.",
      },
      { property: "og:title", content: "My Local Masjid" },
      {
        property: "og:description",
        content: "Serving the community. Strengthening imaan. Building together.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MyLocalMasjidPage,
});
export function MyLocalMasjidPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#FBF6F0] font-sans text-[#2B1B17] selection:bg-[#6B1E2A] selection:text-white flex flex-col justify-between">
      {/* Background Decorative Pattern Overlays */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[radial-gradient(#6B1E2A_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Left Ornamental Corner Pattern */}
      <div className="pointer-events-none absolute top-0 left-0 hidden md:block w-56 h-56 opacity-20">
        <svg viewBox="0 0 300 300" fill="none" className="w-full h-full text-[#6B1E2A]">
          <path
            d="M0,0 L300,0 C240,40 200,100 200,180 C200,240 160,280 100,300 L0,300 Z"
            fill="currentColor"
            fillOpacity="0.04"
          />
          <pattern
            id="islamic-star-tl"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20,0 L25,15 L40,20 L25,25 L20,40 L15,25 L0,20 L15,15 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
          </pattern>
          <rect width="300" height="300" fill="url(#islamic-star-tl)" />
        </svg>
      </div>

      {/* Top Right Ornamental Corner Pattern */}
      <div className="pointer-events-none absolute top-0 right-0 hidden md:block w-56 h-56 opacity-20">
        <svg viewBox="0 0 300 300" fill="none" className="w-full h-full text-[#6B1E2A]">
          <pattern
            id="islamic-star-tr"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20,0 L25,15 L40,20 L25,25 L20,40 L15,25 L0,20 L15,15 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
          </pattern>
          <rect width="300" height="300" fill="url(#islamic-star-tr)" />
        </svg>
      </div>

      {/* Mosque Silhouette Watermark in Center Background */}
      <div className="pointer-events-none absolute inset-x-0 top-8 flex justify-center opacity-[0.07]">
        <svg
          viewBox="0 0 800 400"
          className="w-full max-w-4xl h-auto text-[#6B1E2A]"
          fill="currentColor"
        >
          <path
            d="M400,60 Q430,120 400,170 Q370,120 400,60 Z M400,50 L400,60 M395,50 L405,50 M400,42 L400,46 M396,44 L404,44"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path d="M250,220 C250,140 330,140 330,220 Z M470,220 C470,140 550,140 550,220 Z" />
          <path d="M350,220 C350,110 450,110 450,220 Z" />
          <rect x="220" y="160" width="20" height="140" rx="4" />
          <rect x="560" y="160" width="20" height="140" rx="4" />
        </svg>
      </div>

      {/* Main Full-Height Container (No Overflow) */}
      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        {/* Header Section */}
        <header className="relative w-full text-center shrink-0">
          {/* Mosque Icon */}
          <div className="mx-auto mb-1 flex size-12 items-center justify-center sm:size-14">
            <svg viewBox="0 0 64 64" fill="none" className="h-full w-full text-[#6B1E2A]">
              <path
                d="M32 10 C32 10 32 6 32 6 M30 7 H34 M32 4 C30.8 4 30 4.8 30 6 C30 7.2 30.8 8 32 8 C33.2 8 34 7.2 34 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M32 12 C24 18 22 28 22 36 H42 C42 28 40 18 32 12 Z"
                stroke="currentColor"
                strokeWidth="1.75"
                fill="#6B1E2A"
                fillOpacity="0.06"
              />
              <path
                d="M14 26 L18 24 L22 26 V44 H14 V26 Z M42 26 L46 24 L50 26 V44 H42 V26 Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M18 18 V24 M46 18 V24" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 44 H54 M28 44 V34 C28 31.8 29.8 30 32 30 C34.2 30 36 31.8 36 34 V44"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Top Divider */}
          <div className="mx-auto mb-1.5 flex items-center justify-center gap-3 opacity-60">
            <div className="h-px w-12 bg-[#C9967A] sm:w-24" />
            <span className="text-[10px] text-[#C9967A]">◆</span>
            <div className="h-px w-12 bg-[#C9967A] sm:w-24" />
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#2B1B17] sm:text-4xl md:text-5xl">
            My Local Masjid
          </h1>

          {/* Subtitle Divider & Text */}
          <div className="mt-1.5 flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-2 opacity-60">
              <div className="h-px w-10 bg-[#C9967A] sm:w-20" />
              <span className="text-[9px] text-[#C9967A]">◆</span>
              <div className="h-px w-10 bg-[#C9967A] sm:w-20" />
            </div>
            <p className="text-xs font-normal text-[#5A4B44] sm:text-sm md:text-base">
              Serving the community. Strengthening imaan. Building together.
            </p>
          </div>
        </header>

        {/* Minimal Cards Container */}
        <main className="w-full flex-1 flex items-center justify-center py-2 sm:py-4">
          <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 max-w-4xl">
            {/* CARD 1: MARRIAGE DATABASE */}
            <div className="group relative flex flex-col items-center justify-between rounded-2xl border border-[#E4C5B5] bg-white/95 p-5 text-center shadow-md shadow-[#6B1E2A]/5 backdrop-blur-sm transition-all duration-300 hover:border-[#C9967A] hover:shadow-lg sm:p-6">
              <div className="relative z-10 flex w-full flex-col items-center">
                {/* Circular Icon Badge */}
                <div className="mb-3 flex size-20 items-center justify-center rounded-full bg-[#6B1E2A] p-3 text-[#FBF6F0] shadow-sm ring-3 ring-[#C9967A]/30 transition-transform duration-300 group-hover:scale-105 sm:size-22">
                  <svg viewBox="0 0 64 64" fill="none" className="h-11 w-11 text-[#F5E6D8]">
                    <path
                      d="M16 42 C16 42 22 48 32 48 C42 48 48 42 48 42 M14 34 L22 40 M50 34 L42 40"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 46 L14 36 C12 33 13 29 16 28 C19 27 22 29 23 32 M44 46 L50 36 C52 33 51 29 48 28 C45 27 42 29 41 32"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M32 30 C32 30 25 24 25 19 C25 15.5 27.5 13 31 13 C32 13 32 14 32 14 C32 14 32 13 33 13 C36.5 13 39 15.5 39 19 C39 24 32 30 32 30 Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="currentColor"
                      fillOpacity="0.15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Card Title */}
                <h2 className="font-serif text-xl font-bold tracking-tight text-[#2B1B17] sm:text-2xl">
                  Marriage Database
                </h2>

                {/* Tagline */}
                <p className="mt-1 text-sm font-medium text-[#C9967A] sm:text-base">
                  Find. Connect. Build.
                </p>

                {/* Accent Line */}
                <div className="my-2 flex items-center justify-center gap-1.5 opacity-50">
                  <div className="h-px w-6 bg-[#C9967A]" />
                  <span className="text-[8px] text-[#C9967A]">◆</span>
                  <div className="h-px w-6 bg-[#C9967A]" />
                </div>

                {/* Description */}
                <p className="mt-1 max-w-xs text-xs leading-normal text-[#5A4B44] sm:text-sm">
                  A masjid-based platform helping Muslims find compatible marriage partners through
                  the guidance and mediation of their local Imam.
                </p>
              </div>

              {/* Minimal Button */}
              <div className="relative z-10 mt-5 w-full">
                <a
                  href={MARRIAGE_DATABASE_URL}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6B1E2A] px-4 py-2.5 text-center text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#521620] hover:shadow active:scale-[0.99] sm:text-sm"
                >
                  <span>Explore Marriage Database</span>
                  <span className="text-base transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </div>
            </div>

            {/* CARD 2: MASAIL */}
            <div className="group relative flex flex-col items-center justify-between rounded-2xl border border-[#E4C5B5] bg-white/95 p-5 text-center shadow-md shadow-[#6B1E2A]/5 backdrop-blur-sm transition-all duration-300 hover:border-[#C9967A] hover:shadow-lg sm:p-6">
              <div className="relative z-10 flex w-full flex-col items-center">
                {/* Circular Icon Badge */}
                <div className="mb-3 flex size-20 items-center justify-center rounded-full bg-[#6B1E2A] p-3 text-[#FBF6F0] shadow-sm ring-3 ring-[#C9967A]/30 transition-transform duration-300 group-hover:scale-105 sm:size-22">
                  <svg viewBox="0 0 64 64" fill="none" className="h-11 w-11 text-[#F5E6D8]">
                    <path
                      d="M16 28 C22 25 30 27 32 30 C34 27 42 25 48 28 V46 C42 43 34 45 32 48 C30 45 22 43 16 46 V28 Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="currentColor"
                      fillOpacity="0.1"
                    />
                    <path
                      d="M32 30 V48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M32 14 C32 14 32 11 32 11 M30 12 H34 M32 9 A 2 2 0 1 0 32 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M32 14 Q28 19 28 24 H36 Q36 19 32 14 Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="currentColor"
                      fillOpacity="0.2"
                    />
                  </svg>
                </div>

                {/* Card Title */}
                <h2 className="font-serif text-xl font-bold tracking-tight text-[#2B1B17] sm:text-2xl">
                  Masail
                </h2>

                {/* Tagline */}
                <p className="mt-1 text-sm font-medium text-[#C9967A] sm:text-base">
                  Ask. Learn. Grow.
                </p>

                {/* Accent Line */}
                <div className="my-2 flex items-center justify-center gap-1.5 opacity-50">
                  <div className="h-px w-6 bg-[#C9967A]" />
                  <span className="text-[8px] text-[#C9967A]">◆</span>
                  <div className="h-px w-6 bg-[#C9967A]" />
                </div>

                {/* Description */}
                <p className="mt-1 max-w-xs text-xs leading-normal text-[#5A4B44] sm:text-sm">
                  A platform that connects Muslims with trusted scholars from their local masjid for
                  authentic answers to life's questions.
                </p>
              </div>

              {/* Minimal Button */}
              <div className="relative z-10 mt-5 w-full">
                <a
                  href={MASAIL_URL}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6B1E2A] px-4 py-2.5 text-center text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#521620] hover:shadow active:scale-[0.99] sm:text-sm"
                >
                  <span>Explore Masail</span>
                  <span className="text-base transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Motif */}
        <footer className="relative flex w-full flex-col items-center justify-center text-center opacity-70 shrink-0 pb-1">
          <div className="flex w-full items-center justify-center gap-3">
            <div className="h-px w-20 bg-[#C9967A] sm:w-36" />
            <div className="flex size-5 items-center justify-center text-[#C9967A]">
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  transform="rotate(0 12 12)"
                />
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  transform="rotate(45 12 12)"
                />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <div className="h-px w-20 bg-[#C9967A] sm:w-36" />
          </div>
        </footer>
      </div>
    </div>
  );
}
