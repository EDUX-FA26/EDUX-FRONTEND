import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LearningService from '../../services/learning.service';
import ClassService from '../../services/class.service';
import { Brain, CalendarDays, ChevronRight, Search, RefreshCw, BookOpen, AlertTriangle, Sparkles, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
  'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
  'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
  'linear-gradient(135deg, #eab308 0%, #facc15 100%)',
];

function pickGradient(str) {
  if (!str) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

const DAYS_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

function getDayLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00Z');
  const dow = d.getUTCDay(); // 0 = Sunday
  return DAYS_VN[dow === 0 ? 6 : dow - 1];
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ w = '100%', h = '16px', r = '8px' }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />;
}

// ─── Day Card ────────────────────────────────────────────────────────────────

function DayCard({ day, dayIndex, onOpen }) {
  const [hovered, setHovered] = useState(false);
  const isCompleted = day.isCompleted;
  const isReady = day.contentStatus === 'ready';
  const isPending = day.contentStatus === 'pending';
  const isUnavailable = day.contentStatus === 'unavailable';

  let statusBadge = null;
  let statusColor = 'var(--color-ink-muted)';

  if (isCompleted) {
    statusBadge = <span className="badge badge-teal" style={{ fontSize: '0.6875rem' }}>Hoàn thành</span>;
    statusColor = '#16a34a';
  } else if (isReady) {
    statusBadge = <span className="badge badge-orange" style={{ fontSize: '0.6875rem' }}>Sẵn sàng làm</span>;
    statusColor = 'var(--color-primary)';
  } else if (isPending) {
    statusBadge = <span className="badge" style={{ fontSize: '0.6875rem', background: 'var(--color-primary-bg)', color: 'var(--color-ink-muted)' }}>Chưa tạo câu hỏi</span>;
  } else if (isUnavailable) {
    statusBadge = <span className="badge badge-red" style={{ fontSize: '0.6875rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: 'none' }}>Không có tài liệu</span>;
  }

  return (
    <button
      onClick={() => !isUnavailable && onOpen(day)}
      disabled={isUnavailable}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '16px 20px', borderRadius: '14px', width: '100%',
        border: `1.5px solid ${isCompleted ? 'rgba(22,163,74,0.3)' : hovered && !isUnavailable ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: isCompleted ? 'rgba(22,163,74,0.04)' : hovered && !isUnavailable ? 'var(--color-primary-card)' : 'var(--color-surface)',
        cursor: isUnavailable ? 'not-allowed' : 'pointer',
        opacity: isUnavailable ? 0.6 : 1,
        textAlign: 'left', fontFamily: 'var(--font-sans)',
        transition: 'all 0.2s',
        transform: hovered && !isUnavailable ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && !isUnavailable ? 'var(--shadow-md)' : 'none',
      }}
    >
      {/* Day number bubble */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
        background: isCompleted ? 'rgba(22,163,74,0.12)' : 'var(--color-primary-bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${isCompleted ? 'rgba(22,163,74,0.2)' : 'var(--color-border)'}`,
      }}>
        {isCompleted ? (
          <CheckCircle2 style={{ width: '22px', height: '22px', color: '#16a34a' }} />
        ) : (
          <>
            <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-ink-muted)', lineHeight: 1 }}>
              {getDayLabel(day.studyDate)}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
              {dayIndex + 1}
            </span>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {day.activity === 'review' ? '🔄 Ôn luyện' : day.activity === 'practice' ? '✏️ Luyện tập' : '📖 Học mới'}
          </span>
          {statusBadge}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock style={{ width: '12px', height: '12px' }} />
            {day.durationMinutes} phút · {day.targetQuestions} câu hỏi
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            {formatDate(day.studyDate)}
          </span>
          {isCompleted && day.submission && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor }}>
              {Number(day.submission.scorePercent).toFixed(0)}%
            </span>
          )}
        </div>
        {day.reason && (
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', margin: '4px 0 0', fontStyle: 'italic' }}>
            {day.reason}
          </p>
        )}
      </div>

      {/* Chevron */}
      {!isUnavailable && (
        <ChevronRight style={{
          width: '18px', height: '18px', flexShrink: 0,
          color: hovered ? 'var(--color-primary)' : 'var(--color-ink-soft)',
          transition: 'all 0.2s',
          transform: hovered ? 'translateX(3px)' : 'none',
        }} />
      )}
    </button>
  );
}

// ─── Subject Selector ────────────────────────────────────────────────────────

