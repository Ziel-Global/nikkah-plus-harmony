import { useEffect, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signPublicPhotos } from "@/lib/browse.functions";
import { ageBand, type BrowseProfile } from "@/lib/browse";
import { ActiveMatchBanner } from "@/components/browse/ActiveMatchBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/member/$profileId")({
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
      { title: "Member profile — Nikkah+" },
      {
        name: "description",
        content: "A mosque-verified Nikkah+ member profile, shared exactly as they chose.",
      },
      { property: "og:title", content: "Member profile — Nikkah+" },
      {
        property: "og:description",
        content: "A mosque-verified Nikkah+ member profile.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-3xl p-8 text-center text-foreground">
      We could not open this profile. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-8 text-center">This profile is no longer available.</div>
  ),
  component: MemberDetailPage,
});

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="border-b border-border/60 py-3 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-body text-foreground">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card rounded-xl border border-border p-5">
      <h2 className="text-h3 text-foreground">{title}</h2>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

function MemberDetailPage() {
  const { profileId } = Route.useParams();
  const navigate = useNavigate();
  const signPhotos = useServerFn(signPublicPhotos);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["browse-profile", profileId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("browse_profiles", {
        p_profile_id: profileId,
        p_limit: 1,
      } as never);
      if (error) throw error;
      return ((data ?? []) as BrowseProfile[])[0] ?? null;
    },
  });

  const matchQuery = useQuery({
    queryKey: ["has-active-match"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_active_match");
      if (error) throw error;
      return Boolean(data);
    },
  });

  const profile = profileQuery.data ?? null;

  useEffect(() => {
    const path = profile?.photo_url;
    if (!path) {
      setPhotoUrl(null);
      return;
    }
    let cancelled = false;
    signPhotos({ data: { paths: [path] } })
      .then((res) => {
        if (!cancelled) setPhotoUrl(res.urls[path] ?? null);
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.photo_url, signPhotos]);

  const sendRequest = async () => {
    setSending(true);
    const { error } = await supabase.rpc("send_interest_request", {
      p_profile_id: profileId,
      p_message: message.trim() === "" ? undefined : message.trim(),
    } as never);
    setSending(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setDialogOpen(false);
    setSent(true);
    toast.success("Your interest request has been sent to your mosque and this member.");
  };

  if (profileQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <Skeleton className="h-96 w-full rounded-xl" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-display text-foreground">Profile unavailable</h1>
        <p className="mt-3 text-body text-muted-foreground">
          This member’s profile is no longer being shown. There are others waiting to be met.
        </p>
        <Button className="mt-6 min-h-11" onClick={() => void navigate({ to: "/browse" })}>
          Back to members
        </Button>
      </main>
    );
  }

  const location = [profile.area, profile.city, profile.country].filter(Boolean).join(", ");
  const hasMatch = Boolean(matchQuery.data);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <Link
        to="/browse"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to members
      </Link>

      <div className="mt-5 grid gap-6 md:grid-cols-[260px_1fr]">
        <div>
          <div className="aspect-4/5 w-full overflow-hidden rounded-xl border border-border bg-muted">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`Photograph shared publicly by ${profile.display_name ?? "this member"}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/15 px-4 text-center">
                <ImageOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">
                  {profile.has_hidden_photo
                    ? "Photograph shared only once an introduction is agreed"
                    : "No photograph shared"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-display text-foreground">{profile.display_name ?? "Member"}</h1>
          <p className="mt-1 text-body text-muted-foreground">{ageBand(profile.age)}</p>
          {location && <p className="text-body text-muted-foreground">{location}</p>}
          {profile.mosque_name && (
            <Badge variant="secondary" className="mt-3">
              Verified by {profile.mosque_name}
            </Badge>
          )}

          <div className="mt-5">
            {hasMatch ? (
              <ActiveMatchBanner />
            ) : sent ? (
              <p className="rounded-lg border border-border bg-muted p-4 text-sm text-foreground">
                Your interest request has been sent. Your mosque will be in touch with the next
                step, in shaa Allah.
              </p>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="min-h-11 w-full sm:w-auto">Send interest request</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send an interest request</DialogTitle>
                    <DialogDescription>
                      Your mosque will be notified alongside this member. You may add a short,
                      respectful note about why you feel there may be compatibility.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    value={message}
                    maxLength={500}
                    rows={5}
                    placeholder="Optional — a few sincere words for their consideration."
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <DialogFooter>
                    <Button
                      variant="outline"
                      className="min-h-11"
                      onClick={() => setDialogOpen(false)}
                    >
                      Not now
                    </Button>
                    <Button
                      className="min-h-11"
                      disabled={sending}
                      onClick={() => void sendRequest()}
                    >
                      {sending ? "Sending…" : "Send request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Section title="About">
          <Detail label="Marital status" value={profile.marital_status} />
          <Detail label="Nationality" value={profile.nationality} />
          <Detail label="Ethnicity" value={profile.ethnicity} />
          <Detail
            label="Height"
            value={profile.height_cm ? `${profile.height_cm} cm` : null}
          />
          <Detail label="Appearance" value={profile.appearance_description} />
        </Section>

        <Section title="Education & work">
          <Detail label="Education" value={profile.education_level} />
          <Detail label="Profession" value={profile.profession} />
          <Detail label="Employment" value={profile.employment_status} />
        </Section>

        <Section title="Faith">
          <Detail label="Practice" value={profile.religious_practice_level} />
          <Detail label="School of thought" value={profile.sect_or_school_of_thought} />
          <Detail
            label="Languages"
            value={profile.languages_spoken?.length ? profile.languages_spoken.join(", ") : null}
          />
        </Section>

        <Section title="Family">
          <Detail label="Family origin" value={profile.family_origin} />
          <Detail label="Family values" value={profile.family_values} />
          <Detail label="Household background" value={profile.household_background} />
        </Section>

        <Section title="Hopes for marriage">
          <Detail label="Looking for" value={profile.preferred_spouse_criteria} />
          <Detail label="Timeline" value={profile.expected_marriage_timeline} />
          <Detail
            label="Open to relocating"
            value={
              profile.willingness_to_relocate == null
                ? null
                : profile.willingness_to_relocate
                  ? "Yes"
                  : "No"
            }
          />
        </Section>

        <Section title="In their words">
          <Detail label="Introduction" value={profile.personal_bio} />
        </Section>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Some details are shared only with this member’s mosque. Contact details are never shown on
        Nikkah+ profiles — they are exchanged through your mosques once an introduction is agreed.
      </p>
    </main>
  );
}
