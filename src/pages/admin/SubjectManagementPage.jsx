import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createSubject,
  deleteSubject,
  getSubjects,
  restoreSubject,
  updateSubject,
} from '../../services/subject.service';
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '../../services/admin.service';
import '../module-pages.css';

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  department_id: '',
  credits: '3',
};

const EMPTY_DEPT_FORM = {
  code: '',
  name: '',
  is_active: true,
};

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

function SubjectModal({ subject, departments, saving, error, onClose, onSubmit, onQuickCreateDepartment }) {
  const [form, setForm] = useState(() => subject ? {
    code: subject.code,
    name: subject.name,
    description: subject.description || '',
    department_id: subject.department_id || '',
    credits: String(subject.credits ?? 0),
  } : EMPTY_FORM);
  const [showQuickDept, setShowQuickDept] = useState(false);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);
  const [deptError, setDeptError] = useState('');

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleQuickDeptCreate = async () => {
    if (!newDeptCode.trim() || !newDeptName.trim()) {
      setDeptError('Vui lòng nhập cả mã khoa và tên khoa.');
      return;
    }
    setCreatingDept(true);
    setDeptError('');
    try {
      const created = await onQuickCreateDepartment({
        code: newDeptCode.trim().toUpperCase(),
        name: newDeptName.trim(),
      });
      if (created?.id) {
        setForm((current) => ({ ...current, department_id: created.id }));
      }
      setNewDeptCode('');
      setNewDeptName('');
      setShowQuickDept(false);
    } catch (requestError) {
      setDeptError(errorMessage(requestError, 'Không thể tạo khoa mới.'));
    } finally {
      setCreatingDept(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      department_id: form.department_id.trim() || null,
      credits: Number(form.credits),
    });
  };

  return (
    <div className="module-modal" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="module-modal__panel card" role="dialog" aria-modal="true" aria-labelledby="subject-modal-title">
        <div className="module-modal__header">
          <div>
            <p className="module-page__eyebrow">Danh mục Môn học</p>
            <h2 id="subject-modal-title">{subject ? 'Cập nhật môn học' : 'Tạo môn học mới'}</h2>
          </div>
          <button className="module-icon-button" type="button" onClick={onClose} aria-label="Đóng biểu mẫu">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="module-form-grid">
            <div className="module-field">
              <label htmlFor="subject-code">Mã môn học *</label>
              <input id="subject-code" className="module-input" name="code" value={form.code} onChange={change} placeholder="VD: SWP391" maxLength={100} required autoFocus />
            </div>
            <div className="module-field">
              <label htmlFor="subject-credits">Số tín chỉ *</label>
              <input id="subject-credits" className="module-input" type="number" name="credits" value={form.credits} onChange={change} min="0" step="1" required />
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="subject-name">Tên môn học *</label>
              <input id="subject-name" className="module-input" name="name" value={form.name} onChange={change} placeholder="VD: Software Development Project" maxLength={255} required />
            </div>
            <div className="module-field module-field--full">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="subject-department">Khoa / Bộ môn phụ trách</label>
                <button
                  type="button"
                  onClick={() => { setShowQuickDept((val) => !val); setDeptError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {showQuickDept ? 'Đóng tạo nhanh' : '+ Tạo khoa mới'}
                </button>
              </div>
              <select
                id="subject-department"
                className="module-select"
                name="department_id"
                value={form.department_id}
                onChange={change}
                style={{ width: '100%' }}
              >
                <option value="">-- Chưa phân khoa / Môn đại cương --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} — {dept.name}{dept.is_active === false ? ' (Ngừng HĐ)' : ''}
                  </option>
                ))}
              </select>

              {showQuickDept && (
                <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'center' }}>
                    <input
                      className="module-input"
                      placeholder="Mã khoa (VD: SE)"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value)}
                      maxLength={50}
                    />
                    <input
                      className="module-input"
                      placeholder="Tên khoa (VD: Kỹ thuật Phần mềm)"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      maxLength={255}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={creatingDept}
                      onClick={handleQuickDeptCreate}
                    >
                      {creatingDept ? 'Đang tạo...' : 'Lưu khoa'}
                    </button>
                  </div>
                  {deptError && <p className="module-field__hint" style={{ color: 'var(--color-danger)', marginTop: 6 }}>{deptError}</p>}
                </div>
              )}
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="subject-description">Mô tả học phần</label>
              <textarea id="subject-description" className="module-textarea" name="description" value={form.description} onChange={change} maxLength={10000} placeholder="Mô tả ngắn về mục tiêu, nội dung hoặc điều kiện tiên quyết của môn học" />
            </div>
          </div>

          {error && <div className="module-alert" role="alert" style={{ marginTop: 16 }}><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}

          <div className="module-modal__actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : subject ? 'Lưu thay đổi' : 'Tạo môn học'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DepartmentModal({ department, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(() => department ? {
    code: department.code || '',
    name: department.name || '',
    is_active: department.is_active !== false,
  } : EMPTY_DEPT_FORM);

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      is_active: Boolean(form.is_active),
    });
  };

  return (
    <div className="module-modal" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="module-modal__panel card" role="dialog" aria-modal="true" aria-labelledby="dept-modal-title">
        <div className="module-modal__header">
          <div>
            <p className="module-page__eyebrow">Quản lý Khoa / Bộ môn</p>
            <h2 id="dept-modal-title">{department ? 'Cập nhật Khoa / Bộ môn' : 'Thêm Khoa / Bộ môn mới'}</h2>
          </div>
          <button className="module-icon-button" type="button" onClick={onClose} aria-label="Đóng biểu mẫu">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="module-form-grid">
            <div className="module-field">
              <label htmlFor="dept-code">Mã Khoa / Bộ môn *</label>
              <input
                id="dept-code"
                className="module-input"
                value={form.code}
                onChange={(e) => setForm((curr) => ({ ...curr, code: e.target.value }))}
                placeholder="VD: SE, AI, IA, IB"
                maxLength={100}
                required
                autoFocus
              />
            </div>
            <div className="module-field">
              <label htmlFor="dept-status">Trạng thái hoạt động</label>
              <select
                id="dept-status"
                className="module-select"
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => setForm((curr) => ({ ...curr, is_active: e.target.value === 'true' }))}
                style={{ width: '100%' }}
              >
                <option value="true">Đang hoạt động</option>
                <option value="false">Ngừng hoạt động</option>
              </select>
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="dept-name">Tên Khoa / Bộ môn *</label>
              <input
                id="dept-name"
                className="module-input"
                value={form.name}
                onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
                placeholder="VD: Khoa Kỹ thuật Phần mềm"
                maxLength={255}
                required
              />
            </div>
          </div>

          {error && <div className="module-alert" role="alert" style={{ marginTop: 16 }}><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}

          <div className="module-modal__actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : department ? 'Lưu thay đổi' : 'Tạo Khoa'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function SubjectManagementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subjects');
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [deptModal, setDeptModal] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const limit = 10;

  const loadDepartments = useCallback(async () => {
    try {
      const response = await getDepartments();
      setDepartments(response.data || []);
    } catch {
      // ignore non-critical error when loading departments
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit, include_inactive: String(includeInactive) };
      if (search) params.search = search;
      if (departmentFilter) params.department_id = departmentFilter;
      const [response] = await Promise.all([
        getSubjects(params),
        loadDepartments(),
      ]);
      setSubjects(response.data || []);
      setTotal(response.pagination?.total ?? response.total ?? 0);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Không thể tải danh sách môn học.'));
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, departmentFilter, includeInactive, loadDepartments]);

  useEffect(() => { load(); }, [load]);

  const submitForm = async (payload) => {
    setSaving(true);
    setFormError('');
    try {
      if (modal.type === 'edit') await updateSubject(modal.subject.id, payload);
      else await createSubject(payload);
      setModal(null);
      await load();
    } catch (requestError) {
      setFormError(errorMessage(requestError, 'Không thể lưu môn học.'));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCreateDepartment = async (payload) => {
    const response = await createDepartment(payload);
    await loadDepartments();
    return response.data;
  };

  const submitDepartmentForm = async (payload) => {
    setSaving(true);
    setFormError('');
    try {
      if (deptModal.type === 'edit') await updateDepartment(deptModal.department.id, payload);
      else await createDepartment(payload);
      setDeptModal(null);
      await load();
    } catch (requestError) {
      setFormError(errorMessage(requestError, 'Không thể lưu thông tin khoa.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (subject) => {
    if (!window.confirm(`Bạn có chắc muốn ngừng sử dụng môn “${subject.name}”?\n\nMôn học sẽ được đánh dấu không hoạt động để giữ nguyên dữ liệu liên quan.`)) return;
    setDeletingId(subject.id);
    setError('');
    try {
      await deleteSubject(subject.id);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Không thể ngừng sử dụng môn học.'));
    } finally {
      setDeletingId('');
    }
  };

  const restore = async (subject) => {
    setDeletingId(subject.id);
    setError('');
    try {
      await restoreSubject(subject.id);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Không thể khôi phục môn học.'));
    } finally {
      setDeletingId('');
    }
  };

  const handleToggleDepartment = async (dept) => {
    if (dept.is_active) {
      if (!window.confirm(`Bạn có chắc muốn ngừng hoạt động khoa “${dept.name} (${dept.code})”?`)) return;
      setDeletingId(dept.id);
      setError('');
      try {
        await deleteDepartment(dept.id);
        await load();
      } catch (requestError) {
        setError(errorMessage(requestError, 'Không thể ngừng hoạt động khoa.'));
      } finally {
        setDeletingId('');
      }
    } else {
      setDeletingId(dept.id);
      setError('');
      try {
        await updateDepartment(dept.id, { is_active: true });
        await load();
      } catch (requestError) {
        setError(errorMessage(requestError, 'Không thể kích hoạt lại khoa.'));
      } finally {
        setDeletingId('');
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));
  const filteredDepartments = departments.filter((dept) => {
    if (!deptSearch.trim()) return true;
    const q = deptSearch.trim().toLowerCase();
    return dept.code?.toLowerCase().includes(q) || dept.name?.toLowerCase().includes(q);
  });

  return (
    <div className="module-page">
      <header className="module-page__header">
        <div>
          <p className="module-page__eyebrow">Quản trị Đào tạo</p>
          <h1 className="module-page__title">Quản lý Môn học & Khoa</h1>
          <p className="module-page__subtitle">Quản lý danh mục Khoa/Bộ môn, học phần, tín chỉ và liên kết lớp học trong toàn trường.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => { setFormError(''); setDeptModal({ type: 'create', department: null }); }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">domain_add</span>
            Thêm Khoa / Bộ môn
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => { setFormError(''); setModal({ type: 'create', subject: null }); }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">add</span>
            Thêm môn học
          </button>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="module-secondary-text" style={{ marginTop: 0 }}>Tổng số Khoa / Bộ môn</div>
          <div className="module-primary-text" style={{ fontSize: '1.35rem', marginTop: 6 }}>{departments.length}</div>
          <div className="module-secondary-text">{departments.filter((d) => d.is_active !== false).length} khoa đang hoạt động</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="module-secondary-text" style={{ marginTop: 0 }}>Danh mục Môn học</div>
          <div className="module-primary-text" style={{ fontSize: '1.35rem', marginTop: 6 }}>{total}</div>
          <div className="module-secondary-text">{departmentFilter ? 'Theo bộ lọc hiện tại' : 'Trong chương trình đào tạo'}</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="module-secondary-text" style={{ marginTop: 0 }}>Tổng lớp học đang mở</div>
          <div className="module-primary-text" style={{ fontSize: '1.35rem', marginTop: 6, color: 'var(--color-primary)' }}>
            {departments.reduce((sum, d) => sum + Number(d.class_count || 0), 0)}
          </div>
          <div className="module-secondary-text">Thuộc các khoa trong trường</div>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>
        <button
          type="button"
          className={`btn ${activeTab === 'subjects' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('subjects')}
        >
          <span className="material-symbols-outlined" aria-hidden="true">menu_book</span>
          Danh mục Môn học ({total})
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('departments')}
        >
          <span className="material-symbols-outlined" aria-hidden="true">apartment</span>
          Khoa / Bộ môn ({departments.length})
        </button>
      </div>

      {error && <div className="module-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}

      {activeTab === 'subjects' ? (
        <>
          <form className="module-toolbar card" onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(draftSearch.trim());
          }}>
            <div className="module-search">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <label className="sr-only" htmlFor="subject-search">Tìm môn học</label>
              <input id="subject-search" className="module-input" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Tìm theo mã hoặc tên môn học" maxLength={100} />
            </div>
            <label className="sr-only" htmlFor="subject-dept-filter">Lọc theo khoa</label>
            <select
              id="subject-dept-filter"
              className="module-select"
              value={departmentFilter}
              onChange={(event) => {
                setDepartmentFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả Khoa / Bộ môn</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.code} — {dept.name}
                </option>
              ))}
            </select>
            <label className="module-toolbar__check">
              <input type="checkbox" checked={includeInactive} onChange={(event) => { setIncludeInactive(event.target.checked); setPage(1); }} />
              Hiện môn ngừng hoạt động
            </label>
            <button className="btn btn-secondary" type="submit">Tìm kiếm</button>
          </form>

          <section className="card" aria-label="Danh sách môn học">
            {loading ? (
              <div className="module-state"><div><div className="module-state__icon"><span className="material-symbols-outlined">progress_activity</span></div><h2>Đang tải môn học...</h2></div></div>
            ) : subjects.length === 0 ? (
              <div className="module-state"><div><div className="module-state__icon"><span className="material-symbols-outlined">menu_book</span></div><h2>Chưa có môn học phù hợp</h2><p>Thay đổi bộ lọc hoặc thêm môn học mới vào danh mục đào tạo.</p></div></div>
            ) : (
              <div className="module-table-wrap">
                <table className="module-table">
                  <thead><tr><th>Môn học</th><th>Khoa / Bộ môn</th><th>Tín chỉ & Lớp học</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
                  <tbody>
                    {subjects.map((subject) => {
                      const deptInfo = subject.department_id ? deptMap[subject.department_id] : null;
                      return (
                        <tr key={subject.id} style={{ opacity: subject.is_active ? 1 : 0.65 }}>
                          <td>
                            <div className="module-code">{subject.code}</div>
                            <div className="module-primary-text">{subject.name}</div>
                            <div className="module-secondary-text">{subject.description || 'Chưa có mô tả'}</div>
                          </td>
                          <td>
                            {subject.department_name || deptInfo ? (
                              <>
                                {deptInfo?.code && <div className="module-code">{deptInfo.code}</div>}
                                <div className="module-primary-text">{subject.department_name || deptInfo?.name}</div>
                              </>
                            ) : (
                              <span className="module-secondary-text">Chưa phân khoa</span>
                            )}
                          </td>
                          <td>
                            <div className="module-badges">
                              <span className="module-badge">{subject.credits ?? 0} tín chỉ</span>
                              <button
                                type="button"
                                className="module-badge"
                                style={{ cursor: 'pointer', background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid rgba(37, 99, 235, 0.2)' }}
                                onClick={() => navigate(`/admin/classes?subject=${encodeURIComponent(subject.code)}`)}
                                title={`Xem các lớp học môn ${subject.code}`}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>class</span>
                                {subject.class_count ?? 0} lớp
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className={`module-badge ${subject.is_active ? 'module-badge--success' : 'module-badge--muted'}`}>
                              {subject.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                            </span>
                          </td>
                          <td>
                            <div className="module-row__actions">
                              {subject.is_active ? (
                                <>
                                  <button className="module-icon-button" type="button" onClick={() => { setFormError(''); setModal({ type: 'edit', subject }); }} aria-label={`Sửa ${subject.name}`} title="Sửa môn học"><span className="material-symbols-outlined">edit</span></button>
                                  <button className="module-icon-button module-icon-button--danger" type="button" disabled={deletingId !== ''} onClick={() => remove(subject)} aria-label={`Ngừng sử dụng ${subject.name}`} title="Ngừng sử dụng"><span className="material-symbols-outlined">delete</span></button>
                                </>
                              ) : (
                                <button className="module-icon-button" type="button" disabled={deletingId !== ''} onClick={() => restore(subject)} aria-label={`Khôi phục ${subject.name}`} title="Khôi phục môn học"><span className="material-symbols-outlined">restore_from_trash</span></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && total > 0 && <div className="module-pagination"><span>Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} trong {total} môn học</span><div className="module-pagination__buttons"><button className="btn btn-secondary" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Trước</button><button className="btn btn-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div></div>}
          </section>
        </>
      ) : (
        <>
          <div className="module-toolbar card">
            <div className="module-search">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <label className="sr-only" htmlFor="dept-search">Tìm khoa</label>
              <input
                id="dept-search"
                className="module-input"
                value={deptSearch}
                onChange={(event) => setDeptSearch(event.target.value)}
                placeholder="Tìm theo mã khoa (SE, AI...) hoặc tên khoa"
                maxLength={100}
              />
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => { setFormError(''); setDeptModal({ type: 'create', department: null }); }}
            >
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              Tạo Khoa mới
            </button>
          </div>

          <section className="card" aria-label="Danh sách Khoa / Bộ môn">
            {filteredDepartments.length === 0 ? (
              <div className="module-state"><div><div className="module-state__icon"><span className="material-symbols-outlined">apartment</span></div><h2>Chưa có Khoa / Bộ môn phù hợp</h2><p>Thêm Khoa mới để gán cho môn học, giảng viên và sinh viên.</p></div></div>
            ) : (
              <div className="module-table-wrap">
                <table className="module-table">
                  <thead>
                    <tr>
                      <th>Khoa / Bộ môn</th>
                      <th>Môn học trực thuộc</th>
                      <th>Nhân sự & Sinh viên</th>
                      <th>Trạng thái</th>
                      <th aria-label="Thao tác" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((dept) => (
                      <tr key={dept.id} style={{ opacity: dept.is_active === false ? 0.65 : 1 }}>
                        <td>
                          <div className="module-code">{dept.code}</div>
                          <div className="module-primary-text">{dept.name}</div>
                        </td>
                        <td>
                          <div className="module-badges">
                            <button
                              type="button"
                              className="module-badge"
                              style={{ cursor: 'pointer', background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid rgba(37, 99, 235, 0.2)' }}
                              onClick={() => {
                                setDepartmentFilter(dept.id);
                                setPage(1);
                                setActiveTab('subjects');
                              }}
                              title={`Lọc danh sách môn học thuộc khoa ${dept.code}`}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>menu_book</span>
                              {dept.subject_count ?? 0} môn học
                            </button>
                            <button
                              type="button"
                              className="module-badge module-badge--muted"
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/admin/classes?department=${encodeURIComponent(dept.code)}`)}
                              title={`Xem các lớp học thuộc khoa ${dept.code}`}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>class</span>
                              {dept.class_count ?? 0} lớp
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="module-badges">
                            <span className="module-badge">{dept.lecturer_count ?? 0} Giảng viên</span>
                            <span className="module-badge module-badge--muted">{dept.student_count ?? 0} Sinh viên</span>
                          </div>
                        </td>
                        <td>
                          <span className={`module-badge ${dept.is_active !== false ? 'module-badge--success' : 'module-badge--muted'}`}>
                            {dept.is_active !== false ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </td>
                        <td>
                          <div className="module-row__actions">
                            <button
                              className="module-icon-button"
                              type="button"
                              onClick={() => { setFormError(''); setDeptModal({ type: 'edit', department: dept }); }}
                              aria-label={`Sửa ${dept.name}`}
                              title="Chỉnh sửa Khoa"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              className={`module-icon-button ${dept.is_active !== false ? 'module-icon-button--danger' : ''}`}
                              type="button"
                              disabled={deletingId === dept.id}
                              onClick={() => handleToggleDepartment(dept)}
                              aria-label={dept.is_active !== false ? `Ngừng hoạt động ${dept.name}` : `Kích hoạt ${dept.name}`}
                              title={dept.is_active !== false ? 'Ngừng hoạt động Khoa' : 'Kích hoạt lại Khoa'}
                            >
                              <span className="material-symbols-outlined">
                                {dept.is_active !== false ? 'block' : 'restart_alt'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {modal && (
        <SubjectModal
          subject={modal.subject}
          departments={departments}
          saving={saving}
          error={formError}
          onClose={() => !saving && setModal(null)}
          onSubmit={submitForm}
          onQuickCreateDepartment={handleQuickCreateDepartment}
        />
      )}

      {deptModal && (
        <DepartmentModal
          department={deptModal.department}
          saving={saving}
          error={formError}
          onClose={() => !saving && setDeptModal(null)}
          onSubmit={submitDepartmentForm}
        />
      )}
    </div>
  );
}
