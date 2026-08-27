import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  BadgeCheck,
  Flag,
  Landmark,
  Quote,
  ShieldCheck,
  Users,
  HeartHandshake,
  LifeBuoy,
  ArrowRight,
  Heart,
  EyeOff,
  UserCheck,
  FileCheck,
  Send,
  UserSearch,
  UsersRound,
} from "lucide-react";
import heroArch from "@/assets/hero-arch.jpg";

export const Route = createFileRoute("/marriage")({
  head: () => ({
    meta: [
      { title: "Marriage Database — Faith. Family. Future." },
      {
        name: "description",
        content:
          "Marriage Database is a community-based Muslim marriage platform where your local mosque verifies members and introductions are made with respect, privacy and family involvement.",
      },
      { property: "og:title", content: "Marriage Database — Faith. Family. Future." },
      {
        property: "og:description",
        content:
          "A community-based Muslim marriage platform where introductions happen through your local mosque, with privacy and family at the centre.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-image.png" },
    ],
  }),
  component: MarriageLandingPage,
});

const PILLARS = [
  {
    icon: UserCheck,
    title: "Mosque-Verified Profiles",
    body: "No fake accounts or unverified users. Every single member is authenticated by their participating local mosque administration.",
  },
  {
    icon: EyeOff,
    title: "Privacy & Wali Centric",
    body: "Zero public photo galleries or swiping. Photos and contact information stay completely hidden until mutual interest & wali consent.",
  },
  {
    icon: HeartHandshake,
    title: "Imam Mediated Introductions",
    body: "Introductions are supported and facilitated under the guidance of your local resident imam for a dignified and honorable process.",
  },
];

const STEPS = [
  {
    icon: FileCheck,
    title: "Profile Submitted",
    body: "Individual completes a marriage profile",
  },
  {
    icon: Send,
    title: "Shared with Masjid",
    body: "Sent securely to their chosen local masjid",
  },
  {
    icon: UserCheck,
    title: "Imam Reviews",
    body: "Imam verifies details & reviews suitability",
  },
  {
    icon: UserSearch,
    title: "Match Identified",
    body: "Compatible profiles are identified",
  },
  {
    icon: HeartHandshake,
    title: "Imam Mediates",
    body: "Introduction facilitated between families",
  },
  {
    icon: UsersRound,
    title: "Families Proceed",
    body: "Guided, respectful process continues",
  },
];

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Privacy by Default",
    body: "Your contact details, photos, and sensitive fields stay protected until both families consent to an introduction.",
  },
  {
    icon: Landmark,
    title: "Local Mosque Oversight",
    body: "Every profile is linked to a verified mosque, and administrators support each match request from start to completion.",
  },
  {
    icon: Flag,
    title: "Strict Moderation",
    body: "Concerns can be raised at any moment. Reports are confidentially reviewed by trained administrators and acted upon swiftly.",
  },
];

const MOSQUE_POINTS = [
  { icon: BadgeCheck, text: "Verify member affiliation requests before profiles are published." },
  { icon: HeartHandshake, text: "Oversee and facilitate interest requests within your community." },
  { icon: LifeBuoy, text: "Provide confidential counsel and resolve escalations for families." },
];

const STATS = [
  { stat: "2,400+", label: "Verified members" },
  { stat: "18", label: "Partner mosques" },
  { stat: "60+", label: "Introductions supported" },
];

const TESTIMONIALS = [
  {
    quote:
      "We had almost given up on finding somewhere our family felt comfortable. Knowing the mosque had verified everyone changed the whole conversation at home.",
    name: "Aisha R.",
    place: "Green Lane Masjid",
  },
  {
    quote:
      "As an imam, I finally have a clear way to support families through introductions — the process is documented, respectful and never rushed.",
    name: "Imam Yusuf Adeyemi",
    place: "Riverside Islamic Centre",
  },
];

