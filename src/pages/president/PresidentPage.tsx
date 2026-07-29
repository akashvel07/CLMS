import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle, XCircle, PauseCircle, Flag, Bell, TrendingUp, TrendingDown, FileText, MessageSquare, AlertTriangle, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useBills, useRequests, useLaws } from '../../hooks/useSupabaseData';
import { DataStore } from '../../lib/dataStore';

const STATUS_LABEL: Record<string, string> = {
  exceptional: 'Exceptional', very_good: 'Very Good', good: 'Good',
  well: 'Well', underperforming: 'Underperforming', poor: 'Poor',
};

const PERFORMANCE_DATA = [
  { ministry: 'Health', score: 87 }, { ministry: 'Education', score: 79 },
  { ministry: 'Finance', score: 94 }, { ministry: 'Career', score: 72 },
  { ministry: 'IT', score: 81 }, { ministry: 'Personal Dev', score: 58 },
  { ministry: 'Entertainment', score: 70 }, { ministry: 'External', score: 76 },
];

const PresidentPage: React.FC = () => {
  const { user } = useAuth();
  const { bills } = useBills();
  const { requests } = useRequests();
  const { laws } = useLaws();

  // Filter pending approvals (Bills awaiting president + Pending Requests)
  const pendingBills = bills.filter(b => b.status === 'awaiting_president' || b.status === 'suspended' || b.status === 'voting');
  const pendingRequests = requests.filter(r => r.status === 'pending');

  const topStats = [
    { label: 'Total Ministries', value: '8', icon: Crown, color: 'var(--accent-gold)', glow: 'var(--ministry-president-glow)' },
    { label: 'Bills Passed', value: `${bills.filter(b => b.status === 'passed' || b.status === 'approved' || b.status === 'enacted').length}`, icon: CheckCircle, color: 'var(--status-passed)', glow: 'hsla(152,70%,50%,0.25)' },
    { label: 'Bills Suspended', value: `${bills.filter(b => b.status === 'suspended').length}`, icon: PauseCircle, color: 'var(--status-suspended)', glow: 'hsla(35,95%,55%,0.25)' },
    { label: 'Pending Requests', value: `${pendingRequests.length}`, icon: MessageSquare, color: 'var(--accent-secondary)', glow: 'var(--accent-secondary-glow)' },
    { label: 'Active Laws', value: `${laws.filter(l => l.status === 'active').length}`, icon: FileText, color: 'var(--accent-primary)', glow: 'var(--accent-primary-glow)' },
    { label: 'Open Bills', value: `${bills.filter(b => b.status !== 'enacted' && b.status !== 'rejected').length}`, icon: AlertTriangle, color: 'var(--ministry-career)', glow: 'var(--ministry-career-glow)' },
  ];

  const ministryStatusList = [
    { name: 'Health', code: 'health', status: 'very_good', score: 87, budget: '₡2.4M', trend: 'up', requests: requests.filter(r => r.from === 'Health').length, bills: bills.filter(b => b.ministry === 'Health').length, alerts: 0, color: 'var(--ministry-health)' },
    { name: 'Education', code: 'education', status: 'good', score: 79, budget: '₡1.8M', trend: 'up', requests: requests.filter(r => r.from === 'Education').length, bills: bills.filter(b => b.ministry === 'Education').length, alerts: 0, color: 'var(--ministry-education)' },
    { name: 'Finance', code: 'finance', status: 'exceptional', score: 94, budget: '₡5.2M', trend: 'up', requests: requests.filter(r => r.from === 'Finance').length, bills: bills.filter(b => b.ministry === 'Finance').length, alerts: 0, color: 'var(--ministry-finance)' },
    { name: 'Career', code: 'career', status: 'well', score: 72, budget: '₡1.1M', trend: 'down', requests: requests.filter(r => r.from === 'Career').length, bills: bills.filter(b => b.ministry === 'Career').length, alerts: 1, color: 'var(--ministry-career)' },
    { name: 'IT', code: 'it', status: 'good', score: 81, budget: '₡1.6M', trend: 'up', requests: requests.filter(r => r.from === 'IT').length, bills: bills.filter(b => b.ministry === 'IT').length, alerts: 0, color: 'var(--ministry-it)' },
    { name: 'Personal Dev', code: 'personal_dev', status: 'underperforming', score: 58, budget: '₡0.6M', trend: 'down', requests: requests.filter(r => r.from === 'Personal Dev').length, bills: bills.filter(b => b.ministry === 'Personal Dev').length, alerts: 2, color: 'var(--ministry-personal)' },
    { name: 'Entertainment', code: 'entertainment', status: 'well', score: 70, budget: '₡0.9M', trend: 'up', requests: requests.filter(r => r.from === 'Entertainment').length, bills: bills.filter(b => b.ministry === 'Entertainment').length, alerts: 0, color: 'var(--ministry-entertainment)' },
    { name: 'External Affairs', code: 'external_affairs', status: 'good', score: 76, budget: '₡1.3M', trend: 'up', requests: requests.filter(r => r.from === 'External Affairs').length, bills: bills.filter(b => b.ministry === 'External Affairs').length, alerts: 1, color: 'var(--ministry-external)' },
  ];

  const handleApproveBill = async (id: string) => {
    await DataStore.updateBillStatus(id, 'approved');
  };

  const handleRejectBill = async (id: string) => {
    await DataStore.updateBillStatus(id, 'rejected');
  };

  const handleSuspendBill = async (id: string) => {
    await DataStore.updateBillStatus(id, 'suspended');
  };

  const handleApproveRequest = async (id: string) => {
    await DataStore.updateRequestStatus(id, 'approved');
  };

  const handleRejectRequest = async (id: string) => {
    await DataStore.updateRequestStatus(id, 'rejected');
  };

  const handleReturnRequest = async (id: string) => {
    await DataStore.updateRequestStatus(id, 'returned');
  };

  return (
    <div className="page-container">
      {/* Presidential Header */}
      <div style={{
        background: 'linear-gradient(135deg, hsla(43,96%,60%,0.1), hsla(35,90%,55%,0.06))',
        border: '1px solid hsla(43,96%,60%,0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6) var(--space-8)',
        marginBottom: 'var(--space-8)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-5)',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--accent-gold), hsl(35,90%,55%))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px var(--ministry-president-glow)' }}>
          <Crown size={26} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Presidential Dashboard</h1>
          <p>Full executive oversight & approval management — {user?.name ?? 'President Alexander'}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary btn-sm"><Bell size={14} /> Send Notice</button>
          <button className="btn btn-warning btn-sm"><Flag size={14} /> Flag Ministry</button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
        {topStats.map(s => (
          <div key={s.label} className="stat-card president-card" style={{ '--card-accent': s.color, '--card-glow': s.glow } as React.CSSProperties}>
            <div className="stat-icon"><s.icon size={22} /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ministry Status Cards + Performance */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Cards */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Ministry Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {ministryStatusList.map(m => (
              <div key={m.code} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-5)',
                display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                transition: 'all var(--transition-base)',
              }}>
                <div style={{ width: 8, height: 40, borderRadius: 4, background: m.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{m.name}</span>
                    <span className={`badge badge-${m.status}`} style={{ fontSize: '0.62rem' }}>{STATUS_LABEL[m.status]}</span>
                    {m.alerts > 0 && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--status-rejected)', fontWeight: 700, marginLeft: 2 }}>
                        ⚠ {m.alerts} alert{m.alerts > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Budget: <strong style={{ color: 'var(--text-secondary)' }}>{m.budget}</strong></span>
                    <span>Bills: <strong style={{ color: 'var(--text-secondary)' }}>{m.bills}</strong></span>
                    <span>Requests: <strong style={{ color: 'var(--text-secondary)' }}>{m.requests}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: m.color }}>{m.score}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: m.trend === 'up' ? 'hsl(152,70%,50%)' : 'hsl(0,72%,55%)' }}>
                    {m.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {m.trend === 'up' ? 'Improving' : 'Declining'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Chart + Approvals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Performance Overview</div>
            </div>
            <div className="chart-container" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PERFORMANCE_DATA} layout="vertical" barSize={12}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="ministry" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="score" fill="url(#perfGrad)" radius={[0, 4, 4, 0]} />
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(220,90%,60%)" />
                      <stop offset="100%" stopColor="hsl(265,80%,65%)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Approvals Panel (Live DataStore linked) */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Pending Executive Approvals</div>
              <span className="badge badge-awaiting_president">
                {pendingBills.length + pendingRequests.length} Pending
              </span>
            </div>

            {pendingBills.length === 0 && pendingRequests.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <CheckCircle size={24} color="var(--status-passed)" style={{ marginBottom: 8 }} />
                <div>All pending executive approvals have been resolved!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* Pending Bills */}
                {pendingBills.map(b => (
                  <div key={b.id} style={{
                    background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
                    border: b.status === 'suspended' ? '1px solid hsla(35,95%,55%,0.3)' : '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{b.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bill · {b.ministry} · {b.bill_number}</div>
                      </div>
                      <span className={`badge badge-${b.status}`} style={{ fontSize: '0.62rem' }}>{b.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {b.status === 'awaiting_president' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleApproveBill(b.id)} style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem' }}>
                          <CheckCircle size={12} /> Approve
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleRejectBill(b.id)} style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem' }}>
                        <XCircle size={12} /> Reject
                      </button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleSuspendBill(b.id)} style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem' }}>
                        <PauseCircle size={12} /> Suspend
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pending Requests */}
                {pendingRequests.map(r => (
                  <div key={r.id} style={{
                    background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{r.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Request · {r.from} ➔ {r.to} · {r.id}</div>
                      </div>
                      <span className={`badge badge-${r.priority}`} style={{ fontSize: '0.62rem' }}>{r.priority}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleApproveRequest(r.id)} style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem' }}>
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRejectRequest(r.id)} style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem' }}>
                        <XCircle size={12} /> Reject
                      </button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleReturnRequest(r.id)} style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem' }}>
                        <PauseCircle size={12} /> Return
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresidentPage;
