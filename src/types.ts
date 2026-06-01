// src/types.ts

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;   // Timestamp when the token expires
}