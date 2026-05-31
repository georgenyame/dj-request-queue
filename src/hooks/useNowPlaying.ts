// src/hooks/useNowPlaying.ts
import { useEffect, useRef, useState } from 'react';
import { SpotifyPlayerService } from '../services/SpotifyPlayerService';
import { CurrentPlaybackState } from '../types/player';

interface NowPlayingState {
  playback: CurrentPlaybackState | null;
  error: string | null;
  isLoading: boolean;
}

const POLL_INTERVAL_MS = 5000;
const TICK_INTERVAL_MS = 1000;

/**
 * Polls Spotify for the active playback every few seconds and advances the
 * progress locally each second so the UI feels live between network polls.
 *
 * Pass `enabled = false` (e.g. before auth) to keep the hook idle.
 */
export function useNowPlaying(enabled: boolean): NowPlayingState {
  const [playback, setPlayback] = useState<CurrentPlaybackState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Latest playback kept in a ref so the 1s ticker doesn't need to re-subscribe.
  const playbackRef = useRef<CurrentPlaybackState | null>(null);
  playbackRef.current = playback;

  useEffect(() => {
    if (!enabled) {
      setPlayback(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const next = await SpotifyPlayerService.getCurrentPlayback();
        if (!cancelled) {
          setPlayback(next);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Failed to read playback.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    poll();
    const pollId = setInterval(poll, POLL_INTERVAL_MS);

    // Local progress ticker: advance progressMs without hitting the network.
    const tickId = setInterval(() => {
      const current = playbackRef.current;
      if (!current || !current.isPlaying) {
        return;
      }
      const nextProgress = Math.min(
        current.progressMs + TICK_INTERVAL_MS,
        current.durationMs,
      );
      setPlayback({ ...current, progressMs: nextProgress });
    }, TICK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, [enabled]);

  return { playback, error, isLoading };
}
