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

export type UserRow = {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  gender: string | null;
  mosque_id: string | null;
  account_status: string;
  mosques?: { name: string } | null;
};

type Props = {
  user: UserRow | null;
  onOpenChange: (open: boolean) => void;
};

export function EditUserModal({ user, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState("member");
  const [accountStatus, setAccountStatus] = useState("active");
  const [mosqueId, setMosqueId] = useState<string>("none");
  const [phone, setPhone] = useState("");

  const mosquesQuery = useQuery({
    queryKey: ["superadmin", "mosques-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mosques").select("id, name, city").order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (user) {
      setRole(user.role ?? "member");
      setAccountStatus(user.account_status ?? "active");
      setMosqueId(user.mosque_id ?? "none");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const payload = {
        role: (role === "male_user" ||
        role === "female_user" ||
        role === "mosque_admin" ||
        role === "super_admin"
          ? role
          : "male_user") as "male_user" | "female_user" | "mosque_admin" | "super_admin",
        account_status: accountStatus as "active" | "suspended" | "deactivated",
        mosque_id: mosqueId === "none" ? null : mosqueId,
        phone: phone.trim() || null,
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

      if (error) throw error;

      await logActivity("update_user_profile", "profiles", user.id, {
        from: {
          role: user.role,
          account_status: user.account_status,
          mosque_id: user.mosque_id,
        },
        to: payload,
      });
    },
    onSuccess: () => {
      toast.success("User details updated successfully.");
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update role permissions, account status, and mosque affiliation.
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
            <Label>User Email</Label>
            <Input value={user?.email ?? ""} disabled className="mt-1 bg-muted" />
          </div>

          <div>
            <Label htmlFor="edit-user-role">Platform Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="edit-user-role" className="mt-1">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male_user">Male Member</SelectItem>
                <SelectItem value="female_user">Female Member</SelectItem>
                <SelectItem value="mosque_admin">Mosque Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-user-status">Account Standing</Label>
            <Select value={accountStatus} onValueChange={setAccountStatus}>
              <SelectTrigger id="edit-user-status" className="mt-1">
                <SelectValue placeholder="Select account status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-user-mosque">Assigned Mosque</Label>
            <Select value={mosqueId} onValueChange={setMosqueId}>
              <SelectTrigger id="edit-user-mosque" className="mt-1">
                <SelectValue placeholder="Select mosque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Independent member)</SelectItem>
                {(mosquesQuery.data ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} {m.city ? `(${m.city})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-user-phone">Phone number</Label>
            <Input
              id="edit-user-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 7700 900077"
              className="mt-1"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
