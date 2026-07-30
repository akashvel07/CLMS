import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Scale, FileText, CheckCircle, Gavel, Crown, Plus, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DataStore } from '../../lib/dataStore';
import type { BillItem } from '../../lib/dataStore';
import type { SupremeCase, SupremeOrder } from '../../types/database';
import { format } from 'date-fns';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SC_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  filed:               { label: 'Filed',             color: 'hsl(220,80%,60%)', bg: 'hsla(220,80%,60%,0.12)' },
  in_review:           { label: 'Under Review',      color: 'hsl(265,80%,65%)', bg: 'hsla(265,80%,65%,0.12)' },
  final_order_issued:  { label: 'Final Order',       color: 'hsl(152,70%,45%)', bg: 'hsla(152,70%,45%,0.12)' },
  closed:              { label: 'Closed',            color: 'hsl(220,15%,55%)', bg: 'hsla(220,15%,55%,0.08)' },
  dismissed:           { label: 'Dismissed',         color: 'hsl(0,72%,55%)',   bg: 'hsla(0,72%,55%,0.12)'   },
};

const RULING_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  upheld:     { label: 'Upheld',     color: 'hsl(152,70%,45%)', icon: '✅' },
  overturned: { label: 'Overturned', color: 'hsl(0,72%,55%)',   icon: '🔴' },
  modified:   { label: 'Modified',   color: 'hsl(35,90%,55%)',  icon: '🔶' },
  dismissed:  { label: 'Dismissed',  color: 'hsl(220,15%,55%)', icon: '⚫' },
  remanded:   { label: 'Remanded',   color: 'hsl(220,80%,60%)', icon: '↩️' },
};

type SupremeRuling = 'upheld' | 'overturned' | 'modified' | 'dismissed' | 'remanded';

const SCStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = SC_STATUS_CONFIG[status] ?? { label: status, color: 'hsl(220,15%,55%)', bg: 'hsla(220,15%,55%,0.08)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: cfg.bg, color: cfg.color,
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
      border: `1px solid ${cfg.color}40`,
    }}>{cfg.label}</span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SupremeCourtPage: React.FC = () => {
  const { user, role } = useAuth();
  const isChiefJustice = role === 'chief_justice';

  const [scCases, setScCases] = useState<SupremeCase[]>([]);
  const [scOrders, setScOrders] = useState<SupremeOrder[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [laws, setLaws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'review' | 'orders' | 'suspend'>('pending');
  const [selectedCase, setSelectedCase] = useState<SupremeCase | null>(null);
  const [showRulingModal, setShowRulingModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  // Ruling form
  const [ruling, setRuling] = useState<SupremeRuling>('upheld');
  const [rulingDetails, setRulingDetails] = useState('');
  const [rulingAnnouncement, setRulingAnnouncement] = useState('');
  const [lawImpact, setLawImpact] = useState<'none' | 'suspended' | 'repealed' | 'maintained'>('none');
  const [rulingSubmitting, setRulingSubmitting] = useState(false);

  // Suspend bill form
  // Suspend bill form
  const [selectedBillId, setSelectedBillId] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);

  // Create Case form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [newCaseGrounds, setNewCaseGrounds] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const [sc, so, bl, lw] = await Promise.all([
      DataStore.getSupremeCases(),
      DataStore.getSupremeOrders(),
      DataStore.getBills(),
      DataStore.getLaws(),
    ]);
    setScCases(sc);
    setScOrders(so);
    setBills(bl.filter(b => ['draft', 'submitted', 'voting', 'passed', 'awaiting_president'].includes(b.status)));
    setLaws(lw.filter((l: any) => l.status === 'active'));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pendingCases = scCases.filter(c => c.status === 'filed');
  const reviewCases = scCases.filter(c => c.status === 'in_review');
  const closedCases = scCases.filter(c => ['final_order_issued', 'closed', 'dismissed'].includes(c.status));

  const handleStartReview = async (c: SupremeCase) => {
    await DataStore.updateSupremeCaseStatus(c.id, 'in_review', 'Case accepted for Supreme Court review.');
    await fetchData();
  };

  const handleDismiss = async (c: SupremeCase) => {
    await DataStore.updateSupremeCaseStatus(c.id, 'dismissed', 'Appeal dismissed by the Supreme Court.');
    await DataStore.postNews({
      category: 'supreme_court',
      headline: `Supreme Court Dismissed Appeal: ${c.title}`,
      body: `Case ${c.sc_case_number} was dismissed by the Chief Justice.`,
      priority: 'high',
      posted_by: user.name,
    });
    await fetchData();
  };

  const handleIssueRuling = async () => {
    if (!selectedCase || !rulingDetails.trim() || !rulingAnnouncement.trim()) return;
    setRulingSubmitting(true);
    await DataStore.issueSupremeOrder({
      sc_case_id: selectedCase.id,
      sc_case_number: selectedCase.sc_case_number,
      case_title: selectedCase.title,
      ruling,
      ruling_details: rulingDetails.trim(),
      announcement: rulingAnnouncement.trim(),
      issued_by: user.name,
      law_id: selectedCase.law_id,
      law_impact: lawImpact,
    });
    setRulingDetails(''); setRulingAnnouncement(''); setRuling('upheld'); setLawImpact('none');
    setShowRulingModal(false);
    setRulingSubmitting(false);
    setSelectedCase(null);
    await fetchData();
    setActiveTab('orders');
  };

  const handleSuspendBill = async () => {
    if (!selectedBillId || !suspendReason.trim()) return;
    setSuspendSubmitting(true);
    const bill = bills.find(b => b.id === selectedBillId);
    await DataStore.issueSupremeOrder({
      sc_case_id: scCases[0]?.id ?? 'standalone',
      sc_case_number: `SC-SUSP-${Date.now()}`,
      case_title: `Bill Suspension: ${bill?.title}`,
      ruling: 'dismissed',
      ruling_details: suspendReason.trim(),
      announcement: `Chief Justice ${user.name} has suspended the bill "${bill?.title}" before enactment. Reason: ${suspendReason}`,
      issued_by: user.name,
      suspended_bill_id: selectedBillId,
      suspended_bill_title: bill?.title,
    });
    setSelectedBillId(''); setSuspendReason('');
    setShowSuspendModal(false);
    setSuspendSubmitting(false);
    await fetchData();
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle || !newCaseDesc || !newCaseGrounds || createSubmitting) return;
    setCreateSubmitting(true);
    await DataStore.escalateToSupreme({
      title: newCaseTitle,
      description: newCaseDesc,
      grounds: newCaseGrounds,
      appellant_name: 'Chief Justice ' + user.name,
      appellant_role: 'chief_justice',
      law_title: 'Direct Filing'
    });
    setNewCaseTitle(''); setNewCaseDesc(''); setNewCaseGrounds('');
    setShowCreateModal(false);
    setCreateSubmitting(false);
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
      {/* Supreme Court Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(200,160,30,0.12), rgba(180,120,20,0.06))',
        border: '1px solid rgba(200,160,30,0.3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        marginBottom: 'var(--space-6)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative columns */}
        <div style={{
          position: 'absolute', right: -20, top: -20,
          fontSize: '8rem', opacity: 0.04, lineHeight: 1, userSelect: 'none',
        }}>🏛️</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', position: 'relative' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, hsl(43,96%,40%), hsl(35,90%,35%))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem', flexShrink: 0, boxShadow: '0 4px 24px hsla(43,96%,40%,0.4)',
          }}>🏛️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'hsl(43,96%,65%)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
              Republic of CLMS — Apex Court of Final Jurisdiction
            </div>
            <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800 }}>Supreme Court</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.85rem' }}>
              {format(new Date(), 'EEEE, MMMM dd, yyyy')} · Chief Justice: Marcus Webb
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {isChiefJustice && (
              <>
                <button
                  id="btn-create-case"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={13} /> File New Case
                </button>
                <button
                  id="btn-suspend-bill"
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowSuspendModal(true)}
                >
                  <Shield size={13} /> Suspend a Bill
                </button>
              </>
            )}
          </div>
        </div>

        {/* Authority banner */}
        {isChiefJustice && (
          <div style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'hsla(43,96%,60%,0.1)', borderRadius: 'var(--radius-md)',
            border: '1px solid hsla(43,96%,60%,0.2)',
            fontSize: '0.78rem', color: 'hsl(43,96%,65%)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Crown size={14} />
            You are logged in as <strong>Chief Justice Marcus Webb</strong> — You hold final authority over all appeals and may suspend Bills before enactment. You may also vote in Parliament.
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {[
          { label: 'Pending Appeals', value: pendingCases.length, color: 'hsl(220,80%,60%)', icon: '📥' },
          { label: 'Under Review', value: reviewCases.length, color: 'hsl(265,80%,65%)', icon: '🔍' },
          { label: 'Final Orders', value: scOrders.length, color: 'hsl(43,96%,55%)', icon: '📜' },
          { label: 'Total Cases', value: scCases.length, color: 'hsl(220,15%,55%)', icon: '📁' },
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
          { key: 'pending', label: `Pending Appeals (${pendingCases.length})` },
          { key: 'review', label: `Under Review (${reviewCases.length})` },
          { key: 'orders', label: `Final Orders (${scOrders.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 18px', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer',
            background: activeTab === t.key ? 'linear-gradient(135deg, hsl(43,96%,30%), hsl(35,90%,30%))' : 'transparent',
            color: activeTab === t.key ? 'white' : 'var(--text-muted)',
            fontWeight: activeTab === t.key ? 700 : 400, fontSize: '0.85rem', transition: 'all 0.2s ease',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Pending Appeals */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {pendingCases.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
              <Scale size={40} style={{ marginBottom: 'var(--space-4)', opacity: 0.3 }} />
              <p>No pending appeals before the Supreme Court.</p>
            </div>
          ) : pendingCases.map(c => (
            <div key={c.id} className="card" style={{ padding: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'hsl(43,96%,60%)', fontWeight: 700 }}>{c.sc_case_number}</span>
                  <SCStatusBadge status={c.status} />
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>{c.title}</h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.description}</p>
                {c.law_title && (
                  <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'hsl(220,80%,60%)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={12} /> Re: <strong>{c.law_title}</strong>
                  </div>
                )}
                <div style={{
                  marginTop: 10, padding: 'var(--space-3)', background: 'hsla(43,96%,60%,0.06)',
                  borderRadius: 'var(--radius-md)', borderLeft: '3px solid hsl(43,96%,40%)',
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'hsl(43,96%,60%)', fontWeight: 700, marginBottom: 4 }}>Grounds for Appeal</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.grounds}</div>
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Appellant</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{c.appellant_name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 12 }}>{format(new Date(c.created_at), 'MMM dd, hh:mm a')}</div>
                {isChiefJustice && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleStartReview(c)} style={{ justifyContent: 'center' }}>
                      <CheckCircle size={13} /> Accept for Review
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDismiss(c)} style={{ justifyContent: 'center' }}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Under Review */}
      {activeTab === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {reviewCases.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
              <Gavel size={40} style={{ marginBottom: 'var(--space-4)', opacity: 0.3 }} />
              <p>No cases currently under Supreme Court review.</p>
            </div>
          ) : reviewCases.map(c => (
            <div key={c.id} style={{
              border: '1.5px solid hsl(43,96%,35%)',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, rgba(200,160,30,0.08), rgba(180,120,20,0.04))',
              padding: 'var(--space-6)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'hsl(43,96%,55%)', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'hsl(43,96%,65%)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  🏛️ Supreme Court Review In Progress
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'hsl(43,96%,60%)', fontWeight: 700 }}>{c.sc_case_number}</span>
                    <SCStatusBadge status={c.status} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem' }}>{c.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{c.description}</p>
                  <div style={{
                    marginTop: 10, padding: 'var(--space-3)', background: 'hsla(43,96%,60%,0.06)',
                    borderRadius: 'var(--radius-md)', borderLeft: '3px solid hsl(43,96%,40%)',
                  }}>
                    <div style={{ fontSize: '0.68rem', color: 'hsl(43,96%,60%)', fontWeight: 700, marginBottom: 4 }}>Grounds</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.grounds}</div>
                  </div>
                  {c.chief_justice_notes && (
                    <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'hsl(43,96%,60%)', fontStyle: 'italic' }}>
                      Note: {c.chief_justice_notes}
                    </div>
                  )}
                </div>
                {isChiefJustice && (
                  <button
                    id={`btn-ruling-${c.id}`}
                    className="btn btn-primary"
                    onClick={() => { setSelectedCase(c); setShowRulingModal(true); }}
                    style={{
                      background: 'linear-gradient(135deg, hsl(43,96%,35%), hsl(35,90%,30%))',
                      flexShrink: 0,
                    }}
                  >
                    <Gavel size={14} /> Issue Final Ruling
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Final Orders */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {scOrders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
              <Scale size={40} style={{ marginBottom: 'var(--space-4)', opacity: 0.3 }} />
              <p>No final orders have been issued yet.</p>
            </div>
          ) : scOrders.map(order => {
            const r = RULING_CONFIG[order.ruling] ?? { label: order.ruling, color: 'hsl(220,15%,55%)', icon: '•' };
            return (
              <div key={order.id} style={{
                border: `1px solid ${r.color}40`,
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-card)',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${r.color}20, ${r.color}08)`,
                  borderBottom: `1px solid ${r.color}30`,
                  padding: 'var(--space-4) var(--space-6)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{r.icon}</span>
                  <span style={{ fontWeight: 800, color: r.color, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.12em' }}>
                    Supreme Court Final Order — {order.sc_case_number}
                  </span>
                  <span style={{ marginLeft: 'auto', padding: '3px 12px', borderRadius: 'var(--radius-full)', background: `${r.color}22`, color: r.color, fontSize: '0.7rem', fontWeight: 800 }}>
                    {r.label}
                  </span>
                </div>
                {/* Body */}
                <div style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: '1.05rem' }}>{order.case_title}</h3>
                  {/* Landmark announcement */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(200,160,30,0.1), rgba(200,160,30,0.04))',
                    border: '1px solid rgba(200,160,30,0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-5)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'hsl(43,96%,60%)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                      🏛️ LANDMARK RULING — SUPREME COURT OF CLMS
                    </div>
                    <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic' }}>"{order.announcement}"</p>
                  </div>
                  <p style={{ margin: '0 0 var(--space-4) 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{order.ruling_details}</p>
                  <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Issued by: <strong style={{ color: 'var(--text-secondary)' }}>{order.issued_by}</strong></span>
                    <span>{format(new Date(order.issued_at), 'MMM dd, yyyy — hh:mm a')}</span>
                    {order.suspended_bill_title && (
                      <span style={{ color: 'hsl(0,72%,55%)', fontWeight: 700 }}>🚫 Bill Suspended: {order.suspended_bill_title}</span>
                    )}
                  </div>
                  <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)', background: 'hsla(43,96%,60%,0.06)', borderRadius: 'var(--radius-md)', fontSize: '0.72rem', color: 'hsl(43,96%,55%)', textAlign: 'center' }}>
                    ⚖️ This is a final and binding ruling of the Supreme Court of CLMS. No further appeal is possible.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Final Ruling Modal ──────────────────────────────────────────────── */}
      {showRulingModal && selectedCase && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)',
        }} onClick={() => setShowRulingModal(false)}>
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)', width: '100%', maxWidth: 620,
            border: '2px solid hsl(43,96%,40%)', boxShadow: '0 0 60px hsla(43,96%,40%,0.25)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.5rem' }}>🏛️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Issue Supreme Court Final Ruling</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
              Case: <strong>{selectedCase.sc_case_number}</strong> — {selectedCase.title}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Final Ruling *</label>
                <select className="form-input" value={ruling} onChange={e => setRuling(e.target.value as SupremeRuling)}>
                  {Object.entries(RULING_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Law Impact</label>
                <select className="form-input" value={lawImpact} onChange={e => setLawImpact(e.target.value as any)}>
                  <option value="none">None</option>
                  <option value="maintained">Maintained</option>
                  <option value="suspended">Suspended</option>
                  <option value="repealed">Repealed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Legal Reasoning *</label>
                <textarea className="form-input" rows={3} value={rulingDetails} onChange={e => setRulingDetails(e.target.value)} placeholder="Constitutional and legal basis for this ruling..." style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Landmark Announcement * (Public Declaration)</label>
                <textarea className="form-input" rows={3} value={rulingAnnouncement} onChange={e => setRulingAnnouncement(e.target.value)} placeholder="The official public declaration of this final ruling..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(0,72%,55%)', background: 'hsla(0,72%,55%,0.08)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
              ⚠ This ruling is final and irrevocable. It will be immediately broadcast to the News Channel.
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowRulingModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!rulingDetails.trim() || !rulingAnnouncement.trim() || rulingSubmitting}
                onClick={handleIssueRuling}
                style={{ background: 'linear-gradient(135deg, hsl(43,96%,35%), hsl(35,90%,30%))' }}
              >
                <Gavel size={14} /> {rulingSubmitting ? 'Issuing...' : 'Issue Final Ruling'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Case Modal ─────────────────────────────────────────────── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)',
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)', width: '100%', maxWidth: 520,
            border: '1.5px solid hsl(220,80%,50%)', boxShadow: '0 0 30px hsla(220,80%,50%,0.25)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <Scale size={22} color="hsl(220,80%,60%)" />
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>File New Supreme Court Case</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
              Manually file a new case or appeal directly to the Supreme Court.
            </p>
            <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Case Title *</label>
                <input className="form-input" value={newCaseTitle} onChange={e => setNewCaseTitle(e.target.value)} placeholder="e.g. Constitutional Challenge to Bill X" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={3} value={newCaseDesc} onChange={e => setNewCaseDesc(e.target.value)} placeholder="Brief summary of the case..." required style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Grounds for Appeal *</label>
                <textarea className="form-input" rows={3} value={newCaseGrounds} onChange={e => setNewCaseGrounds(e.target.value)} placeholder="Constitutional basis for filing this case..." required style={{ resize: 'vertical' }} />
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newCaseTitle.trim() || !newCaseDesc.trim() || !newCaseGrounds.trim() || createSubmitting}
                >
                  <Plus size={14} /> {createSubmitting ? 'Filing...' : 'File Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Suspend Bill Modal ─────────────────────────────────────────────── */}
      {showSuspendModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)',
        }} onClick={() => setShowSuspendModal(false)}>
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)', width: '100%', maxWidth: 520,
            border: '1.5px solid hsl(0,72%,45%)', boxShadow: '0 0 30px hsla(0,72%,45%,0.25)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <Shield size={22} color="hsl(0,72%,55%)" />
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Chief Justice — Suspend a Bill</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
              As Chief Justice, you may suspend any Draft or Bill before it is enacted into law.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Select Bill to Suspend *</label>
                <select className="form-input" value={selectedBillId} onChange={e => setSelectedBillId(e.target.value)}>
                  <option value="">— Select a bill —</option>
                  {bills.map(b => <option key={b.id} value={b.id}>[{b.status.toUpperCase()}] {b.bill_number}: {b.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Suspension *</label>
                <textarea className="form-input" rows={4} value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Constitutional or legal basis for suspending this bill..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(0,72%,55%)', background: 'hsla(0,72%,55%,0.08)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
              🚫 This action will immediately suspend the selected bill. It will be broadcast as Breaking News.
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowSuspendModal(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={!selectedBillId || !suspendReason.trim() || suspendSubmitting}
                onClick={handleSuspendBill}
              >
                <Shield size={14} /> {suspendSubmitting ? 'Suspending...' : 'Suspend Bill'}
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

export default SupremeCourtPage;
