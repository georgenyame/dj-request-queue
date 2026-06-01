// src/components/RequestQueue.tsx
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GuestRequest } from '../types/queue';

interface RequestQueueProps {
  requests: GuestRequest[];
}

/**
 * Scrollable list of guest song requests for the DJ booth. Each row shows the
 * track artwork, title, artist, and current vote count.
 */
export function RequestQueue({ requests }: RequestQueueProps): React.JSX.Element {
  if (requests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No requests yet.</Text>
        <Text style={styles.emptyHint}>
          Search for a song above to add it to the queue.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {requests.map(request => (
        <View key={request.id} style={styles.row}>
          {request.track.artworkUrl ? (
            <Image source={{ uri: request.track.artworkUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Text style={styles.thumbPlaceholderText}>♪</Text>
            </View>
          )}
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={1}>
              {request.track.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {request.track.artist}
            </Text>
          </View>
          <View style={styles.voteBadge}>
            <Text style={styles.voteCount}>{request.votes}</Text>
            <Text style={styles.voteLabel}>▲</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23232B',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#15151A',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    color: '#555',
    fontSize: 20,
  },
  meta: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  artist: {
    color: '#9A9AA4',
    fontSize: 12,
    marginTop: 2,
  },
  voteBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14321A',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  voteCount: {
    color: '#4BB543',
    fontSize: 14,
    fontWeight: '700',
  },
  voteLabel: {
    color: '#1DB954',
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#C6C6CE',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyHint: {
    color: '#8A8A94',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});
