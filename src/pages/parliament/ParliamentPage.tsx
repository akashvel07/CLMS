import React, { useState, useEffect } from 'react';
import { Vote, CheckCircle, XCircle, MinusCircle, FileText, Building2, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useBills, useResolutions, useVotes, useResolutionVotes } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { DataStore, type BillItem, type ResolutionItem } from '../../lib/dataStore';
import { ParliamentSeatingChart } from '../../components/ui/ParliamentSeatingChart';

// ─── Helpers ────────────────────────────────────────────────────────────────

const MINISTRY_LABELS: Record<string, string> = {
  health: 'Health',
  education: 'Education',
  finance: 'Finance',
  it: 'IT',
  career: 'Career',
  entertainment: 'Entertainment',
  personal_dev: 'Personal Dev',
  external_affairs: 'External Affairs',
};

/** Determine if the current user can see a particular bill in parliament. */
function isBillVisibleToUser(
  bill: BillItem | ResolutionItem,
  role: string,
  ministryCode: string | undefined
): boolean {
  // President sees everything
  if (role === 'president') return true;

  // Active voting bills are visible to everyone so they can vote
  if (bill.status === 'voting') return true;

  // Public sees only president-approved (enacted/approved) and passed bills
  if (role === 'public') {
    return bill.status === 'approved' || bill.status === 'enacted' || bill.status === 'passed';
  }

  // Ministry users
  if (role === 'ministry') {
    // Always see bills from their own ministry
    const userMinLabel = MINISTRY_LABELS[ministryCode ?? ''] ?? ministryCode ?? '';
    if (bill.ministry.toLowerCase() === userMinLabel.toLowerCase()) return true;
    // Also see president-approved / passed bills from other ministries
    if (bill.status === 'approved' || bill.status === 'enacted' || bill.status === 'passed') return true;
    return false;
  }

  return false;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  draft:              { label: 'Draft',               badge: 'badge-archived',  color: 'hsl(220,15%,55%)' },
  submitted:          { label: 'Submitted',           badge: 'badge-submitted', color: 'hsl(220,80%,60%)' },
  voting:             { label: 'In Voting',           badge: 'badge-voting',    color: 'hsl(35,90%,55%)' },
  awaiting_president: { label: 'Awaiting President',  badge: 'badge-submitted', color: 'hsl(260,80%,65%)' },
  approved:           { label: 'Approved',            badge: 'badge-passed',    color: 'hsl(152,70%,45%)' },
  passed:             { label: 'Passed',              badge: 'badge-passed',    color: 'hsl(152,70%,45%)' },
  enacted:            { label: 'Enacted into Law',    badge: 'badge-enacted',   color: 'hsl(152,85%,35%)' },
  rejected:           { label: 'Rejected',            badge: 'badge-rejected',  color: 'hsl(0,72%,55%)' },
  suspended:          { label: 'Suspended',           badge: 'badge-suspended', color: 'hsl(35,90%,55%)' },
};

// ─── Component ───────────────────────────────────────────────────────────────

