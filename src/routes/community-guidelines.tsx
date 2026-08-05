import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/community-guidelines")({
  head: () => ({
    meta: [
      { title: "Community Guidelines — Nikkah+" },
      {
        name: "description",
        content:
          "The standards of conduct expected of every Nikkah+ member, mosque administrator and family.",
      },
      { property: "og:title", content: "Community Guidelines — Nikkah+" },
      {
        property: "og:description",
        content: "The standards of conduct expected of every Nikkah+ member and mosque.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidelinesStub,
});

function GuidelinesStub() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-32 pb-20 sm:px-6">
        <h1 className="text-display text-foreground">Community Guidelines</h1>
        <p className="text-body mt-4 text-muted-foreground">
          [Placeholder — the full community guidelines will be published here.]
        </p>
        <Button asChild variant="secondary" className="mt-8 min-h-11">
          <Link to="/">Back to home</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
