import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/AuthShell";
import { signOutAndRedirect } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/circle-unavailable")({
  head: () => ({
    meta: [{ title: "Service unavailable — Marriage Database" }],
  }),
  component: CircleUnavailablePage,
});

function CircleUnavailablePage() {
  return (
    <AuthShell
      title="This service is temporarily unavailable"
      intro="Access to this Marriage Database circle is currently paused."
      footer={
        <button
          type="button"
          onClick={() => void signOutAndRedirect()}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Sign out
        </button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your circle administrator has deactivated this service. You cannot use the platform until
          it is reactivated.
        </p>
        <p className="text-sm text-muted-foreground">
          If you believe this is an error, please contact your circle administrator.
        </p>
      </div>
    </AuthShell>
  );
}