const ParliamentPage: React.FC = () => {
  const { role, user } = useAuth();
  const ministryCode = user.ministry_id ?? undefined;
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [publicVoterName] = useState<string>(() => {
    let name = localStorage.getItem('clms_public_voter_name');
    if (!name) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      name = `Public Citizen #${rand}`;
      localStorage.setItem('clms_public_voter_name', name);
    }
    return name;
  });

  const { bills: allBills, loading: billsLoading } = useBills();
  const { resolutions: allResolutions } = useResolutions();

  const allItems = [
    ...allBills.map(b => ({ ...b, itemType: 'bill' as const, displayId: b.bill_number })),
    ...allResolutions.map(r => ({ ...r, itemType: 'resolution' as const, displayId: r.resolution_number }))
  ];

  // Filter bills visible to this user
  const visibleItems = allItems.filter(b => isBillVisibleToUser(b as any, role, ministryCode));

  // Sort: active voting first, then awaiting president, then rest
  const sortedItems = [...visibleItems].sort((a, b) => {
    const priority = (s: string) =>
      s === 'voting' ? 0 : s === 'awaiting_president' ? 1 : s === 'submitted' ? 2 : 3;
    return priority(a.status) - priority(b.status);
  });

  // Active bill for detailed voting panel
  const activeBill = 
    sortedItems.find(b => b.id === selectedBillId) ??
    sortedItems.find(b => b.status === 'voting' || b.status === 'awaiting_president' || b.status === 'submitted') ??
    sortedItems[0];

  const { votes: billVotesData } = useVotes(activeBill?.itemType === 'bill' ? activeBill.id : undefined);
  const { votes: resVotesData } = useResolutionVotes(activeBill?.itemType === 'resolution' ? activeBill.id : undefined);
  
  const billVotes = activeBill 
    ? (activeBill.itemType === 'bill' ? billVotesData : resVotesData as any[]) 
    : [];

  const approveCount = billVotes.filter(v => v.vote === 'approve').length;
  const rejectCount  = billVotes.filter(v => v.vote === 'reject').length;
  const abstainCount = billVotes.filter(v => v.vote === 'abstain').length;
  const total = approveCount + rejectCount + abstainCount;

  const requiredMajority = 0.6;
  const required = Math.max(1, Math.ceil(total * requiredMajority));
  const hasPassed = approveCount >= required;

  const userVoteRecord = activeBill
    ? billVotes.find(v => v.user_name === (role === 'public' ? publicVoterName : user.name))
    : undefined;

  const canVote =
    activeBill?.status === 'voting' &&
    (role === 'president' || role === 'ministry' || role === 'public');

  const handleCastVote = async (choice: 'approve' | 'reject' | 'abstain') => {
    if (!activeBill || !canVote) return;
    const voterName = role === 'public' ? publicVoterName : user.name;
    if (activeBill.itemType === 'bill') {
      await DataStore.castVote(activeBill.id, voterName, role as any, choice);
    } else {
      await DataStore.castResolutionVote(activeBill.id, voterName, role as any, choice);
    }
  };

  const pieData = [
    { name: 'Approve', value: approveCount || 0, color: 'hsl(152,70%,45%)' },
    { name: 'Reject',  value: rejectCount  || 0, color: 'hsl(0,72%,55%)' },
    { name: 'Abstain', value: abstainCount || 0, color: 'hsl(220,15%,55%)' },
  ];

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (visibleItems.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title">
            <div className="icon"><Vote size={20} color="var(--accent-secondary)" /></div>
            <div>
              <h1>Parliament</h1>
              <p>Live voting session & record — {format(new Date(), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 'var(--space-16)',
          gap: 'var(--space-4)', textAlign: 'center',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(94,140,255,0.08))',
            border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={36} color="hsl(260,80%,65%)" />
          </div>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>No Items in Parliament</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 400 }}>
            {role === 'ministry'
              ? 'No items from your ministry have been submitted yet. Create a bill from the Bills page to get started.'
              : 'No items have been approved or submitted to Parliament yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <div className="icon"><Vote size={20} color="var(--accent-secondary)" /></div>
          <div>
            <h1>Parliament</h1>
            <p>Live voting session & record — {format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {[
          { label: 'Active Bills', value: allItems.filter(b => b.status === 'voting').length, color: 'hsl(35,90%,55%)', icon: '🗳️' },
          { label: 'Passed Laws', value: allItems.filter(b => b.status === 'passed' || b.status === 'enacted').length, color: 'hsl(152,70%,45%)', icon: '📜' },
          { label: 'Rejected Bills', value: allItems.filter(b => b.status === 'rejected').length, color: 'hsl(0,72%,55%)', icon: '🚫' },
          { label: 'Total Bills', value: allItems.length, color: 'hsl(220,15%,55%)', icon: '📁' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: '1 1 120px', padding: 'var(--space-4)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bill List Selector */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}>
          <Building2 size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {role === 'ministry' ? 'Your Ministry Items' : 'All Items in Parliament'} ({Math.min(sortedItems.length, 4)})
          </span>
        </div>
        <div className="grid-auto">
          {sortedItems.slice(0, 4).map(bill => {
            const cfg = STATUS_CONFIG[bill.status] ?? { label: bill.status, badge: 'badge-archived', color: 'hsl(220,15%,55%)' };
            const isActive = bill.id === activeBill?.id;
            return (
              <button
                key={bill.id}
                onClick={() => setSelectedBillId(bill.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: isActive
                    ? '1.5px solid rgba(139,92,246,0.6)'
                    : '1px solid var(--border-subtle)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(94,140,255,0.08))'
                    : 'var(--bg-card)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  gap: 4, textAlign: 'left', width: '100%',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                  <span className={`badge ${cfg.badge}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                    {cfg.label}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {bill.title}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {bill.displayId} · {bill.ministry}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Bill Banner */}
      {activeBill && (
        <>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(94,140,255,0.08))',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6) var(--space-8)',
            marginBottom: 'var(--space-6)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 'min(100%, 200px)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                {activeBill.status === 'voting' ? activeBill.itemType === 'bill' ? '🗳️ Currently Voting Bill' : '🗳️ Currently Voting Resolution'
                  : activeBill.status === 'awaiting_president' ? '👑 Awaiting Presidential Approval'
                  : activeBill.status === 'approved' || activeBill.status === 'enacted' ? '✅ President-Approved Law'
                  : '📄 Bill Details'}
              </div>
              <h2 style={{ marginBottom: 6, wordWrap: 'break-word', overflowWrap: 'break-word' }}>{activeBill.title}</h2>
              <p style={{ fontSize: '0.82rem' }}>{activeBill.description}</p>
            </div>
            <div className="grid-auto" style={{ width: '100%', gap: 'var(--space-4)', flexShrink: 0 }}>
              {[
                { label: 'Bill No.', value: activeBill.displayId },
                { label: 'Ministry', value: activeBill.ministry },
                { label: 'Status', value: STATUS_CONFIG[activeBill.status]?.label ?? activeBill.status },
              ].map(f => (
                <div key={f.label} style={{ textAlign: 'left', background: 'var(--bg-glass)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{f.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{f.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Show voting panel only when bill is in 'voting' status */}
          {activeBill.status === 'voting' ? (
            <div className="grid-2" style={{ marginBottom: 'var(--space-8)' }}>
              {/* Vote Meter */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Live Vote Count</div>
                  <div style={{
                    padding: '4px 12px', borderRadius: 'var(--radius-full)',
                    background: hasPassed ? 'hsla(152,70%,45%,0.12)' : 'hsla(35,90%,55%,0.12)',
                    border: `1px solid ${hasPassed ? 'hsla(152,70%,45%,0.3)' : 'hsla(35,90%,55%,0.3)'}`,
                    color: hasPassed ? 'var(--status-passed)' : 'var(--status-suspended)',
                    fontSize: '0.72rem', fontWeight: 700,
                  }}>
                    {hasPassed ? '✓ Will Pass' : '⚠ Below Threshold'}
                  </div>
                </div>

                <div className="vote-meter">
                  {[
                    { label: 'Approve', count: approveCount, cls: 'vote-bar-approve', color: 'hsl(152,70%,50%)' },
                    { label: 'Reject',  count: rejectCount,  cls: 'vote-bar-reject',  color: 'hsl(0,72%,55%)' },
                    { label: 'Abstain', count: abstainCount, cls: 'vote-bar-abstain', color: 'hsl(220,15%,55%)' },
                  ].map(v => (
                    <div key={v.label} className="vote-row">
                      <div className="vote-row-header">
                        <span style={{ color: v.color }}>{v.label}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{v.count} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/ {total}</span></span>
                      </div>
                      <div className="vote-bar-track">
                        <div
                          className={`vote-bar-fill ${v.cls}`}
                          style={{ width: total > 0 ? `${(v.count / total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Needs {required} approve votes to pass (60%)</span>
                  <span style={{ color: hasPassed ? 'var(--status-passed)' : 'var(--status-rejected)', fontWeight: 700 }}>
                    {approveCount} / {required} needed
                  </span>
                </div>

                {/* Vote Buttons */}
                {canVote ? (
                  <>
                    <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)' }}>
                      <button
                        className="btn btn-success"
                        style={{ flex: 1, justifyContent: 'center', opacity: userVoteRecord?.vote === 'approve' ? 1 : 0.7 }}
                        onClick={() => handleCastVote('approve')}
                      >
                        <CheckCircle size={15} /> Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ flex: 1, justifyContent: 'center', opacity: userVoteRecord?.vote === 'reject' ? 1 : 0.7 }}
                        onClick={() => handleCastVote('reject')}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1, justifyContent: 'center', opacity: userVoteRecord?.vote === 'abstain' ? 1 : 0.7 }}
                        onClick={() => handleCastVote('abstain')}
                      >
                        <MinusCircle size={15} /> Abstain
                      </button>
                    </div>
                    {userVoteRecord && (
                      <div style={{ marginTop: 'var(--space-3)', textAlign: 'center', fontSize: '0.82rem', color: 'var(--status-passed)' }}>
                        ✓ Your vote recorded: <span className={`badge badge-${userVoteRecord.vote === 'approve' ? 'passed' : userVoteRecord.vote === 'reject' ? 'rejected' : 'archived'}`}>{userVoteRecord.vote}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)',
                    background: 'hsla(220,15%,55%,0.08)', borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '0.82rem', color: 'var(--text-muted)',
                  }}>
                    <AlertCircle size={14} />
                    {role === 'public'
                      ? 'Public observers cannot vote in Parliament.'
                      : 'Voting is only available when the bill is in active voting session.'}
                  </div>
                )}
              </div>

              {/* SVG Seating Chart */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Parliament Seat Distribution</div>
                </div>
                {total > 0 ? (
                  <ParliamentSeatingChart 
                    approveCount={approveCount} 
                    rejectCount={rejectCount} 
                    abstainCount={abstainCount} 
                    total={total} 
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No votes cast yet
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Non-voting status — show info card instead of vote panel */
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)', padding: 'var(--space-6) var(--space-8)',
              marginBottom: 'var(--space-6)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                background: activeBill.status === 'approved' || activeBill.status === 'enacted'
                  ? 'hsla(152,70%,45%,0.15)' : 'hsla(220,80%,60%,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {activeBill.status === 'approved' || activeBill.status === 'enacted'
                  ? <CheckCircle size={24} color="hsl(152,70%,45%)" />
                  : <FileText size={24} color="hsl(220,80%,65%)" />}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {activeBill.status === 'approved' || activeBill.status === 'enacted'
                    ? 'This bill has been approved by the President and is now in effect.'
                    : activeBill.status === 'awaiting_president'
                    ? 'This bill has passed voting and is waiting for the President to sign.'
                    : activeBill.status === 'rejected'
                    ? 'This bill was rejected and is no longer active.'
                    : activeBill.status === 'draft' || activeBill.status === 'submitted'
                    ? 'This bill has not yet entered the active voting stage.'
                    : 'This bill is currently suspended or under review.'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Created by <strong>{activeBill.created_by_name}</strong> · {activeBill.ministry} Ministry · {activeBill.displayId}
                </div>
              </div>
            </div>
          )}

          {/* Vote Records Table (always shown if votes exist) */}
          {billVotes.length > 0 && (
            <>
              {/* Desktop Table */}
              <div className="desktop-only table-container">
                <div className="table-toolbar">
                  <div className="card-title">Recorded Member Votes</div>
                  <div className="badge badge-voting">{billVotes.length} votes cast</div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Member / Official</th>
                      <th>Role</th>
                      <th>Vote</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billVotes.map(v => (
                      <tr key={v.id}>
                        <td className="text-strong">{v.user_name}</td>
                        <td><span className="badge badge-submitted" style={{ fontSize: '0.68rem' }}>{v.role}</span></td>
                        <td>
                          <span className={`badge badge-${v.vote === 'approve' ? 'passed' : v.vote === 'reject' ? 'rejected' : 'archived'}`}>
                            {v.vote}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {format(new Date(v.timestamp), 'hh:mm:ss a')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="mobile-only" style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <div className="card-title">Recorded Member Votes</div>
                  <div className="badge badge-voting">{billVotes.length} votes cast</div>
                </div>
                {billVotes.map(v => (
                  <div key={v.id} className="card" style={{ padding: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="text-strong">{v.user_name}</span>
                      <span className={`badge badge-${v.vote === 'approve' ? 'passed' : v.vote === 'reject' ? 'rejected' : 'archived'}`}>
                        {v.vote}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-submitted" style={{ fontSize: '0.68rem' }}>{v.role}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {format(new Date(v.timestamp), 'hh:mm:ss a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ParliamentPage;
