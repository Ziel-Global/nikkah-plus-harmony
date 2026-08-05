import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { DEFAULT_FILTERS } from "@/lib/browse";
import { signOutAndRedirect } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async () => {
    const { data: isSuper } = await supabase.rpc("is_super_admin");
    if (isSuper) throw redirect({ to: "/superadmin" });

    const { data: adminOf } = await supabase
      .from("mosque_admin_mosques")
      .select("mosque_id")
      .limit(1)
      .maybeSingle();
    if (adminOf) throw redirect({ to: "/admin" });


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
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-muted p-4">
          <h2 className="text-h3 text-foreground">Your marriage profile</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Write about yourself section by section, choose who sees each detail, and send it to
            your mosque when you feel it is ready.
          </p>
          <Button asChild className="mt-4 min-h-11">
            <Link to="/profile">Open my profile</Link>
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-muted p-4">
          <h2 className="text-h3 text-foreground">Meet other members</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse mosque-verified members and send an interest request when someone feels right.
          </p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link to="/browse" search={DEFAULT_FILTERS}>Browse members</Link>
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-muted p-4">
          <h2 className="text-h3 text-foreground">Interest requests</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review introductions you have sent and received, and open your active match when one
            has been agreed.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/requests">My requests</Link>
            </Button>
            <Button asChild variant="ghost" className="min-h-11">
              <Link to="/match">Active match</Link>
            </Button>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
