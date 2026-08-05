import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ProfileRow = {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  gender: string | null;
  mosque_id: string | null;
  account_status: string;
  verification_method: string | null;
  phone_verified_at: string | null;
  terms_accepted_at: string | null;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

export async function signOutAndRedirect() {
  await supabase.auth.signOut();
  window.location.assign("/auth");
}
