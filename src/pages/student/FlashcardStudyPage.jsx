import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import FlashcardService from '../../services/flashcard.service';
import {
  ArrowLeft, CheckCircle, BarChart2, Zap, RotateCcw,
  ChevronLeft, ChevronRight, Eye, EyeOff, Trophy, Layers,
} from 'lucide-react';

// ─── Card Flip Component ──────────────────────────────────────────────────────

function FlipCard({ card, flipped, onFlip, t }) {
  const F = t.flashcards || {};
  const typeLabels = {
    essay: F.typeEssay || 'Tự luận',
    multiple_choice: F.typeMultiple || 'Trắc nghiệm',
    true_false: F.typeTrueFalse || 'Đúng/Sai',
  };

  const diffColor = { easy: '#16a34a', medium: '#ca8a04', hard: '#dc2626' };
  const diffLabel = {
    easy: F.diffEasy || 'Dễ',
    medium: F.diffMedium || 'Trung bình',
    hard: F.diffHard || 'Khó',
  };

  return (
    <div style={{ perspective: '1200px', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? F.ariaShowQuestion || 'Hiện câu hỏi' : F.ariaShowAnswer || 'Hiện đáp án'}
        onClick={onFlip}
        onKeyDown={(e) => e.key === 'Enter' && onFlip()}
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
          minHeight: '260px',
        }}
      >
        {/* ── FRONT (Question) ── */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          borderRadius: '20px', overflow: 'hidden',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Top bar */}
          <div style={{
            padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-primary-bg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)',
              }}>
                {typeLabels[card.type] || card.type}
              </span>
              {card.difficulty && (
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                  background: `${diffColor[card.difficulty]}18`,
                  color: diffColor[card.difficulty],
                }}>
                  {diffLabel[card.difficulty] || card.difficulty}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-ink-soft)' }}>
              <Eye style={{ width: '14px', height: '14px' }} />
              {F.tapToFlip || 'Nhấn để lật'}
            </div>
          </div>
          {/* Question body */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '28px 32px', textAlign: 'center',
          }}>
            <p style={{
              fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-ink)',
              lineHeight: 1.65, margin: 0,
            }}>
              {card.question}
            </p>
          </div>
        </div>

        {/* ── BACK (Answer) ── */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '20px', overflow: 'hidden',
          background: 'var(--color-surface)',
          border: '2px solid var(--color-primary)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Top bar */}
          <div style={{
            padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-primary-card)',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              {F.answer || 'Đáp án'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-ink-soft)' }}>
              <EyeOff style={{ width: '14px', height: '14px' }} />
              {F.tapToFlipBack || 'Nhấn để lật lại'}
            </div>
          </div>
          {/* Answer body */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px 32px', textAlign: 'center', gap: '16px',
          }}>
            <p style={{
              fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary-dark)',
              lineHeight: 1.65, margin: 0,
            }}>
              {card.answer}
            </p>
            {card.explanation && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px',
                background: 'var(--color-primary-bg)',
                border: '1px solid var(--color-border)',
                width: '100%', textAlign: 'left',
              }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: '4px' }}>
                  {F.explanation || 'Giải thích'}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink)', margin: 0, lineHeight: 1.6 }}>
                  {card.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Rating Buttons ───────────────────────────────────────────────────────────

function RatingButtons({ onRate, disabled, t }) {
  const F = t.flashcards || {};
  const ratings = [
    { key: 'again', label: F.ratingAgain || 'Lại', emoji: '😔', bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
    { key: 'hard', label: F.ratingHard || 'Khó', emoji: '😓', bg: '#fff7ed', color: '#ea580c', border: '#fdba74' },
    { key: 'good', label: F.ratingGood || 'Tốt', emoji: '😊', bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
    { key: 'easy', label: F.ratingEasy || 'Dễ', emoji: '🤩', bg: '#f0fdf4', color: '#16a34a', border: '#86efac' },
  ];
  return (
    <div style={{
      display: 'flex', gap: '10px', justifyContent: 'center',
      flexWrap: 'wrap',
    }}>
      {ratings.map(({ key, label, emoji, bg, color, border }) => (
        <button
          key={key}
          id={`rate-${key}`}
          onClick={() => onRate(key)}
          disabled={disabled}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '12px 20px', borderRadius: '14px',
            border: `1.5px solid ${border}`,
            background: bg, color,
            fontSize: '0.8125rem', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            opacity: disabled ? 0.5 : 1,
            minWidth: '76px',
          }}
          onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${border}`; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ fontSize: '1.25rem' }}>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({ stats, deckTitle, onRestart, onBack, t }) {
  const F = t.flashcards || {};
  const pct = stats.total > 0 ? Math.round(((stats.good + stats.easy) / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '24px', padding: '40px 20px', textAlign: 'center',
    }}>
      {/* Trophy */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #fef08a 0%, #fbbf24 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(251,191,36,0.35)',
      }}>
        <Trophy style={{ width: '40px', height: '40px', color: '#92400e' }} />
      </div>

      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 6px' }}>
          {F.completeTitle || 'Hoàn thành phiên học!'}
        </h2>
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.875rem' }}>
          {deckTitle}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px',
        width: '100%', maxWidth: '380px',
      }}>
        {[
          { label: F.statTotal || 'Tổng thẻ', value: stats.total, color: 'var(--color-ink)' },
          { label: F.statAccuracy || 'Chính xác', value: `${pct}%`, color: pct >= 70 ? '#16a34a' : '#dc2626' },
          { label: F.statGoodEasy || 'Tốt / Dễ', value: stats.good + stats.easy, color: '#16a34a' },
          { label: F.statAgainHard || 'Lại / Khó', value: stats.again + stats.hard, color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '16px', borderRadius: '14px',
            background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)',
          }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: '6px' }}>
              {label}
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color, margin: 0, fontFamily: 'var(--font-mono)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          id="btn-restart-study"
          onClick={onRestart}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '10px',
            background: 'var(--color-primary)', color: 'white',
            border: 'none', fontSize: '0.875rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          <RotateCcw style={{ width: '16px', height: '16px' }} />
          {F.restartBtn || 'Học lại'}
        </button>
        <button
          id="btn-back-to-decks"
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '10px',
            background: 'var(--color-surface)', color: 'var(--color-ink)',
            border: '1px solid var(--color-border)',
            fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          <Layers style={{ width: '16px', height: '16px' }} />
          {F.backToDecks || 'Về danh sách'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Study Page ──────────────────────────────────────────────────────────

export default function FlashcardStudyPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const F = t.flashcards || {};

  const [deck, setDeck] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });
  const completedRef = useRef(false);

  const loadStudy = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCompleted(false);
    completedRef.current = false;
    setCurrentIdx(0);
    setFlipped(false);
    setSessionStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });
    try {
      const [deckRes, queueRes] = await Promise.all([
        FlashcardService.getDeckById(deckId),
        FlashcardService.getStudyQueue(deckId),
      ]);
      setDeck(deckRes.data);
      // Backend trả: { success, data: { deck_id, cards: [...], stats: {...} } }
      setQueue(queueRes.data?.cards || []);
    } catch (err) {
      setError(err.response?.data?.message || F.studyLoadError || 'Không thể tải bộ thẻ.');
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => { loadStudy(); }, [loadStudy]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (completed) return;
      if (e.key === ' ' || e.key === 'f') { e.preventDefault(); setFlipped((f) => !f); }
      if (!flipped) return;
      if (e.key === '1') handleRate('again');
      if (e.key === '2') handleRate('hard');
      if (e.key === '3') handleRate('good');
      if (e.key === '4') handleRate('easy');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, completed]);

  const handleRate = async (result) => {
    if (submitting || completed) return;
    const card = queue[currentIdx];
    if (!card) return;
    setSubmitting(true);

    try {
      await FlashcardService.submitReview(card.id, result);
      setSessionStats((s) => ({ ...s, total: s.total + 1, [result]: s[result] + 1 }));

      const nextIdx = currentIdx + 1;
      if (nextIdx >= queue.length) {
        // Session complete
        if (!completedRef.current) {
          completedRef.current = true;
          try { await FlashcardService.completeDeck(deckId); } catch { /* non-blocking */ }
          setCompleted(true);
        }
      } else {
        setCurrentIdx(nextIdx);
        setFlipped(false);
      }
    } catch (err) {
      console.error('Review submit error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const currentCard = queue[currentIdx];
  const progress = queue.length > 0 ? ((currentIdx) / queue.length) * 100 : 0;

  const studyStatusLabel = {
    new: F.statusNew || 'Mới',
    due: F.statusDue || 'Cần ôn',
    not_due: F.statusNotDue || 'Chưa đến hạn',
  };
  const studyStatusColor = {
    new: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' },
    due: { bg: 'rgba(249,115,22,0.12)', color: '#ea580c' },
    not_due: { bg: 'rgba(22,163,74,0.1)', color: '#16a34a' },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ width: '200px', height: '16px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ width: '100%', height: '300px', borderRadius: '20px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#ef4444', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>error</span>
        {error}
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Back btn */}
        <button id="btn-back-empty" onClick={() => navigate('/student/flashcards')} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)',
          fontFamily: 'var(--font-sans)',
        }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          {F.backToDecks || 'Về danh sách'}
        </button>
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
          <CheckCircle style={{ width: '48px', height: '48px', color: '#16a34a', display: 'block', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px' }}>
            {F.emptyQueueTitle || 'Không có thẻ nào cần ôn!'}
          </h2>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.875rem' }}>
            {F.emptyQueueDesc || 'Bộ thẻ này chưa có thẻ nào hoặc tất cả thẻ chưa đến hạn ôn.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          id="btn-back-study"
          onClick={() => navigate('/student/flashcards')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          {F.backToDecks || 'Về danh sách'}
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
          {completed ? queue.length : currentIdx + 1} / {queue.length}
        </span>
      </div>

      {/* ── Deck title ── */}
      {deck && (
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 4px' }}>
            {deck.title}
          </h1>
          {deck.subject_name && (
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', padding: '2px 8px', borderRadius: '6px' }}>
              {deck.subject_code} · {deck.subject_name}
            </span>
          )}
        </div>
      )}

      {/* ── Progress bar ── */}
      <div>
        <div style={{ height: '6px', borderRadius: '9999px', background: 'var(--color-border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '9999px',
            width: `${completed ? 100 : progress}%`,
            background: 'linear-gradient(90deg, var(--color-primary) 0%, #6366f1 100%)',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)' }}>
            {sessionStats.good + sessionStats.easy} {F.progressCorrect || 'đúng'} · {sessionStats.again + sessionStats.hard} {F.progressWrong || 'cần ôn thêm'}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
            {Math.round(completed ? 100 : progress)}%
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      {completed ? (
        <CompletionScreen
          stats={sessionStats}
          deckTitle={deck?.title || ''}
          onRestart={loadStudy}
          onBack={() => navigate('/student/flashcards')}
          t={t}
        />
      ) : (
        <>
          {/* Card status badge */}
          {currentCard?.study_status && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px',
                ...studyStatusColor[currentCard.study_status],
              }}>
                {studyStatusLabel[currentCard.study_status] || currentCard.study_status}
              </span>
            </div>
          )}

          {/* Flip card */}
          <FlipCard
            card={currentCard}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            t={t}
          />

          {/* Keyboard hint */}
          <p style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--color-ink-soft)' }}>
            {F.keyHint || 'Phím cách hoặc F để lật · 1–4 để đánh giá sau khi lật'}
          </p>

          {/* Rating buttons — only show after flip */}
          <div style={{
            opacity: flipped ? 1 : 0,
            transform: flipped ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.3s, transform 0.3s',
            pointerEvents: flipped ? 'auto' : 'none',
          }}>
            <p style={{ textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '12px' }}>
              {F.ratingPrompt || 'Bạn nhớ được mức độ nào?'}
            </p>
            <RatingButtons onRate={handleRate} disabled={submitting} t={t} />
          </div>
        </>
      )}
    </div>
  );
}
