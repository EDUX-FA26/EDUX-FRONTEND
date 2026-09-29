import React, { useCallback, useEffect, useState } from 'react';
import { searchContent } from '../../services/search.service';
import '../module-pages.css';

const TYPES = [
  { value: '', label: 'Tất cả', icon: 'apps' },
  { value: 'class', label: 'Lớp học', icon: 'groups' },
  { value: 'assignment', label: 'Bài tập', icon: 'assignment' },
  { value: 'material', label: 'Tài liệu', icon: 'description' },
  { value: 'flashcard', label: 'Flashcard', icon: 'style' },
];

const TYPE_META = Object.fromEntries(TYPES.filter((item) => item.value).map((item) => [item.value, item]));
const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

export default function SearchPage() {
  const [draftQuery, setDraftQuery] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const limit = 12;

  const runSearch = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    setError('');
    try {
      const params = { q: query, page, limit };
      if (type) params.type = type;
      const response = await searchContent(params);
      setResults(response.data || []);
      setTotal(response.pagination?.total ?? response.total ?? 0);
    } catch (requestError) {
      setResults([]);
      setTotal(0);
      setError(errorMessage(requestError, 'Không thể thực hiện tìm kiếm. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [query, type, page]);

  useEffect(() => { runSearch(); }, [runSearch]);

  const submit = (event) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();
    if (!nextQuery) return;
    setPage(1);
    setQuery(nextQuery);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="module-page">
      <section className="search-hero card">
        <p className="module-page__eyebrow">Module 3 · Global Search</p>
        <h1 className="module-page__title">Tìm kiếm trong EDUX</h1>
        <p className="module-page__subtitle">Tìm lớp học, bài tập, tài liệu và bộ flashcard mà tài khoản của bạn được phép truy cập.</p>

        <form className="search-form" onSubmit={submit}>
          <div className="module-search">
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <label className="sr-only" htmlFor="global-search">Nội dung cần tìm</label>
            <input id="global-search" className="module-input" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Nhập tên lớp, bài tập, tài liệu hoặc flashcard" maxLength={100} required autoFocus />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading || !draftQuery.trim()}>
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </form>

        <div className="search-types" role="group" aria-label="Loại nội dung">
          {TYPES.map((item) => (
            <button key={item.value || 'all'} className={`search-type${type === item.value ? ' search-type--active' : ''}`} type="button" aria-pressed={type === item.value} onClick={() => { setType(item.value); setPage(1); }}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="module-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}

      {!query ? (
        <section className="card module-state">
          <div><div className="module-state__icon"><span className="material-symbols-outlined">manage_search</span></div><h2>Bắt đầu bằng một từ khóa</h2><p>Kết quả được giới hạn theo vai trò và các lớp học mà bạn có quyền truy cập.</p></div>
        </section>
      ) : loading ? (
        <section className="card module-state" aria-live="polite">
          <div><div className="module-state__icon"><span className="material-symbols-outlined">progress_activity</span></div><h2>Đang tìm kiếm...</h2><p>EDUX đang kiểm tra nội dung phù hợp với quyền truy cập của bạn.</p></div>
        </section>
      ) : results.length === 0 ? (
        <section className="card module-state">
          <div><div className="module-state__icon"><span className="material-symbols-outlined">search_off</span></div><h2>Không tìm thấy kết quả</h2><p>Thử từ khóa ngắn hơn, kiểm tra chính tả hoặc chọn loại nội dung khác.</p></div>
        </section>
      ) : (
        <>
          <div className="module-page__header">
            <div><h2 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.1rem' }}>Kết quả cho “{query}”</h2><p className="module-page__subtitle">Tìm thấy {total} kết quả</p></div>
          </div>
          <section className="search-results" aria-label="Kết quả tìm kiếm">
            {results.map((result) => {
              const meta = TYPE_META[result.type] || { label: result.type, icon: 'search' };
              return (
                <article className="search-result card" key={`${result.type}-${result.id}`}>
                  <div className="search-result__icon"><span className="material-symbols-outlined" aria-hidden="true">{meta.icon}</span></div>
                  <div style={{ minWidth: 0 }}>
                    <h2>{result.title}</h2>
                    <p>{result.description || 'Không có mô tả'}</p>
                    <div className="search-result__meta">
                      <span className="module-badge">{meta.label}</span>
                      {result.subtitle && <span className="module-badge module-badge--muted">{result.subtitle}</span>}
                      {result.created_at && <span className="module-secondary-text">{new Date(result.created_at).toLocaleDateString('vi-VN')}</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
          <div className="module-pagination card"><span>Trang {page}/{totalPages} · {total} kết quả</span><div className="module-pagination__buttons"><button className="btn btn-secondary" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Trước</button><button className="btn btn-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div></div>
        </>
      )}
    </div>
  );
}
