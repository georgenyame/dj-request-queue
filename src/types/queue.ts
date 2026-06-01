// src/types/queue.ts

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  durationMs: number;
}

export interface GuestRequest {
  id: string; // unique request id: `${track.id}-${timestamp}`
  track: TrackItem; // the wrapped catalog track
  votes: number; // initialized to 1
  timestamp: number; // epoch ms, for sort priority
}
