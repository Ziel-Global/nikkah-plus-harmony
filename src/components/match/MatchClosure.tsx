import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Outcome = "mutual_agreement" | "declined";

type FeedbackState = {
  my_submitted: boolean;
  my_outcome: Outcome | null;
  my_notes: string | null;
  their_submitted: boolean;
  both_submitted: boolean;
  request_status: string;
};

const OUTCOME_LABEL: Record<Outcome, string> = {
  mutual_agreement: "We wish to proceed towards marriage",
  declined: "We have decided not to continue",
};

export function MatchClosure({
  requestId,
  counterpartName,
}: {
  requestId: string;
  counterpartName: string;
}) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | "">("");
  const [notes, setNotes] = useState("");

  const stateQuery = useQuery({
    queryKey: ["match-feedback", requestId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_match_feedback_state", {
        p_request_id: requestId,
      });
      if (error) throw error;
      const rows = (data ?? []) as FeedbackState[];
      return rows[0] ?? null;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!outcome) throw new Error("Please choose an outcome first.");
      const { error } = await supabase.from("match_feedback").insert({
        request_id: requestId,
        user_id: user!.id,
        feedback_outcome: outcome,
        feedback_notes: notes.trim() === "" ? null : notes.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setNotes("");
      void queryClient.invalidateQueries({ queryKey: ["match-feedback", requestId] });
      void queryClient.invalidateQueries({ queryKey: ["active-match"] });
      void queryClient.invalidateQueries({ queryKey: ["interest-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["has-active-match"] });
      toast.success("Your feedback has been recorded confidentially.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (stateQuery.isPending) return <Skeleton className="h-24 w-full rounded-lg" />;

  const state = stateQuery.data;
  if (!state) return null;

  if (state.my_submitted) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Check className="h-4 w-4" aria-hidden="true" />
          You submitted your feedback
          {state.my_outcome ? ` — “${OUTCOME_LABEL[state.my_outcome]}”` : ""}.
        </p>
        {state.both_submitted ? (
          <p className="text-sm text-muted-foreground">
            Both of you have responded, so this introduction is now closed. You are free to browse
            and send new requests again.
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Waiting on the other member to submit their feedback before the match closes.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Your notes remain confidential. The other member never sees what you wrote or chose.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {state.their_submitted
          ? `${counterpartName} has submitted their feedback. The match closes once you submit yours.`
          : "When you are ready to conclude, submit your feedback. The match closes once both of you have responded."}
      </p>
      <Button className="min-h-11" onClick={() => setOpen(true)}>
        Submit feedback and close
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conclude this introduction</DialogTitle>
            <DialogDescription>
              Share your outcome with Nikkah+. Your answer is confidential — {counterpartName} will
              only be told that the match has closed.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={outcome}
            onValueChange={(value) => setOutcome(value as Outcome)}
            className="gap-3"
          >
            {(Object.keys(OUTCOME_LABEL) as Outcome[]).map((key) => (
              <div key={key} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <RadioGroupItem value={key} id={`outcome-${key}`} className="mt-0.5" />
                <Label htmlFor={`outcome-${key}`} className="text-sm font-normal text-foreground">
                  {OUTCOME_LABEL[key]}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Textarea
            rows={4}
            maxLength={800}
            value={notes}
            placeholder="Optional notes for the record (private)"
            onChange={(event) => setNotes(event.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="min-h-11"
              disabled={submit.isPending || outcome === ""}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? "Recording…" : "Submit feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
