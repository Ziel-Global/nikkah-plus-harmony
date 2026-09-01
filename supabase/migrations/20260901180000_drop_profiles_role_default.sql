-- Drop DEFAULT 'male_user' on public.profiles.role so new user registrations start with role = NULL
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- Notify PostgREST schema cache to refresh
NOTIFY pgrst, 'reload schema';
