import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Handshake, Inbox, Search, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";
import { DEFAULT_FILTERS } from "@/lib/browse";

export function MemberShell({
  title,
  description,
  actions,
  wide = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const unreadQuery = useQuery({
    queryKey: ["unread-incoming-requests"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return 0;
      const { count, error } = await supabase
        .from("interest_requests")
        .select("id", { count: "exact", head: true })
        .eq("target_id", auth.user.id)
        .eq("status", "submitted");
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 6000,
  });

  const unreadCount = unreadQuery.data ?? 0;

  const items: PortalNavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: Gauge, exact: true },
    { to: "/profile", label: "My profile", icon: UserRound },
    { to: "/browse", label: "Browse members", icon: Search, search: DEFAULT_FILTERS },
    { to: "/requests", label: "Interest requests", icon: Inbox, badgeCount: unreadCount },
    { to: "/match", label: "Active match", icon: Handshake },
  ];

  return (
    <PortalShell
      items={items}
      homeTo="/dashboard"
      roleLabel="Member"
      title={title}
      description={description}
      actions={actions}
      wide={wide}
      footerNote="Marriage Database — Faith. Family. Future. Your details stay private and are only shared with your mosque for verification."
    >
      {children}
    </PortalShell>
  );
}
