import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  htmlFor,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  htmlFor?: string | undefined;
  error?: string | null | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-caption">{hint}</p>
      ) : null}
    </div>
  );
}

export function ReadOnlyValue({ value }: { value: ReactNode }) {
  return (
    <p className="min-h-11 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground">
      {value === null || value === undefined || value === "" ? (
        <span className="text-muted-foreground">Not shared</span>
      ) : (
        value
      )}
    </p>
  );
}

export function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  onBlur,
  error,
  readOnly,
  type = "text",
  placeholder,
  max,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: (() => void) | undefined;
  error?: string | null | undefined;
  readOnly?: boolean;
  type?: string;
  placeholder?: string;
  max?: number;
}) {
  return (
    <Field label={label} hint={hint} htmlFor={id} error={error}>
      {readOnly ? (
        <ReadOnlyValue value={value} />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          maxLength={max}
          aria-invalid={error ? true : undefined}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          className={cn("min-h-11", error && "border-destructive")}
        />
      )}
    </Field>
  );
}

export function SelectField({
  id,
  label,
  hint,
  value,
  options,
  onChange,
  error,
  readOnly,
  placeholder = "Please choose",
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  error?: string | null | undefined;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint} htmlFor={id} error={error}>
      {readOnly ? (
        <ReadOnlyValue value={value} />
      ) : (
        <select
          id={id}
          value={value}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            error && "border-destructive",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  readOnly,
  rows = 4,
  limit,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null | undefined;
  readOnly?: boolean;
  rows?: number;
  limit?: number;
  placeholder?: string;
}) {
  const overLimit = limit ? value.length > limit : false;
  return (
    <Field label={label} hint={hint} htmlFor={id} error={error}>
      {readOnly ? (
        <ReadOnlyValue value={value} />
      ) : (
        <>
          <Textarea
            id={id}
            rows={rows}
            value={value}
            placeholder={placeholder}
            maxLength={limit}
            aria-invalid={error || overLimit ? true : undefined}
            onChange={(e) => onChange(e.target.value)}
            className={cn((error || overLimit) && "border-destructive")}
          />
          {limit ? (
            <p
              className={cn(
                "text-caption text-right",
                value.length >= limit && "font-semibold text-destructive",
              )}
            >
              {value.length} / {limit}
            </p>
          ) : null}
        </>
      )}
    </Field>
  );
}

export function ToggleField({
  id,
  label,
  hint,
  checked,
  onChange,
  readOnly,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted p-4">
      <div>
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        {hint ? <p className="text-caption mt-1">{hint}</p> : null}
      </div>
      <Switch id={id} checked={checked} disabled={readOnly} onCheckedChange={onChange} />
    </div>
  );
}

export function TagField({
  id,
  label,
  hint,
  values,
  onChange,
  readOnly,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  values: string[];
  onChange: (v: string[]) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setDraft("");
  }

  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="space-y-2">
        {values.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {values.map((v) => (
              <li
                key={v}
                className="inline-flex items-center gap-1.5 rounded-full bg-tertiary px-3 py-1 text-sm text-tertiary-foreground"
              >
                {v}
                {readOnly ? null : (
                  <button
                    type="button"
                    aria-label={`Remove ${v}`}
                    onClick={() => onChange(values.filter((x) => x !== v))}
                    className="text-tertiary-foreground/70 hover:text-tertiary-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : readOnly ? (
          <ReadOnlyValue value="" />
        ) : null}

        {readOnly ? null : (
          <div className="flex gap-2">
            <Input
              id={id}
              value={draft}
              placeholder={placeholder}
              className="min-h-11"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  add();
                }
              }}
            />
            <button
              type="button"
              onClick={add}
              className={cn(
                "min-h-11 shrink-0 rounded-lg border border-border px-4 text-sm font-semibold",
                "text-primary transition-colors hover:bg-accent",
              )}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </Field>
  );
}
