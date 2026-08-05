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
import heroMotif from "@/assets/hero-motif.jpg";

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
    title: "Privacy by default",
    body: "Contact details, photos and sensitive fields stay hidden until both parties consent to an introduction.",
  },
  {
    title: "Mosque oversight",
    body: "Every member is affiliated with a verified mosque, and administrators support each match from request to outcome.",
  },
  {
    title: "Reporting & moderation",
    body: "Concerns can be raised at any point. Reports are reviewed by trained administrators and acted on quickly and confidentially.",
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
        <section className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <img
              src={heroMotif}
              alt=""
              aria-hidden="true"
              width={1280}
              height={1280}
              className="h-full w-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
          </div>

          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-tertiary/60 px-3 py-1 text-xs font-semibold tracking-wide text-foreground uppercase">
                Community-based Muslim marriage
              </span>
              <h1 className="text-display mt-5 text-foreground">
                Faith. Family. Future.
              </h1>
              <p className="text-body mt-5 max-w-xl text-foreground/80">
                Nikkah+ helps practising Muslims find a spouse through their local mosque — with
                verified members, family involvement and privacy at every step.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-h-11 w-full sm:w-auto">
                  <Link to="/register">Get started</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="min-h-11 w-full sm:w-auto"
                >
                  <a href="#how-it-works">How it works</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-28 py-16 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-h2 text-foreground">How it works</h2>
            <p className="text-body mt-3 max-w-xl text-muted-foreground">
              Four considered steps, from registration to a proper introduction.
            </p>

            <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="surface-card flex flex-col p-6">
                  <span className="font-display inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="text-h3 mt-4 text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* For mosques */}
        <section id="for-mosques" className="scroll-mt-28 bg-muted py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-h2 text-foreground">For mosques</h2>
              <p className="text-body mt-4 text-foreground/80">
                Mosques are the trusted heart of this platform. As a registered mosque, your
                administrators verify that members belong to your community, oversee introductions
                between your congregants, and step in when a family needs guidance.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-foreground/80">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  Approve affiliation requests before any profile goes live.
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  Oversee interest requests linked to your community.
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  Receive and resolve escalations with full confidentiality.
                </li>
              </ul>
              <Button asChild variant="secondary" size="lg" className="mt-8 min-h-11">
                <Link to="/register">Register a mosque</Link>
              </Button>
            </div>

            <div className="surface-card p-6 sm:p-8">
              <p className="text-accent-lg">Trusted verifiers</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Nikkah+ never replaces the role of the mosque or the wali — it gives them clear
                tools to do what they already do, with less paperwork and more visibility.
              </p>
              <div className="divider-gold my-6" />
              <p className="text-caption">
                [Placeholder — participating mosque logos or a short imam endorsement will sit
                here.]
              </p>
            </div>
          </div>
        </section>

        {/* Trust & safety */}
        <section id="trust" className="scroll-mt-28 py-16 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-h2 text-foreground">Built on trust</h2>
            <p className="text-body mt-3 max-w-xl text-muted-foreground">
              Your dignity and your family's peace of mind come before everything else.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {TRUST.map((item) => (
                <div key={item.title} className="surface-card p-6">
                  <h3 className="text-h3 text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials / stats — PLACEHOLDER */}
        <section className="bg-muted py-16 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-h2 text-foreground">Our community</h2>
            <p className="text-caption mt-2">
              [Placeholder content — real statistics and testimonials to be added before launch.]
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                { stat: "[000]", label: "Verified members" },
                { stat: "[00]", label: "Partner mosques" },
                { stat: "[00]", label: "Introductions supported" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="surface-card border-dashed p-6 text-center"
                >
                  <p className="font-display text-3xl font-bold text-primary">{item.stat}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {[1, 2].map((n) => (
                <blockquote key={n} className="surface-card border-dashed p-6">
                  <p className="text-body text-foreground/80">
                    “[Testimonial placeholder {n} — a short quote from a member or imam about the
                    experience of using Nikkah+.]”
                  </p>
                  <footer className="text-caption mt-4">[Name placeholder], [Mosque placeholder]</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-28 py-16 sm:py-24">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <h2 className="text-h2 text-foreground">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="mt-8">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="min-h-11 text-left font-semibold text-foreground">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto w-full max-w-6xl rounded-3xl bg-primary px-6 py-12 text-center sm:px-12 sm:py-16">
            <h2 className="text-h2 text-primary-foreground">Begin with intention</h2>
            <p className="text-body mx-auto mt-3 max-w-lg text-primary-foreground/85">
              Join a marriage platform your family and your mosque can stand behind.
            </p>
            <Button asChild size="lg" variant="soft" className="mt-8 min-h-11">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
