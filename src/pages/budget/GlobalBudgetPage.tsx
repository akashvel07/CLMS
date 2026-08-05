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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: '0 var(--space-2) var(--space-4) var(--space-2)' }}>
          {allocations.map(item => {
            const debt = Math.max(0, (item.used_amount || 0) - item.amount);
            return (
              <div key={item.id} style={{ 
                background: 'var(--bg-default)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-lg)', 
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span className="badge badge-secondary" style={{ marginBottom: '8px', display: 'inline-block' }}>
                      {MINISTRY_CODE_TO_LABEL[item.ministry_code] || item.ministry_code}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{item.title}</h3>
                  </div>
                  <div>
                    {item.is_held ? (
                      <span className="badge badge-warning">On Hold</span>
                    ) : debt > 0 ? (
                      <span className="badge badge-danger">Debt: ₹{debt.toLocaleString()}</span>
                    ) : (
                      <span className="badge badge-passed">Active</span>
                    )}
                  </div>
                </div>
                
                <div className="grid-2" style={{ gap: '16px', marginTop: '4px' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allocated Budget</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>₹{item.amount.toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Used Amount</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>₹{(item.used_amount || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GlobalBudgetPage;
