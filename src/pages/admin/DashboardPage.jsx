import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getDashboard, getDashboardNotifications } from '../../services/dashboard.service';

function StatCard({ label, value, icon, iconBg, iconColor, sub }) {
  return (
    <div className="stat-card animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>{label}</span>
        <div className="stat-card__icon" style={{ background: iconBg, color: iconColor }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
        </div>
      </div>
      <div className="stat-card__value" style={{ color: iconColor }}>{value ?? '—'}</div>
      {sub && <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}

function UserRow({ user: u, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: u.role === 'student' ? '#fff1e7' : 'var(--color-accent-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: u.role === 'student' ? 'var(--color-primary)' : 'var(--color-accent-teal)' }}>
            {u.role === 'student' ? 'school' : 'person_book'}
          </span>
        </div>
        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 2px' }}>{u.full_name || '—'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>{u.email}</p>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span className={`badge ${u.role === 'student' ? 'badge-orange' : 'badge-teal'}`}>
          {u.role === 'student' ? t.users?.student : t.users?.lecturer}
        </span>
        <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>{new Date(u.created_at).toLocaleDateString('vi-VN')}</p>
      </div>
    </div>
  );
}

function NotifRow({ notif, t }) {
  return (
    <div style={{ padding: '12px', borderRadius: '10px', background: notif.is_read ? 'transparent' : 'var(--color-primary-bg)', border: `1px solid ${notif.is_read ? 'transparent' : 'var(--color-border)'}`, marginBottom: '8px' }}>
      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 4px' }}>{notif.title}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0 }}>{new Date(notif.created_at).toLocaleDateString('vi-VN')}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [notifData, setNotifData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // 1. Fetch main dashboard metrics
    getDashboard()
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || t.dashboard?.noData); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // 2. Fetch notifications separately
    getDashboardNotifications()
      .then((res) => { if (!cancelled) setNotifData(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setNotifLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const stats = data?.statistics;
  const recentUsers = data?.recentUsers || [];
  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;
  const S = t.stats;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero */}
      <div style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)', color: 'white', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '240px', height: '240px', background: 'rgba(160,65,0,0.25)', borderRadius: '50%', filter: 'blur(60px)', transform: 'translate(40px, -40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#d8b4fe', fontWeight: 600, marginBottom: '12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
            {t.dashboard?.adminBadge}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t.dashboard?.adminTitle}</h1>
          <p style={{ marginTop: '6px', color: '#94a3b8', fontSize: '0.875rem' }}>
            {t.dashboard?.welcomeStudent} <strong style={{ color: 'white' }}>{user?.full_name || user?.email}</strong> — {t.dashboard?.adminDesc}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {loading ? [1,2,3,4].map(i => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: '80px', height: '14px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '60px', height: '32px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '120px', height: '12px' }} />
          </div>
        )) : error ? (
          <div style={{ gridColumn: '1/-1', padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', color: '#ef4444', textAlign: 'center' }}>{error}</div>
        ) : (
          <>
            <StatCard label={S?.totalUsers} value={stats?.totalUsers} icon="group" iconBg="#f3e8ff" iconColor="#7c3aed" sub={S?.active} />
            <StatCard label={S?.totalClasses?.replace('tham gia', '') || 'Sinh viên'} value={stats?.totalStudents} icon="school" iconBg="#fff1e7" iconColor="var(--color-primary)" sub={S?.studentAcc} />
            <StatCard label={S?.totalLecturers} value={stats?.totalLecturers} icon="person_book" iconBg="var(--color-accent-teal-light)" iconColor="var(--color-accent-teal)" sub={S?.lecturerAcc} />
            <StatCard label={S?.activeClasses} value={stats?.totalClasses} icon="class" iconBg="#d5e0f8" iconColor="#1e40af" sub={S?.allFaculty} />
          </>
        )}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Recent Users */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#7c3aed' }}>person_add</span>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>{t.users?.title}</h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{t.users?.subtitle}</span>
          </div>
          {loading ? [1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '200px', height: '12px' }} />
              </div>
            </div>
          )) : recentUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>group</span>
              <p style={{ fontSize: '0.875rem' }}>{t.users?.empty}</p>
            </div>
          ) : recentUsers.map((u) => <UserRow key={u.id} user={u} t={t} />)}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Notifications */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>notifications</span>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>{t.notifications?.title || 'Thông báo'}</h2>
              </div>
              {unreadCount > 0 && <span className="badge badge-orange">{(t.notifications?.newLabel || '{n} mới').replace('{n}', unreadCount)}</span>}
            </div>
            {notifLoading ? [1,2].map(i => (
              <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'var(--color-primary-bg)', marginBottom: '8px' }}>
                <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                <div className="skeleton" style={{ width: '60px', height: '12px' }} />
              </div>
            )) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-ink-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>notifications_off</span>
                <p style={{ fontSize: '0.8125rem' }}>{t.notifications?.empty}</p>
              </div>
            ) : notifications.map((n) => <NotifRow key={n.id} notif={n} t={t} />)}
          </div>

          {/* System status */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px', transition: 'background 0.3s' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#16a34a' }}>check_circle</span>
              {t.system?.title}
            </p>
            {[
              { label: t.system?.apiServer, ok: true },
              { label: t.system?.database, ok: true },
              { label: t.system?.fileStorage, ok: true },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  {t.system?.running}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
