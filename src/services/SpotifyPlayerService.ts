// src/services/SpotifyPlayerService.ts
import { SpotifyApiClient } from './SpotifyApiClient';
import { CurrentPlaybackState } from '../types/player';

/** Minimal shape of the fields we read from Spotify's currently-playing payload. */
interface RawCurrentlyPlaying {
  is_playing: boolean;
  progress_ms: number | null;
  item: {
    id: string;
    name: string;
    duration_ms: number;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string; width: number; height: number }>;
    };
  } | null;
}

/**
 * Reads the DJ's active Spotify playback.
 *
 * Returns null when nothing is playing (Spotify replies 204, which the API
 * client surfaces as null) or when the current item has no track payload
 * (e.g. an ad or podcast episode we can't render as a track).
 */
export class SpotifyPlayerService {
  static async getCurrentPlayback(): Promise<CurrentPlaybackState | null> {
    const raw = await SpotifyApiClient.request<RawCurrentlyPlaying | null>(
      '/me/player/currently-playing',
    );

    if (!raw || !raw.item) {
      return null;
    }

    const { item } = raw;
    return {
      isPlaying: raw.is_playing,
      progressMs: raw.progress_ms ?? 0,
      trackId: item.id,
      title: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      albumName: item.album.name,
      artworkUrl: item.album.images[0]?.url ?? '',
      durationMs: item.duration_ms,
    };
  }
}
