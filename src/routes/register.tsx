import { useState } from "react";
import { Check, X as XIcon } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PASSWORD_RULES,
  friendlyError,
  validateEmail,
  validatePassword,
  validatePhone,
} from "@/lib/validation";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Nikkah+" },
      {
        name: "description",
        content:
          "Create your Nikkah+ account and get verified by your local mosque to begin the search for a spouse.",
      },
      { property: "og:title", content: "Create your account — Nikkah+" },
      {
        property: "og:description",
        content: "Create your Nikkah+ account and get verified by your local mosque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^\+?[0-9\s()-]{7,20}$/.test(trimmedPhone)) {
      setError("Please enter a valid phone number, including your country code.");
      return;
    }
    if (password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { phone: trimmedPhone },
      },
    });
    setBusy(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      navigate({ to: "/onboarding" });
      return;
    }

    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <AuthShell
        title="Check your email"
        intro={
          <>
            We've sent a confirmation link to <strong className="text-foreground">{email}</strong>.
            Please open it to confirm your account, then sign in to continue your registration.
          </>
        }
        footer={
          <>
            Already confirmed? <Link to="/auth" className="font-semibold text-primary underline-offset-4 hover:underline">Sign in</Link>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          If the email hasn't arrived within a few minutes, please check your spam folder. Your
          details remain private until your mosque verifies your account.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      intro="Registration takes a few minutes. Your local mosque will verify you before any introductions can be made — nothing you share is public."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={255}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+44 7700 900000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            maxLength={20}
          />
          <p className="text-caption">
            Required for your record. It is never shown to other members and is only used for
            verification or by your mosque if needed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" className="min-h-11 w-full" disabled={busy}>
          {busy ? "Creating your account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
