import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Check, X, RotateCcw, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { useRequests } from '../../hooks/useSupabaseData';
import { DataStore } from '../../lib/dataStore';

const MINISTRY_NAME_MAP: Record<string, string> = {
  health: 'Health',
  education: 'Education',
  finance: 'Finance',
  it: 'IT',
  career: 'Career',
  entertainment: 'Entertainment',
  personal_dev: 'Personal Dev',
  external_affairs: 'External Affairs',
};

const RequestsPage: React.FC = () => {
  const { role, user } = useAuth();

  const userMinistryName = user?.ministry_id ? (MINISTRY_NAME_MAP[user.ministry_id] || user.ministry_id) : null;
  const isMinistryUser = role === 'ministry' && !!userMinistryName;

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'my' | 'sent' | 'received'>('my');
  const { requests, loading } = useRequests();
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    from: userMinistryName || 'Health',
    to: 'Finance',
    amount: '',
  });

  // Update default form origin when profile switches
  useEffect(() => {
    if (userMinistryName) {
      setForm(prev => ({ ...prev, from: userMinistryName }));
    }
  }, [userMinistryName]);

  // Filter requests based on user's ministry & active scope filter
  const filtered = requests.filter(r => {
    // Text search
    const matchesSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.from.toLowerCase().includes(search.toLowerCase()) ||
      r.to.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Strict scoping for ministry users — MUST belong to active ministry
    if (isMinistryUser) {
      const belongsToMinistry = r.from === userMinistryName || r.to === userMinistryName;
      if (!belongsToMinistry) return false;

      if (scopeFilter === 'sent') {
        return r.from === userMinistryName;
      }
      if (scopeFilter === 'received') {
        return r.to === userMinistryName;
      }
      // 'my' -> both sent or received by this ministry
      return true;
    }

    return true;
  });

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || actionLoading) return;
    setActionLoading(true);
    await DataStore.addRequest({
      title: form.title,
      description: form.description,
      from: form.from,
      to: form.to,
      amount: Number(form.amount) || 0,
      priority: form.priority,
    });
    setForm({
      title: '',
      description: '',
      priority: 'medium',
      from: userMinistryName || 'Health',
      to: 'Finance',
      amount: '',
    });
    setShowForm(false);
    setActionLoading(false);
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected' | 'returned') => {
    if (actionLoading) return;
    setActionLoading(true);
    await DataStore.updateRequestStatus(id, status);
    setActionLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="page-title">
            <div className="icon"><MessageSquare size={20} color="var(--accent-secondary)" /></div>
            <div>
              <h1>Ministry Requests</h1>
              <p>
                {isMinistryUser
                  ? `Inter-ministry resource & service requests for ${userMinistryName} Ministry`
                  : 'All inter-ministry resource and service requests'}
              </p>
            </div>
          </div>
          {role !== 'public' && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              <Plus size={16} /> New Request
            </button>
          )}
        </div>
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="card-header">
            <div className="card-title">Create Inter-Ministry Request</div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
          </div>
          <form onSubmit={submitRequest}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Request Title <span className="required">*</span></label>
                <input className="form-input" placeholder="Enter request title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Origin Ministry</label>
                <select
                  className="form-select"
                  value={form.from}
                  onChange={e => setForm({ ...form, from: e.target.value })}
                  disabled={isMinistryUser}
                >
                  {['Health', 'Education', 'Finance', 'IT', 'Career', 'Entertainment', 'Personal Dev', 'External Affairs'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Ministry <span className="required">*</span></label>
                <select className="form-select" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })}>
                  {['Health', 'Education', 'Finance', 'IT', 'Career', 'Entertainment', 'Personal Dev', 'External Affairs'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority <span className="required">*</span></label>
                <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" placeholder="0 if no budget needed" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} disabled={form.to !== 'Finance'} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description <span className="required">*</span></label>
              <textarea className="form-textarea" placeholder="Describe the request in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Request</button>
            </div>
          </form>
        </div>
      )}

      {/* Requests Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="table-search" style={{ flex: 1, minWidth: 240 }}>
              <Search size={15} color="var(--text-muted)" />
              <input placeholder="Search requests by title, ID, or ministry..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Scope filter controls — strictly scoped to active ministry */}
            {isMinistryUser ? (
              <div className="filter-group">
                <button
                  type="button"
                  className={`btn btn-sm ${scopeFilter === 'my' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setScopeFilter('my')}
                >
                  {userMinistryName} Requests
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${scopeFilter === 'sent' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setScopeFilter('sent')}
                >
                  Sent
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${scopeFilter === 'received' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setScopeFilter('received')}
                >
                  Received
                </button>
              </div>
            ) : (
              <div className="badge badge-submitted">{filtered.length} requests</div>
            )}
          </div>

          <div className="badge badge-submitted" style={{ alignSelf: 'center' }}>
            {filtered.length} requests
          </div>
        </div>

        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Title</th>
                <th>From</th>
                <th>To</th>
                <th>Priority</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                    Loading requests from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                      <MessageSquare size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                      <h3>No requests found</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {isMinistryUser
                          ? `No requests found for ${userMinistryName} Ministry in this view.`
                          : 'No requests match your current filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id}>
                    <td><span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{r.id}</span></td>
                    <td className="text-strong" style={{ maxWidth: 180 }}>
                      <span className="truncate" style={{ display: 'block' }}>{r.title}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: r.from === userMinistryName ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: r.from === userMinistryName ? 700 : 400 }}>
                      {r.from}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: r.to === userMinistryName ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: r.to === userMinistryName ? 700 : 400 }}>
                      {r.to}
                    </td>
                    <td><span className={`badge badge-${r.priority}`}>{r.priority}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{r.amount > 0 ? `₹${r.amount.toLocaleString()}` : '—'}</td>
                    <td><span className={`badge badge-${r.status === 'approved' ? 'passed' : r.status === 'rejected' ? 'rejected' : r.status === 'returned' ? 'suspended' : 'submitted'}`}>{r.status}</span></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {r.created_at ? format(new Date(r.created_at), 'MMM dd') : 'Recent'}
                    </td>
                    <td>
                      {role !== 'public' && (
                        <div className="table-actions">
                          <button className="btn btn-ghost btn-icon btn-sm" title="Approve" onClick={() => handleStatusChange(r.id, 'approved')} style={{ color: 'var(--status-passed)' }} disabled={actionLoading}><Check size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Reject" onClick={() => handleStatusChange(r.id, 'rejected')} style={{ color: 'var(--status-rejected)' }} disabled={actionLoading}><X size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Return" onClick={() => handleStatusChange(r.id, 'returned')} style={{ color: 'var(--status-suspended)' }} disabled={actionLoading}><RotateCcw size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <MessageSquare size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
              <h3>No requests found</h3>
            </div>
          ) : (
            filtered.map(r => (
              <div key={r.id} className="card" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{r.id}</span>
                  <span className={`badge badge-${r.status === 'approved' ? 'passed' : r.status === 'rejected' ? 'rejected' : r.status === 'returned' ? 'suspended' : 'submitted'}`}>{r.status}</span>
                </div>
                <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.95rem' }}>{r.title}</h4>
                
                <div className="grid-2" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>From</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{r.from}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>To</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{r.to}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Priority & Amount</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge badge-${r.priority}`} style={{ fontSize: '0.6rem' }}>{r.priority}</span>
                      {r.amount > 0 && <span>₹{r.amount.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{r.created_at ? format(new Date(r.created_at), 'MMM dd') : 'Recent'}</div>
                  </div>
                </div>

                {role !== 'public' && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(r.id, 'approved')} style={{ flex: 1, color: 'var(--status-passed)' }} disabled={actionLoading}><Check size={14} /> Approve</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(r.id, 'rejected')} style={{ flex: 1, color: 'var(--status-rejected)' }} disabled={actionLoading}><X size={14} /> Reject</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(r.id, 'returned')} style={{ flex: 1, color: 'var(--status-suspended)' }} disabled={actionLoading}><RotateCcw size={14} /> Return</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsPage;
