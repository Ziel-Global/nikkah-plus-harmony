import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MemberShell } from "@/components/layout/MemberShell";
import { Button } from "@/components/ui/button";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { PrivacyPanel } from "@/components/profile/PrivacyPanel";
import { PhotoManager } from "@/components/profile/PhotoManager";
import {
  SelectField,
  TagField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/profile/fields";
import {
  BIO_LIMIT,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUS,
  MARITAL_STATUS,
  MARRIAGE_TIMELINE,
  PRACTICE_LEVELS,
  SCHOOLS_OF_THOUGHT,
  STATUS_COPY,
  type PrivacySettings,
} from "@/lib/profile-options";
import {
  friendlyError,
  validateDateOfBirth,
  validateHeight,
  validateOneOf,
  validateOptionalEmail,
  validatePhone,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

import type { Database } from "@/integrations/supabase/types";

type ProfileStatus = Database["public"]["Enums"]["profile_status_enum"];

export const Route = createFileRoute("/_authenticated/profile")({
  beforeLoad: async () => {
    const { data } = await supabase
      .from("mosque_affiliation_requests")
      .select("status")
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (!data) throw redirect({ to: "/pending" });
  },
  head: () => ({
    meta: [
      { title: "Your marriage profile — Nikkah+" },
      {
        name: "description",
        content:
          "Write your Nikkah+ marriage profile section by section, control who sees each detail, and submit it to your mosque for review.",
      },
      { property: "og:title", content: "Your marriage profile — Nikkah+" },
      {
        property: "og:description",
        content: "Write your marriage profile and submit it to your mosque for review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

type Form = {
  display_name: string;
  date_of_birth: string;
  marital_status: string;
  nationality: string;
  ethnicity: string;
  country: string;
  city: string;
  area: string;
  height_cm: string;
  appearance_description: string;
  education_level: string;
  profession: string;
  employment_status: string;
  religious_practice_level: string;
  sect_or_school_of_thought: string;
  languages_spoken: string[];
  family_origin: string;
  family_values: string;
  household_background: string;
  preferred_spouse_criteria: string;
  willingness_to_relocate: boolean;
  expected_marriage_timeline: string;
  personal_bio: string;
};

const EMPTY_FORM: Form = {
  display_name: "",
  date_of_birth: "",
  marital_status: "",
  nationality: "",
  ethnicity: "",
  country: "",
  city: "",
  area: "",
  height_cm: "",
  appearance_description: "",
  education_level: "",
  profession: "",
  employment_status: "",
  religious_practice_level: "",
  sect_or_school_of_thought: "",
  languages_spoken: [],
  family_origin: "",
  family_values: "",
  household_background: "",
  preferred_spouse_criteria: "",
  willingness_to_relocate: false,
  expected_marriage_timeline: "",
  personal_bio: "",
};

type Wali = {
  name: string;
  relationship: string;
  contact_phone: string;
  contact_email: string;
  approval_preferences: string;
};

const EMPTY_WALI: Wali = {
  name: "",
  relationship: "",
  contact_phone: "",
  contact_email: "",
  approval_preferences: "",
};

const SECTIONS = [
  { id: "basics", label: "Basics" },
  { id: "location", label: "Location" },
  { id: "physical", label: "Physical" },
  { id: "education", label: "Education & career" },
  { id: "religion", label: "Deen" },
  { id: "family", label: "Family" },
  { id: "preferences", label: "Preferences" },
  { id: "introduction", label: "Introduction" },
  { id: "wali", label: "Wali" },
  { id: "photos", label: "Photographs" },
  { id: "privacy", label: "Privacy" },
];

type SectionKey = (typeof SECTIONS)[number]["id"];

const SECTION_FIELDS: Record<string, (keyof Form)[]> = {
  basics: ["display_name", "date_of_birth", "marital_status", "nationality", "ethnicity"],
  location: ["country", "city", "area"],
  physical: ["height_cm", "appearance_description"],
  education: ["education_level", "profession", "employment_status"],
  religion: ["religious_practice_level", "sect_or_school_of_thought", "languages_spoken"],
  family: ["family_origin", "family_values", "household_background"],
  preferences: [
    "preferred_spouse_criteria",
    "willingness_to_relocate",
    "expected_marriage_timeline",
  ],
  introduction: ["personal_bio"],
};

function toDbValue(key: keyof Form, form: Form) {
  const value = form[key];
  if (key === "height_cm") {
    const n = Number.parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  if (key === "languages_spoken") return (value as string[]).length ? value : null;
  if (key === "willingness_to_relocate") return value as boolean;
  const s = String(value).trim();
  return s === "" ? null : s;
}

function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [wali, setWali] = useState<Wali>(EMPTY_WALI);
  const [privacy, setPrivacy] = useState<PrivacySettings>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const locked = status === "approved" && !unlocked;
  const statusCopy = STATUS_COPY[status] ?? STATUS_COPY["draft"]!;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("marriage_profiles")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (profile) {
      setProfileId(profile.id);
      setStatus(profile.status);
      setRejectionReason(profile.rejection_reason ?? null);
      setForm({
        display_name: profile.display_name ?? "",
        date_of_birth: profile.date_of_birth ?? "",
        marital_status: profile.marital_status ?? "",
        nationality: profile.nationality ?? "",
        ethnicity: profile.ethnicity ?? "",
        country: profile.country ?? "",
        city: profile.city ?? "",
        area: profile.area ?? "",
        height_cm: profile.height_cm ? String(profile.height_cm) : "",
        appearance_description: profile.appearance_description ?? "",
        education_level: profile.education_level ?? "",
        profession: profile.profession ?? "",
        employment_status: profile.employment_status ?? "",
        religious_practice_level: profile.religious_practice_level ?? "",
        sect_or_school_of_thought: profile.sect_or_school_of_thought ?? "",
        languages_spoken: profile.languages_spoken ?? [],
        family_origin: profile.family_origin ?? "",
        family_values: profile.family_values ?? "",
        household_background: profile.household_background ?? "",
        preferred_spouse_criteria: profile.preferred_spouse_criteria ?? "",
        willingness_to_relocate: profile.willingness_to_relocate ?? false,
        expected_marriage_timeline: profile.expected_marriage_timeline ?? "",
        personal_bio: profile.personal_bio ?? "",
      });
      setPrivacy((profile.privacy_settings as PrivacySettings | null) ?? {});

      const { data: waliRow } = await supabase
        .from("wali_details")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (waliRow) {
        setWali({
          name: waliRow.name ?? "",
          relationship: waliRow.relationship ?? "",
          contact_phone: waliRow.contact_phone ?? "",
          contact_email: waliRow.contact_email ?? "",
          approval_preferences: waliRow.approval_preferences ?? "",
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Editing an approved (or mosque-verified) profile sends it back for review. */
  function nextStatusOnEdit(current: string): ProfileStatus {
    return current === "approved" || current === "mosque_verified"
      ? "submitted"
      : (current as ProfileStatus);
  }

  async function ensureProfile(patch: Record<string, unknown>) {
    if (!userId) return null;
    if (profileId) return profileId;

    const { data, error } = await supabase
      .from("marriage_profiles")
      .insert({ user_id: userId, status: "draft", ...patch })
      .select("id")
      .single();

    if (error || !data) {
      toast.error("We couldn't start your profile just now. Please try again.");
      return null;
    }
    setProfileId(data.id);
    return data.id;
  }

  const fieldErrors = useMemo(() => {
    return {
      display_name:
        form.display_name.length > 0 && form.display_name.trim() === ""
          ? "Please enter a name — spaces alone aren't enough."
          : null,
      date_of_birth: validateDateOfBirth(form.date_of_birth),
      marital_status: validateOneOf(form.marital_status, MARITAL_STATUS, "a marital status"),
      height_cm: validateHeight(form.height_cm),
      education_level: validateOneOf(form.education_level, EDUCATION_LEVELS, "a level of education"),
      employment_status: validateOneOf(form.employment_status, EMPLOYMENT_STATUS, "your situation"),
      religious_practice_level: validateOneOf(
        form.religious_practice_level,
        PRACTICE_LEVELS,
        "how you practise",
      ),
      sect_or_school_of_thought: validateOneOf(
        form.sect_or_school_of_thought,
        SCHOOLS_OF_THOUGHT,
        "a school of thought",
      ),
      expected_marriage_timeline: validateOneOf(
        form.expected_marriage_timeline,
        MARRIAGE_TIMELINE,
        "a timeline",
      ),
    } as Partial<Record<keyof Form, string | null>>;
  }, [form]);

  const waliTouched =
    [wali.relationship, wali.contact_phone, wali.contact_email, wali.approval_preferences].some(
      (v) => v.trim() !== "",
    ) || wali.name.trim() !== "";

  const waliErrors = {
    name: waliTouched && wali.name.trim() === "" ? "Please give your wali's name." : null,
    contact_email: validateOptionalEmail(wali.contact_email),
    contact_phone: wali.contact_phone.trim() === "" ? null : validatePhone(wali.contact_phone),
  };

  const sectionHasError = (key: SectionKey) =>
    (SECTION_FIELDS[key] ?? []).some((f) => fieldErrors[f]);

  const waliHasError = Object.values(waliErrors).some(Boolean);

  async function saveSection(key: SectionKey) {
    const fields = SECTION_FIELDS[key];
    if (!fields) return;
    if (sectionHasError(key)) {
      toast.error("Please correct the highlighted details before saving this section.");
      return;
    }

    setSavingKey(key);
    const patch: Record<string, unknown> = {};
    for (const f of fields) patch[f] = toDbValue(f, form);


    const id = await ensureProfile(patch);
    if (!id) {
      setSavingKey(null);
      return;
    }

    const moved = nextStatusOnEdit(status);
    const { error } = await supabase
      .from("marriage_profiles")
      .update({ ...patch, status: moved })
      .eq("id", id);

    setSavingKey(null);
    if (error) {
      toast.error("That didn't save. Please check your details and try again.");
      return;
    }
    if (moved !== status) {
      setStatus(moved);
      setUnlocked(true);
      toast.success("Saved. Your changes will be reviewed by your mosque again.");
    } else {
      toast.success("Saved.");
    }
    setSavedKey(key);
    setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2500);
  }

  async function savePrivacy() {
    setSavingKey("privacy");
    const id = await ensureProfile({ privacy_settings: privacy });
    if (!id) {
      setSavingKey(null);
      return;
    }
    const { error } = await supabase
      .from("marriage_profiles")
      .update({ privacy_settings: privacy })
      .eq("id", id);
    setSavingKey(null);
    if (error) toast.error("We couldn't update your privacy choices.");
    else {
      toast.success("Privacy choices saved.");
      setSavedKey("privacy");
      setTimeout(() => setSavedKey((k) => (k === "privacy" ? null : k)), 2500);
    }
  }

  async function saveWali() {
    if (waliHasError) {
      toast.error("Please correct your wali's details before saving.");
      return;
    }
    setSavingKey("wali");
    const id = await ensureProfile({});
    if (!id) {
      setSavingKey(null);
      return;
    }
    const payload = {
      profile_id: id,
      name: wali.name.trim() || null,
      relationship: wali.relationship.trim() || null,
      contact_phone: wali.contact_phone.trim() || null,
      contact_email: wali.contact_email.trim() || null,
      approval_preferences: wali.approval_preferences.trim() || null,
    };

    const { data: existing } = await supabase
      .from("wali_details")
      .select("id")
      .eq("profile_id", id)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from("wali_details").update(payload).eq("id", existing.id)
      : await supabase.from("wali_details").insert(payload);

    setSavingKey(null);
    if (error) toast.error(friendlyError(error, "We couldn't save your wali's details."));
    else {
      toast.success("Wali details saved.");
      setSavedKey("wali");
      setTimeout(() => setSavedKey((k) => (k === "wali" ? null : k)), 2500);
    }
  }

  const missing = useMemo(() => {
    const required: [keyof Form, string][] = [
      ["display_name", "a name to be known by"],
      ["date_of_birth", "your date of birth"],
      ["marital_status", "your marital status"],
      ["country", "your country"],
      ["city", "your city"],
      ["religious_practice_level", "how you practise"],
      ["personal_bio", "a short introduction"],
    ];
    const blanks = required
      .filter(([k]) => String(form[k] ?? "").trim() === "")
      .map(([, label]) => label);
    const invalid = Object.values(fieldErrors).filter(Boolean) as string[];
    return [...blanks, ...invalid];
  }, [form, fieldErrors]);

  async function submitForReview() {
    if (!profileId) {
      toast.error("Please save at least one section first.");
      return;
    }
    if (missing.length > 0) {
      toast.error(`Still needed: ${missing.join(", ")}.`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("marriage_profiles")
      .update({ status: "submitted" })
      .eq("id", profileId);
    setSubmitting(false);

    if (error) {
      toast.error(
        error.message.includes("affiliation")
          ? "Your mosque affiliation needs to be approved before you can submit."
          : friendlyError(error, "We couldn't submit your profile just now."),
      );
      return;
    }

    setStatus("submitted");
    setUnlocked(false);
    setRejectionReason(null);
    toast.success("Submitted. Your mosque will review your profile with care, in shaa Allah.");
  }

  if (loading) {
    return (
      <MemberShell title="Your marriage profile">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Gathering your details…
        </p>
      </MemberShell>
    );
  }

  const toneClass =
    statusCopy.tone === "success"
      ? "border-success/40 bg-success/10"
      : statusCopy.tone === "destructive"
        ? "border-destructive/40 bg-destructive/10"
        : statusCopy.tone === "warning"
          ? "border-secondary/50 bg-secondary/15"
          : "border-border bg-muted";

  return (
    <MemberShell
      title="Your marriage profile"
      description="This is how your mosque, and one day a prospective spouse and their family, will come to know you. Write it as you would speak about yourself to an elder — honestly, warmly, and without exaggeration. Each section saves on its own, so there is no rush."
    >

        <div className={cn("rounded-lg border p-4", toneClass)}>
          <p className="text-caption">Profile status</p>
          <p className="text-h3 mt-1 text-foreground">{statusCopy.label}</p>
          <p className="mt-2 text-sm text-muted-foreground">{statusCopy.note}</p>

          {status === "rejected" && rejectionReason ? (
            <div className="mt-3 rounded-md border border-destructive/40 bg-card p-3">
              <p className="text-sm font-semibold text-foreground">What your mosque has asked for</p>
              <p className="mt-1 text-sm text-muted-foreground">{rejectionReason}</p>
            </div>
          ) : null}

          {status === "approved" ? (
            <Button
              type="button"
              variant={unlocked ? "secondary" : "default"}
              className="mt-4 min-h-11"
              onClick={() => setUnlocked((v) => !v)}
            >
              {unlocked ? "Stop editing" : "Make changes"}
            </Button>
          ) : null}

          {status === "approved" && unlocked ? (
            <p className="text-caption mt-3">
              Any change you save will return your profile to your mosque for a fresh review — it
              will not stay approved in the meantime.
            </p>
          ) : null}
        </div>

        <nav aria-label="Profile sections" className="sticky top-0 z-10 -mx-4 mt-6 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 text-xs font-semibold whitespace-nowrap text-foreground/80 transition-colors hover:bg-accent hover:text-primary"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-4 space-y-6">
          <ProfileSection
            id="basics"
            title="Basic information"
            intro="The essentials your mosque needs to recognise you."
            readOnly={locked}
            saving={savingKey === "basics"}
            saved={savedKey === "basics"}
            onSave={() => void saveSection("basics")}
          >
            <TextField
              id="display_name"
              label="Name to be known by"
              hint="A first name or family name is enough — full names are only shared with your mosque."
              value={form.display_name}
              readOnly={locked}
              max={80}
              onChange={(v) => setForm({ ...form, display_name: v })}
            />
            <TextField
              id="date_of_birth"
              label="Date of birth"
              type="date"
              value={form.date_of_birth}
              readOnly={locked}
              onChange={(v) => setForm({ ...form, date_of_birth: v })}
            />
            <SelectField
              id="marital_status"
              label="Marital status"
              value={form.marital_status}
              options={MARITAL_STATUS}
              readOnly={locked}
              onChange={(v) => setForm({ ...form, marital_status: v })}
            />
            <TextField
              id="nationality"
              label="Nationality"
              value={form.nationality}
              readOnly={locked}
              max={80}
              onChange={(v) => setForm({ ...form, nationality: v })}
            />
            <TextField
              id="ethnicity"
              label="Ethnicity or heritage"
              value={form.ethnicity}
              readOnly={locked}
              max={80}
              onChange={(v) => setForm({ ...form, ethnicity: v })}
            />
          </ProfileSection>

          <ProfileSection
            id="location"
            title="Where you live"
            intro="Helpful for families thinking about distance and settling."
            readOnly={locked}
            saving={savingKey === "location"}
            saved={savedKey === "location"}
            onSave={() => void saveSection("location")}
          >
            <TextField
              id="country"
              label="Country"
              value={form.country}
              readOnly={locked}
              max={80}
              onChange={(v) => setForm({ ...form, country: v })}
            />
            <TextField
              id="city"
              label="City or town"
              value={form.city}
              readOnly={locked}
              max={80}
              onChange={(v) => setForm({ ...form, city: v })}
            />
            <TextField
              id="area"
              label="Area"
              hint="Optional — a borough or district, never your address."
              value={form.area}
              readOnly={locked}
              max={80}
              onChange={(v) => setForm({ ...form, area: v })}
            />
          </ProfileSection>

          <ProfileSection
            id="physical"
            title="Physical details"
            intro="Kept modest and brief — only what genuinely helps someone picture you."
            readOnly={locked}
            saving={savingKey === "physical"}
            saved={savedKey === "physical"}
            onSave={() => void saveSection("physical")}
          >
            <TextField
              id="height_cm"
              label="Height (cm)"
              type="number"
              value={form.height_cm}
              readOnly={locked}
              onChange={(v) => setForm({ ...form, height_cm: v })}
            />
            <TextAreaField
              id="appearance_description"
              label="A short description"
              hint="A sentence or two, written respectfully."
              value={form.appearance_description}
              readOnly={locked}
              limit={300}
              onChange={(v) => setForm({ ...form, appearance_description: v })}
            />
          </ProfileSection>

          <ProfileSection
            id="education"
            title="Education & work"
            intro="A sense of how you spend your days and what you have studied."
            readOnly={locked}
            saving={savingKey === "education"}
            saved={savedKey === "education"}
            onSave={() => void saveSection("education")}
          >
            <SelectField
              id="education_level"
              label="Level of education"
              value={form.education_level}
              options={EDUCATION_LEVELS}
              readOnly={locked}
              onChange={(v) => setForm({ ...form, education_level: v })}
            />
            <TextField
              id="profession"
              label="Profession or field"
              value={form.profession}
              readOnly={locked}
              max={120}
              onChange={(v) => setForm({ ...form, profession: v })}
            />
            <SelectField
              id="employment_status"
              label="Current situation"
              value={form.employment_status}
              options={EMPLOYMENT_STATUS}
              readOnly={locked}
              onChange={(v) => setForm({ ...form, employment_status: v })}
            />
          </ProfileSection>

          <ProfileSection
            id="religion"
            title="Your deen"
            intro="The heart of the matter — where you are in your practice today, not where you hope to be."
            readOnly={locked}
            saving={savingKey === "religion"}
            saved={savedKey === "religion"}
            onSave={() => void saveSection("religion")}
          >
            <SelectField
              id="religious_practice_level"
              label="How you practise"
              value={form.religious_practice_level}
              options={PRACTICE_LEVELS}
              readOnly={locked}
              onChange={(v) => setForm({ ...form, religious_practice_level: v })}
            />
            <SelectField
              id="sect_or_school_of_thought"
              label="School of thought"
              value={form.sect_or_school_of_thought}
              options={SCHOOLS_OF_THOUGHT}
              readOnly={locked}
              onChange={(v) => setForm({ ...form, sect_or_school_of_thought: v })}
            />
            <TagField
              id="languages_spoken"
              label="Languages you speak"
              hint="Press Enter after each language."
              values={form.languages_spoken}
              readOnly={locked}
              placeholder="English, Urdu, Arabic…"
              onChange={(v) => setForm({ ...form, languages_spoken: v })}
            />
          </ProfileSection>

          <ProfileSection
            id="family"
            title="Family background"
            intro="Marriage joins two families, so a little context goes a long way."
            readOnly={locked}
            saving={savingKey === "family"}
            saved={savedKey === "family"}
            onSave={() => void saveSection("family")}
          >
            <TextField
              id="family_origin"
              label="Family origin"
              hint="Where your family is from."
              value={form.family_origin}
              readOnly={locked}
              max={120}
              onChange={(v) => setForm({ ...form, family_origin: v })}
            />
            <TextAreaField
              id="family_values"
              label="Family values"
              value={form.family_values}
              readOnly={locked}
              limit={400}
              onChange={(v) => setForm({ ...form, family_values: v })}
            />
            <TextAreaField
              id="household_background"
              label="Household"
              hint="Who you live with, siblings, and anything a family would kindly want to know."
              value={form.household_background}
              readOnly={locked}
              limit={400}
              onChange={(v) => setForm({ ...form, household_background: v })}
            />
          </ProfileSection>

          <ProfileSection
            id="preferences"
            title="What you are looking for"
            intro="Be sincere and reasonable — describe the character you hope for, rather than a checklist."
            readOnly={locked}
            saving={savingKey === "preferences"}
            saved={savedKey === "preferences"}
            onSave={() => void saveSection("preferences")}
          >
            <TextAreaField
              id="preferred_spouse_criteria"
              label="Qualities you hope for in a spouse"
              value={form.preferred_spouse_criteria}
              readOnly={locked}
              limit={600}
              onChange={(v) => setForm({ ...form, preferred_spouse_criteria: v })}
            />
            <ToggleField
              id="willingness_to_relocate"
              label="Open to relocating"
              hint="Would you consider moving city or country after marriage?"
              checked={form.willingness_to_relocate}
              readOnly={locked}
              onChange={(v) => setForm({ ...form, willingness_to_relocate: v })}
            />
            <SelectField
              id="expected_marriage_timeline"
              label="Timeline you have in mind"
              value={form.expected_marriage_timeline}
              options={MARRIAGE_TIMELINE}
              readOnly={locked}
              onChange={(v) => setForm({ ...form, expected_marriage_timeline: v })}
            />
          </ProfileSection>

          <ProfileSection
            id="introduction"
            title="A short introduction"
            intro="A few sentences in your own words. This is the part people remember."
            readOnly={locked}
            saving={savingKey === "introduction"}
            saved={savedKey === "introduction"}
            onSave={() => void saveSection("introduction")}
          >
            <TextAreaField
              id="personal_bio"
              label="About you"
              hint="Your character, what matters to you, and what you hope for from marriage."
              value={form.personal_bio}
              readOnly={locked}
              rows={6}
              limit={BIO_LIMIT}
              onChange={(v) => setForm({ ...form, personal_bio: v })}
            />
          </ProfileSection>

          <ProfileSection
            id="wali"
            title="Your wali or guardian"
            intro="The person who will be present for conversations and give their blessing. Their details are shared only with your mosque."
            readOnly={locked}
            saving={savingKey === "wali"}
            saved={savedKey === "wali"}
            onSave={() => void saveWali()}
          >
            <TextField
              id="wali_name"
              label="Their name"
              value={wali.name}
              readOnly={locked}
              max={120}
              onChange={(v) => setWali({ ...wali, name: v })}
            />
            <TextField
              id="wali_relationship"
              label="Relationship to you"
              hint="Father, brother, uncle, or an imam acting as wali."
              value={wali.relationship}
              readOnly={locked}
              max={80}
              onChange={(v) => setWali({ ...wali, relationship: v })}
            />
            <TextField
              id="wali_phone"
              label="Contact number"
              type="tel"
              value={wali.contact_phone}
              readOnly={locked}
              max={32}
              onChange={(v) => setWali({ ...wali, contact_phone: v })}
            />
            <TextField
              id="wali_email"
              label="Contact email"
              type="email"
              value={wali.contact_email}
              readOnly={locked}
              max={255}
              onChange={(v) => setWali({ ...wali, contact_email: v })}
            />
            <TextAreaField
              id="wali_preferences"
              label="How they would like to be involved"
              hint="For example: to be contacted first, or to be present at every conversation."
              value={wali.approval_preferences}
              readOnly={locked}
              limit={400}
              onChange={(v) => setWali({ ...wali, approval_preferences: v })}
            />
          </ProfileSection>

          <ProfileSection
            id="photos"
            title="Photographs"
            intro="Entirely optional. Nothing is browsable — photographs stay hidden until an introduction is agreed."
            readOnly={locked}
          >
            {userId ? (
              <PhotoManager profileId={profileId} userId={userId} readOnly={locked} />
            ) : null}
          </ProfileSection>

          <ProfileSection
            id="privacy"
            title="Who sees what"
            intro="Choose, detail by detail, what a matched member may see and what stays with your mosque alone. Anything you leave as “mosque admin only” is never shown to other members."
            readOnly={locked}
            saving={savingKey === "privacy"}
            saved={savedKey === "privacy"}
            onSave={() => void savePrivacy()}
          >
            <PrivacyPanel settings={privacy} onChange={setPrivacy} readOnly={locked} />
          </ProfileSection>

          <section className="surface-card p-5 sm:p-7">
            <h2 className="text-h2 text-foreground">Ready for your mosque to review?</h2>
            <p className="text-body mt-2 text-muted-foreground">
              When you submit, your mosque will read your profile before anyone else can. You can
              keep refining it while it is with them.
            </p>

            {missing.length > 0 ? (
              <div className="mt-4 rounded-lg border border-border bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">Still to add</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                className="min-h-11"
                disabled={submitting || missing.length > 0 || status === "approved"}
                onClick={() => void submitForReview()}
              >
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {status === "submitted" ? "Resubmit for review" : "Submit for review"}
              </Button>
              <Button asChild variant="secondary" className="min-h-11">
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </section>
        </div>
    </MemberShell>
  );
}
