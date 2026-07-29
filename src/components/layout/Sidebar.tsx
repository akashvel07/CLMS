import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, Vote, Crown, Building2,
  HeartPulse, GraduationCap, DollarSign, Briefcase, Monitor,
  Star, Gamepad2, Globe2, MessageSquare, Settings, ChevronLeft,
  ChevronRight, LogOut, Bell, Heart, BadgeDollarSign, Laptop
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ministriesNav = [
  { label: 'Health', path: '/ministries/health', icon: HeartPulse, code: 'health' },
  { label: 'Education', path: '/ministries/education', icon: GraduationCap, code: 'education' },
  { label: 'Finance', path: '/ministries/finance', icon: BadgeDollarSign, code: 'finance' },
  { label: 'IT', path: '/ministries/it', icon: Laptop, code: 'it' },
  { label: 'Entertainment', path: '/ministries/entertainment', icon: Gamepad2, code: 'entertainment' },
  { label: 'Career', path: '/ministries/career', icon: Briefcase, code: 'career' },
  { label: 'Personal Dev', path: '/ministries/personal-dev', icon: Star, code: 'personal_dev' },
  { label: 'External Affairs', path: '/ministries/external-affairs', icon: Globe2, code: 'external_affairs' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const [ministriesOpen, setMinistriesOpen] = useState(
    location.pathname.startsWith('/ministries')
  );

  const isMinistryUser = role === 'ministry';
  const userMinistryCode = user?.ministry_id;

  const avatarColors: Record<string, string> = {
    president: 'linear-gradient(135deg, hsl(43,96%,50%), hsl(35,90%,55%))',
    ministry: 'linear-gradient(135deg, hsl(220,80%,60%), hsl(265,75%,65%))',
    public: 'linear-gradient(135deg, hsl(200,70%,55%), hsl(220,60%,50%))',
  };

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">CL</div>
        <div className="sidebar-logo-text">
          <h2>CLMS</h2>
          <span>Gov. Platform v1.0</span>
        </div>
      </div>

      <div className="sidebar-nav">
        {/* Main */}
        <div className="nav-section">
          {!collapsed && <div className="nav-section-label">Main</div>}
          <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/dashboard">
            <LayoutDashboard className="nav-icon" size={18} />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/constitution">
            <BookOpen className="nav-icon" size={18} />
            <span className="nav-label">Constitution</span>
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/bills">
            <FileText className="nav-icon" size={18} />
            <span className="nav-label">Bills</span>
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/parliament">
            <Vote className="nav-icon" size={18} />
            <span className="nav-label">Parliament</span>
          </NavLink>
        </div>

        {/* President only */}
        {role === 'president' && (
          <div className="nav-section">
            {!collapsed && <div className="nav-section-label">Executive</div>}
            <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/president">
              <Crown className="nav-icon" size={18} />
              <span className="nav-label">President</span>
            </NavLink>
          </div>
        )}

        {/* Ministries */}
        <div className="nav-section">
          {!collapsed && <div className="nav-section-label">Ministries</div>}
          {!collapsed && (
            <button
              className={`nav-item${location.pathname.startsWith('/ministries') ? ' active' : ''}`}
              onClick={() => setMinistriesOpen(!ministriesOpen)}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <Building2 className="nav-icon" size={18} />
              <span className="nav-label">Ministries</span>
              <ChevronRight
                size={14}
                style={{
                  marginLeft: 'auto',
                  transform: ministriesOpen ? 'rotate(90deg)' : 'none',
                  transition: 'transform 200ms ease',
                }}
              />
            </button>
          )}
          {(ministriesOpen || collapsed) &&
            ministriesNav
              .filter(m => role === 'president' || !isMinistryUser || m.code === userMinistryCode)
              .map(m => (
                <NavLink
                  key={m.code}
                  className={({ isActive }) =>
                    `nav-item${!collapsed ? ' nav-sub-item' : ''}${isActive ? ' active' : ''}`
                  }
                  to={m.path}
                  title={collapsed ? m.label : undefined}
                >
                  <m.icon className="nav-icon" size={16} />
                  <span className="nav-label">{m.label}</span>
                </NavLink>
              ))}
        </div>

        {/* Requests */}
        <div className="nav-section">
          {!collapsed && <div className="nav-section-label">Operations</div>}
          {(role === 'president' || userMinistryCode === 'finance') && (
            <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/finance/budget">
              <DollarSign className="nav-icon" size={18} />
              <span className="nav-label">Budget Allocation</span>
            </NavLink>
          )}
          <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/requests">
            <MessageSquare className="nav-icon" size={18} />
            <span className="nav-label">Requests</span>
          </NavLink>
          {role === 'public' && (
            <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/public">
              <Globe2 className="nav-icon" size={18} />
              <span className="nav-label">Public Dashboard</span>
            </NavLink>
          )}
        </div>

        {/* Settings */}
        <div className="nav-section">
          <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/settings">
            <Settings className="nav-icon" size={18} />
            <span className="nav-label">Settings</span>
          </NavLink>
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" style={{ cursor: 'default' }}>
          <div className="user-avatar" style={{ background: avatarColors[role ?? 'public'] }}>
            {initials}
          </div>
          <div className="sidebar-user-info">
            <div className="user-name">{user?.name ?? 'Guest'}</div>
            <div className="user-role">{role ?? 'public'}</div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm w-full mt-4"
          onClick={onToggle}
          style={{ justifyContent: 'center', marginTop: 'var(--space-2)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
