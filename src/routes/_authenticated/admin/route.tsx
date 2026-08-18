import { createFileRoute, Outlet } from "@tanstack/react-router";
import { fetchMyMosques } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const mosques = await fetchMyMosques();
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
  component: AdminArea,
});

function AdminArea() {
  const { mosques } = Route.useRouteContext();

  if (mosques.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-border bg-muted p-6 text-center">
          <h1 className="text-h3 text-foreground">You haven't been assigned to a mosque yet</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your account has mosque administrator access, but no mosque has been linked to it.
            Please contact your platform administrator to be assigned to a mosque.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
