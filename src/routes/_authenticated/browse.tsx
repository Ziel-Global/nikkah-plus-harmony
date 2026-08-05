import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signPublicPhotos } from "@/lib/browse.functions";
import {
  DEFAULT_FILTERS,
  PAGE_SIZE,
  activeFilterCount,
  toRpcArgs,
  type BrowseFilters,
} from "@/lib/browse";
import { FilterPanel } from "@/components/browse/FilterPanel";
import { ProfileCard } from "@/components/browse/ProfileCard";
import { ActiveMatchBanner } from "@/components/browse/ActiveMatchBanner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function num(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

export const Route = createFileRoute("/_authenticated/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseFilters => ({
    minAge: num(search['minAge'], DEFAULT_FILTERS.minAge),
    maxAge: num(search['maxAge'], DEFAULT_FILTERS.maxAge),
    country: str(search['country']),
    city: str(search['city']),
    nationality: str(search['nationality']),
    education: str(search['education']),
    marital: str(search['marital']),
    practice: str(search['practice']),
    languages: str(search['languages']),
    relocate: str(search['relocate']),
    mosque: str(search['mosque']),
    profession: str(search['profession']),
    family: str(search['family']),
    page: Math.max(1, num(search['page'], 1)),
  }),
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
      { title: "Browse members — Nikkah+" },
      {
        name: "description",
        content:
          "Browse mosque-verified Nikkah+ members with privacy respected on every profile.",
      },
      { property: "og:title", content: "Browse members — Nikkah+" },
      {
        property: "og:description",
        content: "Mosque-verified profiles, shared only as each member chose.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-3xl p-8 text-center text-foreground">
      We could not load members just now. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-8 text-center">No members found.</div>
  ),
  component: BrowsePage,
});

function BrowsePage() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });
  const signPhotos = useServerFn(signPublicPhotos);
  const [sheetOpen, setSheetOpen] = useState(false);

  const applyFilters = (next: BrowseFilters) => {
    void navigate({ search: () => next });
    setSheetOpen(false);
  };

  const mosquesQuery = useQuery({
    queryKey: ["mosques", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosques")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const matchQuery = useQuery({
    queryKey: ["has-active-match"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_active_match");
      if (error) throw error;
      return Boolean(data);
    },
  });

  const resultsQuery = useQuery({
    queryKey: ["browse", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("browse_profiles", toRpcArgs(filters) as never);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => resultsQuery.data ?? [], [resultsQuery.data]);
  const total = rows[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE));

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const paths = rows.map((r) => r.photo_url).filter((p): p is string => Boolean(p));
    if (paths.length === 0) {
      setPhotoUrls({});
      return;
    }
    let cancelled = false;
    signPhotos({ data: { paths } })
      .then((res) => {
        if (!cancelled) setPhotoUrls(res.urls);
      })
      .catch(() => {
        if (!cancelled) setPhotoUrls({});
      });
    return () => {
      cancelled = true;
    };
  }, [rows, signPhotos]);

  const filterPanel = (
    <FilterPanel
      filters={filters}
      mosques={mosquesQuery.data ?? []}
      onApply={applyFilters}
      onReset={() => applyFilters(DEFAULT_FILTERS)}
    />
  );

  const count = activeFilterCount(filters);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-6">
        <h1 className="text-display text-foreground">Members</h1>
        <p className="mt-2 max-w-2xl text-body text-muted-foreground">
          Each person here has been verified by their mosque. You will only see the details they
          have chosen to share openly — everything else stays with their mosque until an
          introduction is agreed.
        </p>
      </header>

      {matchQuery.data ? (
        <div className="mb-6">
          <ActiveMatchBanner />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{filterPanel}</div>
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {resultsQuery.isPending
                ? "Looking through profiles…"
                : `${total} ${Number(total) === 1 ? "member" : "members"} match your search`}
            </p>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="min-h-11 lg:hidden">
                  <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
                  Filters{count > 0 ? ` (${count})` : ""}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(92vw,22rem)] overflow-y-auto p-4">
                {filterPanel}
              </SheetContent>
            </Sheet>
          </div>

          {resultsQuery.isPending ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="surface-card rounded-xl border border-border p-8 text-center">
              <h2 className="text-h3 text-foreground">No matches just yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening the age range or clearing a filter or two. New members are verified
                by their mosques every week.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  photoUrl={profile.photo_url ? photoUrls[profile.photo_url] : undefined}
                />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Pagination">
              <Button
                variant="outline"
                className="min-h-11"
                disabled={filters.page <= 1}
                onClick={() => applyFilters({ ...filters, page: filters.page - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page} of {pageCount}
              </span>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={filters.page >= pageCount}
                onClick={() => applyFilters({ ...filters, page: filters.page + 1 })}
              >
                Next
              </Button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
