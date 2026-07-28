import { supabase } from './supabase';
import type { BillStatus, Role } from '../types/database';

export interface BillItem {
  id: string;
  bill_number: string;
  title: string;
  description: string;
  status: BillStatus;
  ministry: string;
  created_by: string;
  created_at: string;
}

export interface RequestItem {
  id: string;
  from: string;
  to: string;
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
  user_name: string;
  role: Role;
  vote: 'approve' | 'reject' | 'abstain';
  timestamp: string;
}

export interface LawItem {
  id: string;
  law_number: string;
  bill_id: string;
  title: string;
  ministry: string;
  status: 'active' | 'suspended' | 'repealed';
  approved_at: string;
  approved_by: string;
}

// Initial seed data stored in localStorage if database table is empty
const SEED_BILLS: BillItem[] = [
  { id: 'b1', bill_number: 'HB-2024-015', title: 'Universal Healthcare Access Act', status: 'awaiting_president', ministry: 'Health', created_by: 'Dr. Sarah Chen', created_at: '2024-07-01', description: 'Ensures every citizen has access to basic healthcare services.' },
  { id: 'b2', bill_number: 'ED-2024-009', title: 'Open Source Education Bill', status: 'voting', ministry: 'Education', created_by: 'Prof. James Liu', created_at: '2024-07-05', description: 'Makes all educational resources open-source and freely accessible.' },
  { id: 'b3', bill_number: 'IT-2024-003', title: 'Digital Identity Framework Bill', status: 'draft', ministry: 'IT', created_by: 'Dir. Maya Singh', created_at: '2024-07-10', description: 'Establishes a secure digital identity system for all citizens.' },
  { id: 'b4', bill_number: 'FN-2024-007', title: 'Green Energy Investment Act', status: 'approved', ministry: 'Finance', created_by: 'Min. Robert Fox', created_at: '2024-06-20', description: 'Allocates budget for renewable energy infrastructure.' },
  { id: 'b5', bill_number: 'CD-2024-004', title: 'Job Skills Certification Reform', status: 'passed', ministry: 'Career', created_by: 'Min. Alex Park', created_at: '2024-06-15', description: 'Standardizes job skill certifications across all sectors.' },
  { id: 'b6', bill_number: 'HB-2024-011', title: 'Pandemic Preparedness Act', status: 'suspended', ministry: 'Health', created_by: 'Dr. Sarah Chen', created_at: '2024-06-01', description: 'Creates protocols for responding to future pandemics.' },
  { id: 'b7', bill_number: 'EN-2024-002', title: 'Public Entertainment Standards Act', status: 'rejected', ministry: 'Entertainment', created_by: 'Dir. Kim Reeves', created_at: '2024-05-28', description: 'Sets quality standards for public entertainment venues.' },
  { id: 'b8', bill_number: 'EA-2024-003', title: 'Ministry Collaboration Charter', status: 'enacted', ministry: 'External Affairs', created_by: 'Amb. Lisa Torres', created_at: '2024-05-10', description: 'Formalizes inter-ministry collaboration procedures.' },
];

const SEED_REQUESTS: RequestItem[] = [
  { id: 'REQ-2024-001', from: 'Health', to: 'Finance', title: 'Emergency Medical Equipment Budget', priority: 'critical', amount: 250000, status: 'pending', created_at: '2024-07-10', description: 'Procurement of ICU beds and oxygen generators.' },
  { id: 'REQ-2024-002', from: 'IT', to: 'Finance', title: 'Infrastructure Upgrade Fund', priority: 'high', amount: 120000, status: 'approved', created_at: '2024-07-08', description: 'Cloud server expansion for government digital portal.' },
  { id: 'REQ-2024-003', from: 'Education', to: 'IT', title: 'Learning Management System Software', priority: 'medium', amount: 45000, status: 'approved', created_at: '2024-07-05', description: 'License renewals for national school portals.' },
  { id: 'REQ-2024-004', from: 'Career', to: 'External Affairs', title: 'Job Fair Partnership Request', priority: 'low', amount: 0, status: 'returned', created_at: '2024-07-03', description: 'International career exchange coordination.' },
  { id: 'REQ-2024-005', from: 'Personal Dev', to: 'Finance', title: 'Wellness Program Personnel', priority: 'medium', amount: 80000, status: 'pending', created_at: '2024-07-01', description: 'Hiring wellness counselors for community centers.' },
];

const SEED_LAWS: LawItem[] = [
  { id: 'l1', law_number: 'LAW-2024-001', bill_id: 'b8', title: 'Ministry Collaboration Charter', ministry: 'External Affairs', status: 'active', approved_at: '2024-05-15', approved_by: 'President Alexander' },
  { id: 'l2', law_number: 'LAW-2024-002', bill_id: 'b4', title: 'Green Energy Investment Act', ministry: 'Finance', status: 'active', approved_at: '2024-06-25', approved_by: 'President Alexander' },
  { id: 'l3', law_number: 'LAW-2024-003', bill_id: 'b5', title: 'Job Skills Certification Reform', ministry: 'Career', status: 'active', approved_at: '2024-06-18', approved_by: 'President Alexander' },
];

