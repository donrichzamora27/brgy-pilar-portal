import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables. Check .env.example.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Verifies reachability to the Supabase project before tables exist.
 * Treats Postgres relation-missing error (42P01) as a successful network/auth reach
 * when querying a table that has not been migrated yet.
 */
export async function verifySupabaseConnection() {
  const { error } = await supabase.from('officials').select('id').limit(1);

  if (!error) {
    return { ok: true, message: 'Connected to Supabase and queried officials table.' };
  }

  if (error.code === '42P01') {
    return {
      ok: true,
      message: 'Connected to Supabase Auth/API (officials table not created yet — ready for Phase 1 SQL).',
    };
  }

  return {
    ok: false,
    message: error.message || 'Unable to reach Supabase project.',
  };
}