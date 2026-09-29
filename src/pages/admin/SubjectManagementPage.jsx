import React, { useCallback, useEffect, useState } from 'react';
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from '../../services/subject.service';
import '../module-pages.css';

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  department_id: '',
  credits: '0',
};

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

function SubjectModal({ subject, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(() => subject ? {
    code: subject.code,
    name: subject.name,
    description: subject.description || '',
    department_id: subject.department_id || '',
    credits: String(subject.credits ?? 0),
  } : EMPTY_FORM);

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      code: form.code.trim(),
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
            <p className="module-page__eyebrow">Module 19</p>
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
              <input id="subject-code" className="module-input" name="code" value={form.code} onChange={change} maxLength={100} required autoFocus />
            </div>
            <div className="module-field">
              <label htmlFor="subject-credits">Số tín chỉ</label>
              <input id="subject-credits" className="module-input" type="number" name="credits" value={form.credits} onChange={change} min="0" step="1" required />
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="subject-name">Tên môn học *</label>
              <input id="subject-name" className="module-input" name="name" value={form.name} onChange={change} maxLength={255} required />
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="subject-department">Department ID</label>
              <input id="subject-department" className="module-input" name="department_id" value={form.department_id} onChange={change} placeholder="UUID khoa/bộ môn (không bắt buộc)" />
              <p className="module-field__hint">Để trống nếu môn học chưa được gán cho khoa hoặc bộ môn.</p>
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="subject-description">Mô tả</label>
              <textarea id="subject-description" className="module-textarea" name="description" value={form.description} onChange={change} maxLength={10000} placeholder="Mô tả ngắn về nội dung môn học" />
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

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit, include_inactive: String(includeInactive) };
      if (search) params.search = search;
      const response = await getSubjects(params);
      setSubjects(response.data || []);
      setTotal(response.pagination?.total ?? response.total ?? 0);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Không thể tải danh sách môn học.'));
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, includeInactive]);

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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="module-page">
      <header className="module-page__header">
        <div>
          <p className="module-page__eyebrow">Module 19 · Academic Catalog</p>
          <h1 className="module-page__title">Quản lý môn học</h1>
          <p className="module-page__subtitle">Quản lý danh mục môn, tín chỉ, khoa phụ trách và trạng thái sử dụng trong hệ thống.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => { setFormError(''); setModal({ type: 'create', subject: null }); }}>
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          Thêm môn học
        </button>
      </header>

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
        <label className="module-toolbar__check">
          <input type="checkbox" checked={includeInactive} onChange={(event) => { setIncludeInactive(event.target.checked); setPage(1); }} />
          Hiện môn ngừng hoạt động
        </label>
        <button className="btn btn-secondary" type="submit">Tìm kiếm</button>
      </form>

      {error && <div className="module-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}

      <section className="card" aria-label="Danh sách môn học">
        {loading ? (
          <div className="module-state"><div><div className="module-state__icon"><span className="material-symbols-outlined">progress_activity</span></div><h2>Đang tải môn học...</h2></div></div>
        ) : subjects.length === 0 ? (
          <div className="module-state"><div><div className="module-state__icon"><span className="material-symbols-outlined">menu_book</span></div><h2>Chưa có môn học phù hợp</h2><p>Thay đổi từ khóa hoặc thêm môn học mới vào danh mục đào tạo.</p></div></div>
        ) : (
          <div className="module-table-wrap">
            <table className="module-table">
              <thead><tr><th>Môn học</th><th>Khoa/Bộ môn</th><th>Tín chỉ</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} style={{ opacity: subject.is_active ? 1 : 0.62 }}>
                    <td><div className="module-code">{subject.code}</div><div className="module-primary-text">{subject.name}</div><div className="module-secondary-text">{subject.description || 'Chưa có mô tả'}</div></td>
                    <td><div className="module-primary-text">{subject.department_name || 'Chưa phân khoa'}</div>{subject.department_id && <div className="module-secondary-text">{subject.department_id}</div>}</td>
                    <td><span className="module-badge">{subject.credits ?? 0} tín chỉ</span></td>
                    <td><span className={`module-badge ${subject.is_active ? 'module-badge--success' : 'module-badge--muted'}`}>{subject.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span></td>
                    <td><div className="module-row__actions">
                      <button className="module-icon-button" type="button" disabled={!subject.is_active} onClick={() => { setFormError(''); setModal({ type: 'edit', subject }); }} aria-label={`Sửa ${subject.name}`} title="Sửa môn học"><span className="material-symbols-outlined">edit</span></button>
                      <button className="module-icon-button module-icon-button--danger" type="button" disabled={!subject.is_active || deletingId !== ''} onClick={() => remove(subject)} aria-label={`Ngừng sử dụng ${subject.name}`} title="Ngừng sử dụng"><span className="material-symbols-outlined">delete</span></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > 0 && <div className="module-pagination"><span>Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} trong {total} môn học</span><div className="module-pagination__buttons"><button className="btn btn-secondary" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Trước</button><button className="btn btn-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div></div>}
      </section>

      {modal && <SubjectModal subject={modal.subject} saving={saving} error={formError} onClose={() => !saving && setModal(null)} onSubmit={submitForm} />}
    </div>
  );
}
