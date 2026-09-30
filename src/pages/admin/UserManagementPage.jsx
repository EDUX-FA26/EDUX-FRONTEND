import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUsers, createUser, toggleUserStatus, importExcel } from '../../services/admin.service';
import { useRef } from 'react';

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
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importedResult, setImportedResult] = useState(null);

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = await importExcel(file);
      setImportedResult(res.data);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi import file Excel!");
    } finally {
      setImporting(false);
      e.target.value = null; // reset input
    }
  };

  // Filter & Search & Pagination logic
  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = searchQuery === '' || 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchQuery]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
            Quản lý Người dùng & Lớp học
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
            Danh sách tất cả người dùng trong hệ thống ({users.length})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--color-border)', fontWeight: 600 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
            {importing ? 'Đang Import...' : 'Import Excel'}
          </button>
          
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
            Thêm Người Dùng
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-hover)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted)', fontSize: '20px' }}>search</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tên hoặc email..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', outline: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="student">Chỉ Sinh viên</option>
              <option value="lecturer">Chỉ Giảng viên</option>
              <option value="admin">Chỉ Quản trị viên</option>
            </select>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
            Hiển thị {filteredUsers.length} kết quả
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
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
            <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px' }}>error</span>
              {error}
            </div>
          ) : (
            <div>
              {paginatedUsers.map(u => <UserRow key={u.id} user={u} onToggleStatus={handleToggleStatus} />)}
              {paginatedUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5, marginBottom: '12px' }}>person_off</span>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>Không tìm thấy người dùng nào phù hợp.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredUsers.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-hover)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
              Trang {currentPage} / {totalPages || 1}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
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

      {/* Modal Import Result */}
      {importedResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', color: 'var(--color-primary)' }}>Kết Quả Import & Xếp Lớp</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--color-surface-hover)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)' }}>{importedResult.importedUsers}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)' }}>Users đã xử lý</div>
              </div>
              <div style={{ background: 'var(--color-surface-hover)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)' }}>{importedResult.importedClasses}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)' }}>Lớp học tạo mới</div>
              </div>
              <div style={{ background: 'var(--color-surface-hover)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)' }}>{importedResult.importedMembers}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)' }}>Sinh viên vào lớp</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-ink)' }}>Danh sách Lớp học được tạo:</h3>
            {importedResult.createdClassesInfo?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {importedResult.createdClassesInfo.map((cls, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>{cls.classCode}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>Môn học: {cls.subjectCode} • Giảng viên: {cls.lecturerName}</div>
                    </div>
                    <div style={{ padding: '6px 12px', background: 'var(--color-primary)', color: 'white', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600 }}>
                      {cls.studentsCount} Sinh viên
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-ink-muted)' }}>Không có lớp học nào được tạo thêm.</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button onClick={() => setImportedResult(null)} className="btn btn-primary" style={{ padding: '10px 24px' }}>Hoàn Tất</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
