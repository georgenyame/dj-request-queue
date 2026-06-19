import { useEffect, useState, type ChangeEvent } from 'react';
import { isSearchConfigured, searchTracks } from './lib/search';
import { isSupabaseConfigured, submitRequest } from './lib/supabase';
import type { TrackItem } from './types';
import './App.css';

const DEBOUNCE_MS = 300;

function App() {
  const [guestName, setGuestName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const configured = isSupabaseConfigured && isSearchConfigured();

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !configured) {
      setResults([]);
      setSearchError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const tracks = await searchTracks(trimmed);
        if (!cancelled) {
          setResults(tracks);
          setSearchError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSearchError(err instanceof Error ? err.message : 'Search failed.');
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, configured]);

  const handleSelect = async (track: TrackItem) => {
    if (!configured || submittingId) {
      return;
    }

    setSubmittingId(track.id);
    try {
      await submitRequest({
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl,
        guestName: guestName.trim() || 'Guest',
      });
      setToast('Request sent to the DJ');
      setQuery('');
      setResults([]);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Could not submit request.');
    } finally {
      setSubmittingId(null);
    }
  };

  const showDropdown = query.trim().length > 0 && (loading || searchError || results.length > 0);

  return (
    <div className="app">
      <header className="header">
        <h1>Request a Song</h1>
        <p className="subtitle">Search and send your pick to the DJ</p>
      </header>

      {!configured && (
        <div className="config-banner">
          {import.meta.env.PROD ? (
            <>
              Missing environment variables on this deployment. In the Vercel project{' '}
              <strong>dj-booth-request</strong>, add <code>VITE_SUPABASE_URL</code>,{' '}
              <code>VITE_SUPABASE_ANON_KEY</code>, and <code>VITE_SUPABASE_FUNCTION_URL</code>{' '}
              under Settings → Environment Variables, then redeploy.
            </>
          ) : (
            <>
              Missing environment variables. Copy <code>.env.example</code> to{' '}
              <code>.env.local</code> and fill in Supabase + search function URLs.
            </>
          )}
        </div>
      )}

      <label className="field-label" htmlFor="guest-name">
        Your name (optional)
      </label>
      <input
        id="guest-name"
        className="input"
        type="text"
        placeholder="Guest"
        value={guestName}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setGuestName(e.target.value)}
        autoComplete="name"
      />

      <label className="field-label" htmlFor="search">
        Search for a song
      </label>
      <div className="search-wrap">
        <input
          id="search"
          className="input"
          type="search"
          placeholder="Search for a song to request..."
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          disabled={!configured}
          autoComplete="off"
        />

        {showDropdown && (
          <div className="dropdown">
            {loading && <div className="dropdown-status">Searching…</div>}
            {!loading && searchError && (
              <div className="dropdown-error">{searchError}</div>
            )}
            {!loading && !searchError && results.length === 0 && (
              <div className="dropdown-empty">No matches found.</div>
            )}
            {!loading &&
              !searchError &&
              results.map(track => (
                <button
                  key={track.id}
                  type="button"
                  className="result-row"
                  disabled={submittingId === track.id}
                  onClick={() => handleSelect(track)}
                >
                  {track.artworkUrl ? (
                    <img src={track.artworkUrl} alt="" className="thumb" />
                  ) : (
                    <div className="thumb thumb-placeholder">♪</div>
                  )}
                  <div className="result-meta">
                    <div className="result-title">{track.title}</div>
                    <div className="result-artist">{track.artist}</div>
                  </div>
                  {submittingId === track.id && (
                    <span className="result-sending">Sending…</span>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
