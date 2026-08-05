import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_META, OVERSIGHT_NOTE } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ADMIN_META("Account settings", "Manage your mosque admin account on Nikkah+."),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "account"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You are not signed in.");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, phone, role, account_status")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data?.phone) setPhone(data.phone);
  }, [data]);

  const savePhone = useMutation({
    mutationFn: async () => {
      if (!data?.id) throw new Error("Account not loaded yet.");
      const { error } = await supabase
        .from("profiles")
        .update({ phone: phone.trim() || null })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact number updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "account"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (password !== confirm) throw new Error("The two passwords do not match.");
      if (password.length < 8) throw new Error("Use at least 8 characters.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated.");
      setPassword("");
      setConfirm("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AdminShell
      title="Account settings"
      description={`Your personal admin account. ${OVERSIGHT_NOTE}`}
    >
      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        <div className="grid max-w-3xl gap-6 lg:grid-cols-2">
          <section className="surface-card space-y-4 rounded-xl border border-border p-5">
            <h2 className="text-h3 text-foreground">Your details</h2>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={data?.email ?? ""} readOnly className="min-h-11 bg-muted" />
              <p className="text-xs text-muted-foreground">
                Contact the platform team to change the email on an admin account.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contact number</Label>
              <Input
                id="phone"
                type="tel"
                className="min-h-11"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Role: {data?.role ?? "mosque_admin"} · Status: {data?.account_status ?? "active"}
            </p>
            <Button
              className="min-h-11"
              disabled={savePhone.isPending}
              onClick={() => savePhone.mutate()}
            >
              Save details
            </Button>
          </section>

          <section className="surface-card space-y-4 rounded-xl border border-border p-5">
            <h2 className="text-h3 text-foreground">Change password</h2>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                className="min-h-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                className="min-h-11"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button
              className="min-h-11"
              disabled={changePassword.isPending || !password}
              onClick={() => changePassword.mutate()}
            >
              Update password
            </Button>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
