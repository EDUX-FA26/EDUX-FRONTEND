import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import FlashcardService from '../../services/flashcard.service';
import MathText from '../../components/common/MathText';
import {
  ArrowLeft, CheckCircle, BarChart2, Zap, RotateCcw,
  ChevronLeft, ChevronRight, Eye, EyeOff, Trophy, Layers, Flame
} from 'lucide-react';

// ─── Card Flip Component ──────────────────────────────────────────────────────

function FlipCard({
  card,
  flipped,
  onFlip,
  currentIdx,
  totalCards,
  onPrev,
  onNext,
  t,
}) {
  const F = t.flashcards || {};
  const typeLabels = {
    multiple_choice: F.typeMultiple || 'Trắc nghiệm',
    true_false: F.typeTrueFalse || 'Đúng/Sai',
    essay: F.typeEssay || 'Tự luận',
  };

  const diffColor = { easy: '#16a34a', medium: '#ca8a04', hard: '#dc2626' };
  const diffLabel = {
    easy: F.diffEasy || 'Dễ',
    medium: F.diffMedium || 'Trung bình',
    hard: F.diffHard || 'Khó',
  };

  return (
    <div
      className="w-full max-w-4xl mx-auto"
      style={{ perspective: '1200px' }}
    >
      <div
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        className="w-full h-[330px] sm:h-[360px]"
      >
        {/* ── FRONT (Question) ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
          }}
          className="relative w-full h-[330px] sm:h-[360px] bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 flex flex-col justify-between select-none transition-all"
        >
          {/* Top bar inside card */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            {/* Left: Badges */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/60">
                {typeLabels[card.type] || card.type}
              </span>
              {card.difficulty && (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{
                    background: `${diffColor[card.difficulty]}18`,
                    color: diffColor[card.difficulty],
                  }}
                >
                  {diffLabel[card.difficulty] || card.difficulty}
                </span>
              )}
            </div>

            {/* Center: Counter badge */}
            <div className="px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-bold tracking-wide font-mono">
              {currentIdx + 1} / {totalCards}
            </div>

            {/* Right: Flip hint */}
            <div
              onClick={onFlip}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{F.tapToFlip || 'Nhấn để lật'}</span>
            </div>
          </div>

          {/* Previous button < (Absolute left) */}
          <button
            type="button"
            id="card-btn-prev"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            disabled={currentIdx === 0}
            aria-label="Câu trước"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-200 bg-slate-50/90 hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-600 flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Center Question content - Clickable to flip */}
          <div
            role="button"
            tabIndex={0}
            aria-label={F.ariaShowAnswer || 'Hiện đáp án'}
            onClick={onFlip}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFlip()}
            className="px-14 sm:px-16 flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center text-center cursor-pointer my-1"
          >
            <div className="text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed max-w-2xl">
              <MathText content={card.question} />
            </div>
          </div>

          {/* Next button > (Absolute right) */}
          <button
            type="button"
            id="card-btn-next"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            disabled={currentIdx === totalCards - 1}
            aria-label="Câu tiếp theo"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-200 bg-slate-50/90 hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-600 flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom spacer */}
          <div className="shrink-0 h-1" />
        </div>

        {/* ── BACK (Answer) ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="relative w-full h-[330px] sm:h-[360px] bg-white rounded-3xl border-2 border-orange-400 shadow-lg p-6 sm:p-8 flex flex-col justify-between select-none transition-all"
        >
          {/* Top bar inside card */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            {/* Left: Answer badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 border border-orange-200">
                {F.answer || 'Đáp án'}
              </span>
            </div>

            {/* Center: Counter badge */}
            <div className="px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-bold tracking-wide font-mono">
              {currentIdx + 1} / {totalCards}
            </div>

            {/* Right: Flip back hint */}
            <div
              onClick={onFlip}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer transition"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>{F.tapToFlipBack || 'Nhấn để lật lại'}</span>
            </div>
          </div>

          {/* Previous button < (Absolute left) */}
          <button
            type="button"
            id="card-btn-prev-back"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            disabled={currentIdx === 0}
            aria-label="Câu trước"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-200 bg-slate-50/90 hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-600 flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Center Answer content - Clickable to flip */}
          <div
            role="button"
            tabIndex={0}
            aria-label={F.ariaShowQuestion || 'Hiện câu hỏi'}
            onClick={onFlip}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFlip()}
            className="px-14 sm:px-16 flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center text-center cursor-pointer my-1"
          >
            <div className="flex flex-col items-center justify-center gap-2 w-full max-w-2xl py-1">
              <div className="text-lg sm:text-xl font-bold text-orange-600 leading-relaxed">
                <MathText content={card.answer} />
              </div>
              {card.explanation && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 text-left w-full max-w-2xl select-text">
                  <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wider mb-0.5">
                    {F.explanation || 'Giải thích'}
                  </p>
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    <MathText content={card.explanation} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next button > (Absolute right) */}
          <button
            type="button"
            id="card-btn-next-back"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            disabled={currentIdx === totalCards - 1}
            aria-label="Câu tiếp theo"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-200 bg-slate-50/90 hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-600 flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom spacer */}
          <div className="shrink-0 h-1" />
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
      display: 'flex', gap: '8px', justifyContent: 'center',
      flexWrap: 'wrap',
    }}>
      {ratings.map(({ key, label, emoji, bg, color, border }) => (
        <button
          key={key}
          id={`rate-${key}`}
          onClick={() => onRate(key)}
          disabled={disabled}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '10px',
            border: `1.5px solid ${border}`,
            background: bg, color,
            fontSize: '0.75rem', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            opacity: disabled ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 3px 10px ${border}`; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ fontSize: '1rem' }}>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({ stats, deckTitle, onRestart, onTakeTest, onBack, t }) {
  const F = t.flashcards || {};
  const pct = stats.total > 0 ? Math.round(((stats.good + stats.easy) / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-in flex-1 overflow-y-auto flex flex-col items-center justify-center gap-4 py-4 px-2 text-center">
      {/* Trophy */}
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #fef08a 0%, #fbbf24 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(251,191,36,0.35)',
      }}>
        <Trophy style={{ width: '32px', height: '32px', color: '#92400e' }} />
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 4px' }}>
          {F.completeTitle || 'Hoàn thành phiên học!'}
        </h2>
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.8125rem', margin: 0 }}>
          {deckTitle}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px',
        width: '100%', maxWidth: '360px',
      }}>
        {[
          { label: F.statTotal || 'Tổng thẻ', value: stats.total, color: 'var(--color-ink)' },
          { label: F.statAccuracy || 'Chính xác', value: `${pct}%`, color: pct >= 70 ? '#16a34a' : '#dc2626' },
          { label: F.statGoodEasy || 'Tốt / Dễ', value: stats.good + stats.easy, color: '#16a34a' },
          { label: F.statAgainHard || 'Lại / Khó', value: stats.again + stats.hard, color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '12px 14px', borderRadius: '12px',
            background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)',
          }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: '4px' }}>
              {label}
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color, margin: 0, fontFamily: 'var(--font-mono)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Streak Notice */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 16px', borderRadius: '12px',
        background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.25)',
        color: '#c2410c', maxWidth: '420px', width: '100%', textAlign: 'left'
      }}>
        <Flame style={{ width: '20px', height: '20px', flexShrink: 0, color: '#ea580c' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.4 }}>
          Lưu ý: Để tăng <strong>chuỗi Streak môn học</strong>, hãy nhấn <strong>Kiểm tra ngay</strong> và đạt từ <strong>50% câu đúng</strong> trở lên!
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          id="btn-take-test"
          onClick={onTakeTest}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)', color: 'white',
            border: 'none', fontSize: '0.8125rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CheckCircle style={{ width: '15px', height: '15px' }} />
          Kiểm tra ngay
        </button>
        <button
          id="btn-restart-study"
          onClick={onRestart}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px',
            background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)',
            border: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          <RotateCcw style={{ width: '15px', height: '15px' }} />
          {F.restartBtn || 'Học lại'}
        </button>
        <button
          id="btn-back-to-decks"
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px',
            background: 'var(--color-surface)', color: 'var(--color-ink)',
            border: '1px solid var(--color-border)',
            fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          <Layers style={{ width: '15px', height: '15px' }} />
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

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setFlipped(false);
    }
  }, [currentIdx]);

  const handleCompleteSession = useCallback(async () => {
    if (!completedRef.current) {
      completedRef.current = true;
      try {
        await FlashcardService.completeDeck(deckId);
      } catch (err) {
        console.error('Complete deck error', err);
      }
      setCompleted(true);
    }
  }, [deckId]);

  const handleNext = useCallback(() => {
    if (currentIdx < queue.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setFlipped(false);
    }
  }, [currentIdx, queue.length]);

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
        handleCompleteSession();
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (completed) return;

      // Space or F to flip card
      if (e.key === ' ' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }

      // ArrowLeft / ArrowRight to navigate cards
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
        return;
      }

      // 1-4 to rate when flipped
      if (!flipped) return;
      if (e.key === '1') handleRate('again');
      if (e.key === '2') handleRate('hard');
      if (e.key === '3') handleRate('good');
      if (e.key === '4') handleRate('easy');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, completed, handlePrev, handleNext]);

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

  const handleBack = () => {
    if (deck?.subject_id) {
      navigate(`/student/flashcards/subject/${deck.subject_id}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div
        className="w-full max-w-4xl mx-auto h-[calc(100vh-64px)] overflow-hidden flex flex-col px-6 py-3 box-border"
        style={{
          height: 'calc(100vh - var(--dashboard-header-height, 64px))',
          boxSizing: 'border-box',
        }}
      >
        <div className="shrink-0 flex items-center justify-between h-6">
          <div className="skeleton" style={{ width: '120px', height: '20px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '6px' }} />
        </div>
        <div className="shrink-0 mb-3">
          <div className="skeleton" style={{ width: '240px', height: '24px', borderRadius: '6px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '100%', height: '6px', borderRadius: '9999px' }} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="skeleton" style={{ width: '100%', maxWidth: '896px', height: '360px', borderRadius: '24px' }} />
        </div>
        <div className="shrink-0 min-h-[104px] flex flex-col items-center justify-start pt-2.5">
          <div className="skeleton" style={{ width: '280px', height: '16px', borderRadius: '6px' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="w-full max-w-4xl mx-auto h-[calc(100vh-64px)] overflow-hidden flex items-center justify-center px-6 py-4 box-border"
        style={{
          height: 'calc(100vh - var(--dashboard-header-height, 64px))',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ padding: '24px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#ef4444', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
          <p style={{ fontWeight: 600, margin: '0 0 16px' }}>{error}</p>
          <button
            onClick={handleBack}
            style={{
              padding: '8px 18px', borderRadius: '10px',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-ink)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div
        className="w-full max-w-4xl mx-auto h-[calc(100vh-64px)] overflow-hidden flex flex-col justify-between px-6 py-4 box-border"
        style={{
          height: 'calc(100vh - var(--dashboard-header-height, 64px))',
          boxSizing: 'border-box',
        }}
      >
        <button id="btn-back-empty" onClick={handleBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)',
          fontFamily: 'var(--font-sans)',
        }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          {F.backToDecks || 'Về danh sách'}
        </button>
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)', maxWidth: '520px', margin: '0 auto', width: '100%' }}>
          <CheckCircle style={{ width: '48px', height: '48px', color: '#16a34a', display: 'block', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px' }}>
            {F.emptyQueueTitle || 'Không có thẻ nào cần ôn!'}
          </h2>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.875rem', margin: 0 }}>
            {F.emptyQueueDesc || 'Bộ thẻ này chưa có thẻ nào hoặc tất cả thẻ chưa đến hạn ôn.'}
          </p>
        </div>
        <div />
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-4xl mx-auto h-[calc(100vh-64px)] overflow-hidden flex flex-col px-6 py-3 box-border animate-fade-in"
      style={{
        height: 'calc(100vh - var(--dashboard-header-height, 64px))',
        maxHeight: 'calc(100vh - var(--dashboard-header-height, 64px))',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Tầng 1: Header & Thanh tiến độ (shrink-0 mb-3) ── */}
      <div className="shrink-0 mb-3 flex flex-col gap-2">
        {/* Row 1: Back + Badge + Counter (h-6 flex items-center justify-between) */}
        <div className="h-6 flex items-center justify-between gap-3">
          <button
            id="btn-back-study"
            onClick={handleBack}
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

          {/* Status badge */}
          {currentCard?.study_status ? (
            <span style={{
              fontSize: '0.6875rem', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px',
              ...studyStatusColor[currentCard.study_status],
            }}>
              {studyStatusLabel[currentCard.study_status] || currentCard.study_status}
            </span>
          ) : (
            <div className="h-4" />
          )}

          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
            {completed ? queue.length : currentIdx + 1} / {queue.length}
          </span>
        </div>

        {/* Row 2: Deck title & Subject tag */}
        {deck && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink)', margin: 0 }}>
              {deck.title}
            </h1>
            {deck.subject_name && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', padding: '2px 8px', borderRadius: '6px' }}>
                {deck.subject_code} · {deck.subject_name}
              </span>
            )}
          </div>
        )}

        {/* Row 3: Progress Bar with safe bottom padding */}
        <div className="pb-1">
          <div style={{ height: '5px', borderRadius: '9999px', background: 'var(--color-border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '9999px',
              width: `${completed ? 100 : progress}%`,
              background: 'linear-gradient(90deg, var(--color-primary) 0%, #6366f1 100%)',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)' }}>
              {sessionStats.good + sessionStats.easy} {F.progressCorrect || 'đúng'} · {sessionStats.again + sessionStats.hard} {F.progressWrong || 'cần ôn thêm'}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
              {Math.round(completed ? 100 : progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Central Study Area ── */}
      {completed ? (
        <CompletionScreen
          stats={sessionStats}
          deckTitle={deck?.title || ''}
          onRestart={loadStudy}
          onTakeTest={() => navigate(`/student/flashcards/${deckId}/test`)}
          onBack={handleBack}
          t={t}
        />
      ) : (
        <>
          {/* ── Tầng 2: Khung chứa Thẻ Flashcard cố định vị trí (flex-1 min-h-0 flex items-center justify-center) ── */}
          <div className="flex-1 min-h-0 flex items-center justify-center w-full">
            <FlipCard
              card={currentCard}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              currentIdx={currentIdx}
              totalCards={queue.length}
              onPrev={handlePrev}
              onNext={handleNext}
              t={t}
            />
          </div>

          {/* ── Tầng 3: Vùng điều khiển & Hoàn thành ở đáy cố định chiều cao (shrink-0 min-h-[104px] flex flex-col items-center justify-start pt-2.5 gap-2) ── */}
          <div className="shrink-0 min-h-[104px] flex flex-col items-center justify-start pt-2.5 gap-2">
            {/* Dòng gợi ý phím tắt */}
            <p className="text-xs text-slate-400 text-center m-0 select-none">
              Nhấn vào thẻ (hoặc Space / F) để lật · Bấm &lt; &gt; (hoặc phím ← →) để chuyển câu
            </p>

            {/* Cụm đánh giá SRS & Hoàn thành phiên học (giữ nguyên không gian, không gây giật layout) */}
            <div
              className="flex flex-col items-center gap-1.5 transition-opacity duration-200"
              style={{
                opacity: flipped ? 1 : 0,
                pointerEvents: flipped ? 'auto' : 'none',
                visibility: flipped ? 'visible' : 'hidden',
              }}
            >
              <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-muted)', margin: 0 }}>
                {F.ratingPrompt || 'Bạn nhớ được mức độ nào?'}
              </p>
              <RatingButtons onRate={handleRate} disabled={submitting} t={t} />

              {currentIdx === queue.length - 1 && (
                <button
                  type="button"
                  id="btn-finish-study"
                  onClick={handleCompleteSession}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer flex items-center gap-1 mt-0.5 transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Hoàn thành phiên học
                </button>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
