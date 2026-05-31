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
import { SpotifyTokens } from './src/types';

function App(): React.JSX.Element {
  // 1. Setup local UI state (Equivalent to @State in SwiftUI)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <SafeAreaView style={styles.windowContainer}>
      <View style={styles.centerCard}>
        <Text style={styles.titleText}>🎛️ DJCommandCenter</Text>
        <Text style={styles.subtitleText}>Wedding Request Ecosystem Engine</Text>

        {tokens ? (
          <View style={styles.statusSuccessCard}>
            <Text style={styles.successText}>✅ Connected to Spotify Cloud</Text>
            {profileName && (
              <Text style={styles.successText}>👤 {profileName}</Text>
            )}
            <Text style={styles.tokenDataText} numberOfLines={1}>
              Token: {tokens.accessToken}
            </Text>
          </View>
        ) : (
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
        )}

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