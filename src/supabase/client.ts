import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missing = !url || !anonKey;

if (missing) {
  console.error(
    '[Supabase] Missing Vite env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. ' +
      'In Vercel, add them to Project Settings → Environment Variables (Production/Preview).'
  );
}

export const supabase = missing
  ? (new Proxy({}, {
      get() {
        throw new Error('Supabase client is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      },
    }) as any)
  : createClient(url!, anonKey!);