const FAQS = [
  {
    q: "Is Marriage Database a dating app?",
    a: "No. Marriage Database is a sacred marriage platform. There is no swiping, no casual messaging, and no public browsing of photos. Every introduction is intentional and made with the involvement of your mosque and family.",
  },
  {
    q: "Do I have to be affiliated with a mosque?",
    a: "Yes. Membership is confirmed by a participating mosque. This is what allows the community to vouch for the people on the platform and keeps standards high for everyone.",
  },
  {
    q: "Who can see my photos and contact details?",
    a: "Nobody, until you decide otherwise. Photos and contact information follow your privacy settings, and contact details are only exchanged after mutual consent to an introduction.",
  },
  {
    q: "Can my wali be involved?",
    a: "Yes. You can record your wali's details on your profile and they can be included in the introduction process from the beginning.",
  },
  {
    q: "How does my mosque get involved?",
    a: "Mosque administrators verify member affiliation, oversee introductions linked to their community, and are available if either family needs support or wants to raise a concern.",
  },
];

export function MarriageLandingPage() {
  return (
    <div
      id="top"
      className="flex min-h-screen flex-col overflow-x-hidden bg-[#F8FAFC] font-sans text-[#0F172A]"
    >
      <SiteHeader />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#DBEAFE]/40 via-[#F8FAFC] to-[#F8FAFC] pt-32 pb-20 sm:pt-44 sm:pb-28">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-12 left-10 h-96 w-96 rounded-full bg-[#2563EB]/10 blur-3xl" />
            <div className="absolute top-36 right-10 h-96 w-96 rounded-full bg-[#3B82F6]/10 blur-3xl" />
          </div>

          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#93C5FD]/60 bg-white px-4 py-1.5 text-xs font-bold tracking-wider text-[#2563EB] uppercase shadow-sm">
                <Heart className="size-3.5 text-[#2563EB]" />
                Community-Based Halal Matrimony
              </span>

              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl sm:leading-[1.1]">
                Faith. Family. <br />
                <span className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent">
                  Future.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base font-semibold text-[#64748B] sm:text-lg">
                Marriage Database helps practising Muslims find a spouse through their local mosque
                — with verified members, family involvement, and privacy at every step.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="min-h-12 w-full rounded-xl bg-[#2563EB] px-6 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 hover:bg-[#1D4ED8] hover:shadow-xl sm:w-auto"
                >
                  <Link to="/register">
                    <span>Get started</span>
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-6 text-sm font-bold text-[#0F172A] hover:bg-[#DBEAFE]/40 hover:text-[#2563EB] sm:w-auto"
                >
                  <a href="#about">About Us</a>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold text-[#64748B]">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-[#E2E8F0] shadow-sm">
                  <BadgeCheck className="size-4 text-[#2563EB]" />
                  Mosque-Verified Members
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-[#E2E8F0] shadow-sm">
                  <ShieldCheck className="size-4 text-[#2563EB]" />
                  100% Private & Halal
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white p-2 shadow-2xl shadow-[#2563EB]/10">
                <img
                  src={heroArch}
                  alt="Sunlight through an Islamic geometric lattice screen in a calm interior"
                  width={1024}
                  height={1280}
                  className="h-[22rem] w-full rounded-2xl object-cover sm:h-[30rem] lg:h-[32rem]"
                />
              </div>
              <div className="absolute -bottom-6 -left-3 hidden max-w-[15rem] rounded-2xl border border-[#E2E8F0] bg-white/95 p-4 shadow-xl backdrop-blur sm:block">
                <p className="font-display text-3xl font-bold text-[#2563EB]">18+</p>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">
                  partner mosques verifying their own communities
                </p>
              </div>
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
                <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Our Purpose & Mission
                </span>
                <h2 className="mt-2 text-2xl font-bold text-[#0F172A] sm:text-4xl">
                  Restoring Dignity & Trust to Muslim Matrimony
                </h2>
                <p className="mt-5 text-base leading-relaxed text-[#64748B]">
                  Marriage Database was built to solve a growing challenge in our ummah — commercial
                  apps that turn marriage seeking into casual swiping, stripping away family
                  involvement and Islamic decorum.
                </p>
                <p className="mt-4 text-base leading-relaxed text-[#64748B]">
                  We bring matrimony back to where it belongs: <strong>your local masjid</strong>.
                  Every member profile is authenticated by their mosque, ensuring you connect with
                  verified, practising individuals under the honorable oversight of imams and walis.
                </p>
              </div>

              <div className="relative rounded-3xl border border-[#93C5FD]/60 bg-gradient-to-br from-[#DBEAFE]/40 via-white to-[#F8FAFC] p-8 shadow-xl shadow-[#2563EB]/10">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-md">
                      <ShieldCheck className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A]">No Casual Swiping</h3>
                      <p className="mt-1 text-sm text-[#64748B]">
                        Profiles are built with care and read with intention — no algorithm tricks
                        or superficial ratings.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3B82F6] text-white shadow-md">
                      <Users className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A]">Family & Wali Honor</h3>
                      <p className="mt-1 text-sm text-[#64748B]">
                        Walies and families are integrated into the introduction flow from day one.
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
        <section id="what-we-do" className="scroll-mt-28 py-20 sm:py-28 bg-[#F8FAFC]">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <div className="mx-auto h-1 w-12 rounded-full bg-[#2563EB]" />
              <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-3xl">What We Do</h2>
              <p className="mt-3 mx-auto max-w-xl text-base text-[#64748B]">
                Three core principles designed to keep matrimonial introductions safe, private, and
                Islamic.
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
        {/* HOW IT WORKS SECTION — 6 Steps */}
        {/* ========================================================================= */}
        <section
          id="how-it-works"
          className="scroll-mt-28 bg-white py-20 sm:py-28 border-y border-[#E2E8F0]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <div className="mx-auto h-1 w-12 rounded-full bg-[#2563EB]" />
              <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-3xl">How It Works</h2>
              <p className="mt-3 mx-auto max-w-xl text-base text-[#64748B]">
                A 6-step guided process from profile submission to family introduction.
              </p>
            </div>

            <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li
                  key={title}
                  className="group relative flex flex-col rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#93C5FD] hover:bg-white hover:shadow-xl hover:shadow-[#2563EB]/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white font-bold text-sm shadow-md shadow-[#2563EB]/20">
                      {i + 1}
                    </span>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                      <Icon className="size-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mt-6 text-[#0F172A]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FOR MOSQUES SECTION */}
        {/* ========================================================================= */}
        <section id="for-mosques" className="scroll-mt-28 py-20 sm:py-28 bg-[#F8FAFC]">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <div className="h-1 w-12 rounded-full bg-[#2563EB]" />
              <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Mosque & Imam Empowerment
              </span>
              <h2 className="mt-2 text-2xl font-bold text-[#0F172A] sm:text-4xl">For Mosques</h2>
              <p className="mt-4 text-base leading-relaxed text-[#64748B]">
                Mosques are the trusted heart of this platform. As a registered mosque, your
                administrators verify that members belong to your community, oversee introductions
                between your congregants, and step in when a family needs guidance.
              </p>
              <ul className="mt-8 space-y-4">
                {MOSQUE_POINTS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3.5 text-sm text-[#0F172A]">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
                      <Icon className="size-4" />
                    </span>
                    <span className="leading-relaxed font-medium">{text}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                className="mt-9 min-h-12 rounded-xl bg-[#2563EB] px-6 text-sm font-bold text-white shadow-md hover:bg-[#1D4ED8]"
              >
                <Link to="/register">Register your mosque</Link>
              </Button>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-[#93C5FD]/60 bg-white p-8 shadow-xl shadow-[#2563EB]/10 sm:p-10">
              <div>
                <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-md">
                  <Landmark className="size-7" />
                </span>
                <p className="mt-5 text-xl font-bold text-[#0F172A]">Trusted Community Verifiers</p>
                <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
                  Marriage Database never replaces the role of the mosque or the wali — it gives
                  imams clear digital tools to support families with privacy, visibility, and peace
                  of mind.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* TRUST & SAFETY SECTION */}
        {/* ========================================================================= */}
        <section
          id="trust"
          className="scroll-mt-28 bg-white py-20 sm:py-28 border-t border-[#E2E8F0]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <div className="mx-auto h-1 w-12 rounded-full bg-[#2563EB]" />
              <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-3xl">Built On Trust</h2>
              <p className="mt-3 max-w-xl text-base text-[#64748B] mx-auto">
                Your dignity and your family's peace of mind come before everything else.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {TRUST.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-7 transition-all duration-300 hover:border-[#93C5FD] hover:bg-white hover:shadow-xl hover:shadow-[#2563EB]/10"
                >
                  <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
                    <Icon className="size-7" />
                  </span>
                  <h3 className="text-lg font-bold mt-5 text-[#0F172A]">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#64748B]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* COMMUNITY TESTIMONIALS & STATS */}
        {/* ========================================================================= */}
        <section className="bg-[#F8FAFC] py-20 sm:py-28 border-t border-[#E2E8F0]">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <div className="mx-auto h-1 w-12 rounded-full bg-[#2563EB]" />
              <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-3xl">
                Our Community Impact
              </h2>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {STATS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-7 text-center shadow-sm"
                >
                  <p className="font-display text-4xl font-bold text-[#2563EB] sm:text-5xl">
                    {item.stat}
                  </p>
                  <span className="mx-auto mt-4 block h-1 w-10 rounded-full bg-[#3B82F6]" />
                  <p className="mt-4 text-sm font-semibold tracking-wide text-[#64748B]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {TESTIMONIALS.map((t) => (
                <blockquote
                  key={t.name}
                  className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-sm sm:p-8"
                >
                  <Quote className="pointer-events-none absolute -top-2 right-3 size-20 text-[#DBEAFE]" />
                  <p className="relative text-sm leading-relaxed text-[#0F172A] font-medium">
                    “{t.quote}”
                  </p>
                  <footer className="relative mt-6 flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
                      {t.name.charAt(0)}
                    </span>
                    <span className="text-sm">
                      <span className="block font-bold text-[#0F172A]">{t.name}</span>
                      <span className="block text-xs text-[#64748B]">{t.place}</span>
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FAQ SECTION */}
        {/* ========================================================================= */}
        <section
          id="faq"
          className="scroll-mt-28 bg-white py-20 sm:py-28 border-t border-[#E2E8F0]"
        >
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <div className="mx-auto h-1 w-12 rounded-full bg-[#2563EB]" />
              <h2 className="mt-4 text-2xl font-bold text-[#0F172A] sm:text-3xl">
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="mt-10 space-y-3">
              {FAQS.map((faq) => (
                <AccordionItem
                  key={faq.q}
                  value={faq.q}
                  className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-6 shadow-sm transition-colors duration-200 data-[state=open]:border-[#93C5FD] data-[state=open]:bg-[#DBEAFE]/30"
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

        {/* ========================================================================= */}
        {/* FINAL CTA BANNER */}
        {/* ========================================================================= */}
        <section className="bg-[#F8FAFC] px-4 py-20 sm:px-6 sm:py-28 border-t border-[#E2E8F0]">
          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 py-14 text-center shadow-2xl shadow-[#2563EB]/25 sm:px-12 sm:py-20">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Begin with Intention</h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-[#DBEAFE]">
                Join a marriage platform your family and your mosque can stand behind.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 min-h-12 rounded-xl bg-white px-8 font-bold text-[#2563EB] shadow-lg hover:bg-[#DBEAFE]"
              >
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
