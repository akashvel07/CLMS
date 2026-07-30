import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const AppLayout: React.FC = () => {
  const { loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="sidebar-logo-mark" style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>CL</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Mobile backdrop */}
      <div 
        className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      
      <Sidebar 
        collapsed={collapsed} 
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed(!collapsed)} 
      />
      <div className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Header 
          sidebarCollapsed={collapsed} 
          onMobileToggle={() => setMobileOpen(!mobileOpen)} 
        />
        <main style={{ minHeight: 'calc(100vh - var(--header-height))' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
