// App.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SpotifyLoginController } from './src/SpotifyLoginController';
import { SpotifyApiClient } from './src/services/SpotifyApiClient';
import { NowPlayingCard } from './src/components/NowPlayingCard';
import { SongSearchInput } from './src/components/SongSearchInput';
import { RequestQueue } from './src/components/RequestQueue';
import { useNowPlaying } from './src/hooks/useNowPlaying';
import { SpotifyTokens } from './src/types';
import { GuestRequest, TrackItem } from './src/types/queue';

function App(): React.JSX.Element {
  // 1. Setup local UI state (Equivalent to @State in SwiftUI)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requests, setRequests] = useState<GuestRequest[]>([]);

  // Live "Now Playing" polling, active only once authenticated.
  const { playback, error: playbackError } = useNowPlaying(!!tokens);

  // Ingest a selected search result into the live request queue.
  const handleSelectTrack = (track: TrackItem) => {
    const timestamp = Date.now();
    const request: GuestRequest = {
      id: `${track.id}-${timestamp}`,
      track,
      votes: 1,
      timestamp,
    };
    setRequests(prev => [request, ...prev]);
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
            <NowPlayingCard playback={playback} error={playbackError} />
          </View>

          {/* Right pane: guest search on top + scrollable request queue */}
          <View style={styles.rightPane}>
            <Text style={styles.paneHeading}>Guest Requests</Text>
            <SongSearchInput onSelect={handleSelectTrack} />
            <RequestQueue requests={requests} />
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