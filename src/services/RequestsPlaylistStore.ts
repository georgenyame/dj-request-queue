// src/services/RequestsPlaylistStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlaylistSummary } from '../types/playlist';

const STORAGE_KEY = '@cue/requests-playlist';
const LEGACY_STORAGE_KEY = '@djcommandcenter/requests-playlist';

/**
 * Persists the DJ's chosen Requests playlist across app restarts.
 */
export class RequestsPlaylistStore {
  static async load(): Promise<PlaylistSummary | null> {
    let raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        await AsyncStorage.setItem(STORAGE_KEY, raw);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as PlaylistSummary;
      if (parsed?.id && parsed?.name) {
        return parsed;
      }
    } catch {
      // Corrupt entry — treat as unset.
    }
    return null;
  }

  static async save(playlist: PlaylistSummary): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(playlist));
  }

  static async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}
