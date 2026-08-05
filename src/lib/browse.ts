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

type RpcArgs = Record<string, string | number | boolean | string[]>;

export function toRpcArgs(filters: BrowseFilters): RpcArgs {
  const languages = filters.languages
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  const args: RpcArgs = {
    p_min_age: filters.minAge,
    p_max_age: filters.maxAge,
    p_limit: PAGE_SIZE,
    p_offset: (Math.max(1, filters.page) - 1) * PAGE_SIZE,
  };

  const text: [string, string][] = [
    ["p_country", filters.country],
    ["p_city", filters.city],
    ["p_nationality", filters.nationality],
    ["p_education", filters.education],
    ["p_marital", filters.marital],
    ["p_practice", filters.practice],
    ["p_mosque", filters.mosque],
    ["p_profession", filters.profession],
    ["p_family_keyword", filters.family],
  ];
  for (const [key, value] of text) {
    const v = clean(value);
    if (v) args[key] = v;
  }

  if (languages.length > 0) args['p_languages'] = languages;
  if (filters.relocate === "yes") args['p_relocate'] = true;
  if (filters.relocate === "no") args['p_relocate'] = false;

  return args;
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
