import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/AuthShell";
import { signOutAndRedirect } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/deactivated")({
  head: () => ({
    meta: [{ title: "Account deactivated — Marriage Database" }],
  }),
  component: DeactivatedPage,
});

function DeactivatedPage() {
  return (
    <AuthShell
      title="Your account is deactivated"
      intro="Your account is currently deactivated."
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
          Your profile is fully hidden from the platform and cannot be found by other members.
        </p>
        <p className="text-sm text-muted-foreground">
          If you wish to return, please contact your mosque administrator to reactivate your account.
        </p>
      </div>
    </AuthShell>
  );
}
