import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validateOptionalEmail, validatePhone } from "@/lib/validation";
import { logActivity } from "@/lib/superadmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export type Mosque = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
  status: string;
  created_at?: string;
};

type Props = {
  mosque: Mosque | null;
  onOpenChange: (open: boolean) => void;
};

export function EditMosqueModal({ mosque, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Omit<Mosque, "id" | "created_at">>({
    name: "",
    address: "",
    city: "",
    country: "",
    contact_email: "",
    contact_phone: "",
    description: "",
    status: "approved",
  });

  useEffect(() => {
    if (mosque) {
      setForm({
        name: mosque.name ?? "",
        address: mosque.address ?? "",
        city: mosque.city ?? "",
        country: mosque.country ?? "",
        contact_email: mosque.contact_email ?? "",
        contact_phone: mosque.contact_phone ?? "",
        description: mosque.description ?? "",
        status: mosque.status ?? "approved",
      });
    }
  }, [mosque]);

  const nameError = form.name.trim().length < 2 ? "Please enter the mosque name." : null;
  const emailError = validateOptionalEmail(form.contact_email ?? "");
  const phoneError =
    form.contact_phone && form.contact_phone.trim() !== ""
      ? validatePhone(form.contact_phone)
      : null;

  const isValid = !nameError && !emailError && !phoneError;

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!mosque) return;

      const payload = {
        name: form.name.trim(),
        address: form.address?.trim() || null,
        city: form.city?.trim() || null,
        country: form.country?.trim() || null,
        contact_email: form.contact_email?.trim() || null,
        contact_phone: form.contact_phone?.trim() || null,
        description: form.description?.trim() || null,
        status: form.status as "suspended" | "pending" | "active",
      };

      const { error } = await supabase.from("mosques").update(payload).eq("id", mosque.id);

      if (error) throw error;

      await logActivity("update_mosque", "mosques", mosque.id, {
        changes: payload,
      });
    },
    onSuccess: () => {
      toast.success("Mosque details updated successfully.");
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={Boolean(mosque)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Mosque Details</DialogTitle>
          <DialogDescription>
            Update official details, contact information, and affiliation status.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid) updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="edit-name">Mosque name *</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. East London Mosque"
              className="mt-1"
            />
            {nameError ? <p className="mt-1 text-xs text-destructive">{nameError}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                value={form.city ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="London"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={form.country ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="United Kingdom"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-address">Street address</Label>
            <Input
              id="edit-address"
              value={form.address ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="82-92 Whitechapel Rd"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-email">Contact email</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.contact_email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                placeholder="info@elmosque.org"
                className="mt-1"
              />
              {emailError ? <p className="mt-1 text-xs text-destructive">{emailError}</p> : null}
            </div>
            <div>
              <Label htmlFor="edit-phone">Contact phone</Label>
              <Input
                id="edit-phone"
                value={form.contact_phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                placeholder="+44 20 7426 3720"
                className="mt-1"
              />
              {phoneError ? <p className="mt-1 text-xs text-destructive">{phoneError}</p> : null}
            </div>
          </div>

          <div>
            <Label htmlFor="edit-status">Affiliation Status</Label>
            <Select
              value={form.status}
              onValueChange={(val) => setForm((f) => ({ ...f, status: val }))}
            >
              <SelectTrigger id="edit-status" className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-description">Description / Notes</Label>
            <Textarea
              id="edit-description"
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Internal notes or community description..."
              rows={3}
              className="mt-1"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
