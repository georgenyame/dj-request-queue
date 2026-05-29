export const SPOTIFY_CONFIG = {
  clientId: '45cbc8bf79c042a5b9b406a284c7d8c8',
  // Custom URL scheme deep link. Register this exact value as a Redirect URI
  // in your Spotify dashboard, and the scheme below in macos Info.plist.
  redirectUri: 'djcommandcenter://callback',
  scopes: [
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
  ].join(' '),
};
