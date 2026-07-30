import React, { useState, useEffect } from 'react';
import { Landmark, Calendar as CalendarIcon, Plus, AlertTriangle, Send, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBudgets, useRequests } from '../../hooks/useSupabaseData';
import { DataStore } from '../../lib/dataStore';
import type { BudgetLineItem } from '../../types/database';
import type { RequestItem } from '../../lib/dataStore';

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
  const { budgets, refresh } = useBudgets();
  const { requests } = useRequests();
  
  // Date logic: 20th to 5th of next month
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  let targetMonth = currentMonth;
  let targetYear = currentYear;
  if (currentDay >= 20) {
    targetMonth = currentMonth + 1;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear++;
    }
  }

  const canSubmit = currentDay >= 20 || currentDay <= 5;
  
  const [allocations, setAllocations] = useState<BudgetLineItem[]>([]);
  const [newItemMinistry, setNewItemMinistry] = useState('health');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  const currentBudget = budgets.find(b => b.month === targetMonth && b.year === targetYear);

  useEffect(() => {
    if (currentBudget && currentBudget.allocations) {
      setAllocations(currentBudget.allocations);
    } else {
      setAllocations([]);
    }
  }, [currentBudget]);

  const totalAllocated = allocations.reduce((acc, item) => acc + (item.status !== 'rejected' ? item.amount : 0), 0);

  // Requests > 200 to Finance that haven't been added to the budget
  const pendingRequests = requests.filter(r => 
    r.to === 'Finance' && 
    r.amount > 200 && 
    r.president_status === 'pending' &&
    !allocations.some(a => a.source_request_id === r.id)
  );

  const handleAddManualItem = () => {
    if (!newItemTitle || !newItemAmount || Number(newItemAmount) <= 0) return;
    
    const newItem: BudgetLineItem = {
      id: crypto.randomUUID(),
      ministry_code: newItemMinistry,
      title: newItemTitle,
      amount: Number(newItemAmount),
      status: 'pending'
    };
    
    setAllocations(prev => [...prev, newItem]);
    setNewItemTitle('');
    setNewItemAmount('');
  };

  const handleAddRequestItem = (req: RequestItem) => {
    const minCode = MINISTRIES.find(m => m.name === req.from)?.id || 'finance';
    const newItem: BudgetLineItem = {
      id: crypto.randomUUID(),
      ministry_code: minCode,
      title: `Request: ${req.title}`,
      amount: req.amount,
      source_request_id: req.id,
      status: 'pending'
    };
    setAllocations(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setAllocations(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveDraft = async () => {
    await DataStore.saveBudget(targetMonth, targetYear, allocations, 'draft');
    refresh();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await DataStore.saveBudget(targetMonth, targetYear, allocations, 'pending_approval');
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

  const isLocked = currentBudget?.status === 'pending_approval' || currentBudget?.status === 'approved';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <div className="icon"><Landmark size={20} color="var(--ministry-finance)" /></div>
          <div>
            <h1>Monthly Budget Allocation</h1>
            <p>Draft detailed budget lines. Submissions open 20th - 5th.</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Current Cycle Status */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Cycle Target: Month {targetMonth}/{targetYear}</div>
              <CalendarIcon size={16} color="var(--text-muted)" />
            </div>
            
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Today's Date</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Day {currentDay}</div>
              {!canSubmit && (
                <div style={{ fontSize: '0.75rem', color: 'var(--status-suspended)', marginTop: 4 }}>
                  Submissions are currently closed. You can draft allocations, but must wait until the 20th to submit.
                </div>
              )}
              {canSubmit && (
                <div style={{ fontSize: '0.75rem', color: 'var(--status-passed)', marginTop: 4 }}>
                  Submissions are open until the 5th!
                </div>
              )}
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Current Cycle Status</div>
              <span className={`badge badge-${currentBudget ? (currentBudget.status === 'approved' ? 'passed' : currentBudget.status === 'rejected' ? 'rejected' : 'submitted') : 'draft'}`}>
                {currentBudget ? currentBudget.status.replace('_', ' ').toUpperCase() : 'NO SUBMISSION'}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={handleSaveDraft}
                disabled={isLocked}
              >
                Save Draft
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={handleSubmit}
                disabled={!canSubmit || isLocked || allocations.length === 0}
              >
                <Send size={14} /> Submit to President
              </button>
            </div>
          </div>

          {/* Pending Requests to Include */}
          {!isLocked && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Pending Large Requests (&gt; ₹200)</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {pendingRequests.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                    No pending requests &gt; ₹200
                  </div>
                ) : (
                  pendingRequests.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-default)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From {r.from} · ₹{r.amount}</div>
                      </div>
                      <button className="btn btn-success btn-sm" onClick={() => handleAddRequestItem(r)}>
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Allocation Details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Budget Line Items</div>
            <div className="badge badge-primary">Total: ₹{totalAllocated.toLocaleString()}</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            {allocations.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
                No line items added yet.
              </div>
            ) : (
              allocations.map(item => (
                <div key={item.id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '12px', background: 'var(--bg-default)', borderRadius: 6, border: '1px solid var(--border-subtle)',
                  opacity: item.status === 'rejected' ? 0.6 : 1
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge badge-secondary">{MINISTRIES.find(m => m.id === item.ministry_code)?.name}</span>
                      {item.source_request_id && <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>From Request</span>}
                      {item.status === 'rejected' && <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>Rejected</span>}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: item.status === 'rejected' ? 'var(--status-rejected)' : 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: item.status === 'rejected' ? 'var(--status-rejected)' : 'var(--text-primary)' }}>
                      ₹{item.amount.toLocaleString()}
                    </div>
                    {!isLocked && (
                      <button className="btn btn-danger btn-sm" style={{ padding: 6 }} onClick={() => handleRemoveItem(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Manual Item */}
          {!isLocked && (
            <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-4)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Add Manual Allocation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <select 
                  className="input" 
                  value={newItemMinistry} 
                  onChange={(e) => setNewItemMinistry(e.target.value)}
                >
                  {MINISTRIES.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Details / Title (e.g. Server Maintenance)"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-default)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '2px 8px', flex: 1 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: 4 }}>₹</span>
                    <input
                      type="number"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                      placeholder="Amount"
                      value={newItemAmount}
                      onChange={(e) => setNewItemAmount(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleAddManualItem}>
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceBudgetPage;
