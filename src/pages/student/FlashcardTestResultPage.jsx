import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import FlashcardService from '../../services/flashcard.service';
import {
  ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw,
  BookOpen, Layers, AlertCircle, HelpCircle, FileText
} from 'lucide-react';

export default function FlashcardTestResultPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const F = t.flashcards || {};

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResult = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await FlashcardService.getTestResult(testId);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải kết quả bài kiểm tra.');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const handleRetakeTest = async () => {
    if (!result?.deck_id) return;
    try {
      const res = await FlashcardService.createTest(result.deck_id);
      navigate(`/student/flashcards/tests/${res.data.test_id}`, { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tạo lượt kiểm tra mới.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
        <div className="skeleton" style={{ width: '200px', height: '20px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ width: '100%', height: '300px', borderRadius: '20px' }} />
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
            onClick={() => navigate('/student/flashcards')}
            style={{
              padding: '8px 18px', borderRadius: '10px',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-ink)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Về danh sách bộ thẻ
          </button>
        </div>
      </div>
    );
  }

  const scorePct = result ? Math.round((result.correct / (result.total_questions || 1)) * 100) : 0;
  const isHighPass = result?.score >= 7.0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px', margin: '0 auto' }}>
      
      {/* ── Top Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate(`/student/flashcards`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Về danh sách bộ thẻ
        </button>

        <button
          onClick={handleRetakeTest}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px',
            background: 'var(--color-primary)', color: 'white',
            border: 'none', fontSize: '0.875rem', fontWeight: 700,
            cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
          }}
        >
          <RotateCcw style={{ width: '15px', height: '15px' }} />
          Làm lại bài kiểm tra
        </button>
      </div>

      {/* ── Summary Card ── */}
      <div style={{
        padding: '32px 28px', borderRadius: '24px',
        background: isHighPass
          ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
          : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px',
        boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow backdrop */}
        <div style={{
          position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px',
          background: isHighPass ? 'rgba(20,184,166,0.3)' : 'rgba(249,115,22,0.2)',
          borderRadius: '50%', filter: 'blur(50px)',
        }} />

        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: isHighPass ? 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)' : 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <Trophy style={{ width: '36px', height: '36px', color: 'white' }} />
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kết quả bài kiểm tra · {result?.deck_title}
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '8px 0 4px', fontFamily: 'var(--font-mono)' }}>
            {result?.score} <span style={{ fontSize: '1.25rem', color: '#94a3b8' }}>/ 10</span>
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#cbd5e1', margin: 0 }}>
            {isHighPass ? 'Xuất sắc! Bạn đã nắm vững kiến thức bài học.' : 'Cần ôn tập thêm để cải thiện kết quả.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
          width: '100%', maxWidth: '460px', marginTop: '8px',
        }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Tổng câu hỏi</span>
            <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>{result?.total_questions}</strong>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
            <span style={{ fontSize: '0.6875rem', display: 'block', fontWeight: 600 }}>Trả lời đúng</span>
            <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>{result?.correct}</strong>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
            <span style={{ fontSize: '0.6875rem', display: 'block', fontWeight: 600 }}>Trả lời sai</span>
            <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>{result?.incorrect}</strong>
          </div>
        </div>
      </div>

      {/* ── Question Review Title ── */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)', margin: 0 }}>
          Chi tiết từng câu hỏi ({result?.questions?.length || 0})
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
          Xem lại câu trả lời của bạn và đáp án chính xác
        </p>
      </div>

      {/* ── Questions Review List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {result?.questions?.map((q, idx) => (
          <div
            key={q.flashcard_id || idx}
            style={{
              padding: '24px', borderRadius: '16px',
              background: 'var(--color-surface)',
              border: `1.5px solid ${q.is_correct ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '16px',
            }}
          >
            {/* Question Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                  padding: '2px 8px', borderRadius: '6px',
                  background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
                }}>
                  Câu {idx + 1}
                </span>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                  background: q.question_type === 'multiple_choice' ? 'rgba(99,102,241,0.12)' : 'rgba(249,115,22,0.12)',
                  color: q.question_type === 'multiple_choice' ? '#6366f1' : '#ea580c',
                }}>
                  {q.question_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                </span>
              </div>

              {/* Correct/Incorrect Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '9999px',
                background: q.is_correct ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: q.is_correct ? '#16a34a' : '#dc2626',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                {q.is_correct ? (
                  <>
                    <CheckCircle style={{ width: '14px', height: '14px' }} />
                    Chính xác
                  </>
                ) : (
                  <>
                    <XCircle style={{ width: '14px', height: '14px' }} />
                    Chưa đúng
                  </>
                )}
              </div>
            </div>

            {/* Question Text */}
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0, lineHeight: 1.5 }}>
              {q.question}
            </p>

            {/* Answers Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {/* Student Answer */}
              <div style={{
                padding: '14px 16px', borderRadius: '12px',
                background: q.is_correct ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${q.is_correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink-muted)', display: 'block', marginBottom: '4px' }}>
                  Câu trả lời của bạn:
                </span>
                <p style={{
                  fontSize: '0.875rem', fontWeight: 600,
                  color: q.student_answer ? (q.is_correct ? '#15803d' : '#b91c1c') : 'var(--color-ink-soft)',
                  margin: 0, fontStyle: q.student_answer ? 'normal' : 'italic',
                }}>
                  {q.student_answer || '(Bỏ trống - Chưa trả lời)'}
                </p>
              </div>

              {/* Correct Answer */}
              <div style={{
                padding: '14px 16px', borderRadius: '12px',
                background: 'rgba(20,184,166,0.08)',
                border: '1px solid rgba(20,184,166,0.25)',
              }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-accent-teal)', display: 'block', marginBottom: '4px' }}>
                  Đáp án chuẩn:
                </span>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                  {q.correct_answer}
                </p>
              </div>
            </div>

            {/* Explanation if available */}
            {q.explanation && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px',
                background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink-muted)', display: 'block', marginBottom: '4px' }}>
                  Giải thích đáp án:
                </span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink)', margin: 0, lineHeight: 1.5 }}>
                  {q.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
