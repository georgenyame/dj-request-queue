export const SPOTIFY_CONFIG = {
  clientId: '45cbc8bf79c042a5b9b406a284c7d8c8',
  // Custom URL scheme deep link. Register this exact value as a Redirect URI
  // in your Spotify dashboard, and the scheme below in macos Info.plist.
  redirectUri: 'djcommandcenter://callback',
  // Existing Spotify playlist where guest requests are appended.
  // Copy the 22-char id from the playlist share link
  // (e.g. open.spotify.com/playlist/THIS_PART?si=...).
  requestsPlaylistId: '7GR5nimg4U0PqARiOopruf',
  scopes: [
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    // Required to read the DJ's active playback for the NowPlayingCard.
    'user-read-currently-playing',
    'user-read-playback-state',
  ].join(' '),
};
