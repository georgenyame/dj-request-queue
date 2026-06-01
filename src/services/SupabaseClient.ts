import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabase.config';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const { supabaseUrl, supabaseServiceRoleKey } = SUPABASE_CONFIG;
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'Supabase not configured. Copy src/config/supabase.config.example.ts to supabase.config.ts and fill in credentials.',
      );
    }
    client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  const { supabaseUrl, supabaseServiceRoleKey } = SUPABASE_CONFIG;
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}
