import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ROLES, SEMESTER_LABEL } from '../config/constants';
import SettingsToggle from '../components/common/SettingsToggle';
import { FiChevronDown, FiGrid, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { Flame, LibraryBig } from 'lucide-react';

// Nav config theo role
const NAV_BY_ROLE = {
  [ROLES.STUDENT]: [
    { id: 'dashboard', icon: FiGrid, path: '/student/dashboard', key: 'overview' },
    { id: 'streak', icon: Flame, path: '/student/streak', key: 'streak' },
  ],
  [ROLES.LECTURER]: [
    { id: 'dashboard', icon: FiGrid, path: '/lecturer/dashboard', key: 'overview' },
  ],
  [ROLES.ADMIN]: [
    { id: 'dashboard', icon: 'dashboard', path: '/admin/dashboard', key: 'overview', label: 'Tổng quan' },
    { id: 'users', icon: 'group', path: '/admin/users', key: 'users', label: 'Người dùng' },
    { id: 'reports', icon: 'bar_chart', path: '/admin/reports', key: 'reports', label: 'Báo cáo' },
    { id: 'notifications', icon: 'campaign', path: '/admin/notifications', key: 'notifications', label: 'Tạo thông báo' },
    { id: 'logs', icon: 'history', path: '/admin/logs', key: 'logs', label: 'System Logs' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = NAV_BY_ROLE[user?.role] || [];
  const activeId = navItems.find((n) => location.pathname.startsWith(n.path))?.id;

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').slice(-1)[0][0].toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase();

  const roleLabel = t.role?.[user?.role] || user?.role || '';

  return (
    <div className={`dashboard-layout${sidebarCollapsed ? ' dashboard-layout--collapsed' : ''}`}>
      {mobileSidebarOpen && (
        <button
          className="dashboard-sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <nav
        id="dashboard-sidebar"
        className={`dashboard-sidebar${sidebarCollapsed ? ' dashboard-sidebar--collapsed' : ''}${mobileSidebarOpen ? ' dashboard-sidebar--mobile-open' : ''}`}
        aria-label={t.layout?.navigation || 'Main navigation'}
      >
        <div className="dashboard-sidebar__brand-row">
          <button
            className="dashboard-sidebar__mobile-close"
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <div className="dashboard-sidebar__section-label">
          {lang === 'vi' ? 'KHÔNG GIAN HỌC TẬP' : 'LEARNING SPACE'}
        </div>
        <div className="dashboard-sidebar__items">
          {navItems.map((item) => {
            const isActive = activeId === item.id;
            const label = t.nav?.[item.key] || item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setMobileSidebarOpen(false);
                }}
                className={`dashboard-sidebar__item${isActive ? ' dashboard-sidebar__item--active' : ''}`}
                title={sidebarCollapsed ? label : undefined}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                {typeof item.icon === 'string' ? (
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : (
                  <item.icon aria-hidden="true" />
                )}
                <span className="dashboard-sidebar__item-label">{label}</span>
              </button>
            );
          })}
        </div>
        <div className="dashboard-sidebar__footer">FPT UNIVERSITY</div>
      </nav>

      <div className="dashboard-layout__main">
        <header className="dashboard-header">
          <div className="dashboard-header__inner">
            <button
              className="dashboard-header__menu"
              type="button"
              onClick={() => {
                if (window.matchMedia('(max-width: 760px)').matches) {
                  setMobileSidebarOpen(true);
                } else {
                  setSidebarCollapsed((collapsed) => !collapsed);
                }
              }}
              aria-label={mobileSidebarOpen ? 'Close navigation' : sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              aria-controls="dashboard-sidebar"
              aria-expanded={window.matchMedia('(max-width: 760px)').matches ? mobileSidebarOpen : !sidebarCollapsed}
              title={window.matchMedia('(max-width: 760px)').matches ? 'Open navigation' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <FiMenu aria-hidden="true" />
            </button>
            {/* ─── HEADER ─── */}
            <div className="dashboard-header__content">
              <div className="dashboard-header__row" style={{
                maxWidth: '1440px', margin: '0 auto',
                padding: '0 24px',
                height: '64px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '12px',
              }}>

                {/* Zone 1: Logo + Semester */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <button
                    onClick={() => navigate(NAV_BY_ROLE[user?.role]?.[0]?.path || '/')}
                    aria-label="EDUX home"
                    className="dashboard-header__brand"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px', padding: 0,
                    }}
                  >
                    <div style={{
                      background: 'var(--color-primary)',
                      color: 'white', fontWeight: 800,
                      fontSize: '1.125rem', fontFamily: 'var(--font-mono)',
                      padding: '4px 14px', borderRadius: '8px', letterSpacing: '2px',
                    }}>
                      EDUX
                    </div>
                  </button>

                  {/* Semester badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', borderRadius: '9999px',
                    background: '#f6ece6', border: '1px solid rgba(224,192,178,0.4)',
                    color: 'var(--color-primary-dark)', fontSize: '0.6875rem', fontWeight: 700,
                  }}>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--color-primary)', display: 'inline-block',
                      animation: 'pulse-ring 1.5s ease-in-out infinite',
                    }} />
                    {t.layout?.semester || SEMESTER_LABEL}
                  </div>
                </div>

                {/* Settings toggles + User menu */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {/* Settings (theme + language) */}
                  <SettingsToggle />

                  {/* Divider */}
                  <div style={{ width: '1px', height: '28px', background: 'var(--color-border)', margin: '0 4px' }} />

                  {/* User menu */}
                  <div style={{ position: 'relative' }}>
                    <button
                      id="user-menu-button"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      aria-expanded={showUserMenu}
                      aria-haspopup="menu"
                      aria-controls="dashboard-user-menu"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px 6px 6px',
                        background: 'var(--color-primary-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: 'var(--color-primary)',
                        color: 'white', fontWeight: 700, fontSize: '0.875rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0, maxWidth: '120px' }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user?.full_name || user?.email || 'User'}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                          {roleLabel}
                        </p>
                      </div>
                      <FiChevronDown aria-hidden="true" className="dashboard-user-chevron" />
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                      <div id="dashboard-user-menu" role="menu" className="animate-fade-in" style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                        width: '240px', background: 'var(--color-surface)',
                        borderRadius: '14px', boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--color-border)', zIndex: 100, overflow: 'hidden',
                      }}>
                        {/* User info */}
                        <div style={{
                          padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
                          background: 'var(--color-primary-bg)',
                        }}>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                            {user?.full_name || user?.email}
                          </p>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--color-primary-dark)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>
                            {roleLabel}
                          </p>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
                            {user?.email}
                          </p>
                        </div>

                        {/* Settings in dropdown (mobile-friendly) */}
                        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                            {lang === 'vi' ? 'Cài đặt giao diện' : 'Display Settings'}
                          </p>
                          <SettingsToggle compact />
                        </div>

                        {/* Logout */}
                        <div style={{ padding: '6px' }}>
                          <button
                            onClick={handleLogout}
                            role="menuitem"
                            style={{
                              width: '100%', padding: '10px 12px',
                              display: 'flex', alignItems: 'center', gap: '10px',
                              background: 'none', border: 'none', cursor: 'pointer',
                              borderRadius: '8px', textAlign: 'left',
                              fontSize: '0.8125rem', fontWeight: 600,
                              color: '#dc2626', fontFamily: 'var(--font-sans)',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            <FiLogOut aria-hidden="true" />
                            {t.layout?.logout || 'Đăng xuất'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ─── MAIN CONTENT ─── */}
        <main style={{
          flex: 1,
          maxWidth: '1440px', width: '100%',
          margin: '0 auto',
          padding: '24px 24px 80px',
        }}>
          <Outlet />
        </main>

        {/* ─── FOOTER ─── */}
        <footer style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: '16px 24px',
          transition: 'background 0.3s',
        }}>
          <div style={{
            maxWidth: '1440px', margin: '0 auto',
            display: 'flex', flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>EDUX FPT UNIVERSITY</span>
              <span style={{ color: 'var(--color-border-medium)' }}>•</span>
              <span style={{ color: 'var(--color-ink-muted)' }}>{t.layout?.footer}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--color-ink-soft)' }}>
              <span>{t.layout?.hotline}: (024) 7300 1866</span>
              <span>itsupport@fpt.edu.vn</span>
              <span>{t.layout?.copyright}</span>
            </div>
          </div>
        </footer>

        {/* Click outside overlay */}
        {showUserMenu && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={() => setShowUserMenu(false)} />
        )}
      </div>
    </div>
  );
}
