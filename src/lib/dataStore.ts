/**
 * CLMS Supabase Data Store
 * All data reads/writes go to Supabase — no localStorage, no seed data.
 * Realtime subscriptions ensure live sync across all devices.
 */
import { supabase } from './supabase';
const db = supabase as any;
import type { BillStatus, Role } from '../types/database';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BillItem {
  id: string;
  bill_number: string;
  title: string;
  description: string;
  status: BillStatus;
  type: 'new' | 'repeal' | 'suspend';
  target_law_id?: string;
  ministry: string;       // human label e.g. "Health"
  ministry_code: string;  // e.g. "health"
  created_by_name: string;
  created_at: string;
}

export interface RequestItem {
  id: string;
  from: string;   // from_ministry_name
  to: string;     // to_ministry_name
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export interface VoteItem {
  id: string;
  bill_id: string;
  user_name: string;   // voted_by_name
  role: Role;          // voted_by_role
  vote: 'approve' | 'reject' | 'abstain';
  timestamp: string;
}

export interface LawItem {
  id: string;
  law_number: string;
  bill_id: string;
  title: string;
  ministry: string;
  ministry_code: string;
  status: 'active' | 'suspended' | 'repealed';
  approved_at: string;
  approved_by: string;  // approved_by_name
}

// ─── Listener System (for legacy subscribeDataStore compatibility) ────────────

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeDataStore = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

const notifyListeners = () => listeners.forEach(l => l());

// ─── Supabase Realtime Setup ─────────────────────────────────────────────────

let realtimeChannel: ReturnType<typeof db.channel> | null = null;

export const initRealtimeSync = () => {
  if (realtimeChannel) return;

  realtimeChannel = db
    .channel('clms_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, notifyListeners)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'laws' }, notifyListeners)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'parliament_votes' }, notifyListeners)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, notifyListeners)
    .subscribe();
};

// ─── MINISTRY LABEL MAP ─────────────────────────────────────────────────────

export const MINISTRY_CODE_TO_LABEL: Record<string, string> = {
  health: 'Health',
  education: 'Education',
  finance: 'Finance',
  career: 'Career Development',
  it: 'Information Technology',
  personal_dev: 'Personal Development',
  entertainment: 'Entertainment',
  external_affairs: 'External Affairs',
};

export const MINISTRY_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(MINISTRY_CODE_TO_LABEL).map(([k, v]) => [v.toLowerCase(), k])
);

// ─── Bill Number Generator ───────────────────────────────────────────────────

const MINISTRY_PREFIX: Record<string, string> = {
  health: 'HB',
  education: 'ED',
  finance: 'FN',
  career: 'CD',
  it: 'IT',
  personal_dev: 'PD',
  entertainment: 'EN',
  external_affairs: 'EA',
};

async function generateBillNumber(ministryCode: string): Promise<string> {
  const prefix = MINISTRY_PREFIX[ministryCode] ?? 'GB';
  const year = new Date().getFullYear();
  const { count } = await db
    .from('bills')
    .select('*', { count: 'exact', head: true })
    .eq('ministry_code', ministryCode);
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  return `${prefix}-${year}-${seq}`;
}

async function generateLawNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await db
    .from('laws')
    .select('*', { count: 'exact', head: true });
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  return `LAW-${year}-${seq}`;
}

