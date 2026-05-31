// src/SpotifyLoginController.ts
import { Linking, EmitterSubscription } from 'react-native';
import { SPOTIFY_CONFIG } from './spotifyConfig';
import { SpotifyAuthManager } from './SpotifyAuthManager';
import { SpotifyTokens } from './types';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';
import { SpotifyTokenStore } from './services/SpotifyTokenStore';

export class SpotifyLoginController {
  /**
   * Runs the Authorization Code + PKCE flow the React Native way:
   * open the system browser, then catch the `djcommandcenter://callback`
   * redirect via the Linking API (no local HTTP server, no client secret).
   */
  static async executeLogin(): Promise<SpotifyTokens> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateCodeVerifier(16); // CSRF guard

    const authUrl =
      'https://accounts.spotify.com/authorize?' +
      new URLSearchParams({
        client_id: SPOTIFY_CONFIG.clientId,
        response_type: 'code',
        redirect_uri: SPOTIFY_CONFIG.redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state,
        scope: SPOTIFY_CONFIG.scopes,
      }).toString();

    return new Promise<SpotifyTokens>((resolve, reject) => {
      let subscription: EmitterSubscription | null = null;
      let settled = false;

      const cleanup = () => {
        if (subscription) {
          subscription.remove();
          subscription = null;
        }
      };

      const handleRedirect = async (url: string | null) => {
        if (settled || !url || !url.startsWith(SPOTIFY_CONFIG.redirectUri)) {
          return;
        }
        settled = true;
        cleanup();

        const params = parseQuery(url);

        if (params.error) {
          reject(new Error(`Spotify authorization denied: ${params.error}`));
          return;
        }
        if (params.state !== state) {
          reject(new Error('State mismatch — possible CSRF, login aborted.'));
          return;
        }
        if (!params.code) {
          reject(new Error('No authorization code returned from Spotify.'));
          return;
        }

        try {
          const tokens = await SpotifyAuthManager.exchangeCodeForTokens(
            params.code,
            codeVerifier,
          );
          // Persist into the shared store so the API client can authenticate
          // and refresh without any React state plumbing.
          SpotifyTokenStore.getInstance().setTokens(tokens);
          resolve(tokens);
        } catch (exchangeError) {
          reject(exchangeError);
        }
      };

      // Listen for the deep-link redirect back into the app
      subscription = Linking.addEventListener('url', ({ url }) =>
        handleRedirect(url),
      );

      // Launch the system browser to Spotify's consent screen
      Linking.openURL(authUrl).catch((browserError) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(new Error(`Failed to launch browser for login: ${browserError}`));
      });
    });
  }
}

function parseQuery(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) {
    return result;
  }
  for (const pair of url.substring(queryIndex + 1).split('&')) {
    const [key, value] = pair.split('=');
    if (key) {
      result[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }
  return result;
}
