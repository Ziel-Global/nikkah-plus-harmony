# Marriage Database Design Kit

Community-based Muslim marriage platform — "Faith. Family. Future."

## Live App

**Live App**: https://nikkah-plus-harmony.vercel.app

## Overview

Marriage Database uses Supabase as its database and backend provider.

Database tables in place:

- `profiles` (role, gender, mosque_id, account_status, etc.)
- `mosques`, `mosque_admin_mosques`, `mosque_affiliation_requests`
- `marriage_profiles` (all profile fields + privacy settings + status)
- `profile_photos` (photo_url links + visibility)
- `wali_details`
- `interest_requests` (full request/match lifecycle via status)
- `contact_consents`, `match_feedback`, `escalations`, `conduct_reports`
- `account_flags`, `notifications`, `activity_logs`
- `platform_settings` (single-row branding/theme table)
- Storage bucket: `profile-photos` (private, folder-per-user)

---

## Brand & Design Tokens

**BRAND**: Marriage Database — "Faith. Family. Future." Tone: warm, respectful, elegant, modern.

**COLOR TOKENS**:

- `--color-primary`: `#6B1E2A` (Maroon — logo, headers, primary buttons, key accents)
- `--color-secondary`: `#C9967A` (Rose Gold — highlights, icons, secondary buttons, dividers)
- `--color-background`: `#FBF6F0` (Ivory/Champagne — app background, cards)
- `--color-text-primary`: `#2B1B17` (Espresso — primary text)
- `--color-tertiary`: `#D9B8B0` (Dusty Rose — tags, badges, soft highlights)
- `--color-text-secondary`: `#8C8078` (Stone Gray — secondary text, borders, disabled states, placeholders)

**TYPOGRAPHY**:

- Headings/display: Georgia Bold. H1 32-40px, H2 24-28px, H3 Semibold 18-20px.
- Body/UI text: Calibri Regular/Semibold, with a system-font fallback stack (Calibri, "Carlito", "Helvetica Neue", Arial, sans-serif).

---

## Local Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
