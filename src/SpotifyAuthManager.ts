// src/SpotifyAuthManager.ts
import { SPOTIFY_CONFIG } from './spotifyConfig';
import { SpotifyTokens } from './types';

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
   * Refreshes an expired access token. PKCE refresh only needs the client_id.
   * Spotify may also return a new refresh_token, so we surface it when present.
   */
  static async refreshAccessToken(
    refreshToken: string,
  ): Promise<Partial<SpotifyTokens> & Pick<SpotifyTokens, 'accessToken' | 'expiresAt'>> {
    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
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
        throw new Error('Failed to refresh token payload');
      }

      const data = await response.json();
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token, // may be undefined; Spotify rotates optionally
        expiresAt: currentTimeInSeconds + data.expires_in,
      };
    } catch (error) {
      console.error('Token refresh execution failed:', error);
      throw error;
    }
  }
}
