// src/types/player.ts

export interface CurrentPlaybackState {
  isPlaying: boolean;
  progressMs: number;
  trackId: string;
  title: string;
  artist: string;
  albumName: string;
  artworkUrl: string;
  durationMs: number;
}