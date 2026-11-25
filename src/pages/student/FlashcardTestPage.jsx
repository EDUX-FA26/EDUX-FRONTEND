import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import FlashcardService from '../../services/flashcard.service';
import MathText from '../../components/common/MathText';
import {
  ArrowLeft, CheckCircle, HelpCircle, Send, Clock,
  ChevronLeft, ChevronRight, AlertCircle, RefreshCw, FileText
} from 'lucide-react';

const normalizeOption = (opt, index) => {
  if (opt === null || opt === undefined) {
    return { key: '', text: '', value: '' };
  }
  if (typeof opt === 'string') {
    const trimmed = opt.trim();
    const match = trimmed.match(/^([A-D])[\.\:\)\s]+(.*)$/i);
    if (match) {
      return {
        key: match[1].toUpperCase(),
        text: match[2].trim(),
        value: match[2].trim(),
      };
    }
    const defaultKey = String.fromCharCode(65 + index);
    return {
      key: defaultKey,
      text: trimmed,
      value: trimmed,
    };
  }
  if (typeof opt === 'object') {
    const key = String(opt.key || opt.label || opt.id || String.fromCharCode(65 + index)).toUpperCase();
    const text = String(opt.text ?? opt.content ?? opt.value ?? '');
    return {
      key,
      text,
      value: text || key,
    };
  }
  return { key: '', text: String(opt), value: String(opt) };
};

const getSafeStringAnswer = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    return String(val.key || val.text || val.value || '').trim();
  }
  return String(val).trim();
};

const getVisibleQuestionIndices = (total, current) => {
  if (total <= 8) {
    return Array.from({ length: total }, (_, i) => i);
  }
  if (current <= 3) {
    return [0, 1, 2, 3, 'ellipsis-end', total - 3, total - 2, total - 1];
  }
  if (current >= total - 4) {
    return [0, 1, 2, 'ellipsis-start', total - 4, total - 3, total - 2, total - 1];
  }
  return [0, 1, 'ellipsis-start', current - 1, current, current + 1, 'ellipsis-end', total - 2, total - 1];
};

