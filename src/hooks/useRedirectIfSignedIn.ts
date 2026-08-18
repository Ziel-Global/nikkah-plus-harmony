import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { fetchAccessState, landingPath } from "@/lib/access";

/**
 * Public auth pages (/auth, /register, /reset-password) use this to bounce an
 * already-signed-in user to the portal that matches their role. Returns false
 * until the check has resolved so no form flashes before a redirect.
 */
export function useRedirectIfSignedIn() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const access = await fetchAccessState();
      if (cancelled) return;
      if (access.userId) {
        navigate({ to: landingPath(access), replace: true });
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return ready;
}
