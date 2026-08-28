import { useState } from "react";
import { Check, X as XIcon } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getSiteOrigin } from "@/lib/config";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
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
import { useRedirectIfSignedIn } from "@/hooks/useRedirectIfSignedIn";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Marriage Database" },
      {
        name: "description",
        content:
          "Create your Marriage Database account and get verified by your local mosque to begin the search for a spouse.",
      },
      { property: "og:title", content: "Create your account — Marriage Database" },
      {
        property: "og:description",
        content: "Create your Marriage Database account and get verified by your local mosque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

const DUPLICATE_EMAIL_MESSAGE =
  "An account with this email may already exist. Try adding a unique email.";
const DUPLICATE_PHONE_MESSAGE =
  "This phone number is already registered. Try adding a unique phone number.";
const DUPLICATE_UNCLEAR_MESSAGE =
  "This email or phone number is already registered. Please use a unique email and phone number.";

function RegisterPage() {
  const navigate = useNavigate();
  const ready = useRedirectIfSignedIn();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const errors = {
    email: validateEmail(email),
    phone: validatePhone(phone),
    password: validatePassword(password),
    confirm: confirm !== password ? "The two passwords don't match." : null,
  };
  const formValid = Object.values(errors).every((v) => v === null);
  const show = (key: keyof typeof errors) => (touched[key] ? errors[key] : null);
  const blur = (key: string) => () => setTouched((t) => ({ ...t, [key]: true }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched({ email: true, phone: true, password: true, confirm: true });

    if (!formValid) return;

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${getSiteOrigin()}/onboarding`,
        data: { gender: null, role: null, phone: trimmedPhone },
      },
    });
    setBusy(false);

    if (signUpError) {
      const m =
        `${signUpError.message} ${(signUpError as { code?: string }).code ?? ""}`.toLowerCase();
      const phoneDuplicate =
        m.includes("profiles_phone_unique") ||
        (m.includes("phone") && (m.includes("unique") || m.includes("duplicate")));
      const emailDuplicate =
        !phoneDuplicate &&
        (m.includes("email") || m.includes("user already registered")) &&
        (m.includes("already") || m.includes("registered") || m.includes("unique"));
      const unclearDuplicate =
        (m.includes("duplicate key") || m.includes("23505")) &&
        (m.includes("already") || m.includes("unique") || m.includes("constraint"));

      if (phoneDuplicate) {
        setError(DUPLICATE_PHONE_MESSAGE);
      } else if (emailDuplicate) {
        setError(DUPLICATE_EMAIL_MESSAGE);
      } else if (unclearDuplicate) {
        setError(DUPLICATE_UNCLEAR_MESSAGE);
      } else {
        setError(
          friendlyError(signUpError, "We couldn't create your account just now. Please try again."),
        );
      }
      return;
    }

    // Supabase never errors on a duplicate signup (anti-enumeration): it returns
    // a success-shaped response with an empty `identities` array instead.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setError(DUPLICATE_EMAIL_MESSAGE);
      return;
    }

    if (data.session) {
      navigate({ to: "/onboarding" });
      return;
    }

    setEmailSent(true);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
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
            Already confirmed?{" "}
            <Link
              to="/auth"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
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
          <Link
            to="/auth"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
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
            onBlur={blur("email")}
            aria-invalid={show("email") ? true : undefined}
            className={cn(show("email") && "border-destructive")}
            required
            maxLength={255}
          />
          {show("email") ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {show("email")}
            </p>
          ) : null}
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
            onBlur={blur("phone")}
            aria-invalid={show("phone") ? true : undefined}
            className={cn(show("phone") && "border-destructive")}
            required
            maxLength={20}
          />
          {show("phone") ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {show("phone")}
            </p>
          ) : (
            <p className="text-caption">
              Required for your record. It is never shown to other members and is only used for
              verification or by your mosque if needed.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={blur("password")}
            aria-invalid={show("password") ? true : undefined}
            className={cn(show("password") && "border-destructive")}
            required
          />
          <ul className="space-y-1 pt-1">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    met ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {met ? (
                    <Check className="size-3.5 shrink-0" aria-hidden />
                  ) : (
                    <XIcon className="size-3.5 shrink-0" aria-hidden />
                  )}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={blur("confirm")}
            aria-invalid={show("confirm") ? true : undefined}
            className={cn(show("confirm") && "border-destructive")}
            required
          />
          {show("confirm") ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {show("confirm")}
            </p>
          ) : null}
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
