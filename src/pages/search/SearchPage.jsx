import React, { useCallback, useEffect, useState } from 'react';
import { searchContent } from '../../services/search.service';
import { useLanguage } from '../../contexts/LanguageContext';
import '../module-pages.css';

const TYPES = [
  { value: '', labelKey: 'all', icon: 'apps' },
  { value: 'class', labelKey: 'class', icon: 'groups' },
  { value: 'assignment', labelKey: 'assignment', icon: 'assignment' },
  { value: 'material', labelKey: 'material', icon: 'description' },
  { value: 'flashcard', labelKey: 'flashcard', icon: 'style' },
];

const TYPE_META = Object.fromEntries(TYPES.filter((item) => item.value).map((item) => [item.value, item]));
const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

export default function SearchPage() {
  const { t } = useLanguage();
  const S = t?.search || {};

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
      setError(errorMessage(requestError, S.searchError || 'Không thể thực hiện tìm kiếm. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [query, type, page, limit]);

  useEffect(() => { runSearch(); }, [runSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setQuery(draftQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftQuery]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="module-page">
      <section className="search-hero card">
        <p className="module-page__eyebrow">{S.eyebrow || 'Module 3 · Global Search'}</p>
        <h1 className="module-page__title">{S.title || 'Tìm kiếm trong EDUX'}</h1>
        <p className="module-page__subtitle">{S.subtitle || 'Tìm lớp học, bài tập, tài liệu và bộ flashcard mà tài khoản của bạn được phép truy cập.'}</p>

        <div className="search-form">
          <div className="module-search">
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <label className="sr-only" htmlFor="global-search">{S.inputLabel || 'Nội dung cần tìm'}</label>
            <input 
              id="global-search" 
              className="module-input" 
              value={draftQuery} 
              onChange={(event) => setDraftQuery(event.target.value)} 
              placeholder={S.inputPlaceholder || 'Nhập để lọc lớp, bài tập, tài liệu hoặc flashcard'} 
              maxLength={100} 
              autoFocus 
            />
          </div>
        </div>

        <div className="search-types" role="group" aria-label={S.typesAriaLabel || 'Loại nội dung'}>
          {TYPES.map((item) => {
            const labelText = S.types?.[item.labelKey] || (item.value === '' ? 'Tất cả' : item.value);
            return (
              <button 
                key={item.value || 'all'} 
                className={`search-type${type === item.value ? ' search-type--active' : ''}`} 
                type="button" 
                aria-pressed={type === item.value} 
                onClick={() => { setType(item.value); setPage(1); }}
              >
                {labelText}
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <div className="module-alert" role="alert">
          <span className="material-symbols-outlined" aria-hidden="true">error</span>
          {error}
        </div>
      )}

      {loading ? (
        <section className="card module-state" aria-live="polite">
          <div>
            <div className="module-state__icon"><span className="material-symbols-outlined">progress_activity</span></div>
            <h2>{S.loadingTitle || 'Đang tải nội dung...'}</h2>
            <p>{S.loadingDesc || 'EDUX đang kiểm tra nội dung phù hợp với quyền truy cập của bạn.'}</p>
          </div>
        </section>
      ) : results.length === 0 ? (
        <section className="card module-state">
          <div>
            <div className="module-state__icon"><span className="material-symbols-outlined">search_off</span></div>
            <h2>{S.emptyTitle || 'Không có nội dung phù hợp'}</h2>
            <p>{query ? (S.emptyQueryDesc || 'Thử từ khóa ngắn hơn, kiểm tra chính tả hoặc chọn loại nội dung khác.') : (S.emptyDefaultDesc || 'Bộ lọc này chưa có dữ liệu mà tài khoản của bạn được phép truy cập.')}</p>
          </div>
        </section>
      ) : (
        <>
          <div className="module-page__header">
            <div>
              <h2 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.1rem' }}>
                {query 
                  ? (S.resultQueryHeader ? S.resultQueryHeader.replace('{query}', query) : `Kết quả cho “${query}”`) 
                  : type 
                    ? (S.resultTypeHeader ? S.resultTypeHeader.replace('{type}', TYPE_META[type]?.labelKey ? S.types?.[TYPE_META[type].labelKey] : type) : `Tất cả nội dung`) 
                    : (S.resultAllHeader || 'Tất cả nội dung')}
              </h2>
              <p className="module-page__subtitle">
                {S.resultCount ? S.resultCount.replace('{total}', total) : `Hiển thị ${total} kết quả bạn có quyền truy cập`}
              </p>
            </div>
          </div>
          
          <section className="search-results" aria-label={S.resultsAriaLabel || 'Kết quả tìm kiếm'}>
            {results.map((result) => {
              const meta = TYPE_META[result.type] || { labelKey: result.type, icon: 'search' };
              const metaLabel = S.types?.[meta.labelKey] || result.type;
              return (
                <article className="search-result card" key={`${result.type}-${result.id}`}>
                  <div className="search-result__icon"><span className="material-symbols-outlined" aria-hidden="true">{meta.icon}</span></div>
                  <div style={{ minWidth: 0 }}>
                    <h2>{result.title}</h2>
                    <p>{result.description || (S.noDescription || 'Không có mô tả')}</p>
                    <div className="search-result__meta">
                      <span className="module-badge">{metaLabel}</span>
                      {result.subtitle && <span className="module-badge module-badge--muted">{result.subtitle}</span>}
                      {result.created_at && <span className="module-secondary-text">{new Date(result.created_at).toLocaleDateString('vi-VN')}</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="module-pagination card">
            <span>
              {S.paginationInfo 
                ? S.paginationInfo.replace('{page}', page).replace('{totalPages}', totalPages).replace('{total}', total)
                : `Trang ${page}/${totalPages} · ${total} kết quả`}
            </span>
            <div className="module-pagination__buttons">
              <button className="btn btn-secondary" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                {S.prevBtn || 'Trước'}
              </button>
              <button className="btn btn-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                {S.nextBtn || 'Sau'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}