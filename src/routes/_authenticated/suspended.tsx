import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/AuthShell";
import { signOutAndRedirect } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/suspended")({
  head: () => ({
    meta: [{ title: "Account suspended — Marriage Database" }],
  }),
  component: SuspendedPage,
});

function SuspendedPage() {
  return (
    <AuthShell
      title="Your account has been suspended"
      intro="Your account has been suspended by an administrator for a violation of community guidelines."
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
          While suspended, you cannot access the platform, and your profile is hidden from all searches and matching.
        </p>
        <p className="text-sm text-muted-foreground">
          If you believe this is an error, please contact your mosque administrator.
        </p>
      </div>
    </AuthShell>
  );
}
