import { Globe2, Eye, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useBills, useRequests, useLaws } from '../../hooks/useSupabaseData';
import { format } from 'date-fns';

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

const PublicDashboard: React.FC = () => {
  const { bills } = useBills();
  const { requests } = useRequests();
  const { laws } = useLaws();

  // Compute active bills by ministry
  const ministriesStatusList = Object.entries(MINISTRY_LABELS).map(([code, label]) => {
    const minBills = bills.filter(b => b.ministry_code === code);
    const minRequests = requests.filter(r => r.from === label || r.to === label);
    
    // Status can just show 'good' or default
    return {
      name: label,
      status: 'good',
      bills: minBills.filter(b => b.status !== 'draft').length,
      budget: code === 'finance' ? '₹5.2M' : code === 'health' ? '₹2.4M' : code === 'education' ? '₹1.8M' : '₹1.0M',
      requests: minRequests.filter(r => r.status === 'pending').length,
    };
  });

  // Budget allocations
  const BUDGET_PIE = [
    { name: 'Finance', value: 5.2, color: 'var(--ministry-finance)' },
    { name: 'Health', value: 2.4, color: 'var(--ministry-health)' },
    { name: 'Education', value: 1.8, color: 'var(--ministry-education)' },
    { name: 'IT', value: 1.6, color: 'var(--ministry-it)' },
    { name: 'Others', value: 3.9, color: 'var(--text-muted)' },
  ];

  // Bills passed by ministry chart data
  const billsChartData = Object.entries(MINISTRY_LABELS).map(([code, label]) => {
    const passedCount = bills.filter(b => b.ministry_code === code && (b.status === 'passed' || b.status === 'approved' || b.status === 'enacted')).length;
    return {
      name: label.split(' ')[0], // short name
      bills: passedCount,
    };
  });

  const activeLaws = laws.filter(l => l.status === 'active');

  const STATUS_LABEL: Record<string, string> = {
    exceptional: 'Exceptional', very_good: 'Very Good', good: 'Good',
    well: 'Well', underperforming: 'Underperforming', poor: 'Poor',
  };
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'var(--space-8)' }}>
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
              {ministriesStatusList.map(m => (
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
              <div className="card-subtitle">By ministry (₹M)</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', height: 200 }}>
              <div style={{ flex: 1, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={BUDGET_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {BUDGET_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`₹${v}M`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {BUDGET_PIE.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                    <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                    <strong style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>₹{d.value}M</strong>
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
                <BarChart data={billsChartData} barSize={20}>
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
            <span className="badge badge-enacted">{activeLaws.length} Laws</span>
          </div>
          <p style={{ fontSize: '0.82rem', marginBottom: 'var(--space-5)' }}>
            All active laws enacted by parliament and approved by the President. This record is open to all citizens.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {activeLaws.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontSize: '0.88rem', padding: 'var(--space-6)', textAlign: 'center' }}>
                No active laws enacted yet.
              </div>
            ) : (
              activeLaws.map(l => (
                <div key={l.id} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)' }}>
                  <div className="law-number" style={{ marginBottom: 6 }}>{l.law_number}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 4 }}>{l.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.ministry} · {l.approved_at ? format(new Date(l.approved_at), 'MMM dd, yyyy') : 'Recent'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;
