// src/types/queue.ts

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  durationMs: number;
}

/** DJ decision on an incoming guest request. */
export type RequestStatus = 'pending' | 'approved' | 'declined';

/** Spotify playlist write state (only moves on Approve). */
export type SyncStatus = 'idle' | 'submitting' | 'synced' | 'failed';

export interface GuestRequest {
  id: string; // Supabase UUID
  track: TrackItem;
  guestName: string;
  timestamp: number; // epoch ms from created_at
  status: RequestStatus;
  syncStatus: SyncStatus;
}

/** Row shape from public.requests (Supabase). */
export interface RequestRow {
  id: string;
  track_id: string;
  title: string;
  artist: string;
  artwork_url: string;
  guest_name: string;
  status: RequestStatus;
  created_at: string;
}
