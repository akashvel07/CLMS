import React, { useState, useEffect, useCallback } from 'react';
import { Scale, FileText, CheckCircle, XCircle, AlertTriangle, Clock, Gavel, ChevronRight, Plus, Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DataStore } from '../../lib/dataStore';
import type { LawItem } from '../../lib/dataStore';
import type { CourtCase, CourtOrder } from '../../types/database';
import { format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

type CourtCaseType = 'challenge' | 'discussion' | 'contempt' | 'petition';
type CourtVerdict = 'upheld' | 'rejected' | 'maintained' | 'modified' | 'dismissed';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CASE_TYPE_INFO: Record<CourtCaseType, { label: string; color: string; icon: string }> = {
  challenge:   { label: 'Law Challenge',  color: 'hsl(0,72%,55%)',    icon: '⚔️' },
  discussion:  { label: 'Open Discussion',color: 'hsl(220,80%,60%)',  icon: '💬' },
  contempt:    { label: 'Contempt',       color: 'hsl(35,90%,55%)',   icon: '🚫' },
  petition:    { label: 'Petition',       color: 'hsl(265,80%,65%)',  icon: '📜' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  filed:                { label: 'Filed',              color: 'hsl(220,80%,60%)',  bg: 'hsla(220,80%,60%,0.12)'  },
  approved_for_trial:   { label: 'Approved for Trial', color: 'hsl(35,90%,55%)',   bg: 'hsla(35,90%,55%,0.12)'   },
  in_trial:             { label: 'In Trial',           color: 'hsl(265,80%,65%)',  bg: 'hsla(265,80%,65%,0.12)'  },
  order_issued:         { label: 'Order Issued',       color: 'hsl(152,70%,45%)',  bg: 'hsla(152,70%,45%,0.12)'  },
  closed:               { label: 'Closed',             color: 'hsl(220,15%,55%)',  bg: 'hsla(220,15%,55%,0.08)'  },
  appealed_to_supreme:  { label: 'Appealed to SC',     color: 'hsl(43,96%,60%)',   bg: 'hsla(43,96%,60%,0.12)'   },
  rejected:             { label: 'Rejected',           color: 'hsl(0,72%,55%)',    bg: 'hsla(0,72%,55%,0.12)'    },
};

const VERDICT_CONFIG: Record<CourtVerdict, { label: string; color: string }> = {
  upheld:    { label: 'Upheld',    color: 'hsl(152,70%,45%)' },
  rejected:  { label: 'Rejected',  color: 'hsl(0,72%,55%)'   },
  maintained:{ label: 'Maintained',color: 'hsl(220,80%,60%)' },
  modified:  { label: 'Modified',  color: 'hsl(35,90%,55%)'  },
  dismissed: { label: 'Dismissed', color: 'hsl(220,15%,55%)' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'hsl(220,15%,55%)', bg: 'hsla(220,15%,55%,0.08)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: cfg.bg, color: cfg.color,
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
      border: `1px solid ${cfg.color}40`,
    }}>
      {cfg.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CourtPage: React.FC = () => {
  const { user, role } = useAuth();
  const isJustice = role === 'justice' || role === 'chief_justice';

  const [cases, setCases] = useState<CourtCase[]>([]);
  const [orders, setOrders] = useState<CourtOrder[]>([]);
  const [laws, setLaws] = useState<LawItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CourtCase | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'orders'>('pending');
  const [showFileModal, setShowFileModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);

  // File Case Form
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLawId, setFormLawId] = useState('');
  const [formCaseType, setFormCaseType] = useState<CourtCaseType>('challenge');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Order Form (Justice only)
  const [orderVerdict, setOrderVerdict] = useState<CourtVerdict>('upheld');
  const [orderDetails, setOrderDetails] = useState('');
  const [orderLawImpact, setOrderLawImpact] = useState<'none'|'suspended'|'repealed'|'maintained'>('none');
  const [orderAnnouncement, setOrderAnnouncement] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Appeal Form
  const [appealGrounds, setAppealGrounds] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const [c, o, l] = await Promise.all([
      DataStore.getCourtCases(),
      DataStore.getCourtOrders(),
      DataStore.getLaws(),
    ]);
    setCases(c);
    setOrders(o);
    setLaws(l.filter(law => law.status === 'active'));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pendingCases = cases.filter(c => c.status === 'filed');
  const activeCases = cases.filter(c => ['approved_for_trial', 'in_trial'].includes(c.status));
  const closedCases = cases.filter(c => ['order_issued', 'closed', 'appealed_to_supreme', 'rejected'].includes(c.status));

  const handleFileCase = async () => {
    if (!formTitle.trim() || !formDesc.trim()) return;
    setFormSubmitting(true);
    const selectedLaw = laws.find(l => l.id === formLawId);
    await DataStore.fileCourtCase({
      title: formTitle.trim(),
      description: formDesc.trim(),
      law_id: formLawId || undefined,
      law_title: selectedLaw?.title ?? (formLawId ? formLawId : 'General Matter'),
      case_type: formCaseType,
      filed_by_name: user.name,
      filed_by_role: role,
    });
    setFormTitle(''); setFormDesc(''); setFormLawId(''); setFormCaseType('challenge');
    setShowFileModal(false);
    setFormSubmitting(false);
    await fetchData();
  };

  const handleApproveCase = async (c: CourtCase) => {
    await DataStore.updateCourtCaseStatus(c.id, 'approved_for_trial', 'Case approved for trial proceedings.');
    await fetchData();
  };

  const handleStartTrial = async (c: CourtCase) => {
    await DataStore.updateCourtCaseStatus(c.id, 'in_trial', 'Trial session is now in progress.');
    await fetchData();
  };

  const handleRejectCase = async (c: CourtCase) => {
    await DataStore.updateCourtCaseStatus(c.id, 'rejected', 'Case rejected by the High Court.');
    await DataStore.postNews({
      category: 'court',
      headline: `Case Rejected: ${c.title}`,
      body: `Case ${c.case_number} has been rejected by the High Court.`,
      priority: 'normal',
      posted_by: user.name,
    });
    await fetchData();
  };

  const handleIssueOrder = async () => {
    if (!selectedCase || !orderDetails.trim() || !orderAnnouncement.trim()) return;
    setOrderSubmitting(true);
    await DataStore.issueCourtOrder({
      case_id: selectedCase.id,
      case_number: selectedCase.case_number,
      case_title: selectedCase.title,
      verdict: orderVerdict,
      verdict_details: orderDetails.trim(),
      law_impact: orderLawImpact,
      announcement: orderAnnouncement.trim(),
      issued_by: user.name,
      law_id: selectedCase.law_id,
    });
    setOrderDetails(''); setOrderAnnouncement(''); setOrderVerdict('upheld'); setOrderLawImpact('none');
    setShowOrderModal(false);
    setOrderSubmitting(false);
    setSelectedCase(null);
    await fetchData();
    setActiveTab('orders');
  };

  const handleAppeal = async () => {
    if (!selectedCase || !appealGrounds.trim()) return;
    setAppealSubmitting(true);
    const caseOrder = orders.find(o => o.case_id === selectedCase.id);
    await DataStore.escalateToSupreme({
      original_case_id: selectedCase.id,
      original_order_id: caseOrder?.id,
      title: `Appeal: ${selectedCase.title}`,
      description: selectedCase.description,
      law_id: selectedCase.law_id,
      law_title: selectedCase.law_title,
      appellant_name: user.name,
      appellant_role: role,
      grounds: appealGrounds.trim(),
    });
    setAppealGrounds('');
    setShowAppealModal(false);
    setAppealSubmitting(false);
    setSelectedCase(null);
    await fetchData();
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(120,40,200,0.15), rgba(60,80,200,0.08))',
        border: '1px solid rgba(120,40,200,0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        marginBottom: 'var(--space-6)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, hsl(265,80%,40%), hsl(220,80%,40%))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', flexShrink: 0, boxShadow: '0 4px 20px hsla(265,80%,40%,0.4)',
        }}>⚖️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: 'hsl(265,80%,65%)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            Republic of CLMS — High Court of Justice
          </div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>High Court</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.85rem' }}>
            {format(new Date(), 'EEEE, MMMM dd, yyyy')} · {pendingCases.length} pending · {activeCases.length} in trial
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button
            id="btn-file-case"
            className="btn btn-primary"
            onClick={() => setShowFileModal(true)}
          >
            <Plus size={15} /> File a Case
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {[
          { label: 'Pending Review', value: pendingCases.length, color: 'hsl(220,80%,60%)', icon: '📥' },
          { label: 'Active Trials', value: activeCases.length, color: 'hsl(265,80%,65%)', icon: '⚖️' },
          { label: 'Orders Issued', value: orders.length, color: 'hsl(152,70%,45%)', icon: '📜' },
          { label: 'Total Cases', value: cases.length, color: 'hsl(220,15%,55%)', icon: '📁' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: '1 1 120px', padding: 'var(--space-4)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
        {([
          { key: 'pending', label: `Pending (${pendingCases.length})` },
          { key: 'active', label: `Active Trials (${activeCases.length})` },
          { key: 'orders', label: `Orders & Closed (${orders.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '8px 18px', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer',
              background: activeTab === t.key ? 'linear-gradient(135deg, hsl(265,80%,30%), hsl(220,80%,35%))' : 'transparent',
              color: activeTab === t.key ? 'white' : 'var(--text-muted)',
              fontWeight: activeTab === t.key ? 700 : 400, fontSize: '0.85rem', transition: 'all 0.2s ease',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Pending Cases */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {pendingCases.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
              <Scale size={40} style={{ marginBottom: 'var(--space-4)', opacity: 0.3 }} />
              <p>No pending cases. Be the first to file!</p>
            </div>
          ) : pendingCases.map(c => (
            <div key={c.id} className="card" style={{ padding: 'var(--space-5)', display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: `${CASE_TYPE_INFO[c.case_type]?.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
              }}>
                {CASE_TYPE_INFO[c.case_type]?.icon}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'hsl(265,80%,65%)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{c.case_number}</span>
                  <StatusBadge status={c.status} />
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${CASE_TYPE_INFO[c.case_type]?.color}22`, color: CASE_TYPE_INFO[c.case_type]?.color, fontWeight: 600 }}>
                    {CASE_TYPE_INFO[c.case_type]?.label}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: 'var(--text-primary)' }}>{c.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>{c.description}</div>
                {c.law_title && (
                  <div style={{ fontSize: '0.75rem', color: 'hsl(220,80%,60%)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={12} /> Regarding: <strong>{c.law_title}</strong>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Filed by</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{c.filed_by_name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 12 }}>{format(new Date(c.created_at), 'MMM dd, hh:mm a')}</div>
                {isJustice && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <button id={`btn-approve-${c.id}`} className="btn btn-success btn-sm" onClick={() => handleApproveCase(c)} style={{ justifyContent: 'center' }}>
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button id={`btn-reject-${c.id}`} className="btn btn-danger btn-sm" onClick={() => handleRejectCase(c)} style={{ justifyContent: 'center' }}>
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Trials */}
      {activeTab === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {activeCases.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
              <Gavel size={40} style={{ marginBottom: 'var(--space-4)', opacity: 0.3 }} />
              <p>No active trials at the moment.</p>
            </div>
          ) : activeCases.map(c => (
            <div key={c.id} style={{
              border: c.status === 'in_trial' ? '1.5px solid hsl(265,80%,40%)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              background: c.status === 'in_trial'
                ? 'linear-gradient(135deg, rgba(100,30,180,0.1), rgba(50,70,200,0.06))'
                : 'var(--bg-card)',
              padding: 'var(--space-6)',
            }}>
              {c.status === 'in_trial' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'hsl(0,80%,55%)', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'hsl(265,80%,65%)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    🔴 Trial In Progress
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'hsl(265,80%,65%)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{c.case_number}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem' }}>{c.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{c.description}</p>
                  {c.law_title && (
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'hsl(220,80%,60%)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={12} /> Re: <strong>{c.law_title}</strong>
                    </div>
                  )}
                  {c.justice_notes && (
                    <div style={{ marginTop: 10, padding: 'var(--space-3)', background: 'hsla(265,80%,65%,0.08)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid hsl(265,80%,65%)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'hsl(265,80%,65%)', fontWeight: 700, marginBottom: 4 }}>Justice Notes</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.justice_notes}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Filed by {c.filed_by_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{format(new Date(c.created_at), 'MMM dd, yyyy')}</div>
                  </div>
                  {isJustice && c.status === 'approved_for_trial' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleStartTrial(c)} style={{ justifyContent: 'center' }}>
                      <Gavel size={13} /> Start Trial
                    </button>
                  )}
                  {isJustice && c.status === 'in_trial' && (
                    <button
                      id={`btn-order-${c.id}`}
                      className="btn btn-primary"
                      onClick={() => { setSelectedCase(c); setShowOrderModal(true); }}
                      style={{ justifyContent: 'center' }}
                    >
                      <Gavel size={14} /> Issue Order
                    </button>
                  )}
                  {/* Anyone can view (and appeal when order issued) */}
                  {c.status === 'order_issued' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setSelectedCase(c); setShowAppealModal(true); }}
                      style={{ justifyContent: 'center' }}
                    >
                      <ChevronRight size={13} /> Appeal to SC
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders & Closed */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {orders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
              <FileText size={40} style={{ marginBottom: 'var(--space-4)', opacity: 0.3 }} />
              <p>No orders have been issued yet.</p>
            </div>
          ) : orders.map(order => {
            const verdict = VERDICT_CONFIG[order.verdict];
            const hcCase = cases.find(c => c.id === order.case_id);
            return (
              <div key={order.id} style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-card)',
                overflow: 'hidden',
              }}>
                {/* Order header bar */}
                <div style={{
                  background: `linear-gradient(135deg, ${verdict.color}22, ${verdict.color}11)`,
                  borderBottom: `1px solid ${verdict.color}30`,
                  padding: 'var(--space-4) var(--space-6)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap',
                }}>
                  <Gavel size={16} color={verdict.color} />
                  <span style={{ fontWeight: 800, color: verdict.color, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                    High Court Order — {order.case_number}
                  </span>
                  <span style={{ marginLeft: 'auto', padding: '3px 12px', borderRadius: 'var(--radius-full)', background: `${verdict.color}22`, color: verdict.color, fontSize: '0.72rem', fontWeight: 800 }}>
                    {verdict.label}
                  </span>
                </div>
                {/* Order body */}
                <div style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: '1.05rem' }}>{order.case_title}</h3>
                  {/* Announcement box */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255,200,50,0.08), rgba(255,160,30,0.04))',
                    border: '1px solid rgba(255,200,50,0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    <div style={{ fontSize: '0.68rem', color: 'hsl(43,96%,60%)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                      📢 Official Announcement
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>"{order.announcement}"</p>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>{order.verdict_details}</div>
                  <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {order.law_impact !== 'none' && (
                      <span style={{ color: 'hsl(35,90%,55%)', fontWeight: 700 }}>⚠ Law Impact: {order.law_impact}</span>
                    )}
                    <span>Issued by: <strong style={{ color: 'var(--text-secondary)' }}>{order.issued_by}</strong></span>
                    <span>{format(new Date(order.issued_at), 'MMM dd, yyyy — hh:mm a')}</span>
                  </div>
                  {/* Appeal button */}
                  {hcCase && hcCase.status !== 'appealed_to_supreme' && (
                    <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setSelectedCase(hcCase); setShowAppealModal(true); }}
                      >
                        <ChevronRight size={13} /> Object & Appeal to Supreme Court
                      </button>
                    </div>
                  )}
                  {hcCase?.status === 'appealed_to_supreme' && (
                    <div style={{ marginTop: 'var(--space-4)', textAlign: 'right', fontSize: '0.78rem', color: 'hsl(43,96%,60%)' }}>
                      ↗ Escalated to Supreme Court
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── File Case Modal ─────────────────────────────────────────────────── */}
      {showFileModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)',
        }} onClick={() => setShowFileModal(false)}>
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)', width: '100%', maxWidth: 560,
            border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, hsl(265,80%,40%), hsl(220,80%,40%))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⚖️</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem' }}>File a Case</h2>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>High Court of Justice</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Case Title *</label>
                <input className="form-input" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Brief description of the case" />
              </div>
              <div className="form-group">
                <label className="form-label">Case Type *</label>
                <select className="form-input" value={formCaseType} onChange={e => setFormCaseType(e.target.value as CourtCaseType)}>
                  {Object.entries(CASE_TYPE_INFO).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Regarding Active Law (optional)</label>
                <select className="form-input" value={formLawId} onChange={e => setFormLawId(e.target.value)}>
                  <option value="">— Select a law (or leave blank) —</option>
                  {laws.map(l => <option key={l.id} value={l.id}>{l.law_number}: {l.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description / Arguments *</label>
                <textarea className="form-input" rows={4} value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Explain your case, arguments, and what relief you seek..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                Filed as: <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong> ({role})
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowFileModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!formTitle.trim() || !formDesc.trim() || formSubmitting} onClick={handleFileCase}>
                {formSubmitting ? 'Filing...' : '⚖️ Submit Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Issue Order Modal (Justice only) ───────────────────────────────── */}
      {showOrderModal && selectedCase && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)',
        }} onClick={() => setShowOrderModal(false)}>
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)', width: '100%', maxWidth: 600,
            border: '2px solid hsl(265,80%,40%)', boxShadow: '0 0 40px hsla(265,80%,40%,0.3)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <Gavel size={22} color="hsl(265,80%,65%)" />
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Issue Court Order</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
              Case: <strong>{selectedCase.case_number}</strong> — {selectedCase.title}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Verdict *</label>
                <select className="form-input" value={orderVerdict} onChange={e => setOrderVerdict(e.target.value as CourtVerdict)}>
                  {Object.entries(VERDICT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Law Impact</label>
                <select className="form-input" value={orderLawImpact} onChange={e => setOrderLawImpact(e.target.value as any)}>
                  <option value="none">None — No change to the law</option>
                  <option value="maintained">Maintained — Law remains in force</option>
                  <option value="suspended">Suspended — Law temporarily suspended</option>
                  <option value="repealed">Repealed — Law struck down</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Verdict Details *</label>
                <textarea className="form-input" rows={3} value={orderDetails} onChange={e => setOrderDetails(e.target.value)} placeholder="Legal reasoning and detailed verdict explanation..." style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Official Announcement * (Public Declaration)</label>
                <textarea className="form-input" rows={3} value={orderAnnouncement} onChange={e => setOrderAnnouncement(e.target.value)} placeholder="The official public announcement that will be broadcasted..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowOrderModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!orderDetails.trim() || !orderAnnouncement.trim() || orderSubmitting}
                onClick={handleIssueOrder}
                style={{ background: 'linear-gradient(135deg, hsl(265,80%,40%), hsl(220,80%,40%))' }}
              >
                <Gavel size={14} /> {orderSubmitting ? 'Issuing...' : 'Issue Official Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Appeal to Supreme Court Modal ──────────────────────────────────── */}
      {showAppealModal && selectedCase && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)',
        }} onClick={() => setShowAppealModal(false)}>
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)', width: '100%', maxWidth: 520,
            border: '1px solid hsl(43,96%,40%)', boxShadow: '0 0 30px hsla(43,96%,40%,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.5rem' }}>🏛️</span>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Appeal to Supreme Court</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
              Objecting to High Court Order for: <strong>{selectedCase.title}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Grounds for Appeal *</label>
              <textarea
                className="form-input" rows={5} value={appealGrounds}
                onChange={e => setAppealGrounds(e.target.value)}
                placeholder="State your grounds for objecting to the High Court order and why the Supreme Court should review..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'hsl(43,96%,60%)', background: 'hsla(43,96%,60%,0.08)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
              ⚠ The Supreme Court's decision is final and cannot be further appealed.
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAppealModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!appealGrounds.trim() || appealSubmitting}
                onClick={handleAppeal}
                style={{ background: 'linear-gradient(135deg, hsl(43,96%,40%), hsl(35,90%,40%))' }}
              >
                {appealSubmitting ? 'Filing...' : '🏛️ File Supreme Court Appeal'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default CourtPage;
