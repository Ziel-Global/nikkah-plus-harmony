import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({
  title,
  intro,
  children,
  footer,
  wide = false,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" aria-label="Marriage Database home">
          <Logo variant="lockup" />
        </Link>
      </header>

      <main className="mx-auto w-full flex-1 px-4 pb-16 sm:px-6">
        <div className={wide ? "mx-auto w-full max-w-2xl" : "mx-auto w-full max-w-md"}>
          <div className="surface-card p-6 sm:p-8">
            <h1 className="text-h2 text-foreground">{title}</h1>
            {intro ? <div className="text-body mt-3 text-muted-foreground">{intro}</div> : null}
            <div className="mt-6">{children}</div>
          </div>
          {footer ? (
            <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </div>
      </main>

      <footer className="border-t border-border bg-muted">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 text-caption sm:px-6">
          Marriage Database — Faith. Family. Future. Your details are kept private and are only ever
          shared with your mosque for verification.
        </div>
      </footer>
    </div>
  );
}
