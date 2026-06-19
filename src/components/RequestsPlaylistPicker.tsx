// src/components/RequestsPlaylistPicker.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlaylistSummary } from '../types/playlist';

interface RequestsPlaylistPickerProps {
  selected: PlaylistSummary | null;
  playlists: PlaylistSummary[];
  loadingSaved: boolean;
  loadingPlaylists: boolean;
  creatingPlaylist: boolean;
  error: string | null;
  expanded: boolean;
  onToggleExpanded: () => void;
  onSelect: (playlist: PlaylistSummary) => void;
  onCreate: (name: string) => void;
}

const DEFAULT_NEW_PLAYLIST_NAME = 'Guest Requests';

/**
 * Lets the DJ create or pick which Spotify playlist receives approved guest requests.
 */
export function RequestsPlaylistPicker({
  selected,
  playlists,
  loadingSaved,
  loadingPlaylists,
  creatingPlaylist,
  error,
  expanded,
  onToggleExpanded,
  onSelect,
  onCreate,
}: RequestsPlaylistPickerProps): React.JSX.Element {
  const [newPlaylistName, setNewPlaylistName] = useState(DEFAULT_NEW_PLAYLIST_NAME);

  useEffect(() => {
    if (!expanded) {
      setNewPlaylistName(DEFAULT_NEW_PLAYLIST_NAME);
    }
  }, [expanded]);

  const trimmedName = newPlaylistName.trim();
  const canCreate = trimmedName.length > 0 && !creatingPlaylist;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Requests playlist</Text>
      <Text style={styles.hint}>
        Create a new playlist or choose an existing one for approved tracks.
      </Text>

      {loadingSaved ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#1DB954" size="small" />
          <Text style={styles.loadingText}>Loading saved choice…</Text>
        </View>
      ) : selected ? (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>Selected</Text>
          <Text style={styles.selectedName} numberOfLines={2}>
            {selected.name}
          </Text>
        </View>
      ) : (
        <Text style={styles.warningText}>
          Create or choose a playlist before approving requests.
        </Text>
      )}

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={onToggleExpanded}
        accessibilityLabel={expanded ? 'Hide playlist options' : 'Set requests playlist'}
      >
        <Text style={styles.toggleButtonText}>
          {expanded
            ? 'Hide options'
            : selected
              ? 'Change playlist'
              : 'Set requests playlist'}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {expanded && (
        <View style={styles.listContainer}>
          <Text style={styles.sectionLabel}>Create new</Text>
          <View style={styles.createRow}>
            <TextInput
              style={styles.createInput}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Playlist name"
              placeholderTextColor="#7A7A84"
              cursorColor="#FFFFFF"
              autoCorrect={false}
              editable={!creatingPlaylist}
            />
            <TouchableOpacity
              style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
              onPress={() => onCreate(trimmedName)}
              disabled={!canCreate}
              accessibilityLabel="Create playlist"
            >
              {creatingPlaylist ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Your playlists</Text>
          {loadingPlaylists ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#1DB954" size="small" />
              <Text style={styles.loadingText}>Loading your playlists…</Text>
            </View>
          ) : playlists.length === 0 ? (
            <Text style={styles.emptyText}>
              No playlists yet — create one above.
            </Text>
          ) : (
            <ScrollView style={styles.list} nestedScrollEnabled>
              {playlists.map(playlist => {
                const isSelected = selected?.id === playlist.id;
                return (
                  <TouchableOpacity
                    key={playlist.id}
                    style={[styles.listRow, isSelected && styles.listRowSelected]}
                    onPress={() => onSelect(playlist)}
                  >
                    <Text
                      style={[styles.listRowText, isSelected && styles.listRowTextSelected]}
                      numberOfLines={1}
                    >
                      {playlist.name}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#23232B',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginTop: 12,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    color: '#8A8A94',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  selectedRow: {
    backgroundColor: '#14321A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  selectedLabel: {
    color: '#1DB954',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  selectedName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    color: '#FFB020',
    fontSize: 12,
    marginBottom: 10,
  },
  toggleButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1DB954',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggleButtonText: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 12,
  },
  sectionLabel: {
    color: '#8A8A94',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  createInput: {
    flex: 1,
    backgroundColor: '#1A1A20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A44',
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  createButton: {
    backgroundColor: '#1DB954',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.45,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    maxHeight: 180,
    borderRadius: 8,
    backgroundColor: '#1A1A20',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A44',
  },
  listRowSelected: {
    backgroundColor: '#14321A',
  },
  listRowText: {
    flex: 1,
    color: '#C6C6CE',
    fontSize: 13,
  },
  listRowTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkmark: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    color: '#8A8A94',
    fontSize: 12,
  },
  emptyText: {
    color: '#8A8A94',
    fontSize: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 8,
  },
});
