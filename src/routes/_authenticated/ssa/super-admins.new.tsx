import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BrandingEditor,
  brandingValueIsValid,
  emptyBrandingValue,
  type BrandingEditorValue,
} from "@/components/branding/BrandingEditor";
import { SsaShell } from "@/components/ssa/SsaShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { createSuperAdmin } from "@/lib/ssa.functions";
import { SSA_META } from "@/lib/ssa";
import {
  friendlyError,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequiredText,
} from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/ssa/super-admins/new")({
  head: () => SSA_META("New super admin", "Create a super admin circle with branding."),
  component: NewSuperAdminPage,
});

function NewSuperAdminPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [circleName, setCircleName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [branding, setBranding] = useState<BrandingEditorValue>(emptyBrandingValue);

  const emailError = email.trim() ? validateEmail(email) : null;
  const firstNameError = firstName.trim()
    ? validateRequiredText(firstName, "First name", 80)
    : null;
  const lastNameError = lastName.trim() ? validateRequiredText(lastName, "Last name", 80) : null;
  const circleError = circleName.trim()
    ? validateRequiredText(circleName, "Circle name", 120)
    : null;
  const phoneError = phone.trim() ? validatePhone(phone) : null;
  const passwordError = password ? validatePassword(password) : null;

  const incomplete =
    !email.trim() ||
    !firstName.trim() ||
    !lastName.trim() ||
    !circleName.trim() ||
    !phone.trim() ||
    !password ||
    Boolean(emailError || firstNameError || lastNameError || circleError || phoneError || passwordError) ||
    !brandingValueIsValid(branding);

  const create = useMutation({
    mutationFn: async () => {
      await createSuperAdmin({
        data: {
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          circle_name: circleName.trim(),
          phone: phone.trim(),
          password,
          branding: {
            primary_color: branding.primary_color,
            secondary_color: branding.secondary_color,
            button_bg_color: branding.button_bg_color,
            button_text_color: branding.button_text_color,
            button_hover_bg_color: branding.button_hover_bg_color,
            button_active_bg_color: branding.button_active_bg_color,
            success_color: branding.success_color,
            warning_color: branding.warning_color,
            error_color: branding.error_color,
            dark_mode_default: branding.dark_mode_default,
            logo_url: branding.logo_url,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success("Super admin created.");
      void navigate({ to: "/ssa/super-admins" });
    },
    onError: (error: Error) => toast.error(friendlyError(error)),
  });

  async function uploadLogo(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `tenants/new-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("branding")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw new Error(error.message);
    return path;
  }

  return (
    <SsaShell
      title="New super admin"
      description="Create a circle with login credentials and optional branding."
    >
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (!incomplete) create.mutate();
        }}
      >
        <section className="surface-card space-y-4 rounded-xl p-5">
          <h2 className="text-h3 text-foreground">Account details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sa-email">Email (login)</Label>
              <Input
                id="sa-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={emailError ? true : undefined}
              />
              {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-phone">Phone</Label>
              <Input
                id="sa-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={phoneError ? true : undefined}
              />
              {phoneError ? <p className="text-sm text-destructive">{phoneError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-first">First name</Label>
              <Input
                id="sa-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={firstNameError ? true : undefined}
              />
              {firstNameError ? <p className="text-sm text-destructive">{firstNameError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-last">Last name</Label>
              <Input
                id="sa-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-invalid={lastNameError ? true : undefined}
              />
              {lastNameError ? <p className="text-sm text-destructive">{lastNameError}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sa-circle">Circle name</Label>
              <Input
                id="sa-circle"
                value={circleName}
                onChange={(e) => setCircleName(e.target.value)}
                aria-invalid={circleError ? true : undefined}
              />
              {circleError ? <p className="text-sm text-destructive">{circleError}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sa-password">Password</Label>
              <PasswordInput
                id="sa-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={passwordError ? true : undefined}
                autoComplete="new-password"
              />
              {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-h3 text-foreground">Circle branding</h2>
          <BrandingEditor value={branding} onChange={setBranding} onUploadLogo={uploadLogo} />
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={incomplete || create.isPending}>
            {create.isPending ? "Creating…" : "Create super admin"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: "/ssa/super-admins" })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </SsaShell>
  );
}
