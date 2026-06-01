// src/components/SongSearchInput.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SpotifySearchService } from '../services/SpotifySearchService';
import { TrackItem } from '../types/queue';

interface SongSearchInputProps {
  onSelect: (track: TrackItem) => void;
}

const DEBOUNCE_MS = 300;

/**
 * High-visibility catalog search bar with an instant-results dropdown.
 *
 * Debounces keystrokes so a network request only fires once typing pauses,
 * keeping the desktop UI fluid and avoiding Spotify rate limits.
 */
export function SongSearchInput({ onSelect }: SongSearchInputProps): React.JSX.Element {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const tracks = await SpotifySearchService.searchTracks(trimmed);
        if (!cancelled) {
          setResults(tracks);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Search failed.');
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (track: TrackItem) => {
    onSelect(track);
    setQuery('');
    setResults([]);
    setError(null);
  };

  const showDropdown = query.trim().length > 0 && (loading || error || results.length > 0);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search for a song to request..."
        placeholderTextColor="#7A7A84"
        cursorColor="#FFFFFF"
        autoCorrect={false}
      />

      {showDropdown && (
        <View style={styles.dropdown}>
          {loading && (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#1DB954" />
            </View>
          )}

          {!loading && error && (
            <Text style={styles.errorText}>⚠️ {error}</Text>
          )}

          {!loading && !error && results.length === 0 && (
            <Text style={styles.emptyText}>No matches found.</Text>
          )}

          {!loading &&
            !error &&
            results.map(track => (
              <TouchableOpacity
                key={track.id}
                style={styles.resultRow}
                onPress={() => handleSelect(track)}
              >
                {track.artworkUrl ? (
                  <Image source={{ uri: track.artworkUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Text style={styles.thumbPlaceholderText}>♪</Text>
                  </View>
                )}
                <View style={styles.resultMeta}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.resultArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10,
  },
  input: {
    backgroundColor: '#15151A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A44',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#23232B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A44',
    paddingVertical: 4,
    zIndex: 20,
  },
  statusRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#15151A',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    color: '#555',
    fontSize: 18,
  },
  resultMeta: {
    flex: 1,
    marginLeft: 10,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultArtist: {
    color: '#9A9AA4',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#9A9AA4',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
