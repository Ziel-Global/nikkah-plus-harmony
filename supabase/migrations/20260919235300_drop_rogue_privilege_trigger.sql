-- Drop the duplicate/rogue privilege escalation trigger and function that was causing P0001 errors on affiliation approval
DROP TRIGGER IF EXISTS trg_prevent_self_privilege_escalation ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_self_privilege_escalation();
