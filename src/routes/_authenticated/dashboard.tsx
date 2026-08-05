import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { signOutAndRedirect } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase
      .from("mosque_affiliation_requests")
      .select("status")
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (!data) throw redirect({ to: "/pending" });
  },
  head: () => ({
    meta: [
      { title: "Your dashboard — Nikkah+" },
      {
        name: "description",
        content: "Your verified Nikkah+ dashboard — manage your profile and introductions.",
      },
      { property: "og:title", content: "Your dashboard — Nikkah+" },
      { property: "og:description", content: "Your verified Nikkah+ dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AuthShell
      wide
      title="As-salamu alaykum"
      intro="Your mosque has verified your affiliation. Your dashboard is being prepared — profile creation and introductions will appear here."
      footer={
        <button
          type="button"
          onClick={() => void signOutAndRedirect()}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Sign out
        </button>
      }
    >
      <p className="text-sm text-muted-foreground">
        [Placeholder — the member dashboard will be built here.]
      </p>
    </AuthShell>
  );
}
