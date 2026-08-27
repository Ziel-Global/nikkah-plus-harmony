export function MasjidHeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Decorative Outer Glow */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#2563EB]/20 via-[#3B82F6]/10 to-[#93C5FD]/30 blur-2xl opacity-70" />

      {/* Main Container Card */}
      <div className="relative rounded-3xl border border-[#93C5FD]/60 bg-gradient-to-b from-white via-[#F8FAFC] to-[#DBEAFE]/30 p-6 shadow-2xl shadow-[#2563EB]/15 backdrop-blur-md sm:p-8">
        {/* Architectural SVG Graphic */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#1E40AF] via-[#2563EB] to-[#1D4ED8] p-6 shadow-inner flex items-center justify-center">
          {/* Subtle Grid Background Pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(#DBEAFE_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* SVG Mosque Vector Illustration */}
          <svg
            viewBox="0 0 400 300"
            fill="none"
            className="w-full h-full text-white drop-shadow-lg"
          >
            {/* Moon & Stars in Sky */}
            <path
              d="M320 40 C315 40 310 43 308 48 C314 48 318 53 318 60 C318 67 313 72 306 72 C313 72 320 65 320 56 C320 48 320 40 320 40 Z"
              fill="#DBEAFE"
              fillOpacity="0.8"
            />
            <circle cx="90" cy="50" r="2" fill="#93C5FD" opacity="0.8" />
            <circle cx="130" cy="35" r="1.5" fill="#93C5FD" opacity="0.9" />
            <circle cx="280" cy="30" r="1.5" fill="#93C5FD" opacity="0.7" />

            {/* Background Geometric Dome Silhouette */}
            <path
              d="M200 60 C150 110 130 180 130 240 H270 C270 180 250 110 200 60 Z"
              fill="#3B82F6"
              fillOpacity="0.3"
            />

            {/* Main Central Arch & Dome */}
            <path
              d="M200 80 C165 125 150 185 150 250 H250 C250 185 235 125 200 80 Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="3"
            />
            {/* Top Finial & Crescent */}
            <path
              d="M200 45 V80 M195 50 H205 M200 40 A 4 4 0 1 0 200 48"
              stroke="#DBEAFE"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Left Minaret Tower */}
            <rect
              x="90"
              y="140"
              width="24"
              height="110"
              rx="3"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M85 140 L102 110 L119 140 Z"
              fill="currentColor"
              fillOpacity="0.4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M102 98 V110 M99 102 H105" stroke="#DBEAFE" strokeWidth="2" />

            {/* Right Minaret Tower */}
            <rect
              x="286"
              y="140"
              width="24"
              height="110"
              rx="3"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M281 140 L298 110 L315 140 Z"
              fill="currentColor"
              fillOpacity="0.4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M298 98 V110 M295 102 H301" stroke="#DBEAFE" strokeWidth="2" />

            {/* Central Doorway Arch */}
            <path
              d="M175 250 V200 C175 186 186 175 200 175 C214 175 225 186 225 200 V250 Z"
              fill="#1E40AF"
              stroke="#DBEAFE"
              strokeWidth="2"
            />

            {/* Floor Base */}
            <line
              x1="50"
              y1="250"
              x2="350"
              y2="250"
              stroke="#DBEAFE"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Floating Feature Badges */}
        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white">
              <span className="font-bold text-xs">💍</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F172A]">Marriage Database</p>
              <p className="text-[10px] text-[#64748B]">Imam Matrimony</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6] text-white">
              <span className="font-bold text-xs">📖</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F172A]">Masail</p>
              <p className="text-[10px] text-[#64748B]">Scholar Q&A</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
