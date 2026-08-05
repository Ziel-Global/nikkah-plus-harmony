import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LifeBuoy, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { formatDate, type InterestRequestRow } from "@/lib/requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/match")({
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
      { title: "Your active match — Nikkah+" },
      {
        name: "description",
        content:
          "Your active Nikkah+ introduction: involve your wali, escalate to your mosque, and move forward with intention.",
      },
      { property: "og:title", content: "Your active match — Nikkah+" },
      {
        property: "og:description",
        content: "Your active Nikkah+ introduction, guided by your mosque and your wali.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-3xl p-8 text-center text-foreground">
      We could not load your match. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-8 text-center">This page is unavailable.</div>
  ),
  component: MatchPage,
});

function Panel({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="surface-card rounded-xl border border-border p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-h3 text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

function MatchPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [escalateOpen, setEscalateOpen] = useState(false);

  const matchQuery = useQuery({
    queryKey: ["active-match"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_my_interest_requests");
      if (error) throw error;
      const rows = (data ?? []) as InterestRequestRow[];
      return rows.find((r) => r.status === "active_match") ?? null;
    },
  });

  const match = matchQuery.data ?? null;

  const waliQuery = useQuery({
    queryKey: ["my-wali", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("marriage_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!profile) return null;
      const { data } = await supabase
        .from("wali_details")
        .select("name, relationship, contact_phone, contact_email, approval_preferences")
        .eq("profile_id", profile.id)
        .maybeSingle();
      return data ?? null;
    },
  });

  const escalationsQuery = useQuery({
    queryKey: ["escalations", match?.id],
    enabled: Boolean(match?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escalations")
        .select("id, reason, status, created_at")
        .eq("request_id", match!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const escalate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("escalations").insert({
        request_id: match!.id,
        raised_by: user!.id,
        reason: reason.trim() === "" ? null : reason.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEscalateOpen(false);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["escalations", match?.id] });
      toast.success("Your mosque admin has been asked to step in.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (matchQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-80 w-full rounded-xl" />
      </main>
    );
  }

  if (!match) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-display text-foreground">No active match</h1>
        <p className="mt-3 text-body text-muted-foreground">
          When an interest request is accepted, this is where you and the other member will find
          your shared next steps.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="min-h-11">
            <Link to="/requests">See your requests</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  const place = [match.counterpart_city, match.counterpart_country].filter(Boolean).join(", ");
  const wali = waliQuery.data;
  const escalations = escalationsQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <Link
        to="/requests"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All requests
      </Link>

      <div className="surface-card mt-5 rounded-xl border border-border p-6">
        <Badge>Active match</Badge>
        <h1 className="mt-3 text-display text-foreground">
          You and {match.counterpart_name ?? "a mosque-verified member"}
        </h1>
        <p className="mt-1 text-body text-muted-foreground">
          {[match.counterpart_age ? `${match.counterpart_age} years` : null, place]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {match.counterpart_mosque_name && (
          <p className="text-body text-muted-foreground">
            Verified by {match.counterpart_mosque_name}
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          Accepted {formatDate(match.responded_at ?? match.created_at)}. Nikkah+ does not provide
          open messaging — conversation happens through your families and mosques, with the
          structured steps below.
        </p>
        {match.counterpart_profile_id && (
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link
              to="/member/$profileId"
              params={{ profileId: match.counterpart_profile_id }}
            >
              View their profile
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-5">
        <Panel
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          title="Involve your wali"
          description="Your guardian is central to this process. Share the details of this introduction with them before taking any further step."
        >
          {waliQuery.isPending ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : wali ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-sm text-foreground">
              <p className="font-semibold">
                {wali.name ?? "Your wali"}
                {wali.relationship ? ` · ${wali.relationship}` : ""}
              </p>
              {(wali.contact_phone || wali.contact_email) && (
                <p className="mt-1 text-muted-foreground">
                  {[wali.contact_phone, wali.contact_email].filter(Boolean).join(" · ")}
                </p>
              )}
              {wali.approval_preferences && (
                <p className="mt-2 text-muted-foreground">{wali.approval_preferences}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                These details are visible only to you and your mosque. Nikkah+ does not contact
                your wali on your behalf.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              You have not recorded wali details yet.{" "}
              <Link to="/profile" className="font-semibold text-primary underline-offset-4 hover:underline">
                Add them to your profile
              </Link>
              .
            </div>
          )}
        </Panel>

        <Panel
          icon={<LifeBuoy className="h-4 w-4" aria-hidden="true" />}
          title="Ask your mosque admin to step in"
          description="If you need guidance, feel uncomfortable, or would like your mosque to mediate, raise it here and an admin will be notified."
        >
          {escalations.length > 0 && (
            <ul className="mb-4 space-y-2">
              {escalations.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-border bg-muted p-3 text-sm text-foreground"
                >
                  <span className="font-semibold">
                    {e.status === "open" ? "Open with your mosque" : "Resolved"}
                  </span>
                  <span className="text-muted-foreground"> · {formatDate(e.created_at)}</span>
                  {e.reason && <p className="mt-1 text-muted-foreground">{e.reason}</p>}
                </li>
              ))}
            </ul>
          )}
          <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="min-h-11">
                Escalate to my mosque
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Raise this with your mosque</DialogTitle>
                <DialogDescription>
                  Tell your mosque admin what you would like help with. They will see this
                  introduction and your note.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                rows={5}
                maxLength={800}
                value={reason}
                placeholder="Optional — what would you like guidance on?"
                onChange={(e) => setReason(e.target.value)}
              />
              <DialogFooter>
                <Button variant="outline" className="min-h-11" onClick={() => setEscalateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="min-h-11"
                  disabled={escalate.isPending}
                  onClick={() => escalate.mutate()}
                >
                  {escalate.isPending ? "Sending…" : "Notify my mosque"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Panel>

        <Panel
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          title="Sharing contact details"
          description="Contact details are exchanged only when both of you, with your walis, explicitly agree to it. Nothing is shared until both confirmations are recorded."
        >
          <ContactConsent
            requestId={match.id}
            counterpartName={match.counterpart_name ?? "this member"}
          />
        </Panel>

        <Panel
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          title="Concluding this introduction"
          description="When you have reached a decision together, you will each submit confidential feedback and the match will close. This step is being prepared."
        >
          <Button variant="outline" className="min-h-11" disabled>
            Submit feedback and close — coming soon
          </Button>
        </Panel>
      </div>
    </main>
  );
}
