import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import FlashcardService from '../../services/flashcard.service';
import ClassService from '../../services/class.service';
import {
  BookOpen, Layers, Globe, Lock, Search, BarChart2,
  CheckCircle, Clock, Zap, ChevronRight, RefreshCw, ArrowLeft, FileCheck,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function DeckStatusBadge({ isPublic, t }) {
  const F = t.flashcards || {};
  if (isPublic) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '0.6875rem', fontWeight: 700, padding: '3px 10px',
        borderRadius: '9999px', background: 'rgba(20,184,166,0.12)',
        color: 'var(--color-accent-teal)',
      }}>
        <Globe style={{ width: '11px', height: '11px' }} />
        {F.statusPublic || 'Công khai'}
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '0.6875rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: '9999px', background: 'var(--color-primary-bg)',
      color: 'var(--color-ink-muted)',
    }}>
      <Lock style={{ width: '11px', height: '11px' }} />
      {F.statusPrivate || 'Riêng tư'}
    </span>
  );
}

function StatsBar({ stats }) {
  if (!stats) return null;
  const { total_cards, reviewed_cards, accuracy } = stats;
  const pct = total_cards > 0 ? Math.round((reviewed_cards / total_cards) * 100) : 0;

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
          {reviewed_cards}/{total_cards} đã ôn
        </span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: accuracy >= 70 ? 'var(--color-accent-teal)' : 'var(--color-primary)' }}>
          {accuracy}% chính xác
        </span>
      </div>
      <div style={{ height: '4px', borderRadius: '9999px', background: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '9999px',
          width: `${pct}%`,
          background: accuracy >= 70
            ? 'var(--color-accent-teal)'
            : 'linear-gradient(90deg, var(--color-primary), #f97316)',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function DeckCard({ deck, stats, onStudy, onTest, t }) {
  const F = t.flashcards || {};
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="card animate-fade-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #f97316 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Layers style={{ width: '20px', height: '20px', color: 'white' }} />
        </div>
        <DeckStatusBadge isPublic={deck.is_public} t={t} />
      </div>

      {/* Title + Subject */}
      <div>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px', lineHeight: 1.4 }}>
          {deck.title}
        </h3>
        {deck.subject_name && (
          <span style={{
            fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
            background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)',
            padding: '2px 8px', borderRadius: '6px',
          }}>
            {deck.subject_code} · {deck.subject_name}
          </span>
        )}
        {deck.description && (
          <p style={{
            fontSize: '0.8125rem', color: 'var(--color-ink-muted)',
            marginTop: '8px', marginBottom: 0,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {deck.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
          <BookOpen style={{ width: '14px', height: '14px' }} />
          {deck.card_count ?? 0} {F.cards || 'thẻ'}
        </div>
        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--color-border-medium)' }} />
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)', fontWeight: 500 }}>
          {deck.creator_name}
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar stats={stats} />

      {/* Actions: Study CTA & Test CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        paddingTop: '12px', borderTop: '1px solid var(--color-border)', marginTop: '2px',
      }}>
        <button
          onClick={() => onStudy(deck.id)}
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px 12px', borderRadius: '9px',
            background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)',
            border: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        >
          <Clock style={{ width: '14px', height: '14px' }} />
          {F.studyNow || 'Học ngay'}
        </button>

        <button
          onClick={() => onTest(deck.id)}
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px 12px', borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)',
            color: 'white', border: 'none', fontSize: '0.8125rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <FileCheck style={{ width: '14px', height: '14px' }} />
          Kiểm tra
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { t } = useLanguage();
  const F = t.flashcards || {};

  const [decks, setDecks] = useState([]);
  const [total, setTotal] = useState(0);
  const [deckStats, setDeckStats] = useState({});   // { deckId: stats }
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState({});
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterPublic, setFilterPublic] = useState('all'); // 'all' | 'true' | 'false'
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: LIMIT };
      if (subjectId) params.subject_id = subjectId;
      if (filterPublic !== 'all') params.is_public = filterPublic;
      const res = await FlashcardService.getDecks(params);
      const list = res.data || [];
      setDecks(list);
      setTotal(res.pagination?.total ?? list.length);

      // Fetch stats per deck in background
      list.forEach(async (deck) => {
        setStatsLoading((s) => ({ ...s, [deck.id]: true }));
        try {
          const statsRes = await FlashcardService.getDeckReviewStats(deck.id);
          setDeckStats((prev) => ({ ...prev, [deck.id]: statsRes.data }));
        } catch {
          // stats không bắt buộc
        } finally {
          setStatsLoading((s) => ({ ...s, [deck.id]: false }));
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || F.loadError || 'Không thể tải danh sách bộ thẻ.');
    } finally {
      setLoading(false);
    }
  }, [page, filterPublic, subjectId]);

  const [subjectInfo, setSubjectInfo] = useState(null);

  useEffect(() => {
    fetchDecks();
    if (subjectId) {
      localStorage.setItem('student_last_subject_id', subjectId);
      ClassService.getMyClasses().then((res) => {
        const clsList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const match = clsList.find((c) => c.subject_id === subjectId);
        if (match) {
          setSubjectInfo({
            code: match.subject_code,
            name: match.subject_name,
          });
        }
      }).catch(() => {});
    }
  }, [fetchDecks, subjectId]);

  // Subject title from subjectInfo or first deck
  const currentSubjectInfo = subjectInfo || decks.find((d) => d.subject_name) || null;
  const subjectCode = currentSubjectInfo?.subject_code || currentSubjectInfo?.code || '';
  const subjectName = currentSubjectInfo?.subject_name || currentSubjectInfo?.name || '';

  // Client-side search filter
  const filtered = decks.filter((d) =>
    !search.trim() ||
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.subject_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.subject_code || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div
      className="w-full max-w-[1600px] mx-auto h-[calc(100vh-64px)] min-w-0 overflow-hidden flex flex-col px-4 sm:px-5 lg:px-6 xl:px-8 pt-4 sm:pt-5 pb-4 box-border"
      style={{
        height: 'calc(100vh - var(--dashboard-header-height, 64px))',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── 1. Minimalist Subject Header ── */}
      <div className="shrink-0 flex items-center gap-3.5 pb-4 mb-4 border-b border-slate-200">
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('student_last_subject_id');
            navigate('/student/flashcards');
          }}
          title="Quay lại danh sách môn học"
          className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Cụm thông tin môn học */}
        <div className="min-w-0 flex-1">
          {/* Hàng 1 */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {subjectCode && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200 font-mono">
                {subjectCode}
              </span>
            )}
            <h1 className="text-xl font-bold text-slate-900 m-0 tracking-tight">
              {subjectName || F.heroTitle || 'Bộ thẻ ghi nhớ'}
            </h1>
          </div>

          {/* Hàng 2 */}
          <p className="text-sm text-slate-500 mt-0.5 m-0">
            {F.heroDesc || 'Học flashcard theo thuật toán SRS để ghi nhớ sâu và duy trì streak mỗi ngày.'}
          </p>
        </div>
      </div>

      {/* ── 2. Filter Bar (Giữ nguyên 100% UI, shrink-0) ── */}
      <div className="shrink-0 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px', maxWidth: '360px' }}>
          <Search style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            width: '16px', height: '16px', color: 'var(--color-ink-soft)', pointerEvents: 'none',
          }} />
          <input
            id="flashcard-search"
            type="text"
            placeholder={F.searchPlaceholder || 'Tìm bộ thẻ, môn học...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px 9px 36px',
              borderRadius: '10px', border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-ink)',
              fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>

        {/* Visibility filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'all', label: F.filterAll || 'Tất cả' },
            { value: 'true', label: F.filterPublic || 'Công khai', icon: <Globe style={{ width: '13px', height: '13px' }} /> },
            { value: 'false', label: F.filterPrivate || 'Riêng tư', icon: <Lock style={{ width: '13px', height: '13px' }} /> },
          ].map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => { setFilterPublic(value); setPage(1); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '7px 14px', borderRadius: '9px', border: '1px solid',
                fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                borderColor: filterPublic === value ? 'var(--color-primary)' : 'var(--color-border)',
                background: filterPublic === value ? 'var(--color-primary-card)' : 'var(--color-surface)',
                color: filterPublic === value ? 'var(--color-primary-dark)' : 'var(--color-ink-muted)',
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchDecks}
          aria-label={F.refresh || 'Làm mới'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '9px',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            cursor: 'pointer', color: 'var(--color-ink-muted)', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-ink-muted)'; }}
        >
          <RefreshCw style={{ width: '15px', height: '15px' }} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* Count */}
        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginLeft: 'auto', fontWeight: 600 }}>
          {loading ? '...' : `${filtered.length} ${F.deckCount || 'bộ thẻ'}`}
        </span>
      </div>

      {/* ── 3. Scrollable Deck List Area (Chỉ cuộn danh sách bộ thẻ bên dưới) ── */}
      <div
        className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
      >
        {/* Deck Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                <div className="skeleton" style={{ width: '70%', height: '16px' }} />
                <div className="skeleton" style={{ width: '50%', height: '12px' }} />
                <div className="skeleton" style={{ width: '100%', height: '4px', borderRadius: '9999px' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{
            padding: '24px', borderRadius: '14px',
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
            color: '#ef4444', textAlign: 'center', fontSize: '0.875rem',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>error</span>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: 'var(--color-ink-muted)',
            background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)',
          }}>
            <Layers style={{ width: '48px', height: '48px', opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink)' }}>
              {F.emptyTitle || 'Chưa có bộ thẻ nào'}
            </p>
            <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
              {search
                ? (F.emptySearch || 'Không tìm thấy kết quả phù hợp.')
                : (F.emptyDesc || 'Hiện tại chưa có bộ thẻ nào được chia sẻ.')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                stats={deckStats[deck.id]}
                onStudy={(id) => navigate(`/student/flashcards/${id}/study`)}
                onTest={(id) => navigate(`/student/flashcards/${id}/test`)}
                t={t}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--color-border)',
                background: 'var(--color-surface)', color: 'var(--color-ink-muted)',
                fontSize: '0.8125rem', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1, fontFamily: 'var(--font-sans)',
              }}
            >
              ← {F.prev || 'Trước'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px', border: '1px solid',
                  fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  borderColor: p === page ? 'var(--color-primary)' : 'var(--color-border)',
                  background: p === page ? 'var(--color-primary-card)' : 'var(--color-surface)',
                  color: p === page ? 'var(--color-primary-dark)' : 'var(--color-ink-muted)',
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--color-border)',
                background: 'var(--color-surface)', color: 'var(--color-ink-muted)',
                fontSize: '0.8125rem', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.5 : 1, fontFamily: 'var(--font-sans)',
              }}
            >
              {F.next || 'Tiếp'} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
