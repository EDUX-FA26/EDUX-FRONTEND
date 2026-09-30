import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import FlashcardService from '../../services/flashcard.service';
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

  useEffect(() => {
    fetchDecks();
    if (subjectId) {
      localStorage.setItem('student_last_subject_id', subjectId);
    }
  }, [fetchDecks, subjectId]);

  // Subject title from first deck if available
  const currentSubjectInfo = decks.find((d) => d.subject_name) || null;

  // Client-side search filter
  const filtered = decks.filter((d) =>
    !search.trim() ||
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.subject_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.subject_code || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Top Back Button ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => {
            localStorage.removeItem('student_last_subject_id');
            navigate('/student/flashcards?select=true');
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '10px',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-ink)', fontSize: '0.8125rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-dark)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-ink)'; }}
        >
          <ArrowLeft style={{ width: '15px', height: '15px' }} />
          Chọn môn học khác
        </button>
      </div>

      {/* ── Hero Banner ── */}
      <div style={{
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        color: 'white', padding: '28px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '260px', height: '260px',
          background: 'rgba(99,102,241,0.25)', borderRadius: '50%',
          filter: 'blur(70px)', transform: 'translate(60px, -60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: '30%', width: '200px', height: '200px',
          background: 'rgba(249,115,22,0.15)', borderRadius: '50%',
          filter: 'blur(60px)', transform: 'translateY(50px)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 14px', borderRadius: '9999px',
            background: 'rgba(255,255,255,0.1)',
            fontSize: '0.75rem', color: '#c7d2fe', fontWeight: 600, marginBottom: '12px',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
            {currentSubjectInfo?.subject_code ? `${currentSubjectInfo.subject_code} · ${currentSubjectInfo.subject_name}` : (F.heroBadge || 'Hệ thống Flashcard · SRS')}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {currentSubjectInfo?.subject_name ? `Bộ thẻ: ${currentSubjectInfo.subject_name}` : (F.heroTitle || 'Bộ thẻ ghi nhớ')}
          </h1>
          <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.875rem', maxWidth: '520px' }}>
            {F.heroDesc || 'Học flashcard theo thuật toán SRS để ghi nhớ sâu và duy trì streak mỗi ngày.'}
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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

      {/* ── Deck Grid ── */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
  );
}
