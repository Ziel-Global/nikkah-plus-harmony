import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MasjidHeader, MASAIL_URL } from "@/components/layout/MasjidHeader";
import { MasjidFooter } from "@/components/layout/MasjidFooter";
import { MasjidHeroIllustration } from "@/components/brand/MasjidHeroIllustration";
import {
  HeartHandshake,
  BookOpen,
  Landmark,
  ShieldCheck,
  Users,
  BadgeCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Building2,
  GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Local Masjid — Serving the Community. Strengthening Imaan." },
      {
        name: "description",
        content:
          "My Local Masjid connects local Muslim communities with essential digital services — from imam-verified matrimonial introductions to authentic scholar Q&A.",
      },
      { property: "og:title", content: "My Local Masjid — Community & Guidance Portal" },
      {
        property: "og:description",
        content:
          "Serving the community. Strengthening imaan. Building together. Explore our Marriage Database and Masail projects.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-image.png" },
    ],
  }),
  component: MyLocalMasjidMainPage,
});

const PILLARS = [
  {
    icon: HeartHandshake,
    title: "Sacred Matrimonial Matching",
    body: "Connecting Muslim brothers and sisters through imam-verified community profiles with wali privacy, respect, and family involvement.",
  },
  {
    icon: BookOpen,
    title: "Authentic Scholar Guidance",
    body: "Direct access to qualified local scholars for daily masail, fiqh guidance, and family counseling rooted in traditional Islamic knowledge.",
  },
  {
    icon: Landmark,
    title: "Mosque Empowerment",
    body: "Equipping local mosque committees with modern digital tools to verify congregants, manage community requests, and preserve trust.",
  },
];

const SERVICES_CONGREGANTS = [
  "Verified community profiles endorsed by your local masjid.",
  "Privacy-first interaction — contact details stay hidden until mutual consent.",
  "Direct confidential Q&A with resident scholars and imams.",
  "Wali involvement built into the introduction process from step one.",
];

const SERVICES_IMAMS = [
  "Structured digital dashboard to manage community affiliation requests.",
  "Oversight tools for matrimonial introductions between congregants.",
  "Confidential Q&A workspace to answer masail and record fatwa archives.",
  "Resolution & moderation tools to support families during escalations.",
];

const FAQS = [
  {
    q: "What is My Local Masjid?",
    a: "My Local Masjid is a digital community initiative designed to empower local Islamic centres and congregants. We bridge traditional mosque guidance with modern digital tools to serve Muslim families.",
  },
  {
    q: "What projects does My Local Masjid offer?",
    a: "We currently host two core projects: (1) Marriage Database — an imam-verified matrimonial matching platform, and (2) Masail — a direct Islamic Q&A portal connecting congregants with trusted local scholars.",
  },
  {
    q: "How does the Marriage Database work?",
    a: "Members register, create a profile, and select their local mosque. Once the mosque administration verifies their affiliation, candidates can browse verified profiles and request introductions through the imam with full privacy and family involvement.",
  },
  {
    q: "What is Masail and how do I ask questions?",
    a: "Masail allows you to submit religious questions directly to verified scholars affiliated with your local masjid. You receive authentic, documented answers based on recognised Islamic jurisprudence.",
  },
  {
    q: "How can my mosque join My Local Masjid?",
    a: "Mosque administrators and imams can contact our onboarding team to register their masjid. Once onboarded, your mosque receives an admin dashboard to verify congregants and support your community.",
  },
];

