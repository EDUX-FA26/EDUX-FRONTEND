import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getAllClasses,
  createAdminClass,
  importExcel,
  importAutoAssignClasses,
  updateClass,
  deleteClass,
  getClassStudents,
  addClassStudent,
  removeClassStudent,
  getAdminLecturers,
  getDepartments,
} from '../../services/admin.service';
import { getSemesters } from '../../services/semester.service';
import { getSubjects } from '../../services/subject.service';
import EduxAlert from '../../components/common/EduxAlert';

export default function ClassManagementPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [semestersList, setSemestersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [lecturersList, setLecturersList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertState, setAlertState] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState(() => searchParams.get('semester') || 'all');
  const [subjectFilter, setSubjectFilter] = useState(() => searchParams.get('subject') || 'all');
  const [departmentFilter, setDepartmentFilter] = useState(() => searchParams.get('department') || 'all');

  // Create / Edit / Delete / View states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    class_code: '',
    semester_id: '',
    subject_id: '',
    lecturer_id: '',
    max_students: 30,
  });
  const [viewingClass, setViewingClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Import state
  const fileInputRef = React.useRef(null);
  const autoAssignInputRef = React.useRef(null);
  const [importing, setImporting] = useState(false);
  const [importedResult, setImportedResult] = useState(null);

  useEffect(() => {
    const sem = searchParams.get('semester');
    const sub = searchParams.get('subject');
    const dept = searchParams.get('department');
    if (sem) setSemesterFilter(sem);
    if (sub) setSubjectFilter(sub);
    if (dept) setDepartmentFilter(dept);
  }, [searchParams]);

  const fetchCatalogData = useCallback(async () => {
    const [semRes, subRes, lecRes, deptRes] = await Promise.allSettled([
      getSemesters({ page: 1, limit: 100 }),
      getSubjects({ page: 1, limit: 100 }),
      getAdminLecturers(),
      getDepartments(),
    ]);
    if (semRes.status === 'fulfilled') setSemestersList(semRes.value?.data || []);
    if (subRes.status === 'fulfilled') setSubjectsList(subRes.value?.data || []);
    if (lecRes.status === 'fulfilled') setLecturersList(lecRes.value?.data || []);
    if (deptRes.status === 'fulfilled') setDepartmentsList(deptRes.value?.data || []);
  }, []);

  const handleImportExcel = async (e, isAutoAssign = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = isAutoAssign ? await importAutoAssignClasses(file) : await importExcel(file);
      setImportedResult(res.data);
      fetchClasses();
      fetchCatalogData();
      setAlertState({
        type: 'success',
        title: 'Thành công!',
        message: 'Import dữ liệu lớp học từ Excel thành công!',
      });
    } catch (err) {
      setAlertState({
        type: 'error',
        title: 'Đã xảy ra lỗi!',
        message: err.response?.data?.message || "Lỗi khi import file Excel!",
      });
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  };

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllClasses();
      setClasses(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  }, []);

  const openCreateClassModal = () => {
    const activeSemesters = semestersList.filter(s => s.is_active && !s.is_locked);
    const defaultSem = activeSemesters.find(s => s.is_current) || activeSemesters[0] || semestersList[0];
    const defaultSub = subjectsList[0];
    const defaultLec = lecturersList[0];
    setCreateForm({
      class_code: '',
      semester_id: defaultSem?.id || '',
      subject_id: defaultSub?.id || '',
      lecturer_id: defaultLec?.id || '',
      max_students: 30,
    });
    setShowCreateModal(true);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAdminClass({
        class_code: createForm.class_code.trim().toUpperCase(),
        semester_id: createForm.semester_id,
        subject_id: createForm.subject_id,
        lecturer_id: createForm.lecturer_id,
        max_students: Number(createForm.max_students) || 30,
      });
      setShowCreateModal(false);
      await fetchClasses();
      setAlertState({
        type: 'success',
        title: 'Thành công!',
        message: 'Tạo lớp học mới thành công!',
      });
    } catch (err) {
      setAlertState({
        type: 'error',
        title: 'Đã xảy ra lỗi!',
        message: err.response?.data?.message || 'Không thể tạo lớp học',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewClass = async (cls) => {
    setViewingClass(cls);
    setStudentIdentifier('');
    setLoadingStudents(true);
    setClassStudents([]);
    try {
      const res = await getClassStudents(cls.id);
      setClassStudents(res.data || []);
    } catch {
      alert("Không thể tải danh sách sinh viên.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddStudentToClass = async (e) => {
    e.preventDefault();
    if (!viewingClass || !studentIdentifier.trim()) return;
    setAddingStudent(true);
    try {
      await addClassStudent(viewingClass.id, { identifier: studentIdentifier.trim() });
      setStudentIdentifier('');
      const res = await getClassStudents(viewingClass.id);
      const updatedStudents = res.data || [];
      setClassStudents(updatedStudents);
      setViewingClass(prev => prev ? { ...prev, enrolled_students: updatedStudents.length } : prev);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể thêm sinh viên vào lớp');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudentFromClass = async (student) => {
    if (!viewingClass) return;
    if (!window.confirm(`Xóa sinh viên "${student.full_name || student.email}" khỏi lớp ${viewingClass.class_code}?`)) return;
    setRemovingStudentId(student.id);
    try {
      await removeClassStudent(viewingClass.id, student.id);
      const nextList = classStudents.filter(s => s.id !== student.id);
      setClassStudents(nextList);
      setViewingClass(prev => prev ? { ...prev, enrolled_students: nextList.length } : prev);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa sinh viên khỏi lớp');
    } finally {
      setRemovingStudentId(null);
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!editingClass) return;
    setSubmitting(true);
    try {
      await updateClass(editingClass.id, {
        class_code: editingClass.class_code,
        semester_id: editingClass.semester_id,
        subject_id: editingClass.subject_id,
        lecturer_id: editingClass.lecturer_id,
        max_students: Number(editingClass.max_students) || 30,
      });
      setEditingClass(null);
      fetchClasses();
      setAlertState({
        type: 'success',
        title: 'Thành công!',
        message: 'Cập nhật lớp học thành công!',
      });
    } catch (err) {
      setAlertState({
        type: 'error',
        title: 'Đã xảy ra lỗi!',
        message: err.response?.data?.message || 'Lỗi khi cập nhật',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa lớp học này? Toàn bộ sinh viên trong lớp sẽ bị loại khỏi lớp.")) return;
    
    try {
      await deleteClass(id);
      fetchClasses();
      setAlertState({
        type: 'success',
        title: 'Thành công!',
        message: 'Đã xóa lớp học thành công!',
      });
    } catch (err) {
      setAlertState({
        type: 'error',
        title: 'Đã xảy ra lỗi!',
        message: err.response?.data?.message || 'Lỗi khi xóa lớp',
      });
    }
  };

  const handleClearFilters = () => {
    const isDefaultFilter =
      !searchQuery.trim() &&
      (!semesterFilter || semesterFilter === 'all') &&
      (!departmentFilter || departmentFilter === 'all') &&
      (!subjectFilter || subjectFilter === 'all');

    if (isDefaultFilter) {
      return;
    }

    setSearchQuery('');
    setSemesterFilter('all');
    setDepartmentFilter('all');
    setSubjectFilter('all');
    setCurrentPage(1);
    navigate('/admin/classes', { replace: true });
  };

  useEffect(() => {
    fetchClasses();
    fetchCatalogData();
  }, [fetchClasses, fetchCatalogData]);

  // Filter & Search logic
  const filteredClasses = classes.filter(c => {
    const matchSemester = semesterFilter === 'all' || c.semester_code === semesterFilter;
    const matchSubject = subjectFilter === 'all' || c.subject_code === subjectFilter;
    const matchDept = departmentFilter === 'all' || c.department_code === departmentFilter || c.department_id === departmentFilter;
    const matchSearch = searchQuery === '' || 
      c.class_code?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.subject_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lecturer_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchSemester && matchSubject && matchDept && matchSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const currentClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Extract unique options for filters
  const uniqueSemesters = [...new Set([
    ...semestersList.map(s => s.code),
    ...classes.map(c => c.semester_code),
  ])].filter(Boolean);
  const uniqueSubjects = [...new Set([
    ...subjectsList.map(s => s.code),
    ...classes.map(c => c.subject_code),
  ])].filter(Boolean);
  const uniqueDepartments = departmentsList.length > 0
    ? departmentsList
    : [...new Set(classes.map(c => c.department_code).filter(Boolean))].map(code => ({ id: code, code, name: code }));

  // Change page handler
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div
      className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-5 lg:px-6 xl:px-8 pt-4 sm:pt-5 pb-4 box-border animate-fade-in"
      style={{
        height: 'calc(100vh - var(--dashboard-header-height, 64px))',
        maxHeight: 'calc(100vh - var(--dashboard-header-height, 64px))',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Header Section */}
      <div className="shrink-0 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--color-ink)', letterSpacing: '-0.5px' }}>
            Quản lý Lớp học & Phân công
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
            Tạo lớp học, phân công giảng viên theo Khoa/Bộ môn, quản lý danh sách sinh viên và đồng bộ từ Excel
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button 
            onClick={() => setShowGuide(true)} 
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
            onChange={(e) => handleImportExcel(e, false)} 
          />
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            style={{ display: 'none' }} 
            ref={autoAssignInputRef} 
            onChange={(e) => handleImportExcel(e, true)} 
          />
          <button 
            onClick={() => autoAssignInputRef.current?.click()}
            disabled={importing}
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            title="Tự động chia 30 SV/lớp và phân công giảng viên theo Khoa"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>auto_Fix_high</span>
            Tự Động Xếp Lớp
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
            {importing ? 'Đang xử lý...' : 'Import Khung Đào Tạo'}
          </button>
          <button 
            onClick={openCreateClassModal}
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600, boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            Tạo Lớp Học
          </button>
          <button onClick={() => { fetchClasses(); fetchCatalogData(); }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Làm mới">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {alertState && (
        <div className="shrink-0 mb-3">
          <EduxAlert
            type={alertState.type}
            title={alertState.title}
            message={alertState.message}
            onClose={() => setAlertState(null)}
          />
        </div>
      )}

      {error && (
        <div className="shrink-0 mb-3">
          <EduxAlert
            type="error"
            title="Đã xảy ra lỗi"
            message={error}
            onClose={() => setError(null)}
          />
        </div>
      )}

      {/* Guide Modal (Portal Sub-Window) */}
      {showGuide && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGuide(false); }}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-slate-200"
            style={{ width: '100%', maxWidth: '640px', maxHeight: '88vh', background: 'var(--color-surface, #ffffff)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined">lightbulb</span> Hướng dẫn 2 chế độ Import Excel
              </h3>
              <button 
                type="button" 
                onClick={() => setShowGuide(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>
              <p style={{ color: 'var(--color-ink-muted)', marginBottom: '12px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                <strong>1. Import Khung Đào Tạo (Đã xếp lớp - 10 cột):</strong> Dành cho file đã có sẵn Mã Lớp và Giảng Viên. Hệ thống tự tạo tài khoản/khoa/môn/học kỳ nếu chưa tồn tại.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['1. Mã SV', '2. Tên SV', '3. Email SV', '4. Mã Khoa', '5. Kỳ Học', '6. Mã Lớp', '7. Mã Môn', '8. Mã GV', '9. Tên GV', '10. Email GV'].map((col, idx) => (
                  <span key={idx} style={{ padding: '6px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                    {col}
                  </span>
                ))}
              </div>
              <p style={{ color: 'var(--color-ink-muted)', margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>
                <strong>2. Tự Động Xếp Lớp (5 cột hoặc 10 cột):</strong> Gom sinh viên theo Khoa + Học kỳ + Môn học (tối đa 30 SV/lớp) và tự động phân bổ giảng viên cùng Khoa theo thuật toán xoay vòng (Round-Robin).
              </p>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50" style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--color-surface-hover)' }}>
              <button type="button" onClick={() => setShowGuide(false)} className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 600 }}>
                Đã hiểu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Content Area */}
      <div className="card flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar & Filters (Single horizontal row) */}
        <div className="shrink-0 flex flex-wrap items-center gap-2.5 p-3.5 border-b border-slate-100 bg-slate-50/50">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[210px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" style={{ fontSize: '15px' }}>
              search
            </span>
            <input 
              type="text" 
              placeholder="Tìm kiếm mã lớp, môn học, GV..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="h-9 w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>

          {/* Dropdown Tất cả Kỳ học */}
          <div className="relative w-36 sm:w-40 shrink-0">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" style={{ fontSize: '15px' }}>
              calendar_month
            </span>
            <select 
              value={semesterFilter} 
              onChange={e => { setSemesterFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 w-full pl-8 pr-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 truncate cursor-pointer focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            >
              <option value="all">Tất cả Kỳ học</option>
              {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Dropdown Tất cả Khoa / Bộ môn */}
          <div className="relative w-44 sm:w-48 shrink-0">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" style={{ fontSize: '15px' }}>
              apartment
            </span>
            <select 
              value={departmentFilter} 
              onChange={e => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 w-full pl-8 pr-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 truncate cursor-pointer focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            >
              <option value="all">Tất cả Khoa / Bộ môn</option>
              {uniqueDepartments.map(d => (
                <option key={d.id || d.code} value={d.code}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Tất cả Môn học */}
          <div className="relative w-44 sm:w-48 shrink-0">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" style={{ fontSize: '15px' }}>
              book
            </span>
            <select 
              value={subjectFilter} 
              onChange={e => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 w-full pl-8 pr-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 truncate cursor-pointer focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            >
              <option value="all">Tất cả Môn học</option>
              {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Nút Xóa lọc cố định vị trí (chống xê dịch layout) */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 flex items-center gap-1.5 shrink-0 transition cursor-pointer"
            title="Xóa bộ lọc"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>filter_alt_off</span>
            <span>Xóa lọc</span>
          </button>
        </div>

        {/* Table container: scrollable with sticky header */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-ink-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>sync</span>
              Đang tải dữ liệu lớp học...
            </div>
          ) : error ? (
            <div style={{ padding: '24px', margin: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#ef4444', textAlign: 'center', fontWeight: 500 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>error</span>
              {error}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface-hover, #f8fafc)' }}>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '14px 16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="whitespace-nowrap">Mã Lớp</th>
                  <th style={{ padding: '14px 16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Môn học & Khoa</th>
                  <th style={{ padding: '14px 16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="whitespace-nowrap">Kỳ học</th>
                  <th style={{ padding: '14px 16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giảng viên</th>
                  <th style={{ padding: '14px 16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="whitespace-nowrap">Sĩ số</th>
                  <th style={{ padding: '14px 16px', color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }} className="whitespace-nowrap">Hành động</th>
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
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary)' }} className="whitespace-nowrap">{c.class_code}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-ink)' }}>
                        <div style={{ fontWeight: 600 }}>{c.subject_code} - {c.subject_name}</div>
                        {c.department_name && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                            {c.department_code ? `${c.department_code} • ` : ''}{c.department_name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-ink)' }} className="whitespace-nowrap">
                        <div style={{ fontWeight: 600 }}>{c.semester_code}</div>
                        {c.semester_name && <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{c.semester_name}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-ink)' }}>
                        <div className="font-semibold">{c.lecturer_name || <span style={{color:'var(--color-ink-muted)'}}>Chưa phân công</span>}</div>
                        <div style={{fontSize:'0.75rem', color:'var(--color-ink-muted)'}} className="truncate max-w-[200px]">{c.lecturer_email}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }} className="whitespace-nowrap">
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
                      <td style={{ padding: '12px 16px', textAlign: 'right' }} className="whitespace-nowrap">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleViewClass(c)}
                            className="btn btn-outline" 
                            style={{ padding: '6px', minWidth: 'unset', border: 'none', color: '#10b981' }}
                            title="Quản lý danh sách sinh viên"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>groups</span>
                          </button>
                          <button 
                            onClick={() => setEditingClass({
                              ...c,
                              semester_id: c.semester_id || semestersList.find(s => s.code === c.semester_code)?.id || '',
                              subject_id: c.subject_id || subjectsList.find(s => s.code === c.subject_code)?.id || '',
                              lecturer_id: c.lecturer_id || lecturersList.find(l => l.email === c.lecturer_email)?.id || '',
                              max_students: c.max_students || 30,
                            })}
                            className="btn btn-outline" 
                            style={{ padding: '6px', minWidth: 'unset', border: 'none', color: 'var(--color-primary)' }}
                            title="Chỉnh sửa lớp & Phân công giảng viên"
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
          )}
        </div>

        {/* Pagination UI pinned at bottom */}
        {totalPages > 1 && (
          <div className="shrink-0" style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-hover)', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
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
      </div>

      {/* Create Class Modal */}
      {showCreateModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div
            className="w-full max-w-lg max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-slate-200"
            style={{ width: '100%', maxWidth: '520px', maxHeight: '88vh', background: 'var(--color-surface, #ffffff)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header cố định */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>Tạo Lớp Học Mới</h2>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateClass} className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
              {/* Thân cuộn nội bộ */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Mã Lớp *</label>
                    <input
                      type="text"
                      placeholder="VD: SE1801"
                      value={createForm.class_code}
                      onChange={e => setCreateForm({ ...createForm, class_code: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Sĩ số tối đa *</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={createForm.max_students}
                      onChange={e => setCreateForm({ ...createForm, max_students: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Học kỳ *</label>
                  <select
                    value={createForm.semester_id}
                    onChange={e => setCreateForm({ ...createForm, semester_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Chọn học kỳ --</option>
                    {semestersList.map(sem => (
                      <option key={sem.id} value={sem.id} disabled={sem.is_locked}>
                        {sem.code} — {sem.name} ({sem.academic_year}){sem.is_current ? ' [Hiện tại]' : ''}{sem.is_locked ? ' [Đã khóa]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Môn học *</label>
                  <select
                    value={createForm.subject_id}
                    onChange={e => setCreateForm({ ...createForm, subject_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjectsList.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} — {sub.name}{sub.department_name ? ` (${sub.department_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Giảng viên phụ trách *</label>
                  <select
                    value={createForm.lecturer_id}
                    onChange={e => setCreateForm({ ...createForm, lecturer_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Chọn giảng viên --</option>
                    {lecturersList.map(lec => (
                      <option key={lec.id} value={lec.id}>
                        {lec.full_name || lec.email} ({lec.email}){lec.department_code ? ` — Khoa ${lec.department_code}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hàng nút cố định ở đáy */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-surface-hover)' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline" disabled={submitting}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Tạo Lớp Học'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Class Modal */}
      {editingClass && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div className="w-full max-w-lg max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-slate-200">
            {/* Header cố định */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>Chỉnh Sửa Lớp Học & Phân Công</h2>
              <button type="button" onClick={() => setEditingClass(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateClass} className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Mã Lớp *</label>
                    <input 
                      type="text" 
                      value={editingClass.class_code} 
                      onChange={e => setEditingClass({...editingClass, class_code: e.target.value})}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-primary)', outline: 'none', background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Sĩ số tối đa *</label>
                    <input 
                      type="number" 
                      min="1"
                      max="500"
                      value={editingClass.max_students ?? 30} 
                      onChange={e => setEditingClass({...editingClass, max_students: e.target.value})}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Học kỳ</label>
                  <select
                    value={editingClass.semester_id || ''}
                    onChange={e => setEditingClass({ ...editingClass, semester_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                  >
                    <option value="">-- Giữ nguyên ({editingClass.semester_code}) --</option>
                    {semestersList.map(sem => (
                      <option key={sem.id} value={sem.id}>
                        {sem.code} — {sem.name} ({sem.academic_year})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Môn học</label>
                  <select
                    value={editingClass.subject_id || ''}
                    onChange={e => setEditingClass({ ...editingClass, subject_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                  >
                    <option value="">-- Giữ nguyên ({editingClass.subject_code} - {editingClass.subject_name}) --</option>
                    {subjectsList.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} — {sub.name}{sub.department_name ? ` (${sub.department_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>Giảng viên phụ trách</label>
                  <select
                    value={editingClass.lecturer_id || ''}
                    onChange={e => setEditingClass({ ...editingClass, lecturer_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                  >
                    <option value="">-- Giữ nguyên ({editingClass.lecturer_name || 'Chưa phân công'}) --</option>
                    {lecturersList.map(lec => (
                      <option key={lec.id} value={lec.id}>
                        {lec.full_name || lec.email} ({lec.email}){lec.department_code ? ` — Khoa ${lec.department_code}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hàng nút cố định ở đáy */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-surface-hover)' }}>
                <button type="button" onClick={() => setEditingClass(null)} className="btn btn-outline" disabled={submitting}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Import Result */}
      {importedResult && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div className="w-full max-w-2xl max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-slate-200">
            {/* Header cố định */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>check_circle</span>
                Nhập Dữ Liệu Thành Công
              </h2>
              <button 
                onClick={() => setImportedResult(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            
            {/* Thân cuộn nội dung */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5" style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)', padding: '16px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{importedResult.importedUsers || 0}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-ink)', fontWeight: 600, marginTop: '8px' }}>User Mới Tạo</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '16px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{importedResult.importedClasses}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-ink)', fontWeight: 600, marginTop: '8px' }}>Lớp Học Tạo Mới</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)', padding: '16px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{importedResult.importedMembers}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-ink)', fontWeight: 600, marginTop: '8px' }}>Lượt Xếp Lớp</div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-ink-muted)' }}>list_alt</span>
                Chi Tiết Các Lớp Học:
              </h3>
              
              {importedResult.createdClassesInfo?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {importedResult.createdClassesInfo.map((cls, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-ink)' }}>{cls.classCode}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginTop: '4px', display: 'flex', gap: '16px' }}>
                          <span><strong style={{color: 'var(--color-ink)'}}>Môn:</strong> {cls.subjectCode}</span>
                          <span><strong style={{color: 'var(--color-ink)'}}>GV:</strong> {cls.lecturerName}</span>
                        </div>
                      </div>
                      <div style={{ padding: '4px 14px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                        {cls.studentsCount} Sinh viên
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '28px', textAlign: 'center', background: 'var(--color-surface-hover)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--color-ink-muted)', margin: 0, fontWeight: 500 }}>Không có lớp học nào được tạo thêm. (Có thể các lớp đã tồn tại)</p>
                </div>
              )}
            </div>
            
            {/* Hàng nút cố định ở đáy */}
            <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--color-surface-hover)' }}>
              <button onClick={() => setImportedResult(null)} className="btn btn-primary" style={{ padding: '10px 28px', fontWeight: 700 }}>
                Hoàn tất
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Class Details Modal */}
      {viewingClass && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div className="w-full max-w-3xl max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-slate-200">
            {/* Header cố định */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-start justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-primary)' }}>
                  Lớp: {viewingClass.class_code}
                </h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span><strong style={{color: 'var(--color-ink)'}}>Môn học:</strong> {viewingClass.subject_code} - {viewingClass.subject_name}</span>
                  {viewingClass.department_name && <span><strong style={{color: 'var(--color-ink)'}}>Khoa:</strong> {viewingClass.department_name}</span>}
                  <span><strong style={{color: 'var(--color-ink)'}}>Kỳ học:</strong> {viewingClass.semester_code}</span>
                  <span><strong style={{color: 'var(--color-ink)'}}>Sĩ số:</strong> {classStudents.length} / {viewingClass.max_students}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingClass(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            {/* Thân cuộn nội dung */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4" style={{ padding: '20px 24px', overflowY: 'auto' }}>
              <div style={{ padding: '14px 16px', background: 'var(--color-surface-hover)', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>person</span>
                  Giảng viên phụ trách
                </h3>
                {viewingClass.lecturer_name ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
                      {viewingClass.lecturer_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '0.95rem' }}>{viewingClass.lecturer_name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>{viewingClass.lecturer_email}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Chưa có giảng viên phân công.</div>
                )}
              </div>

              {/* Add student to class form */}
              <form onSubmit={handleAddStudentToClass} style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Nhập Mã số sinh viên (VD: SE170001) hoặc Email sinh viên để thêm vào lớp..."
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: '0.9rem' }}
                />
                <button type="submit" className="btn btn-primary" disabled={addingStudent || !studentIdentifier.trim()} style={{ whiteSpace: 'nowrap' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                  {addingStudent ? 'Đang thêm...' : 'Thêm Sinh Viên'}
                </button>
              </form>

              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>STT</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>MSSV</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>Họ và Tên</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>Email</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink-muted)', textAlign: 'right' }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((s, idx) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted)' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>{s.student_code || 'N/A'}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--color-ink)' }}>{s.full_name}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted)' }}>{s.email}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudentFromClass(s)}
                              disabled={removingStudentId === s.id}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', minWidth: 'unset', border: 'none', color: '#ef4444' }}
                              title="Xóa sinh viên khỏi lớp"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Hàng nút cố định ở đáy */}
            <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--color-surface-hover)' }}>
              <button onClick={() => setViewingClass(null)} className="btn btn-outline">
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
