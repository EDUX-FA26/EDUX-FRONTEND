import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ClassService from '../../services/class.service';
import {
  BookOpen, ChevronRight,
  Search, AlertTriangle, RefreshCw, BookMarked, X
} from 'lucide-react';

// ─── Gradient palette (Nguyên bản) ──────────────────────────────────────────

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

// ─── Skeleton (Nguyên bản) ───────────────────────────────────────────────────

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

// ─── Subject Card (Nguyên bản) ───────────────────────────────────────────────

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

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ClassService.getMyClasses();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data || []);
      setClasses(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách lớp học của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Group theo môn học nguyên bản
  const subjects = useMemo(() => {
    const map = new Map();
    classes.forEach((cls) => {
      const key = cls.subject_id;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          id: cls.subject_id,
          name: cls.subject_name || 'Môn học',
          code: cls.subject_code || '',
          classCount: 0,
        });
      }
      map.get(key).classCount += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.name?.localeCompare(b.name));
  }, [classes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q)
    );
  }, [subjects, search]);

  return (
    <div
      className="w-full max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-hidden flex flex-col px-6 pt-5 pb-4 box-border"
      style={{
        height: 'calc(100vh - var(--dashboard-header-height, 64px))',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── 1. Minimalist Page Header (Giữ nguyên) ── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0 tracking-tight">
            Ôn tập Flashcard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 m-0">
            Chọn môn học bên dưới để xem bộ thẻ và theo dõi tiến độ ghi nhớ.
          </p>
        </div>

        {/* Ô tìm kiếm + Nút làm mới */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="student-subject-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm môn học theo tên hoặc mã môn..."
              className="w-72 bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchClasses}
            title="Làm mới"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 text-slate-700 hover:text-orange-600 text-sm font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── 2. Fixed Count Bar (Giữ nguyên) ── */}
      <div className="shrink-0 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {!loading && !error
            ? search && filtered.length === 0
              ? `Không tìm thấy môn nào khớp với "${search}"`
              : `${filtered.length} môn học bạn đang tham gia`
            : 'Đang chuẩn bị danh sách môn học...'}
        </span>
      </div>

      {/* ── 3. Scrollable Course List Area (Khôi phục UI card nguyên bản) ── */}
      <div
        className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
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
                  navigate(`/student/flashcards/subject/${subject.id}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
