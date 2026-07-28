import React from 'react';
import { Settings, User, Bell, Shield, Database, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <div className="icon"><Settings size={20} color="var(--text-muted)" /></div>
          <div>
            <h1>Settings</h1>
            <p>Manage your account and application preferences</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Profile */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} /> Profile</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" defaultValue={user?.name ?? ''} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" defaultValue={user?.email ?? ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span className={`badge badge-${role === 'president' ? 'enacted' : role === 'ministry' ? 'passed' : 'submitted'}`}>
                  {role}
                </span>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>Save Changes</button>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={16} /> Notifications</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              { label: 'Bill status changes', on: true },
              { label: 'New parliament votes', on: true },
              { label: 'Request updates', on: true },
              { label: 'Presidential notices', on: role === 'president' },
              { label: 'Ministry alerts', on: false },
            ].map(n => (
              <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{n.label}</span>
                <div
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: n.on ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    border: n.on ? 'none' : '1px solid var(--border-default)',
                    cursor: 'pointer', position: 'relative', transition: 'background 200ms ease',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 8, background: 'white',
                    position: 'absolute', top: 3, left: n.on ? 21 : 3, transition: 'left 200ms ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} /> Security</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" placeholder="Enter current password" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="Enter new password" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" placeholder="Confirm new password" />
            </div>
            <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>Update Password</button>
          </div>
        </div>

        {/* System Info */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Database size={16} /> System</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              { label: 'App Version', value: 'CLMS v1.0.0' },
              { label: 'Backend', value: 'Supabase (PostgreSQL)' },
              { label: 'Auth', value: 'Supabase Auth' },
              { label: 'User ID', value: user?.id ? (user.id.slice(0, 16) + '...') : '—' },
              { label: 'Ministry', value: user?.ministry_id ?? 'N/A' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{f.label}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
