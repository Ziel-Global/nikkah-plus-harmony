import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchMyMosques } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const mosques = await fetchMyMosques();
    if (mosques.length === 0) throw redirect({ to: "/dashboard" });
    return { mosques };
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-3xl p-8 text-center text-foreground">
      We could not load the mosque admin area. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-8 text-center text-foreground">Page not found.</div>
  ),
  component: () => <Outlet />,
});
