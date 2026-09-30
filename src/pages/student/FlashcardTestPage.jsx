import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import FlashcardService from '../../services/flashcard.service';
import {
  ArrowLeft, CheckCircle, HelpCircle, Send, Clock,
  ChevronLeft, ChevronRight, AlertCircle, RefreshCw, FileText
} from 'lucide-react';

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
        answer: answers[q.id] || '',
      }));

      const res = await FlashcardService.submitTest(activeTestId, formattedAnswers);
      setShowConfirmModal(false);
      navigate(`/student/flashcards/tests/${activeTestId}/result`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nộp bài kiểm tra. Vui lòng thử lại.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
        <div className="skeleton" style={{ width: '240px', height: '20px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ width: '100%', height: '360px', borderRadius: '20px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{
          padding: '24px', borderRadius: '16px',
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
          color: '#ef4444', textAlign: 'center',
        }}>
          <AlertCircle style={{ width: '36px', height: '36px', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 12px' }}>{error}</p>
          <button
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
  const answeredCount = Object.values(answers).filter((a) => a && a.trim().length > 0).length;
  const progressPct = questions.length > 0 ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px', margin: '0 auto' }}>
      
      {/* ── Top Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Thoát làm bài
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>
            Đã làm: <strong style={{ color: 'var(--color-primary-dark)' }}>{answeredCount}/{questions.length}</strong>
          </span>

          <button
            onClick={() => setShowConfirmModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)',
              color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer', boxShadow: 'var(--shadow-md)', transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <Send style={{ width: '15px', height: '15px' }} />
            Nộp bài
          </button>
        </div>
      </div>

      {/* ── Test Header Info ── */}
      <div style={{
        padding: '20px 24px', borderRadius: '16px',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bài kiểm tra Flashcard
          </span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)', margin: '4px 0 0' }}>
            {testData?.deck_title || 'Kiểm tra bộ thẻ'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)' }}>
            Câu {currentIdx + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div style={{ height: '6px', borderRadius: '9999px', background: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '9999px',
          width: `${progressPct}%`,
          background: 'linear-gradient(90deg, var(--color-primary) 0%, #6366f1 100%)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* ── Question Card ── */}
      {currentQuestion && (
        <div style={{
          padding: '28px 32px', borderRadius: '20px',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          {/* Question Meta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '0.6875rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
              background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)',
            }}>
              {currentQuestion.question_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>
              Câu hỏi #{currentIdx + 1}
            </span>
          </div>

          {/* Question Text */}
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.6, margin: 0 }}>
            {currentQuestion.question}
          </h2>

          {/* Answer Inputs */}
          <div style={{ marginTop: '8px' }}>
            {currentQuestion.question_type === 'multiple_choice' && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQuestion.id] === opt;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                      style={{
                        padding: '14px 18px', borderRadius: '12px', border: '1.5px solid',
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        background: isSelected ? 'var(--color-primary-card)' : 'var(--color-surface)',
                        color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-ink)',
                        fontSize: '0.9375rem', fontWeight: isSelected ? 700 : 500,
                        textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', border: '2px solid',
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border-medium)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, background: isSelected ? 'var(--color-primary)' : 'transparent',
                      }}>
                        {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                      </div>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '8px' }}>
                  Nhập câu trả lời của bạn:
                </label>
                <textarea
                  rows={4}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Gõ câu trả lời tại đây..."
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '14px',
                    borderRadius: '12px', border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', color: 'var(--color-ink)',
                    fontSize: '0.9375rem', fontFamily: 'var(--font-sans)', outline: 'none',
                    resize: 'vertical', transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Navigation Controls & Question Palette ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '10px',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-ink)', fontSize: '0.875rem', fontWeight: 600,
            cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentIdx === 0 ? 0.5 : 1,
          }}
        >
          <ChevronLeft style={{ width: '16px', height: '16px' }} />
          Câu trước
        </button>

        {/* Question Palette Grid */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] && answers[q.id].trim().length > 0;
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                style={{
                  width: '34px', height: '34px', borderRadius: '8px', border: '1.5px solid',
                  fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', transition: 'all 0.15s',
                  borderColor: isCurrent ? 'var(--color-primary)' : isAnswered ? '#16a34a' : 'var(--color-border)',
                  background: isCurrent
                    ? 'var(--color-primary-card)'
                    : isAnswered
                    ? 'rgba(22,163,74,0.12)'
                    : 'var(--color-surface)',
                  color: isCurrent
                    ? 'var(--color-primary-dark)'
                    : isAnswered
                    ? '#16a34a'
                    : 'var(--color-ink-muted)',
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
          disabled={currentIdx === questions.length - 1}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '10px',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-ink)', fontSize: '0.875rem', fontWeight: 600,
            cursor: currentIdx === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: currentIdx === questions.length - 1 ? 0.5 : 1,
          }}
        >
          Câu sau
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: '20px',
            padding: '28px 24px', width: '100%', maxWidth: '400px',
            textAlign: 'center', boxShadow: 'var(--shadow-lg)',
          }}>
            <HelpCircle style={{ width: '48px', height: '48px', color: 'var(--color-primary)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 8px' }}>
              Xác nhận nộp bài?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Bạn đã hoàn thành <strong>{answeredCount}/{questions.length}</strong> câu hỏi. Sau khi nộp bài, hệ thống sẽ tự động chấm điểm và bạn không thể sửa câu trả lời.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  color: 'var(--color-ink)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitTest}
                disabled={submitting}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  border: 'none', background: 'var(--color-primary)',
                  color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                {submitting && <RefreshCw style={{ width: '14px', height: '14px' }} className="animate-spin" />}
                Xác nhận nộp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
