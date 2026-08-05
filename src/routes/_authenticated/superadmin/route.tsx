import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchIsSuperAdmin } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/superadmin")({
  beforeLoad: async () => {
    const ok = await fetchIsSuperAdmin();
    if (!ok) throw redirect({ to: "/dashboard" });
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-3xl p-8 text-center text-foreground">
      We could not load the platform admin area. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-8 text-center text-foreground">Page not found.</div>
  ),
  component: () => <Outlet />,
});
