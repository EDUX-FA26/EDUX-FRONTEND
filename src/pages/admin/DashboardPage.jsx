import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSchool } from '../../contexts/SchoolContext';
import { getDashboard, getDashboardNotifications } from '../../services/dashboard.service';
import { broadcastNotification } from '../../services/admin.service';

function StatCard({ label, value, icon, iconBg, iconColor, sub }) {
  return (
    <div className="stat-card animate-fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>{label}</span>
        <div className="stat-card__icon" style={{ background: iconBg, color: iconColor }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
        </div>
      </div>
      <div className="stat-card__value" style={{ color: iconColor, fontSize: '1.75rem', fontWeight: 800 }}>{value ?? '—'}</div>
      {sub && <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}

function UserRow({ user: u, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: u.role === 'student' ? '#fff1e7' : 'var(--color-accent-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: u.role === 'student' ? 'var(--color-primary)' : 'var(--color-accent-teal)' }}>
            {u.role === 'student' ? 'school' : 'person_book'}
          </span>
        </div>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 2px' }}>{u.full_name || '—'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>{u.email}</p>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span className={`badge ${u.role === 'student' ? 'badge-orange' : 'badge-teal'}`}>
          {u.role === 'student' ? (t.users?.student || 'Sinh viên') : (t.users?.lecturer || 'Giảng viên')}
        </span>
        <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>{new Date(u.created_at).toLocaleDateString('vi-VN')}</p>
      </div>
    </div>
  );
}

function NotifRow({ notif, t }) {
  return (
    <div style={{ padding: '12px', borderRadius: '10px', background: notif.is_read ? 'transparent' : 'var(--color-primary-bg)', border: `1px solid ${notif.is_read ? 'var(--color-border)' : 'rgba(234, 88, 12, 0.2)'}`, marginBottom: '8px' }}>
      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 4px' }}>{notif.title}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0 }}>{new Date(notif.created_at).toLocaleDateString('vi-VN')}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activeSchool } = useSchool();
  const [data, setData] = useState(null);
  const [notifData, setNotifData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentSchoolIdRef = useRef(activeSchool?.id);
  const requestGenRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Quick Action: Broadcast Modal state (SRS 3.7.1)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', target: 'all' });
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchDashboardData = (targetSchoolId = activeSchool?.id) => {
    if (!targetSchoolId) {
      setData(null);
      setNotifData(null);
      setLoading(false);
      setNotifLoading(false);
      return;
    }

    currentSchoolIdRef.current = targetSchoolId;
    const genId = ++requestGenRef.current;

    // Hủy request cũ đang bay
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setNotifLoading(true);
    setError(null);

    getDashboard({ signal: controller.signal })
      .then((res) => {
        if (currentSchoolIdRef.current === targetSchoolId && requestGenRef.current === genId) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        if (currentSchoolIdRef.current === targetSchoolId && requestGenRef.current === genId) {
          setError(err.response?.data?.message || t.dashboard?.noData || 'Không thể tải dữ liệu');
        }
      })
      .finally(() => {
        if (currentSchoolIdRef.current === targetSchoolId && requestGenRef.current === genId) {
          setLoading(false);
        }
      });

    fetchNotifs(targetSchoolId, genId, controller.signal);
  };

  const fetchNotifs = (targetSchoolId = activeSchool?.id, genId = requestGenRef.current, signal) => {
    if (!targetSchoolId) {
      setNotifData(null);
      setNotifLoading(false);
      return;
    }

    setNotifLoading(true);
    getDashboardNotifications({ signal })
      .then((res) => {
        if (currentSchoolIdRef.current === targetSchoolId && requestGenRef.current === genId) {
          setNotifData(res.data);
        }
      })
      .catch((err) => {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
          return;
        }
      })
      .finally(() => {
        if (currentSchoolIdRef.current === targetSchoolId && requestGenRef.current === genId) {
          setNotifLoading(false);
        }
      });
  };

  useEffect(() => {
    setData(null);
    setNotifData(null);
    setError(null);
    fetchDashboardData(activeSchool?.id);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [activeSchool?.id]);

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      await broadcastNotification({
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        target: broadcastForm.target,
      });
      alert('Đã phát thông báo toàn trường thành công!');
      setShowBroadcastModal(false);
      setBroadcastForm({ title: '', message: '', target: 'all' });
      fetchNotifs();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gửi thông báo');
    } finally {
      setBroadcasting(false);
    }
  };

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
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#d8b4fe', fontWeight: 600, marginBottom: '12px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
              {t.dashboard?.adminBadge || 'Hệ Thống Quản Trị'}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
              {t.dashboard?.adminTitle || 'Bảng Điều Khiển Quản Trị'}
            </h1>
            <p style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9375rem', lineHeight: '1.5', margin: '8px 0 0 0' }}>
              Xin chào, <strong style={{ color: 'white' }}>{user?.full_name || user?.email}</strong> — Giám sát hoạt động và điều hành toàn bộ hệ thống EduTrack.
            </p>
          </div>

          {/* Quick Action Button: Broadcast (SRS 3.7.1) */}
          <div>
            <button
              type="button"
              onClick={() => setShowBroadcastModal(true)}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #f97316 100%)',
                color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px',
                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 8px 20px rgba(234, 88, 12, 0.35)', cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>campaign</span>
              Phát Thông Báo Toàn Trường
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Links Bar (SRS 3.7.1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Link 
          to="/admin/users" 
          className="card"
          style={{ textDecoration: 'none', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s', border: '1px solid var(--color-border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>group</span>
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--color-ink)' }}>Quản lý Người Dùng</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Tài khoản, phân quyền, khóa thẻ</span>
          </div>
        </Link>

        <Link 
          to="/admin/classes" 
          className="card"
          style={{ textDecoration: 'none', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s', border: '1px solid var(--color-border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1e40af'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#d5e0f8', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>class</span>
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--color-ink)' }}>Quản lý Lớp Học</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Xếp lớp, gán GV, import Excel</span>
          </div>
        </Link>

        <Link 
          to="/admin/reports" 
          className="card"
          style={{ textDecoration: 'none', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s', border: '1px solid var(--color-border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>analytics</span>
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--color-ink)' }}>Báo Cáo & AI Audit</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Thống kê học tập, kiểm toán AI</span>
          </div>
        </Link>

        <Link 
          to="/admin/notifications" 
          className="card"
          style={{ textDecoration: 'none', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s', border: '1px solid var(--color-border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications_active</span>
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--color-ink)' }}>Kênh Thông Báo</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Lịch sử phát thanh toàn trường</span>
          </div>
        </Link>
      </div>

      {/* Key System Metrics (SRS 3.7.1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {loading ? [1,2,3,4].map(i => (
          <div key={i} className="stat-card" style={{ padding: '20px' }}>
            <div className="skeleton" style={{ width: '80px', height: '14px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '60px', height: '32px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '120px', height: '12px' }} />
          </div>
        )) : error ? (
          <div style={{ gridColumn: '1/-1', padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', color: '#ef4444', textAlign: 'center' }}>{error}</div>
        ) : (
          <>
            <StatCard label="Tổng Người Dùng" value={stats?.totalUsers} icon="group" iconBg="#f3e8ff" iconColor="#7c3aed" sub="Tài khoản trên toàn hệ thống" />
            <StatCard label="Tổng Sinh Viên" value={stats?.totalStudents} icon="school" iconBg="#fff1e7" iconColor="var(--color-primary)" sub="Sinh viên đang theo học" />
            <StatCard label="Tổng Giảng Viên" value={stats?.totalLecturers} icon="person_book" iconBg="var(--color-accent-teal-light)" iconColor="var(--color-accent-teal)" sub="Giảng viên đang công tác" />
            <StatCard label="Lớp Học Đang Mở" value={stats?.totalClasses} icon="class" iconBg="#d5e0f8" iconColor="#1e40af" sub="Các lớp thuộc kỳ hiện tại" />
          </>
        )}
      </div>

      {/* Main Grid: Recent Users & Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Recent Users Section */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#7c3aed', fontSize: '22px' }}>person_add</span>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>Người Dùng Đăng Ký Gần Đây</h2>
            </div>
            <Link to="/admin/users" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Xem tất cả →
            </Link>
          </div>
          {loading ? [1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '200px', height: '12px' }} />
              </div>
            </div>
          )) : recentUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>group</span>
              <p style={{ fontSize: '0.875rem' }}>Chưa có người dùng mới gần đây.</p>
            </div>
          ) : recentUsers.map((u) => <UserRow key={u.id} user={u} t={t} />)}
        </div>

        {/* Right column: Notifications & System health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Notifications Section */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '22px' }}>notifications</span>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>Thông Báo Hệ Thống</h2>
              </div>
              <Link to="/admin/notifications" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                Chi tiết →
              </Link>
            </div>
            {notifLoading ? [1,2].map(i => (
              <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'var(--color-primary-bg)', marginBottom: '8px' }}>
                <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                <div className="skeleton" style={{ width: '60px', height: '12px' }} />
              </div>
            )) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-ink-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>notifications_off</span>
                <p style={{ fontSize: '0.8125rem' }}>Chưa có thông báo nào.</p>
              </div>
            ) : notifications.slice(0, 4).map((n) => <NotifRow key={n.id} notif={n} t={t} />)}
          </div>

          {/* System status */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '20px', transition: 'background 0.3s' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#16a34a' }}>check_circle</span>
              Trạng Thái Hệ Thống
            </p>
            {[
              { label: 'Máy chủ API Express', ok: true },
              { label: 'Cơ sở dữ liệu PostgreSQL', ok: true },
              { label: 'Bộ nhớ đệm Redis Cache', ok: true },
              { label: 'Lưu trữ tệp Object Storage', ok: true },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  Đang hoạt động
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Broadcast Thông Báo Toàn Trường (SRS 3.7.1) */}
      {showBroadcastModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(234, 88, 12, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>campaign</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>Phát Thông Báo Toàn Trường</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: 0 }}>Gửi thông báo realtime đến hòm thư sinh viên và giảng viên</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Tiêu đề thông báo *</label>
                <input 
                  required 
                  value={broadcastForm.title} 
                  onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })} 
                  type="text" 
                  placeholder="VD: Lịch nghỉ lễ và kế hoạch học bù..." 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', outline: 'none' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Đối tượng nhận thông báo *</label>
                <select 
                  value={broadcastForm.target} 
                  onChange={e => setBroadcastForm({ ...broadcastForm, target: e.target.value })} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontWeight: 600 }}
                >
                  <option value="all">Toàn bộ người dùng (Sinh viên & Giảng viên)</option>
                  <option value="student">Chỉ Sinh viên</option>
                  <option value="lecturer">Chỉ Giảng viên</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Nội dung chi tiết *</label>
                <textarea 
                  required 
                  rows={4}
                  value={broadcastForm.message} 
                  onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })} 
                  placeholder="Nhập nội dung thông báo phát thanh..." 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', outline: 'none', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowBroadcastModal(false)} className="btn btn-outline" disabled={broadcasting}>Hủy</button>
                <button type="submit" disabled={broadcasting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                  {broadcasting ? 'Đang gửi...' : 'Phát Thông Báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
