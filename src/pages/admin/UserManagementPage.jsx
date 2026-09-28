import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUsers, createUser, toggleUserStatus } from '../../services/admin.service';

function UserRow({ user: u, onToggleStatus }) {
  const isSuspended = u.is_active === false;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)', opacity: isSuspended ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: u.role === 'student' ? '#fff1e7' : (u.role === 'admin' ? '#f3e8ff' : 'var(--color-accent-teal-light)'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: u.role === 'student' ? 'var(--color-primary)' : (u.role === 'admin' ? '#7c3aed' : 'var(--color-accent-teal)') }}>
            {u.role === 'student' ? 'school' : (u.role === 'admin' ? 'shield' : 'person_book')}
          </span>
        </div>
        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 2px' }}>
            {u.full_name || '—'} {isSuspended && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>(Bị đình chỉ)</span>}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>{u.email}</p>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <span className={`badge ${u.role === 'student' ? 'badge-orange' : (u.role === 'admin' ? 'badge-purple' : 'badge-teal')}`} style={u.role === 'admin' ? { background: '#f3e8ff', color: '#7c3aed' } : {}}>
            {u.role}
          </span>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>{new Date(u.created_at || Date.now()).toLocaleDateString('vi-VN')}</p>
        </div>
        
        {u.role !== 'admin' && (
          <button 
            onClick={() => onToggleStatus(u.id, !isSuspended)}
            style={{
              background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px',
              padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              color: isSuspended ? '#10b981' : '#ef4444',
              transition: 'background 0.2s'
            }}
            title={isSuspended ? "Mở khóa tài khoản" : "Đình chỉ tài khoản"}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isSuspended ? 'lock_open' : 'block'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', full_name: '', password: '', role: 'student' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    getUsers()
      .then((res) => setUsers(res.data || []))
      .catch((err) => { 
        setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
        setUsers([
          { id: 1, full_name: 'Nguyễn Văn A', email: 'nva@edu.vn', role: 'student', is_active: true, created_at: new Date() },
          { id: 2, full_name: 'Trần Thị B', email: 'ttb@edu.vn', role: 'lecturer', is_active: false, created_at: new Date() },
          { id: 3, full_name: 'Lê Quản Trị', email: 'admin@edu.vn', role: 'admin', is_active: true, created_at: new Date() },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, suspend) => {
    if (!window.confirm(`Bạn có chắc muốn ${suspend ? 'đình chỉ' : 'mở khóa'} tài khoản này?`)) return;
    try {
      await toggleUserStatus(id, suspend);
      setUsers(users.map(u => u.id === id ? { ...u, is_active: !suspend } : u));
      alert(`${suspend ? 'Đình chỉ' : 'Mở khóa'} tài khoản thành công!`);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái!");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await createUser(formData);
      alert("Tạo người dùng thành công!");
      setShowModal(false);
      setFormData({ email: '', full_name: '', password: '', role: 'student' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi tạo người dùng");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
            Quản lý Người dùng
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
            Danh sách tất cả người dùng trong hệ thống
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
          Thêm Người Dùng
        </button>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '200px', height: '12px' }} />
              </div>
            </div>
          ))
        ) : error && users.length === 0 ? (
          <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#ef4444', textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <div>
            {users.map(u => <UserRow key={u.id} user={u} onToggleStatus={handleToggleStatus} />)}
          </div>
        )}
      </div>

      {/* Modal Thêm Người Dùng */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', color: 'var(--color-ink)' }}>Thêm Người Dùng Mới</h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px', display: 'block' }}>Họ và tên</label>
                <input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} type="text" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px', display: 'block' }}>Email</label>
                <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px', display: 'block' }}>Mật khẩu</label>
                <input required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} type="password" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px', display: 'block' }}>Vai trò</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }}>
                  <option value="student">Sinh viên</option>
                  <option value="lecturer">Giảng viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary">{formLoading ? 'Đang tạo...' : 'Tạo Tài Khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
