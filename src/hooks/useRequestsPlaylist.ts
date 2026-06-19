// src/hooks/useRequestsPlaylist.ts
import { useCallback, useEffect, useState } from 'react';
import { RequestsPlaylistStore } from '../services/RequestsPlaylistStore';
import { SpotifyPlaylistCatalogService } from '../services/SpotifyPlaylistCatalogService';
import { PlaylistSummary } from '../types/playlist';

export function useRequestsPlaylist(isAuthenticated: boolean) {
  const [selected, setSelected] = useState<PlaylistSummary | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    RequestsPlaylistStore.load()
      .then(saved => {
        if (!cancelled) {
          setSelected(saved);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSaved(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadPlaylists = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setLoadingPlaylists(true);
    setError(null);

    try {
      const owned = await SpotifyPlaylistCatalogService.fetchOwnedPlaylists();
      setPlaylists(owned);
    } catch (err: any) {
      setError(err?.message ?? 'Could not load your Spotify playlists.');
    } finally {
      setLoadingPlaylists(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (expanded && isAuthenticated) {
      loadPlaylists();
    }
  }, [expanded, isAuthenticated, loadPlaylists]);

  const selectPlaylist = useCallback(async (playlist: PlaylistSummary) => {
    await RequestsPlaylistStore.save(playlist);
    setSelected(playlist);
    setExpanded(false);
    setError(null);
  }, []);

  const createPlaylist = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || !isAuthenticated) {
        return;
      }

      setCreatingPlaylist(true);
      setError(null);

      try {
        const created = await SpotifyPlaylistCatalogService.createOwnedPlaylist(trimmed);
        setPlaylists(prev => {
          if (prev.some(playlist => playlist.id === created.id)) {
            return prev;
          }
          return [created, ...prev];
        });
        await RequestsPlaylistStore.save(created);
        setSelected(created);
        setExpanded(false);
      } catch (err: any) {
        setError(err?.message ?? 'Could not create playlist.');
      } finally {
        setCreatingPlaylist(false);
      }
    },
    [isAuthenticated],
  );

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return {
    selected,
    playlists,
    loadingSaved,
    loadingPlaylists,
    creatingPlaylist,
    error,
    expanded,
    toggleExpanded,
    selectPlaylist,
    createPlaylist,
  };
}
