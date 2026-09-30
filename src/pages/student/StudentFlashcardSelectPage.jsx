import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ClassService from '../../services/class.service';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BookOpen, ChevronRight,
  Search, AlertTriangle, RefreshCw, BookMarked,
} from 'lucide-react';

// ─── Gradient palette ────────────────────────────────────────────────────────

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

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '20px 24px', borderRadius: '16px',
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-border)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: '14px', width: '55%', borderRadius: '6px', background: 'var(--color-border)', marginBottom: '10px' }} />
        <div style={{ height: '11px', width: '35%', borderRadius: '6px', background: 'var(--color-border)' }} />
      </div>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-border)', flexShrink: 0 }} />
    </div>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────

function SubjectCard({ subject, onClick }) {
  const [hovered, setHovered] = useState(false);
  const gradient = pickGradient(subject.code || subject.name);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '18px 22px', borderRadius: '16px', width: '100%',
        border: `1.5px solid ${hovered ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: hovered ? 'var(--color-primary-card)' : 'var(--color-surface)',
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'none',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Icon */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hovered ? '0 4px 14px rgba(0,0,0,0.18)' : 'none',
        transition: 'box-shadow 0.2s',
      }}>
        <BookOpen style={{ width: '22px', height: '22px', color: 'white' }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.9375rem', fontWeight: 700,
          color: hovered ? 'var(--color-primary-dark)' : 'var(--color-ink)',
          margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.2s',
        }}>
          {subject.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {subject.code && (
            <span style={{
              fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
              background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)',
              padding: '2px 8px', borderRadius: '4px',
            }}>
              {subject.code}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            {subject.classCount} lớp đang học
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight style={{
        width: '20px', height: '20px', flexShrink: 0,
        color: hovered ? 'var(--color-primary)' : 'var(--color-ink-soft)',
        transition: 'color 0.2s, transform 0.2s',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
      }} />
    </button>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function StudentFlashcardSelectPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ClassService.getMyClasses();
      setClasses(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách lớp học của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const forceSelect = searchParams.get('select') === 'true';
    const lastSubjectId = localStorage.getItem('student_last_subject_id');
    if (!forceSelect && lastSubjectId) {
      navigate(`/student/flashcards/subject/${lastSubjectId}`, { replace: true });
      return;
    }
    fetchClasses();
  }, [navigate]);

  // Group theo môn học
  const subjects = useMemo(() => {
    const map = new Map();
    classes.forEach((cls) => {
      const key = cls.subject_id;
      if (!map.has(key)) {
        map.set(key, {
          id: cls.subject_id,
          name: cls.subject_name,
          code: cls.subject_code || '',
          classCount: 0,
        });
      }
      map.get(key).classCount += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.name?.localeCompare(b.name));
  }, [classes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q)
    );
  }, [subjects, search]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        borderRadius: '20px', padding: '28px 32px', color: 'white',
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '280px', height: '280px',
          background: 'rgba(99,102,241,0.25)', borderRadius: '50%',
          filter: 'blur(80px)', transform: 'translate(70px, -70px)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 14px', borderRadius: '9999px',
            background: 'rgba(255,255,255,0.1)',
            fontSize: '0.75rem', color: '#c7d2fe', fontWeight: 600, marginBottom: '12px',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
            Hệ thống Flashcard · Sinh viên
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Chọn môn học
          </h1>
          <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.875rem', maxWidth: '520px' }}>
            Chọn môn học bạn muốn ôn luyện flashcard để bắt đầu học tập và theo dõi tiến độ.
          </p>
        </div>
      </div>

      {/* ── Search + Refresh ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            width: '16px', height: '16px', color: 'var(--color-ink-muted)',
          }} />
          <input
            id="student-subject-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm môn học theo tên hoặc mã môn..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px 10px 38px',
              borderRadius: '12px', border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-ink)',
              fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>
        <button
          onClick={fetchClasses}
          title="Làm mới"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px', borderRadius: '12px',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-ink-muted)', fontSize: '0.8125rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-dark)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-ink-muted)'; }}
        >
          <RefreshCw style={{ width: '14px', height: '14px' }} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* ── Count ── */}
      {!loading && !error && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
          {filtered.length === 0 && search
            ? `Không tìm thấy môn nào khớp với "${search}"`
            : `${filtered.length} môn học bạn đang tham gia`}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div style={{
          padding: '28px', borderRadius: '16px', textAlign: 'center',
          background: 'rgba(220,38,38,0.06)', color: '#ef4444',
          border: '1px solid rgba(220,38,38,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        }}>
          <AlertTriangle style={{ width: '28px', height: '28px' }} />
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{error}</p>
          <button
            onClick={fetchClasses}
            style={{
              marginTop: '4px', padding: '8px 18px', borderRadius: '9999px',
              background: 'var(--color-primary)', color: 'white',
              border: 'none', fontSize: '0.8125rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            Thử lại
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--color-surface)', borderRadius: '16px',
          border: '1px dashed var(--color-border)',
        }}>
          <BookMarked style={{ width: '48px', height: '48px', opacity: 0.25, display: 'block', margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 6px' }}>
            {search ? `Không tìm thấy môn "${search}"` : 'Bạn chưa tham gia môn học nào'}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: 0 }}>
            {search ? 'Thử tìm từ khoá khác.' : 'Vui lòng liên hệ giảng viên để được tham gia lớp học.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onClick={() => {
                localStorage.setItem('student_last_subject_id', subject.id);
                navigate(`/student/flashcards/subject/${subject.id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
