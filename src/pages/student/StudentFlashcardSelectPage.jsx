import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ClassService from '../../services/class.service';
import FlashcardService from '../../services/flashcard.service';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen, ChevronRight,
  Search, AlertTriangle, RefreshCw, BookMarked, X,
  Layers, ArrowRight
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

// ─── Skeleton ───────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between gap-4 animate-pulse shadow-2xs h-[170px]">
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 rounded-md bg-slate-200 mb-2" />
          <div className="h-3 w-1/2 rounded-md bg-slate-100" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
        <div className="h-3 w-2/5 rounded bg-slate-200" />
        <div className="h-1.5 w-full rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

// ─── Subject Card (Đầy đủ thông tin, sinh động & 3 cột) ──────────────────────

function SubjectCard({ subject, onClick }) {
  const gradient = pickGradient(subject.code || subject.name);
  const deckCount = subject.deckCount || 0;
  const totalCards = subject.totalCards || 0;

  return (
    <div
      onClick={onClick}
      className="bg-white hover:border-orange-300 hover:shadow-md transition-all duration-200 rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between gap-4 cursor-pointer group shadow-2xs"
    >
      {/* 1. Phần trên: Icon + Tên môn + Mã môn & Lớp học */}
      <div className="flex items-start gap-3.5">
        <div
          style={{ background: gradient }}
          className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
        >
          <BookOpen className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="text-[15px] font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug mb-1.5"
            title={subject.name}
          >
            {subject.name}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {subject.code && (
              <span className="text-[11px] font-bold font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md border border-orange-100">
                {subject.code}
              </span>
            )}
            <span className="text-xs text-slate-500 font-medium">
              {subject.classCount} lớp đang học
            </span>
          </div>
        </div>
      </div>

      {/* 2. Phần dưới: Thông số bộ thẻ & Hành động */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <Layers className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>
              {deckCount > 0 ? (
                <>
                  <strong className="text-slate-800">{deckCount}</strong> bộ thẻ
                  {totalCards > 0 && (
                    <span className="text-slate-400"> • <strong className="text-slate-700">{totalCards}</strong> flashcards</span>
                  )}
                </>
              ) : (
                <span className="text-slate-400 italic">Chưa có bộ thẻ</span>
              )}
            </span>
          </div>
        </div>

        {/* Thanh màu cam trang trí nhẹ nếu có bộ thẻ */}
        {deckCount > 0 && (
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(15, deckCount * 25))}%` }}
            />
          </div>
        )}

        {/* Footer dòng chân card */}
        <div className="flex items-center justify-between pt-0.5 text-xs">
          <span className="font-semibold text-slate-500 group-hover:text-orange-600 transition-colors">
            Nhấn để vào ôn tập
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function StudentFlashcardSelectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classRes, deckRes] = await Promise.all([
        ClassService.getMyClasses(),
        FlashcardService.getDecks({ page: 1, limit: 100 }).catch(() => ({ data: [] }))
      ]);
      const list = Array.isArray(classRes.data) ? classRes.data : (classRes.data?.data || classRes.data || []);
      const deckList = Array.isArray(deckRes.data) ? deckRes.data : (deckRes.data?.data || deckRes.data || []);
      setClasses(list);
      setDecks(deckList);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách lớp học của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Group theo môn học nguyên bản & gán số lượng bộ thẻ
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

    return Array.from(map.values()).map((subj) => {
      const subjDecks = decks.filter(d => String(d.subject_id) === String(subj.id));
      const deckCount = subjDecks.length;
      const totalCards = subjDecks.reduce((sum, d) => sum + (Number(d.card_count) || 0), 0);
      return {
        ...subj,
        deckCount,
        totalCards,
      };
    }).sort((a, b) => a.name?.localeCompare(b.name));
  }, [classes, decks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q)
    );
  }, [subjects, search]);

  return (
    <div
      className="w-full max-w-[1600px] mx-auto h-[calc(100vh-var(--dashboard-header-height,64px))] min-w-0 overflow-hidden flex flex-col px-4 sm:px-6 pt-4 pb-4 box-border"
    >
      {/* ── 1. Welcome Banner Header (Hero Box) — CỐ ĐỊNH PHÍA TRÊN (SHRINK-0 MB-4) ── */}
      <div className="shrink-0 mb-4 bg-gradient-to-r from-[#FFEDD5] via-[#FED7AA]/90 to-[#FDBA74]/85 border border-orange-300/80 rounded-2xl px-5 py-4 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Bên trái: Nội dung chào mừng */}
        <div className="min-w-0 flex-1">
          {/* Hàng tiêu đề */}
          <div className="flex flex-wrap items-center gap-2">
            {/* <span className="text-xl">🎯</span> */}
            <h1 className="text-xl font-bold text-slate-900 m-0 tracking-tight">
              Ôn tập Flashcards mỗi ngày!
            </h1>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="bg-white text-[#EA580C] border border-orange-200 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                Ghi nhớ tốt hơn
              </span>
              <span className="bg-white text-[#EA580C] border border-orange-200 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                Học chủ động
              </span>
            </div>
          </div>

          {/* Dòng mô tả cá nhân hóa */}
          <p className="mt-1.5 text-sm text-slate-700 font-medium max-w-xl leading-relaxed m-0">
            Chào <strong>{user?.fullName || user?.username || 'bạn'}</strong>, hãy chọn môn học bên dưới để ôn tập bộ thẻ và theo dõi tiến độ ghi nhớ của bạn nhé!
          </p>
        </div>

        {/* Bên phải: Minh họa SVG sách mở & Cụm tìm kiếm */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          {/* Hình minh họa SVG inline gọn nhẹ */}
          <div className="hidden xl:block shrink-0">
            <svg viewBox="0 0 96 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-16 shrink-0 drop-shadow-2xs">
              <ellipse cx="48" cy="36" rx="36" ry="18" fill="url(#book-glow)" opacity="0.6" />
              <path d="M48 44C36 38 20 40 12 43V23C20 20 36 18 48 24V44Z" fill="#FFFFFF" stroke="#F97316" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M18 26C26 23 38 22 44 26" stroke="#FDBA74" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M18 31C26 28 38 27 44 31" stroke="#FDBA74" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M18 36C26 33 38 32 44 36" stroke="#FED7AA" strokeWidth="1.2" strokeLinecap="round" />

              <path d="M48 44C60 38 76 40 84 43V23C76 20 60 18 48 24V44Z" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M52 26C58 22 70 23 78 26" stroke="#C4B5FD" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M52 31C58 27 70 28 78 31" stroke="#C4B5FD" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M52 36C58 32 70 33 78 36" stroke="#DDD6FE" strokeWidth="1.2" strokeLinecap="round" />

              <path d="M48 24V45" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />

              <path d="M48 10L50 15L55 17L50 19L48 24L46 19L41 17L46 15L48 10Z" fill="#FBBF24" />
              <circle cx="28" cy="14" r="2" fill="#F97316" />
              <path d="M28 8V11 M28 17V20 M25 14H22 M34 14H31" stroke="#FDBA74" strokeWidth="1" strokeLinecap="round" />
              <circle cx="68" cy="12" r="2.5" fill="#8B5CF6" />
              <path d="M68 6V9 M68 15V18 M65 12H62 M74 12H71" stroke="#C4B5FD" strokeWidth="1" strokeLinecap="round" />
              <circle cx="40" cy="8" r="1" fill="#F59E0B" />
              <circle cx="58" cy="7" r="1.2" fill="#A78BFA" />

              <defs>
                <radialGradient id="book-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(48 36) scale(36 18)">
                  <stop stopColor="#FDE68A" stopOpacity="0.8" />
                  <stop offset="0.6" stopColor="#FED7AA" stopOpacity="0.4" />
                  <stop offset="1" stopColor="#DDD6FE" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative min-w-[260px] sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="student-subject-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm môn học theo tên hoặc mã môn..."
              className="w-full h-9.5 pl-9 pr-8 bg-white rounded-xl border border-orange-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition shadow-xs"
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

          {/* Nút Làm mới */}
          <button
            type="button"
            onClick={fetchClasses}
            title="Làm mới"
            className="h-9.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-orange-200/80 text-xs font-medium text-slate-700 hover:text-orange-600 inline-flex items-center gap-1.5 shrink-0 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── 2. VÙNG CUỘN DỌC ĐỘC LẬP BÊN DƯỚI (FLEX-1 MIN-H-0 OVERFLOW-Y-AUTO PR-1 PB-16) ── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto pr-1 pb-16 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
      >
        {/* Dòng tiêu đề đếm môn học */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {!loading && !error
              ? search && filtered.length === 0
                ? `Không tìm thấy môn nào khớp với "${search}"`
                : `${filtered.length} MÔN HỌC BẠN ĐANG THAM GIA`
              : 'Đang chuẩn bị danh sách môn học...'}
          </span>
        </div>

        {/* Lưới 3 cột thẻ môn học */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="p-7 rounded-2xl text-center bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center gap-2.5">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
            <p className="m-0 text-sm font-semibold">{error}</p>
            <button
              onClick={fetchClasses}
              className="mt-1 px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Thử lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 px-5 bg-white rounded-2xl border border-dashed border-slate-300">
            <BookMarked className="w-12 h-12 text-orange-400 opacity-40 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800 mb-1.5">
              {search ? `Không tìm thấy môn nào khớp với "${search}"` : 'Bạn chưa tham gia môn học nào'}
            </p>
            <p className="text-xs text-slate-500 m-0">
              {search ? 'Thử tìm từ khoá khác.' : 'Vui lòng liên hệ giảng viên để được tham gia lớp học.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
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
