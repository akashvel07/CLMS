import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, ChevronDown, Check, User, Shield, Building2, Crown, Globe, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const BREADCRUMB_MAP: Record<string, string[]> = {
  '/dashboard': ['Home', 'Dashboard'],
  '/constitution': ['Home', 'Constitution'],
  '/bills': ['Home', 'Bills'],
  '/bills/new': ['Home', 'Bills', 'New Bill'],
  '/resolutions': ['Home', 'Resolutions'],
  '/resolutions/new': ['Home', 'Resolutions', 'New Resolution'],
  '/parliament': ['Home', 'Parliament'],
  '/president': ['Home', 'President'],
  '/ministries/health': ['Home', 'Ministries', 'Health'],
  '/ministries/education': ['Home', 'Ministries', 'Education'],
  '/ministries/finance': ['Home', 'Ministries', 'Finance'],
  '/ministries/it': ['Home', 'Ministries', 'IT'],
  '/ministries/entertainment': ['Home', 'Ministries', 'Entertainment'],
  '/ministries/career': ['Home', 'Ministries', 'Career'],
  '/ministries/personal-dev': ['Home', 'Ministries', 'Personal Dev'],
  '/ministries/external-affairs': ['Home', 'Ministries', 'External Affairs'],
  '/requests': ['Home', 'Requests'],
  '/public': ['Home', 'Public Dashboard'],
  '/settings': ['Home', 'Settings'],
};

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMobileToggle?: () => void;
}

const MOCK_NOTIFS = [
  { id: '1', title: 'Bill HB-2024-001 Submitted', body: 'Health Ministry submitted a new bill for parliament review.', read: false, created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: '2', title: 'Vote Required', body: 'Parliament voting is open for ED-2024-003.', read: false, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: '3', title: 'Request Approved', body: 'Your budget request was approved by Finance Ministry.', read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
];

const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, onMobileToggle }) => {
  const location = useLocation();
  const { user, role, presetProfiles, switchProfile } = useAuth();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const crumbs = BREADCRUMB_MAP[location.pathname] ?? ['Home'];
  const unread = MOCK_NOTIFS.filter(n => !n.read).length;

  // Find active preset metadata
  const activePreset = presetProfiles.find(p => p.email === user.email) || presetProfiles[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getRoleBadgeClass = (r: string) => {
    if (r === 'president') return 'badge-enacted';
    if (r === 'ministry') return 'badge-passed';
    return 'badge-submitted';
  };

  return (
    <header className={`header${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onMobileToggle}>
          <Menu size={20} />
        </button>
        <nav className="header-breadcrumb">
          {crumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="breadcrumb-sep">/</span>}
              <span className={i === crumbs.length - 1 ? 'breadcrumb-current' : ''}>{crumb}</span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="header-right">
        {/* Notification Bell */}
        <div className="position-relative" ref={notifRef}>
          <button className="notif-btn" onClick={() => setNotifOpen(!notifOpen)}>
            <Bell size={18} />
            {unread > 0 && <span className="notif-dot" />}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                {unread > 0 && <span className="badge badge-submitted">{unread} new</span>}
              </div>
              <div className="notif-list">
                {MOCK_NOTIFS.map(n => (
                  <div key={n.id} className={`notif-item${!n.read ? ' unread' : ''}`}>
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-body">{n.body}</div>
                    <div className="notif-time">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Switcher Dropdown */}
        <div className="position-relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              background: 'var(--bg-card)',
              border: profileOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: profileOpen ? '0 0 12px var(--accent-primary-glow)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{activePreset.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {activePreset.label}
              </span>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--text-muted)',
                transform: profileOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 200ms ease',
                marginLeft: 2,
              }}
            />
          </button>

          {/* Profile Switcher Menu */}
          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 290,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                backdropFilter: 'blur(16px)',
                padding: 'var(--space-2)',
                zIndex: 1000,
                animation: 'fade-in 150ms ease',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Switch Active Profile
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Select any profile to switch roles instantly
                </div>
              </div>

              <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {presetProfiles.map(p => {
                  const isSelected = p.id === activePreset.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchProfile(p.id);
                        setProfileOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--bg-glass)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{p.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.description}
                        </div>
                      </div>
                      {isSelected && <Check size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
