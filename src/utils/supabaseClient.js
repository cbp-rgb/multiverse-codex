import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const AUTH_EMAIL = import.meta.env.VITE_AUTH_EMAIL || '';

// Cloud persistence is required once this env is configured — there's no
// silent fallback to local storage, since the whole point is one shared,
// synced dataset across devices. Missing config fails loudly instead of
// quietly writing data nobody can find later.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).'
    );
  }
  return supabase;
}
