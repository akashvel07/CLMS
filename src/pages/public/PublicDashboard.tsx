import React from 'react';
import { Globe2, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const MINISTRIES = [
  { name: 'Health', status: 'very_good', bills: 3, budget: '₡2.4M', requests: 2 },
  { name: 'Education', status: 'good', bills: 2, budget: '₡1.8M', requests: 1 },
  { name: 'Finance', status: 'exceptional', bills: 1, budget: '₡5.2M', requests: 0 },
  { name: 'Career', status: 'well', bills: 1, budget: '₡1.1M', requests: 3 },
  { name: 'IT', status: 'good', bills: 2, budget: '₡1.6M', requests: 1 },
  { name: 'Personal Dev', status: 'underperforming', bills: 0, budget: '₡0.6M', requests: 2 },
  { name: 'Entertainment', status: 'well', bills: 1, budget: '₡0.9M', requests: 0 },
  { name: 'External Affairs', status: 'good', bills: 2, budget: '₡1.3M', requests: 4 },
];

const BUDGET_PIE = [
  { name: 'Finance', value: 5.2, color: 'var(--ministry-finance)' },
  { name: 'Health', value: 2.4, color: 'var(--ministry-health)' },
  { name: 'Education', value: 1.8, color: 'var(--ministry-education)' },
  { name: 'IT', value: 1.6, color: 'var(--ministry-it)' },
  { name: 'Others', value: 3.9, color: 'var(--text-muted)' },
];

const BILLS_DATA = [
  { name: 'Health', bills: 7 }, { name: 'Education', bills: 5 }, { name: 'Finance', bills: 4 },
  { name: 'IT', bills: 4 }, { name: 'Career', bills: 3 }, { name: 'External', bills: 3 },
  { name: 'Entertainment', bills: 2 }, { name: 'Personal', bills: 1 },
];

const STATUS_LABEL: Record<string, string> = {
  exceptional: 'Exceptional', very_good: 'Very Good', good: 'Good',
  well: 'Well', underperforming: 'Underperforming', poor: 'Poor',
};

const PublicDashboard: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'var(--space-8)' }}>
      {/* Public Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
          background: 'linear-gradient(135deg, rgba(94,140,255,0.08), rgba(139,92,246,0.06))',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-6) var(--space-8)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Globe2 size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Public Transparency Dashboard</h1>
            <p style={{ fontSize: '0.85rem' }}>Open government data — read-only access for all citizens</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--status-passed)' }}>
            <Eye size={14} />
            Public Access
          </div>
        </div>

        {/* Ministry Status Table */}
        <div className="table-container" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="table-toolbar">
            <div className="card-title">Ministry Status Overview</div>
            <span className="badge badge-enacted">8 Ministries</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Ministry</th>
                <th>Status</th>
                <th>Active Bills</th>
                <th>Budget</th>
                <th>Open Requests</th>
              </tr>
            </thead>
            <tbody>
              {MINISTRIES.map(m => (
                <tr key={m.name}>
                  <td className="text-strong">{m.name}</td>
                  <td><span className={`badge badge-${m.status}`}>{STATUS_LABEL[m.status]}</span></td>
                  <td>{m.bills}</td>
                  <td>{m.budget}</td>
                  <td>{m.requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts */}
        <div className="grid-2" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Budget Allocation</div>
              <div className="card-subtitle">By ministry (₡M)</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', height: 200 }}>
              <div style={{ flex: 1, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={BUDGET_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {BUDGET_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`₡${v}M`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {BUDGET_PIE.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                    <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                    <strong style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>₡{d.value}M</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Bills Passed by Ministry</div>
              <div className="card-subtitle">All time</div>
            </div>
            <div className="chart-container" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BILLS_DATA} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="bills" fill="url(#pubGrad)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="pubGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(220,90%,60%)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(265,80%,65%)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Enacted Laws */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Enacted Laws — Public Record</div>
            <span className="badge badge-enacted">42 Laws</span>
          </div>
          <p style={{ fontSize: '0.82rem', marginBottom: 'var(--space-5)' }}>
            All active laws enacted by parliament and approved by the President. This record is open to all citizens.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { law: 'LAW-2024-001', title: 'National Health Coverage Act', ministry: 'Health', date: 'Jan 15, 2024' },
              { law: 'LAW-2024-002', title: 'Digital Education Standards Act', ministry: 'Education', date: 'Feb 3, 2024' },
              { law: 'LAW-2024-003', title: 'Annual Budget Allocation Framework', ministry: 'Finance', date: 'Feb 20, 2024' },
              { law: 'LAW-2024-004', title: 'Cybersecurity Infrastructure Act', ministry: 'IT', date: 'Mar 8, 2024' },
              { law: 'LAW-2024-005', title: 'National Employment Guarantee Act', ministry: 'Career', date: 'Mar 22, 2024' },
              { law: 'LAW-2024-007', title: 'Mental Health Reform Act', ministry: 'Health', date: 'Apr 18, 2024' },
            ].map(l => (
              <div key={l.law} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)' }}>
                <div className="law-number" style={{ marginBottom: 6 }}>{l.law}</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 4 }}>{l.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.ministry} · {l.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;
