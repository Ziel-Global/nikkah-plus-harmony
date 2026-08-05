import type { ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileSection({
  id,
  title,
  intro,
  children,
  onSave,
  saving,
  saved,
  readOnly,
  actions,
}: {
  id: string;
  title: string;
  intro?: string | undefined;
  children: ReactNode;
  onSave?: (() => void) | undefined;
  saving?: boolean | undefined;
  saved?: boolean | undefined;
  readOnly?: boolean | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <section id={id} className="surface-card scroll-mt-28 p-5 sm:p-7">
      <h2 className="text-h2 text-foreground">{title}</h2>
      {intro ? <p className="text-body mt-2 text-muted-foreground">{intro}</p> : null}
      <div className="mt-6 space-y-5">{children}</div>

      {onSave && !readOnly ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <Button type="button" className="min-h-11" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save this section
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <Check className="size-4" /> Saved
            </span>
          ) : null}
          {actions}
        </div>
      ) : null}
    </section>
  );
}
