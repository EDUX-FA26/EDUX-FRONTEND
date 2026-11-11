import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  activateSemester,
  closeSemester,
  createSemester,
  getSemesters,
  lockSemester,
  reopenSemester,
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
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [allSemesters, setAllSemesters] = useState([]);
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
      if (status === 'closed') {
        params.is_active = 'false';
        params.is_locked = 'false';
      }
      if (status === 'current') params.is_current = 'true';
      if (status === 'locked') params.is_locked = 'true';
      const [response, summaryResponse] = await Promise.all([
        getSemesters(params),
        getSemesters({ page: 1, limit: 100 }),
      ]);
      setSemesters(response.data || []);
      setTotal(response.pagination?.total ?? response.total ?? 0);
      setAllSemesters(summaryResponse.data || []);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Không thể tải danh sách học kỳ.'));
      setSemesters([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const notifySemesterChanged = () => {
    window.dispatchEvent(new CustomEvent('edux:semester-updated'));
  };

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
      notifySemesterChanged();
    } catch (requestError) {
      setFormError(errorMessage(requestError, 'Không thể lưu học kỳ.'));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (semester, action) => {
    const labels = {
      activate: 'kích hoạt',
      close: 'đóng',
      reopen: 'mở lại',
      lock: 'khóa vĩnh viễn',
    };
    const notes = {
      activate: 'Học kỳ này sẽ trở thành học kỳ hiện tại của toàn hệ thống.',
      close: 'Học kỳ sẽ ngừng hoạt động và không còn là học kỳ hiện tại.',
      reopen: 'Học kỳ sẽ được mở lại để tiếp tục quản lý lớp học hoặc đặt làm học kỳ hiện tại.',
      lock: 'Học kỳ đã khóa không thể chỉnh sửa, mở lại hoặc kích hoạt lại.',
    };
    if (!window.confirm(`Bạn có chắc muốn ${labels[action]} “${semester.name}”?\n\n${notes[action]}`)) return;

    setBusyId(`${semester.id}:${action}`);
    setError('');
    try {
      if (action === 'activate') await activateSemester(semester.id);
      if (action === 'close') await closeSemester(semester.id);
      if (action === 'reopen') await reopenSemester(semester.id);
      if (action === 'lock') await lockSemester(semester.id);
      await load();
      notifySemesterChanged();
    } catch (requestError) {
      setError(errorMessage(requestError, `Không thể ${labels[action]} học kỳ.`));
    } finally {
      setBusyId('');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentSemester = allSemesters.find((item) => item.is_current);
  const openCount = allSemesters.filter((item) => item.is_active && !item.is_locked).length;
  const lockedCount = allSemesters.filter((item) => item.is_locked).length;

  return (
    <div className="module-page">
      <header className="module-page__header">
        <div>
          <p className="module-page__eyebrow">Quản trị Đào tạo</p>
          <h1 className="module-page__title">Quản lý học kỳ</h1>
          <p className="module-page__subtitle">Tạo lịch học kỳ, chọn học kỳ hiện tại, đóng/mở lại và khóa dữ liệu theo vòng đời đào tạo.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" type="button" onClick={() => navigate('/admin/classes')}>
            <span className="material-symbols-outlined" aria-hidden="true">school</span>
            Quản lý Lớp học
          </button>
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            <span className="material-symbols-outlined" aria-hidden="true">add</span>
            Thêm học kỳ
          </button>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="module-secondary-text" style={{ marginTop: 0 }}>Học kỳ hiện tại</div>
          <div className="module-primary-text" style={{ fontSize: '1.1rem', marginTop: 6 }}>
            {currentSemester ? `${currentSemester.code} — ${currentSemester.name}` : 'Chưa chọn học kỳ hiện tại'}
          </div>
          <div className="module-secondary-text">
            {currentSemester ? `Năm học ${currentSemester.academic_year}` : 'Bấm biểu tượng Kích hoạt trên học kỳ đang mở'}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="module-secondary-text" style={{ marginTop: 0 }}>Tổng số học kỳ</div>
          <div className="module-primary-text" style={{ fontSize: '1.35rem', marginTop: 6 }}>{allSemesters.length || total}</div>
          <div className="module-secondary-text">Trong toàn bộ hệ thống</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="module-secondary-text" style={{ marginTop: 0 }}>Học kỳ đang mở</div>
          <div className="module-primary-text" style={{ fontSize: '1.35rem', marginTop: 6, color: 'var(--color-success)' }}>{openCount}</div>
          <div className="module-secondary-text">Có thể xếp lớp & giảng dạy</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="module-secondary-text" style={{ marginTop: 0 }}>Học kỳ đã khóa</div>
          <div className="module-primary-text" style={{ fontSize: '1.35rem', marginTop: 6, color: 'var(--color-danger)' }}>{lockedCount}</div>
          <div className="module-secondary-text">Đã lưu trữ cố định</div>
        </div>
      </section>

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
          <option value="active">Đang mở</option>
          <option value="closed">Đã đóng (chưa khóa)</option>
          <option value="locked">Đã khóa</option>
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
              <thead><tr><th>Học kỳ</th><th>Thời gian</th><th>Quy mô lớp học</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
              <tbody>
                {semesters.map((semester) => (
                  <tr key={semester.id}>
                    <td><div className="module-code">{semester.code}</div><div className="module-primary-text">{semester.name}</div><div className="module-secondary-text">Năm học {semester.academic_year}</div></td>
                    <td><div className="module-primary-text">{new Date(semester.start_date).toLocaleDateString('vi-VN')} – {new Date(semester.end_date).toLocaleDateString('vi-VN')}</div><div className="module-secondary-text">Cập nhật {new Date(semester.updated_at).toLocaleDateString('vi-VN')}</div></td>
                    <td>
                      <div className="module-badges">
                        <button
                          type="button"
                          className="module-badge"
                          style={{ cursor: 'pointer', background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid rgba(37, 99, 235, 0.2)' }}
                          onClick={() => navigate(`/admin/classes?semester=${encodeURIComponent(semester.code)}`)}
                          title={`Xem các lớp thuộc học kỳ ${semester.code}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>class</span>
                          {semester.class_count ?? 0} lớp học
                        </button>
                        <span className="module-badge module-badge--muted">
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>groups</span>
                          {semester.student_count ?? 0} SV
                        </span>
                      </div>
                    </td>
                    <td><div className="module-badges">
                      {semester.is_current && <span className="module-badge module-badge--success"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>Hiện tại</span>}
                      <span className={`module-badge ${semester.is_active ? '' : 'module-badge--muted'}`}>{semester.is_active ? 'Đang mở' : 'Đã đóng'}</span>
                      {semester.is_locked && <span className="module-badge module-badge--danger"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock</span>Đã khóa</span>}
                    </div></td>
                    <td><div className="module-row__actions">
                      <button className="module-icon-button" type="button" onClick={() => openEdit(semester)} disabled={semester.is_locked} aria-label={`Sửa ${semester.name}`} title="Sửa học kỳ"><span className="material-symbols-outlined">edit</span></button>
                      {semester.is_active && !semester.is_current && <button className="module-icon-button" type="button" onClick={() => transition(semester, 'activate')} disabled={busyId !== '' || semester.is_locked} aria-label={`Kích hoạt ${semester.name}`} title="Đặt làm học kỳ hiện tại"><span className="material-symbols-outlined">play_circle</span></button>}
                      {semester.is_active && <button className="module-icon-button" type="button" onClick={() => transition(semester, 'close')} disabled={busyId !== '' || semester.is_locked} aria-label={`Đóng ${semester.name}`} title="Đóng học kỳ"><span className="material-symbols-outlined">event_busy</span></button>}
                      {!semester.is_active && !semester.is_locked && (
                        <>
                          <button className="module-icon-button" type="button" onClick={() => transition(semester, 'reopen')} disabled={busyId !== ''} aria-label={`Mở lại ${semester.name}`} title="Mở lại học kỳ"><span className="material-symbols-outlined">restart_alt</span></button>
                          <button className="module-icon-button module-icon-button--danger" type="button" onClick={() => transition(semester, 'lock')} disabled={busyId !== ''} aria-label={`Khóa ${semester.name}`} title="Khóa vĩnh viễn học kỳ"><span className="material-symbols-outlined">lock</span></button>
                        </>
                      )}
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
