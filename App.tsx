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
import { SongSearchInput } from './src/components/SongSearchInput';
import { RequestQueue } from './src/components/RequestQueue';
import { useNowPlaying } from './src/hooks/useNowPlaying';
import { SpotifyTokens } from './src/types';
import { SPOTIFY_CONFIG } from './src/spotifyConfig';
import { GuestRequest, TrackItem } from './src/types/queue';
import { SpotifyTokenStore } from './src/services/SpotifyTokenStore';

function App(): React.JSX.Element {
  // 1. Setup local UI state (Equivalent to @State in SwiftUI)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requests, setRequests] = useState<GuestRequest[]>([]);

  // Live "Now Playing" polling, active only once authenticated.
  const { playback, error: playbackError } = useNowPlaying(!!tokens);

  // Simulate an incoming guest request (search stands in until the QR guest app exists).
  const handleSelectTrack = (track: TrackItem) => {
    const timestamp = Date.now();
    const request: GuestRequest = {
      id: `${track.id}-${timestamp}`,
      track,
      timestamp,
      status: 'pending',
      syncStatus: 'idle',
    };
    setRequests(prev => [request, ...prev]);
  };

  const handleApprove = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') {
      return;
    }

    const playlistId = SPOTIFY_CONFIG.requestsPlaylistId.trim();
    if (!playlistId) {
      Alert.alert(
        'Requests playlist not configured',
        'Set requestsPlaylistId in src/spotifyConfig.ts to your existing Requests playlist id.',
      );
      return;
    }

    setRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'approved', syncStatus: 'submitting' }
          : req,
      ),
    );

    try {
      await SpotifyPlaylistService.addTrack(playlistId, request.track.id);
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'approved', syncStatus: 'synced' }
            : req,
        ),
      );
    } catch (err: any) {
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'approved', syncStatus: 'failed' }
            : req,
        ),
      );
      Alert.alert(
        'Could not add to playlist',
        err?.message ??
          'Failed to add the track to the Requests playlist. Check your Spotify permissions.',
      );
    }
  };

  const handleDecline = (requestId: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'declined', syncStatus: 'idle' }
          : req,
      ),
    );
  };

  const handleDisconnect = () => {
    SpotifyTokenStore.getInstance().clear();
    setTokens(null);
    setProfileName(null);
    setRequests([]);
  };

  // 2. Button Action Handler (Equivalent to an async function triggered by a SwiftUI button)
  const handleSpotifyConnect = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const activeTokens = await SpotifyLoginController.executeLogin();
      setTokens(activeTokens);
      console.log('Successfully authenticated with Spotify! Access Token:', activeTokens.accessToken);

      // Smoke test of the new network layer: authenticated call through
      // SpotifyApiClient (store -> bearer header -> real Spotify response).
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
          {/* Left pane: connection status + live now playing */}
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
            <NowPlayingCard playback={playback} error={playbackError} />
          </View>

          {/* Right pane: DJ inbox (search simulates guest submissions for now) */}
          <View style={styles.rightPane}>
            <Text style={styles.paneHeading}>DJ Inbox</Text>
            <Text style={styles.paneSubheading}>
              Simulate guest request (search below until QR flow is live)
            </Text>
            <SongSearchInput onSelect={handleSelectTrack} />
            <RequestQueue
              requests={requests}
              onApprove={handleApprove}
              onDecline={handleDecline}
            />
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

// 3. Declarative Layout Styling (Think of this like your SwiftUI inline view modifiers)
const styles = StyleSheet.create({
  windowContainer: {
    flex: 1,
    backgroundColor: '#1E1E24', // Sleek dark slate theme for the DJ booth
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
  paneHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  paneSubheading: {
    fontSize: 12,
    color: '#8A8A94',
    marginBottom: 12,
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
    backgroundColor: '#1DB954', // Spotify Green
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
  tokenDataText: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Courier',
  },
  errorBannerText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default App;