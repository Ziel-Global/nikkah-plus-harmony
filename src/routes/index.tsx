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
} from "lucide-react";
import heroArch from "@/assets/hero-arch.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nikkah+ — Faith. Family. Future." },
      {
        name: "description",
        content:
          "Nikkah+ is a community-based Muslim marriage platform where your local mosque verifies members and introductions are made with respect, privacy and family involvement.",
      },
      { property: "og:title", content: "Nikkah+ — Faith. Family. Future." },
      {
        property: "og:description",
        content:
          "A community-based Muslim marriage platform where introductions happen through your local mosque, with privacy and family at the centre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    title: "Register",
    body: "Create an account and complete a considered profile — your background, values and what you are looking for in a spouse.",
  },
  {
    title: "Get verified by your mosque",
    body: "Your local mosque reviews and confirms your affiliation, so every member on the platform is known to a real community.",
  },
  {
    title: "Browse respectfully",
    body: "Read full profiles at your own pace. No swiping, no ranking, no public photo galleries — only meaningful information.",
  },
  {
    title: "Request an introduction",
    body: "Send an interest request through the mosque. Contact details are only shared once both sides — and their walis — agree.",
  },
];

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Privacy by default",
    body: "Contact details, photos and sensitive fields stay hidden until both parties consent to an introduction.",
  },
  {
    icon: Landmark,
    title: "Mosque oversight",
    body: "Every member is affiliated with a verified mosque, and administrators support each match from request to outcome.",
  },
  {
    icon: Flag,
    title: "Reporting & moderation",
    body: "Concerns can be raised at any point. Reports are reviewed by trained administrators and acted on quickly and confidentially.",
  },
];

const MOSQUE_POINTS = [
  { icon: BadgeCheck, text: "Approve affiliation requests before any profile goes live." },
  { icon: HeartHandshake, text: "Oversee interest requests linked to your community." },
  { icon: LifeBuoy, text: "Receive and resolve escalations with full confidentiality." },
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
    q: "Is Nikkah+ a dating app?",
    a: "No. Nikkah+ is a marriage platform. There is no swiping, no casual messaging and no public browsing of photos. Every introduction is intentional and made with the involvement of your mosque and family.",
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
  {
    q: "What does it cost?",
    a: "Pricing details will be confirmed with participating mosques before launch. Registering your interest today does not commit you to anything.",
  },
];

