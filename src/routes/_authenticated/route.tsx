import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchAccessState, resolveRedirect } from "@/lib/access";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const access = await fetchAccessState();

    if (!access.userId) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }

    const target = resolveRedirect(access, location.pathname);
    if (target && target !== location.pathname) {
      throw redirect({ to: target, replace: true });
    }

    return { access, user: { id: access.userId } };
  },
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  ),
  component: () => <Outlet />,
});
