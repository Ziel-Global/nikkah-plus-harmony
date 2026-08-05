import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Nikkah+" },
      {
        name: "description",
        content:
          "How Nikkah+ protects member information, photos and contact details across the platform.",
      },
      { property: "og:title", content: "Privacy Policy — Nikkah+" },
      {
        property: "og:description",
        content: "How Nikkah+ protects member information, photos and contact details.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyStub,
});

function PrivacyStub() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-32 pb-20 sm:px-6">
        <h1 className="text-display text-foreground">Privacy Policy</h1>
        <p className="text-body mt-4 text-muted-foreground">
          [Placeholder — the full privacy policy will be published here.]
        </p>
        <Button asChild variant="secondary" className="mt-8 min-h-11">
          <Link to="/">Back to home</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
