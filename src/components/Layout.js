import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, FileText, Receipt, LogOut, Plus } from 'lucide-react';

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'IN';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-badge">IN</div>
          <div className="brand-name">INFORMATION<br/>NETWORKING</div>
          <div className="brand-tag">Billing System</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Overview</div>
            <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={17} /> Dashboard
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Documents</div>
            <NavLink to="/quotations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={17} /> Quotations
            </NavLink>
            <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Receipt size={17} /> Invoices
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Create New</div>
            <button className="nav-item" onClick={() => navigate('/quotations/new')}>
              <Plus size={17} /> New Quote
            </button>
            <button className="nav-item" onClick={() => navigate('/invoices/new')}>
              <Plus size={17} /> New Invoice
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="nav-item" onClick={handleSignOut} style={{ color: '#ef4444' }}>
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
