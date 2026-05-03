import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : null) ||
  '';

// Browser: use anon key (respects RLS policies).
// Server-side API routes: fall back to service role key.
const supabaseKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    : null) ||
  '';

export const supabase = createClient(supabaseUrl, supabaseKey);
