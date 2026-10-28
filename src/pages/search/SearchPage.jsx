import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const paginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const items = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push('start-ellipsis');
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < totalPages - 1) items.push('end-ellipsis');
  items.push(totalPages);

  return items;
};

export default function SearchPage() {
  const { t } = useLanguage();
  const S = t?.search || {};
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q')?.trim() || '';

  const query = urlQuery;
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
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
    setPage(1);
  }, [urlQuery]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visiblePages = paginationItems(page, totalPages);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const handlePageJump = (event) => {
    event.preventDefault();
    const requestedPage = Number.parseInt(pageInput, 10);
    if (Number.isNaN(requestedPage)) {
      setPageInput(String(page));
      return;
    }
    setPage(Math.min(totalPages, Math.max(1, requestedPage)));
  };

  return (
    <div className="module-page search-page">
      <header className="search-page__header">
        <div className="search-page__heading">
          <div className="search-page__heading-icon" aria-hidden="true">
            <span className="material-symbols-outlined">search</span>
          </div>
          <div>
            <p className="search-page__eyebrow">{S.resultsEyebrow || 'TÌM KIẾM TOÀN HỆ THỐNG'}</p>
            <h1 className="module-page__title">
              {query
                ? (S.resultQueryHeader ? S.resultQueryHeader.replace('{query}', query) : `Kết quả cho “${query}”`)
                : (S.resultAllHeader || 'Khám phá nội dung')}
            </h1>
            <p className="module-page__subtitle">
              {loading
                ? (S.loadingTitle || 'Đang tải nội dung...')
                : (S.resultCount ? S.resultCount.replace('{total}', total) : `Hiển thị ${total} kết quả bạn có quyền truy cập`)}
            </p>
          </div>
        </div>
      </header>

      <section className="search-toolbar card" aria-label={S.typesAriaLabel || 'Loại nội dung'}>
        <div className="search-toolbar__label">
          <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
          <span>{S.filterLabel || 'Lọc theo'}</span>
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
              <div className="module-pagination__pages" aria-label={S.pageListLabel || 'Danh sách trang'}>
                {visiblePages.map((item) => (
                  typeof item === 'number' ? (
                    <button
                      className={`module-pagination__page${item === page ? ' module-pagination__page--active' : ''}`}
                      type="button"
                      key={item}
                      aria-label={`${S.pageLabel || 'Trang'} ${item}`}
                      aria-current={item === page ? 'page' : undefined}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
                  ) : (
                    <span className="module-pagination__ellipsis" key={item} aria-hidden="true">…</span>
                  )
                ))}
              </div>
              <button className="btn btn-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                {S.nextBtn || 'Sau'}
              </button>
              <form className="module-pagination__jump" onSubmit={handlePageJump}>
                <label htmlFor="search-page-jump">{S.jumpLabel || 'Đến trang'}</label>
                <input
                  id="search-page-jump"
                  type="number"
                  min="1"
                  max={totalPages}
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                />
                <button type="submit">{S.jumpBtn || 'Đi'}</button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
