// src/services/SpotifyPlaylistCatalogService.ts
import { SpotifyApiClient } from './SpotifyApiClient';
import { PlaylistSummary } from '../types/playlist';

interface SpotifyPlaylistItem {
  id: string;
  name: string;
  owner: { id: string };
}

interface PlaylistsPage {
  items: SpotifyPlaylistItem[];
}

/**
 * Loads playlists the connected DJ can write to (owned by their account).
 */
export class SpotifyPlaylistCatalogService {
  static async fetchOwnedPlaylists(): Promise<PlaylistSummary[]> {
    const me = await SpotifyApiClient.request<{ id: string }>('/me');
    const page = await SpotifyApiClient.request<PlaylistsPage>(
      '/me/playlists?limit=50',
    );

    return (page.items ?? [])
      .filter(item => item.owner.id === me.id)
      .map(item => ({ id: item.id, name: item.name }));
  }

  static async getPlaylistSummary(playlistId: string): Promise<PlaylistSummary> {
    const playlist = await SpotifyApiClient.request<{ id: string; name: string }>(
      `/playlists/${playlistId}?fields=id,name`,
    );
    return { id: playlist.id, name: playlist.name };
  }

  static async createOwnedPlaylist(name: string): Promise<PlaylistSummary> {
    const playlist = await SpotifyApiClient.request<{ id: string; name: string }>(
      '/me/playlists',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: 'Guest song requests from DJ Command Center',
          public: false,
        }),
      },
    );
    return { id: playlist.id, name: playlist.name };
  }
}
