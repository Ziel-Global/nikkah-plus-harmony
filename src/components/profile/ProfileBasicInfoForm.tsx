import { ProfileSection } from "./ProfileSection";
import { SelectField, TextAreaField, TextField } from "./fields";
import { MARITAL_STATUS } from "@/lib/profile-options";

type FormState = {
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
};

type FieldErrors = Partial<Record<keyof FormState, string | null>>;

interface ProfileBasicInfoFormProps {
  form: FormState;
  locked: boolean;
  savingKey: string | null;
  savedKey: string | null;
  fieldErrors: FieldErrors;
  onChange: (patch: Partial<FormState>) => void;
  onSaveSection: (key: "basics" | "location" | "physical") => void;
}

export function ProfileBasicInfoForm({
  form,
  locked,
  savingKey,
  savedKey,
  fieldErrors,
  onChange,
  onSaveSection,
}: ProfileBasicInfoFormProps) {
  return (
    <>
      <ProfileSection
        id="basics"
        title="Basic information"
        intro="The essentials your mosque needs to recognise you."
        readOnly={locked}
        saving={savingKey === "basics"}
        saved={savedKey === "basics"}
        onSave={() => onSaveSection("basics")}
      >
        <TextField
          id="display_name"
          label="Name to be known by"
          hint="A first name or family name is enough — full names are only shared with your mosque."
          value={form.display_name}
          readOnly={locked}
          max={80}
          error={fieldErrors.display_name}
          onChange={(v) => onChange({ display_name: v })}
        />
        <TextField
          id="date_of_birth"
          label="Date of birth"
          hint="You must be at least 18 years old to use Nikkah+."
          type="date"
          value={form.date_of_birth}
          readOnly={locked}
          error={fieldErrors.date_of_birth}
          onChange={(v) => onChange({ date_of_birth: v })}
        />
        <SelectField
          id="marital_status"
          label="Marital status"
          value={form.marital_status}
          options={MARITAL_STATUS}
          readOnly={locked}
          error={fieldErrors.marital_status}
          onChange={(v) => onChange({ marital_status: v })}
        />

        <TextField
          id="nationality"
          label="Nationality"
          value={form.nationality}
          readOnly={locked}
          max={80}
          onChange={(v) => onChange({ nationality: v })}
        />
        <TextField
          id="ethnicity"
          label="Ethnicity or heritage"
          value={form.ethnicity}
          readOnly={locked}
          max={80}
          onChange={(v) => onChange({ ethnicity: v })}
        />
      </ProfileSection>

      <ProfileSection
        id="location"
        title="Where you live"
        intro="Helpful for families thinking about distance and settling."
        readOnly={locked}
        saving={savingKey === "location"}
        saved={savedKey === "location"}
        onSave={() => onSaveSection("location")}
      >
        <TextField
          id="country"
          label="Country"
          value={form.country}
          readOnly={locked}
          max={80}
          onChange={(v) => onChange({ country: v })}
        />
        <TextField
          id="city"
          label="City or town"
          value={form.city}
          readOnly={locked}
          max={80}
          onChange={(v) => onChange({ city: v })}
        />
        <TextField
          id="area"
          label="Area"
          hint="Optional — a borough or district, never your address."
          value={form.area}
          readOnly={locked}
          max={80}
          onChange={(v) => onChange({ area: v })}
        />
      </ProfileSection>

      <ProfileSection
        id="physical"
        title="Physical details"
        intro="Kept modest and brief — only what genuinely helps someone picture you."
        readOnly={locked}
        saving={savingKey === "physical"}
        saved={savedKey === "physical"}
        onSave={() => onSaveSection("physical")}
      >
        <TextField
          id="height_cm"
          label="Height (cm)"
          hint="Between 100cm and 250cm."
          type="number"
          value={form.height_cm}
          readOnly={locked}
          error={fieldErrors.height_cm}
          onChange={(v) => onChange({ height_cm: v })}
        />
        <TextAreaField
          id="appearance_description"
          label="A short description"
          hint="A sentence or two, written respectfully."
          value={form.appearance_description}
          readOnly={locked}
          limit={300}
          onChange={(v) => onChange({ appearance_description: v })}
        />
      </ProfileSection>
    </>
  );
}
