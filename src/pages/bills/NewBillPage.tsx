import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DataStore } from '../../lib/dataStore';
import type { LawItem } from '../../lib/dataStore';

const MINISTRY_OPTIONS = [
  { code: 'health', label: 'Health' },
  { code: 'education', label: 'Education' },
  { code: 'finance', label: 'Finance' },
  { code: 'it', label: 'Information Technology' },
  { code: 'career', label: 'Career Development' },
  { code: 'personal_dev', label: 'Personal Development' },
  { code: 'entertainment', label: 'Entertainment' },
  { code: 'external_affairs', label: 'External Affairs' },
  { code: 'transport_road', label: 'Road & Transport' },
];

const NewBillPage: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'public' || role === 'justice' || role === 'chief_justice') {
      navigate('/bills');
    }
  }, [role, navigate]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    ministry_code: user.ministry_id || 'health',
    type: 'new' as 'new' | 'repeal' | 'suspend',
    target_law_id: '',
  });

  useEffect(() => {
    if (user.ministry_id) {
      setForm(f => ({ ...f, ministry_code: user.ministry_id! }));
    }
  }, [user.ministry_id]);

  const [laws, setLaws] = useState<LawItem[]>([]);
  useEffect(() => {
    DataStore.getLaws().then(data => setLaws(data.filter(l => l.status === 'active')));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if ((form.type === 'repeal' || form.type === 'suspend') && !form.target_law_id) {
      setError('Please select a target law.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newBill = await DataStore.addBill({
        title: form.title,
        description: form.description,
        ministry_code: form.ministry_code,
        created_by_name: user.name,
        type: form.type,
        target_law_id: form.target_law_id || undefined,
      });

      if (newBill) {
        navigate('/bills');
      } else {
        setError('Failed to create bill. Please check database connection.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <button 
          onClick={() => navigate('/bills')} 
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-4)', width: 'fit-content' }}
        >
          <ArrowLeft size={14} /> Back to Bills
        </button>
        <div className="page-title">
          <div className="icon"><FileText size={20} color="var(--accent-primary)" /></div>
          <div>
            <h1>Create Legislative Bill</h1>
            <p>Draft a new bill to be submitted to Parliament for review and voting</p>
          </div>
        </div>
      </div>

      <div className="card">
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            color: 'var(--status-rejected)',
            marginBottom: 'var(--space-5)',
            fontSize: '0.88rem'
          }}>
            ?? {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Bill Type <span className="required">*</span></label>
              <select 
                className="form-select" 
                value={form.type} 
                onChange={e => setForm({ ...form, type: e.target.value as any, target_law_id: '' })}
                disabled={loading}
              >
                <option value="new">Create New Law</option>
                <option value="repeal">Repeal Existing Law</option>
                <option value="suspend">Suspend Existing Law</option>
              </select>
            </div>

            {(form.type === 'repeal' || form.type === 'suspend') && (
              <div className="form-group">
                <label className="form-label">Target Law <span className="required">*</span></label>
                <select 
                  className="form-select" 
                  value={form.target_law_id} 
                  onChange={e => setForm({ ...form, target_law_id: e.target.value })}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select Law to {form.type === 'repeal' ? 'Repeal' : 'Suspend'} --</option>
                  {laws.map(law => (
                    <option key={law.id} value={law.id}>{law.law_number} - {law.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Bill Title <span className="required">*</span></label>
            <input 
              className="form-input" 
              placeholder={form.type === 'new' ? "e.g. Universal Healthcare Access Act" : `e.g. ${form.type === 'repeal' ? 'Repeal' : 'Suspend'} of Law X`}
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
              disabled={loading}
              required 
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Associated Ministry <span className="required">*</span></label>
              <select 
                className="form-select" 
                value={form.ministry_code} 
                onChange={e => setForm({ ...form, ministry_code: e.target.value })}
                disabled={loading || !!user.ministry_id}
              >
                {MINISTRY_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Drafter Name</label>
              <input 
                className="form-input" 
                value={user.name} 
                disabled 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bill Description & Provisions <span className="required">*</span></label>
            <textarea 
              className="form-textarea" 
              placeholder="Provide a detailed description of the bill's provisions, regulatory framework, and social impact..." 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              disabled={loading}
              style={{ minHeight: '150px' }}
              required 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/bills')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              {loading ? 'Submitting...' : 'Submit Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBillPage;
