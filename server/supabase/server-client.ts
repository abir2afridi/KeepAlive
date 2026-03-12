import { createClient } from '@supabase/supabase-js';

let cachedAdmin: any | null = null;

export function getSupabaseAdmin() {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing SUPABASE_URL');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  cachedAdmin = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedAdmin;
}

export const supabaseAdmin: any = new Proxy({}, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    return (client as any)[prop];
  }
});
