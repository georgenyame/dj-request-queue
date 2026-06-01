// src/services/SpotifyPlaylistService.ts
import { SpotifyApiClient } from './SpotifyApiClient';

interface SpotifyUser {
  id: string;
  display_name?: string;
}

interface PlaylistMeta {
  name: string;
  owner: { id: string; display_name?: string };
  collaborative: boolean;
  public: boolean;
}

/**
 * Writes guest-requested tracks into the DJ's existing Requests playlist.
 * The DJ then pulls from that playlist in Rekordbox — we never start playback here.
 */
export class SpotifyPlaylistService {
  /**
   * Appends a track to the configured Requests playlist.
   *
   * @param playlistId Spotify playlist id (22-char id from the share link, not the URI).
   */
  static async addTrack(playlistId: string, trackId: string): Promise<void> {
    await this.assertCurrentUserOwnsPlaylist(playlistId);

    const trackUri = `spotify:track:${trackId}`;
    try {
      // Spotify's Feb 2026 API migration: /tracks write endpoints return 403;
      // use /items instead (same body shape).
      await SpotifyApiClient.request(`/playlists/${playlistId}/items`, {
        method: 'POST',
        body: JSON.stringify({ uris: [trackUri] }),
      });
      console.log(`Added track ${trackId} to Requests playlist ${playlistId}`);
    } catch (error: any) {
      if (isForbiddenError(error)) {
        throw new Error(
          'Spotify rejected the playlist update (403). Ensure the Requests playlist ' +
            'is owned by your connected account, then disconnect and reconnect Spotify.',
        );
      }
      throw error;
    }
  }

  /**
   * Confirms the logged-in Spotify user owns the target playlist.
   * Spotify returns 403 on add when the playlist belongs to another account.
   */
  private static async assertCurrentUserOwnsPlaylist(
    playlistId: string,
  ): Promise<void> {
    const me = await SpotifyApiClient.request<SpotifyUser>('/me');
    const playlist = await SpotifyApiClient.request<PlaylistMeta>(
      `/playlists/${playlistId}?fields=name,owner(id,display_name),collaborative,public`,
    );

    if (playlist.owner.id === me.id) {
      return;
    }

    const ownerName = playlist.owner.display_name ?? playlist.owner.id;
    const meName = me.display_name ?? me.id;
    throw new Error(
      `The Requests playlist "${playlist.name}" is owned by ${ownerName}, ` +
        `but you are logged in as ${meName}. Use a playlist created on the connected account.`,
    );
  }
}

function isForbiddenError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('[403]') || error.message.includes('"status": 403'))
  );
}