function Landing() {
  return (
    <div id="top" className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="pattern-geo relative isolate overflow-hidden pt-32 pb-20 sm:pt-44 sm:pb-28">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_15%_0%,color-mix(in_oklab,var(--color-tertiary)_45%,transparent),transparent_60%)]" />
            <div className="absolute -top-24 -left-32 h-96 w-96 rounded-full bg-secondary/25 blur-3xl" />
            <div className="absolute top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="animate-rise max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-secondary/50 bg-card/80 px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase shadow-[var(--shadow-card)] backdrop-blur">
                <Users className="size-3.5" aria-hidden="true" />
                Community-based Muslim marriage
              </span>
              <h1 className="text-display mt-6 text-foreground sm:text-[3.25rem] sm:leading-[1.05]">
                Faith. Family.{" "}
                <span className="relative inline-block">
                  Future.
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-primary to-secondary/70" />
                </span>
              </h1>
              <p className="text-body mt-7 max-w-xl text-lg text-foreground/75">
                Nikkah+ helps practising Muslims find a spouse through their local mosque — with
                verified members, family involvement and privacy at every step.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="min-h-12 w-full shadow-[var(--shadow-elevated)] transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto"
                >
                  <Link to="/register">Get started</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="min-h-12 w-full transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto"
                >
                  <a href="#how-it-works">How it works</a>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck className="size-4 text-secondary" aria-hidden="true" />
                  Mosque-verified members
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4 text-secondary" aria-hidden="true" />
                  Private by default
                </span>
              </div>
            </div>

            <div className="animate-rise relative [animation-delay:120ms]">
              <div className="surface-raised relative overflow-hidden rounded-[2rem] p-2">
                <img
                  src={heroArch}
                  alt="Sunlight through an Islamic geometric lattice screen in a calm, warm interior"
                  width={1024}
                  height={1280}
                  className="h-[22rem] w-full rounded-[1.6rem] object-cover sm:h-[30rem] lg:h-[34rem]"
                />
              </div>
              <div className="surface-raised absolute -bottom-6 -left-2 hidden max-w-[15rem] rounded-2xl p-4 sm:block">
                <p className="font-display text-2xl font-bold text-primary">18</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  partner mosques verifying their own communities
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-28 bg-muted/60 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rule-gold" />
            <h2 className="text-h2 mt-5 text-foreground">How it works</h2>
            <p className="text-body mt-3 max-w-xl text-muted-foreground">
              Four considered steps, from registration to a proper introduction.
            </p>

            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="surface-raised card-lift group flex flex-col p-6 sm:p-7"
                >
                  <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-secondary/60 bg-tertiary/25 transition-colors duration-200 group-hover:bg-tertiary/45">
                    <span className="absolute inset-1 rounded-full border border-dashed border-secondary/50" />
                    <span className="font-display text-lg font-bold text-primary">{i + 1}</span>
                  </span>
                  <h3 className="text-h3 mt-5 text-foreground">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* For mosques */}
        <section id="for-mosques" className="scroll-mt-28 py-20 sm:py-28">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <div className="rule-gold" />
              <h2 className="text-h2 mt-5 text-foreground">For mosques</h2>
              <p className="text-body mt-4 text-foreground/75">
                Mosques are the trusted heart of this platform. As a registered mosque, your
                administrators verify that members belong to your community, oversee introductions
                between your congregants, and step in when a family needs guidance.
              </p>
              <ul className="mt-8 space-y-4">
                {MOSQUE_POINTS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3.5">
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-secondary/40 bg-tertiary/25 text-primary">
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className="text-sm leading-relaxed text-foreground/80">{text}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="mt-9 min-h-12 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <Link to="/register">Register a mosque</Link>
              </Button>
            </div>

            <div className="pattern-geo-light relative overflow-hidden rounded-[2rem] border border-secondary/40 bg-gradient-to-br from-tertiary/45 via-muted to-card p-7 shadow-[var(--shadow-elevated)] sm:p-10">
              <div className="relative">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Landmark className="size-5.5" aria-hidden="true" />
                </span>
                <p className="text-accent-lg mt-5 text-primary">Trusted verifiers</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                  Nikkah+ never replaces the role of the mosque or the wali — it gives them clear
                  tools to do what they already do, with less paperwork and more visibility.
                </p>
                <div className="divider-gold my-7" />
                <p className="text-caption">
                  [Placeholder — participating mosque logos or a short imam endorsement will sit
                  here.]
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & safety */}
        <section id="trust" className="scroll-mt-28 bg-muted/60 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rule-gold" />
            <h2 className="text-h2 mt-5 text-foreground">Built on trust</h2>
            <p className="text-body mt-3 max-w-xl text-muted-foreground">
              Your dignity and your family's peace of mind come before everything else.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {TRUST.map(({ icon: Icon, title, body }) => (
                <div key={title} className="surface-raised card-lift p-7">
                  <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-secondary/40 bg-tertiary/25 text-primary">
                    <Icon className="size-7" aria-hidden="true" />
                  </span>
                  <h3 className="text-h3 mt-5 text-foreground">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials / stats */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rule-gold" />
            <h2 className="text-h2 mt-5 text-foreground">Our community</h2>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {STATS.map((item) => (
                <div key={item.label} className="surface-raised card-lift p-7 text-center">
                  <p className="font-display text-4xl font-bold text-primary sm:text-5xl">
                    {item.stat}
                  </p>
                  <span className="mx-auto mt-4 block h-[3px] w-10 rounded-full bg-gradient-to-r from-secondary to-tertiary" />
                  <p className="mt-4 text-sm font-semibold tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {TESTIMONIALS.map((t) => (
                <blockquote
                  key={t.name}
                  className="card-lift relative overflow-hidden rounded-[1.75rem] border border-secondary/35 bg-gradient-to-br from-card to-tertiary/20 p-7 shadow-[var(--shadow-card)] sm:p-8"
                >
                  <Quote
                    className="pointer-events-none absolute -top-2 right-3 size-24 text-secondary/20"
                    aria-hidden="true"
                  />
                  <p className="text-body relative text-foreground/80">“{t.quote}”</p>
                  <footer className="relative mt-6 flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {t.name.charAt(0)}
                    </span>
                    <span className="text-sm">
                      <span className="block font-semibold text-foreground">{t.name}</span>
                      <span className="block text-muted-foreground">{t.place}</span>
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-28 bg-muted/60 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <div className="rule-gold" />
            <h2 className="text-h2 mt-5 text-foreground">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="mt-10 space-y-3">
              {FAQS.map((faq) => (
                <AccordionItem
                  key={faq.q}
                  value={faq.q}
                  className="surface-raised overflow-hidden border-b-0 px-5 transition-colors duration-200 data-[state=open]:bg-tertiary/15"
                >
                  <AccordionTrigger className="min-h-12 text-left font-semibold text-foreground hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pt-4 pb-20 sm:px-6 sm:pb-28">
          <div className="pattern-geo relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center shadow-[var(--shadow-elevated)] sm:px-12 sm:py-20">
            <div className="relative">
              <h2 className="text-h2 text-primary-foreground">Begin with intention</h2>
              <p className="text-body mx-auto mt-4 max-w-lg text-primary-foreground/85">
                Join a marriage platform your family and your mosque can stand behind.
              </p>
              <Button
                asChild
                size="lg"
                variant="soft"
                className="mt-9 min-h-12 transition-transform duration-200 hover:-translate-y-0.5"
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
