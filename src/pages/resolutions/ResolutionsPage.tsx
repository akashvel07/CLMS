import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, ChevronRight, Check, X, Pause, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import type { ResolutionStatus } from '../../types/database';
import { DataStore } from '../../lib/dataStore';
import { useResolutions, useResolutionVotes } from '../../hooks/useSupabaseData';

const WORKFLOW_STEPS = ['Draft', 'Voting', 'Passed', 'Awaiting President', 'Approved'];
const STATUS_STEP: Record<ResolutionStatus, number> = {
  draft: 0, submitted: 1, voting: 1, passed: 2, rejected: 2,
  suspended: 2, awaiting_president: 3, approved: 4, enacted: 4, archived: 4, deleted: -1,
};

const ResolutionsPage: React.FC = () => {
  const { role, user } = useAuth();
  const { resolutions, loading } = useResolutions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [laws, setLaws] = useState<any[]>([]);

  useEffect(() => {
    DataStore.getLaws().then(setLaws);
  }, []);

  const selected = resolutions.find(b => b.id === selectedId) || null;
  const { votes: resolutionVotes } = useResolutionVotes(selected?.id);

  const filtered = resolutions.filter(b => {
    const ms = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.resolution_number.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || b.status === statusFilter;
    return ms && mst;
  });

  const handleAction = async (status: ResolutionStatus) => {
    if (!selected || updating) return;
    setUpdating(true);
    await DataStore.updateResolutionStatus(selected.id, status);
    setUpdating(false);
  };

  const handleCloseVoting = async () => {
    if (!selected || updating) return;
    setUpdating(true);
    
    const votesForResolution = resolutionVotes.filter(v => v.resolution_id === selected.id);
    const approveCount = votesForResolution.filter(v => v.vote === 'approve').length;
    const rejectCount = votesForResolution.filter(v => v.vote === 'reject').length;
    const total = approveCount + rejectCount;
    
    // Tally rules: 60% positive of cast Approve/Reject votes
    const positivePercent = total > 0 ? approveCount / total : 0;
    const passed = positivePercent >= 0.6;
    
    await DataStore.updateResolutionStatus(selected.id, passed ? 'passed' : 'rejected');
    setUpdating(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="page-title">
            <div className="icon"><FileText size={20} color="var(--accent-primary)" /></div>
            <div>
              <h1>Resolutions</h1>
              <p>Manage and track legislative resolutions through the governance workflow</p>
            </div>
          </div>
          {role !== 'public' && role !== 'justice' && role !== 'chief_justice' && (
            <Link to="/resolutions/new" className="btn btn-primary">
              <Plus size={16} /> Create Resolution
            </Link>
          )}
        </div>
      </div>

      <div className={`layout-split ${selected ? 'active' : ''}`}>
        {/* Resolutions Table */}
        <div className="table-container">
          <div className="table-toolbar">
            <div className="table-search" style={{ flex: 1 }}>
              <Search size={15} color="var(--text-muted)" />
              <input placeholder="Search resolutions..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses ({resolutions.length})</option>
              {['draft','submitted','voting','passed','rejected','suspended','awaiting_president','approved','enacted'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-3)', color: 'var(--text-muted)' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              Loading resolutions from database...
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Resolution No.</th>
                      <th>Title</th>
                      <th>Ministry</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                          <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                          <div>No resolutions found. {role !== 'public' && role !== 'justice' && role !== 'chief_justice' && <Link to="/resolutions/new" style={{ color: 'var(--accent-primary)' }}>Create the first resolution →</Link>}</div>
                        </td>
                      </tr>
                    ) : filtered.map(resolution => (
                      <tr
                        key={resolution.id}
                        onClick={() => setSelectedId(selectedId === resolution.id ? null : resolution.id)}
                        style={{ cursor: 'pointer', background: selectedId === resolution.id ? 'var(--bg-glass)' : undefined }}
                      >
                        <td><span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--accent-primary)' }}>{resolution.resolution_number}</span></td>
                        <td className="text-strong" style={{ maxWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="truncate" style={{ display: 'block' }}>{resolution.title}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{resolution.ministry}</td>
                        <td><span className={`badge badge-${resolution.status}`}>{resolution.status.replace(/_/g, ' ')}</span></td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {resolution.created_at ? format(new Date(resolution.created_at), 'MMM dd') : 'Today'}
                        </td>
                        <td><ChevronRight size={14} color="var(--text-muted)" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                {filtered.length === 0 ? (
                  <div className="empty-state">
                    <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No resolutions found. {role !== 'public' && role !== 'justice' && role !== 'chief_justice' && <Link to="/resolutions/new" style={{ color: 'var(--accent-primary)' }}>Create the first resolution →</Link>}</div>
                  </div>
                ) : filtered.map(resolution => (
                  <div
                    key={resolution.id}
                    className="card"
                    onClick={() => setSelectedId(selectedId === resolution.id ? null : resolution.id)}
                    style={{ cursor: 'pointer', padding: 'var(--space-4)', border: selectedId === resolution.id ? '1px solid var(--accent-primary)' : undefined }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--accent-primary)' }}>{resolution.resolution_number}</span>
                      <span className={`badge badge-${resolution.status}`}>{resolution.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-2)' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{resolution.title}</h4>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{resolution.ministry}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {resolution.created_at ? format(new Date(resolution.created_at), 'MMM dd') : 'Today'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Resolution Detail Panel */}
        {selected && (
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 'calc(var(--header-height) + var(--space-8))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <span className={`badge badge-${selected.status}`}>{selected.status.replace(/_/g, ' ')}</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedId(null)}><X size={14} /></button>
            </div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>{selected.title}</h3>
            <p style={{ fontSize: '0.82rem', marginBottom: 'var(--space-5)' }}>{selected.description}</p>

            <div className="grid-2" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              {[
                { label: 'Resolution Number', value: selected.resolution_number },
                { label: 'Ministry', value: selected.ministry },
                { label: 'Created By', value: selected.created_by_name || '—' },
                { label: 'Created', value: selected.created_at ? format(new Date(selected.created_at), 'MMM dd, yyyy') : 'Today' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{f.value}</div>
                </div>
              ))}
            </div>

            {/* Stepper */}
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)' }}>Workflow Progress</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {WORKFLOW_STEPS.map((step, i) => {
                  const current = STATUS_STEP[selected.status] ?? 0;
                  const done = i < current;
                  const active = i === current;
                  const failed = (selected.status === 'rejected' || selected.status === 'suspended') && i === current;
                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 700,
                        background: done ? 'var(--accent-primary)' : failed ? 'hsl(0,72%,55%)' : active ? 'rgba(94,140,255,0.15)' : 'var(--bg-elevated)',
                        border: `2px solid ${done ? 'var(--accent-primary)' : failed ? 'hsl(0,72%,55%)' : active ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                        color: done ? 'white' : failed ? 'white' : active ? 'var(--accent-primary)' : 'var(--text-muted)',
                      }}>
                        {done ? <Check size={11} /> : failed ? <X size={11} /> : i + 1}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: done ? 'var(--text-secondary)' : active ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: active ? 600 : 400 }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {updating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 6 }}>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
                </div>
              )}

              {/* DRAFTER/CREATOR ACTIONS */}
              {user && (user.name === selected.created_by_name) && (
                <>
                  {selected.status === 'draft' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleAction('voting')} disabled={updating}>
                      <Send size={13} /> Send Draft to Parliament (Open Voting)
                    </button>
                  )}
                  {selected.status === 'voting' && (
                    <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', marginBottom: 4 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Drafter Parliament Action</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Current votes: <strong>{resolutionVotes.filter(v => v.vote === 'approve').length} Approve</strong>, <strong>{resolutionVotes.filter(v => v.vote === 'reject').length} Reject</strong>.
                        {resolutionVotes.length > 0 ? ` Ratio: ${Math.round((resolutionVotes.filter(v => v.vote === 'approve').length / (resolutionVotes.filter(v => v.vote === 'approve').length + resolutionVotes.filter(v => v.vote === 'reject').length || 1)) * 100)}% positive.` : ' No votes cast yet.'}
                      </div>
                      <button className="btn btn-warning btn-sm" style={{ width: '100%' }} onClick={handleCloseVoting} disabled={updating}>
                        Close Voting & Tally Results
                      </button>
                    </div>
                  )}
                  {selected.status === 'passed' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleAction('awaiting_president')} disabled={updating}>
                      <Send size={13} /> Submit for Presidential Approval
                    </button>
                  )}
                </>
              )}

              {/* PRESIDENT ACTIONS */}
              {role === 'president' && (
                <>
                  {/* President can reject or suspend draft or voting stage */}
                  {(selected.status === 'draft' || selected.status === 'voting') && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleAction('rejected')} disabled={updating}>
                        <X size={13} /> Reject Resolution
                      </button>
                      <button className="btn btn-warning btn-sm" style={{ flex: 1 }} onClick={() => handleAction('suspended')} disabled={updating}>
                        <Pause size={13} /> Suspend Resolution
                      </button>
                    </div>
                  )}

                  {/* President can approve, reject or hold when awaiting_president */}
                  {selected.status === 'awaiting_president' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleAction('approved')} disabled={updating}>
                        <Check size={13} /> Approve & Enact Law
                      </button>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleAction('rejected')} disabled={updating}>
                          <X size={13} /> Reject
                        </button>
                        <button className="btn btn-warning btn-sm" style={{ flex: 1 }} onClick={() => handleAction('suspended')} disabled={updating}>
                          <Pause size={13} /> Hold (Suspend)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* President can re-open voting if suspended or rejected */}
                  {(selected.status === 'suspended' || selected.status === 'rejected') && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAction('voting')} disabled={updating}>
                      Re-open Voting / Lift Hold
                    </button>
                  )}
                </>
              )}

              {/* Informative text for public observer or other ministries */}
              {!(user && user.name === selected.created_by_name) && role !== 'president' && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
                  {selected.status === 'draft' && "Waiting for drafter to submit to parliament."}
                  {selected.status === 'voting' && "Voting in progress. Cast your vote on the Parliament page!"}
                  {selected.status === 'passed' && "Voting passed. Waiting for drafter to submit for presidential approval."}
                  {selected.status === 'awaiting_president' && "Waiting for Presidential decision (Approve / Reject / Hold)."}
                  {selected.status === 'approved' && "Approved and enacted as a Law in the Constitution."}
                  {selected.status === 'rejected' && "This resolution has been rejected."}
                  {selected.status === 'suspended' && "This resolution has been suspended (placed on hold)."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResolutionsPage;
