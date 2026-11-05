import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { broadcastNotification, getSystemNotifications } from '../../services/admin.service';

/* ───────────── Helpers ───────────── */

// Khoá ngày theo giờ địa phương (YYYY-MM-DD) để gom thông báo cùng ngày.
const dayKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const notifId = (n) => `${n.created_at}|${n.title}`;
const pad = (n) => String(n).padStart(2, '0');
const formatTime = (v) => new Date(v).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const formatFullDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const weekdayOf = (d) => d.toLocaleDateString('vi-VN', { weekday: 'long' });

const daysAgo = (d) => {
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - d) / 86400000);
};
const dayLabel = (key) => {
  const diff = daysAgo(parseKey(key));
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  return `${pad(parseKey(key).getDate())}/${pad(parseKey(key).getMonth() + 1)}`;
};
const relativeTime = (v) => {
  const sec = Math.max(0, Math.round((Date.now() - new Date(v).getTime()) / 1000));
  if (sec < 60) return 'Vừa xong';
  if (sec < 3600) return `${Math.floor(sec / 60)} phút trước`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} giờ trước`;
  if (sec < 7 * 86400) return `${Math.floor(sec / 86400)} ngày trước`;
  return formatFullDate(new Date(v));
};
const partOfDay = (v) => {
  const h = new Date(v).getHours();
  if (h < 12) return 'Buổi sáng';
  if (h < 18) return 'Buổi chiều';
  return 'Buổi tối';
};
const isLong = (text) => (text || '').length > 150 || (text || '').split('\n').length > 3;

/* ───────────── Inline SVG icons (không phụ thuộc font icon) ───────────── */

const Svg = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IconClose = (p) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
const IconLeft = (p) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>;
const IconRight = (p) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>;
const IconCopy = (p) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></Svg>;
const IconCheck = (p) => <Svg {...p}><path d="m5 12 5 5L20 7" /></Svg>;
const IconClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;

/* ───────────── Styles (scoped bằng tiền tố nt-) ───────────── */

const STYLES = `
@keyframes nt-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes nt-pop { from { opacity: 0; transform: translateY(18px) scale(.96) } to { opacity: 1; transform: none } }
@keyframes nt-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes nt-from-right { from { opacity: 0; transform: translateX(32px) } to { opacity: 1; transform: none } }
@keyframes nt-from-left { from { opacity: 0; transform: translateX(-32px) } to { opacity: 1; transform: none } }
@keyframes nt-ping { 0% { box-shadow: 0 0 0 0 rgba(242,112,36,.5) } 100% { box-shadow: 0 0 0 11px rgba(242,112,36,0) } }

