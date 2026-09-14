import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, User, MapPin, Briefcase, GraduationCap, Heart, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PROFILE_STATUS_LABEL, formatDay } from "@/lib/admin";
const friendlyError = (e: any, fallback?: string) => e?.message || fallback || "An error occurred";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export type RejectionHistory = {
  id: string;
  reason: string;
  rejected_at: string;
};

export type FullMarriageProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  status: string;
  city: string | null;
  country: string | null;
  profession: string | null;
  education_level: string | null;
  marital_status: string | null;
  religious_practice_level: string | null;
  sect_or_school_of_thought: string | null;
  languages_spoken: string[] | null;
  family_origin: string | null;
  family_values: string | null;
  household_background: string | null;
  preferred_spouse_criteria: string | null;
  willingness_to_relocate: boolean | null;
  expected_marriage_timeline: string | null;
  personal_bio: string | null;
  appearance_description: string | null;
  updated_at: string;
  wali_details: {
    name: string;
    relationship: string;
    contact_phone: string;
    contact_email: string;
    approval_preferences: string;
  }[];
  profile_rejection_history: RejectionHistory[];
};

export type ReviewMember = {
  id: string;
  email: string;
  phone: string | null;
  gender: string | null;
  full_name: string | null;
  account_status: string;
  created_at: string;
};

interface ProfileReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: ReviewMember | null;
  profile: FullMarriageProfile | null;
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-xs">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
        <Icon className="h-5 w-5 text-secondary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between border-b border-border py-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground sm:w-1/3 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground sm:w-2/3 text-left sm:text-right break-words">
        {value || "—"}
      </span>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="mt-4 first:mt-0">
      <p className="mb-1 text-sm font-semibold text-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

export function ProfileReviewModal({ isOpen, onClose, member, profile }: ProfileReviewModalProps) {
  const queryClient = useQueryClient();
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const approveMut = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const { error } = await supabase
        .from("marriage_profiles")
        .update({ status: "approved" })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile approved successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      onClose();
    },
    onError: (e: Error) => toast.error(friendlyError(e, "Could not approve profile.")),
  });

  const rejectMut = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const auth = await supabase.auth.getUser();
      const { error: histErr } = await supabase.from("profile_rejection_history" as any).insert({
        profile_id: profile.id,
        reason: rejectionReason,
        rejected_by: auth.data.user?.id,
      });
      if (histErr) throw histErr;

      const { error } = await supabase
        .from("marriage_profiles")
        .update({ status: "rejected" })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile rejected and returned to user.");
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      setRejectMode(false);
      setRejectionReason("");
      onClose();
    },
    onError: (e: Error) => toast.error(friendlyError(e, "Could not reject profile.")),
  });

  // Reset state when opening/closing
  if (!isOpen) return null;

  const handleClose = () => {
    setRejectMode(false);
    setRejectionReason("");
    onClose();
  };

  const rawWali = profile?.wali_details;
  const wali = Array.isArray(rawWali) ? rawWali[0] : rawWali;
  const history = profile?.profile_rejection_history || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-2xl p-0 gap-0">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              {member?.full_name ?? member?.email}
              {profile?.status && (
                <Badge variant={profile.status === "approved" ? "default" : "secondary"}>
                  {PROFILE_STATUS_LABEL[profile.status] ?? profile.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {profile?.display_name ? `Alias: ${profile.display_name}` : "No public alias set"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {!profile ? (
            <p className="text-muted-foreground text-center py-8">This member has not started a profile yet.</p>
          ) : (
            <div className="space-y-6">
              {/* Review Actions */}
              {profile.status === "submitted" && (
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                  <h3 className="font-bold mb-2">Pending Review</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This profile is waiting for your approval. Please review all fields, especially free-text and Wali details.
                  </p>
                  
                  {rejectMode ? (
                    <div className="space-y-3">
                      <Label htmlFor="reason">Rejection reason (sent to user)</Label>
                      <Textarea
                        id="reason"
                        placeholder="Please update your Wali contact details..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="bg-card"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setRejectMode(false)}>Cancel</Button>
                        <Button 
                          variant="destructive" 
                          disabled={rejectMut.isPending || !rejectionReason.trim()}
                          onClick={() => rejectMut.mutate()}
                        >
                          Confirm Rejection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => approveMut.mutate()} 
                        disabled={approveMut.isPending}
                        className="flex-1 sm:flex-none"
                      >
                        <Check className="mr-2 h-4 w-4" /> Approve Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setRejectMode(true)}
                        disabled={approveMut.isPending}
                      >
                        <X className="mr-2 h-4 w-4" /> Reject & Request Changes
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                  <h3 className="font-bold text-destructive mb-3">Rejection History</h3>
                  <div className="space-y-3">
                    {history.sort((a, b) => new Date(b.rejected_at).getTime() - new Date(a.rejected_at).getTime()).map(h => (
                      <div key={h.id} className="text-sm bg-card p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-1">{formatDay(h.rejected_at)}</p>
                        <p>{h.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Section title="Basic Identity" icon={User}>
                <Field label="Registration Email" value={member?.email} />
                <Field label="Registration Phone" value={member?.phone} />
                <Field label="Gender" value={member?.gender} />
                <Field label="Nationality" value={profile.country} />
                <Field label="City" value={profile.city} />
              </Section>

              <Section title="Personal Introduction" icon={Search}>
                <TextBlock label="Bio" value={profile.personal_bio} />
                <TextBlock label="Physical Description" value={profile.appearance_description} />
              </Section>

              <Section title="Education & Career" icon={GraduationCap}>
                <Field label="Education Level" value={profile.education_level} />
                <Field label="Profession" value={profile.profession} />
              </Section>

              <Section title="Religion & Culture" icon={MapPin}>
                <Field label="Practice Level" value={profile.religious_practice_level} />
                <Field label="School of Thought" value={profile.sect_or_school_of_thought} />
                <Field label="Languages" value={profile.languages_spoken?.join(", ")} />
                <TextBlock label="Family Origin" value={profile.family_origin} />
                <TextBlock label="Family Values" value={profile.family_values} />
                <TextBlock label="Household Background" value={profile.household_background} />
              </Section>

              <Section title="Marriage Preferences" icon={Heart}>
                <Field label="Marital Status" value={profile.marital_status} />
                <Field label="Timeline" value={profile.expected_marriage_timeline} />
                <Field label="Willing to Relocate" value={profile.willingness_to_relocate ? "Yes" : "No"} />
                <TextBlock label="Criteria" value={profile.preferred_spouse_criteria} />
              </Section>

              <Section title="Wali / Guardian Details" icon={Users}>
                {!wali ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No Wali details provided.</p>
                ) : (
                  <>
                    <Field label="Name" value={wali.name} />
                    <Field label="Relationship" value={wali.relationship} />
                    <Field label="Phone" value={wali.contact_phone} />
                    <Field label="Email" value={wali.contact_email} />
                    <TextBlock label="Approval Preferences" value={wali.approval_preferences} />
                  </>
                )}
              </Section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
