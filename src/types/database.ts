// Database type definitions for Supabase
export type Role = 'president' | 'ministry' | 'public';
export type BillStatus =
  | 'draft'
  | 'submitted'
  | 'voting'
  | 'passed'
  | 'rejected'
  | 'suspended'
  | 'awaiting_president'
  | 'approved'
  | 'enacted'
  | 'archived'
  | 'deleted';

export type MinistryCode =
  | 'health'
  | 'education'
  | 'finance'
  | 'career'
  | 'it'
  | 'personal_dev'
  | 'entertainment'
  | 'external_affairs';

export type MinistryStatus =
  | 'exceptional'
  | 'very_good'
  | 'good'
  | 'well'
  | 'underperforming'
  | 'poor';

export type VoteChoice = 'approve' | 'reject' | 'abstain';
export type RequestPriority = 'low' | 'medium' | 'high' | 'critical';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'completed';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  ministry_id: string | null;
  created_at: string;
}

export interface Ministry {
  id: string;
  name: string;
  code: MinistryCode;
  status: MinistryStatus;
  budget: number;
  score: number;
  description: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  title: string;
  description: string;
  status: BillStatus;
  type: 'new' | 'repeal' | 'suspend';
  target_law_id?: string;
  created_by: string;
  ministry_id: string;
  created_at: string;
  updated_at: string;
  ministry?: Ministry;
  creator?: UserProfile;
}

export interface Law {
  id: string;
  law_number: string;
  bill_id: string;
  title: string;
  status: string;
  approved_at: string;
  approved_by: string;
  bill?: Bill;
}

export interface ParliamentVote {
  id: string;
  bill_id: string;
  user_id: string;
  vote: VoteChoice;
  timestamp: string;
  voter?: UserProfile;
}

export interface MinistryReview {
  id: string;
  bill_id: string;
  ministry_id: string;
  decision: 'approve' | 'suspend' | 'reject';
  reason: string;
  created_at: string;
  ministry?: Ministry;
}

export interface Request {
  id: string;
  from_ministry: string;
  to_ministry: string;
  title: string;
  description: string;
  amount: number;
  status: RequestStatus;
  president_status: RequestStatus | null;
  priority: RequestPriority;
  created_at: string;
  from?: Ministry;
  to?: Ministry;
}

export interface MinistryMetric {
  id: string;
  ministry_id: string;
  metric: string;
  value: number;
  timestamp: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  timestamp: string;
}

export interface BudgetLineItem {
  id: string;
  ministry_code: string;
  title: string;
  amount: number;
  source_request_id?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface BudgetAllocation {
  id: string;
  month: number;
  year: number;
  allocations: BudgetLineItem[];
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  created_at: string;
}

// Supabase Database type map (used for typed client)
export interface Database {
  public: {
    Tables: {
      users: { Row: UserProfile; Insert: Omit<UserProfile, 'id' | 'created_at'>; Update: Partial<UserProfile> };
      ministries: { Row: Ministry; Insert: Omit<Ministry, 'id'>; Update: Partial<Ministry> };
      bills: { Row: Bill; Insert: Omit<Bill, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Bill> };
      laws: { Row: Law; Insert: Omit<Law, 'id'>; Update: Partial<Law> };
      parliament_votes: { Row: ParliamentVote; Insert: Omit<ParliamentVote, 'id' | 'timestamp'>; Update: Partial<ParliamentVote> };
      ministry_reviews: { Row: MinistryReview; Insert: Omit<MinistryReview, 'id' | 'created_at'>; Update: Partial<MinistryReview> };
      requests: { Row: Request; Insert: Omit<Request, 'id' | 'created_at'>; Update: Partial<Request> };
      ministry_metrics: { Row: MinistryMetric; Insert: Omit<MinistryMetric, 'id'>; Update: Partial<MinistryMetric> };
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Notification> };
      audit_logs: { Row: AuditLog; Insert: Omit<AuditLog, 'id' | 'timestamp'>; Update: never };
    };
  };
}
