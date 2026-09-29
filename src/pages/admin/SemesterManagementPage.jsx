import React, { useCallback, useEffect, useState } from 'react';
import {
  activateSemester,
  closeSemester,
  createSemester,
  getSemesters,
  lockSemester,
  updateSemester,
} from '../../services/semester.service';
import '../module-pages.css';

const EMPTY_FORM = {
  code: '',
  name: '',
  academic_year: '',
  start_date: '',
  end_date: '',
};

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

const toPayload = (form) => ({
  code: form.code.trim(),
  name: form.name.trim(),
  academic_year: form.academic_year.trim(),
  start_date: new Date(form.start_date).toISOString(),
  end_date: new Date(form.end_date).toISOString(),
});

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

function SemesterModal({ semester, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(() => semester ? {
    code: semester.code,
    name: semester.name,
    academic_year: semester.academic_year,
    start_date: toLocalInput(semester.start_date),
    end_date: toLocalInput(semester.end_date),
  } : EMPTY_FORM);

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (new Date(form.start_date) >= new Date(form.end_date)) return;
    onSubmit(toPayload(form));
  };

  const invalidDates = form.start_date && form.end_date
    && new Date(form.start_date) >= new Date(form.end_date);

  return (
    <div className="module-modal" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="module-modal__panel card" role="dialog" aria-modal="true" aria-labelledby="semester-modal-title">
        <div className="module-modal__header">
          <div>
            <p className="module-page__eyebrow">Module 18</p>
            <h2 id="semester-modal-title">{semester ? 'Cập nhật học kỳ' : 'Tạo học kỳ mới'}</h2>
          </div>
          <button className="module-icon-button" type="button" onClick={onClose} aria-label="Đóng biểu mẫu">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="module-form-grid">
            <div className="module-field">
              <label htmlFor="semester-code">Mã học kỳ *</label>
              <input id="semester-code" className="module-input" name="code" value={form.code} onChange={change} maxLength={100} required autoFocus />
            </div>
            <div className="module-field">
              <label htmlFor="semester-year">Năm học *</label>
              <input id="semester-year" className="module-input" name="academic_year" value={form.academic_year} onChange={change} placeholder="2026-2027" maxLength={100} required />
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="semester-name">Tên học kỳ *</label>
              <input id="semester-name" className="module-input" name="name" value={form.name} onChange={change} placeholder="Fall 2026" maxLength={255} required />
            </div>
            <div className="module-field">
              <label htmlFor="semester-start">Ngày bắt đầu *</label>
              <input id="semester-start" className="module-input" type="datetime-local" name="start_date" value={form.start_date} onChange={change} required />
            </div>
            <div className="module-field">
              <label htmlFor="semester-end">Ngày kết thúc *</label>
              <input id="semester-end" className="module-input" type="datetime-local" name="end_date" value={form.end_date} onChange={change} required />
              {invalidDates && <p className="module-field__hint" style={{ color: 'var(--color-danger)' }}>Ngày kết thúc phải sau ngày bắt đầu.</p>}
            </div>
          </div>

          {error && <div className="module-alert" role="alert" style={{ marginTop: 16 }}><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}

          <div className="module-modal__actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="btn btn-primary" type="submit" disabled={saving || invalidDates}>
              {saving ? 'Đang lưu...' : semester ? 'Lưu thay đổi' : 'Tạo học kỳ'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function SemesterManagementPage() {
  const [semesters, setSemesters] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (status === 'active') params.is_active = 'true';
      if (status === 'closed') params.is_active = 'false';
      if (status === 'current') params.is_current = 'true';
      const response = await getSemesters(params);
      setSemesters(response.data || []);
      setTotal(response.pagination?.total ?? response.total ?? 0);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Không thể tải danh sách học kỳ.'));
      setSemesters([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setFormError('');
    setModal({ type: 'create', semester: null });
  };

  const openEdit = (semester) => {
    setFormError('');
    setModal({ type: 'edit', semester });
  };

  const submitForm = async (payload) => {
    setSaving(true);
    setFormError('');
    try {
      if (modal.type === 'edit') await updateSemester(modal.semester.id, payload);
      else await createSemester(payload);
      setModal(null);
      await load();
    } catch (requestError) {
      setFormError(errorMessage(requestError, 'Không thể lưu học kỳ.'));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (semester, action) => {
    const labels = { activate: 'kích hoạt', close: 'đóng', lock: 'khóa' };
    const notes = {
      activate: 'Học kỳ này sẽ trở thành học kỳ hiện tại.',
      close: 'Học kỳ sẽ ngừng hoạt động và không còn là học kỳ hiện tại.',
      lock: 'Học kỳ đã khóa không thể cập nhật hoặc kích hoạt lại.',
    };
    if (!window.confirm(`Bạn có chắc muốn ${labels[action]} “${semester.name}”?\n\n${notes[action]}`)) return;

    setBusyId(`${semester.id}:${action}`);
    setError('');
    try {
      if (action === 'activate') await activateSemester(semester.id);
      if (action === 'close') await closeSemester(semester.id);
      if (action === 'lock') await lockSemester(semester.id);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, `Không thể ${labels[action]} học kỳ.`));
    } finally {
      setBusyId('');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="module-page">
      <header className="module-page__header">
        <div>
          <p className="module-page__eyebrow">Module 18 · Academic Operations</p>
          <h1 className="module-page__title">Quản lý học kỳ</h1>
          <p className="module-page__subtitle">Tạo lịch học kỳ, chọn học kỳ hiện tại, đóng và khóa dữ liệu theo vòng đời đào tạo.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          Thêm học kỳ
        </button>
      </header>

      <form className="module-toolbar card" onSubmit={(event) => {
        event.preventDefault();
        setPage(1);
        setSearch(draftSearch.trim());
      }}>
        <div className="module-search">
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <label className="sr-only" htmlFor="semester-search">Tìm học kỳ</label>
          <input id="semester-search" className="module-input" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Tìm theo mã, tên hoặc năm học" maxLength={100} />
        </div>
        <label className="sr-only" htmlFor="semester-status">Lọc trạng thái</label>
        <select id="semester-status" className="module-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="current">Hiện tại</option>
          <option value="active">Đang hoạt động</option>
          <option value="closed">Đã đóng</option>
        </select>
        <button className="btn btn-secondary" type="submit">Lọc dữ liệu</button>
      </form>

      {error && <div className="module-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}

      <section className="card" aria-label="Danh sách học kỳ">
        {loading ? (
          <div className="module-state"><div><div className="module-state__icon"><span className="material-symbols-outlined">progress_activity</span></div><h2>Đang tải học kỳ...</h2></div></div>
        ) : semesters.length === 0 ? (
          <div className="module-state"><div><div className="module-state__icon"><span className="material-symbols-outlined">calendar_month</span></div><h2>Chưa có học kỳ phù hợp</h2><p>Thay đổi bộ lọc hoặc tạo học kỳ mới để bắt đầu quản lý lịch đào tạo.</p></div></div>
        ) : (
          <div className="module-table-wrap">
            <table className="module-table">
              <thead><tr><th>Học kỳ</th><th>Thời gian</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
              <tbody>
                {semesters.map((semester) => (
                  <tr key={semester.id}>
                    <td><div className="module-code">{semester.code}</div><div className="module-primary-text">{semester.name}</div><div className="module-secondary-text">Năm học {semester.academic_year}</div></td>
                    <td><div className="module-primary-text">{new Date(semester.start_date).toLocaleDateString('vi-VN')} – {new Date(semester.end_date).toLocaleDateString('vi-VN')}</div><div className="module-secondary-text">Cập nhật {new Date(semester.updated_at).toLocaleDateString('vi-VN')}</div></td>
                    <td><div className="module-badges">
                      {semester.is_current && <span className="module-badge module-badge--success"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>Hiện tại</span>}
                      <span className={`module-badge ${semester.is_active ? '' : 'module-badge--muted'}`}>{semester.is_active ? 'Đang mở' : 'Đã đóng'}</span>
                      {semester.is_locked && <span className="module-badge module-badge--danger"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock</span>Đã khóa</span>}
                    </div></td>
                    <td><div className="module-row__actions">
                      <button className="module-icon-button" type="button" onClick={() => openEdit(semester)} disabled={semester.is_locked} aria-label={`Sửa ${semester.name}`} title="Sửa học kỳ"><span className="material-symbols-outlined">edit</span></button>
                      {semester.is_active && !semester.is_current && <button className="module-icon-button" type="button" onClick={() => transition(semester, 'activate')} disabled={busyId !== '' || semester.is_locked} aria-label={`Kích hoạt ${semester.name}`} title="Đặt làm học kỳ hiện tại"><span className="material-symbols-outlined">play_circle</span></button>}
                      {semester.is_active && <button className="module-icon-button" type="button" onClick={() => transition(semester, 'close')} disabled={busyId !== '' || semester.is_locked} aria-label={`Đóng ${semester.name}`} title="Đóng học kỳ"><span className="material-symbols-outlined">event_busy</span></button>}
                      {!semester.is_active && !semester.is_locked && <button className="module-icon-button module-icon-button--danger" type="button" onClick={() => transition(semester, 'lock')} disabled={busyId !== ''} aria-label={`Khóa ${semester.name}`} title="Khóa học kỳ"><span className="material-symbols-outlined">lock</span></button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > 0 && <div className="module-pagination"><span>Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} trong {total} học kỳ</span><div className="module-pagination__buttons"><button className="btn btn-secondary" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Trước</button><button className="btn btn-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div></div>}
      </section>

      {modal && <SemesterModal semester={modal.semester} saving={saving} error={formError} onClose={() => !saving && setModal(null)} onSubmit={submitForm} />}
    </div>
  );
}
