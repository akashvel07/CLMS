/**
 * React hooks for live Supabase data with realtime sync.
 * Each hook fetches data on mount and re-fetches on DataStore notifications.
 */
import { useState, useEffect, useCallback } from 'react';
import { DataStore, initRealtimeSync, subscribeDataStore } from '../lib/dataStore';
import type { BillItem, RequestItem, VoteItem, LawItem } from '../lib/dataStore';

// Initialize realtime sync once when the app loads
initRealtimeSync();

// ─── Bills ───────────────────────────────────────────────────────────────────

export function useBills() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    const data = await DataStore.getBills();
    setBills(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBills();
    // Re-fetch whenever Supabase realtime fires a change
    const unsub = subscribeDataStore(fetchBills);
    return unsub;
  }, [fetchBills]);

  return { bills, loading, refetch: fetchBills };
}

// ─── Votes ───────────────────────────────────────────────────────────────────

export function useVotes(billId?: string) {
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    const data = await DataStore.getVotes(billId);
    setVotes(data);
    setLoading(false);
  }, [billId]);

  useEffect(() => {
    fetchVotes();
    const unsub = subscribeDataStore(fetchVotes);
    return unsub;
  }, [fetchVotes]);

  return { votes, loading, refetch: fetchVotes };
}

// ─── Laws ────────────────────────────────────────────────────────────────────

export function useLaws() {
  const [laws, setLaws] = useState<LawItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLaws = useCallback(async () => {
    const data = await DataStore.getLaws();
    setLaws(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLaws();
    const unsub = subscribeDataStore(fetchLaws);
    return unsub;
  }, [fetchLaws]);

  return { laws, loading, refetch: fetchLaws };
}

// ─── Requests ────────────────────────────────────────────────────────────────

export function useRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    const data = await DataStore.getRequests();
    setRequests(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
    const unsub = subscribeDataStore(fetchRequests);
    return unsub;
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}