function SubjectSelector({ subjects, selectedId, onSelect, loading }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>Môn học:</span>
      {loading ? (
        <Skeleton w="160px" h="32px" r="9999px" />
      ) : (
        subjects.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              padding: '6px 14px', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600,
              border: `1.5px solid ${selectedId === s.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: selectedId === s.id ? 'var(--color-primary-card)' : 'var(--color-surface)',
              color: selectedId === s.id ? 'var(--color-primary-dark)' : 'var(--color-ink-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
            }}
          >
            {s.code || s.name}
          </button>
        ))
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudyPlannerPage() {
  const navigate = useNavigate();

  // Subject list
  const [classes, setClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Plan state
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  // Load subjects
  useEffect(() => {
    let cancelled = false;
    ClassService.getMyClasses()
      .then(res => {
        if (cancelled) return;
        const cls = res.data || [];
        setClasses(cls);
        // Auto-select first subject
        const map = new Map();
        cls.forEach(c => !map.has(c.subject_id) && map.set(c.subject_id, c));
        const first = map.values().next().value;
        if (first) setSelectedSubjectId(first.subject_id);
      })
      .finally(() => { if (!cancelled) setClassLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Unique subjects
  const subjects = useMemo(() => {
    const map = new Map();
    classes.forEach(c => !map.has(c.subject_id) && map.set(c.subject_id, { id: c.subject_id, name: c.subject_name, code: c.subject_code }));
    return Array.from(map.values());
  }, [classes]);

  // Load plan when subject changes
  useEffect(() => {
    if (!selectedSubjectId) return;
    let cancelled = false;
    setPlanLoading(true);
    setPlanError(null);
    setPlan(null);
    LearningService.getActivePlan(selectedSubjectId)
      .then(res => { if (!cancelled) setPlan(res.data); })
      .catch(err => { if (!cancelled) setPlanError(err.response?.data?.message || 'Không thể tải kế hoạch học.'); })
      .finally(() => { if (!cancelled) setPlanLoading(false); });
    return () => { cancelled = true; };
  }, [selectedSubjectId]);

  const handleGeneratePlan = async () => {
    if (!selectedSubjectId) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await LearningService.generateStudyPlan(selectedSubjectId);
      setPlan(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tạo kế hoạch.';
      if (msg === 'NO_TOPICS_AVAILABLE' || msg === 'NO_SCHEDULABLE_TOPICS') {
        setGenError('Môn học này chưa có topic nào hoặc bạn chưa làm bất kỳ flashcard nào. Hãy học Flashcard trước!');
      } else {
        setGenError(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenDay = (day) => {
    navigate(`/student/study-plan/days/${day.planDayId}`);
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const completedDays = plan?.completedDays ?? 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Hero Banner */}
      <div style={{
        borderRadius: '20px', padding: '28px 32px', color: 'white',
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'rgba(242,112,36,0.15)', borderRadius: '50%', filter: 'blur(80px)', transform: 'translate(80px, -80px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 14px', borderRadius: '9999px',
            background: 'rgba(255,255,255,0.1)',
            fontSize: '0.75rem', color: '#ffdbcc', fontWeight: 600, marginBottom: '12px',
          }}>
            <Brain style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }} />
            Lịch ôn tập AI cá nhân hóa
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Kế hoạch Học tập 7 ngày
          </h1>
          <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.875rem', maxWidth: '520px' }}>
            Hệ thống EDU-TRACK phân tích điểm yếu của bạn và tự động lên lịch ôn tập AI tối ưu nhất trong 7 ngày liên tiếp.
          </p>
        </div>
      </div>

      {/* Subject Selector */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <SubjectSelector
          subjects={subjects}
          selectedId={selectedSubjectId}
          onSelect={id => setSelectedSubjectId(id)}
          loading={classLoading}
        />
      </div>

      {/* Plan Content */}
      {planLoading ? (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} h="72px" r="14px" />)}
        </div>
      ) : planError ? (
        <div style={{
          padding: '28px', borderRadius: '16px', textAlign: 'center',
          background: 'rgba(220,38,38,0.06)', color: '#ef4444',
          border: '1px solid rgba(220,38,38,0.2)',
        }}>
          <AlertTriangle style={{ width: '28px', height: '28px', margin: '0 auto 8px', display: 'block' }} />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>{planError}</p>
        </div>
      ) : !plan ? (
        /* No plan - call to action */
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <CalendarDays style={{ width: '56px', height: '56px', color: 'var(--color-primary)', opacity: 0.6, display: 'block', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px' }}>
            Bạn chưa có kế hoạch học tập nào
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', margin: '0 0 24px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            Hãy để AI phân tích kết quả Flashcard của bạn và tự động tạo lịch ôn tập 7 ngày tối ưu cho môn <strong>{selectedSubject?.name}</strong>.
          </p>
          {genError && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.8125rem', marginBottom: '16px', border: '1px solid rgba(220,38,38,0.2)' }}>
              {genError}
            </div>
          )}
          <button
            onClick={handleGeneratePlan}
            disabled={generating || !selectedSubjectId}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '12px',
              background: 'var(--color-primary)', color: 'white',
              border: 'none', fontSize: '0.9375rem', fontWeight: 700,
              cursor: generating ? 'wait' : 'pointer',
              opacity: generating ? 0.7 : 1,
              fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
            }}
          >
            <Sparkles style={{ width: '18px', height: '18px' }} className={generating ? 'animate-spin' : ''} />
            {generating ? 'AI đang phân tích...' : 'Tạo Kế hoạch AI'}
          </button>
        </div>
      ) : (
        /* Plan exists */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Progress summary card */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600, marginBottom: '4px' }}>
                  TIẾN ĐỘ TUẦN NÀY
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                    {completedDays}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>/ 7 ngày</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                  Bắt đầu: {formatDate(plan.startsOn)}
                </span>
                <br />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                  {selectedSubject?.name}
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div style={{ height: '8px', borderRadius: '9999px', background: 'var(--color-border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '9999px',
                background: 'linear-gradient(90deg, var(--color-primary), #f97316)',
                width: `${plan.progressPercent}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)' }}>0%</span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: plan.progressPercent === 100 ? '#16a34a' : 'var(--color-primary)' }}>
                {plan.progressPercent}%
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)' }}>100%</span>
            </div>
          </div>

          {/* Day list */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CalendarDays style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                Lịch 7 ngày
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(plan.days || []).map((day, idx) => (
                <DayCard key={day.planDayId} day={day} dayIndex={idx} onOpen={handleOpenDay} />
              ))}
            </div>
          </div>

          {/* Regenerate button */}
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 20px', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600,
                border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                color: 'var(--color-ink-muted)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-ink-muted)'; }}
            >
              <RefreshCw style={{ width: '14px', height: '14px' }} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Đang tạo lại...' : 'Tạo lại kế hoạch mới'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
