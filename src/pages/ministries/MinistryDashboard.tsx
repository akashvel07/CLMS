import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, PauseCircle, PenTool } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import WriteStatementModal from '../../components/shared/WriteStatementModal';
import { useBudgets } from '../../hooks/useSupabaseData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// ─── Ministry Config ───────────────────────────────────────────────────────────

export interface MetricCard { label: string; value: string; unit?: string; trend?: 'up' | 'down' | 'flat'; sub?: string; }

export interface MinistryConfig {
  name: string;
  code: string;
  color: string;
  glow: string;
  icon: React.ReactNode;
  description: string;
  status: string;
  score: number;
  budget: string;
  metrics: MetricCard[];
  chartData: { label: string; value: number }[];
  chartLabel: string;
  canSuspend: boolean;
}


// ─── Ministry Dashboard Component ─────────────────────────────────────────────

interface MinistryDashboardProps { config: MinistryConfig; }

const MinistryDashboard: React.FC<MinistryDashboardProps> = ({ config }) => {
  const { role, user } = useAuth();
  const { budgets } = useBudgets();
  const [isStatementModalOpen, setStatementModalOpen] = useState(false);

  // Compute live budget
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const activeBudget = budgets?.find((b: any) => b.status === 'approved' && b.month === currentMonth && b.year === currentYear);
  let allocated = 0;
  let used = 0;
  let debt = 0;

  if (activeBudget && activeBudget.allocations) {
    activeBudget.allocations.forEach((item: any) => {
      if (item.ministry_code === config.code && item.status !== 'rejected' && !item.is_held) {
        allocated += item.amount;
        used += (item.used_amount || 0);
        debt += Math.max(0, (item.used_amount || 0) - item.amount);
      }
    });
  }

  const remaining = Math.max(0, allocated - used);

  const STATUS_LABEL: Record<string, string> = {
    exceptional: 'Exceptional', very_good: 'Very Good', good: 'Good',
    well: 'Well', underperforming: 'Underperforming', poor: 'Poor',
  };

  return (
    <div className="page-container">
      {/* Ministry Header */}
      <div
        className="ministry-header"
        style={{ '--ministry-color': config.color, '--ministry-color-glow': config.glow } as React.CSSProperties}
      >
        <div className="ministry-logo" style={{ '--ministry-color': config.color } as React.CSSProperties}>
          {config.icon}
        </div>
        <div className="ministry-info">
          <div className="ministry-name">{config.name} Ministry</div>
          <div className="ministry-desc">{config.description}</div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <span className={`badge badge-${config.status}`}>{STATUS_LABEL[config.status]}</span>
            {config.canSuspend && role !== 'public' && (
              <button className="btn btn-warning btn-sm">
                <PauseCircle size={13} /> Suspend Bill
              </button>
            )}
            {(role === 'ministry' && user.ministry_id === config.code) && (
              <button className="btn btn-primary btn-sm" onClick={() => setStatementModalOpen(true)}>
                <PenTool size={13} /> Write Statement
              </button>
            )}
          </div>
        </div>
        <div className="ministry-stats">
          <div className="ministry-stat">
            <div className="ministry-stat-value" style={{ color: config.color }}>{config.score}</div>
            <div className="ministry-stat-label">Performance</div>
          </div>
          <div className="ministry-stat">
            <div className="ministry-stat-value" style={{ color: config.color }}>₹{allocated.toLocaleString()}</div>
            <div className="ministry-stat-label">Allocated</div>
          </div>
          <div className="ministry-stat">
            <div className="ministry-stat-value" style={{ color: 'var(--text-primary)' }}>₹{used.toLocaleString()}</div>
            <div className="ministry-stat-label">Used</div>
          </div>
          {debt > 0 && (
            <div className="ministry-stat">
              <div className="ministry-stat-value" style={{ color: 'var(--status-rejected)' }}>₹{debt.toLocaleString()}</div>
              <div className="ministry-stat-label" style={{ color: 'var(--status-rejected)' }}>Debt</div>
            </div>
          )}
          {remaining > 0 && debt === 0 && (
            <div className="ministry-stat">
              <div className="ministry-stat-value" style={{ color: 'var(--status-passed)' }}>₹{remaining.toLocaleString()}</div>
              <div className="ministry-stat-label">Remaining</div>
            </div>
          )}
          
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        {config.metrics.map(m => (
          <div key={m.label} className="stat-card" style={{ '--card-accent': config.color, '--card-glow': config.glow } as React.CSSProperties}>
            <div className="stat-value" style={{ fontSize: '1.6rem' }}>{m.value}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>{m.unit}</span></div>
            <div className="stat-label">{m.label}</div>
            {m.trend && (
              <div className={`stat-trend ${m.trend === 'up' ? 'up' : m.trend === 'down' ? 'down' : ''}`} style={{ color: m.trend === 'flat' ? 'var(--text-muted)' : undefined }}>
                {m.trend === 'up' ? <TrendingUp size={12} /> : m.trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
                {m.sub ?? (m.trend === 'up' ? 'Improving' : m.trend === 'down' ? 'Declining' : 'Stable')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{config.chartLabel}</div>
            <div className="card-subtitle">Monthly trend — 2024</div>
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={config.chartData}>
              <defs>
                <linearGradient id={`grad-${config.code}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={config.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={config.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} fill={`url(#grad-${config.code})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <WriteStatementModal 
        isOpen={isStatementModalOpen} 
        onClose={() => setStatementModalOpen(false)} 
        role={role} 
        userName={user?.name || 'Minister'} 
      />
    </div>
  );
};

export default MinistryDashboard;
