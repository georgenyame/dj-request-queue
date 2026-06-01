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
  id: string; // unique request id: `${track.id}-${timestamp}`
  track: TrackItem;
  timestamp: number; // epoch ms, for sort priority
  status: RequestStatus;
  syncStatus: SyncStatus;
}
