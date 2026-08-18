import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

const SECTION_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For mosques", href: "#for-mosques" },
  { label: "Trust & safety", href: "#trust" },
  { label: "FAQ", href: "#faq" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-muted">
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-secondary to-transparent" />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <Logo variant="lockup" />
            <p className="mt-3 text-sm text-muted-foreground">
              A community-based Muslim marriage platform, supported by your local mosque.
            </p>
          </div>

          <nav aria-label="Explore">
            <h3 className="text-h3 text-foreground">Explore</h3>
            <ul className="mt-3 space-y-1">
              {SECTION_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-h3 text-foreground">Legal</h3>
            <ul className="mt-3 space-y-1">
              <li>
                <Link
                  to="/terms"
                  className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/community-guidelines"
                  className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="text-h3 text-foreground">Contact</h3>
            {/* PLACEHOLDER — replace with real contact details */}
            <p className="mt-3 text-sm text-muted-foreground">
              [Contact email placeholder]
              <br />
              [Phone placeholder]
            </p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Social links placeholder">
              {["Ig", "Fb", "X", "Yt"].map((s) => (
                <span
                  key={s}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-secondary text-xs font-semibold text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="divider-gold my-8" />
        <p className="text-caption">© {year} Nikkah+. All rights reserved.</p>
      </div>
    </footer>
  );
}
