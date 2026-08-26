import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Flag, LifeBuoy, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_META, OVERSIGHT_NOTE, type AdminMosque } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () =>
    ADMIN_META("Overview", "Verification and oversight tools for your mosque on Nikkah+."),
  component: AdminOverview,
});

async function fetchCounts(mosqueIds: string[]) {
  const [pending, members, matches, escalations] = await Promise.all([
    supabase
      .from("mosque_affiliation_requests")
      .select("id", { count: "exact", head: true })
      .in("mosque_id", mosqueIds)
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("mosque_id", mosqueIds),
    supabase
      .from("interest_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "active_match"),
    supabase.from("escalations").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  return {
    pending: pending.count ?? 0,
    members: members.count ?? 0,
    matches: matches.count ?? 0,
    escalations: escalations.count ?? 0,
  };
}

function AdminOverview() {
  const { mosques } = useRouteContext({ from: "/_authenticated/admin" }) as {
    mosques: AdminMosque[];
  };
  const mosqueIds = mosques.map((m) => m.id);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "counts", mosqueIds],
    queryFn: () => fetchCounts(mosqueIds),
  });

  const cards = [
    {
      label: "Pending affiliation requests",
      value: data?.pending,
      to: "/admin/affiliations",
      icon: ClipboardCheck,
      hint: "Members waiting for your verification.",
    },
    {
      label: "Linked members",
      value: data?.members,
      to: "/admin/members",
      icon: Users,
      hint: "People affiliated with your mosque.",
    },
    {
      label: "Active matches",
      value: data?.matches,
      to: "/admin/matches",
      icon: ShieldCheck,
      hint: "Visible for oversight only.",
    },
    {
      label: "Open escalations",
      value: data?.escalations,
      to: "/admin/escalations",
      icon: LifeBuoy,
      hint: "Members asking for your support.",
    },
  ] as const;

  return (
    <AdminShell
      title={mosques.map((m) => m.name).join(", ")}
      description={`Verification and oversight workspace. ${OVERSIGHT_NOTE}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="surface-card flex flex-col gap-2 rounded-xl border border-border p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <card.icon className="h-4 w-4 text-secondary" aria-hidden="true" />
              {card.label}
            </span>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <span className="text-3xl font-bold text-foreground">{card.value ?? 0}</span>
            )}
            <span className="text-xs text-muted-foreground">{card.hint}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="surface-card rounded-xl border border-border p-5">
          <h2 className="text-h3 text-foreground">What this workspace is for</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You confirm that members genuinely belong to your community, keep an eye on conduct, and
            support members who ask for help. Matches themselves stay entirely between the members
            and their families.
          </p>
        </div>
        <div className="surface-card rounded-xl border border-border p-5">
          <h2 className="text-h3 text-foreground">What you will never see</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Shared phone numbers and email addresses exchanged between matched members, and any
            private feedback they submit when a match closes, are never shown here.
          </p>
          <Link
            to="/admin/conduct"
            className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Report a conduct concern
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
