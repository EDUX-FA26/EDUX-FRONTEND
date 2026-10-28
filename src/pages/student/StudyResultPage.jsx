import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LearningService from '../../services/learning.service';
import { CheckCircle2, XCircle, ChevronLeft, Trophy, Brain, RotateCcw, CalendarDays, AlertTriangle } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function Skeleton({ w = '100%', h = '16px', r = '8px' }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />;
}

function ScoreBadge({ score }) {
  if (score >= 80) return { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', label: 'Xuất sắc 🎉', icon: '🏆' };
  if (score >= 60) return { color: '#d97706', bg: 'rgba(217,119,6,0.1)', label: 'Khá tốt', icon: '👍' };
  if (score >= 40) return { color: 'var(--color-primary)', bg: 'var(--color-primary-card)', label: 'Cần cố gắng thêm', icon: '💪' };
  return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'Cần ôn luyện thêm', icon: '📖' };
}

// ─── Result Question Card ─────────────────────────────────────────────────────

function ResultCard({ question, index }) {
  const [expanded, setExpanded] = useState(false);
  const options = question.options || {};
  const isCorrect = question.isCorrect;

  return (
    <div style={{
      borderRadius: '14px', overflow: 'hidden',
      border: `1.5px solid ${isCorrect ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.2)'}`,
      background: isCorrect ? 'rgba(22,163,74,0.03)' : 'rgba(220,38,38,0.03)',
    }}>
      {/* Question header */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 18px', cursor: 'pointer',
          background: isCorrect ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)',
        }}
      >
        {isCorrect
          ? <CheckCircle2 style={{ width: '20px', height: '20px', color: '#16a34a', flexShrink: 0 }} />
          : <XCircle style={{ width: '20px', height: '20px', color: '#dc2626', flexShrink: 0 }} />
        }
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)', flex: 1, lineHeight: 1.5 }}>
          <span style={{ color: 'var(--color-ink-muted)', marginRight: '6px' }}>#{index + 1}</span>
          {question.question}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {OPTION_LABELS.map(label => {
            const text = options[label] || options[label.toLowerCase()];
            if (!text) return null;
            const isCorrectOpt = label === question.correctAnswer;
            const isSelected = label === question.selectedAnswer;
            let bg = 'var(--color-surface)', borderC = 'var(--color-border)', color = 'var(--color-ink)';
            if (isCorrectOpt) { bg = 'rgba(22,163,74,0.08)'; borderC = 'rgba(22,163,74,0.3)'; color = '#16a34a'; }
            if (isSelected && !isCorrectOpt) { bg = 'rgba(220,38,38,0.08)'; borderC = 'rgba(220,38,38,0.3)'; color = '#dc2626'; }

            return (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 14px', borderRadius: '10px',
                border: `1.5px solid ${borderC}`, background: bg,
              }}>
                <span style={{
                  flexShrink: 0, width: '22px', height: '22px', borderRadius: '6px',
                  background: isCorrectOpt ? 'rgba(22,163,74,0.15)' : isSelected ? 'rgba(220,38,38,0.12)' : 'var(--color-border)',
                  color: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6875rem', fontWeight: 800,
                }}>{label}</span>
                <span style={{ fontSize: '0.875rem', color, fontWeight: isCorrectOpt || isSelected ? 600 : 400 }}>
                  {text}
                </span>
                {isCorrectOpt && <CheckCircle2 style={{ width: '14px', height: '14px', color: '#16a34a', marginLeft: 'auto', flexShrink: 0 }} />}
                {isSelected && !isCorrectOpt && <XCircle style={{ width: '14px', height: '14px', color: '#dc2626', marginLeft: 'auto', flexShrink: 0 }} />}
              </div>
            );
          })}

          {/* Explanation */}
          {question.explanation && (
            <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '10px', background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', display: 'block', marginBottom: '4px' }}>💡 Giải thích</span>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-ink-muted)', lineHeight: 1.6 }}>
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudyResultPage() {
  const { planDayId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    LearningService.getStudyPlanDayResult(planDayId)
      .then(res => { if (!cancelled) setResult(res.data); })
      .catch(err => {
        if (cancelled) return;
        const msg = err.response?.data?.message || 'Không thể tải kết quả.';
        if (msg === 'SUBMISSION_NOT_FOUND') {
          setError('Bạn chưa nộp bài cho ngày học này.');
        } else {
          setError(msg);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [planDayId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton h="140px" r="20px" />
        <Skeleton h="80px" r="16px" />
        <Skeleton h="80px" r="16px" />
        <Skeleton h="80px" r="16px" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          onClick={() => navigate('/student/study-plan')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px', width: 'fit-content',
            border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-ink-muted)', fontSize: '0.8125rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          <ChevronLeft style={{ width: '16px', height: '16px' }} /> Quay lại
        </button>
        <div style={{ padding: '32px', borderRadius: '16px', background: 'rgba(220,38,38,0.06)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', textAlign: 'center' }}>
          <AlertTriangle style={{ width: '32px', height: '32px', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
          <button
            onClick={() => navigate(`/student/study-plan/days/${planDayId}`)}
            style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '10px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            Đi làm bài
          </button>
        </div>
      </div>
    );
  }

  const score = Number(result?.scorePercent ?? 0);
  const badge = ScoreBadge({ score });
  const results = result?.results || [];
  const correct = result?.correctAnswers ?? 0;
  const total = result?.totalQuestions ?? 0;
  const submittedAt = result?.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : '';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Back button */}
      <button
        onClick={() => navigate('/student/study-plan')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content',
          padding: '8px 14px', borderRadius: '10px',
          border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
          color: 'var(--color-ink-muted)', fontSize: '0.8125rem', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-dark)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-ink-muted)'; }}
      >
        <ChevronLeft style={{ width: '16px', height: '16px' }} />
        Về lịch học
      </button>

      {/* Score hero */}
      <div style={{
        borderRadius: '20px', padding: '32px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: 'white',
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '280px', height: '280px', background: `${badge.color}25`, borderRadius: '50%', filter: 'blur(70px)', transform: 'translate(60px, -60px)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          {/* Big score */}
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%', flexShrink: 0,
            background: badge.bg, border: `3px solid ${badge.color}50`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: badge.color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {score.toFixed(0)}%
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>KẾT QUẢ BÀI ÔN TẬP AI</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {badge.icon} {badge.label}
            </h1>
            <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '0.875rem' }}>
              Đúng <strong style={{ color: '#fff' }}>{correct}/{total}</strong> câu · Nộp lúc: {submittedAt}
            </p>
            {/* Mini stat */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: '9999px', background: 'rgba(22,163,74,0.15)', color: '#4ade80', fontSize: '0.75rem', fontWeight: 700 }}>
                ✓ {correct} đúng
              </span>
              <span style={{ padding: '4px 12px', borderRadius: '9999px', background: 'rgba(220,38,38,0.15)', color: '#f87171', fontSize: '0.75rem', fontWeight: 700 }}>
                ✗ {total - correct} sai
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Answer detail */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Brain style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)' }}>
            Chi tiết từng câu hỏi
          </h2>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            Nhấn vào câu để xem đáp án & giải thích
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {results.map((q, idx) => (
            <ResultCard key={q.questionId} question={q} index={idx} />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/student/study-plan')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', borderRadius: '12px',
            border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-ink)', fontWeight: 700, fontSize: '0.9375rem',
            cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        >
          <CalendarDays style={{ width: '18px', height: '18px' }} />
          Về lịch học
        </button>
      </div>
    </div>
  );
}
