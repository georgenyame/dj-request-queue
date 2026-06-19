import { GuestRequest, RequestRow } from '../types/queue';
import { getSupabaseClient } from './SupabaseClient';

export function mapRowToGuestRequest(row: RequestRow): GuestRequest {
  return {
    id: row.id,
    guestName: row.guest_name || 'Guest',
    track: {
      id: row.track_id,
      title: row.title,
      artist: row.artist,
      album: '',
      artworkUrl: row.artwork_url,
      durationMs: 0,
    },
    timestamp: new Date(row.created_at).getTime(),
    status: row.status,
    syncStatus: 'idle',
  };
}

export async function fetchRequests(): Promise<GuestRequest[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch requests: ${error.message}`);
  }

  return (data as RequestRow[]).map(mapRowToGuestRequest);
}

export async function approveRequest(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('requests')
    .update({ status: 'approved' })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to approve request: ${error.message}`);
  }
}

export async function declineRequest(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('requests')
    .update({ status: 'declined' })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to decline request: ${error.message}`);
  }
}

/** Removes every row from the inbox. Does not change the Spotify Requests playlist. */
export async function clearAllRequests(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('requests')
    .delete()
    .gte('created_at', '1970-01-01T00:00:00Z');

  if (error) {
    throw new Error(`Failed to clear inbox: ${error.message}`);
  }
}
