# Nikkah+ Design Kit

Set up the global design system and confirm database integration for this

project before building any page.

DATABASE — IMPORTANT, READ BEFORE DOING ANYTHING ELSE:

This project uses Supabase as its database and backend — NOT Lovable's

built-in/native cloud database. Do not provision or default to Lovable's own

database. Connect this project to my existing Supabase project using

Lovable's native Supabase integration.

All database tables already exist. I have already run the full schema

(tables, enums, RLS policies, triggers, and a Storage bucket) directly in

the Supabase SQL Editor before starting this project in Lovable. Do NOT

create, rename, or restructure any tables — do not run your own migrations

or generate a schema of your own. Treat the existing schema as fixed and

build the UI to read from and write to it as-is.

The tables already in place are:

- profiles (role, gender, mosque_id, account_status, etc.)

- mosques, mosque_admin_mosques, mosque_affiliation_requests

- marriage_profiles (all profile fields + privacy_settings jsonb + status)

- profile_photos (photo_url links + visibility)

- wali_details

- interest_requests (full request/match lifecycle via status)

- contact_consents, match_feedback, escalations, conduct_reports

- account_flags, notifications, activity_logs

- platform_settings (single-row branding/theme table)

- Storage bucket: profile-photos (private, folder-per-user)

Row Level Security is already enabled and policies are already written for

every table — do not add, remove, or bypass RLS policies. If a query fails

due to RLS, tell me rather than working around it by disabling security.

Before proceeding, confirm back to me: what exactly do you need from me to

complete this Supabase connection (e.g. project URL, anon/public key, or

just clicking "Connect Supabase" and picking the project from a list)? List

what you require, then wait for me to provide it before moving on to the

design system below.

---

BRAND: Nikkah+ — "Faith. Family. Future." A community-based Muslim marriage

platform. Tone: warm, respectful, elegant, modern. Explicitly avoid dating-app

visual cues — no hearts, no bright pink/red, no swipe gestures, no casual/flirty

copy anywhere in the UI.

COLOR TOKENS (define as CSS variables / Tailwind theme extension):

- --color-primary: #6B1E2A (Maroon — logo, headers, primary buttons, key accents)

- --color-secondary: #C9967A (Rose Gold — highlights, icons, secondary buttons, dividers)

- --color-background: #FBF6F0 (Ivory/Champagne — app background, cards)

- --color-text-primary: #2B1B17 (Espresso — primary text)

- --color-tertiary: #D9B8B0 (Dusty Rose — tags, badges, soft highlights)

- --color-text-secondary: #8C8078 (Stone Gray — secondary text, borders, disabled states, placeholders)

USAGE RATIO across every screen: roughly 60% ivory background, 25% espresso

text/structure, 10% maroon (primary actions and brand moments only — don't

overuse maroon), 5% rose gold / dusty rose (accents only).

TYPOGRAPHY:

- Headings/display: Georgia Bold. H1 32-40px, H2 24-28px, H3 Semibold 18-20px.

- Body/UI text: Calibri Regular/Semibold, with a system-font fallback stack

  (Calibri, "Carlito", "Helvetica Neue", Arial, sans-serif) since Calibri

  isn't universally installed cross-platform. Body 14-16px, caption 12px,

  button labels Calibri Semibold 14px.

LOGO: I will upload the Nikkah+ logo file myself after this step. For now,

leave a clearly marked logo placeholder in the header component (both a

horizontal lockup version for header/light backgrounds and a monogram-only

version for compact/mobile states) so I can drop the real files in.

COMPONENT RULES:

- Buttons: primary = maroon background, ivory text, rounded corners; hover =

  slightly darker maroon; secondary = rose gold outline, maroon text.

- Cards: ivory background, subtle stone-gray border, soft shadow, rounded

  corners (12-16px).

- Respect WCAG contrast — espresso text on ivory passes easily; verify rose

  gold text on ivory is only used for large/bold text, never small body copy.

- Build this as a reusable theme configuration (Tailwind config or CSS

  variables file), not hardcoded colors scattered across components, so a

  later "Settings → Branding" admin screen can override these values at

  runtime by reading from the `platform_settings` table.

Do not build any pages yet — just the design system, font imports, and a

placeholder header/footer shell.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nikkah-plus-harmony.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9a06535a-bdbc-466c-93f2-8633855434c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
