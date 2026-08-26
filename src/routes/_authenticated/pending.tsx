import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { signOutAndRedirect } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/pending")({
  head: () => ({
    meta: [
      { title: "Awaiting mosque verification — Nikkah+" },
      {
        name: "description",
        content: "Your Nikkah+ registration is complete and awaiting verification by your mosque.",
      },
      { property: "og:title", content: "Awaiting mosque verification — Nikkah+" },
      {
        property: "og:description",
        content: "Your registration is complete and awaiting verification by your mosque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mosqueName, setMosqueName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("mosque_affiliation_requests")
      .select(
        "status, rejection_reason, mosques!mosque_affiliation_requests_mosque_id_fkey(name, city)",
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      navigate({ to: "/onboarding" });
      return;
    }

    const rawMosque = data.mosques as unknown as
      { name: string; city: string | null } | { name: string; city: string | null }[] | null;
    const mosque = Array.isArray(rawMosque) ? (rawMosque[0] ?? null) : rawMosque;
    setMosqueName(mosque ? [mosque.name, mosque.city].filter(Boolean).join(", ") : null);
    setStatus(data.status);
    setReason(data.rejection_reason ?? null);
    setLoading(false);

    if (data.status === "approved") navigate({ to: "/dashboard" });
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthShell
      wide
      title={
        status === "rejected"
          ? "Your mosque couldn't verify this request"
          : "Your mosque affiliation is pending verification"
      }
      intro={
        status === "rejected"
          ? "Please get in touch with your mosque, or choose a different mosque to continue."
          : "JazakAllahu khairan for completing your registration. The next step is with your mosque."
      }
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
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your status…</p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-caption">Mosque</p>
            <p className="text-h3 mt-1 text-foreground">{mosqueName ?? "Your selected mosque"}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-semibold text-foreground">
                {status === "rejected" ? "Not verified" : "Pending review"}
              </span>
            </p>
            {reason ? <p className="mt-2 text-sm text-muted-foreground">{reason}</p> : null}
          </div>

          <div>
            <h2 className="text-h3 text-foreground">What happens next</h2>
            <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">1. Mosque review.</span> An
                administrator at your mosque will confirm that you're known to the community.
              </li>
              <li>
                <span className="font-semibold text-foreground">2. You'll be notified.</span> We'll
                email you as soon as your affiliation is approved.
              </li>
              <li>
                <span className="font-semibold text-foreground">3. Build your profile.</span> Once
                approved, you can complete your marriage profile and it will be reviewed before any
                introductions are made.
              </li>
            </ol>
          </div>

          <p className="text-caption">
            Nothing about you is visible to other members while your account is pending. If this is
            taking longer than expected, please speak to your mosque directly.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button className="min-h-11" onClick={() => void load()}>
              Refresh status
            </Button>
            {status === "rejected" ? (
              <Button asChild variant="secondary" className="min-h-11">
                <Link to="/onboarding">Choose another mosque</Link>
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
