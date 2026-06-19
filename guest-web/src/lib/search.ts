import type { TrackItem } from '../types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const configuredSearchUrl =
  import.meta.env.VITE_SUPABASE_FUNCTION_URL ??
  import.meta.env.VITE_SEARCH_FUNCTION_URL ??
  '';

/** Edge Function path is fixed; derive from project URL when the explicit env var is absent. */
const searchFunctionUrl =
  configuredSearchUrl ||
  (supabaseUrl ? `${supabaseUrl}/functions/v1/search-tracks` : '');

export function isSearchConfigured(): boolean {
  return Boolean(searchFunctionUrl);
}

export async function searchTracks(query: string, limit = 5): Promise<TrackItem[]> {
  if (!searchFunctionUrl) {
    throw new Error('Search function URL is not configured.');
  }

  const url = new URL(searchFunctionUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Search failed [${response.status}]: ${text}`);
  }

  const data = (await response.json()) as { tracks?: TrackItem[]; error?: string };
  if (data.error) {
    throw new Error(data.error);
  }

  return data.tracks ?? [];
}
