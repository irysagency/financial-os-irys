import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : null) || (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseServiceKey = (typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : null) || '';

// Initialize Supabase client with the service role key for write permissions
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
