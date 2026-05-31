// src/components/NowPlayingCard.tsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CurrentPlaybackState } from '../types/player';

interface NowPlayingCardProps {
  playback: CurrentPlaybackState | null;
  error?: string | null;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * "Now Playing" surface for the DJ booth. Renders the active track's artwork,
 * metadata, and a live progress bar, with graceful empty/error states.
 */
export function NowPlayingCard({ playback, error }: NowPlayingCardProps): React.JSX.Element {
  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>⚠️ {error}</Text>
      </View>
    );
  }

  if (!playback) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>Nothing playing right now</Text>
        <Text style={styles.emptyHint}>
          Start playback in Spotify to see it here.
        </Text>
      </View>
    );
  }

  const progressRatio =
    playback.durationMs > 0
      ? Math.min(1, playback.progressMs / playback.durationMs)
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {playback.artworkUrl ? (
          <Image source={{ uri: playback.artworkUrl }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder]}>
            <Text style={styles.artworkPlaceholderText}>♪</Text>
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {playback.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {playback.artist}
          </Text>
          <Text style={styles.album} numberOfLines={1}>
            {playback.albumName}
          </Text>
          <Text style={styles.statusBadge}>
            {playback.isPlaying ? '▶ Playing' : '❚❚ Paused'}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(playback.progressMs)}</Text>
        <Text style={styles.timeText}>{formatTime(playback.durationMs)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#23232B',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artwork: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: '#15151A',
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkPlaceholderText: {
    color: '#555',
    fontSize: 28,
  },
  meta: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  artist: {
    color: '#C6C6CE',
    fontSize: 13,
    marginTop: 2,
  },
  album: {
    color: '#8A8A94',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    color: '#1DB954',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A44',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1DB954',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#8A8A94',
    fontSize: 11,
    fontFamily: 'Courier',
  },
  emptyText: {
    color: '#C6C6CE',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    color: '#8A8A94',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});
