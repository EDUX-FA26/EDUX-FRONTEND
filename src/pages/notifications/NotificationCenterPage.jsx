import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, MessageCircle, RefreshCw, ShieldCheck, Sparkles, Star, XCircle } from 'lucide-react';
import { getDashboardNotifications } from '../../services/dashboard.service';

const kind = (item) => String(item?.type || item?.category || '').toLowerCase();

export default function NotificationCenterPage() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true); setError('');
      const result = await getDashboardNotifications();
      setItems(result?.notifications || result?.data?.notifications || []);
      setUnreadCount(result?.unreadCount || result?.data?.unreadCount || 0);
    } catch (err) { setError(err.response?.data?.message || 'Không thể tải thông báo.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => items.filter((item) => {
    if (filter === 'unread') return !item.is_read && !item.read_at;
    if (filter === 'forum') return ['forum', 'comment', 'reply', 'post'].some((value) => kind(item).includes(value));
    if (filter === 'flashcard') return kind(item).includes('flash');
    return true;
  }), [items, filter]);

  const iconFor = (item) => kind(item).includes('flash') ? <Sparkles size={19} /> : kind(item).includes('forum') || kind(item).includes('comment') || kind(item).includes('reply') ? <MessageCircle size={19} /> : <Bell size={19} />;
  return <main style={pageStyle}>
    <section style={hero}><div><span style={eyebrow}>● EDUX FORUM CENTER • FALL 2025</span><h1 style={title}>Trung tâm thông báo</h1><p style={subtitle}>Theo dõi các cập nhật học tập, diễn đàn và FlashCard của bạn.</p></div><div style={status}><span style={statusDot} /> Đồng bộ hóa tức thì</div></section>
    <div style={columns}>
      <section style={panel}><div style={panelHeader}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={21} color="var(--color-primary)" /><h2 style={heading}>Thông báo diễn đàn &amp; học tập</h2><span style={newCount}>{unreadCount} mới</span></div><button type="button" style={textButton}><CheckCheck size={16} /> Đánh dấu tất cả đã đọc</button></div><div style={tabs}>{[['all', 'Tất cả'], ['unread', `Chưa đọc (${unreadCount})`], ['forum', 'Diễn đàn'], ['flashcard', 'Flashcard']].map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} style={{ ...tab, ...(filter === value ? activeTab : {}) }}>{label}</button>)}</div>{error && <div style={errorBox}>{error}<button type="button" style={retry} onClick={load}><RefreshCw size={14} /> Thử lại</button></div>}{loading ? <div style={empty}>Đang tải thông báo...</div> : visible.length === 0 ? <div style={empty}><XCircle size={32} /><strong>Chưa có thông báo phù hợp</strong><span>Mọi cập nhật mới sẽ hiển thị tại đây.</span></div> : <div style={list}>{visible.map((item, index) => <article key={item.id || index} style={{ ...notification, ...(item.is_read || item.read_at ? {} : unread) }}><div style={notificationIcon}>{iconFor(item)}</div><div style={{ flex: 1, minWidth: 0 }}><div style={meta}><span style={badge}>{kind(item).includes('flash') ? 'Flashcard mới' : kind(item).includes('forum') || kind(item).includes('comment') ? 'Diễn đàn' : 'Hệ thống'}</span><span>{item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : 'Vừa cập nhật'}</span></div><p style={message}>{item.message || item.title || 'Bạn có một thông báo mới.'}</p>{item.description && <p style={description}>{item.description}</p>}</div>{!(item.is_read || item.read_at) && <span style={unreadDot} />}</article>)}</div>}</section>
      <aside style={side}><div style={sideCard}><h3 style={sideHeading}><ShieldCheck size={18} /> Trạng thái hệ thống</h3><div style={okLine}><span style={statusDot} /> Hệ thống đang hoạt động</div><p style={sideText}>Thông báo được cập nhật tự động khi có bài đăng, bình luận hoặc FlashCard mới.</p></div><div style={sideCard}><h3 style={sideHeading}><Star size={18} /> Mẹo sử dụng</h3><p style={sideText}>Bấm vào thông báo để mở nhanh nội dung liên quan.</p><p style={sideText}>Bạn có thể lọc riêng thông báo diễn đàn và Flashcard.</p></div></aside>
    </div>
  </main>;
}

const pageStyle = { minHeight: '100vh', padding: '28px 32px 80px', background: 'var(--color-bg)', color: 'var(--color-ink)' };
const hero = { maxWidth: 1400, margin: '0 auto 22px', borderRadius: 16, padding: '28px 32px', color: '#fff', background: 'linear-gradient(120deg,#101a31 0%,#162c4c 60%,#3a3349 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, boxShadow: '0 10px 28px rgba(20,30,48,.18)' };
const eyebrow = { display: 'inline-block', borderRadius: 999, padding: '6px 11px', background: 'rgba(255,255,255,.12)', fontSize: 12, fontWeight: 800, letterSpacing: '.04em' };
const title = { margin: '14px 0 6px', fontSize: 34, color: '#fff' }; const subtitle = { margin: 0, color: 'rgba(255,255,255,.78)' }; const status = { padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,.1)', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 700 }; const statusDot = { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#27c878', marginRight: 7 };
const columns = { maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 290px', gap: 20, alignItems: 'start' }; const panel = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }; const panelHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 18, background: 'var(--color-primary-card)' }; const heading = { margin: 0, fontSize: 18 }; const newCount = { borderRadius: 999, padding: '3px 8px', background: '#ffe1db', color: '#aa3000', fontSize: 11, fontWeight: 800 }; const textButton = { border: 0, background: 'transparent', color: 'var(--color-primary-dark)', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontWeight: 700 }; const tabs = { display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }; const tab = { border: 0, borderRadius: 999, padding: '7px 12px', background: 'var(--color-primary-card)', color: 'var(--color-ink-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }; const activeTab = { background: 'var(--color-primary)', color: '#fff' }; const list = { maxHeight: 560, overflowY: 'auto' }; const notification = { position: 'relative', display: 'flex', gap: 12, padding: 16, borderBottom: '1px solid var(--color-border)' }; const unread = { background: 'rgba(170,48,0,.045)' }; const notificationIcon = { width: 40, height: 40, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-dark)', background: 'var(--color-primary-card)', flexShrink: 0 }; const meta = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 12, color: 'var(--color-ink-muted)' }; const badge = { borderRadius: 6, padding: '3px 7px', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', fontWeight: 800 }; const message = { margin: 0, lineHeight: 1.5 }; const description = { margin: '5px 0 0', color: 'var(--color-ink-muted)', fontSize: 13 }; const unreadDot = { width: 9, height: 9, borderRadius: '50%', background: 'var(--color-primary)', position: 'absolute', right: 16, top: 22 }; const side = { display: 'flex', flexDirection: 'column', gap: 16 }; const sideCard = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 18, boxShadow: 'var(--shadow-md)' }; const sideHeading = { margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 7, fontSize: 16 }; const okLine = { padding: '9px 10px', borderRadius: 9, background: 'var(--color-primary-card)', fontSize: 13, fontWeight: 700 }; const sideText = { color: 'var(--color-ink-muted)', lineHeight: 1.6, fontSize: 13 }; const empty = { minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-ink-muted)' }; const errorBox = { margin: 16, padding: 12, borderRadius: 9, background: '#fff1f0', color: '#b42318', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }; const retry = { border: 0, background: 'transparent', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' };
