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

function SubmissionRow({ submission, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-card)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>description</span>
        </div>
        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px' }}>{submission.student_name}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>{submission.student_code}</span>
            <span>{submission.assignment_title}</span>
            <span style={{ background: 'var(--color-primary-card)', padding: '0 8px', borderRadius: '4px', fontWeight: 600, color: 'var(--color-primary-dark)' }}>{submission.class_code}</span>
          </div>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <span className="badge badge-orange">{t.submissions?.waitGrade}</span>
        <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>{new Date(submission.submitted_at).toLocaleDateString('vi-VN')}</p>
      </div>
    </div>
  );
}

function NotifRow({ notif, t }) {
  return (
    <div style={{ padding: '12px', borderRadius: '10px', background: notif.is_read ? 'transparent' : 'var(--color-primary-bg)', border: `1px solid ${notif.is_read ? 'transparent' : 'var(--color-border)'}`, marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '1px 8px', borderRadius: '9999px', background: '#fff1e7', color: 'var(--color-primary-dark)' }}>
          {notif.type || t.notifications?.system}
        </span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)' }}>{new Date(notif.created_at).toLocaleDateString('vi-VN')}</span>
      </div>
      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{notif.title}</p>
    </div>
  );
}

export default function LecturerDashboardPage() {
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
  const submissions = data?.recentSubmissions || [];
  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;
  const S = t.stats;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero */}
      <div style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #0f2027 0%, #1a3040 50%, #0f2027 100%)', color: 'white', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '240px', height: '240px', background: 'rgba(0,106,97,0.25)', borderRadius: '50%', filter: 'blur(60px)', transform: 'translate(40px, -40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#a5f3fc', fontWeight: 600, marginBottom: '12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent-teal)', display: 'inline-block' }} />
            {t.dashboard?.lecturerBadge}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {t.dashboard?.welcomeStudent} {user?.full_name || user?.email}!
          </h1>
          <p style={{ marginTop: '6px', color: '#94a3b8', fontSize: '0.875rem' }}>{t.dashboard?.lecturerDesc}</p>
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
            <StatCard label={S?.classesTeaching} value={stats?.totalClasses} icon="class" iconBg="#e6f7f5" iconColor="var(--color-accent-teal)" sub={S?.currentSemester} />
            <StatCard label={S?.totalStudents} value={stats?.totalStudents} icon="groups" iconBg="#fff1e7" iconColor="var(--color-primary)" sub={S?.inClasses} />
            <StatCard label={S?.pendingSubmissions} value={stats?.pendingSubmissions} icon="grading" iconBg="rgba(220,38,38,0.1)" iconColor="#dc2626" sub={stats?.pendingSubmissions > 0 ? S?.needGrade : S?.allGraded} />
            <StatCard label={S?.totalAssignments} value={stats?.totalAssignments} icon="assignment" iconBg="#d5e0f8" iconColor="#1e40af" sub={S?.allClasses} />
          </>
        )}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-accent-teal)' }}>grading</span>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>{t.submissions?.title}</h2>
            </div>
            {stats?.pendingSubmissions > 0 && (
              <span className="badge badge-red">
                {(t.submissions?.pendingLabel || '{n} chờ chấm').replace('{n}', stats.pendingSubmissions)}
              </span>
            )}
          </div>
          {loading ? [1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '200px', height: '12px' }} />
              </div>
            </div>
          )) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>inbox</span>
              <p style={{ fontSize: '0.875rem' }}>{t.submissions?.empty}</p>
            </div>
          ) : submissions.map((s) => <SubmissionRow key={s.id} submission={s} t={t} />)}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>notifications</span>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>{t.notifications?.title}</h2>
            </div>
            {unreadCount > 0 && <span className="badge badge-orange">{(t.notifications?.newLabel || '{n} mới').replace('{n}', unreadCount)}</span>}
          </div>
          {notifLoading ? [1,2,3].map(i => (
            <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'var(--color-primary-bg)', marginBottom: '8px' }}>
              <div className="skeleton" style={{ width: '100px', height: '12px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '100%', height: '14px' }} />
            </div>
          )) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>notifications_off</span>
              <p style={{ fontSize: '0.875rem' }}>{t.notifications?.empty}</p>
            </div>
          ) : notifications.map((n) => <NotifRow key={n.id} notif={n} t={t} />)}
        </div>
      </div>
    </div>
  );
}
