import { supabase } from './src/integrations/supabase/client'; supabase.from('profiles').select('*').limit(2).then(res => console.log(JSON.stringify(res, null, 2)));
