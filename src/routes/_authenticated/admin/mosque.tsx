import { useEffect, useState } from "react";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_META, type AdminMosque } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/mosque")({
  head: () =>
    ADMIN_META("Mosque profile", "Keep your mosque's details up to date on Marriage Database."),
  component: MosquePage,
});

type MosqueRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
};

const EMPTY = {
  name: "",
  address: "",
  city: "",
  country: "",
  contact_email: "",
  contact_phone: "",
  description: "",
};

function MosquePage() {
  const { mosques } = useRouteContext({ from: "/_authenticated/admin" }) as {
    mosques: AdminMosque[];
  };
  const queryClient = useQueryClient();
  const [mosqueId, setMosqueId] = useState(mosques[0]?.id ?? "");
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "mosque", mosqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosques")
        .select("id, name, address, city, country, contact_email, contact_phone, description")
        .eq("id", mosqueId)
        .maybeSingle();
      if (error) throw error;
      return data as MosqueRow | null;
    },
    enabled: Boolean(mosqueId),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      country: data.country ?? "",
      contact_email: data.contact_email ?? "",
      contact_phone: data.contact_phone ?? "",
      description: data.description ?? "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("mosques")
        .update({
          name: form.name.trim(),
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          contact_email: form.contact_email.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          description: form.description.trim() || null,
        })
        .eq("id", mosqueId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mosque details saved.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "mosque"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const field = (key: keyof typeof EMPTY, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        className="min-h-11"
        value={form[key]}
        onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
        {...props}
      />
    </div>
  );

  return (
    <AdminShell
      title="Mosque profile"
      description="Members see these details when choosing a mosque and when a profile shows its mosque affiliation."
    >
      {mosques.length > 1 && (
        <div className="mb-5 max-w-sm space-y-2">
          <Label htmlFor="mosque-select">Mosque</Label>
          <Select value={mosqueId} onValueChange={setMosqueId}>
            <SelectTrigger id="mosque-select" className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mosques.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <form
          className="surface-card grid max-w-3xl gap-4 rounded-xl border border-border p-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className="sm:col-span-2">{field("name", "Mosque name")}</div>
          <div className="sm:col-span-2">{field("address", "Address")}</div>
          {field("city", "City")}
          {field("country", "Country")}
          {field("contact_email", "Contact email", { type: "email" })}
          {field("contact_phone", "Contact phone", { type: "tel" })}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="A short introduction to your mosque and its marriage services."
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              className="min-h-11"
              disabled={save.isPending || form.name.trim().length < 2}
            >
              Save mosque details
            </Button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
