import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ROLES, SEMESTER_LABEL } from '../config/constants';
import SettingsToggle from '../components/common/SettingsToggle';

// Nav config theo role
const NAV_BY_ROLE = {
  [ROLES.STUDENT]: [
    { id: 'dashboard', icon: 'dashboard', path: '/student/dashboard', key: 'overview' },
  ],
  [ROLES.LECTURER]: [
    { id: 'dashboard', icon: 'dashboard', path: '/lecturer/dashboard', key: 'overview' },
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
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-primary-bg)',
      transition: 'background 0.3s, color 0.3s',
    }}>
      {/* ─── HEADER ─── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-xs)',
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <div style={{
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

          {/* Zone 2: Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}>
            {navItems.map((item) => {
              const isActive = activeId === item.id;
              const label = t.nav?.[item.key] || item.label || item.key;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '10px',
                    border: 'none', cursor: 'pointer',
                    fontSize: '0.8125rem', fontWeight: isActive ? 700 : 600,
                    fontFamily: 'var(--font-sans)',
                    background: isActive ? '#fff1e7' : 'transparent',
                    color: isActive ? 'var(--color-primary-dark)' : 'var(--color-ink-muted)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--color-primary-card)'; e.currentTarget.style.color = 'var(--color-ink)'; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted)'; } }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Settings toggles + User menu */}
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
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-ink-soft)' }}>expand_more</span>
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div className="animate-fade-in" style={{
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
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                      {t.layout?.logout || 'Đăng xuất'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav strip */}
        <div style={{
          display: 'flex', alignItems: 'center',
          overflowX: 'auto', padding: '6px 16px',
          background: 'var(--color-primary-bg)',
          borderTop: '1px solid var(--color-border)',
          gap: '6px',
        }} className="no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeId === item.id;
            const label = t.nav?.[item.key] || item.label || item.key;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                  fontSize: '0.75rem', fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isActive ? 'white' : 'var(--color-ink-muted)',
                  transition: 'all 0.15s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{item.icon}</span>
                {label}
              </button>
            );
          })}
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
  );
}