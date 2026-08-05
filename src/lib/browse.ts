import type { Database } from "@/integrations/supabase/types";

export type BrowseProfile = Database["public"]["Functions"]["browse_profiles"]["Returns"][number];

export type BrowseFilters = {
  minAge: number;
  maxAge: number;
  country: string;
  city: string;
  nationality: string;
  education: string;
  marital: string;
  practice: string;
  languages: string;
  relocate: string;
  mosque: string;
  profession: string;
  family: string;
  page: number;
};

export const DEFAULT_FILTERS: BrowseFilters = {
  minAge: 18,
  maxAge: 70,
  country: "",
  city: "",
  nationality: "",
  education: "",
  marital: "",
  practice: "",
  languages: "",
  relocate: "",
  mosque: "",
  profession: "",
  family: "",
  page: 1,
};

export const PAGE_SIZE = 12;

const clean = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export function toRpcArgs(filters: BrowseFilters) {
  const languages = filters.languages
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    p_min_age: filters.minAge,
    p_max_age: filters.maxAge,
    p_country: clean(filters.country) ?? undefined,
    p_city: clean(filters.city) ?? undefined,
    p_nationality: clean(filters.nationality) ?? undefined,
    p_education: clean(filters.education) ?? undefined,
    p_marital: clean(filters.marital) ?? undefined,
    p_practice: clean(filters.practice) ?? undefined,
    p_languages: languages.length > 0 ? languages : undefined,
    p_relocate: filters.relocate === "yes" ? true : filters.relocate === "no" ? false : undefined,
    p_mosque: clean(filters.mosque) ?? undefined,
    p_profession: clean(filters.profession) ?? undefined,
    p_family_keyword: clean(filters.family) ?? undefined,
    p_limit: PAGE_SIZE,
    p_offset: (Math.max(1, filters.page) - 1) * PAGE_SIZE,
  };
}

export function activeFilterCount(filters: BrowseFilters) {
  let count = 0;
  if (filters.minAge !== DEFAULT_FILTERS.minAge || filters.maxAge !== DEFAULT_FILTERS.maxAge)
    count += 1;
  for (const key of [
    "country",
    "city",
    "nationality",
    "education",
    "marital",
    "practice",
    "languages",
    "relocate",
    "mosque",
    "profession",
    "family",
  ] as const) {
    if (filters[key].trim() !== "") count += 1;
  }
  return count;
}

/** Widen a precise age into a respectful band for card summaries. */
export function ageBand(age: number | null) {
  if (age == null) return "Age not shared";
  const lower = Math.floor(age / 5) * 5;
  return `${lower}–${lower + 4} years`;
}
