// Copy to supabase.config.ts (gitignored) and fill in from Supabase Dashboard.
// Project Settings -> API

export const SUPABASE_CONFIG = {
  // Project Settings → API → Project URL (NOT the dashboard browser URL)
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  // Guest web + read-only clients
  supabaseAnonKey: 'YOUR_ANON_KEY',
  // DJ macOS app only — never commit, never ship to guest-web
  supabaseServiceRoleKey: 'YOUR_SERVICE_ROLE_KEY',
};
