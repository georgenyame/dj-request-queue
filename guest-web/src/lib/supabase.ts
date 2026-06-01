import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SubmitRequestInput {
  trackId: string;
  title: string;
  artist: string;
  artworkUrl: string;
  guestName: string;
}

export async function submitRequest(input: SubmitRequestInput): Promise<void> {
  const { error } = await supabase.from('requests').insert({
    track_id: input.trackId,
    title: input.title,
    artist: input.artist,
    artwork_url: input.artworkUrl,
    guest_name: input.guestName.trim() || 'Guest',
    status: 'pending',
  });

  if (error) {
    throw new Error(error.message);
  }
}
