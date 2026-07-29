import React, { useState, useEffect } from 'react';
import { Landmark, Calendar as CalendarIcon, Check, Plus, AlertTriangle, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBudgets } from '../../hooks/useSupabaseData';
import { DataStore } from '../../lib/dataStore';

const MINISTRIES = [
  { id: 'health', name: 'Health' },
  { id: 'education', name: 'Education' },
  { id: 'finance', name: 'Finance' },
  { id: 'career', name: 'Career Development' },
  { id: 'it', name: 'Information Technology' },
  { id: 'personal_dev', name: 'Personal Development' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'external_affairs', name: 'External Affairs' }
];

const FinanceBudgetPage: React.FC = () => {
  const { role, user } = useAuth();
  const { budgets, loading, refresh } = useBudgets();
  
  // Date logic
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const canSubmit = currentDay >= 19 && currentDay <= 24;
  
  const [allocations, setAllocations] = useState<Record<string, number>>(
    MINISTRIES.reduce((acc, m) => ({ ...acc, [m.id]: 1000000 }), {})
  );

  const currentBudget = budgets.find(b => b.month === currentMonth && b.year === currentYear);

  useEffect(() => {
    if (currentBudget && currentBudget.allocations) {
      setAllocations(currentBudget.allocations);
    }
  }, [currentBudget]);

  const totalAllocated = Object.values(allocations).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleAmountChange = (code: string, val: string) => {
    setAllocations(prev => ({ ...prev, [code]: Number(val) }));
  };

  const handleSaveDraft = async () => {
    await DataStore.saveBudget(currentMonth, currentYear, allocations, 'draft');
    refresh();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await DataStore.saveBudget(currentMonth, currentYear, allocations, 'pending_approval');
    refresh();
  };

  if (role !== 'ministry' || user?.ministry_id !== 'finance') {
    return (
      <div className="page-container">
        <div className="empty-state" style={{ marginTop: 'var(--space-12)' }}>
          <AlertTriangle size={32} color="var(--status-suspended)" style={{ marginBottom: 16 }} />
          <h2>Unauthorized Access</h2>
          <p>This page is restricted to the Finance Ministry only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <div className="icon"><Landmark size={20} color="var(--ministry-finance)" /></div>
          <div>
            <h1>Monthly Budget Allocation</h1>
            <p>Draft and submit national ministry budgets. Submission open between the 19th and 24th.</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Current Cycle Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Cycle Overview: {today.toLocaleString('default', { month: 'long' })} {currentYear}</div>
            <CalendarIcon size={16} color="var(--text-muted)" />
          </div>
          
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Today's Date</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Day {currentDay}</div>
            {!canSubmit && (
              <div style={{ fontSize: '0.75rem', color: 'var(--status-suspended)', marginTop: 4 }}>
                Submissions are currently closed. You can draft allocations, but must wait until the 19th to submit.
              </div>
            )}
            {canSubmit && (
              <div style={{ fontSize: '0.75rem', color: 'var(--status-passed)', marginTop: 4 }}>
                Submissions are open! Deadline is the 24th.
              </div>
            )}
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Current Cycle Status</div>
            <span className={`badge badge-${currentBudget ? (currentBudget.status === 'approved' ? 'passed' : currentBudget.status === 'rejected' ? 'rejected' : 'submitted') : 'draft'}`}>
              {currentBudget ? currentBudget.status.replace('_', ' ').toUpperCase() : 'NO SUBMISSION'}
            </span>
          </div>
        </div>

        {/* Allocation Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Set Allocations</div>
            <div className="badge badge-primary">Total: ₹{totalAllocated.toLocaleString()}</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            {MINISTRIES.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, width: 140 }}>{m.name}</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-default)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '2px 8px', flex: 1 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: 4 }}>₹</span>
                  <input
                    type="number"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                    value={allocations[m.id] ?? ''}
                    onChange={(e) => handleAmountChange(m.id, e.target.value)}
                    disabled={currentBudget?.status === 'pending_approval' || currentBudget?.status === 'approved'}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1 }} 
              onClick={handleSaveDraft}
              disabled={currentBudget?.status === 'pending_approval' || currentBudget?.status === 'approved'}
            >
              Save Draft
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }} 
              onClick={handleSubmit}
              disabled={!canSubmit || currentBudget?.status === 'pending_approval' || currentBudget?.status === 'approved'}
            >
              <Send size={14} /> Submit to President
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceBudgetPage;
