import type { TrackItem } from '../types';

const searchFunctionUrl = import.meta.env.VITE_SEARCH_FUNCTION_URL ?? '';

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
