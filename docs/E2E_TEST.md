# Phase 2 end-to-end test checklist

Run this after completing [PHASE2_SETUP.md](./PHASE2_SETUP.md) with real Supabase and Spotify credentials.

## Prerequisites

- [ ] Supabase migration applied (`requests` table + RLS + Realtime)
- [ ] Edge Function `search-tracks` deployed with Spotify secrets
- [ ] `src/config/supabase.config.ts` filled (DJ service role key)
- [ ] Guest web running locally or deployed with `.env.local` / Vercel env vars
- [ ] DJ macOS app built with `@supabase/supabase-js` installed
- [ ] Spotify connected in DJ app; `requestsPlaylistId` set in `src/spotifyConfig.ts`

## Test flow

### A. Guest search

1. Open guest web on a phone or second browser.
2. Enter optional name (e.g. `Alex`).
3. Search for a known track (e.g. `Blinding Lights`).
4. **Expected:** Results appear within ~1s; artwork and artist shown.

### B. Guest submit → DJ Realtime inbox

1. Tap a search result.
2. **Expected (guest):** Toast “Request sent to the DJ”.
3. **Expected (DJ Mac):** New row appears in DJ Inbox within ~1–2s without refresh.
4. **Expected:** Guest name shows as “Requested by Alex” (or Guest if blank).

### C. DJ Decline

1. Submit another track from guest web.
2. Click **Decline** in DJ inbox.
3. **Expected:** Row shows Declined; no change in Spotify Requests playlist.

### D. DJ Approve → Spotify playlist

1. Submit a track from guest web.
2. Click **Approve** in DJ inbox.
3. **Expected:** Badge shows Submitting → Synced.
4. **Expected:** Track appears in Spotify **Requests** playlist (same playlist ID as Phase 1).
5. **Expected:** Supabase row `status = approved` (check Table Editor optional).

### E. Approve failure / retry

1. Temporarily break Spotify (e.g. disconnect network mid-approve, or invalid playlist ID).
2. Approve a pending request.
3. **Expected:** Alert error; badge **Failed**; DB row stays `pending`.
4. Restore Spotify; click **Approve** again on same row.
5. **Expected:** Retry succeeds; Synced + playlist updated.

## Automated checks (dev machine)

From repo root:

```sh
# Typecheck DJ app
npx tsc --noEmit

# Build guest web
cd guest-web && npm run build
```

Both should complete without errors.

## Sign-off

| Step | Pass |
|------|------|
| A. Guest search | ☐ |
| B. Realtime inbox | ☐ |
| C. Decline | ☐ |
| D. Approve → playlist | ☐ |
| E. Failed retry | ☐ |

Live Realtime + Spotify steps require your Supabase project and DJ Spotify session; automated builds verify compile-time integration only.
