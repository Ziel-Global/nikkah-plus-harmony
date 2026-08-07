export const MARITAL_STATUS = [
  "Never married",
  "Divorced",
  "Widowed",
  "Separated",
] as const;

export const EDUCATION_LEVELS = [
  "Secondary school",
  "College / diploma",
  "Undergraduate degree",
  "Postgraduate degree",
  "Doctorate",
  "Islamic studies / hifz",
  "Other",
] as const;

export const EMPLOYMENT_STATUS = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Student",
  "Homemaker",
  "Seeking work",
  "Retired",
] as const;

export const PRACTICE_LEVELS = [
  "Practising — five daily prayers",
  "Practising — growing in consistency",
  "Moderately practising",
  "Learning and returning to the deen",
] as const;

export const SCHOOLS_OF_THOUGHT = [
  "Hanafi",
  "Maliki",
  "Shafi'i",
  "Hanbali",
  "Ja'fari",
  "No particular school",
  "Prefer not to say",
] as const;

export const MARRIAGE_TIMELINE = [
  "As soon as the right person is found",
  "Within 6 months",
  "Within a year",
  "Within two years",
  "Open — no fixed timeline",
] as const;

/**
 * Fields that can be individually toggled between "Public" (visible to matched
 * members) and "Mosque admin only" via `marriage_profiles.privacy_settings`.
 */
export const PRIVACY_FIELDS = [
  { key: "date_of_birth", label: "Date of birth" },
  { key: "nationality", label: "Nationality" },
  { key: "ethnicity", label: "Ethnicity" },
  { key: "city", label: "City" },
  { key: "area", label: "Area" },
  { key: "height_cm", label: "Height" },
  { key: "appearance_description", label: "Appearance" },
  { key: "profession", label: "Profession" },
  { key: "employment_status", label: "Employment status" },
  { key: "family_origin", label: "Family origin" },
  { key: "family_values", label: "Family values" },
  { key: "household_background", label: "Household background" },
  { key: "preferred_spouse_criteria", label: "Spouse preferences" },
  { key: "personal_bio", label: "Personal introduction" },
] as const;

export type PrivacyValue = "public" | "mosque_admin_only";
export type PrivacySettings = Record<string, PrivacyValue>;

export const BIO_LIMIT = 1000;

export const STATUS_COPY: Record<
  string,
  { label: string; tone: "muted" | "warning" | "success" | "destructive"; note: string }
> = {
  draft: {
    label: "Draft",
    tone: "muted",
    note: "Only you can see this. Take your time — you can save each section as you go.",
  },
  submitted: {
    label: "With your mosque",
    tone: "warning",
    note: "Your profile is with your mosque for review. You may still make changes; they will be reviewed together.",
  },
  mosque_verified: {
    label: "Verified by your mosque",
    tone: "warning",
    note: "Your mosque has verified your details. Final approval is being completed.",
  },
  approved: {
    label: "Approved",
    tone: "success",
    note: "Your profile is approved. It is shown read-only here — choose “Make changes” if something needs updating.",
  },
  rejected: {
    label: "Needs changes",
    tone: "destructive",
    note: "Your mosque has asked for some changes before this profile can be approved.",
  },
  inactive: {
    label: "Inactive",
    tone: "muted",
    note: "This profile is currently inactive.",
  },
};
