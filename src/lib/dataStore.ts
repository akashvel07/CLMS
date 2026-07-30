/**
 * CLMS Supabase Data Store
 * All data reads/writes go to Supabase — no localStorage, no seed data.
 * Realtime subscriptions ensure live sync across all devices.
 */
import { supabase } from './supabase';
const db = supabase as any;
import type { BillStatus, Role, CourtCase, CourtOrder, SupremeCase, SupremeOrder, NewsFeedItem, CourtVerdict, SupremeRuling } from '../types/database';

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
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'completed';
  president_status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'completed' | null;
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
    .on('postgres_changes', { event: '*', schema: 'public', table: 'court_cases' }, notifyListeners)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'court_orders' }, notifyListeners)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'supreme_court_cases' }, notifyListeners)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'supreme_court_orders' }, notifyListeners)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'news_feed' }, notifyListeners)
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
  president_status: row.president_status as RequestItem['president_status'],
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
        status: req.amount > 200 ? 'pending' : 'pending',
        president_status: req.amount > 200 ? 'pending' : null,
      })
      .select()
      .single();
    if (error) { console.error('[DataStore] addRequest error:', error); return null; }
    notifyListeners();
    return rowToRequest(data);
  },

  updateRequestStatus: async (
    requestId: string,
    status: 'pending' | 'approved' | 'rejected' | 'returned' | 'completed',
    president_status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'completed' | null
  ): Promise<void> => {
    const updatePayload: any = { status };
    if (president_status !== undefined) {
      updatePayload.president_status = president_status;
    }
    const { error } = await db
      .from('requests')
      .update(updatePayload)
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

  // ─── BUDGETS ──────────────────────────────────────────────────────────────

  getBudgets: async () => {
    const { data, error } = await db
      .from('budget_allocations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('[DataStore] getBudgets error:', error); return []; }
    return data;
  },

  saveBudget: async (month: number, year: number, allocations: import('../types/database').BudgetLineItem[], status: 'draft' | 'pending_approval') => {
    const { error } = await db
      .from('budget_allocations')
      .upsert(
        { month, year, allocations, status },
        { onConflict: 'month,year' }
      );
    if (error) console.error('[DataStore] saveBudget error:', error);
    notifyListeners();
  },

  updateBudgetStatus: async (id: string, status: 'approved' | 'rejected', updatedAllocations?: import('../types/database').BudgetLineItem[]) => {
    const updateData: any = { status };
    if (updatedAllocations) {
      updateData.allocations = updatedAllocations;
    }
    const { error } = await db
      .from('budget_allocations')
      .update(updateData)
      .eq('id', id);
    if (error) console.error('[DataStore] updateBudgetStatus error:', error);

    // If approved, update ministry budgets and request statuses
    if (status === 'approved') {
      const { data: budget } = await db.from('budget_allocations').select('*').eq('id', id).single();
      if (budget && budget.allocations) {
        const allocations = budget.allocations as import('../types/database').BudgetLineItem[];
        
        // Sum up amounts per ministry for approved items only
        const ministrySums: Record<string, number> = {};
        
        for (const item of allocations) {
          if (item.status === 'approved') {
            ministrySums[item.ministry_code] = (ministrySums[item.ministry_code] || 0) + item.amount;
            
            // Mark the source request as completed if applicable
            if (item.source_request_id) {
              await db.from('requests').update({ status: 'completed', president_status: 'completed' }).eq('id', item.source_request_id);
            }
          } else if (item.status === 'rejected' && item.source_request_id) {
            // Mark the source request as rejected
            await db.from('requests').update({ status: 'rejected', president_status: 'rejected' }).eq('id', item.source_request_id);
          }
        }
        
        // Add to each ministry's base budget
        for (const [code, addAmount] of Object.entries(ministrySums)) {
          const { data: minData } = await db.from('ministries').select('budget').eq('code', code).single();
          if (minData) {
            const newBudget = Number(minData.budget || 0) + addAmount;
            await db.from('ministries').update({ budget: newBudget }).eq('code', code);
          }
        }
      }
    }
    notifyListeners();
  },

  // ─── NEWS FEED ─────────────────────────────────────────────────────────────────────

  getNews: async (category?: string, limit = 50): Promise<NewsFeedItem[]> => {
    let query = db
      .from('news_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) { console.error('[DataStore] getNews error:', error); return []; }
    return (data ?? []) as NewsFeedItem[];
  },

  postNews: async (item: {
    category: NewsFeedItem['category'];
    headline: string;
    body: string;
    priority?: NewsFeedItem['priority'];
    ref_type?: string;
    ref_id?: string;
    posted_by?: string;
  }): Promise<void> => {
    const { error } = await db.from('news_feed').insert({
      category: item.category,
      headline: item.headline,
      body: item.body,
      priority: item.priority ?? 'normal',
      ref_type: item.ref_type ?? '',
      ref_id: item.ref_id ?? '',
      posted_by: item.posted_by ?? 'System',
    });
    if (error) console.error('[DataStore] postNews error:', error);
    notifyListeners();
  },

  // ─── COURT CASES (High Court) ───────────────────────────────────────────────────────

  getCourtCases: async (): Promise<CourtCase[]> => {
    const { data, error } = await db
      .from('court_cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('[DataStore] getCourtCases error:', error); return []; }
    return (data ?? []) as CourtCase[];
  },

  fileCourtCase: async (params: {
    title: string;
    description: string;
    law_id?: string;
    law_title: string;
    case_type: CourtCase['case_type'];
    filed_by_name: string;
    filed_by_role: string;
  }): Promise<CourtCase | null> => {
    // Generate case number
    const year = new Date().getFullYear();
    const { count } = await db.from('court_cases').select('*', { count: 'exact', head: true });
    const seq = String((count ?? 0) + 1).padStart(4, '0');
    const case_number = `HC-${year}-${seq}`;

    const { data, error } = await db
      .from('court_cases')
      .insert({
        case_number,
        title: params.title,
        description: params.description,
        law_id: params.law_id || null,
        law_title: params.law_title,
        case_type: params.case_type,
        filed_by_name: params.filed_by_name,
        filed_by_role: params.filed_by_role,
        status: 'filed',
      })
      .select()
      .single();
    if (error) { console.error('[DataStore] fileCourtCase error:', error); return null; }

    // Post news
    await DataStore.postNews({
      category: 'court',
      headline: `New Case Filed: ${params.title}`,
      body: `Case ${case_number} has been filed in the High Court by ${params.filed_by_name}. Type: ${params.case_type}. Regarding: ${params.law_title || 'General matter'}.`,
      priority: 'normal',
      ref_type: 'court_case',
      ref_id: data.id,
      posted_by: params.filed_by_name,
    });

    notifyListeners();
    return data as CourtCase;
  },

  updateCourtCaseStatus: async (
    caseId: string,
    status: CourtCase['status'],
    justice_notes?: string
  ): Promise<void> => {
    const updatePayload: any = { status };
    if (justice_notes !== undefined) updatePayload.justice_notes = justice_notes;
    const { error } = await db.from('court_cases').update(updatePayload).eq('id', caseId);
    if (error) { console.error('[DataStore] updateCourtCaseStatus error:', error); return; }
    notifyListeners();
  },

  getCourtOrders: async (): Promise<CourtOrder[]> => {
    const { data, error } = await db
      .from('court_orders')
      .select('*')
      .order('issued_at', { ascending: false });
    if (error) { console.error('[DataStore] getCourtOrders error:', error); return []; }
    return (data ?? []) as CourtOrder[];
  },

  issueCourtOrder: async (params: {
    case_id: string;
    case_number: string;
    case_title: string;
    verdict: CourtVerdict;
    verdict_details: string;
    law_impact: CourtOrder['law_impact'];
    announcement: string;
    issued_by: string;
    law_id?: string;
  }): Promise<CourtOrder | null> => {
    const { data, error } = await db
      .from('court_orders')
      .insert({
        case_id: params.case_id,
        case_number: params.case_number,
        case_title: params.case_title,
        verdict: params.verdict,
        verdict_details: params.verdict_details,
        law_impact: params.law_impact,
        announcement: params.announcement,
        issued_by: params.issued_by,
      })
      .select()
      .single();
    if (error) { console.error('[DataStore] issueCourtOrder error:', error); return null; }

    // Update case status to order_issued
    await DataStore.updateCourtCaseStatus(params.case_id, 'order_issued');

    // Apply law impact if any
    if (params.law_id && params.law_impact !== 'none') {
      if (params.law_impact === 'suspended') {
        await DataStore.updateLawStatus(params.law_id, 'suspended');
      } else if (params.law_impact === 'repealed') {
        await DataStore.updateLawStatus(params.law_id, 'repealed');
      }
    }

    // Post breaking news
    await DataStore.postNews({
      category: 'court',
      headline: `⚠️ High Court Order Issued — ${params.case_title}`,
      body: `Verdict: ${params.verdict.toUpperCase()}. ${params.announcement}`,
      priority: 'high',
      ref_type: 'court_order',
      ref_id: data.id,
      posted_by: params.issued_by,
    });

    notifyListeners();
    return data as CourtOrder;
  },

  // ─── SUPREME COURT ──────────────────────────────────────────────────────────────────────

  getSupremeCases: async (): Promise<SupremeCase[]> => {
    const { data, error } = await db
      .from('supreme_court_cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('[DataStore] getSupremeCases error:', error); return []; }
    return (data ?? []) as SupremeCase[];
  },

  escalateToSupreme: async (params: {
    original_case_id?: string;
    original_order_id?: string;
    title: string;
    description: string;
    law_id?: string;
    law_title: string;
    appellant_name: string;
    appellant_role: string;
    grounds: string;
  }): Promise<SupremeCase | null> => {
    const year = new Date().getFullYear();
    const { count } = await db.from('supreme_court_cases').select('*', { count: 'exact', head: true });
    const seq = String((count ?? 0) + 1).padStart(4, '0');
    const sc_case_number = `SC-${year}-${seq}`;

    const { data, error } = await db
      .from('supreme_court_cases')
      .insert({
        sc_case_number,
        original_case_id: params.original_case_id || null,
        original_order_id: params.original_order_id || null,
        title: params.title,
        description: params.description,
        law_id: params.law_id || null,
        law_title: params.law_title,
        appellant_name: params.appellant_name,
        appellant_role: params.appellant_role,
        grounds: params.grounds,
        status: 'filed',
      })
      .select()
      .single();
    if (error) { console.error('[DataStore] escalateToSupreme error:', error); return null; }

    // Mark HC case as appealed if linked
    if (params.original_case_id) {
      await DataStore.updateCourtCaseStatus(params.original_case_id, 'appealed_to_supreme');
    }

    // Post news
    await DataStore.postNews({
      category: 'supreme_court',
      headline: `Appeal Filed in Supreme Court: ${params.title}`,
      body: `Case ${sc_case_number} filed by ${params.appellant_name}. Grounds: ${params.grounds}`,
      priority: 'high',
      ref_type: 'sc_case',
      ref_id: data.id,
      posted_by: params.appellant_name,
    });

    notifyListeners();
    return data as SupremeCase;
  },

  updateSupremeCaseStatus: async (
    scCaseId: string,
    status: SupremeCase['status'],
    chief_justice_notes?: string
  ): Promise<void> => {
    const updatePayload: any = { status };
    if (chief_justice_notes !== undefined) updatePayload.chief_justice_notes = chief_justice_notes;
    const { error } = await db.from('supreme_court_cases').update(updatePayload).eq('id', scCaseId);
    if (error) { console.error('[DataStore] updateSupremeCaseStatus error:', error); return; }
    notifyListeners();
  },

  getSupremeOrders: async (): Promise<SupremeOrder[]> => {
    const { data, error } = await db
      .from('supreme_court_orders')
      .select('*')
      .order('issued_at', { ascending: false });
    if (error) { console.error('[DataStore] getSupremeOrders error:', error); return []; }
    return (data ?? []) as SupremeOrder[];
  },

  issueSupremeOrder: async (params: {
    sc_case_id: string;
    sc_case_number: string;
    case_title: string;
    ruling: SupremeRuling;
    ruling_details: string;
    announcement: string;
    issued_by: string;
    law_id?: string;
    law_impact?: 'none' | 'suspended' | 'repealed' | 'maintained';
    suspended_bill_id?: string;
    suspended_bill_title?: string;
  }): Promise<SupremeOrder | null> => {
    const { data, error } = await db
      .from('supreme_court_orders')
      .insert({
        sc_case_id: params.sc_case_id,
        sc_case_number: params.sc_case_number,
        case_title: params.case_title,
        ruling: params.ruling,
        ruling_details: params.ruling_details,
        announcement: params.announcement,
        issued_by: params.issued_by,
        suspended_bill_id: params.suspended_bill_id || null,
        suspended_bill_title: params.suspended_bill_title || '',
      })
      .select()
      .single();
    if (error) { console.error('[DataStore] issueSupremeOrder error:', error); return null; }

    // Update SC case status
    await DataStore.updateSupremeCaseStatus(params.sc_case_id, 'final_order_issued');

    // Apply law impact if any
    if (params.law_id && params.law_impact && params.law_impact !== 'none') {
      if (params.law_impact === 'suspended') {
        await DataStore.updateLawStatus(params.law_id, 'suspended');
      } else if (params.law_impact === 'repealed') {
        await DataStore.updateLawStatus(params.law_id, 'repealed');
      }
    }

    // Bill suspension by Chief Justice
    if (params.suspended_bill_id) {
      await db.from('bills').update({ status: 'suspended' }).eq('id', params.suspended_bill_id);
    }

    // Post breaking news
    await DataStore.postNews({
      category: 'supreme_court',
      headline: `🟥 SUPREME COURT FINAL RULING — ${params.case_title}`,
      body: `LANDMARK RULING by ${params.issued_by}: ${params.ruling.toUpperCase()}. ${params.announcement}`,
      priority: 'breaking',
      ref_type: 'sc_order',
      ref_id: data.id,
      posted_by: params.issued_by,
    });

    notifyListeners();
    return data as SupremeOrder;
  },
};

