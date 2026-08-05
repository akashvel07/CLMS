import React from 'react';
import { Landmark, PieChart, AlertCircle } from 'lucide-react';
import { useBudgets } from '../../hooks/useSupabaseData';
import { DataStore, MINISTRY_CODE_TO_LABEL } from '../../lib/dataStore';

const GlobalBudgetPage: React.FC = () => {
  const { budgets } = useBudgets();
  
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  // Find the approved budget for the current month
  const activeBudget = budgets.find(b => b.status === 'approved' && b.month === currentMonth && b.year === currentYear);
  
  if (!activeBudget) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title">
            <div className="icon"><Landmark size={20} color="var(--ministry-finance)" /></div>
            <div>
              <h1>Global Budget Table</h1>
              <p>View the current allocated budget for all ministries.</p>
            </div>
          </div>
        </div>
        <div className="empty-state" style={{ marginTop: 'var(--space-8)' }}>
          <AlertCircle size={32} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h2>No Active Budget</h2>
          <p>There is currently no approved budget to display.</p>
        </div>
      </div>
    );
  }

  const allocations = activeBudget.allocations || [];
  const totalAllocated = allocations.reduce((acc, item) => acc + (item.status !== 'rejected' && !item.is_held ? item.amount : 0), 0);
  const totalUsed = allocations.reduce((acc, item) => acc + (item.status !== 'rejected' && !item.is_held ? (item.used_amount || 0) : 0), 0);
  const totalDebt = allocations.reduce((acc, item) => {
    if (item.status !== 'rejected' && !item.is_held && (item.used_amount || 0) > item.amount) {
      return acc + ((item.used_amount || 0) - item.amount);
    }
    return acc;
  }, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <div className="icon"><Landmark size={20} color="var(--ministry-finance)" /></div>
          <div>
            <h1>Global Budget Table</h1>
            <p>Transparency view for all ministries' budget allocations and usages.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Allocated</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>₹{totalAllocated.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Used</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>₹{totalUsed.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--status-rejected)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--status-rejected)' }}>Total Debt</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--status-rejected)' }}>₹{totalDebt.toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><PieChart size={18} /> Ministry Allocations</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Ministry</th>
                <th style={{ padding: '12px' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Allocated (₹)</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Used (₹)</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map(item => {
                const debt = Math.max(0, (item.used_amount || 0) - item.amount);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-secondary">{MINISTRY_CODE_TO_LABEL[item.ministry_code] || item.ministry_code}</span>
                    </td>
                    <td style={{ padding: '12px' }}>{item.title}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>{item.amount.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>{(item.used_amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {item.is_held ? (
                        <span className="badge badge-warning">On Hold</span>
                      ) : debt > 0 ? (
                        <span className="badge badge-danger">Debt: ₹{debt.toLocaleString()}</span>
                      ) : (
                        <span className="badge badge-passed">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GlobalBudgetPage;
