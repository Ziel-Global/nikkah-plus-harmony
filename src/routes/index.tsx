import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nikkah+ — Faith. Family. Future." },
      {
        name: "description",
        content:
          "Nikkah+ is a community-based Muslim marriage platform connecting families through their local mosque with respect, privacy and care.",
      },
      { property: "og:title", content: "Nikkah+ — Faith. Family. Future." },
      {
        property: "og:description",
        content:
          "A community-based Muslim marriage platform connecting families through their local mosque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-display text-foreground">Faith. Family. Future.</h1>
        <p className="mt-4 max-w-xl text-body text-muted-foreground">
          The Nikkah+ design system and application shell are in place. Pages will be built on top
          of this foundation.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
