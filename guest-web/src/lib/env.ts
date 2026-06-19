const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const searchFunctionUrl =
  import.meta.env.VITE_SUPABASE_FUNCTION_URL ??
  import.meta.env.VITE_SEARCH_FUNCTION_URL ??
  (supabaseUrl ? `${supabaseUrl}/functions/v1/search-tracks` : '');

export const guestEnv = {
  supabaseUrl,
  supabaseAnonKey,
  searchFunctionUrl,
};

export function isGuestAppConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && searchFunctionUrl);
}
