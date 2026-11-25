import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSchool } from '../../contexts/SchoolContext';
import { getDashboard, getDashboardNotifications } from '../../services/dashboard.service';

function StatCard({ label, value, icon, iconBg, iconColor, sub, onClick, className = '' }) {
  return (
    <div
      className={`stat-card animate-fade-in ${className}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
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

function SubmissionRow({ submission, t, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 8px',
        borderBottom: '1px solid var(--color-border)',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '8px',
        transition: 'background-color 0.15s ease',
      }}
      className={onClick ? 'hover:bg-black/5' : ''}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }} className="min-w-0 flex-1 pr-3">
        <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-card)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>description</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px' }}>{submission.student_name}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }} className="shrink-0">{submission.student_code}</span>
            <span className="truncate max-w-[180px] sm:max-w-xs">{submission.assignment_title}</span>
            <span className="shrink-0" style={{ background: 'var(--color-primary-card)', padding: '0 8px', borderRadius: '4px', fontWeight: 600, color: 'var(--color-primary-dark)' }}>{submission.class_code}</span>
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    currentSchool,
    status: schoolStatus,
  } = useSchool();

  const schoolId =
    currentSchool?.schoolId ||
    currentSchool?.id ||
    null;
  const schoolName = currentSchool?.schoolName || 'EDUX';
  const [data, setData] = useState(null);
  const [notifData, setNotifData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [error, setError] = useState(null);

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

    if (schoolStatus !== 'ready' || !schoolId) {
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

    // 2. Fetch notifications separately
    getDashboardNotifications({ signal: controller.signal })
      .then((res) => {
        if (currentSchoolIdRef.current === schoolId && requestGenRef.current === genId) {
          setNotifData(res.data);
        }
      })
      .catch((err) => {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
          return;
        }
      })
      .finally(() => {
        if (currentSchoolIdRef.current === schoolId && requestGenRef.current === genId) {
          setNotifLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [schoolId, schoolStatus]);

  const stats = data?.statistics;
  const submissions = data?.recentSubmissions || [];
  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;
  const S = t.stats;

  return (
    <div className="animate-fade-in w-full max-w-[1600px] mx-auto min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#FFEDD5] via-[#FED7AA]/90 to-[#FDBA74]/85 border border-orange-300/80 rounded-2xl px-6 py-5 shadow-xs mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white text-[#EA580C] border border-orange-200 text-xs font-semibold px-3 py-1 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] inline-block" />
            {`${schoolName} Lecturer Portal`}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2.5 tracking-tight m-0">
            {t.dashboard?.welcomeStudent} {user?.full_name || user?.email}!
          </h1>
          <p className="text-sm text-slate-700 font-medium mt-1 m-0">
            {t.dashboard?.lecturerDesc}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 lg:gap-4">
        {loading ? [1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: '80px', height: '14px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '60px', height: '32px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '120px', height: '12px' }} />
          </div>
        )) : error ? (
          <div style={{ gridColumn: '1/-1', padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', color: '#ef4444', textAlign: 'center' }}>{error}</div>
        ) : (
          <>

            <StatCard
              label={S?.classesTeaching}
              value={stats?.totalClasses}
              icon="class"
              iconBg="#e6f7f5"
              iconColor="var(--color-accent-teal)"
              onClick={() => navigate('/lecturer/classes')}
              className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
            />

            <StatCard
              label={S?.totalStudents}
              value={stats?.totalStudents}
              icon="groups"
              iconBg="#fff1e7"
              iconColor="var(--color-primary)"
              sub={S?.inClasses}
              onClick={() => navigate('/lecturer/classes')}
              className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
            />
            <StatCard
              label={S?.pendingSubmissions}
              value={stats?.pendingSubmissions}
              icon="grading"
              iconBg="rgba(220,38,38,0.1)"
              iconColor="#dc2626"
              sub={stats?.pendingSubmissions > 0 ? S?.needGrade : S?.allGraded}
              onClick={() => navigate('/lecturer/classes')}
              className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
            />
            <StatCard
              label={S?.totalAssignments}
              value={stats?.totalAssignments}
              icon="assignment"
              iconBg="#d5e0f8"
              iconColor="#1e40af"
              sub={S?.allClasses}
              onClick={() => navigate('/lecturer/classes')}
              className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
            />
          </>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        <div className="card lg:col-span-8 min-w-0" style={{ padding: '20px' }}>
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
          {loading ? [1, 2, 3].map(i => (
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
          ) : submissions.map((s) => (
            <SubmissionRow
              key={s.id}
              submission={s}
              t={t}
              onClick={() => {
                if (s.assignment_id) {
                  navigate(`/lecturer/assignments/${s.assignment_id}`);
                }
              }}
            />
          ))}
        </div>

        <div className="card lg:col-span-4 min-w-0" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>notifications</span>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>{t.notifications?.title}</h2>
            </div>
            {unreadCount > 0 && <span className="badge badge-orange">{(t.notifications?.newLabel || '{n} mới').replace('{n}', unreadCount)}</span>}
          </div>
          {notifLoading ? [1, 2, 3].map(i => (
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
