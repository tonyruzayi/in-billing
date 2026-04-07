/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LOGO from '../logoData';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  dash: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  quote: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  invoice: "M9 2H4a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8l-6-6H9z M13 2v6h6 M8 13h8 M8 17h5",
  clients: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  inventory: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
  reports: "M18 20V10 M12 20V4 M6 20v-6",
  admin: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  plus: "M12 5v14 M5 12h14",
  signout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  menu: "M3 12h18 M3 6h18 M3 18h18",
  x: "M18 6L6 18 M6 6l12 12",
};

export default function Layout() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function logout() { await signOut(); nav('/login'); }

  const init = (profile?.full_name || user?.email || 'IN').slice(0, 2).toUpperCase();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: icons.dash, exact: true },
    { to: '/quotations', label: 'Quotations', icon: icons.quote },
    { to: '/invoices', label: 'Invoices', icon: icons.invoice },
    { to: '/clients', label: 'Clients', icon: icons.clients },
    { to: '/inventory', label: 'Inventory', icon: icons.inventory },
    { to: '/reports', label: 'Reports', icon: icons.reports },
  ];

  function SidebarInner() {
    return (
      <>
        <div className="sb-logo">
          <div className="sb-logo-row">
            <div className="sb-logo-img"><img src={LOGO} alt="IN" /></div>
            <div>
              <div className="sb-logo-name">INFORMATION<br />NETWORKING</div>
              <div className="sb-logo-tag">Billing System</div>
            </div>
          </div>
        </div>
        <nav className="sb-nav">
          <div className="sb-group">
            <div className="sb-group-lbl">Main Menu</div>
            {navItems.map(n => (
              <NavLink key={n.to} to={n.to} end={n.exact}
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
                <Icon d={n.icon} />{n.label}
              </NavLink>
            ))}
          </div>
          <div className="sb-group">
            <div className="sb-group-lbl">Quick Create</div>
            <button className="nav-item" onClick={() => nav('/quotations/new')}>
              <Icon d={icons.plus} />New Quote
            </button>
            <button className="nav-item" onClick={() => nav('/invoices/new')}>
              <Icon d={icons.plus} />New Invoice
            </button>
          </div>
          {isAdmin && (
            <div className="sb-group">
              <div className="sb-group-lbl">Administration</div>
              <NavLink to="/admin"
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
                <Icon d={icons.admin} />Admin Portal
              </NavLink>
            </div>
          )}
        </nav>
        <div className="sb-footer">
          <div className="user-card">
            <div className="user-av">{init}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-nm">{profile?.full_name || user?.email}</div>
              <div className="user-rl">{profile?.role || 'staff'}</div>
            </div>
          </div>
          <button className="nav-item" onClick={logout} style={{ color: 'var(--err)' }}>
            <Icon d={icons.signout} />Sign Out
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="shell">
      {/* Sidebar overlay for mobile */}
      <div
        className={'sidebar-overlay' + (open ? ' show' : '')}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <SidebarInner />
      </aside>

      {/* Main content */}
      <div className="main">
        {/* Mobile top bar */}
        <header className="mob-header">
          <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
            <Icon d={open ? icons.x : icons.menu} size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, overflow: 'hidden' }}>
              <img src={LOGO} alt="IN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '.8rem', background: 'linear-gradient(90deg,var(--cyan-l),var(--purple-l))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              IN Billing
            </span>
          </div>
          <div className="user-av" style={{ width: 32, height: 32, fontSize: '.7rem' }}>{init}</div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
