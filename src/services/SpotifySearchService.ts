// src/services/SpotifySearchService.ts
import { SpotifyApiClient } from './SpotifyApiClient';
import { TrackItem } from '../types/queue';

export class SpotifySearchService {
  /**
   * Queries the Spotify catalog for tracks matching the search term
   * and maps the payload into our local TrackItem format.
   */
  static async searchTracks(query: string, limit = 5): Promise<TrackItem[]> {
    if (!query.trim()) return [];

    try {
      // Encode the string safely for query parameter transmission.
      const formattedQuery = encodeURIComponent(query);
      const endpoint = `/search?type=track&q=${formattedQuery}&limit=${limit}`;

      const data = await SpotifyApiClient.request<any>(endpoint);

      // Fallback cleanly if no items match.
      if (!data?.tracks?.items) return [];

      // Map raw Spotify track payloads into our concise TrackItem structure.
      return data.tracks.items.map((item: any) => ({
        id: item.id,
        title: item.name,
        artist: item.artists.map((a: any) => a.name).join(', '),
        album: item.album.name,
        // Prefer the smallest thumbnail for the compact list; let the UI render a
        // placeholder when no artwork is available.
        artworkUrl:
          item.album.images[2]?.url || item.album.images[0]?.url || '',
        durationMs: item.duration_ms,
      }));
    } catch (error) {
      console.error('Error querying Spotify search catalog:', error);
      throw error;
    }
  }
}
