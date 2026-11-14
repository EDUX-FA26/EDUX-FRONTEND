import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getDashboard, getDashboardNotifications } from '../../services/dashboard.service';

// ─── Skeleton ───
function StatSkeleton() {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div className="skeleton" style={{ width: '80px', height: '14px' }} />
        <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
      </div>
      <div className="skeleton" style={{ width: '60px', height: '32px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ width: '120px', height: '12px' }} />
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, icon, iconBg, iconColor, sub, subColor, onClick, className = '' }) {
  return (
    <div className={`stat-card animate-fade-in ${className}`} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>{label}</span>
        <div className="stat-card__icon" style={{ background: iconBg, color: iconColor }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
        </div>
      </div>
      <div className="stat-card__value" style={{ color: iconColor }}>{value ?? '—'}</div>
      {sub && (
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: subColor || 'var(--color-ink-muted)', marginTop: '4px' }}>{sub}</p>
      )}
    </div>
  );
}

// ─── Assignment Row ───
function AssignmentRow({ assignment, t }) {
  const isOverdue = new Date(assignment.deadline) < new Date();
  const daysLeft = Math.ceil((new Date(assignment.deadline) - new Date()) / 86400000);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: assignment.is_submitted ? 'var(--color-accent-teal-light)' : (isOverdue ? 'rgba(220,38,38,0.1)' : '#fff1e7'),
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '18px',
            color: assignment.is_submitted ? 'var(--color-accent-teal)' : (isOverdue ? '#dc2626' : 'var(--color-primary)'),
          }}>
            {assignment.is_submitted ? 'task_alt' : (isOverdue ? 'warning' : 'pending')}
          </span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', padding: '1px 8px', borderRadius: '4px' }}>
              {assignment.class_code}
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)' }}>{assignment.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
              {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
            </span>
            <span>{assignment.subject_name}</span>
          </div>
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {assignment.is_submitted ? (
          <span className="badge badge-teal">{t.assignments?.submitted}</span>
        ) : isOverdue ? (
          <span className="badge badge-red">{t.assignments?.overdue}</span>
        ) : (
          <span className="badge badge-orange">
            {daysLeft <= 1
              ? t.assignments?.today
              : (t.assignments?.daysLeft || '{n} ngày').replace('{n}', daysLeft)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Notification Row ───
function NotifRow({ notif, t }) {
  return (
    <div style={{
      padding: '12px', borderRadius: '10px',
      background: notif.is_read ? 'transparent' : 'var(--color-primary-bg)',
      border: `1px solid ${notif.is_read ? 'transparent' : 'var(--color-border)'}`,
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', padding: '1px 8px', borderRadius: '9999px', background: '#fff1e7', color: 'var(--color-primary-dark)' }}>
          {notif.type || t.notifications?.system}
        </span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)' }}>
          {new Date(notif.created_at).toLocaleDateString('vi-VN')}
        </span>
      </div>
      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{notif.title}</p>
      {notif.message && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {notif.message}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ───

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { currentSchool, status } = useSchool();
  const activeSchool = currentSchool;
  const { t } = useLanguage();
  const navigate = useNavigate();

  const schoolName =
    currentSchool?.schoolName ||
    currentSchool?.name ||
    null;
  const [data, setData] = useState(null);
  const [notifData, setNotifData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [error, setError] = useState(null);

  const schoolId = currentSchool?.schoolId ?? currentSchool?.id ?? null;

  const currentSchoolIdRef = useRef(schoolId);
  const requestGenRef = useRef(0);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    currentSchoolIdRef.current = schoolId;
    const genId = ++requestGenRef.current;

    // Hủy các request đang bay của trường trước
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setData(null);
    setNotifData(null);
    setError(null);

    if (!schoolId) {
      setLoading(false);
      setNotifLoading(false);
      return;
    }

    setLoading(true);
    setNotifLoading(true);

    // 1. Fetch main dashboard metrics
    getDashboard({ signal: controller.signal })
      .then((res) => {
        if (currentSchoolIdRef.current === schoolId && requestGenRef.current === genId) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        if (currentSchoolIdRef.current === schoolId && requestGenRef.current === genId) {
          setError(err.response?.data?.message || t.dashboard?.noData);
        }
      })
      .finally(() => {
        if (currentSchoolIdRef.current === schoolId && requestGenRef.current === genId) {
          setLoading(false);
        }
      });

    // 2. Fetch notifications separately for fast asynchronous loading
    getDashboardNotifications({ signal: controller.signal })
      .then((res) => {
        if (
          currentSchoolIdRef.current === schoolId &&
          requestGenRef.current === genId
        ) {
          setNotifData(res.data);
        }
      })
      .catch((err) => {
        if (err?.code !== 'ERR_CANCELED') {
          console.error('[DASHBOARD NOTIFICATIONS]', err);
        }
      })
      .finally(() => {
        if (
          currentSchoolIdRef.current === schoolId &&
          requestGenRef.current === genId
        ) {
          setNotifLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [schoolId, status]);

  const stats = data?.statistics;
  const assignments = data?.recentAssignments || [];
  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;
  const S = t.stats;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
        color: '#ffffff', padding: '28px 32px',
        position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(242,112,36,0.25) 0%, rgba(242,112,36,0) 70%)', borderRadius: '50%', transform: 'translate(40px, -40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px', borderRadius: '9999px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: '0.75rem', color: '#ffedd5', fontWeight: 600, marginBottom: '12px',
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block', animation: 'pulse-ring 1.5s ease-in-out infinite' }} />
            {t.dashboard?.portalBadge}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
            {t.dashboard?.welcomeStudent} {user?.full_name || user?.email}!
          </h1>

          {/* Current School */}
          {status === "ready" && schoolName && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "14px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "19px" }}
              >
                school
              </span>

              <span>
                Đang học tại:{" "}
                <strong style={{ color: "#fed7aa" }}>
                  {schoolName}
                </strong>
              </span>
            </div>
          )}

          <p style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9375rem', lineHeight: '1.5', margin: '8px 0 0 0' }}>
            {t.dashboard?.welcomeDesc}
          </p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {loading ? (
          <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
        ) : error ? (
          <div style={{ gridColumn: '1 / -1', padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ display: 'block', fontSize: '32px', marginBottom: '8px' }}>error</span>
            {error}
          </div>
        ) : (
          <>
            <StatCard
              label={S?.totalClasses}
              value={stats?.totalClasses}
              icon="class"
              iconBg="#fff1e7"
              iconColor="var(--color-primary)"
              sub={S?.currentSemester}
              onClick={() => navigate('/student/classes?semester=FALL_2026')}
              className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
            />
            <StatCard label={S?.pendingAssignments} value={stats?.pendingAssignments} icon="pending_actions" iconBg="rgba(220,38,38,0.1)" iconColor="#dc2626"
              sub={stats?.pendingAssignments > 0 ? S?.needDone : S?.allDone}
              subColor={stats?.pendingAssignments > 0 ? '#dc2626' : '#16a34a'} />
            <StatCard label={S?.submittedAssignments} value={stats?.submittedAssignments} icon="task_alt" iconBg="var(--color-accent-teal-light)" iconColor="var(--color-accent-teal)" sub={S?.total} />
            <StatCard label={S?.averageScore}
              value={stats?.averageScore != null ? Number(stats.averageScore).toFixed(1) : '—'}
              icon="grade" iconBg="#d5e0f8" iconColor="#1e40af"
              sub={stats?.averageScore != null ? S?.onScale10 : S?.noScore} />
          </>
        )}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Assignments */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>assignment</span>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>{t.assignments?.title}</h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{t.assignments?.subtitle}</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                  <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '200px', height: '14px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '120px', height: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>assignment</span>
              <p style={{ fontSize: '0.875rem' }}>{t.assignments?.empty}</p>
            </div>
          ) : (
            assignments.map((a) => <AssignmentRow key={a.id} assignment={a} t={t} />)
          )}
        </div>

        {/* Notifications */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>notifications</span>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>{t.notifications?.title}</h2>
            </div>
            {unreadCount > 0 && (
              <span className="badge badge-orange">
                {(t.notifications?.newLabel || '{n} mới').replace('{n}', unreadCount)}
              </span>
            )}
          </div>

          {notifLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'var(--color-primary-bg)' }}>
                  <div className="skeleton" style={{ width: '120px', height: '12px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '4px' }} />
                  <div className="skeleton" style={{ width: '80%', height: '12px' }} />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>notifications_off</span>
              <p style={{ fontSize: '0.875rem' }}>{t.notifications?.empty}</p>
            </div>
          ) : (
            notifications.map((n) => <NotifRow key={n.id} notif={n} t={t} />)
          )}

          {/* Support card */}
          <div style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: 'var(--color-primary-card)', border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>support_agent</span>
              {t.notifications?.support}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-warm)', margin: 0 }}>{t.notifications?.hotline}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