// ─── Row → Domain Type Mappers ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowToBill = (row: any): BillItem => ({
  id: row.id,
  bill_number: row.bill_number,
  title: row.title,
  description: row.description ?? '',
  status: row.status as BillStatus,
  type: row.type || 'new',
  target_law_id: row.target_law_id,
  ministry: MINISTRY_CODE_TO_LABEL[row.ministry_code] ?? row.ministry_code,
  ministry_code: row.ministry_code,
  created_by_name: row.created_by_name ?? '',
  created_at: row.created_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowToRequest = (row: any): RequestItem => ({
  id: row.id,
  from: row.from_ministry_name,
  to: row.to_ministry_name,
  title: row.title,
  description: row.description ?? '',
  amount: Number(row.amount) || 0,
  status: row.status as RequestItem['status'],
  priority: row.priority as RequestItem['priority'],
  created_at: row.created_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowToVote = (row: any): VoteItem => ({
  id: row.id,
  bill_id: row.bill_id,
  user_name: row.voted_by_name,
  role: row.voted_by_role as Role,
  vote: row.vote as VoteItem['vote'],
  timestamp: row.timestamp,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowToLaw = (row: any): LawItem => ({
  id: row.id,
  law_number: row.law_number,
  bill_id: row.bill_id,
  title: row.title,
  ministry: MINISTRY_CODE_TO_LABEL[row.ministry_code] ?? row.ministry_code,
  ministry_code: row.ministry_code,
  status: row.status as LawItem['status'],
  approved_at: row.approved_at,
  approved_by: row.approved_by_name ?? 'President',
});

// ─── DATA STORE API ──────────────────────────────────────────────────────────

export const DataStore = {

  // ─── BILLS ────────────────────────────────────────────────────────────────

  getBills: async (): Promise<BillItem[]> => {
    const { data, error } = await db
      .from('bills')
      .select('*')
      .not('status', 'in', '("deleted","archived")')
      .order('created_at', { ascending: false });
    if (error) { console.error('[DataStore] getBills error:', error); return []; }
    return (data ?? []).map(rowToBill);
  },

  addBill: async (bill: {
    title: string;
    description: string;
    ministry_code: string;
    created_by_name: string;
    type?: 'new' | 'repeal' | 'suspend';
    target_law_id?: string;
  }): Promise<BillItem | null> => {
    const bill_number = await generateBillNumber(bill.ministry_code);
    const { data, error } = await db
      .from('bills')
      .insert({
        bill_number,
        title: bill.title,
        description: bill.description,
        ministry_code: bill.ministry_code,
        created_by_name: bill.created_by_name,
        type: bill.type || 'new',
        target_law_id: bill.target_law_id || null,
        status: 'draft',
      })
      .select()
      .single();
    if (error) {
      console.error('[DataStore] addBill error:', error);
      throw new Error(error.message || 'Database insert failed');
    }
    notifyListeners();
    return rowToBill(data);
  },

  updateBillStatus: async (billId: string, status: BillStatus): Promise<void> => {
    const { error } = await db
      .from('bills')
      .update({ status })
      .eq('id', billId);
    if (error) { console.error('[DataStore] updateBillStatus error:', error); return; }

    // If approved → also create a law or update target law
    if (status === 'approved' || status === 'enacted') {
      const { data: bill } = await db
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single();
      if (bill) {
        if (bill.type === 'repeal' && bill.target_law_id) {
          await DataStore.updateLawStatus(bill.target_law_id, 'repealed');
        } else if (bill.type === 'suspend' && bill.target_law_id) {
          await DataStore.updateLawStatus(bill.target_law_id, 'suspended');
        } else {
          await DataStore.addLawFromBill(rowToBill(bill));
        }
      }
    }
    notifyListeners();
  },

  // ─── LAWS ─────────────────────────────────────────────────────────────────

  getLaws: async (): Promise<LawItem[]> => {
    const { data, error } = await db
      .from('laws')
      .select('*')
      .order('approved_at', { ascending: false });
    if (error) { console.error('[DataStore] getLaws error:', error); return []; }
    return (data ?? []).map(rowToLaw);
  },

  updateLawStatus: async (lawId: string, status: 'active' | 'suspended' | 'repealed'): Promise<void> => {
    const { error } = await db.from('laws').update({ status }).eq('id', lawId);
    if (error) console.error('[DataStore] updateLawStatus error:', error);
    notifyListeners();
  },

  addLawFromBill: async (bill: BillItem): Promise<void> => {
    // Check no duplicate
    const { count } = await db
      .from('laws')
      .select('*', { count: 'exact', head: true })
      .eq('bill_id', bill.id);
    if ((count ?? 0) > 0) return;

    const law_number = await generateLawNumber();
    const { error } = await db.from('laws').insert({
      law_number,
      bill_id: bill.id,
      title: bill.title,
      ministry_code: bill.ministry_code,
      status: 'active',
      approved_by_name: 'President Alexander',
    });
    if (error) console.error('[DataStore] addLawFromBill error:', error);
    notifyListeners();
  },

  // ─── REQUESTS ─────────────────────────────────────────────────────────────

  getRequests: async (): Promise<RequestItem[]> => {
    const { data, error } = await db
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('[DataStore] getRequests error:', error); return []; }
    return (data ?? []).map(rowToRequest);
  },

  addRequest: async (req: {
    title: string;
    description: string;
    from: string;
    to: string;
    amount: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<RequestItem | null> => {
    const { data, error } = await db
      .from('requests')
      .insert({
        from_ministry_name: req.from,
        to_ministry_name: req.to,
        title: req.title,
        description: req.description,
        amount: req.amount,
        priority: req.priority,
        status: 'pending',
      })
      .select()
      .single();
    if (error) { console.error('[DataStore] addRequest error:', error); return null; }
    notifyListeners();
    return rowToRequest(data);
  },

  updateRequestStatus: async (
    requestId: string,
    status: 'pending' | 'approved' | 'rejected' | 'returned'
  ): Promise<void> => {
    const { error } = await db
      .from('requests')
      .update({ status })
      .eq('id', requestId);
    if (error) console.error('[DataStore] updateRequestStatus error:', error);
    notifyListeners();
  },

  // ─── VOTES ────────────────────────────────────────────────────────────────

  getVotes: async (billId?: string): Promise<VoteItem[]> => {
    let query = db.from('parliament_votes').select('*').order('timestamp', { ascending: false });
    if (billId) query = query.eq('bill_id', billId);
    const { data, error } = await query;
    if (error) { console.error('[DataStore] getVotes error:', error); return []; }
    return (data ?? []).map(rowToVote);
  },

  castVote: async (
    billId: string,
    userName: string,
    role: Role,
    vote: 'approve' | 'reject' | 'abstain'
  ): Promise<void> => {
    const { error } = await db
      .from('parliament_votes')
      .upsert(
        {
          bill_id: billId,
          voted_by_name: userName,
          voted_by_role: role,
          vote,
          timestamp: new Date().toISOString(),
        },
        { onConflict: 'bill_id,voted_by_name' }
      );
    if (error) console.error('[DataStore] castVote error:', error);
    notifyListeners();
  },
};
