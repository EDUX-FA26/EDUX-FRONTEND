import React, { useState, useEffect } from 'react';
import { broadcastNotification, getSystemNotifications } from '../../services/admin.service';

export default function AdminNotificationsPage() {
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', target: 'all' });
  const [broadcasting, setBroadcasting] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', alignItems: 'start' }}>
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }} className="no-scrollbar">
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
              notifications.map((notif, idx) => (
                <div key={idx} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-primary-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>{notif.title}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{new Date(notif.created_at).toLocaleDateString('vi-VN')} {new Date(notif.created_at).toLocaleTimeString('vi-VN')}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-soft)', margin: 0, lineHeight: 1.5 }}>{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