const SEED_VOTES: VoteItem[] = [
  { id: 'v1', bill_id: 'b2', user_name: 'Dr. Sarah Chen', role: 'ministry', vote: 'approve', timestamp: '2024-07-06T10:00:00Z' },
  { id: 'v2', bill_id: 'b2', user_name: 'Min. Robert Fox', role: 'ministry', vote: 'approve', timestamp: '2024-07-06T10:15:00Z' },
  { id: 'v3', bill_id: 'b2', user_name: 'Dir. Maya Singh', role: 'ministry', vote: 'reject', timestamp: '2024-07-06T11:30:00Z' },
];

const STORAGE_KEYS = {
  BILLS: 'clms_db_bills',
  REQUESTS: 'clms_db_requests',
  LAWS: 'clms_db_laws',
  VOTES: 'clms_db_votes',
};

// Helper listeners for instant cross-component updates
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeDataStore = (listener: Listener) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

const notifyListeners = () => {
  listeners.forEach(l => l());
};

// ─── LOCAL STORAGE HELPERS ───────────────────────────────────────────────────
const getStored = <T>(key: string, seed: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(data);
  } catch {
    return seed;
  }
};

const setStored = <T>(key: string, val: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    notifyListeners();
  } catch { /* ignore */ }
};

// ─── DATA STORE API ─────────────────────────────────────────────────────────

export const DataStore = {
  // --- BILLS ---
  getBills: (): BillItem[] => {
    return getStored<BillItem[]>(STORAGE_KEYS.BILLS, SEED_BILLS);
  },

  updateBillStatus: (billId: string, status: BillStatus) => {
    const bills = DataStore.getBills();
    const updated = bills.map(b => (b.id === billId || b.bill_number === billId) ? { ...b, status } : b);
    setStored(STORAGE_KEYS.BILLS, updated);

    // If approved or enacted, ensure law exists
    if (status === 'approved' || status === 'enacted') {
      const bill = updated.find(b => b.id === billId || b.bill_number === billId);
      if (bill) {
        DataStore.addLawFromBill(bill);
      }
    }

    // Async sync to Supabase if connected
    try {
      (supabase.from('bills') as any).update({ status }).eq('id', billId);
    } catch { /* ignore */ }
  },

  addBill: (bill: Omit<BillItem, 'id' | 'created_at'>) => {
    const bills = DataStore.getBills();
    const newBill: BillItem = {
      ...bill,
      id: 'b_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const updated = [newBill, ...bills];
    setStored(STORAGE_KEYS.BILLS, updated);
    return newBill;
  },

  // --- LAWS / CONSTITUTION ---
  getLaws: (): LawItem[] => {
    return getStored<LawItem[]>(STORAGE_KEYS.LAWS, SEED_LAWS);
  },

  updateLawStatus: (lawId: string, status: 'active' | 'suspended' | 'repealed') => {
    const laws = DataStore.getLaws();
    const updated = laws.map(l => (l.id === lawId || l.law_number === lawId) ? { ...l, status } : l);
    setStored(STORAGE_KEYS.LAWS, updated);
  },

  addLawFromBill: (bill: BillItem) => {
    const laws = DataStore.getLaws();
    const existing = laws.find(l => l.bill_id === bill.id || l.title === bill.title);
    if (!existing) {
      const newLaw: LawItem = {
        id: 'l_' + Date.now(),
        law_number: 'LAW-2024-0' + (laws.length + 10),
        bill_id: bill.id,
        title: bill.title,
        ministry: bill.ministry,
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: 'President Alexander',
      };
      setStored(STORAGE_KEYS.LAWS, [newLaw, ...laws]);
    }
  },

  // --- REQUESTS ---
  getRequests: (): RequestItem[] => {
    return getStored<RequestItem[]>(STORAGE_KEYS.REQUESTS, SEED_REQUESTS);
  },

  updateRequestStatus: (requestId: string, status: 'pending' | 'approved' | 'rejected' | 'returned') => {
    const reqs = DataStore.getRequests();
    const updated = reqs.map(r => r.id === requestId ? { ...r, status } : r);
    setStored(STORAGE_KEYS.REQUESTS, updated);
  },

  addRequest: (req: Omit<RequestItem, 'id' | 'created_at' | 'status'>) => {
    const reqs = DataStore.getRequests();
    const newReq: RequestItem = {
      ...req,
      id: 'REQ-2024-0' + (reqs.length + 10),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    const updated = [newReq, ...reqs];
    setStored(STORAGE_KEYS.REQUESTS, updated);
    return newReq;
  },

  // --- VOTES ---
  getVotes: (): VoteItem[] => {
    return getStored<VoteItem[]>(STORAGE_KEYS.VOTES, SEED_VOTES);
  },

  castVote: (billId: string, userName: string, role: Role, vote: 'approve' | 'reject' | 'abstain') => {
    const votes = DataStore.getVotes();
    // remove existing vote by user on this bill
    const filtered = votes.filter(v => !(v.bill_id === billId && v.user_name === userName));
    const newVote: VoteItem = {
      id: 'v_' + Date.now(),
      bill_id: billId,
      user_name: userName,
      role,
      vote,
      timestamp: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.VOTES, [newVote, ...filtered]);
  },
};
