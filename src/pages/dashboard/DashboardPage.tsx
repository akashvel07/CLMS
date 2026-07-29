import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText, BookOpen, Vote, Building2, MessageSquare, TrendingUp,
  CheckCircle, AlertTriangle, Activity, Crown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

import { useBills, useRequests, useLaws, useVotes } from '../../hooks/useSupabaseData';

const BILL_TREND = [
  { month: 'Jan', bills: 4 }, { month: 'Feb', bills: 7 }, { month: 'Mar', bills: 5 },
  { month: 'Apr', bills: 9 }, { month: 'May', bills: 12 }, { month: 'Jun', bills: 8 },
  { month: 'Jul', bills: 15 },
];

const DashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const { bills } = useBills();
  const { laws } = useLaws();
  const { requests } = useRequests();
  const { votes } = useVotes();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const enactedCount = bills.filter(b => b.status === 'enacted' || b.status === 'approved').length;
  const openBillsCount = bills.filter(b => b.status !== 'enacted' && b.status !== 'rejected').length;
  const suspendedCount = bills.filter(b => b.status === 'suspended').length;
  const pendingReqCount = requests.filter(r => r.status === 'pending').length;

  const pieData = [
    { name: 'Enacted', value: enactedCount, color: 'hsl(152,70%,45%)' },
    { name: 'Voting', value: bills.filter(b => b.status === 'voting').length, color: 'hsl(265,80%,65%)' },
    { name: 'Suspended', value: suspendedCount, color: 'hsl(35,95%,55%)' },
    { name: 'Rejected', value: bills.filter(b => b.status === 'rejected').length, color: 'hsl(0,72%,55%)' },
  ];

  const stats = [
    { label: 'Active Laws', value: `${laws.filter(l => l.status === 'active').length}`, icon: BookOpen, color: 'var(--accent-primary)', glow: 'var(--accent-primary-glow)', trend: 'Active framework', up: true },
    { label: 'Open Bills', value: `${openBillsCount}`, icon: FileText, color: 'var(--accent-secondary)', glow: 'var(--accent-secondary-glow)', trend: 'Under review', up: true },
    { label: 'Parliament Votes', value: `${votes.length}`, icon: Vote, color: 'var(--ministry-finance)', glow: 'var(--ministry-finance-glow)', trend: 'All cast votes', up: true },
    { label: 'Pending Requests', value: `${pendingReqCount}`, icon: MessageSquare, color: 'var(--ministry-career)', glow: 'var(--ministry-career-glow)', trend: `${pendingReqCount} active`, up: false },
    { label: 'Ministries', value: '8', icon: Building2, color: 'var(--ministry-it)', glow: 'var(--ministry-it-glow)', trend: 'All active', up: true },
    { label: 'Suspended Bills', value: `${suspendedCount}`, icon: AlertTriangle, color: 'var(--status-suspended)', glow: 'hsla(35,95%,55%,0.25)', trend: 'Needs review', up: false },
  ];

  const activityFeed = bills.slice(0, 5).map((b, idx) => ({
    id: idx,
    text: `Bill ${b.bill_number} (${b.title}) status updated to ${b.status.replace('_', ' ')}`,
    time: 'Recently',
    color: b.status === 'enacted' || b.status === 'approved' ? 'var(--status-passed)' : b.status === 'rejected' ? 'var(--status-rejected)' : 'var(--accent-primary)',
    icon: b.status === 'enacted' || b.status === 'approved' ? CheckCircle : FileText,
  }));

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>
              {greeting()}, {user?.name?.split(' ')[0] ?? 'User'}{role === 'president' ? ' 🏛️' : ''}
            </h1>
            <p>Here's what's happening in the legislature today.</p>
          </div>
          {role === 'president' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              background: 'linear-gradient(135deg, hsla(43,96%,60%,0.12), hsla(35,90%,55%,0.08))',
              border: '1px solid hsla(43,96%,60%,0.25)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-5)',
            }}>
              <Crown size={20} color="var(--accent-gold)" />
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.9rem' }}>Presidential Office</span>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
        {stats.map(s => (
          <div
            key={s.label}
            className="stat-card"
            style={{ '--card-accent': s.color, '--card-glow': s.glow } as React.CSSProperties}
          >
            <div className="stat-icon">
              <s.icon size={22} />
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-trend ${s.up ? 'up' : 'down'}`}>
              <TrendingUp size={12} />
              {s.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Bill trend chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Bills Submitted — 2024</div>
              <div className="card-subtitle">Monthly legislative activity</div>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BILL_TREND} barSize={24}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="bills" fill="url(#billGrad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="billGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(220,90%,60%)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(265,80%,65%)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bill status pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Bill Status Distribution</div>
              <div className="card-subtitle">Live distribution across status</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: 220 }}>
            {bills.length === 0 ? (
              <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Activity size={24} style={{ opacity: 0.4 }} />
                No bill data available
              </div>
            ) : (
              <>
                <div className="chart-container" style={{ flex: 1, height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                        formatter={(val: number, name: string) => [`${val} bills`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingLeft: 'var(--space-4)' }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.78rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--text-primary)', fontWeight: 600 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed + Quick Actions */}
      <div className="grid-2">
        {/* Activity */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest legislative events</div>
            </div>
            <Activity size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="activity-feed">
            {activityFeed.map(a => (
              <div key={a.id} className="activity-item">
                <div className="activity-dot" style={{ background: `${a.color}22`, color: a.color }}>
                  <a.icon size={14} />
                </div>
                <div className="activity-content">
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Quick Actions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              { label: 'Create New Bill', icon: FileText, path: '/bills/new', color: 'btn-primary', show: role !== 'public' },
              { label: 'View Parliament', icon: Vote, path: '/parliament', color: 'btn-secondary', show: true },
              { label: 'Constitution Table', icon: BookOpen, path: '/constitution', color: 'btn-secondary', show: true },
              { label: 'Submit Request', icon: MessageSquare, path: '/requests', color: 'btn-secondary', show: role !== 'public' },
              { label: 'Presidential Controls', icon: Crown, path: '/president', color: 'btn-secondary', show: role === 'president' },
            ]
              .filter(a => a.show)
              .map(a => (
                <a
                  key={a.label}
                  href={a.path}
                  className={`btn ${a.color}`}
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                >
                  <a.icon size={16} />
                  {a.label}
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
