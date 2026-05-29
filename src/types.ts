// src/types.ts

export interface GuestRequest {
  id: string;          // The unique Spotify Track URI/ID
  title: string;       // Song Name (e.g., "Dancing Queen")
  artist: string;      // Artist Name
  artworkUrl: string;  // Album Art Thumbnail URL
  bpm: number;         // Beats Per Minute for harmonic mixing
  musicalKey: string;  // Camelot or Harmonic key scale (e.g., "8A")
  upvotes: number;     // Total crowd upvotes
  timestamp: number;   // Epoch timestamp for sorting priority
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;   // Timestamp when the token expires
}