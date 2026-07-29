import React, { useState, useEffect } from 'react';
import { Vote, CheckCircle, XCircle, MinusCircle, FileText, Building2, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { DataStore, subscribeDataStore, type BillItem } from '../../lib/dataStore';

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
  bill: BillItem,
  role: string,
  ministryCode: string | undefined
): boolean {
  // President sees everything
  if (role === 'president') return true;

  // Public sees only president-approved (enacted/approved) bills
  if (role === 'public') {
    return bill.status === 'approved' || bill.status === 'enacted' || bill.status === 'passed';
  }

  // Ministry users
  if (role === 'ministry') {
    // Always see bills from their own ministry
    const userMinLabel = MINISTRY_LABELS[ministryCode ?? ''] ?? ministryCode ?? '';
    if (bill.ministry.toLowerCase() === userMinLabel.toLowerCase()) return true;
    // Also see president-approved bills from other ministries
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
  const [, setTick] = useState(0);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeDataStore(() => setTick(t => t + 1));
  }, []);

  const allBills = DataStore.getBills();

  // Filter bills visible to this user
  const visibleBills = allBills.filter(b => isBillVisibleToUser(b, role, ministryCode));

  // Sort: active voting first, then awaiting president, then rest
  const sortedBills = [...visibleBills].sort((a, b) => {
    const priority = (s: string) =>
      s === 'voting' ? 0 : s === 'awaiting_president' ? 1 : s === 'submitted' ? 2 : 3;
    return priority(a.status) - priority(b.status);
  });

  // Active bill for detailed voting panel
  const activeBill: BillItem | undefined =
    sortedBills.find(b => b.id === selectedBillId) ??
    sortedBills.find(b => b.status === 'voting' || b.status === 'awaiting_president' || b.status === 'submitted') ??
    sortedBills[0];

  const allVotes = DataStore.getVotes();
  const billVotes = activeBill ? allVotes.filter(v => v.bill_id === activeBill.id) : [];

  const approveCount = billVotes.filter(v => v.vote === 'approve').length;
  const rejectCount  = billVotes.filter(v => v.vote === 'reject').length;
  const abstainCount = billVotes.filter(v => v.vote === 'abstain').length;
  const total = approveCount + rejectCount + abstainCount;

  const requiredMajority = 0.6;
  const required = Math.max(1, Math.ceil(total * requiredMajority));
  const hasPassed = approveCount >= required;

  const userVoteRecord = activeBill
    ? billVotes.find(v => v.user_name === user.name)
    : undefined;

  const canVote =
    activeBill?.status === 'voting' &&
    (role === 'president' || role === 'ministry');

  const handleCastVote = (choice: 'approve' | 'reject' | 'abstain') => {
    if (!activeBill || !canVote) return;
    DataStore.castVote(activeBill.id, user.name, role as any, choice);
  };

  const pieData = [
    { name: 'Approve', value: approveCount || 0, color: 'hsl(152,70%,45%)' },
    { name: 'Reject',  value: rejectCount  || 0, color: 'hsl(0,72%,55%)' },
    { name: 'Abstain', value: abstainCount || 0, color: 'hsl(220,15%,55%)' },
  ];

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (visibleBills.length === 0) {
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
          <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>No Bills in Parliament</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 400 }}>
            {role === 'ministry'
              ? 'No bills from your ministry have been submitted yet. Create a bill from the Bills page to get started.'
              : 'No bills have been approved or submitted to Parliament yet.'}
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

      {/* Bill List Selector */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}>
          <Building2 size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {role === 'ministry' ? 'Your Ministry Bills' : 'All Bills in Parliament'} ({sortedBills.length})
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {sortedBills.map(bill => {
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
                  gap: 4, minWidth: 160, maxWidth: 240, textAlign: 'left',
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
                  {bill.bill_number} · {bill.ministry}
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
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                {activeBill.status === 'voting' ? '🗳️ Currently Voting Bill'
                  : activeBill.status === 'awaiting_president' ? '👑 Awaiting Presidential Approval'
                  : activeBill.status === 'approved' || activeBill.status === 'enacted' ? '✅ President-Approved Law'
                  : '📄 Bill Details'}
              </div>
              <h2 style={{ marginBottom: 6 }}>{activeBill.title}</h2>
              <p style={{ fontSize: '0.82rem' }}>{activeBill.description}</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-6)', flexShrink: 0, flexWrap: 'wrap' }}>
              {[
                { label: 'Bill No.', value: activeBill.bill_number },
                { label: 'Ministry', value: activeBill.ministry },
                { label: 'Status', value: STATUS_CONFIG[activeBill.status]?.label ?? activeBill.status },
              ].map(f => (
                <div key={f.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{f.value}</div>
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

              {/* Pie Chart */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Vote Distribution</div>
                </div>
                {total > 0 ? (
                  <>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-5)', marginTop: 'var(--space-2)' }}>
                      {pieData.map(d => (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                          <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{d.value}</strong>
                        </div>
                      ))}
                    </div>
                  </>
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
                  Created by <strong>{activeBill.created_by}</strong> · {activeBill.ministry} Ministry · {activeBill.bill_number}
                </div>
              </div>
            </div>
          )}

          {/* Vote Records Table (always shown if votes exist) */}
          {billVotes.length > 0 && (
            <div className="table-container">
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
          )}
        </>
      )}
    </div>
  );
};

export default ParliamentPage;
