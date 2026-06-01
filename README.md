# DJ Command Center

A macOS desktop app for DJs to run a live song-request ecosystem — built with [React Native for macOS](https://microsoft.github.io/react-native-windows/). It connects to **Spotify** so a DJ can authenticate and (ultimately) manage a crowd-driven request queue and playlists during an event.

> Status: Phase 2 — guest web + Supabase Realtime sync. Spotify login and approve-to-playlist flow working; see [Phase 2 setup](docs/PHASE2_SETUP.md).

## Platform

This is a **macOS-only** React Native project (`react-native-macos`). There are no iOS or Android targets — the native project lives in `macos/`.

- React Native (macOS) `0.76.3`
- React `18.3.1`
- Node `>= 18`, CocoaPods (install via Homebrew: `brew install cocoapods`)
- Xcode (with Command Line Tools)

## Getting started

Install JS dependencies and CocoaPods:

```sh
npm install
pod install --project-directory=macos
```

> `npm install` automatically applies local framework patches via `patch-package` (see [Patches](#patches)).

### Run the app

The simplest path (builds, launches, and starts Metro if needed):

```sh
npx react-native run-macos
# or
npm run macos
```

Or run Metro and the app in separate terminals:

```sh
# Terminal 1 — JS bundler
npm start

# Terminal 2 — build + launch the macOS app
npx react-native run-macos
```

You can also open `macos/DJCommandCenter.xcworkspace` in Xcode and run the `DJCommandCenter-macOS` scheme.

JS changes hot-reload (press <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in the app to force a reload). Re-run `run-macos` only after changing native code.

## Spotify setup

The app uses the **Authorization Code + PKCE** flow (no client secret is embedded — appropriate for a public client).

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Add this exact Redirect URI (Settings → Edit → Redirect URIs):
   ```
   djcommandcenter://callback
   ```
3. Put your client ID in `src/spotifyConfig.ts`.

The `djcommandcenter://` URL scheme is registered in `macos/DJCommandCenter-macOS/Info.plist`, and the `AppDelegate` forwards the redirect to React Native's `Linking` API.

## Phase 2: Guest requests (Supabase)

Guests request songs from **`guest-web/`** (Vite React); the DJ macOS inbox updates live via Supabase Realtime.

| Component | Location |
|-----------|----------|
| DB migration + RLS | `supabase/migrations/001_requests.sql` |
| Spotify search proxy | `supabase/functions/search-tracks/` |
| DJ Realtime inbox | `src/hooks/useRealtimeRequests.ts`, `App.tsx` |
| Guest mobile web | `guest-web/` |

**Setup:** [docs/PHASE2_SETUP.md](docs/PHASE2_SETUP.md) — Supabase project, Edge Function secrets, DJ `supabase.config.ts`, deploy guest web, QR URL.

**E2E checklist:** [docs/E2E_TEST.md](docs/E2E_TEST.md)

## Project structure

```
App.tsx                     UI entry — Spotify connect screen
src/
  spotifyConfig.ts          Client ID, redirect URI, scopes
  pkce.ts                   PKCE verifier / S256 challenge (pure JS)
  SpotifyLoginController.ts  Opens browser, captures the deep-link redirect
  SpotifyAuthManager.ts     Token exchange / refresh (PKCE)
  types.ts                  Shared types
macos/                      Native macOS Xcode project
patches/                    patch-package patches for react-native-macos
```

## Patches

Two fixes for `react-native-macos@0.76.3` are kept in `patches/` and re-applied
automatically by the `postinstall` script:

- **NativeAnimatedHelper** — passed `null` into `NativeEventEmitter` on macOS,
  crashing any `Animated` usage (e.g. `TouchableOpacity`). Patched to pass the
  native animated module on macOS.
- **`run-macos` CLI** — `getBuildSettings` resolved the Xcode workspace by bare
  filename and failed after a successful build. Patched to resolve it against
  the project source directory.

## License

Private / unpublished.
