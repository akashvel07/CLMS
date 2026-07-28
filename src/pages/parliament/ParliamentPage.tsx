import React, { useState, useEffect } from 'react';
import { Vote, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { DataStore, subscribeDataStore } from '../../lib/dataStore';

const VOTE_HISTORY = [
  { time: '09:00', approve: 5, reject: 2, abstain: 0 },
  { time: '09:30', approve: 9, reject: 3, abstain: 1 },
  { time: '10:00', approve: 13, reject: 5, abstain: 1 },
  { time: '10:30', approve: 16, reject: 6, abstain: 2 },
  { time: '11:00', approve: 18, reject: 7, abstain: 2 },
];

const ParliamentPage: React.FC = () => {
  const { role, user } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribeDataStore(() => setTick(t => t + 1));
  }, []);

  const bills = DataStore.getBills();
  // Find bill currently in voting or submitted or awaiting president status
  const activeBill = bills.find(b => b.status === 'voting' || b.status === 'submitted' || b.status === 'awaiting_president') || bills[0];

  const allVotes = DataStore.getVotes();
  const billVotes = allVotes.filter(v => v.bill_id === activeBill.id);

  const approve = billVotes.filter(v => v.vote === 'approve').length + 5; // base seed count
  const reject = billVotes.filter(v => v.vote === 'reject').length + 2;
  const abstain = billVotes.filter(v => v.vote === 'abstain').length + 1;

  const total = approve + reject + abstain;
  const requiredMajority = 0.6;
  const required = Math.ceil(total * requiredMajority);
  const hasPassed = approve >= required;

  // Check if current user has voted
  const userVoteRecord = billVotes.find(v => v.user_name === user.name);

  const handleCastVote = (choice: 'approve' | 'reject' | 'abstain') => {
    DataStore.castVote(activeBill.id, user.name, role, choice);
  };

  const pieData = [
    { name: 'Approve', value: approve, color: 'hsl(152,70%,45%)' },
    { name: 'Reject', value: reject, color: 'hsl(0,72%,55%)' },
    { name: 'Abstain', value: abstain, color: 'hsl(220,15%,55%)' },
  ];

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

      {/* Active Bill Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(94,140,255,0.08))',
        border: '1px solid rgba(139,92,246,0.25)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6) var(--space-8)',
        marginBottom: 'var(--space-8)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-6)',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Currently Voting Bill
          </div>
          <h2 style={{ marginBottom: 6 }}>{activeBill.title}</h2>
          <p style={{ fontSize: '0.82rem' }}>{activeBill.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexShrink: 0 }}>
          {[
            { label: 'Bill No.', value: activeBill.bill_number },
            { label: 'Ministry', value: activeBill.ministry },
            { label: 'Total Votes', value: `${total}` },
            { label: 'Required Threshold', value: `${Math.round(requiredMajority * 100)}%` },
          ].map(f => (
            <div key={f.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{f.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

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
              { label: 'Approve', count: approve, total, cls: 'vote-bar-approve', color: 'hsl(152,70%,50%)' },
              { label: 'Reject', count: reject, total, cls: 'vote-bar-reject', color: 'hsl(0,72%,55%)' },
              { label: 'Abstain', count: abstain, total, cls: 'vote-bar-abstain', color: 'hsl(220,15%,55%)' },
            ].map(v => (
              <div key={v.label} className="vote-row">
                <div className="vote-row-header">
                  <span style={{ color: v.color }}>{v.label}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{v.count} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/ {v.total}</span></span>
                </div>
                <div className="vote-bar-track">
                  <div
                    className={`vote-bar-fill ${v.cls}`}
                    style={{ width: v.total > 0 ? `${(v.count / v.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Required threshold indicator */}
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Needs {required} approve votes to pass</span>
            <span style={{ color: hasPassed ? 'var(--status-passed)' : 'var(--status-rejected)', fontWeight: 700 }}>
              {approve} / {required} needed
            </span>
          </div>

          {/* Live Voting Buttons for active user profile */}
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
              ✓ Live vote recorded for <strong>{user.name}</strong> ({role}): <span className={`badge badge-${userVoteRecord.vote === 'approve' ? 'passed' : userVoteRecord.vote === 'reject' ? 'rejected' : 'archived'}`}>{userVoteRecord.vote}</span>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Vote Distribution</div>
          </div>
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
        </div>
      </div>

      {/* Voting Records Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="card-title">Recorded Member Votes</div>
          <div className="badge badge-voting">{billVotes.length} live votes cast</div>
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
            {billVotes.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-4)' }}>
                  No votes recorded yet for this bill. Cast your vote above!
                </td>
              </tr>
            ) : (
              billVotes.map(v => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParliamentPage;