export function MyLocalMasjidMainPage() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-[#0F172A]">
      {/* Dedicated Separate Header */}
      <MasjidHeader />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION — Centered Layout with Background Image */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden bg-cover bg-center pt-36 pb-24 sm:pt-44 sm:pb-32 bg-[url('/masjid-hero-bg.png')]">
          {/* Brand Color Overlay with 0.3 Opacity so Masjid Image is Completely Visible */}
          <div className="pointer-events-none absolute inset-0 bg-[#2563EB]/30" />

          <div className="relative mx-auto w-full max-w-4xl px-4 text-center sm:px-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#93C5FD]/60 bg-white/90 px-4 py-1.5 text-xs font-semibold tracking-wider text-[#2563EB] uppercase shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 text-[#2563EB]" />
              Serving the Community · Strengthening Imaan
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-black sm:text-5xl lg:text-6xl sm:leading-[1.1]">
              Empowering Communities. <br />
              <span className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent">
                Strengthening Imaan. Building Together.
              </span>
            </h1>

            {/* Subtitle Paragraph */}
            <p className="mt-6 mx-auto max-w-2xl text-base font-semibold text-black sm:text-lg">
              My Local Masjid brings essential Islamic community initiatives under one modern
              digital roof — connecting congregants with local mosques for imam-verified matrimony
              and authentic scholar guidance.
            </p>

            {/* Action CTA Buttons */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#projects"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-xl sm:w-auto"
              >
                <span>Explore Projects</span>
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#about"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-6 text-sm font-bold text-black shadow-sm transition-all duration-200 hover:bg-[#DBEAFE]/40 hover:text-[#2563EB] sm:w-auto"
              >
                Learn About Our Mission
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-black">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3.5 py-2 border border-[#E2E8F0] shadow-sm backdrop-blur">
                <BadgeCheck className="size-4 text-[#2563EB]" />
                Mosque & Imam Verified
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3.5 py-2 border border-[#E2E8F0] shadow-sm backdrop-blur">
                <ShieldCheck className="size-4 text-[#2563EB]" />
                100% Privacy-First
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3.5 py-2 border border-[#E2E8F0] shadow-sm backdrop-blur">
                <Users className="size-4 text-[#2563EB]" />
                Family & Wali Centric
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ABOUT US SECTION */}
        {/* ========================================================================= */}
        <section
          id="about"
          className="scroll-mt-28 py-20 sm:py-28 bg-white border-y border-[#E2E8F0]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="h-1 w-12 rounded-full bg-[#2563EB]" />
                <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-3xl">
                  Re-anchoring Community Life in the Heart of the Masjid
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#64748B]">
                  For centuries, the local masjid was far more than a place of daily prayer — it was
                  the vibrant hub for marriage introductions, scholarly counsel, conflict
                  resolution, and family support.
                </p>
                <p className="mt-3 text-base leading-relaxed text-[#64748B]">
                  <strong>My Local Masjid</strong> was created to restore this central role in our
                  modern world. We equip local Islamic centres with purpose-built digital platforms
                  so congregants can access trusted services easily while keeping imams and families
                  at the heart of every interaction.
                </p>
              </div>

              <div className="relative rounded-3xl border border-[#E2E8F0] bg-gradient-to-br from-[#DBEAFE]/50 via-[#F8FAFC] to-white p-8 shadow-lg shadow-[#2563EB]/5">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB] text-white">
                      <Landmark className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A]">Community First</h3>
                      <p className="mt-1 text-sm text-[#64748B]">
                        Every member and request is grounded in their real, local masjid community.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3B82F6] text-white">
                      <GraduationCap className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A]">Scholarly Oversight</h3>
                      <p className="mt-1 text-sm text-[#64748B]">
                        Guidance and introduction rules follow authentic Islamic principles overseen
                        by qualified scholars.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* WHAT WE DO SECTION */}
        {/* ========================================================================= */}
        <section id="what-we-do" className="scroll-mt-28 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <div className="mx-auto h-1 w-12 rounded-full bg-[#2563EB]" />
              <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-3xl">What We Do</h2>
              <p className="mt-3 mx-auto max-w-xl text-base text-[#64748B]">
                Three core pillars dedicated to building strong Muslim families and informed
                communities.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="group relative rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#93C5FD] hover:shadow-xl hover:shadow-[#2563EB]/10"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB] transition-colors group-hover:bg-[#2563EB] group-hover:text-white">
                    <Icon className="size-7" />
                  </div>
                  <h3 className="text-lg font-bold mt-6 text-[#0F172A]">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#64748B]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FEATURED PROJECTS SHOWCASE */}
        {/* ========================================================================= */}
        <section
          id="projects"
          className="scroll-mt-28 bg-[#DBEAFE]/30 py-20 sm:py-28 border-y border-[#E2E8F0]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="rounded-full bg-[#2563EB]/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#2563EB] uppercase">
                Our Flagship Initiatives
              </span>
              <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-4xl">
                Explore Our Active Projects
              </h2>
              <p className="mt-3 mx-auto max-w-xl text-base text-[#64748B]">
                Direct access to our specialized community solutions designed for Muslims today.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              {/* PROJECT 1: MARRIAGE DATABASE */}
              <div className="group relative flex flex-col justify-between rounded-3xl border border-[#93C5FD]/60 bg-white p-8 shadow-md transition-all duration-300 hover:border-[#2563EB] hover:shadow-2xl hover:shadow-[#2563EB]/15">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/25">
                      <HeartHandshake className="size-8" />
                    </div>
                    <span className="rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-bold text-[#2563EB]">
                      Marriage Database
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-[#0F172A]">Marriage Database</h3>
                  <p className="mt-2 text-sm font-semibold text-[#2563EB]">Find. Connect. Build.</p>

                  <p className="mt-4 text-sm leading-relaxed text-[#64748B]">
                    A privacy-first Muslim matrimonial platform where members are verified by their
                    local mosque and introductions take place under imam mediation and wali
                    involvement.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-[#0F172A] font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#2563EB]" />
                      Imam & Mosque Affiliation Verification
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#2563EB]" />
                      No Public Swiping or Photo Galleries
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#2563EB]" />
                      Wali & Family Centric Introductions
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                  <Link
                    to="/marriage"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#1D4ED8]"
                  >
                    <span>Visit Marriage Platform</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              {/* PROJECT 2: MASAIL */}
              <div className="group relative flex flex-col justify-between rounded-3xl border border-[#93C5FD]/60 bg-white p-8 shadow-md transition-all duration-300 hover:border-[#3B82F6] hover:shadow-2xl hover:shadow-[#3B82F6]/15">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/25">
                      <BookOpen className="size-8" />
                    </div>
                    <span className="rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-bold text-[#2563EB]">
                      Islamic Q&A
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-[#0F172A]">Masail Portal</h3>
                  <p className="mt-2 text-sm font-semibold text-[#3B82F6]">Ask. Learn. Grow.</p>

                  <p className="mt-4 text-sm leading-relaxed text-[#64748B]">
                    A direct religious guidance platform connecting Muslims with trusted scholars
                    and imams from their local masjid for authentic answers to everyday life
                    questions.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-[#0F172A] font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#3B82F6]" />
                      Direct Q&A with Resident Imams & Scholars
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#3B82F6]" />
                      Searchable Archive of Authentic Answers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#3B82F6]" />
                      Confidential & Respectful Submission
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                  <a
                    href={MASAIL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#2563EB]"
                  >
                    <span>Explore Masail Portal</span>
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* WHAT WE PROVIDE / SERVICES */}
        {/* ========================================================================= */}
        <section id="services" className="scroll-mt-28 py-20 sm:py-28 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <div className="mx-auto h-1 w-12 rounded-full bg-[#2563EB]" />
              <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-3xl">
                What We Provide
              </h2>
              <p className="mt-3 mx-auto max-w-xl text-base text-[#64748B]">
                Tailored solutions for congregants, resident scholars, and mosque committees.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-8">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white">
                    <Users className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F172A]">For Congregants & Families</h3>
                </div>
                <ul className="mt-6 space-y-3">
                  {SERVICES_CONGREGANTS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#0F172A]">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#2563EB]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-8">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6] text-white">
                    <Building2 className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F172A]">
                    For Imams & Mosque Committees
                  </h3>
                </div>
                <ul className="mt-6 space-y-3">
                  {SERVICES_IMAMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#0F172A]">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#3B82F6]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FAQ SECTION */}
        {/* ========================================================================= */}
        <section
          id="faq"
          className="scroll-mt-28 bg-[#F8FAFC] py-20 sm:py-28 border-t border-[#E2E8F0]"
        >
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <div className="mx-auto h-1 w-12 rounded-full bg-[#2563EB]" />
              <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-base text-[#64748B]">
                Everything you need to know about My Local Masjid and our initiatives.
              </p>
            </div>

            <Accordion type="single" collapsible className="mt-10 space-y-3">
              {FAQS.map((faq) => (
                <AccordionItem
                  key={faq.q}
                  value={faq.q}
                  className="rounded-2xl border border-[#E2E8F0] bg-white px-6 shadow-sm transition-colors duration-200 data-[state=open]:border-[#93C5FD] data-[state=open]:bg-[#DBEAFE]/20"
                >
                  <AccordionTrigger className="py-4 text-left font-semibold text-[#0F172A] hover:no-underline hover:text-[#2563EB]">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-[#64748B]">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      {/* Dedicated Separate Footer */}
      <MasjidFooter />
    </div>
  );
}
