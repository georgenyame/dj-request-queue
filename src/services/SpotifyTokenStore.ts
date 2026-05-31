// src/services/SpotifyTokenStore.ts
import { SpotifyTokens } from '../types';

type TokenListener = (tokens: SpotifyTokens | null) => void;

/**
 * Single in-memory authority for the active Spotify tokens.
 *
 * This is the source of truth the API client reads from and the auth manager
 * writes to. Kept deliberately small so it can later be backed by persistent
 * storage (a JSON file or Keychain) without touching its consumers.
 */
export class SpotifyTokenStore {
  private static instance: SpotifyTokenStore;
  private tokens: SpotifyTokens | null = null;
  private listeners: Set<TokenListener> = new Set();

  static getInstance(): SpotifyTokenStore {
    if (!this.instance) {
      this.instance = new SpotifyTokenStore();
    }
    return this.instance;
  }

  getTokens(): SpotifyTokens | null {
    return this.tokens;
  }

  setTokens(tokens: SpotifyTokens | null): void {
    this.tokens = tokens;
    this.listeners.forEach(listener => listener(tokens));
  }

  isAuthenticated(): boolean {
    return this.tokens?.accessToken != null;
  }

  clear(): void {
    this.setTokens(null);
  }

  /**
   * Subscribe to token changes (e.g. so React UI can react to refreshes).
   * Returns an unsubscribe function.
   */
  subscribe(listener: TokenListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
