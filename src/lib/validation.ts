/**
 * Shared, plain-language form validation used across every Marriage Database form.
 * Each rule mirrors a database-level constraint so members get a fast,
 * friendly answer before a request is ever sent.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Please enter your email address.";
  if (v.length > 255) return "That email address is too long.";
  if (!EMAIL_RE.test(v)) return "Please enter a valid email address, for example name@example.com.";
  return null;
}

/** Optional email — only checked when something has been typed. */
export function validateOptionalEmail(value: string): string | null {
  return value.trim() === "" ? null : validateEmail(value);
}

export function validatePhone(value: string): string | null {
  const v = value.trim();
  if (!v) return "Please enter your phone number.";
  const digits = v.replace(/[^0-9]/g, "");
  if (!/^\+?[0-9\s()-]+$/.test(v)) {
    return "Please use digits only, with an optional + for the country code.";
  }
  if (digits.length < 7) return "That number looks too short — please include your country code.";
  if (digits.length > 15) return "That number looks too long. Please check it.";
  return null;
}

export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
] as const;

export function validatePassword(value: string): string | null {
  if (!value) return "Please choose a password.";
  const failed = PASSWORD_RULES.filter((r) => !r.test(value));
  if (failed.length === 0) return null;
  return `Your password still needs: ${failed.map((r) => r.label.toLowerCase()).join(", ")}.`;
}

export function validateRequiredText(value: string, label: string, max?: number): string | null {
  const v = value.trim();
  if (!v) return `${label} cannot be blank.`;
  if (max && v.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
}

/** Members must be 18 or over — matched by a database check constraint. */
export function validateDateOfBirth(value: string): string | null {
  if (!value) return null;
  const dob = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return "Please enter a valid date.";
  const today = new Date();
  if (dob > today) return "That date is in the future.";
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  if (age < 18) return "You must be at least 18 years old to use Marriage Database.";
  if (age > 100) return "Please check your date of birth.";
  return null;
}

export function validateHeight(value: string): string | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return "Please enter your height in centimetres.";
  if (n < 100 || n > 250) return "Please enter a height between 100cm and 250cm.";
  return null;
}

export function validateOneOf(
  value: string,
  options: readonly string[],
  label: string,
): string | null {
  if (value.trim() === "") return null;
  return options.includes(value) ? null : `Please choose ${label} from the list.`;
}

export const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function validateHexColor(value: string): string | null {
  return HEX_RE.test(value.trim()) ? null : "Use a valid hex colour, for example #2563EB.";
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File, maxBytes: number): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WEBP image.";
  if (file.size > maxBytes) {
    return `Please choose an image under ${Math.round(maxBytes / (1024 * 1024))}MB.`;
  }
  return null;
}

/**
 * Turns raw Postgres/Supabase errors into plain language. Never show a raw
 * constraint violation to a member.
 */
export function friendlyError(
  error: unknown,
  fallback = "Something didn't work. Please try again.",
): string {
  const raw =
    typeof error === "string" ? error : ((error as { message?: string } | null)?.message ?? "");
  const m = raw.toLowerCase();

  if (!m) return fallback;

  if (m.includes("profiles_email") || (m.includes("duplicate") && m.includes("email"))) {
    return "An account with this email may already exist. Try adding a unique email.";
  }
  if (m.includes("mosque_affiliation") && (m.includes("duplicate") || m.includes("unique"))) {
    return "You already have a pending request with this mosque. Please wait for them to review it.";
  }
  if (m.includes("mosque_admin_mosques") && (m.includes("duplicate") || m.includes("unique"))) {
    return "That admin is already assigned to this mosque.";
  }
  if (m.includes("mosques_name") || (m.includes("mosques") && m.includes("unique"))) {
    return "A mosque with this name already exists in that city.";
  }
  if (m.includes("date_of_birth") || m.includes("age")) {
    return "Members must be at least 18 years old.";
  }
  if (m.includes("hex") || m.includes("color") || m.includes("colour")) {
    return "One of the colours isn't a valid hex value.";
  }
  if (m.includes("duplicate key") || m.includes("unique constraint")) {
    return "That has already been recorded — it can only be added once.";
  }
  if (m.includes("violates check constraint")) {
    return "Some of those details aren't allowed. Please review them and try again.";
  }
  if (m.includes("row-level security") || m.includes("permission denied")) {
    return "You don't have permission to do that.";
  }
  if (m.includes("value too long")) {
    return "One of your entries is too long. Please shorten it and try again.";
  }
  if (m.includes("fetch") || m.includes("network")) {
    return "We couldn't reach the server. Please check your connection and try again.";
  }
  return fallback;
}
