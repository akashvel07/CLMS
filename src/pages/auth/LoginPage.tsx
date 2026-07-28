import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Eye, EyeOff, AlertCircle, Zap, UserPlus, LogIn, Database } from 'lucide-react';
import type { Role } from '../../types/database';

const MINISTRIES_LIST = [
  { code: 'health', name: 'Health Ministry' },
  { code: 'education', name: 'Education Ministry' },
  { code: 'finance', name: 'Finance Ministry' },
  { code: 'it', name: 'Information Technology' },
  { code: 'career', name: 'Career Development' },
  { code: 'entertainment', name: 'Entertainment Ministry' },
  { code: 'personal_dev', name: 'Personal Development' },
  { code: 'external_affairs', name: 'External Affairs' },
];

const LoginPage: React.FC = () => {
  const { signIn, signUp, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('public');
  const [ministryCode, setMinistryCode] = useState('health');

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signin') {
      const { error: err } = await signIn(email, password);
      setLoading(false);
      if (err) {
        setError(err);
        return;
      }
      navigate('/dashboard');
    } else {
      const { error: err } = await signUp(
        email,
        password,
        name,
        role,
        role === 'ministry' ? ministryCode : undefined
      );
      setLoading(false);
      if (err) {
        setError(err);
        return;
      }
      setSuccess('Account registered successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  };

  const demoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
      background: 'var(--bg-base)',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsla(220,90%,60%,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            boxShadow: '0 0 40px var(--accent-primary-glow)',
          }}>
            <BookOpen size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Welcome to CLMS</h1>
          <p style={{ fontSize: '0.875rem' }}>Constitutional Legislative Management System</p>
        </div>

        {/* Mode Selector Tabs */}
        {!isDemoMode && (
          <div style={{
            display: 'flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 4,
            marginBottom: 'var(--space-4)',
          }}>
            <button
              type="button"
              className={`btn ${mode === 'signin' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
              onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
            >
              <LogIn size={14} /> Sign In
            </button>
            <button
              type="button"
              className={`btn ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            >
              <UserPlus size={14} /> Create Account
            </button>
          </div>
        )}

        {/* Card */}
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
              {mode === 'signin' ? 'Sign In' : 'Create Supabase Account'}
            </h2>
            {!isDemoMode ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'hsla(220,90%,60%,0.12)',
                border: '1px solid hsla(220,90%,60%,0.3)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: '0.68rem', fontWeight: 700, color: 'hsl(220,90%,65%)',
              }}>
                <Database size={11} /> Live Supabase
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'hsla(152,70%,45%,0.12)',
                border: '1px solid hsla(152,70%,45%,0.3)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: '0.68rem', fontWeight: 700, color: 'hsl(152,70%,55%)',
              }}>
                <Zap size={11} /> Demo Mode
              </div>
            )}
          </div>

          {error && (
            <div style={{
              background: 'hsla(0,72%,55%,0.1)',
              border: '1px solid hsla(0,72%,55%,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              color: 'hsl(0,72%,65%)', fontSize: '0.85rem',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: 'hsla(152,70%,45%,0.1)',
              border: '1px solid hsla(152,70%,45%,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)',
              color: 'hsl(152,70%,55%)', fontSize: '0.85rem',
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Dr. Sarah Chen"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', cursor: 'pointer',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div className="form-group">
                  <label className="form-label">System Role</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={e => setRole(e.target.value as Role)}
                  >
                    <option value="public">Public Citizen</option>
                    <option value="ministry">Ministry Official</option>
                    <option value="president">President</option>
                  </select>
                </div>

                {role === 'ministry' && (
                  <div className="form-group">
                    <label className="form-label">Select Ministry</label>
                    <select
                      className="form-select"
                      value={ministryCode}
                      onChange={e => setMinistryCode(e.target.value)}
                    >
                      {MINISTRIES_LIST.map(m => (
                        <option key={m.code} value={m.code}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: 'var(--space-2)' }}
            >
              {loading ? (
                <span className="spinner" style={{ width: 16, height: 16 }} />
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account in Supabase'
              )}
            </button>
          </form>

          {/* Quick Preset Accounts info */}
          <div style={{ marginTop: 'var(--space-5)' }}>
            <div className="divider" />
            <p style={{ fontSize: '0.72rem', textAlign: 'center', marginBottom: 'var(--space-3)', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Quick Preset Credentials
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              {[
                { label: '👑 President', email: 'president@clms.gov', desc: 'Full access' },
                { label: '🏥 Health Min.', email: 'health@clms.gov', desc: 'Can veto bills' },
                { label: '💰 Finance Min.', email: 'finance@clms.gov', desc: 'Can veto bills' },
                { label: '🎓 Education Min.', email: 'education@clms.gov', desc: 'Can veto bills' },
                { label: '💻 IT Min.', email: 'it@clms.gov', desc: 'Ministry access' },
                { label: '🌐 Public', email: 'public@clms.gov', desc: 'Read only' },
              ].map(d => (
                <button
                  key={d.email}
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setMode('signin');
                    demoLogin(d.email);
                  }}
                  style={{ fontSize: '0.72rem', flexDirection: 'column', alignItems: 'flex-start', gap: 1, padding: '8px 10px', height: 'auto' }}
                >
                  <span>{d.label}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 400 }}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Constitutional Legislative Management System © 2024
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
