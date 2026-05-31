// src/services/SpotifyApiClient.ts
import { SpotifyTokens } from '../types';
import { SpotifyAuthManager } from '../SpotifyAuthManager';
import { SpotifyTokenStore } from './SpotifyTokenStore';

const BASE_URL = 'https://api.spotify.com/v1';

/**
 * Single entry point for all Spotify Web API calls.
 *
 * - Injects the active bearer token from the token store.
 * - On a 401, refreshes the token once and retries the request.
 * - Deduplicates concurrent refreshes: if many requests 401 at the same time
 *   (e.g. the dashboard polling several endpoints when the token expires),
 *   only one refresh runs and the rest await it.
 */
export class SpotifyApiClient {
  private static activeRefreshPromise: Promise<SpotifyTokens> | null = null;

  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const store = SpotifyTokenStore.getInstance();

    if (!store.getTokens()?.accessToken) {
      throw new Error(
        'No active authentication found. Please connect your Spotify account.',
      );
    }

    // If a refresh is already in flight, wait for it before firing the request.
    await this.awaitActiveRefresh();

    let response = await this.send(endpoint, options, store.getTokens());

    if (response.status === 401) {
      // Token expired/invalid — refresh once (deduplicated) and retry.
      await this.refreshTokens();
      response = await this.send(endpoint, options, store.getTokens());
    }

    return this.parseResponse<T>(response);
  }

  private static send(
    endpoint: string,
    options: RequestInit,
    tokens: SpotifyTokens | null,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
      Authorization: `Bearer ${tokens?.accessToken ?? ''}`,
    };
    // Only set a JSON content-type when we're actually sending a body.
    if (options.body != null) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  }

  /** Runs (or joins) a single shared refresh operation. */
  private static refreshTokens(): Promise<SpotifyTokens> {
    if (!this.activeRefreshPromise) {
      this.activeRefreshPromise = SpotifyAuthManager.refreshAccessToken().finally(
        () => {
          this.activeRefreshPromise = null;
        },
      );
    }
    return this.activeRefreshPromise;
  }

  /** Waits for any in-flight refresh, ignoring its failure (the request will 401 and retry). */
  private static async awaitActiveRefresh(): Promise<void> {
    if (this.activeRefreshPromise) {
      try {
        await this.activeRefreshPromise;
      } catch {
        // Swallow: proceed with whatever token we have; a 401 path handles retry.
      }
    }
  }

  private static async parseResponse<T>(response: Response): Promise<T> {
    // 204/205: no content (e.g. nothing currently playing).
    if (response.status === 204 || response.status === 205) {
      return null as T;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Spotify API Error [${response.status}]: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }
}
