import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  importUsers
} from '../../services/admin.service';

function UserRow({ user: u, onEdit, onToggleStatus }) {
  const isSuspended = u.is_active === false;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--color-border)', opacity: isSuspended ? 0.65 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: u.role === 'student' ? '#fff1e7' : (u.role === 'admin' ? '#f3e8ff' : 'var(--color-accent-teal-light)'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: u.role === 'student' ? 'var(--color-primary)' : (u.role === 'admin' ? '#7c3aed' : 'var(--color-accent-teal)') }}>
            {u.role === 'student' ? 'school' : (u.role === 'admin' ? 'shield' : 'person_book')}
          </span>
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 2px' }}>
            {u.full_name || '—'} {u.student_code && <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 500 }}>({u.student_code})</span>} {isSuspended && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>• Bị tạm khóa</span>}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>{u.email}</p>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div>
          <span className={`badge ${u.role === 'student' ? 'badge-orange' : (u.role === 'admin' ? 'badge-purple' : 'badge-teal')}`} style={u.role === 'admin' ? { background: '#f3e8ff', color: '#7c3aed' } : {}}>
            {u.role === 'student' ? 'Sinh viên' : (u.role === 'lecturer' ? 'Giảng viên' : 'Quản trị viên')}
          </span>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>{new Date(u.created_at || Date.now()).toLocaleDateString('vi-VN')}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Nút Chỉnh sửa User (SRS 3.7.6) */}
          <button 
            type="button"
            onClick={() => onEdit(u)}
            style={{
              background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px',
              padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              color: 'var(--color-ink)', transition: 'all 0.2s'
            }}
            title="Chỉnh sửa thông tin"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>edit</span>
          </button>

          {/* Nút Khóa / Mở khóa User (SRS 3.7.6) */}
          {u.role !== 'admin' && (
            <button 
              type="button"
              onClick={() => onToggleStatus(u.id, !isSuspended, u.full_name || u.email)}
              style={{
                background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px',
                padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                color: isSuspended ? '#10b981' : '#ef4444',
                transition: 'all 0.2s'
              }}
              title={isSuspended ? "Kích hoạt lại tài khoản" : "Tạm khóa tài khoản"}
              onMouseEnter={(e) => e.currentTarget.style.background = isSuspended ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {isSuspended ? 'lock_open' : 'lock'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showGuide, setShowGuide] = useState(false);

  // Modal Create state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'student',
    student_code: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Modal Edit state (SRS 3.7.6)
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    email: '',
    full_name: '',
    role: 'student',
    student_code: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Import state (SRS 3.7.5)
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importedResult, setImportedResult] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    getUsers()
      .then((res) => setUsers(res.data || []))
      .catch((err) => { 
        setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Suspend / Activate User (SRS 3.7.6)
  const handleToggleStatus = async (id, suspend, name) => {
    const actionText = suspend ? 'tạm khóa' : 'kích hoạt lại';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản của "${name}"?\n(Người dùng bị tạm khóa sẽ không thể đăng nhập vào hệ thống).`)) return;
    try {
      await toggleUserStatus(id, suspend);
      setUsers(users.map(u => u.id === id ? { ...u, is_active: !suspend } : u));
      alert(`Đã ${actionText} tài khoản thành công!`);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái tài khoản!");
    }
  };

  // Create User Handler (SRS 3.7.5 / UC 86)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const payload = {
        email: createFormData.email.trim(),
        full_name: createFormData.full_name.trim(),
        password: createFormData.password,
        role: createFormData.role,
        student_code: createFormData.role === 'student' && createFormData.student_code ? createFormData.student_code.trim() : undefined,
      };
      await createUser(payload);
      alert("Tạo người dùng thành công!");
      setShowCreateModal(false);
      setCreateFormData({ email: '', full_name: '', password: '', role: 'student', student_code: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi tạo người dùng");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit User Modal (SRS 3.7.6)
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email || '',
      full_name: user.full_name || '',
      role: user.role || 'student',
      student_code: user.student_code || '',
    });
  };

  // Submit Edit User (SRS 3.7.6)
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    try {
      const payload = {
        email: editFormData.email.trim(),
        full_name: editFormData.full_name.trim(),
        role: editFormData.role,
        student_code: editFormData.role === 'student' && editFormData.student_code ? editFormData.student_code.trim() : null,
      };
      const res = await updateUser(editingUser.id, payload);
      const updated = res.data || { ...editingUser, ...payload };

      setUsers(prev => prev.map(u => (u.id === editingUser.id ? { ...u, ...updated } : u)));
      setEditingUser(null);
      alert("Cập nhật thông tin người dùng thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật thông tin người dùng");
    } finally {
      setEditLoading(false);
    }
  };

  // Import User List via Excel / CSV (SRS 3.7.5)
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = await importUsers(file);
      setImportedResult(res.data);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi import file Excel!");
    } finally {
      setImporting(false);
      e.target.value = null; // reset input
    }
  };

  // Filter & Search & Pagination logic (SRS 3.7.8)
  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && u.is_active !== false) || 
      (statusFilter === 'suspended' && u.is_active === false);
    const matchSearch = searchQuery === '' || 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.student_code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter, searchQuery]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
            Quản lý Người dùng
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
            Xem, phân quyền và quản lý tài khoản người dùng trong hệ thống ({users.length} tài khoản)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => setShowGuide(!showGuide)} 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--color-border)', background: 'transparent' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
            Mẫu file Import
          </button>

          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--color-border)', fontWeight: 600 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
            {importing ? 'Đang xử lý...' : 'Import User List'}
          </button>
          
          <button 
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
            Thêm Người Dùng
          </button>

          <button 
            type="button"
            onClick={fetchUsers} 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', padding: '10px', border: '1px solid var(--color-border)' }}
            title="Làm mới danh sách"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Guide Card (SRS 3.7.5) */}
      {showGuide && (
        <div className="card animate-fade-in" style={{ padding: '20px', background: 'rgba(234, 88, 12, 0.05)', border: '1px solid rgba(234, 88, 12, 0.2)', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">lightbulb</span> Cấu trúc File Import Danh Sách Người Dùng (.xlsx, .csv)
          </h3>
          <p style={{ color: 'var(--color-ink-muted)', marginBottom: '12px', fontSize: '0.875rem', lineHeight: '1.5' }}>
            Hệ thống hỗ trợ các cột tiêu đề ở dòng 1 (không phân biệt hoa thường/dấu). Mật khẩu tạm thời sẽ được tự động khởi tạo và hiển thị sau khi import:
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { col: 'Full Name / Họ và tên', req: true },
              { col: 'Email', req: true },
              { col: 'Role / Vai trò (student / lecturer)', req: true },
              { col: 'Student Code / MSSV', req: false },
              { col: 'Department ID / Khoa', req: false }
            ].map((item, idx) => (
              <span key={idx} style={{ padding: '6px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                {item.col} {item.req ? <strong style={{ color: '#ef4444' }}>*</strong> : <span style={{ color: 'var(--color-ink-muted)' }}>(tùy chọn)</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Table Card (SRS 3.7.8) */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-hover)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted)', fontSize: '20px' }}>search</span>
              <input 
                type="text" 
                placeholder="Tìm theo tên, email hoặc MSSV..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', outline: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="student">Sinh viên</option>
              <option value="lecturer">Giảng viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', outline: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="suspended">Bị tạm khóa</option>
            </select>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
            Hiển thị <strong>{filteredUsers.length}</strong> kết quả
          </div>
        </div>

        {/* List Content */}
        <div style={{ padding: '20px' }}>
          {loading ? (
            [1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)', marginBottom: '14px' }}>
                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '180px', height: '14px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ width: '220px', height: '12px' }} />
                </div>
              </div>
            ))
          ) : error && users.length === 0 ? (
            <div style={{ padding: '24px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px' }}>error</span>
              {error}
            </div>
          ) : (
            <div>
              {paginatedUsers.map(u => (
                <UserRow 
                  key={u.id} 
                  user={u} 
                  onEdit={handleOpenEdit}
                  onToggleStatus={handleToggleStatus} 
                />
              ))}
              {paginatedUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-ink-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, marginBottom: '12px' }}>person_off</span>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>Không tìm thấy người dùng nào phù hợp với bộ lọc.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination (SRS 3.7.8) */}
        {!loading && filteredUsers.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-hover)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
              Trang {currentPage} / {totalPages || 1}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-outline" 
                style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                Trước
              </button>
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          background: currentPage === page ? 'var(--color-primary)' : 'transparent',
                          color: currentPage === page ? 'white' : 'var(--color-ink)',
                          fontWeight: currentPage === page ? 700 : 500,
                          transition: 'all 0.2s'
                        }}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} style={{ padding: '4px', color: 'var(--color-ink-muted)' }}>...</span>;
                  }
                  return null;
                })}
              </div>
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-outline" 
                style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm Người Dùng (SRS 3.7.5 / UC 86) */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>Thêm Người Dùng Mới</h2>
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Họ và tên *</label>
                <input required value={createFormData.full_name} onChange={e => setCreateFormData({...createFormData, full_name: e.target.value})} type="text" placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Email đăng nhập *</label>
                <input required value={createFormData.email} onChange={e => setCreateFormData({...createFormData, email: e.target.value})} type="email" placeholder="user@edu.vn" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Mật khẩu khởi tạo *</label>
                <input required minLength={6} value={createFormData.password} onChange={e => setCreateFormData({...createFormData, password: e.target.value})} type="password" placeholder="Tối thiểu 6 ký tự" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Vai trò hệ thống *</label>
                <select value={createFormData.role} onChange={e => setCreateFormData({...createFormData, role: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontWeight: 600 }}>
                  <option value="student">Sinh viên (Student)</option>
                  <option value="lecturer">Giảng viên (Lecturer)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
              {createFormData.role === 'student' && (
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Mã số sinh viên (MSSV)</label>
                  <input value={createFormData.student_code} onChange={e => setCreateFormData({...createFormData, student_code: e.target.value})} type="text" placeholder="SE170001" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline" disabled={createLoading}>Hủy</button>
                <button type="submit" disabled={createLoading} className="btn btn-primary">{createLoading ? 'Đang tạo...' : 'Tạo Tài Khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Thông Tin User (SRS 3.7.6 / UC 87) */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
                Chỉnh Sửa Người Dùng
              </h2>
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Họ và tên *</label>
                <input required value={editFormData.full_name} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} type="text" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Email *</label>
                <input required value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} type="email" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Vai trò hệ thống *</label>
                <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontWeight: 600 }}>
                  <option value="student">Sinh viên (Student)</option>
                  <option value="lecturer">Giảng viên (Lecturer)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
              {editFormData.role === 'student' && (
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px', display: 'block' }}>Mã số sinh viên (MSSV)</label>
                  <input value={editFormData.student_code} onChange={e => setEditFormData({...editFormData, student_code: e.target.value})} type="text" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-outline" disabled={editLoading}>Hủy</button>
                <button type="submit" disabled={editLoading} className="btn btn-primary">{editLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kết Quả Import (SRS 3.7.5) */}
      {importedResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', color: 'var(--color-primary)' }}>Kết Quả Import Người Dùng</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--color-surface-hover)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{importedResult.importedUsers || 0}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)' }}>Tài khoản đã tạo thành công</div>
              </div>
              <div style={{ background: 'var(--color-surface-hover)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink-muted)' }}>{importedResult.skippedUsers || 0}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)' }}>Bản ghi bỏ qua (trùng lặp)</div>
              </div>
            </div>

            {importedResult.credentials?.length > 0 && (
              <section style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-ink)' }}>Mật khẩu tạm thời khởi tạo — chỉ hiển thị lần này</h3>
                <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '12px' }}>
                  Hãy sao lưu và bàn giao tài khoản an toàn cho người dùng. Đóng cửa sổ sẽ không thể xem lại mật khẩu này.
                </p>
                <div style={{ overflowX: 'auto', maxHeight: '260px', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface-hover)' }}>
                        <th style={{ padding: '10px' }}>Email</th>
                        <th style={{ padding: '10px' }}>Vai trò</th>
                        <th style={{ padding: '10px' }}>Mật khẩu tạm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedResult.credentials.map((credential) => (
                        <tr key={credential.email} style={{ borderTop: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '10px', fontSize: '0.875rem' }}>{credential.email}</td>
                          <td style={{ padding: '10px', fontSize: '0.875rem' }}>{credential.role}</td>
                          <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', userSelect: 'all', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>{credential.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {importedResult.results?.length > 0 && (
              <section>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-ink)' }}>Chi tiết xử lý từng dòng</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {importedResult.results.map((row) => (
                    <div key={`${row.row}-${row.email || 'invalid'}`} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--color-surface-hover)', fontSize: '0.875rem' }}>
                      Dòng {row.row}: {row.email || 'Không có email'} — {row.status === 'created' ? '✅ Đã tạo' : `⚠️ Bỏ qua: ${row.reason}`}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button onClick={() => setImportedResult(null)} className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
