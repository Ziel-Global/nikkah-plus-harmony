import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Get started — Nikkah+" },
      {
        name: "description",
        content:
          "Create your Nikkah+ account and get verified by your local mosque to begin the search for a spouse.",
      },
      { property: "og:title", content: "Get started — Nikkah+" },
      {
        property: "og:description",
        content: "Create your Nikkah+ account and get verified by your local mosque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterStub,
});

function RegisterStub() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-32 pb-20 sm:px-6">
        <h1 className="text-display text-foreground">Get started</h1>
        <p className="text-body mt-4 text-muted-foreground">
          Registration is coming soon. This page is a placeholder — the sign-up and mosque
          verification flow will be built here.
        </p>
        <Button asChild variant="secondary" className="mt-8 min-h-11">
          <Link to="/">Back to home</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
