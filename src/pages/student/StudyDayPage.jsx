import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LearningService from '../../services/learning.service';
import { Brain, ChevronLeft, Sparkles, CheckCircle2, XCircle, AlertTriangle, Clock, BookOpen, SendHorizonal } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Skeleton({ w = '100%', h = '16px', r = '8px' }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ question, index, selectedAnswer, onSelect, disabled }) {
  const options = question.options || {};

  return (
    <div style={{
      padding: '20px 22px', borderRadius: '16px',
      border: '1px solid var(--color-border)', background: 'var(--color-surface)',
    }}>
      {/* Question text */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <span style={{
          flexShrink: 0, width: '28px', height: '28px', borderRadius: '8px',
          background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
        }}>{index + 1}</span>
        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.6, flex: 1 }}>
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {OPTION_LABELS.map(label => {
          const text = options[label] || options[label.toLowerCase()];
          if (!text) return null;
          const isSelected = selectedAnswer === label;
          return (
            <button
              key={label}
              onClick={() => !disabled && onSelect(question.id, label)}
              disabled={disabled}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 16px', borderRadius: '10px', textAlign: 'left',
                border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: isSelected ? 'var(--color-primary-card)' : 'var(--color-surface)',
                color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-ink)',
                cursor: disabled ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                opacity: disabled && !isSelected ? 0.7 : 1,
              }}
            >
              <span style={{
                flexShrink: 0, width: '24px', height: '24px', borderRadius: '6px',
                background: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                color: isSelected ? 'white' : 'var(--color-ink-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
              }}>{label}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 400 }}>{text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudyDayPage() {
  const { planDayId } = useParams();
  const navigate = useNavigate();

  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const [answers, setAnswers] = useState({}); // { questionId: 'A'|'B'|'C'|'D' }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadDay = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LearningService.getStudyPlanDay(planDayId);
      setDayData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tải dữ liệu ngày học.';
      if (msg === 'PLAN_DAY_NOT_FOUND') setError('Ngày học không tồn tại hoặc không thuộc về bạn.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, [planDayId]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await LearningService.generateStudyPlanDay(planDayId);
      setDayData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tạo câu hỏi AI.';
      if (msg === 'SOURCE_FLASHCARD_UNAVAILABLE') {
        setGenError('Topic này chưa có flashcard đủ tiêu chuẩn để tạo câu hỏi AI. Hãy thêm flashcard trước!');
      } else if (msg === 'AI_GENERATION_FAILED') {
        setGenError('AI tạm thời bận. Vui lòng thử lại sau ít phút.');
      } else {
        setGenError(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    const questions = dayData?.questions || [];
    // Validate all questions answered
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      setSubmitError(`Bạn còn ${unanswered.length} câu chưa trả lời.`);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        selectedAnswer: answers[q.id],
      }));
      await LearningService.submitStudyPlanDay(planDayId, formattedAnswers);
      // Redirect to result page
      navigate(`/student/study-plan/days/${planDayId}/result`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể nộp bài.';
      if (msg === 'STUDY_DAY_ALREADY_SUBMITTED') {
        navigate(`/student/study-plan/days/${planDayId}/result`);
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const questions = dayData?.questions || [];
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const allAnswered = answeredCount === totalCount && totalCount > 0;
  const contentStatus = dayData?.contentStatus;
  const isSubmitted = dayData?.isSubmitted;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Back + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/student/study-plan')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px',
            border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-ink-muted)', fontSize: '0.8125rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-dark)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-ink-muted)'; }}
        >
          <ChevronLeft style={{ width: '16px', height: '16px' }} />
          Quay lại
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
          <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink)' }}>
            {loading ? 'Đang tải...' : `Ngày ${dayData?.day ?? '?'} · ${dayData?.topicName ?? 'Ôn tập AI'}`}
          </h1>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Skeleton h="60px" r="12px" />
          <Skeleton h="120px" r="12px" />
          <Skeleton h="120px" r="12px" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(220,38,38,0.06)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', textAlign: 'center' }}>
          <AlertTriangle style={{ width: '28px', height: '28px', display: 'block', margin: '0 auto 8px' }} />
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Already submitted - redirect */}
      {!loading && !error && isSubmitted && (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <CheckCircle2 style={{ width: '48px', height: '48px', color: '#16a34a', display: 'block', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-ink)' }}>Bạn đã hoàn thành ngày học này!</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', margin: '0 0 20px' }}>Xem chi tiết kết quả bài làm của bạn bên dưới.</p>
          <button
            onClick={() => navigate(`/student/study-plan/days/${planDayId}/result`)}
            style={{ padding: '10px 24px', borderRadius: '10px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            Xem kết quả
          </button>
        </div>
      )}

      {/* Need to generate questions */}
      {!loading && !error && !isSubmitted && contentStatus === 'pending' && (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Sparkles style={{ width: '48px', height: '48px', color: 'var(--color-primary)', display: 'block', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-ink)' }}>
            Câu hỏi AI chưa được tạo cho ngày học này
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', margin: '0 0 8px', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
            Thời gian ước tính: <strong>{dayData?.durationMinutes || 15} phút</strong> · <strong>{dayData?.targetQuestions || 5} câu hỏi</strong>
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: '0 0 24px' }}>
            Nhấn nút bên dưới để AI phân tích flashcard và tạo bộ câu hỏi luyện tập riêng cho bạn.
          </p>
          {genError && (
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.8125rem', marginBottom: '16px', border: '1px solid rgba(220,38,38,0.2)' }}>
              {genError}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '12px',
              background: 'var(--color-primary)', color: 'white',
              border: 'none', fontSize: '0.9375rem', fontWeight: 700,
              cursor: generating ? 'wait' : 'pointer', opacity: generating ? 0.7 : 1,
              fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
            }}
          >
            <Sparkles style={{ width: '18px', height: '18px' }} className={generating ? 'animate-spin' : ''} />
            {generating ? 'AI đang tạo câu hỏi... Vui lòng chờ' : 'Tạo câu hỏi AI'}
          </button>
        </div>
      )}

      {/* Unavailable - no source material */}
      {!loading && !error && !isSubmitted && contentStatus === 'unavailable' && (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <BookOpen style={{ width: '48px', height: '48px', color: 'var(--color-ink-muted)', opacity: 0.4, display: 'block', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-ink)' }}>Topic chưa có tài liệu học</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', margin: 0 }}>
            Topic này chưa có flashcard đủ tiêu chuẩn. Giảng viên cần thêm flashcard trước khi AI có thể tạo câu hỏi.
          </p>
        </div>
      )}

      {/* Questions ready */}
      {!loading && !error && !isSubmitted && contentStatus === 'ready' && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Progress tracker */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>
                Đã trả lời: {answeredCount} / {totalCount} câu
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: allAnswered ? '#16a34a' : 'var(--color-primary)' }}>
                {allAnswered ? '✓ Sẵn sàng nộp bài!' : `Còn ${totalCount - answeredCount} câu chưa làm`}
              </span>
            </div>
            <div style={{ height: '6px', borderRadius: '9999px', background: 'var(--color-border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '9999px',
                background: allAnswered ? '#16a34a' : 'var(--color-primary)',
                width: `${totalCount ? (answeredCount / totalCount) * 100 : 0}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Question list */}
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              selectedAnswer={answers[q.id]}
              onSelect={handleSelectAnswer}
              disabled={false}
            />
          ))}

          {/* Submit button */}
          {submitError && (
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.875rem', border: '1px solid rgba(220,38,38,0.2)' }}>
              {submitError}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px', borderRadius: '14px', width: '100%',
              background: allAnswered ? 'var(--color-primary)' : 'var(--color-border)',
              color: allAnswered ? 'white' : 'var(--color-ink-muted)',
              border: 'none', fontSize: '1rem', fontWeight: 700,
              cursor: !allAnswered || submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <SendHorizonal style={{ width: '18px', height: '18px' }} />
            {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
          </button>
        </div>
      )}
    </div>
  );
}
