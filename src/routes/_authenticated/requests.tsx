import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowLeft, Inbox, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  formatDate,
  friendlyRequestError,
  STATUS_LABEL,
  type InterestRequestRow,
} from "@/lib/requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberShell } from "@/components/layout/MemberShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/requests")({
  beforeLoad: async () => {
    const { data } = await supabase
      .from("mosque_affiliation_requests")
      .select("status")
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();
    if (!data) throw redirect({ to: "/pending" });
  },
  head: () => ({
    meta: [
      { title: "Interest requests — Nikkah+" },
      {
        name: "description",
        content:
          "Review the introductions you have sent and received on Nikkah+, and reply with your mosque alongside you.",
      },
      { property: "og:title", content: "Interest requests — Nikkah+" },
      {
        property: "og:description",
        content: "Review the introductions you have sent and received on Nikkah+.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-3xl p-8 text-center text-foreground">
      We could not load your requests. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-8 text-center">This page is unavailable.</div>
  ),
  component: RequestsPage,
});

export function useMyRequests() {
  return useQuery({
    queryKey: ["interest-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_my_interest_requests");
      if (error) throw error;
      return (data ?? []) as InterestRequestRow[];
    },
  });
}

function RequestCard({
  request,
  children,
}: {
  request: InterestRequestRow;
  children?: React.ReactNode;
}) {
  const place = [request.counterpart_city, request.counterpart_country].filter(Boolean).join(", ");

  return (
    <article className="surface-card rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-h3 text-foreground">
            {request.counterpart_name ?? "A mosque-verified member"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {[request.counterpart_age ? `${request.counterpart_age} years` : null, place]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {request.counterpart_mosque_name && (
            <p className="text-sm text-muted-foreground">
              Verified by {request.counterpart_mosque_name}
            </p>
          )}
        </div>
        <Badge variant={request.status === "active_match" ? "default" : "secondary"}>
          {STATUS_LABEL[request.status]}
        </Badge>
      </div>

      {request.message && (
        <p className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
          “{request.message}”
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Sent {formatDate(request.created_at)}
        {request.responded_at ? ` · Answered ${formatDate(request.responded_at)}` : ""}
      </p>

      {children && <div className="mt-4 flex flex-wrap gap-3">{children}</div>}
    </article>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="surface-card rounded-xl border border-dashed border-border p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15 text-primary">
        {icon}
      </div>
      <h3 className="text-h3 text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function RequestsPage() {
  const queryClient = useQueryClient();
  const requestsQuery = useMyRequests();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const respond = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = await supabase.rpc("respond_to_interest_request", {
        p_request_id: id,
        p_accept: accept,
      });
      if (error) throw error;
      return accept;
    },
    onMutate: ({ id }) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: (accept) => {
      void queryClient.invalidateQueries({ queryKey: ["interest-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["active-match"] });
      toast.success(
        accept
          ? "You now have an active match. Your mosques have been notified."
          : "The request has been closed respectfully.",
      );
    },
    onError: (error: Error) => toast.error(friendlyRequestError(error.message)),
  });

  const CLOSED = ["closed_mutual", "closed_declined", "cancelled"] as const;
  const isClosed = (r: InterestRequestRow) => (CLOSED as readonly string[]).includes(r.status);
  const all = requestsQuery.data ?? [];
  const received = all.filter((r) => r.direction === "received" && !isClosed(r));
  const sent = all.filter((r) => r.direction === "sent" && !isClosed(r));
  const history = all.filter(isClosed);

  return (
    <MemberShell
      title="Interest requests"
      description="Every introduction here is known to your mosque. Take your time — there is no obligation to answer immediately, and declining is always an honourable choice."
    >
      {requestsQuery.isPending ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <Tabs defaultValue="received" className="mt-8">
          <TabsList className="w-full">
            <TabsTrigger value="received" className="flex-1">
              Received ({received.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1">
              Sent ({sent.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              History ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-5 space-y-4">
            {received.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-5 w-5" aria-hidden="true" />}
                title="No requests yet"
                body="When a mosque-verified member expresses interest, their request will appear here for your consideration."
              />
            ) : (
              received.map((request) => (
                <RequestCard key={request.id} request={request}>
                  {request.status === "submitted" ? (
                    <>
                      <Button
                        className="min-h-11"
                        disabled={pendingId === request.id}
                        onClick={() => respond.mutate({ id: request.id, accept: true })}
                      >
                        Accept introduction
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="min-h-11">
                            Decline
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The other member will simply be told the request has closed. No reason
                              is shared, and your decision remains private between you and your
                              mosque.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep it open</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => respond.mutate({ id: request.id, accept: false })}
                            >
                              Decline respectfully
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : request.status === "active_match" ? (
                    <Button asChild className="min-h-11">
                      <Link to="/match">Open active match</Link>
                    </Button>
                  ) : null}
                  {request.counterpart_profile_id && (
                    <Button asChild variant="ghost" className="min-h-11">
                      <Link
                        to="/member/$profileId"
                        params={{ profileId: request.counterpart_profile_id }}
                      >
                        View profile
                      </Link>
                    </Button>
                  )}
                </RequestCard>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-5 space-y-4">
            {sent.length === 0 ? (
              <EmptyState
                icon={<Send className="h-5 w-5" aria-hidden="true" />}
                title="Nothing sent yet"
                body="When you send an interest request from a member's profile, you will be able to follow it here."
              />
            ) : (
              sent.map((request) => (
                <RequestCard key={request.id} request={request}>
                  {request.status === "active_match" && (
                    <Button asChild className="min-h-11">
                      <Link to="/match">Open active match</Link>
                    </Button>
                  )}
                  {request.counterpart_profile_id && (
                    <Button asChild variant="ghost" className="min-h-11">
                      <Link
                        to="/member/$profileId"
                        params={{ profileId: request.counterpart_profile_id }}
                      >
                        View profile
                      </Link>
                    </Button>
                  )}
                </RequestCard>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-5 space-y-4">
            {history.length === 0 ? (
              <EmptyState
                icon={<Archive className="h-5 w-5" aria-hidden="true" />}
                title="No closed introductions yet"
                body="Once an introduction is concluded by both members, it will be kept here for your records."
              />
            ) : (
              history.map((request) => (
                <RequestCard key={request.id} request={request}>
                  {request.counterpart_profile_id && (
                    <Button asChild variant="ghost" className="min-h-11">
                      <Link
                        to="/member/$profileId"
                        params={{ profileId: request.counterpart_profile_id }}
                      >
                        View profile
                      </Link>
                    </Button>
                  )}
                </RequestCard>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </MemberShell>
  );
}
