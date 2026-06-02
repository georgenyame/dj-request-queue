# DJ Command Center

macOS app for DJs running live Spotify song requests at events. Guests submit tracks from a mobile web client; requests appear in a real-time DJ inbox; approved songs sync to a Spotify playlist.

Built with [React Native for macOS](https://microsoft.github.io/react-native-windows/), TypeScript, the Spotify Web API (OAuth PKCE), and Supabase (PostgreSQL, Realtime, Edge Functions). Developed primarily with Cursor and agentic AI workflows.

> **Status:** In active development. Phase 2 (guest web + Supabase Realtime) is working: Spotify login, live request inbox, approve-to-playlist flow. See [Phase 2 setup](docs/PHASE2_SETUP.md).

## How it works

```
Guest (mobile web)  →  Supabase (requests + Realtime)  →  DJ app (macOS inbox)
                                                              ↓ Approve
                                                         Spotify playlist
```

| Piece | Stack |
|-------|--------|
| DJ app | React Native (macOS), TypeScript |
| Guest requests | Vite + React (`guest-web/`) |
| Backend | Supabase (Postgres, RLS, Realtime, Edge Functions) |
| Music | Spotify API (PKCE for DJ; Client Credentials proxy for guest search) |

## Quick start

**Requirements:** Node 18+, Xcode, CocoaPods (`brew install cocoapods`)

```sh
npm install
pod install --project-directory=macos
npm run macos
```

**Spotify:** Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), add redirect URI `djcommandcenter://callback`, and set your client ID in `src/spotifyConfig.ts`.

**Guest requests (optional):** [docs/PHASE2_SETUP.md](docs/PHASE2_SETUP.md) (Supabase project, Edge Function secrets, guest web deploy).

**E2E test checklist:** [docs/E2E_TEST.md](docs/E2E_TEST.md)

## Project layout

```
App.tsx                 DJ UI entry
src/                    Spotify auth, Realtime inbox, playlist sync
guest-web/              Guest song-request web app
supabase/               Migrations, Edge Functions (e.g. search-tracks)
macos/                  Native macOS Xcode project
docs/                   Setup and testing guides
```

## Platform notes

macOS-only (`react-native-macos`). No iOS or Android targets. Local `patch-package` fixes for `react-native-macos@0.76.3` are applied on `npm install` (see `patches/`).

## License

In active development. All rights reserved.
