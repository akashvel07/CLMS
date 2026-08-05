import React, { useState, useEffect } from 'react';
import { Landmark, Calendar as CalendarIcon, Plus, AlertTriangle, Send, Trash2, CheckCircle, PauseCircle, RotateCcw, RefreshCw } from 'lucide-react';
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
  { id: 'external_affairs', name: 'External Affairs' },
  { id: 'transport_road', name: 'Road Safety & Transport' }
];

const getMinistryCodeFromName = (name: string): string => {
  if (!name) return 'finance';
  const n = name.toLowerCase();
  if (n.includes('health')) return 'health';
  if (n.includes('education')) return 'education';
  if (n.includes('career')) return 'career';
  if (n === 'it' || n.includes('information')) return 'it';
  if (n.includes('personal')) return 'personal_dev';
  if (n.includes('entertainment')) return 'entertainment';
  if (n.includes('external')) return 'external_affairs';
  if (n.includes('road') || n.includes('transport')) return 'transport_road';
  return 'finance';
};

const FinanceBudgetPage: React.FC = () => {
  const { role, user } = useAuth();
  const { budgets, refresh: refreshBudgets } = useBudgets();
  
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  const [targetMonth, setTargetMonth] = useState(currentMonth);
  const [targetYear, setTargetYear] = useState(currentYear);

  const [allocations, setAllocations] = useState<BudgetLineItem[]>([]);

  const currentBudget = budgets.find(b => b.month === targetMonth && b.year === targetYear);

  useEffect(() => {
    if (currentBudget && currentBudget.allocations) {
      setAllocations(currentBudget.allocations);
    } else {
      setAllocations([]);
    }
  }, [currentBudget]);


  const handleAddCustomItem = () => {
    const newItem: BudgetLineItem = {
      id: crypto.randomUUID(),
      ministry_code: 'finance',
      title: 'Custom Allocation',
      amount: 0,
      used_amount: 0,
      is_held: false,
      status: 'pending'
    };
    setAllocations(prev => [newItem, ...prev]);
  };

  const totalAllocated = allocations.reduce((acc, item) => acc + (item.status !== 'rejected' && !item.is_held ? item.amount : 0), 0);
  const totalUsed = allocations.reduce((acc, item) => acc + (item.status !== 'rejected' && !item.is_held ? (item.used_amount || 0) : 0), 0);
  const totalDebt = allocations.reduce((acc, item) => {
    if (item.status !== 'rejected' && !item.is_held && (item.used_amount || 0) > item.amount) {
      return acc + ((item.used_amount || 0) - item.amount);
    }
    return acc;
  }, 0);

  const handleRemoveItem = async (id: string) => {
    setAllocations(prev => prev.filter(item => item.id !== id));
  };


  const handleUpdateItem = (id: string, field: keyof BudgetLineItem, value: any) => {
    setAllocations(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSaveBudget = async () => {
    await DataStore.saveBudget(targetMonth, targetYear, allocations, 'approved');
    refreshBudgets();
  };

  const handleClearBudget = async () => {
    if (confirm(`Are you sure you want to clear the entire budget for Month ${targetMonth}, ${targetYear}? This cannot be undone.`)) {
      await DataStore.deleteBudget(targetMonth, targetYear);
      setAllocations([]);
      refreshBudgets();
    }
  };

  const handleSyncDatabase = () => {
    refreshBudgets();
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

  const isLockedForRemoval = currentBudget?.status === 'pending_approval' || currentBudget?.status === 'approved';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <div className="icon"><Landmark size={20} color="var(--ministry-finance)" /></div>
          <div>
            <h1>Budget Allocation Dashboard</h1>
            <p>Manage budget allocations, usages, and holds across all ministries.</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Current Cycle Status */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                Budget Period: 
                <select value={targetMonth} onChange={e => setTargetMonth(Number(e.target.value))} className="form-select" style={{ marginLeft: 8, padding: '2px 8px', width: 'auto', minWidth: '100px', display: 'inline-block' }}>
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Month {m}</option>
                  ))}
                </select>
                <select value={targetYear} onChange={e => setTargetYear(Number(e.target.value))} className="form-select" style={{ marginLeft: 4, padding: '2px 8px', width: 'auto', minWidth: '80px', display: 'inline-block' }}>
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <CalendarIcon size={16} color="var(--text-muted)" />
            </div>
            
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
              <span className={`badge badge-${currentBudget ? (currentBudget.status === 'approved' ? 'passed' : currentBudget.status === 'rejected' ? 'rejected' : 'submitted') : 'draft'}`}>
                {currentBudget ? currentBudget.status.replace('_', ' ').toUpperCase() : 'DRAFT'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg-default)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Allocated</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>₹{totalAllocated.toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--bg-default)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Used</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>₹{totalUsed.toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--bg-default)', padding: '12px', borderRadius: '8px', border: '1px solid var(--status-rejected)', color: 'var(--status-rejected)' }}>
                <div style={{ fontSize: '0.75rem', color: 'inherit' }}>Total Debt</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>₹{totalDebt.toLocaleString()}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleSyncDatabase}
                title="Force refresh database state"
              >
                <RefreshCw size={14} /> Sync DB
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleClearBudget}
                disabled={allocations.length === 0 && !currentBudget}
                title="Clear current budget completely"
              >
                <Trash2 size={14} /> Clear Budget
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={handleSaveBudget}
                disabled={allocations.length === 0}
              >
                <Send size={14} /> Save Budget Changes
              </button>
            </div>
          </div>
        </div>

        {/* Allocation Details */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Budget Line Items</div>
            <button className="btn btn-secondary btn-sm" onClick={handleAddCustomItem}>
              <Plus size={14} /> Add Manual Entry
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {allocations.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
                No line items added yet. Approved requests will appear here automatically.
              </div>
            ) : (
              allocations.map(item => {
                const debt = Math.max(0, (item.used_amount || 0) - item.amount);
                
                return (
                  <div key={item.id} className="budget-item-card" style={{ 
                    padding: '20px', 
                    background: 'var(--bg-default)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px',
                    transition: 'all 0.2s ease',
                    opacity: item.status === 'rejected' ? 0.6 : 1
                  }}>
                    {/* Header row: Ministry & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                          <select 
                            value={item.ministry_code} 
                            onChange={(e) => handleUpdateItem(item.id, 'ministry_code', e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                          >
                            {MINISTRIES.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                          </select>
                        </div>
                        {item.is_held && <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>ON HOLD</span>}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleUpdateItem(item.id, 'is_held', !item.is_held)} 
                          style={{ 
                            background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '6px', 
                            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', 
                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                            color: item.is_held ? 'var(--text-primary)' : 'var(--status-suspended)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <PauseCircle size={14} /> {item.is_held ? 'Release' : 'Hold'}
                        </button>
                        <button 
                          onClick={() => handleRemoveItem(item.id)} 
                          title="Delete allocation"
                          style={{ 
                            background: 'var(--status-rejected)', border: 'none', borderRadius: '6px', 
                            padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            cursor: 'pointer', color: 'white', transition: 'all 0.2s ease'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Title Row */}
                    <div>
                      <input 
                        type="text" 
                        value={item.title} 
                        onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)} 
                        placeholder="Enter Allocation Title..."
                        style={{ 
                          width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)',
                          fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', padding: '4px 0 8px 0', outline: 'none',
                          transition: 'border-color 0.2s ease'
                        }}
                      />
                    </div>

                    {/* Amounts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '4px' }}>
                      <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-passed)' }}></div>
                          Allocated Budget (₹)
                        </label>
                        <input 
                          type="number" 
                          value={item.amount || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'amount', Number(e.target.value))}
                          style={{ 
                            width: '100%', background: 'transparent', border: 'none', fontSize: '1.5rem', 
                            fontWeight: 700, color: 'var(--text-primary)', outline: 'none' 
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-suspended)' }}></div>
                          Used Amount (₹)
                        </label>
                        <input 
                          type="number" 
                          value={item.used_amount || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'used_amount', Number(e.target.value))}
                          style={{ 
                            width: '100%', background: 'transparent', border: 'none', fontSize: '1.5rem', 
                            fontWeight: 700, color: 'var(--text-primary)', outline: 'none' 
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {debt > 0 && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--status-rejected)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', background: 'rgba(255, 71, 87, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                        <AlertTriangle size={14} /> <strong>Debt Warning:</strong> ₹{debt.toLocaleString()} over allocated budget
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceBudgetPage;
