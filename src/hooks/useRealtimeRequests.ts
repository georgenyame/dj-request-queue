import { useCallback, useEffect, useState } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { GuestRequest, RequestRow } from '../types/queue';
import {
  fetchRequests,
  mapRowToGuestRequest,
} from '../services/RequestSyncService';
import { getSupabaseClient, isSupabaseConfigured } from '../services/SupabaseClient';

function mergeRow(
  prev: GuestRequest[],
  row: RequestRow,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
): GuestRequest[] {
  if (eventType === 'DELETE') {
    return prev.filter(r => r.id !== row.id);
  }

  const mapped = mapRowToGuestRequest(row);
  const existing = prev.find(r => r.id === row.id);

  const merged: GuestRequest = existing
    ? { ...mapped, syncStatus: existing.syncStatus }
    : mapped;

  if (eventType === 'INSERT') {
    return [merged, ...prev.filter(r => r.id !== row.id)];
  }

  return prev.map(r => (r.id === row.id ? merged : r));
}

export function useRealtimeRequests() {
  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSyncStatus = useCallback((id: string, syncStatus: GuestRequest['syncStatus']) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, syncStatus } : r)));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError(
        'Supabase not configured. Copy supabase.config.example.ts to supabase.config.ts.',
      );
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetchRequests()
      .then(data => {
        if (!cancelled) {
          setRequests(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load requests');
          setLoading(false);
        }
      });

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('dj-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload: RealtimePostgresChangesPayload<RequestRow>) => {
          const eventType = payload.eventType;
          if (eventType === 'DELETE') {
            const oldRow = payload.old as RequestRow;
            if (oldRow?.id) {
              setRequests(prev => mergeRow(prev, oldRow, 'DELETE'));
            }
            return;
          }

          const row = payload.new as RequestRow;
          if (row?.id) {
            setRequests(prev => mergeRow(prev, row, eventType));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { requests, loading, error, setSyncStatus, setRequests };
}
