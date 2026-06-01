// src/components/RequestQueue.tsx
import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GuestRequest } from '../types/queue';

interface RequestQueueProps {
  requests: GuestRequest[];
  onApprove: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

/**
 * DJ inbox: incoming guest requests awaiting Approve / Decline.
 * Only approved requests are written to the Spotify Requests playlist.
 */
export function RequestQueue({
  requests,
  onApprove,
  onDecline,
}: RequestQueueProps): React.JSX.Element {
  if (requests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No requests yet.</Text>
        <Text style={styles.emptyHint}>
          Incoming guest requests will appear here for your review.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {requests.map(request => (
        <View
          key={request.id}
          style={[styles.row, request.status === 'declined' && styles.rowDeclined]}
        >
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
          <RequestActions
            request={request}
            onApprove={onApprove}
            onDecline={onDecline}
          />
        </View>
      ))}
    </ScrollView>
  );
}

function RequestActions({
  request,
  onApprove,
  onDecline,
}: {
  request: GuestRequest;
  onApprove: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}): React.JSX.Element {
  if (request.status === 'pending' && request.syncStatus === 'idle') {
    return (
      <View style={styles.actionGroup}>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => onApprove(request.id)}
          accessibilityLabel={`Approve ${request.track.title}`}
        >
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => onDecline(request.id)}
          accessibilityLabel={`Decline ${request.track.title}`}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <SyncStatusBadge request={request} />;
}

function SyncStatusBadge({ request }: { request: GuestRequest }): React.JSX.Element {
  if (request.status === 'declined') {
    return (
      <View style={[styles.statusBadge, styles.statusBadgeDeclined]}>
        <Text style={styles.statusBadgeTextDeclined}>Declined</Text>
      </View>
    );
  }

  if (request.syncStatus === 'submitting') {
    return (
      <View style={styles.statusBadge}>
        <ActivityIndicator color="#1DB954" size="small" />
        <Text style={styles.statusBadgeHint}>Submitting</Text>
      </View>
    );
  }

  if (request.syncStatus === 'failed') {
    return (
      <View style={[styles.statusBadge, styles.statusBadgeFailed]}>
        <Text style={styles.statusBadgeTextFailed}>Failed</Text>
      </View>
    );
  }

  if (request.syncStatus === 'synced') {
    return (
      <View style={[styles.statusBadge, styles.statusBadgeSynced]}>
        <Text style={styles.statusBadgeTextSynced}>Synced</Text>
      </View>
    );
  }

  return (
    <View style={[styles.statusBadge, styles.statusBadgePending]}>
      <Text style={styles.statusBadgeTextPending}>Pending</Text>
    </View>
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
  rowDeclined: {
    opacity: 0.55,
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
  actionGroup: {
    flexDirection: 'row',
    marginLeft: 10,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#1DB954',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5A5A64',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  declineButtonText: {
    color: '#9A9AA4',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  statusBadgeHint: {
    color: '#1DB954',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  statusBadgeSynced: {
    borderWidth: 1,
    borderColor: '#4BB543',
  },
  statusBadgeTextSynced: {
    color: '#4BB543',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeDeclined: {
    borderWidth: 1,
    borderColor: '#5A5A64',
  },
  statusBadgeTextDeclined: {
    color: '#8A8A94',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeFailed: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  statusBadgeTextFailed: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgePending: {
    borderWidth: 1,
    borderColor: '#3A3A44',
  },
  statusBadgeTextPending: {
    color: '#C6C6CE',
    fontSize: 12,
    fontWeight: '600',
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