/* Danh sách lịch sử */
.nt-hist { position: relative; display: flex; gap: 14px; align-items: flex-start; width: 100%; text-align: left; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--color-border); background: var(--color-primary-bg); cursor: pointer; font: inherit; color: inherit; transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease; animation: nt-rise .35s ease both; }
.nt-hist:hover, .nt-hist:focus-visible { transform: translateY(-2px); border-color: var(--color-primary); background: #fff; box-shadow: 0 10px 24px -10px rgba(160,65,0,.35); outline: none; }
.nt-hist:focus-visible { box-shadow: 0 0 0 3px var(--color-primary-light); }
.nt-tile-sm { flex: 0 0 auto; width: 48px; border-radius: 12px; overflow: hidden; text-align: center; background: #fff; border: 1px solid var(--color-border); }
.nt-tile-sm b { display: block; background: var(--color-primary); color: #fff; font-size: 9.5px; letter-spacing: .08em; padding: 3px 0; font-weight: 700; }
.nt-tile-sm span { display: block; font-size: 1.15rem; font-weight: 800; color: var(--color-ink); padding: 4px 0 5px; line-height: 1.1; }
.nt-hist-chev { flex: 0 0 auto; align-self: center; color: var(--color-primary); opacity: 0; transform: translateX(-6px); transition: opacity .18s ease, transform .18s ease; }
.nt-hist:hover .nt-hist-chev, .nt-hist:focus-visible .nt-hist-chev { opacity: 1; transform: none; }
.nt-more { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; padding: 2px 10px; font-size: 11.5px; font-weight: 700; color: var(--color-primary-dark); background: var(--color-primary-light); border-radius: 999px; }

/* Modal */
.nt-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(23, 15, 8, .62); backdrop-filter: blur(6px); animation: nt-fade .2s ease both; }
.nt-panel { width: 100%; max-width: 680px; max-height: min(88vh, 780px); display: flex; flex-direction: column; background: var(--color-surface, #fff); border-radius: 24px; overflow: hidden; box-shadow: 0 40px 80px -24px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.08); animation: nt-pop .32s cubic-bezier(.2,.9,.3,1.1) both; outline: none; }
.nt-head { position: relative; display: flex; align-items: center; gap: 18px; padding: 24px 24px 22px; color: #fff; background: radial-gradient(120% 140% at 0% 0%, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 55%), linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); }
.nt-tile { flex: 0 0 auto; width: 76px; border-radius: 18px; overflow: hidden; text-align: center; background: #fff; color: var(--color-ink); box-shadow: 0 10px 24px -8px rgba(0,0,0,.4); }
.nt-tile b { display: block; background: rgba(0,0,0,.14); font-size: 10.5px; letter-spacing: .12em; padding: 5px 0; font-weight: 800; color: var(--color-primary-dark); background: var(--color-primary-light); }
.nt-tile span { display: block; font-size: 2.1rem; font-weight: 800; line-height: 1; padding: 8px 0 4px; }
.nt-tile i { display: block; font-style: normal; font-size: 10.5px; font-weight: 600; color: var(--color-ink-muted); padding-bottom: 8px; }
.nt-head-main { min-width: 0; flex: 1; }
.nt-head h2 { margin: 0; font-size: 1.35rem; font-weight: 800; line-height: 1.2; text-transform: capitalize; letter-spacing: -.01em; }
.nt-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.nt-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.28); }
.nt-icon-btn { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 12px; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.16); color: #fff; cursor: pointer; transition: background .15s ease, transform .15s ease, opacity .15s ease; }
.nt-icon-btn:hover:not(:disabled) { background: rgba(255,255,255,.3); transform: scale(1.06); }
.nt-icon-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.nt-icon-btn:disabled { opacity: .35; cursor: not-allowed; }
.nt-head-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; align-self: stretch; justify-content: space-between; }
.nt-nav { display: flex; gap: 6px; }

/* Dải ngày */
.nt-strip { display: flex; gap: 8px; padding: 12px 20px; overflow-x: auto; border-bottom: 1px solid var(--color-border); background: var(--color-primary-bg); scrollbar-width: none; }
.nt-strip::-webkit-scrollbar { display: none; }
.nt-pill { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--color-border); background: #fff; color: var(--color-ink-muted); font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all .15s ease; }
.nt-pill:hover { border-color: var(--color-primary); color: var(--color-primary-dark); }
.nt-pill[aria-current="true"] { background: var(--color-primary); border-color: var(--color-primary); color: #fff; box-shadow: 0 6px 14px -6px rgba(242,112,36,.7); }
.nt-pill em { font-style: normal; min-width: 20px; padding: 0 6px; text-align: center; border-radius: 999px; font-size: 11px; line-height: 18px; background: var(--color-primary-light); color: var(--color-primary-dark); }
.nt-pill[aria-current="true"] em { background: rgba(255,255,255,.28); color: #fff; }

/* Timeline */
.nt-body { flex: 1; overflow-y: auto; padding: 22px 24px 8px; scroll-behavior: smooth; }
.nt-body.from-right { animation: nt-from-right .3s ease both; }
.nt-body.from-left { animation: nt-from-left .3s ease both; }
.nt-row { display: grid; grid-template-columns: 74px 22px 1fr; column-gap: 8px; animation: nt-rise .4s ease both; }
.nt-time { text-align: right; padding-top: 14px; }
.nt-time strong { display: block; font-size: 14px; font-weight: 800; color: var(--color-ink); font-variant-numeric: tabular-nums; }
.nt-time small { font-size: 11px; color: var(--color-ink-muted); }
.nt-rail { position: relative; display: flex; justify-content: center; }
.nt-rail::before { content: ""; position: absolute; top: 0; bottom: 0; width: 2px; background: linear-gradient(var(--color-primary-light), var(--color-border)); }
.nt-row:first-child .nt-rail::before { top: 22px; }
.nt-row:last-child .nt-rail::before { bottom: calc(100% - 22px); }
.nt-dot { position: relative; z-index: 1; margin-top: 16px; width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 3px solid var(--color-primary); }
.nt-row.is-focus .nt-dot { background: var(--color-primary); animation: nt-ping 1.6s ease-out 3; }
.nt-item { margin: 0 0 16px; padding: 16px 18px; border-radius: 16px; border: 1px solid var(--color-border); background: #fff; transition: box-shadow .2s ease, border-color .2s ease, transform .2s ease; }
.nt-item:hover { border-color: var(--color-primary-light); box-shadow: 0 12px 28px -16px rgba(160,65,0,.45); transform: translateY(-1px); }
.nt-row.is-focus .nt-item { border-color: var(--color-primary); background: linear-gradient(180deg, var(--color-primary-bg), #fff); box-shadow: 0 0 0 3px var(--color-primary-light); }
.nt-item-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.nt-item h3 { margin: 0; font-size: 1rem; font-weight: 800; color: var(--color-ink); line-height: 1.35; }
.nt-tag { display: inline-block; margin-bottom: 6px; padding: 2px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--color-primary-dark); background: var(--color-primary-light); }
.nt-msg { margin: 10px 0 0; font-size: .9rem; line-height: 1.65; color: var(--color-ink-soft, #584238); white-space: pre-wrap; word-break: break-word; }
.nt-msg.clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.nt-item-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; }
.nt-link { padding: 0; border: 0; background: none; font: inherit; font-size: 12.5px; font-weight: 700; color: var(--color-primary); cursor: pointer; }
.nt-link:hover { text-decoration: underline; }
.nt-copy { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 5px 10px; border-radius: 10px; border: 1px solid var(--color-border); background: #fff; color: var(--color-ink-muted); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s ease; }
.nt-copy:hover { border-color: var(--color-primary); color: var(--color-primary-dark); }
.nt-copy.done { border-color: #10b981; color: #047857; background: #ecfdf5; }
.nt-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 24px; border-top: 1px solid var(--color-border); background: var(--color-primary-bg); font-size: 12px; color: var(--color-ink-muted); }
.nt-foot kbd { padding: 1px 7px; border-radius: 6px; border: 1px solid var(--color-border-medium, #e0c0b2); border-bottom-width: 2px; background: #fff; font: 600 11px/1.6 inherit; color: var(--color-ink); }

@media (max-width: 560px) {
  .nt-overlay { padding: 0; align-items: flex-end; }
  .nt-panel { max-width: none; max-height: 92vh; border-radius: 24px 24px 0 0; }
  .nt-head { padding: 18px 16px; gap: 12px; }
  .nt-tile { width: 62px; }
  .nt-tile span { font-size: 1.7rem; }
  .nt-head h2 { font-size: 1.1rem; }
  .nt-body { padding: 18px 14px 4px; }
  .nt-row { grid-template-columns: 52px 18px 1fr; column-gap: 4px; }
  .nt-foot .nt-hint { display: none; }
  .nt-chip-extra { display: none; }
  .nt-time small { display: block; font-size: 10px; line-height: 1.3; }
}
@media (prefers-reduced-motion: reduce) {
  .nt-overlay, .nt-panel, .nt-body, .nt-row, .nt-hist, .nt-row.is-focus .nt-dot { animation: none !important; }
  .nt-hist, .nt-item, .nt-icon-btn, .nt-pill, .nt-hist-chev { transition: none !important; }
  .nt-body { scroll-behavior: auto; }
}
`;

export default function AdminNotificationsPage() {
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', target: 'all' });
  const [broadcasting, setBroadcasting] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal xem thông báo theo ngày: { day: 'YYYY-MM-DD', focusId } | null
  const [open, setOpen] = useState(null);
  const [dir, setDir] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
  const [copiedId, setCopiedId] = useState(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await getSystemNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Gom thông báo theo ngày (mới → cũ trong ngày; dải ngày sắp xếp cũ → mới).
  const { byDay, daysAsc } = useMemo(() => {
    const map = new Map();
    notifications.forEach((n) => {
      const key = dayKey(n.created_at);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    });
    map.forEach((list) => list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    return { byDay: map, daysAsc: [...map.keys()].sort() };
  }, [notifications]);

  const openDay = (notif, el) => {
    const key = dayKey(notif.created_at);
    if (!key) return;
    triggerRef.current = el || null;
    setDir('');
    setOpen({ day: key, focusId: notifId(notif) });
  };

  const closeModal = useCallback(() => {
    setOpen(null);
    setExpanded(new Set());
    if (triggerRef.current && document.contains(triggerRef.current)) triggerRef.current.focus();
  }, []);

  const dayIndex = open ? daysAsc.indexOf(open.day) : -1;
  const goTo = useCallback((index) => {
    if (index < 0 || index >= daysAsc.length) return;
    setDir(index > dayIndex ? 'from-right' : 'from-left');
    setOpen({ day: daysAsc[index], focusId: null });
  }, [daysAsc, dayIndex]);

  // Phím tắt: Esc đóng, ←/→ chuyển ngày. Khoá cuộn nền khi modal mở.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') goTo(dayIndex - 1);
      else if (e.key === 'ArrowRight') goTo(dayIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dayIndex, goTo, closeModal]);

  // Đưa focus vào modal; cuộn tới thông báo vừa bấm; giữ dải ngày luôn thấy ngày đang chọn.
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    if (!panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
    const target = panel.querySelector('[data-focus="true"]');
    if (target) target.scrollIntoView({ block: 'center' });
    const pill = panel.querySelector('.nt-pill[aria-current="true"]');
    if (pill) pill.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [open]);

  const toggleExpand = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const copyNotif = async (n) => {
    try {
      await navigator.clipboard.writeText(`${n.title}\n\n${n.message}`);
      setCopiedId(notifId(n));
      setTimeout(() => setCopiedId((cur) => (cur === notifId(n) ? null : cur)), 1600);
    } catch (err) {
      console.error('Không thể sao chép:', err);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      await broadcastNotification({
        ...broadcastForm,
        type: 'system_announcement'
      });
      alert('Đã gửi thông báo toàn hệ thống!');
      setBroadcastForm({ title: '', message: '', target: 'all' });
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gửi thông báo');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{STYLES}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
            Quản Lý Thông Báo
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
            Phát thông báo hệ thống và xem lịch sử các thông báo đã gửi
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Cột 1: Form tạo thông báo */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>campaign</span>
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>Thông Báo Mới</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: '4px 0 0' }}>Gửi tin nhắn broadcast đến người dùng</p>
            </div>
          </div>

          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px', display: 'block' }}>Tiêu đề thông báo</label>
              <input 
                required 
                value={broadcastForm.title} 
                onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} 
                type="text" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: '0.9375rem' }} 
                placeholder="Ví dụ: Lịch bảo trì hệ thống cuối tuần" 
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px', display: 'block' }}>Đối tượng nhận</label>
              <select 
                value={broadcastForm.target} 
                onChange={e => setBroadcastForm({...broadcastForm, target: e.target.value})} 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: '0.9375rem' }}
              >
                <option value="all">Tất cả người dùng</option>
                <option value="student">Chỉ Sinh viên</option>
                <option value="lecturer">Chỉ Giảng viên</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px', display: 'block' }}>Nội dung chi tiết</label>
              <textarea 
                required 
                value={broadcastForm.message} 
                onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} 
                rows="6" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: '0.9375rem', resize: 'vertical' }} 
                placeholder="Nhập nội dung thông báo..." 
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button 
                type="submit" 
                disabled={broadcasting} 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '0.9375rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                {broadcasting ? 'Đang gửi...' : 'Phát Thông Báo'}
              </button>
            </div>
          </form>
        </div>

        {/* Cột 2: Lịch sử thông báo */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-ink-muted)' }}>history</span>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>Lịch Sử Đã Gửi</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', padding: '4px' }} className="no-scrollbar">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '4px' }} />
                  <div className="skeleton" style={{ width: '80%', height: '14px' }} />
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>inbox</span>
                <p style={{ fontSize: '0.875rem' }}>Chưa có thông báo nào được gửi.</p>
              </div>
            ) : (
              notifications.map((notif, idx) => {
                const key = dayKey(notif.created_at);
                const d = key ? parseKey(key) : null;
                const sameDay = key ? byDay.get(key).length : 1;
                return (
                  <button
                    key={notifId(notif) + idx}
                    type="button"
                    className="nt-hist"
                    style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                    title="Xem tất cả thông báo trong ngày"
                    onClick={(e) => openDay(notif, e.currentTarget)}
                  >
                    {d && (
                      <span className="nt-tile-sm" aria-hidden="true">
                        <b>THG {d.getMonth() + 1}</b>
                        <span>{pad(d.getDate())}</span>
                      </span>
                    )}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-ink)' }}>{notif.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }} title={`${new Date(notif.created_at).toLocaleDateString('vi-VN')} ${new Date(notif.created_at).toLocaleTimeString('vi-VN')}`}>
                          {relativeTime(notif.created_at)}
                        </span>
                      </span>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.875rem', color: 'var(--color-ink-soft)', lineHeight: 1.5 }}>
                        {notif.message}
                      </span>
                      {sameDay > 1 && <span className="nt-more">+{sameDay - 1} thông báo khác trong ngày</span>}
                    </span>
                    <span className="nt-hist-chev" aria-hidden="true"><IconRight size={20} /></span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {open && byDay.has(open.day) && createPortal(
        <div className="nt-overlay" onClick={closeModal}>
          <div
            ref={panelRef}
            className="nt-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nt-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const date = parseKey(open.day);
              const items = byDay.get(open.day);
              const first = items[items.length - 1];
              const last = items[0];
              return (
                <>
                  <div className="nt-head">
                    <div className="nt-tile" aria-hidden="true">
                      <b>THG {date.getMonth() + 1}</b>
                      <span>{pad(date.getDate())}</span>
                      <i>{date.getFullYear()}</i>
                    </div>
                    <div className="nt-head-main">
                      <h2 id="nt-title">{weekdayOf(date)}, {formatFullDate(date)}</h2>
                      <div className="nt-chips">
                        <span className="nt-chip">{items.length} thông báo</span>
                        <span className="nt-chip">
                          <IconClock size={14} />
                          {items.length > 1 ? `${formatTime(first.created_at)} – ${formatTime(last.created_at)}` : formatTime(first.created_at)}
                        </span>
                        <span className="nt-chip nt-chip-extra">{dayLabel(open.day)}</span>
                      </div>
                    </div>
                    <div className="nt-head-actions">
                      <button type="button" className="nt-icon-btn" aria-label="Đóng" title="Đóng (Esc)" onClick={closeModal}>
                        <IconClose size={18} />
                      </button>
                      <div className="nt-nav">
                        <button type="button" className="nt-icon-btn" aria-label="Ngày trước" title="Ngày trước (←)" disabled={dayIndex <= 0} onClick={() => goTo(dayIndex - 1)}>
                          <IconLeft size={18} />
                        </button>
                        <button type="button" className="nt-icon-btn" aria-label="Ngày sau" title="Ngày sau (→)" disabled={dayIndex >= daysAsc.length - 1} onClick={() => goTo(dayIndex + 1)}>
                          <IconRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {daysAsc.length > 1 && (
                    <div className="nt-strip" role="tablist" aria-label="Chọn ngày">
                      {daysAsc.map((k, i) => (
                        <button
                          key={k}
                          type="button"
                          role="tab"
                          className="nt-pill"
                          aria-current={k === open.day}
                          aria-selected={k === open.day}
                          onClick={() => goTo(i)}
                        >
                          {dayLabel(k)}
                          <em>{byDay.get(k).length}</em>
                        </button>
                      ))}
                    </div>
                  )}

                  <div key={open.day} className={`nt-body ${dir}`}>
                    {items.map((n, i) => {
                      const id = notifId(n);
                      const isFocus = id === open.focusId;
                      const long = isLong(n.message);
                      const isOpen = expanded.has(id);
                      return (
                        <div
                          key={id + i}
                          className={`nt-row${isFocus ? ' is-focus' : ''}`}
                          data-focus={isFocus ? 'true' : undefined}
                          style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
                        >
                          <div className="nt-time">
                            <strong>{formatTime(n.created_at)}</strong>
                            <small>{partOfDay(n.created_at)}</small>
                          </div>
                          <div className="nt-rail"><span className="nt-dot" /></div>
                          <article className="nt-item">
                            <div className="nt-item-top">
                              <div>
                                {isFocus && <span className="nt-tag">Bạn vừa chọn</span>}
                                <h3>{n.title}</h3>
                              </div>
                            </div>
                            <p className={`nt-msg${long && !isOpen ? ' clamp' : ''}`}>{n.message}</p>
                            <div className="nt-item-foot">
                              {long && (
                                <button type="button" className="nt-link" onClick={() => toggleExpand(id)}>
                                  {isOpen ? 'Thu gọn' : 'Xem thêm'}
                                </button>
                              )}
                              <button type="button" className={`nt-copy${copiedId === id ? ' done' : ''}`} onClick={() => copyNotif(n)}>
                                {copiedId === id ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                {copiedId === id ? 'Đã sao chép' : 'Sao chép'}
                              </button>
                            </div>
                          </article>
                        </div>
                      );
                    })}
                  </div>

                  <div className="nt-foot">
                    <span>Ngày {dayIndex + 1}/{daysAsc.length} có thông báo</span>
                    <span className="nt-hint"><kbd>←</kbd> <kbd>→</kbd> chuyển ngày · <kbd>Esc</kbd> đóng</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}