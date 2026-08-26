import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, MessageSquare, Search, ShieldCheck } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signOutAndRedirect } from "@/hooks/useSession";
import { friendlyError } from "@/lib/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Complete your registration — Nikkah+" },
      {
        name: "description",
        content:
          "Verify your account, choose your mosque and accept the Nikkah+ terms to complete your registration.",
      },
      { property: "og:title", content: "Complete your registration — Nikkah+" },
      {
        property: "og:description",
        content:
          "Verify your account and choose your mosque to complete your Nikkah+ registration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

type Profile = {
  id: string;
  phone: string | null;
  gender: string | null;
  verification_method: string | null;
  phone_verified_at: string | null;
  terms_accepted_at: string | null;
};

type Step = "verify" | "gender" | "mosque" | "terms";

const STEP_LABELS: Record<Step, string> = {
  verify: "Verify your account",
  gender: "About you",
  mosque: "Choose your mosque",
  terms: "Our commitments to each other",
};

const STEP_ORDER: Step[] = ["verify", "gender", "mosque", "terms"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasAffiliation, setHasAffiliation] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const u = userData.user ?? null;
    setUser(u);
    if (!u) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, phone, gender, verification_method, phone_verified_at, terms_accepted_at")
      .eq("id", u.id)
      .maybeSingle();

    // Carry the phone number captured at sign-up onto the profile row.
    const metaPhone = (u.user_metadata?.["phone"] as string | undefined)?.trim();
    if (profileData && !profileData.phone && metaPhone) {
      await supabase.from("profiles").update({ phone: metaPhone }).eq("id", u.id);
      profileData.phone = metaPhone;
    }
    setProfile(profileData as Profile | null);

    const { data: affiliation } = await supabase
      .from("mosque_affiliation_requests")
      .select("id, status")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setHasAffiliation(Boolean(affiliation && affiliation.status !== "rejected"));

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const emailConfirmed = Boolean(user?.email_confirmed_at);
  const phoneConfirmed = Boolean(profile?.phone_verified_at);
  const verified =
    (profile?.verification_method === "phone" && phoneConfirmed) ||
    (profile?.verification_method === "email" && emailConfirmed) ||
    emailConfirmed;

  const step: Step = useMemo(() => {
    if (!verified) return "verify";
    if (!profile?.gender) return "gender";
    if (!hasAffiliation) return "mosque";
    if (!profile?.terms_accepted_at) return "terms";
    return "terms";
  }, [verified, profile, hasAffiliation]);

  useEffect(() => {
    if (!loading && verified && profile?.gender && hasAffiliation && profile?.terms_accepted_at) {
      navigate({ to: "/pending" });
    }
  }, [loading, verified, profile, hasAffiliation, navigate]);

  if (loading || !user) {
    return (
      <AuthShell title="One moment" intro="Loading your registration…">
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
      </AuthShell>
    );
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <AuthShell
      wide
      title={STEP_LABELS[step]}
      intro={
        <>
          Step {stepIndex + 1} of {STEP_ORDER.length}. Take your time — this registration is a
          serious step, and we'll guide you through each part.
        </>
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
      <div className="mb-6 flex gap-1.5" aria-hidden>
        {STEP_ORDER.map((s, i) => (
          <span
            key={s}
            className={cn("h-1.5 flex-1 rounded-full", i <= stepIndex ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>

      {step === "verify" ? (
        <VerifyStep user={user} profile={profile} onDone={load} />
      ) : step === "gender" ? (
        <GenderStep userId={user.id} onDone={load} />
      ) : step === "mosque" ? (
        <MosqueStep userId={user.id} onDone={load} />
      ) : (
        <TermsStep userId={user.id} onDone={load} />
      )}
    </AuthShell>
  );
}

/* ---------------------------------------------------------------- verify */

function VerifyStep({
  user,
  profile,
  onDone,
}: {
  user: User;
  profile: Profile | null;
  onDone: () => Promise<void>;
}) {
  const [choice, setChoice] = useState<"email" | "phone" | null>(
    (profile?.verification_method as "email" | "phone" | null) ?? null,
  );
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [smsUnavailable, setSmsUnavailable] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function chooseEmail() {
    setError(null);
    setBusy(true);
    setChoice("email");
    await supabase.from("profiles").update({ verification_method: "email" }).eq("id", user.id);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: user.email!,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    setBusy(false);
    if (resendError) {
      setError(
        "We couldn't send the confirmation email just now. Please wait a moment and try again.",
      );
      return;
    }
    setEmailSent(true);
  }

  async function choosePhone() {
    setError(null);
    setChoice("phone");
    await supabase.from("profiles").update({ verification_method: "phone" }).eq("id", user.id);
  }

  async function sendOtp() {
    setError(null);
    const trimmed = phone.trim();
    if (!/^\+[0-9]{7,15}$/.test(trimmed.replace(/[\s()-]/g, ""))) {
      setError("Please enter your number in international format, e.g. +447700900000.");
      return;
    }
    setBusy(true);
    const { error: otpError } = await supabase.auth.updateUser({
      phone: trimmed.replace(/[\s()-]/g, ""),
    });
    setBusy(false);
    if (otpError) {
      // Most commonly: no SMS provider configured in Supabase Auth yet.
      setSmsUnavailable(true);
      setError(
        "SMS verification isn't available at the moment. Please verify by email instead — you can add your phone number later.",
      );
      return;
    }
    setOtpSent(true);
  }

  async function confirmOtp() {
    setError(null);
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: phone.trim().replace(/[\s()-]/g, ""),
      token: otp.trim(),
      type: "phone_change",
    });
    if (verifyError) {
      setBusy(false);
      setError("That code wasn't right, or it has expired. Please try again.");
      return;
    }
    await supabase
      .from("profiles")
      .update({
        phone: phone.trim().replace(/[\s()-]/g, ""),
        phone_verified_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setBusy(false);
    await onDone();
  }

  async function recheckEmail() {
    setBusy(true);
    await supabase.auth.refreshSession();
    await onDone();
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Verifying your account helps us keep Nikkah+ safe and genuine for everyone. Choose how you'd
        like to confirm it's really you.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard
          selected={choice === "email"}
          icon={<Mail className="size-5" />}
          title="Verify by email"
          description={`We'll send a confirmation link to ${user.email}.`}
          onClick={() => void chooseEmail()}
          disabled={busy}
        />
        <ChoiceCard
          selected={choice === "phone"}
          icon={<MessageSquare className="size-5" />}
          title="Verify by phone (SMS)"
          description={
            smsUnavailable
              ? "Currently unavailable — please verify by email."
              : "We'll text you a one-time code."
          }
          onClick={() => void choosePhone()}
          disabled={busy || smsUnavailable}
        />
      </div>

      {choice === "email" ? (
        <div className="rounded-lg border border-border bg-muted p-4">
          <p className="text-sm text-foreground">
            {emailSent
              ? "We've sent a confirmation link to your inbox. Please open it, then return here."
              : "Please open the confirmation link we emailed you, then return here."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button className="min-h-11" onClick={() => void recheckEmail()} disabled={busy}>
              I've confirmed my email
            </Button>
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => void chooseEmail()}
              disabled={busy}
            >
              Resend link
            </Button>
          </div>
        </div>
      ) : null}

      {choice === "phone" && !smsUnavailable ? (
        <div className="space-y-4 rounded-lg border border-border bg-muted p-4">
          <div className="space-y-2">
            <Label htmlFor="otp-phone">Mobile number</Label>
            <Input
              id="otp-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+447700900000"
              disabled={otpSent}
            />
          </div>

          {otpSent ? (
            <div className="space-y-2">
              <Label htmlFor="otp-code">One-time code</Label>
              <Input
                id="otp-code"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={10}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {otpSent ? (
              <>
                <Button className="min-h-11" onClick={() => void confirmOtp()} disabled={busy}>
                  {busy ? "Checking…" : "Confirm code"}
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => setOtpSent(false)}
                  disabled={busy}
                >
                  Change number
                </Button>
              </>
            ) : (
              <Button className="min-h-11" onClick={() => void sendOtp()} disabled={busy}>
                {busy ? "Sending…" : "Send code"}
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function ChoiceCard({
  selected,
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-24 flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
        selected
          ? "border-primary bg-accent"
          : "border-border bg-card hover:border-secondary hover:bg-accent",
        disabled && "cursor-not-allowed opacity-60",
      )}
      aria-pressed={selected}
    >
      <span className="text-primary">{icon}</span>
      <span className="text-h3 text-foreground">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </button>
  );
}

/* ---------------------------------------------------------------- gender */

function GenderStep({ userId, onDone }: { userId: string; onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(gender: "male" | "female") {
    if (gender !== "male" && gender !== "female") return;
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ gender, role: gender === "male" ? "male_user" : "female_user" })
      .eq("id", userId);
    setBusy(false);
    if (updateError) {
      setError(friendlyError(updateError, "We couldn't save that just now. Please try again."));
      return;
    }
    await onDone();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Nikkah+ keeps the experience separate and respectful for brothers and sisters. Please select
        which applies to you — this cannot be changed later without contacting your mosque.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard
          selected={false}
          icon={<ShieldCheck className="size-5" />}
          title="Brother"
          description="I am registering as a male member."
          onClick={() => void choose("male")}
          disabled={busy}
        />
        <ChoiceCard
          selected={false}
          icon={<ShieldCheck className="size-5" />}
          title="Sister"
          description="I am registering as a female member."
          onClick={() => void choose("female")}
          disabled={busy}
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- mosque */

type Mosque = { id: string; name: string; city: string | null; country: string | null };

function MosqueStep({ userId, onDone }: { userId: string; onDone: () => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Mosque | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      let builder = supabase
        .from("mosques")
        .select("id, name, city, country")
        .eq("status", "active")
        .order("name")
        .limit(25);
      if (query.trim()) builder = builder.ilike("name", `%${query.trim()}%`);
      const { data } = await builder;
      if (!cancelled) {
        setMosques((data ?? []) as Mosque[]);
        setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  async function confirm() {
    if (!selected || !mosques.some((m) => m.id === selected.id)) {
      setError("Please choose a mosque from the list.");
      return;
    }
    setBusy(true);
    setError(null);

    // Surface an existing pending request before hitting the unique index.
    const { data: existing } = await supabase
      .from("mosque_affiliation_requests")
      .select("id, status")
      .eq("user_id", userId)
      .eq("mosque_id", selected.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      setBusy(false);
      setError(
        "You already have a pending request with this mosque. Please wait for them to review it.",
      );
      return;
    }

    const { error: insertError } = await supabase.from("mosque_affiliation_requests").insert({
      user_id: userId,
      mosque_id: selected.id,
      status: "pending",
    });
    if (insertError) {
      setBusy(false);
      setError(
        friendlyError(insertError, "We couldn't send your request just now. Please try again."),
      );
      return;
    }
    await supabase.from("profiles").update({ mosque_id: selected.id }).eq("id", userId);
    setBusy(false);
    await onDone();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Your mosque verifies that you're known to the community. Search for the mosque you attend
        most regularly — an administrator there will review your request.
      </p>

      <div className="space-y-2">
        <Label htmlFor="mosque-search">Search mosques</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="mosque-search"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mosque name or masjid"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : mosques.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No mosques matched that search. Try a different spelling, or ask your mosque to register
            with Nikkah+.
          </p>
        ) : (
          mosques.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m)}
              className={cn(
                "flex w-full min-h-14 flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors",
                selected?.id === m.id
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-secondary hover:bg-accent",
              )}
              aria-pressed={selected?.id === m.id}
            >
              <span className="font-semibold text-foreground">{m.name}</span>
              <span className="text-sm text-muted-foreground">
                {[m.city, m.country].filter(Boolean).join(", ")}
              </span>
            </button>
          ))
        )}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        className="min-h-11 w-full"
        onClick={() => void confirm()}
        disabled={!selected || busy}
      >
        {busy ? "Sending request…" : "Request verification from this mosque"}
      </Button>
    </div>
  );
}

/* ----------------------------------------------------------------- terms */

function TermsStep({ userId, onDone }: { userId: string; onDone: () => Promise<void> }) {
  const [accepted, setAccepted] = useState(false);
  const [intention, setIntention] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", userId);
    setBusy(false);
    if (updateError) {
      setError(friendlyError(updateError, "We couldn't save your acceptance. Please try again."));
      return;
    }
    await onDone();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Nikkah+ exists for one purpose: to help Muslims marry with dignity, family involvement and
        the support of their mosque. Please read and confirm the following before continuing.
      </p>

      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>
          <Link
            to="/terms"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Terms of Use
          </Link>
        </li>
        <li>
          <Link
            to="/privacy"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
        </li>
        <li>
          <Link
            to="/community-guidelines"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Community Guidelines
          </Link>
        </li>
      </ul>

      <div className="space-y-4 rounded-lg border border-border bg-muted p-4">
        <label className="flex items-start gap-3 text-sm text-foreground">
          <Checkbox
            checked={intention}
            onCheckedChange={(v) => setIntention(v === true)}
            className="mt-0.5"
          />
          <span>I confirm this registration is for the purpose of marriage.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-foreground">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
          />
          <span>
            I have read and accept the Terms of Use, Privacy Policy and Community Guidelines.
          </span>
        </label>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        className="min-h-11 w-full"
        onClick={() => void accept()}
        disabled={!accepted || !intention || busy}
      >
        {busy ? "Saving…" : "Accept and continue"}
      </Button>
    </div>
  );
}
