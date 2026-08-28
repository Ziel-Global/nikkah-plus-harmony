import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";

type SearchParams = {
  from?: string | undefined;
};

export const Route = createFileRoute("/privacy")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    from: typeof search["from"] === "string" ? (search["from"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Privacy Policy — Marriage Database" },
      {
        name: "description",
        content:
          "How Marriage Database protects member information, photos and contact details across the platform.",
      },
      { property: "og:title", content: "Privacy Policy — Marriage Database" },
      {
        property: "og:description",
        content: "How Marriage Database protects member information, photos and contact details.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyStub,
});

function PrivacyStub() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const fromPath = search.from;

  const handleBack = () => {
    if (fromPath) {
      void navigate({ to: fromPath as never });
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      void navigate({ to: "/" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-32 pb-20 sm:px-6">
        <h1 className="text-display text-foreground">Privacy Policy</h1>
        <p className="text-body mt-4 text-muted-foreground">
          [Placeholder — the full privacy policy will be published here.]
        </p>
        <Button variant="secondary" className="mt-8 min-h-11" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
