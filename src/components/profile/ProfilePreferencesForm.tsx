import { ProfileSection } from "./ProfileSection";
import { SelectField, TextAreaField, ToggleField } from "./fields";
import { BIO_LIMIT, MARRIAGE_TIMELINE } from "@/lib/profile-options";

type FormState = {
  preferred_spouse_criteria: string;
  willingness_to_relocate: boolean;
  expected_marriage_timeline: string;
  personal_bio: string;
};

type FieldErrors = Partial<Record<keyof FormState, string | null>>;

interface ProfilePreferencesFormProps {
  form: FormState;
  locked: boolean;
  savingKey: string | null;
  savedKey: string | null;
  fieldErrors: FieldErrors;
  onChange: (patch: Partial<FormState>) => void;
  onSaveSection: (key: "preferences" | "introduction") => void;
}

export function ProfilePreferencesForm({
  form,
  locked,
  savingKey,
  savedKey,
  fieldErrors,
  onChange,
  onSaveSection,
}: ProfilePreferencesFormProps) {
  return (
    <>
      <ProfileSection
        id="preferences"
        title="What you are looking for"
        intro="Be clear about what matters to you in a spouse and your plans."
        readOnly={locked}
        saving={savingKey === "preferences"}
        saved={savedKey === "preferences"}
        onSave={() => onSaveSection("preferences")}
      >
        <TextAreaField
          id="preferred_spouse_criteria"
          label="Characteristics & criteria"
          hint="What you value most — character, deen, life goals, or personality."
          value={form.preferred_spouse_criteria}
          readOnly={locked}
          limit={500}
          onChange={(v) => onChange({ preferred_spouse_criteria: v })}
        />
        <ToggleField
          id="willingness_to_relocate"
          label="Open to relocating"
          hint="Are you open to moving to another city or country after marriage?"
          checked={form.willingness_to_relocate}
          readOnly={locked}
          onChange={(v) => onChange({ willingness_to_relocate: v })}
        />
        <SelectField
          id="expected_marriage_timeline"
          label="Marriage timeline"
          value={form.expected_marriage_timeline}
          options={MARRIAGE_TIMELINE}
          readOnly={locked}
          error={fieldErrors.expected_marriage_timeline}
          onChange={(v) => onChange({ expected_marriage_timeline: v })}
        />
      </ProfileSection>

      <ProfileSection
        id="introduction"
        title="Personal introduction"
        intro="Your bio is your voice. Describe your nature, your day-to-day life, and what brings you peace."
        readOnly={locked}
        saving={savingKey === "introduction"}
        saved={savedKey === "introduction"}
        onSave={() => onSaveSection("introduction")}
      >
        <TextAreaField
          id="personal_bio"
          label="About yourself"
          hint="Write comfortably and in your own words."
          value={form.personal_bio}
          readOnly={locked}
          limit={BIO_LIMIT}
          onChange={(v) => onChange({ personal_bio: v })}
        />
      </ProfileSection>
    </>
  );
}
