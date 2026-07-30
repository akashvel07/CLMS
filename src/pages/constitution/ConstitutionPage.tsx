import React, { useState, useEffect } from 'react';
import { Search, Download, BookOpen, Eye, Clock, Trash2, RotateCcw, PauseCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useLaws } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { DataStore } from '../../lib/dataStore';

const ConstitutionPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [ministryFilter, setMinistryFilter] = useState('all');
  const { laws, loading } = useLaws();

  const filtered = laws.filter(l => {
    const matchSearch = !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.law_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchMin = ministryFilter === 'all' || l.ministry === ministryFilter;
    return matchSearch && matchStatus && matchMin;
  });

  const ministries = [...new Set(laws.map(l => l.ministry))];

  const handleStatusUpdate = async (lawId: string, newStatus: 'active' | 'suspended' | 'repealed') => {
    await DataStore.updateLawStatus(lawId, newStatus);
  };

  const exportCSV = () => {
    const headers = ['Law Number', 'Bill ID', 'Title', 'Ministry', 'Approved At', 'Approved By', 'Status'];
    const rows = filtered.map(l => [l.law_number, l.bill_id, l.title, l.ministry, l.approved_at, l.approved_by, l.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'constitution.csv'; a.click();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <div className="icon"><BookOpen size={20} color="var(--accent-gold)" /></div>
          <div>
            <h1>Constitution Table</h1>
            <p>All enacted laws and active constitutional framework</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, flexWrap: 'wrap' }}>
            <div className="table-search" style={{ flex: 1, minWidth: 240 }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                placeholder="Search laws, numbers, titles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="repealed">Repealed</option>
              </select>
              <select className="filter-select" value={ministryFilter} onChange={e => setMinistryFilter(e.target.value)}>
                <option value="all">All Ministries</option>
                {ministries.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
              <Download size={14} /> Export CSV
            </button>
            <div className="badge badge-passed" style={{ alignSelf: 'center' }}>
              {filtered.length} active laws
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Law Number</th>
                <th>Title</th>
                <th>Ministry</th>
                <th>Approved Date</th>
                <th>Approved By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                    Loading constitution table from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><BookOpen size={28} /></div>
                      <h3>No laws found</h3>
                      <p>Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(law => (
                  <tr key={law.id}>
                    <td><span className="law-number">{law.law_number}</span></td>
                    <td className="text-strong" style={{ maxWidth: 220 }}>
                      <span className="truncate" style={{ display: 'block' }}>{law.title}</span>
                    </td>
                    <td>
                      <MinistryTag name={law.ministry} />
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {law.approved_at ? format(new Date(law.approved_at), 'MMM dd, yyyy') : 'Recent'}
                    </td>
                    <td>
                      <span className="badge badge-passed" style={{ fontSize: '0.68rem' }}>✓ {law.approved_by}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${law.status === 'active' ? 'enacted' : law.status === 'suspended' ? 'suspended' : 'rejected'}`}>{law.status}</span>
                    </td>
                    <td>
                      {role !== 'public' && (
                        <div className="table-actions">
                          {law.status === 'active' && (
                            <button className="btn btn-ghost btn-icon" onClick={() => handleStatusUpdate(law.id, 'suspended')} title="Suspend Law" style={{ color: 'var(--status-suspended)' }}>
                              <PauseCircle size={14} />
                            </button>
                          )}
                          {law.status === 'suspended' && (
                            <button className="btn btn-ghost btn-icon" onClick={() => handleStatusUpdate(law.id, 'active')} title="Restore Law" style={{ color: 'var(--status-passed)' }}>
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <button className="btn btn-ghost btn-icon" onClick={() => handleStatusUpdate(law.id, 'repealed')} title="Repeal Law" style={{ color: 'var(--status-rejected)' }}>
                            <Trash2 size={14} />
                          </button>
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
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
              Loading constitution table from database...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><BookOpen size={28} /></div>
              <h3>No laws found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            filtered.map(law => (
              <div key={law.id} className="card" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <span className="law-number">{law.law_number}</span>
                  <span className={`badge badge-${law.status === 'active' ? 'enacted' : law.status === 'suspended' ? 'suspended' : 'rejected'}`}>{law.status}</span>
                </div>
                <h4 style={{ marginBottom: 'var(--space-2)' }}>{law.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <MinistryTag name={law.ministry} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {law.approved_at ? format(new Date(law.approved_at), 'MMM dd, yyyy') : 'Recent'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                  <span className="badge badge-passed" style={{ fontSize: '0.68rem' }}>✓ {law.approved_by}</span>
                  {role !== 'public' && (
                    <div className="table-actions" style={{ gap: 'var(--space-2)' }}>
                      {law.status === 'active' && (
                        <button className="btn btn-ghost btn-icon" onClick={() => handleStatusUpdate(law.id, 'suspended')} title="Suspend Law" style={{ color: 'var(--status-suspended)' }}>
                          <PauseCircle size={14} />
                        </button>
                      )}
                      {law.status === 'suspended' && (
                        <button className="btn btn-ghost btn-icon" onClick={() => handleStatusUpdate(law.id, 'active')} title="Restore Law" style={{ color: 'var(--status-passed)' }}>
                          <RotateCcw size={14} />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-icon" onClick={() => handleStatusUpdate(law.id, 'repealed')} title="Repeal Law" style={{ color: 'var(--status-rejected)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const MINISTRY_COLORS: Record<string, string> = {
  Health: 'var(--ministry-health)', Education: 'var(--ministry-education)',
  Finance: 'var(--ministry-finance)', IT: 'var(--ministry-it)',
  Career: 'var(--ministry-career)', 'Personal Dev': 'var(--ministry-personal)',
  Entertainment: 'var(--ministry-entertainment)', 'External Affairs': 'var(--ministry-external)',
};

const MinistryTag: React.FC<{ name: string }> = ({ name }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: '0.75rem', fontWeight: 600, color: MINISTRY_COLORS[name] ?? 'var(--text-secondary)',
  }}>
    <span style={{ width: 6, height: 6, borderRadius: 2, background: MINISTRY_COLORS[name] ?? 'var(--text-muted)', display: 'inline-block' }} />
    {name}
  </span>
);

export default ConstitutionPage;
