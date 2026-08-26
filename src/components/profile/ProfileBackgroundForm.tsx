import { ProfileSection } from "./ProfileSection";
import { SelectField, TagField, TextAreaField, TextField } from "./fields";
import {
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUS,
  PRACTICE_LEVELS,
  SCHOOLS_OF_THOUGHT,
} from "@/lib/profile-options";

type FormState = {
  education_level: string;
  profession: string;
  employment_status: string;
  religious_practice_level: string;
  sect_or_school_of_thought: string;
  languages_spoken: string[];
  family_origin: string;
  family_values: string;
  household_background: string;
};

type FieldErrors = Partial<Record<keyof FormState, string | null>>;

interface ProfileBackgroundFormProps {
  form: FormState;
  locked: boolean;
  savingKey: string | null;
  savedKey: string | null;
  fieldErrors: FieldErrors;
  onChange: (patch: Partial<FormState>) => void;
  onSaveSection: (key: "education" | "religion" | "family") => void;
}

export function ProfileBackgroundForm({
  form,
  locked,
  savingKey,
  savedKey,
  fieldErrors,
  onChange,
  onSaveSection,
}: ProfileBackgroundFormProps) {
  return (
    <>
      <ProfileSection
        id="education"
        title="Education & work"
        intro="A sense of how you spend your days and what you have studied."
        readOnly={locked}
        saving={savingKey === "education"}
        saved={savedKey === "education"}
        onSave={() => onSaveSection("education")}
      >
        <SelectField
          id="education_level"
          label="Level of education"
          value={form.education_level}
          options={EDUCATION_LEVELS}
          readOnly={locked}
          error={fieldErrors.education_level}
          onChange={(v) => onChange({ education_level: v })}
        />
        <TextField
          id="profession"
          label="Profession or field"
          value={form.profession}
          readOnly={locked}
          max={120}
          onChange={(v) => onChange({ profession: v })}
        />
        <SelectField
          id="employment_status"
          label="Current situation"
          value={form.employment_status}
          options={EMPLOYMENT_STATUS}
          readOnly={locked}
          error={fieldErrors.employment_status}
          onChange={(v) => onChange({ employment_status: v })}
        />
      </ProfileSection>

      <ProfileSection
        id="religion"
        title="Your deen"
        intro="The heart of the matter — where you are in your practice today, not where you hope to be."
        readOnly={locked}
        saving={savingKey === "religion"}
        saved={savedKey === "religion"}
        onSave={() => onSaveSection("religion")}
      >
        <SelectField
          id="religious_practice_level"
          label="How you practise"
          value={form.religious_practice_level}
          options={PRACTICE_LEVELS}
          readOnly={locked}
          error={fieldErrors.religious_practice_level}
          onChange={(v) => onChange({ religious_practice_level: v })}
        />
        <SelectField
          id="sect_or_school_of_thought"
          label="School of thought"
          value={form.sect_or_school_of_thought}
          options={SCHOOLS_OF_THOUGHT}
          readOnly={locked}
          error={fieldErrors.sect_or_school_of_thought}
          onChange={(v) => onChange({ sect_or_school_of_thought: v })}
        />
        <TagField
          id="languages_spoken"
          label="Languages you speak"
          hint="Press Enter after each language."
          values={form.languages_spoken}
          readOnly={locked}
          placeholder="English, Urdu, Arabic…"
          onChange={(v) => onChange({ languages_spoken: v })}
        />
      </ProfileSection>

      <ProfileSection
        id="family"
        title="Family background"
        intro="Marriage joins two families, so a little context goes a long way."
        readOnly={locked}
        saving={savingKey === "family"}
        saved={savedKey === "family"}
        onSave={() => onSaveSection("family")}
      >
        <TextField
          id="family_origin"
          label="Family origin"
          hint="Where your family is from."
          value={form.family_origin}
          readOnly={locked}
          max={120}
          onChange={(v) => onChange({ family_origin: v })}
        />
        <TextAreaField
          id="family_values"
          label="Family values"
          value={form.family_values}
          readOnly={locked}
          limit={400}
          onChange={(v) => onChange({ family_values: v })}
        />
        <TextAreaField
          id="household_background"
          label="Household"
          hint="Who you live with, siblings, and anything a family would kindly want to know."
          value={form.household_background}
          readOnly={locked}
          limit={400}
          onChange={(v) => onChange({ household_background: v })}
        />
      </ProfileSection>
    </>
  );
}
