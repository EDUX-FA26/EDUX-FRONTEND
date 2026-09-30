import React, { useState, useEffect } from 'react';
import { getAllClasses, importExcel, updateClass, deleteClass, getClassStudents } from '../../services/admin.service';

export default function ClassManagementPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Edit / Delete / View states
  const [viewingClass, setViewingClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Import state
  const fileInputRef = React.useRef(null);
  const [importing, setImporting] = useState(false);
  const [importedResult, setImportedResult] = useState(null);

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = await importExcel(file);
      setImportedResult(res.data);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi import file Excel!");
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await getAllClasses();
      setClasses(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClass = async (cls) => {
    setViewingClass(cls);
    setLoadingStudents(true);
    setClassStudents([]);
    try {
      const res = await getClassStudents(cls.id);
      setClassStudents(res.data || []);
    } catch (err) {
      alert("Không thể tải danh sách sinh viên.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!editingClass) return;
    setSubmitting(true);
    try {
      await updateClass(editingClass.id, { classCode: editingClass.class_code });
      setEditingClass(null);
      fetchClasses();
      alert("Cập nhật thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa lớp học này? Toàn bộ sinh viên trong lớp sẽ bị loại khỏi lớp.")) return;
    
    try {
      await deleteClass(id);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa lớp");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Filter & Search logic
  const filteredClasses = classes.filter(c => {
    const matchSemester = semesterFilter === 'all' || c.semester_code === semesterFilter;
    const matchSubject = subjectFilter === 'all' || c.subject_code === subjectFilter;
    const matchSearch = searchQuery === '' || 
      c.class_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lecturer_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchSemester && matchSubject && matchSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const currentClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Extract unique options for filters
  const uniqueSemesters = [...new Set(classes.map(c => c.semester_code))].filter(Boolean);
  const uniqueSubjects = [...new Set(classes.map(c => c.subject_code))].filter(Boolean);

  // Change page handler
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--color-ink)', letterSpacing: '-0.5px' }}>
            Quản lý Lớp học & Phân công
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
            Quản lý danh sách lớp học, đồng bộ sinh viên và giảng viên từ file Excel
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setShowGuide(!showGuide)} 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'var(--color-surface-hover)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>info</span>
            Hướng dẫn Import
          </button>
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
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600, boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
            {importing ? 'Đang xử lý dữ liệu...' : 'Import Khung Đào Tạo'}
          </button>
          <button onClick={fetchClasses} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Guide Card (Collapsible) */}
      {showGuide && (
        <div className="card animate-fade-in" style={{ padding: '24px', background: 'rgba(234, 88, 12, 0.05)', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">lightbulb</span> Yêu cầu cấu trúc File Excel (10 Cột)
          </h3>
          <p style={{ color: 'var(--color-ink-muted)', marginBottom: '16px', fontSize: '0.9rem', lineHeight: '1.6' }}>
            File Excel cần có đúng thứ tự 10 cột sau (bỏ qua dòng tiêu đề). Nếu sinh viên/giáo viên chưa có tài khoản, hệ thống sẽ tự động tạo dựa trên Email. Nếu đã có, hệ thống sẽ liên kết trực tiếp vào lớp học.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['1. Mã SV', '2. Tên SV', '3. Email SV', '4. Ngành', '5. Kỳ Học', '6. Mã Lớp', '7. Mã Môn', '8. Mã GV', '9. Tên GV', '10. Email GV'].map((col, idx) => (
              <span key={idx} style={{ padding: '6px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="card" style={{ padding: '24px', flex: 1 }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface-hover)', padding: '6px 16px', borderRadius: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-ink-muted)', fontSize: '20px' }}>calendar_month</span>
              <select 
                value={semesterFilter} 
                onChange={e => { setSemesterFilter(e.target.value); setCurrentPage(1); }}
                style={{ border: 'none', background: 'transparent', color: 'var(--color-ink)', outline: 'none', fontWeight: 600, fontSize: '0.95rem' }}
              >
                <option value="all">Tất cả Kỳ học</option>
                {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface-hover)', padding: '6px 16px', borderRadius: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-ink-muted)', fontSize: '20px' }}>book</span>
              <select 
                value={subjectFilter} 
                onChange={e => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
                style={{ border: 'none', background: 'transparent', color: 'var(--color-ink)', outline: 'none', fontWeight: 600, fontSize: '0.95rem' }}
              >
                <option value="all">Tất cả Môn học</option>
                {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface-hover)', padding: '8px 16px', borderRadius: '12px', minWidth: '250px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-ink-muted)', fontSize: '20px' }}>search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm mã lớp, môn học, GV..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', background: 'transparent', color: 'var(--color-ink)', outline: 'none', width: '100%', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-ink-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>sync</span>
            Đang tải dữ liệu lớp học...
          </div>
        ) : error ? (
          <div style={{ padding: '24px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#ef4444', textAlign: 'center', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>error</span>
            {error}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mã Lớp</th>
                    <th style={{ padding: '16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Môn học</th>
                    <th style={{ padding: '16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kỳ học</th>
                    <th style={{ padding: '16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giảng viên</th>
                    <th style={{ padding: '16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sĩ số</th>
                    <th style={{ padding: '16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentClasses.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
                        Không có lớp học nào khớp với tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    currentClasses.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>{c.class_code}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-ink)' }}>{c.subject_code} - {c.subject_name}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-ink)' }}>{c.semester_code}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-ink)' }}>
                          {c.lecturer_name || <span style={{color:'var(--color-ink-muted)'}}>Chưa phân công</span>}
                          <div style={{fontSize:'0.75rem', color:'var(--color-ink-muted)'}}>{c.lecturer_email}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            color: 'var(--color-primary)', 
                            fontWeight: 600, 
                            fontSize: '0.875rem' 
                          }}>
                            {c.enrolled_students} / {c.max_students}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleViewClass(c)}
                              className="btn btn-outline" 
                              style={{ padding: '6px', minWidth: 'unset', border: 'none', color: '#10b981' }}
                              title="Xem Chi Tiết Lớp"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                            </button>
                            <button 
                              onClick={() => setEditingClass(c)}
                              className="btn btn-outline" 
                              style={{ padding: '6px', minWidth: 'unset', border: 'none', color: 'var(--color-primary)' }}
                              title="Sửa Mã Lớp"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteClass(c.id)}
                              className="btn btn-outline" 
                              style={{ padding: '6px', minWidth: 'unset', border: 'none', color: '#ef4444' }}
                              title="Xóa Lớp"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)' }}>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredClasses.length)} trong {filteredClasses.length} lớp học
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-outline" 
                    style={{ padding: '6px 12px' }}
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={currentPage === page ? "btn btn-primary" : "btn btn-outline"}
                      style={{ padding: '6px 12px', minWidth: '36px' }}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline" 
                    style={{ padding: '6px 12px' }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Class Modal */}
      {editingClass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', color: 'var(--color-primary)' }}>Chỉnh Sửa Lớp Học</h2>
            
            <form onSubmit={handleUpdateClass}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px' }}>Môn học</label>
                <input 
                  type="text" 
                  value={`${editingClass.subject_code} - ${editingClass.subject_name}`} 
                  disabled
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface-hover)', color: 'var(--color-ink-muted)' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px' }}>Mã Lớp</label>
                <input 
                  type="text" 
                  value={editingClass.class_code} 
                  onChange={e => setEditingClass({...editingClass, class_code: e.target.value})}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-primary)', outline: 'none', background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingClass(null)} className="btn btn-outline" disabled={submitting}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Result */}
      {importedResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>check_circle</span>
                Nhập Dữ Liệu Thành Công
              </h2>
              <button 
                onClick={() => setImportedResult(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>close</span>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{importedResult.importedUsers || 0}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: 600, marginTop: '8px' }}>User Mới Tạo</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{importedResult.importedClasses}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: 600, marginTop: '8px' }}>Lớp Học Tạo Mới</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{importedResult.importedMembers}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: 600, marginTop: '8px' }}>Lượt Xếp Lớp</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-ink-muted)' }}>list_alt</span>
              Chi Tiết Các Lớp Học:
            </h3>
            
            {importedResult.createdClassesInfo?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                {importedResult.createdClassesInfo.map((cls, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', transition: 'transform 0.2s', cursor: 'default' }} className="hover-scale">
                    <div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink)' }}>{cls.classCode}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', marginTop: '4px', display: 'flex', gap: '16px' }}>
                        <span><strong style={{color: 'var(--color-ink)'}}>Môn:</strong> {cls.subjectCode}</span>
                        <span><strong style={{color: 'var(--color-ink)'}}>GV:</strong> {cls.lecturerName}</span>
                      </div>
                    </div>
                    <div style={{ padding: '6px 16px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 700 }}>
                      {cls.studentsCount} Sinh viên
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', background: 'var(--color-surface-hover)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--color-ink-muted)', margin: 0, fontWeight: 500 }}>Không có lớp học nào được tạo thêm. (Có thể các lớp đã tồn tại)</p>
              </div>
            )}
            
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setImportedResult(null)} className="btn btn-primary" style={{ padding: '12px 32px', fontWeight: 700 }}>
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Class Details Modal */}
      {viewingClass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--color-primary)' }}>
                  Lớp: {viewingClass.class_code}
                </h2>
                <div style={{ fontSize: '0.95rem', color: 'var(--color-ink-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span><strong style={{color: 'var(--color-ink)'}}>Môn học:</strong> {viewingClass.subject_code} - {viewingClass.subject_name}</span>
                  <span><strong style={{color: 'var(--color-ink)'}}>Kỳ học:</strong> {viewingClass.semester_code}</span>
                  <span><strong style={{color: 'var(--color-ink)'}}>Sĩ số:</strong> {viewingClass.enrolled_students} / {viewingClass.max_students}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingClass(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>close</span>
              </button>
            </div>

            <div style={{ padding: '16px', background: 'var(--color-surface-hover)', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>person</span>
                Giảng viên phụ trách
              </h3>
              {viewingClass.lecturer_name ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                    {viewingClass.lecturer_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{viewingClass.lecturer_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>{viewingClass.lecturer_email}</div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--color-ink-muted)' }}>Chưa có giảng viên phân công.</div>
              )}
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>groups</span>
              Danh sách Sinh viên ({classStudents.length})
            </h3>

            {loadingStudents ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', animation: 'spin 1s linear infinite' }}>sync</span>
                <div style={{ marginTop: '8px' }}>Đang tải danh sách...</div>
              </div>
            ) : classStudents.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', background: 'var(--color-surface-hover)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--color-ink-muted)', margin: 0 }}>Lớp học này chưa có sinh viên nào.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>STT</th>
                      <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>MSSV</th>
                      <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>Họ và Tên</th>
                      <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s, idx) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>{s.student_code || 'N/A'}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-ink)' }}>{s.full_name}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted)' }}>{s.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingClass(null)} className="btn btn-outline">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
