import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/superadmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AssignmentRow = {
  id: string;
  admin_id: string;
  mosque_id: string;
  created_at: string;
  profiles: { email: string; role: string } | null;
  mosques: { name: string } | null;
};

type Props = {
  assignment: AssignmentRow | null;
  onOpenChange: (open: boolean) => void;
};

export function EditMosqueAdminModal({ assignment, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [selectedMosqueId, setSelectedMosqueId] = useState("");

  const mosquesQuery = useQuery({
    queryKey: ["superadmin", "mosques-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mosques").select("id, name, city").order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(assignment),
  });

  useEffect(() => {
    if (assignment) {
      setSelectedMosqueId(assignment.mosque_id ?? "");
    }
  }, [assignment]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!assignment || !selectedMosqueId) return;

      const { error } = await supabase
        .from("mosque_admin_mosques")
        .update({ mosque_id: selectedMosqueId })
        .eq("id", assignment.id);

      if (error) throw error;

      // Update mosque_id on user profile as well
      await supabase
        .from("profiles")
        .update({ mosque_id: selectedMosqueId })
        .eq("id", assignment.admin_id);

      await logActivity("reassign_mosque_admin", "mosque_admin_mosques", assignment.id, {
        admin_id: assignment.admin_id,
        from_mosque_id: assignment.mosque_id,
        to_mosque_id: selectedMosqueId,
      });
    },
    onSuccess: () => {
      toast.success("Admin reassigned to mosque successfully.");
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={Boolean(assignment)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Mosque Admin</DialogTitle>
          <DialogDescription>
            Change the mosque that this administrator is assigned to manage.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label>Admin Email</Label>
            <Input
              value={assignment?.profiles?.email ?? "Unknown email"}
              disabled
              className="mt-1 bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="reassign-mosque">Assigned Mosque *</Label>
            <Select value={selectedMosqueId} onValueChange={setSelectedMosqueId}>
              <SelectTrigger id="reassign-mosque" className="mt-1">
                <SelectValue placeholder="Select mosque" />
              </SelectTrigger>
              <SelectContent>
                {(mosquesQuery.data ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} {m.city ? `(${m.city})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedMosqueId || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
