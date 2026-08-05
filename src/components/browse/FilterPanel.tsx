import { useEffect, useState } from "react";
import type { BrowseFilters } from "@/lib/browse";
import { DEFAULT_FILTERS } from "@/lib/browse";
import {
  EDUCATION_LEVELS,
  MARITAL_STATUS,
  PRACTICE_LEVELS,
} from "@/lib/profile-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Mosque = { id: string; name: string };

type Props = {
  filters: BrowseFilters;
  mosques: Mosque[];
  onApply: (next: BrowseFilters) => void;
  onReset: () => void;
};

const ANY = "__any";

export function FilterPanel({ filters, mosques, onApply, onReset }: Props) {
  const [draft, setDraft] = useState<BrowseFilters>(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const set = <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const selectField = (
    label: string,
    key: "education" | "marital" | "practice" | "mosque" | "relocate",
    options: { value: string; label: string }[],
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={draft[key] === "" ? ANY : draft[key]}
        onValueChange={(v) => set(key, v === ANY ? "" : v)}
      >
        <SelectTrigger className="min-h-11">
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const textField = (
    label: string,
    key: "country" | "city" | "nationality" | "profession" | "languages" | "family",
    placeholder: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`filter-${key}`}>{label}</Label>
      <Input
        id={`filter-${key}`}
        className="min-h-11"
        value={draft[key]}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  return (
    <form
      className="surface-card space-y-5 rounded-xl border border-border p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onApply({ ...draft, page: 1 });
      }}
    >
      <div>
        <h2 className="text-h3 text-foreground">Refine your search</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Narrow things gently — every member here has been verified by their mosque.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-min-age">Age from</Label>
          <Input
            id="filter-min-age"
            className="min-h-11"
            type="number"
            min={18}
            max={99}
            value={draft.minAge}
            onChange={(e) => set("minAge", Number(e.target.value) || DEFAULT_FILTERS.minAge)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-max-age">Age to</Label>
          <Input
            id="filter-max-age"
            className="min-h-11"
            type="number"
            min={18}
            max={99}
            value={draft.maxAge}
            onChange={(e) => set("maxAge", Number(e.target.value) || DEFAULT_FILTERS.maxAge)}
          />
        </div>
      </div>

      {textField("Country", "country", "e.g. United Kingdom")}
      {textField("City", "city", "e.g. Birmingham")}
      {textField("Nationality", "nationality", "e.g. Pakistani")}
      {selectField(
        "Education",
        "education",
        EDUCATION_LEVELS.map((v) => ({ value: v, label: v })),
      )}
      {selectField(
        "Marital status",
        "marital",
        MARITAL_STATUS.map((v) => ({ value: v, label: v })),
      )}
      {selectField(
        "Religious practice",
        "practice",
        PRACTICE_LEVELS.map((v) => ({ value: v, label: v })),
      )}
      {textField("Languages", "languages", "e.g. Urdu, Arabic")}
      {selectField("Open to relocating", "relocate", [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ])}
      {selectField(
        "Mosque",
        "mosque",
        mosques.map((m) => ({ value: m.id, label: m.name })),
      )}
      {textField("Profession", "profession", "e.g. Teacher")}
      {textField("Family background", "family", "Keyword, e.g. Gujarati")}

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Button type="submit" className="min-h-11 flex-1">
          Apply filters
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            setDraft(DEFAULT_FILTERS);
            onReset();
          }}
        >
          Clear
        </Button>
      </div>
    </form>
  );
}
