// src/SpotifyAuthManager.ts
import { SPOTIFY_CONFIG } from './spotifyConfig';
import { SpotifyTokens } from './types';
import { SpotifyTokenStore } from './services/SpotifyTokenStore';

export class SpotifyAuthManager {
  private static tokenEndpoint = 'https://accounts.spotify.com/api/token';

  /**
   * Exchanges an authorization code for tokens using PKCE.
   * No client secret and no Basic auth header — the code_verifier proves the
   * request comes from the same client that started the flow.
   */
  static async exchangeCodeForTokens(
    authCode: string,
    codeVerifier: string,
  ): Promise<SpotifyTokens> {
    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
      client_id: SPOTIFY_CONFIG.clientId,
      code_verifier: codeVerifier,
    });

    try {
      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Spotify Auth Error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: currentTimeInSeconds + data.expires_in,
      };
    } catch (error) {
      console.error('Failed to exchange auth token:', error);
      throw error;
    }
  }

  /**
   * Refreshes the access token using the refresh token currently held in the
   * token store, then writes the refreshed tokens straight back to the store.
   *
   * PKCE refresh only needs the client_id. Spotify rotates the refresh token
   * only sometimes, so we keep the existing one when a new one isn't returned.
   */
  static async refreshAccessToken(): Promise<SpotifyTokens> {
    const store = SpotifyTokenStore.getInstance();
    const current = store.getTokens();

    if (!current?.refreshToken) {
      throw new Error('No refresh token available — re-authentication required.');
    }

    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken,
      client_id: SPOTIFY_CONFIG.clientId,
    });

    try {
      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh token payload: ${errorText}`);
      }

      const data = await response.json();
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);

      const refreshed: SpotifyTokens = {
        accessToken: data.access_token,
        // Spotify rotates the refresh token optionally; preserve the old one if absent.
        refreshToken: data.refresh_token ?? current.refreshToken,
        expiresAt: currentTimeInSeconds + data.expires_in,
      };

      store.setTokens(refreshed);
      return refreshed;
    } catch (error) {
      console.error('Token refresh execution failed:', error);
      throw error;
    }
  }
}
