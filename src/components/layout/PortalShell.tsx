import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { signOutAndRedirect, useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

export type PortalNavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
  search?: Record<string, unknown>;
};

function NavList({
  items,
  onNavigate,
}: {
  items: PortalNavItem[];
  onNavigate?: (() => void) | undefined;
}) {
  return (
    <nav aria-label="Portal" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          search={item.search as never}
          activeOptions={{ exact: item.exact ?? false }}
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-primary data-[status=active]:border-primary data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function SidebarBody({
  items,
  badge,
  homeTo,
  roleLabel,
  onNavigate,
}: {
  items: PortalNavItem[];
  badge?: string | undefined;
  homeTo: string;
  roleLabel?: string | undefined;
  onNavigate?: (() => void) | undefined;
}) {
  const { user } = useSession();

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-4">
        <Link
          to={homeTo}
          onClick={onNavigate}
          aria-label="Marriage Database home"
          className="min-w-0"
        >
          <Logo variant="lockup" />
        </Link>
        {badge ? (
          <span className="w-fit rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {badge}
          </span>
        ) : null}
      </div>

      <NavList items={items} onNavigate={onNavigate} />

      <div className="border-t border-border p-3">
        <div className="min-w-0 px-2 pb-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {user?.email ?? "Signed in"}
          </p>
          {roleLabel ? <p className="text-xs text-muted-foreground">{roleLabel}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void signOutAndRedirect()}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-primary transition-colors hover:bg-accent"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function PortalShell({
  items,
  badge,
  homeTo,
  roleLabel,
  title,
  description,
  actions,
  footerNote,
  wide = false,
  children,
}: {
  items: PortalNavItem[];
  badge?: string | undefined;
  homeTo: string;
  roleLabel?: string | undefined;
  title: string;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  footerNote?: ReactNode | undefined;
  wide?: boolean | undefined;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-background lg:block xl:w-[272px]">
        <SidebarBody items={items} badge={badge} homeTo={homeTo} roleLabel={roleLabel} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody
            items={items}
            badge={badge}
            homeTo={homeTo}
            roleLabel={roleLabel}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col lg:pl-64 xl:pl-[272px]">
        <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-primary transition-colors hover:bg-accent lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title}</p>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className={cn("mx-auto w-full", wide ? "max-w-6xl" : "max-w-4xl")}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <div className="min-w-0">
                <h1 className="text-h2 text-foreground">{title}</h1>
                {description ? (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              {actions}
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </main>

        {footerNote ? (
          <footer className="border-t border-border bg-background">
            <div className="px-4 py-4 text-caption sm:px-6 lg:px-8">{footerNote}</div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
