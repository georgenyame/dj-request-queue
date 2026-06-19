# Phase 2: Guest-to-Booth Real-Time Sync

Guest phones submit song requests via a mobile web app; the macOS DJ inbox updates live over Supabase Realtime. Approve still writes to Spotify only from the DJ app.

## Architecture

```
Guest web (Vite)  →  INSERT pending  →  Supabase requests table
                                              ↓ Realtime
macOS DJ app      ←  postgres_changes ←  requests table
DJ Approve        →  Spotify Requests playlist + UPDATE approved
DJ Decline        →  UPDATE declined (no Spotify)
Guest search      →  Edge Function search-tracks → Spotify Client Credentials
```

## 1. Create Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link the project:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

3. Apply the migration:

```sh
supabase db push
```

Or paste `supabase/migrations/001_requests.sql` into the SQL Editor in the dashboard.

4. Confirm Realtime is enabled: **Database → Replication** — `requests` should be in the publication.

## 2. Configure secrets

### Edge Function (Spotify search for guests)

Use a Spotify app with **Client Credentials** (same app as DJ OAuth is fine; use Client ID + Secret from the dashboard):

```sh
supabase secrets set SPOTIFY_CLIENT_ID=your_client_id
supabase secrets set SPOTIFY_CLIENT_SECRET=your_client_secret
supabase functions deploy search-tracks --no-verify-jwt
```

Note the function URL:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/search-tracks
```

`--no-verify-jwt` allows guest browsers to call search without a Supabase session (public read-only proxy).

### macOS DJ app

Copy the example config and fill in **Project Settings → API**:

```sh
cp src/config/supabase.config.example.ts src/config/supabase.config.ts
```

| Key | Used by |
|-----|---------|
| `supabaseUrl` | DJ app + guest web |
| `supabaseAnonKey` | Guest web (optional read in DJ) |
| `supabaseServiceRoleKey` | **DJ app only** — UPDATE requests; never commit or ship to guest web |

### Guest web (local)

```sh
cd guest-web
cp .env.example .env.local
# Edit VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_FUNCTION_URL
npm install
npm run dev
```

Open `http://localhost:5173` on your phone (same Wi‑Fi) or use a tunnel (ngrok, etc.) for mobile testing.

## 3. Deploy guest web (QR code URL)

### Vercel (recommended)

1. Import the repo; set **Root Directory** to `guest-web`.
2. Add environment variables (same as `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_FUNCTION_URL`
3. Deploy. Production URL example: `https://dj-requests.vercel.app`

`guest-web/vercel.json` is included for SPA routing.

### Netlify

- Base directory: `guest-web`
- Build command: `npm run build`
- Publish directory: `guest-web/dist`
- Add the same three `VITE_*` env vars.

### QR code for the event

Generate a QR code pointing at your deployed guest URL (single-event v1):

- [qr-code-generator.com](https://www.qr-code-generator.com/) or any QR tool
- Print or display at the venue: **“Scan to request a song”**

Optional later: `?event=wedding-slug` for multi-event routing (not implemented in v1).

## 4. Run the DJ app

```sh
npm install
npm run macos
```

Connect Spotify, then watch **DJ Inbox** — guest submissions appear via Realtime without refresh.

## Security (v1)

- Guest web: **anon key only**; RLS allows INSERT with `status = 'pending'` only.
- DJ app: **service role key** in gitignored `supabase.config.ts` for UPDATE.
- Guest search uses Edge Function Client Credentials — guests never see DJ OAuth tokens.

## Troubleshooting

| Issue | Check |
|-------|--------|
| DJ inbox empty after guest submit | Realtime enabled on `requests`; service role key in DJ config |
| Guest insert fails | RLS policies applied; anon key in guest `.env.local` |
| Search fails | Edge Function deployed; Spotify secrets set; `VITE_SUPABASE_FUNCTION_URL` correct |
| Approve fails Spotify | Same as Phase 1 — playlist ID, scopes, `/items` endpoint |
| Approve fails after Spotify OK | Service role key; network |

See [docs/E2E_TEST.md](./E2E_TEST.md) for the full manual test checklist.
