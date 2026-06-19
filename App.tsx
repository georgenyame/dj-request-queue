// App.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SpotifyLoginController } from './src/SpotifyLoginController';
import { SpotifyApiClient } from './src/services/SpotifyApiClient';
import { SpotifyPlaylistService } from './src/services/SpotifyPlaylistService';
import { NowPlayingCard } from './src/components/NowPlayingCard';
import { RequestQueue } from './src/components/RequestQueue';
import { RequestsPlaylistPicker } from './src/components/RequestsPlaylistPicker';
import { useNowPlaying } from './src/hooks/useNowPlaying';
import { useRealtimeRequests } from './src/hooks/useRealtimeRequests';
import { useRequestsPlaylist } from './src/hooks/useRequestsPlaylist';
import { SpotifyTokens } from './src/types';
import { SpotifyTokenStore } from './src/services/SpotifyTokenStore';
import {
  approveRequest,
  clearAllRequests,
  declineRequest,
} from './src/services/RequestSyncService';

function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clearingInbox, setClearingInbox] = useState<boolean>(false);

  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    setSyncStatus,
    setRequests,
  } = useRealtimeRequests();

  const { playback, error: playbackError } = useNowPlaying(!!tokens);
  const requestsPlaylist = useRequestsPlaylist(!!tokens);

  const handleApprove = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') {
      return;
    }

    const playlistId = requestsPlaylist.selected?.id;
    if (!playlistId) {
      Alert.alert(
        'No requests playlist selected',
        'Choose or create a Spotify playlist in the sidebar before approving requests.',
      );
      return;
    }

    setSyncStatus(requestId, 'submitting');

    try {
      await SpotifyPlaylistService.addTrack(playlistId, request.track.id);
      await approveRequest(requestId);
      setSyncStatus(requestId, 'synced');
    } catch (err: any) {
      setSyncStatus(requestId, 'failed');
      Alert.alert(
        'Could not add to playlist',
        err?.message ??
          'Failed to add the track to the Requests playlist. Check your Spotify permissions.',
      );
    }
  };

  const handleDecline = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') {
      return;
    }

    try {
      await declineRequest(requestId);
    } catch (err: any) {
      Alert.alert(
        'Could not decline request',
        err?.message ?? 'Failed to update request status in Supabase.',
      );
    }
  };

  const handleClearInbox = () => {
    if (requests.length === 0 || clearingInbox) {
      return;
    }

    Alert.alert(
      'Clear inbox?',
      'This removes all guest requests from the inbox. Tracks already added to your Spotify Requests playlist are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear inbox',
          style: 'destructive',
          onPress: async () => {
            setClearingInbox(true);
            try {
              await clearAllRequests();
              setRequests([]);
            } catch (err: any) {
              Alert.alert(
                'Could not clear inbox',
                err?.message ?? 'Failed to delete requests from Supabase.',
              );
            } finally {
              setClearingInbox(false);
            }
          },
        },
      ],
    );
  };

  const handleDisconnect = () => {
    SpotifyTokenStore.getInstance().clear();
    setTokens(null);
    setProfileName(null);
  };

  const handleSpotifyConnect = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const activeTokens = await SpotifyLoginController.executeLogin();
      setTokens(activeTokens);
      console.log('Successfully authenticated with Spotify! Access Token:', activeTokens.accessToken);

      const me = await SpotifyApiClient.request<{display_name: string; id: string}>('/me');
      console.log('SpotifyApiClient /me OK:', me?.display_name, `(${me?.id})`);
      setProfileName(me?.display_name ?? me?.id ?? 'Unknown');
    } catch (error: any) {
      setErrorMessage(error.message || 'Authentication sequence failed.');
      console.log('Auth Notice:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokens) {
    return (
      <SafeAreaView style={styles.windowContainer}>
        <View style={styles.dashboard}>
          <View style={styles.leftPane}>
            <Text style={styles.titleText}>🎛️ DJCommandCenter</Text>
            <Text style={styles.subtitleText}>Wedding Request Ecosystem Engine</Text>

            <View style={styles.statusSuccessCard}>
              <Text style={styles.successText}>✅ Connected to Spotify Cloud</Text>
              {profileName && (
                <Text style={styles.successText}>👤 {profileName}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.reconnectButton} onPress={handleDisconnect}>
              <Text style={styles.reconnectButtonText}>Reconnect Spotify</Text>
            </TouchableOpacity>
            <RequestsPlaylistPicker
              selected={requestsPlaylist.selected}
              playlists={requestsPlaylist.playlists}
              loadingSaved={requestsPlaylist.loadingSaved}
              loadingPlaylists={requestsPlaylist.loadingPlaylists}
              creatingPlaylist={requestsPlaylist.creatingPlaylist}
              error={requestsPlaylist.error}
              expanded={requestsPlaylist.expanded}
              onToggleExpanded={requestsPlaylist.toggleExpanded}
              onSelect={requestsPlaylist.selectPlaylist}
              onCreate={requestsPlaylist.createPlaylist}
            />
            <NowPlayingCard playback={playback} error={playbackError} />
          </View>

          <View style={styles.rightPane}>
            <View style={styles.inboxHeader}>
              <View style={styles.inboxHeaderText}>
                <Text style={styles.paneHeading}>DJ Inbox</Text>
                <Text style={styles.paneSubheading}>
                  Live guest requests from the QR web app
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.clearInboxButton,
                  (requests.length === 0 || clearingInbox) && styles.clearInboxButtonDisabled,
                ]}
                onPress={handleClearInbox}
                disabled={requests.length === 0 || clearingInbox}
                accessibilityLabel="Clear inbox"
              >
                {clearingInbox ? (
                  <ActivityIndicator color="#9A9AA4" size="small" />
                ) : (
                  <Text style={styles.clearInboxButtonText}>Clear inbox</Text>
                )}
              </TouchableOpacity>
            </View>
            {requestsLoading ? (
              <View style={styles.inboxLoading}>
                <ActivityIndicator color="#1DB954" />
                <Text style={styles.inboxLoadingText}>Loading requests…</Text>
              </View>
            ) : requestsError ? (
              <View style={styles.inboxError}>
                <Text style={styles.inboxErrorText}>{requestsError}</Text>
              </View>
            ) : (
              <RequestQueue
                requests={requests}
                onApprove={handleApprove}
                onDecline={handleDecline}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.windowContainer}>
      <View style={styles.centerCard}>
        <Text style={styles.titleText}>🎛️ DJCommandCenter</Text>
        <Text style={styles.subtitleText}>Wedding Request Ecosystem Engine</Text>

        <TouchableOpacity
          style={styles.connectButton}
          onPress={handleSpotifyConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Connect Spotify Account</Text>
          )}
        </TouchableOpacity>

        {errorMessage && (
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  windowContainer: {
    flex: 1,
    backgroundColor: '#1E1E24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboard: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    padding: 24,
  },
  leftPane: {
    width: 400,
    marginRight: 24,
  },
  rightPane: {
    flex: 1,
    backgroundColor: '#2A2A32',
    borderRadius: 12,
    padding: 20,
  },
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  inboxHeaderText: {
    flex: 1,
  },
  paneHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  paneSubheading: {
    fontSize: 12,
    color: '#8A8A94',
  },
  clearInboxButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5A5A64',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearInboxButtonDisabled: {
    opacity: 0.45,
  },
  clearInboxButtonText: {
    color: '#9A9AA4',
    fontSize: 12,
    fontWeight: '600',
  },
  inboxLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  inboxLoadingText: {
    color: '#8A8A94',
    fontSize: 12,
    marginTop: 8,
  },
  inboxError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  inboxErrorText: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
  },
  centerCard: {
    padding: 30,
    borderRadius: 12,
    backgroundColor: '#2A2A32',
    alignItems: 'center',
    width: 400,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#A0A0AA',
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusSuccessCard: {
    backgroundColor: '#14321A',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  successText: {
    color: '#4BB543',
    fontWeight: 'bold',
  },
  reconnectButton: {
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  reconnectButtonText: {
    color: '#A0A0AA',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  errorBannerText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default App;