export default function FlashcardTestPage() {
  const { testId, deckId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const F = t.flashcards || {};

  const [activeTestId, setActiveTestId] = useState(testId || null);
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { cardId: studentAnswer }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize or fetch test session
  const initTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (testId) {
        const res = await FlashcardService.getTest(testId);
        data = res.data;
      } else if (deckId) {
        const res = await FlashcardService.createTest(deckId);
        data = res.data;
      } else {
        throw new Error('Không tìm thấy thông tin bài kiểm tra');
      }

      // If test already submitted, redirect to result
      if (data.status === 'submitted') {
        navigate(`/student/flashcards/tests/${data.test_id}/result`, { replace: true });
        return;
      }

      setActiveTestId(data.test_id);
      setTestData(data);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể khởi tạo bài kiểm tra.');
    } finally {
      setLoading(false);
    }
  }, [testId, deckId, navigate]);

  useEffect(() => {
    initTest();
  }, [initTest]);

  // Handle answering a question
  const handleAnswerChange = (cardId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [cardId]: value,
    }));
  };

  // Submit test
  const handleSubmitTest = async () => {
    if (submitting || !activeTestId) return;
    setSubmitting(true);
    try {
      const formattedAnswers = questions.map((q) => ({
        flashcard_id: q.id,
        answer: getSafeStringAnswer(answers[q.id]),
      }));

      const res = await FlashcardService.submitTest(activeTestId, formattedAnswers);
      setShowConfirmModal(false);
      navigate(`/student/flashcards/tests/${activeTestId}/result`, {
        replace: true,
        state: {
          streakData: res.data?.streak,
          passedStreak: res.data?.passed_streak,
          percentage: res.data?.percentage,
          score: res.data?.score,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nộp bài kiểm tra. Vui lòng thử lại.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Lock body scroll and listen for Escape key when confirmation modal is open
  useEffect(() => {
    if (!showConfirmModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        setShowConfirmModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfirmModal, submitting]);

  if (loading) {
    return (
      <div
        className="w-full max-w-4xl mx-auto h-[calc(100vh-64px)] overflow-hidden flex flex-col justify-between px-6 py-3 box-border"
        style={{
          height: 'calc(100vh - var(--dashboard-header-height, 64px))',
          boxSizing: 'border-box',
        }}
      >
        <div className="shrink-0 py-2.5 flex items-center justify-between">
          <div className="skeleton" style={{ width: '120px', height: '20px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '160px', height: '32px', borderRadius: '8px' }} />
        </div>
        <div className="shrink-0 p-3.5 mb-2.5 rounded-xl border border-slate-200 bg-white">
          <div className="skeleton" style={{ width: '280px', height: '20px', borderRadius: '6px', marginBottom: '10px' }} />
          <div className="skeleton" style={{ width: '100%', height: '6px', borderRadius: '9999px' }} />
        </div>
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px', marginBottom: '16px' }} />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
            ))}
          </div>
        </div>
        <div className="shrink-0 pt-2.5 flex items-center justify-between">
          <div className="skeleton" style={{ width: '100px', height: '32px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ width: '100px', height: '32px', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="w-full max-w-4xl mx-auto h-[calc(100vh-64px)] overflow-hidden flex items-center justify-center px-6 py-3 box-border"
        style={{
          height: 'calc(100vh - var(--dashboard-header-height, 64px))',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="animate-fade-in w-full max-w-md p-6 rounded-2xl text-center"
          style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.25)',
            color: '#ef4444',
          }}
        >
          <AlertCircle style={{ width: '36px', height: '36px', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 16px' }}>{error}</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
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

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.values(answers).filter((a) => getSafeStringAnswer(a).length > 0).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div
      className="w-full max-w-4xl mx-auto h-[calc(100vh-64px)] overflow-hidden flex flex-col justify-between px-6 py-3 box-border"
      style={{
        height: 'calc(100vh - var(--dashboard-header-height, 64px))',
        maxHeight: 'calc(100vh - var(--dashboard-header-height, 64px))',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Single Consolidated Header Card (shrink-0 mb-2.5) ── */}
      <div className="shrink-0 mb-2.5 bg-gradient-to-r from-[#FFF7ED] via-[#FFEDD5]/85 to-[#FED7AA]/75 border border-orange-200/90 rounded-2xl px-5 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Exit button + Divider + Deck Title + Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white border border-orange-200/80 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#EA580C] shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát</span>
          </button>

          <div className="h-5 w-px bg-orange-300/70 hidden sm:block" />

          <h1 className="text-base sm:text-lg font-bold text-slate-900 m-0 truncate">
            {testData?.deck_title || 'Kiểm tra bộ thẻ'}
          </h1>

          <span className="inline-flex items-center bg-white text-[#EA580C] border border-orange-200/90 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
            Flashcard Quiz
          </span>
        </div>

        {/* Right Side: Progress (answered count + bar) + Submit button */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-700 mb-1.5">
              {answeredCount}/{questions.length} đã làm
            </span>
            <div className="w-28 h-2 bg-white/90 border border-orange-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
          </button>
        </div>
      </div>

      {/* ── Question Card (flex-1 min-h-0 overflow-y-auto) ── */}
      {currentQuestion && (
        <div
          className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            scrollbarWidth: 'thin',
          }}
        >
          <div>
            {/* Question Meta */}
            <div className="flex items-center justify-between mb-2.5">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                style={{
                  background: 'var(--color-primary-card, #eef2ff)',
                  color: 'var(--color-primary-dark, #4f46e5)',
                }}
              >
                Trắc nghiệm
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                Câu hỏi #{currentIdx + 1}
              </span>
            </div>

            {/* Question Text */}
            <div
              className="text-base font-bold leading-snug mb-3.5"
              style={{ color: 'var(--color-ink)' }}
            >
              <MathText content={currentQuestion.question} />
            </div>

            {/* Answer Inputs (space-y-2) */}
            <div className="space-y-2">
              {(currentQuestion.options || []).map((opt, optIdx) => {
                const optInfo = normalizeOption(opt, optIdx);
                const currentAnswerStr = getSafeStringAnswer(answers[currentQuestion.id]);
                const isSelected = Boolean(
                  currentAnswerStr &&
                  (currentAnswerStr.toUpperCase() === optInfo.key ||
                   currentAnswerStr.toLowerCase() === (optInfo.text || '').toLowerCase() ||
                   currentAnswerStr.toLowerCase() === (optInfo.value || '').toLowerCase())
                );
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleAnswerChange(currentQuestion.id, optInfo.text || optInfo.value || optInfo.key)}
                    className="w-full text-left py-2.5 px-4 rounded-xl border transition-all flex items-center gap-3 cursor-pointer"
                    style={{
                      borderWidth: '1.5px',
                      borderColor: isSelected ? 'var(--color-primary, #6366f1)' : 'var(--color-border)',
                      background: isSelected ? 'var(--color-primary-card, #eef2ff)' : 'var(--color-surface)',
                      color: isSelected ? 'var(--color-primary-dark, #4f46e5)' : 'var(--color-ink)',
                      fontWeight: isSelected ? 600 : 500,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition"
                      style={{
                        borderColor: isSelected ? 'var(--color-primary, #6366f1)' : 'var(--color-border-medium, #cbd5e1)',
                        background: isSelected ? 'var(--color-primary, #6366f1)' : 'transparent',
                      }}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex items-baseline gap-2 flex-1 min-w-0">
                      {optInfo.key && (
                        <span
                          className="font-bold shrink-0 text-sm"
                          style={{
                            color: isSelected ? 'var(--color-primary-dark, #4f46e5)' : 'var(--color-ink-muted)',
                          }}
                        >
                          {optInfo.key}.
                        </span>
                      )}
                      <span className="flex-1 text-sm leading-snug">
                        <MathText content={optInfo.text || optInfo.value} inline />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Controls & Question Palette (shrink-0 pt-3) ── */}
      <div className="flex items-center justify-between gap-3 pt-3 shrink-0">
        <button
          type="button"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-ink)',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Câu trước
        </button>

        {/* Question Palette Grid (Single-row sliding window, no wrap, no scroll) */}
        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
          {getVisibleQuestionIndices(questions.length, currentIdx).map((item) => {
            if (typeof item === 'string') {
              return (
                <span
                  key={item}
                  className="px-1 text-xs font-bold text-slate-400 select-none shrink-0"
                >
                  ...
                </span>
              );
            }
            const q = questions[item];
            if (!q) return null;
            const isAnswered = getSafeStringAnswer(answers[q.id]).length > 0;
            const isCurrent = item === currentIdx;

            const btnClass = isCurrent
              ? "w-8 h-8 rounded-full border-2 border-[#EA580C] bg-orange-50 text-[#EA580C] text-xs font-bold flex items-center justify-center shrink-0 transition"
              : isAnswered
              ? "w-8 h-8 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold flex items-center justify-center shrink-0 hover:border-emerald-400 transition cursor-pointer"
              : "w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium flex items-center justify-center shrink-0 hover:border-orange-300 hover:text-[#EA580C] transition cursor-pointer";

            return (
              <button
                key={q.id || item}
                type="button"
                onClick={() => setCurrentIdx(item)}
                className={btnClass}
              >
                {item + 1}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
          disabled={currentIdx === questions.length - 1}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-ink)',
          }}
        >
          Câu sau
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Confirmation Modal (React Portal to document.body) ── */}
      {showConfirmModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (!submitting) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 text-center animate-in zoom-in-95 duration-150"
            style={{
              background: 'var(--color-surface, #ffffff)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--color-border, #f1f5f9)',
              borderRadius: '16px',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-primary-card, #eef2ff)',
                color: 'var(--color-primary, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <HelpCircle className="w-6 h-6" style={{ width: '24px', height: '24px' }} />
            </div>

            <h3
              className="text-lg font-bold text-slate-900 mb-2"
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: 'var(--color-ink, #0f172a)',
                margin: '0 0 8px',
              }}
            >
              Xác nhận nộp bài?
            </h3>

            <p
              className="text-sm text-slate-500 mb-6 leading-relaxed"
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-ink-muted, #64748b)',
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              Bạn đã hoàn thành <strong style={{ color: 'var(--color-primary-dark, #4f46e5)' }}>{answeredCount}/{questions.length}</strong> câu hỏi. Sau khi nộp bài, hệ thống sẽ tự động chấm điểm và bạn không thể sửa câu trả lời.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer disabled:opacity-50"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSubmitTest}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--color-primary, #6366f1)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Xác nhận nộp
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
