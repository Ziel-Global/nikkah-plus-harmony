import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ContactState = {
  my_consent: boolean;
  their_consent: boolean;
  both_consented: boolean;
  my_name: string | null;
  my_phone: string | null;
  my_email: string | null;
  their_name: string | null;
  their_phone: string | null;
  their_email: string | null;
};

function ContactCard({
  label,
  name,
  phone,
  email,
}: {
  label: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted p-4 text-sm text-foreground">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{name ?? "Mosque-verified member"}</p>
      <div className="mt-2 space-y-1 text-muted-foreground">
        {phone && (
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <a className="underline-offset-4 hover:underline" href={`tel:${phone}`}>
              {phone}
            </a>
          </p>
        )}
        {email && (
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <a className="underline-offset-4 hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
          </p>
        )}
        {!phone && !email && <p>No contact details recorded.</p>}
      </div>
    </div>
  );
}

export function ContactConsent({
  requestId,
  counterpartName,
}: {
  requestId: string;
  counterpartName: string;
}) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stateQuery = useQuery({
    queryKey: ["contact-consent", requestId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_match_contact_state", {
        p_request_id: requestId,
      });
      if (error) throw error;
      const rows = (data ?? []) as ContactState[];
      return rows[0] ?? null;
    },
  });

  const consent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contact_consents").insert({
        request_id: requestId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["contact-consent", requestId] });
      toast.success("Your consent has been recorded.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (stateQuery.isPending) return <Skeleton className="h-24 w-full rounded-lg" />;

  const state = stateQuery.data;
  if (!state) return null;

  if (state.both_consented) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Both of you have consented — contact details are now shared.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ContactCard
            label={`${state.their_name ?? counterpartName}'s details`}
            name={state.their_name}
            phone={state.their_phone}
            email={state.their_email}
          />
          <ContactCard
            label="Shared with them"
            name={state.my_name}
            phone={state.my_phone}
            email={state.my_email}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Please involve your wali in any contact from here. Your mosque admins cannot see these
          details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state.my_consent ? (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Check className="h-4 w-4" aria-hidden="true" />
            You have given your consent.
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Waiting for the other member to confirm.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {state.their_consent
              ? `${counterpartName} has consented to sharing contact details. Nothing has been shared with you yet.`
              : "Neither of you has consented yet. Nothing is shared until both of you confirm."}
          </p>
          <Button className="min-h-11" onClick={() => setConfirmOpen(true)}>
            I allow my contact details to be shared
          </Button>
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm contact sharing</DialogTitle>
            <DialogDescription>
              I allow the platform to share my contact details with {counterpartName}. Their details
              will be shared with me only once they confirm the same. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="min-h-11"
              disabled={consent.isPending}
              onClick={() => consent.mutate()}
            >
              {consent.isPending ? "Recording…" : "Yes, I consent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
