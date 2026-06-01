// Supabase Edge Function: guest Spotify catalog search (Client Credentials).
// Secrets (Dashboard -> Edge Functions -> Secrets):
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpotifyTokenResponse {
  access_token: string;
}

interface SpotifySearchResponse {
  tracks?: {
    items?: Array<{
      id: string;
      name: string;
      duration_ms: number;
      artists: Array<{ name: string }>;
      album: {
        name: string;
        images: Array<{ url: string; width: number; height: number }>;
      };
    }>;
  };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAppAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token error [${response.status}]: ${text}`);
  }

  const data = (await response.json()) as SpotifyTokenResponse & { expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'Spotify credentials not configured on Edge Function' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '5'), 10);

  if (!query) {
    return new Response(JSON.stringify({ tracks: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const token = await getAppAccessToken(clientId, clientSecret);
    const searchUrl =
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}&limit=${limit}`;

    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!searchResponse.ok) {
      const text = await searchResponse.text();
      return new Response(
        JSON.stringify({ error: `Spotify search failed [${searchResponse.status}]: ${text}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = (await searchResponse.json()) as SpotifySearchResponse;
    const items = data.tracks?.items ?? [];

    const tracks = items.map(item => ({
      id: item.id,
      title: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      album: item.album.name,
      artworkUrl: item.album.images[2]?.url || item.album.images[0]?.url || '',
      durationMs: item.duration_ms,
    }));

    return new Response(JSON.stringify({ tracks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown search error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
