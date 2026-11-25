import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import LearningService from '../../services/learning.service';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    Flame,
    Trophy,
    Calendar,
    ShieldCheck,
    ArrowLeft,
    RefreshCw,
    AlertCircle,
    X,
    LayoutGrid,
    Clock,
    BookOpen
} from 'lucide-react';
import { generateCalendarHeatmap } from '../../helper/calendar';
import { formatDateDMY } from '../../helper/dateFormat';
import { getTodayVNDate } from '../../helper/VietNamDate';

// ─── Streak Modal Component (Bọc createPortal vào document.body) ───────────────
function StreakModal({ data, onClose }) {
    const { t } = useLanguage();
    const S = t?.streak || {};

    if (!data) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center relative shadow-2xl animate-scale-in">
                {/* Nút đóng */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                    <X size={18} />
                </button>

                {/* Icon Ngọn lửa */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Flame size={40} className="text-orange-600 fill-orange-600" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    {S.streakModalTitle || 'Tuyệt vời!'}
                </h2>

                {/* Mã môn học */}
                {data.subjectCode && (
                    <div className="mb-3">
                        <span className="text-xs font-bold font-mono bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg border border-orange-200 inline-block">
                            {S.subjectPrefix || 'Môn'}: {data.subjectCode}
                        </span>
                    </div>
                )}

                <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                    {S.recoverSuccessDesc || 'Chuỗi học tập của bạn đã được khôi phục thành công cho môn học này. Tiếp tục cố gắng và duy trì chuỗi học tập của bạn!'}
                </p>

                <div className="flex justify-around bg-slate-50 p-3.5 rounded-2xl mb-6 border border-slate-100">
                    <div>
                        <div className="text-[11px] text-slate-400 font-semibold uppercase">
                            {S.record || 'Kỷ lục'}
                        </div>
                        <div className="text-base sm:text-lg font-bold font-mono text-slate-900">
                            {data.longestStreak} {S.days || 'ngày'}
                        </div>
                    </div>
                    <div className="w-px bg-slate-200" />
                    <div>
                        <div className="text-[11px] text-slate-400 font-semibold uppercase">
                            {S.protection || 'Bảo vệ chuỗi'}
                        </div>
                        <div className={`text-base sm:text-lg font-bold font-mono ${data.recoveryRemaining > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {S.remainingPrefix || 'Còn'} {data.recoveryRemaining}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/30 transition-colors cursor-pointer"
                >
                    {S.continueBtn || 'Tiếp tục'}
                </button>
            </div>
        </div>,
        document.body
    );
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function StreakDetailBySubjectPage() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const S = t?.streak || {};
    const SP = t?.streakPage || {};

    const [subjectData, setSubjectData] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [activityHistory, setActivityHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingExtra, setLoadingExtra] = useState(true);
    const [error, setError] = useState(null);

    const [recovering, setRecovering] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [hoveredDay, setHoveredDay] = useState(null);

    const fetchSubjectData = async () => {
        try {
            setLoading(true);
            const [streakRes, heatmapRes, historyRes] = await Promise.all([
                LearningService.getSubjectStreak(subjectId),
                LearningService.getHeatmap({ subjectId }).catch(() => null),
                LearningService.getActivityHistory({ subjectId, limit: 20 }).catch(() => null)
            ]);
            setSubjectData(streakRes?.data || streakRes);
            setHeatmapData(heatmapRes?.data || heatmapRes || []);
            setActivityHistory(historyRes?.data || historyRes || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || S.loadingError || 'Không thể tải thông tin chi tiết môn học.');
        } finally {
            setLoading(false);
            setLoadingExtra(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                setLoadingExtra(true);
                const [streakRes, heatmapRes, historyRes] = await Promise.all([
                    LearningService.getSubjectStreak(subjectId),
                    LearningService.getHeatmap({ subjectId }).catch(() => null),
                    LearningService.getActivityHistory({ subjectId, limit: 20 }).catch(() => null)
                ]);
                if (!cancelled) {
                    setSubjectData(streakRes?.data || streakRes);
                    setHeatmapData(heatmapRes?.data || heatmapRes || []);
                    setActivityHistory(historyRes?.data || historyRes || []);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || S.loadingError || 'Không thể tải thông tin chi tiết môn học.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setLoadingExtra(false);
                }
            }
        }
        load();
        return () => { cancelled = true; };
    }, [subjectId]);

    const handleRecover = async () => {
        try {
            setRecovering(true);
            setActionError(null);

            const response = await LearningService.recoverSubjectStreak(subjectId);
            const updatedData = response?.data || response;

            await fetchSubjectData();

            setModalData({
                subjectCode: updatedData?.subjectCode || subjectData?.subjectCode,
                currentStreak: updatedData?.currentStreak ?? subjectData?.currentStreak,
                longestStreak: updatedData?.longestStreak ?? subjectData?.longestStreak,
                recoveryRemaining: updatedData?.recoveryRemaining ?? subjectData?.recoveryRemaining
            });
            setShowModal(true);

        } catch (err) {
            setActionError(err.response?.data?.message || S.recoverErrorDesc || 'Khôi phục chuỗi thất bại.');
        } finally {
            setRecovering(false);
        }
    };

    function formatActivityType(type) {
        switch (type) {
            case 'flashcard_deck_completed':
                return SP.typeFlashcardCompleted || 'Hoàn thành bộ thẻ';
            case 'streak_recovered':
                return SP.typeStreakRecovered || 'Khôi phục chuỗi';
            case 'quiz_completed':
                return SP.typeQuizCompleted || 'Hoàn thành bài kiểm tra';
            default:
                return SP.typeDefault || 'Kiểm tra';
        }
    }

    // Helper format ngày giờ gọn trên 1 dòng duy nhất (DD/MM/YYYY • HH:mm)
    function formatDateTimeInline(dateStr) {
        if (!dateStr) return S.neverStudied || 'Chưa ghi nhận';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) {
                return formatDateDMY(dateStr);
            }
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            if (typeof dateStr === 'string' && (dateStr.includes('T') || dateStr.includes(':'))) {
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} • ${hours}:${minutes}`;
            }
            return `${day}/${month}/${year}`;
        } catch {
            return formatDateDMY(dateStr);
        }
    }

    if (loading) {
        return (
            <div className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-6 pt-3 pb-4 box-border">
                <div className="skeleton h-14 w-full rounded-2xl mb-3 shrink-0" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 shrink-0">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton h-18 rounded-xl" />
                    ))}
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-3.5 pb-3">
                    <div className="skeleton w-full h-44 rounded-2xl shrink-0" />
                    <div className="flex-1 min-h-[340px] grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-7 skeleton h-full min-h-[340px] rounded-2xl" />
                        <div className="lg:col-span-5 skeleton h-full min-h-[340px] rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col justify-center items-center px-4 box-border">
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center max-w-md">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                    <h3 className="font-bold text-base mb-1">Không thể tải thông tin chi tiết môn học</h3>
                    <p className="text-xs text-rose-600 mb-4">{error}</p>
                    <button
                        onClick={() => fetchSubjectData()}
                        className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 cursor-pointer"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const todayStr = getTodayVNDate();
    const isCompletedToday = subjectData?.currentStreak > 0 && subjectData?.lastActivityDate?.slice(0, 10) === todayStr;

    const diffDays = subjectData?.lastActivityDate
        ? Math.floor((new Date(todayStr) - new Date(subjectData.lastActivityDate.slice(0, 10))) / (1000 * 60 * 60 * 24))
        : 0;

    const canRecover = Boolean(
        subjectData &&
        diffDays > 1 &&
        (subjectData.recoveryRemaining ?? 3) > 0 &&
        subjectData.lastActivityDate
    );

    return (
        <div className="animate-fade-in w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-6 pt-3 pb-4 box-border">

            {/* 1. TẦNG TRÊN (CỐ ĐỊNH — SHRINK-0): BANNER MÔN HỌC + 4 THẺ KPI */}
            <div className="shrink-0">

                {/* Thông báo lỗi khi khôi phục thất bại */}
                {actionError && (
                    <div className="mb-2.5 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{actionError}</span>
                    </div>
                )}

                {/* 1.1 Header môn học nền tone cam EDUX dịu nhẹ */}
                <div className="bg-gradient-to-r from-[#FFEDD5] via-[#FED7AA]/90 to-[#FDBA74]/85 border border-orange-300/80 rounded-2xl px-4 py-3.5 mb-3 shadow-xs">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Nút icon Back bên trái ngoài cùng */}
                            <button
                                type="button"
                                onClick={() => navigate('/student/streak')}
                                title="Quay lại danh sách Streak"
                                aria-label="Quay lại danh sách Streak"
                                className="w-9 h-9 rounded-xl bg-white/90 hover:bg-white border border-orange-200/80 text-slate-700 hover:text-[#EA580C] flex items-center justify-center shrink-0 transition cursor-pointer shadow-2xs"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>

                            {/* Icon ngọn lửa tròn */}
                            <div className="w-10 h-10 rounded-xl bg-white border border-orange-200/80 text-[#EA580C] flex items-center justify-center shrink-0 shadow-2xs">
                                <Flame
                                    className={`w-5 h-5 ${isCompletedToday ? 'text-[#EA580C] fill-[#EA580C] animate-pulse' : 'text-[#EA580C]'}`}
                                />
                            </div>

                            {/* Khối tiêu đề môn học */}
                            <div className="min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-900/70">
                                        {S.detailTitle || 'CHI TIẾT MÔN HỌC'}
                                    </span>
                                    <span className="bg-white text-[#EA580C] border border-orange-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs font-mono">
                                        {subjectData?.subjectCode || S.codePlaceholder || 'MÃ MÔN HỌC'}
                                    </span>
                                </div>
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate" title={subjectData?.subjectName}>
                                    {subjectData?.subjectName || S.subjectDefault || 'Môn học'}
                                </h1>
                            </div>
                        </div>

                        {/* NÚT KHÔI PHỤC STREAK */}
                        {canRecover && (
                            <button
                                onClick={handleRecover}
                                disabled={recovering}
                                className="bg-white hover:bg-orange-50 border border-orange-200/80 text-[#EA580C] h-9 px-4 rounded-xl text-xs font-bold shadow-2xs shrink-0 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${recovering ? 'animate-spin' : ''}`} />
                                <span>{recovering ? (S.recovering || 'Đang khôi phục...') : (S.recoverBtn || 'Khôi phục Chuỗi')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 1.3 Hàng 4 thẻ KPI (Đồng đều chiều cao, ngày giờ 1 dòng gọn gàng) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    {/* Thẻ 1: Chuỗi hiện tại */}
                    <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-center">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            {S.currentStreak || 'Chuỗi hiện tại'}
                        </span>
                        <div className="flex items-center gap-2 mt-1 min-w-0">
                            <Flame className={`w-5 h-5 shrink-0 ${isCompletedToday ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
                            <span className={`text-base sm:text-lg font-bold font-mono truncate whitespace-nowrap ${isCompletedToday ? 'text-orange-600' : 'text-slate-700'}`}>
                                {subjectData?.currentStreak || 0} {S.days || 'ngày'}
                            </span>
                        </div>
                    </div>

                    {/* Thẻ 2: Kỷ lục dài nhất */}
                    <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-center">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            {S.longestStreak || 'Kỷ lục dài nhất'}
                        </span>
                        <div className="flex items-center gap-2 mt-1 min-w-0">
                            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                            <span className="text-base sm:text-lg font-bold font-mono text-slate-800 truncate whitespace-nowrap">
                                {subjectData?.longestStreak || 0} {S.days || 'ngày'}
                            </span>
                        </div>
                    </div>

                    {/* Thẻ 3: Lần học gần nhất (Ngày giờ 1 dòng duy nhất, không xuống hàng) */}
                    <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-center">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            {S.lastActivity || 'Lần học gần nhất'}
                        </span>
                        <div className="flex items-center gap-2 mt-1 min-w-0">
                            <Calendar className="w-5 h-5 text-orange-500 shrink-0" />
                            <span
                                className="text-base sm:text-lg font-bold font-mono text-slate-800 truncate whitespace-nowrap"
                                title={formatDateTimeInline(subjectData?.lastActivityDate)}
                            >
                                {formatDateTimeInline(subjectData?.lastActivityDate)}
                            </span>
                        </div>
                    </div>

                    {/* Thẻ 4: Quota khôi phục */}
                    <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-center">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            {S.recoveryQuota || 'Quota khôi phục còn lại'}
                        </span>
                        <div className="flex items-center gap-2 mt-1 min-w-0">
                            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                            <span className="text-base sm:text-lg font-bold font-mono text-slate-800 truncate whitespace-nowrap">
                                {subjectData?.recoveryRemaining ?? 3} / 3 {S.times || 'lần'}
                            </span>
                        </div>
                    </div>
                </div>

            </div>

            {/* 2. TẦNG DƯỚI (VÙNG CUỘN NỘI BỘ CO GIÃN TỚI ĐÁY) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3.5 pb-3">

                {/* 2.1 BẢN ĐỒ NHIỆT HOẠT ĐỘNG HỌC TẬP CỦA RIÊNG MÔN HỌC */}
                <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs shrink-0 flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                                <LayoutGrid className="w-4 h-4 text-orange-500" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                Bản đồ nhiệt hoạt động học tập ({subjectData?.subjectCode || 'Môn học'})
                            </h2>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                            Hiển thị 90 ngày gần nhất • Múi giờ Việt Nam (GMT+7)
                        </span>
                    </div>

                    {loadingExtra ? (
                        <div className="skeleton w-full h-[88px] rounded-xl" />
                    ) : (
                        <div className="relative">
                            {/* Hover tooltip */}
                            {hoveredDay && (
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-md pointer-events-none z-20 font-mono">
                                    {formatDateDMY(hoveredDay.date)} • <strong className="text-orange-400">{hoveredDay.count}</strong> hoạt động
                                </div>
                            )}

                            <div className="flex gap-4 sm:gap-6 overflow-x-auto py-2 px-3 bg-slate-50/70 rounded-xl border border-slate-100">
                                {generateCalendarHeatmap(heatmapData, 90).map((group, gIdx) => (
                                    <div key={gIdx} className="flex flex-col gap-1.5 shrink-0">
                                        <span className="text-[11px] font-bold text-slate-500">
                                            {group.monthName}
                                        </span>
                                        <div className="grid grid-cols-7 gap-1.5">
                                            {group.days.map((item, idx) => {
                                                let bg = 'bg-slate-200';
                                                if (item.count > 3) bg = 'bg-[#f97316]';
                                                else if (item.count > 0) bg = 'bg-teal-500';

                                                return (
                                                    <div
                                                        key={idx}
                                                        onMouseEnter={() => setHoveredDay(item)}
                                                        onMouseLeave={() => setHoveredDay(null)}
                                                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] ${bg} cursor-pointer transition-transform hover:scale-125 ${item.count > 0 ? 'opacity-100' : 'opacity-40'}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Heatmap Legend */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-3">
                        <span className="font-medium">Mức độ hoàn thành flashcard:</span>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-[2px] bg-slate-200 opacity-40" />
                                <span>Chưa học (0 lượt)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-[2px] bg-teal-500" />
                                <span>Đã học (1 - 3 lượt)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-[2px] bg-[#f97316]" />
                                <span>Tích cực (&gt; 3 lượt)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2.2 LƯỚI 2 CỘT: LỊCH SỬ PHIÊN HỌC & BẢO VỆ CHUỖI / QUOTA */}
                <div className="flex-1 min-h-[340px] grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

                    {/* CỘT TRÁI (7 COLS): LỊCH SỬ CÁC PHIÊN HỌC FLASHCARD / QUIZ */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col h-full min-h-[340px]">
                        <div className="shrink-0 pb-3 mb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Lịch sử phiên học của môn học
                                </h2>
                            </div>
                            <span className="text-xs text-slate-400 font-medium shrink-0">
                                {activityHistory.length} phiên gần nhất
                            </span>
                        </div>

                        {/* Danh sách các phiên học cuộn độc lập */}
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
                            {loadingExtra ? (
                                <div className="space-y-2.5">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="skeleton h-16 rounded-xl" />
                                    ))}
                                </div>
                            ) : activityHistory.length > 0 ? (
                                activityHistory.map((activity, idx) => (
                                    <div
                                        key={activity.id || idx}
                                        className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-[#fff8f5] transition-colors flex items-center justify-between gap-3 shadow-2xs"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1 min-w-0">
                                                <span className="text-[10px] font-bold font-mono bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                                    {activity.subject_code || subjectData?.subjectCode || 'CODE'}
                                                </span>
                                                <span className="text-xs font-bold text-slate-900 truncate">
                                                    {activity.deck_title ? `Bộ thẻ: ${activity.deck_title}` : (activity.subject_name || subjectData?.subjectName)}
                                                </span>
                                            </div>
                                            {activity.flashcard_score !== null && activity.flashcard_score !== undefined && (
                                                <span className={`text-[11px] ${Number(activity.flashcard_score) >= 80
                                                        ? 'text-emerald-600 font-medium'
                                                        : Number(activity.flashcard_score) >= 50
                                                            ? 'text-amber-600 font-medium'
                                                            : 'text-rose-500 font-medium'
                                                    }`}>
                                                    Điểm Flashcard: {Number(activity.flashcard_score).toFixed(1)}%
                                                    {activity.flashcard_total_questions ? ` (${activity.flashcard_total_questions} câu)` : ''}
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-1">
                                                {formatActivityType(activity.activity_type)}
                                            </span>
                                            <p className="text-[11px] font-mono text-slate-400">
                                                {formatDateDMY(activity.activity_date)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center text-slate-400 py-8">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                        <Clock className="w-6 h-6 text-slate-400 opacity-60" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-500">
                                        Chưa có phiên học nào cho môn học này.
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Hãy học flashcard hoặc làm bài kiểm tra để duy trì chuỗi Streak!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI (5 COLS): BẢO VỆ CHUỖI & QUY TẮC QUOTA */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col h-full min-h-[340px]">
                        <div className="shrink-0 pb-3 mb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Bảo vệ Chuỗi & Quota Khôi phục
                                </h2>
                            </div>
                        </div>

                        {/* Thẻ trạng thái Quota trực quan */}
                        <div className="p-3.5 bg-gradient-to-br from-teal-50/60 to-slate-50 rounded-xl border border-teal-100 mb-3.5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-teal-900">Quota khôi phục học kỳ</span>
                                <span className="text-xs font-bold font-mono text-teal-700">
                                    Còn lại {subjectData?.recoveryRemaining ?? 3} / 3 lượt
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-teal-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${((subjectData?.recoveryRemaining ?? 3) / 3) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
                                <span>Đã sử dụng: <strong className="text-slate-700">{subjectData?.recoveryUsed || 0} lần</strong></span>
                                <span>Tổng cấp: <strong className="text-slate-700">3 lần/môn</strong></span>
                            </div>
                        </div>

                        {/* Quy tắc duy trì & khôi phục */}
                        <div className="space-y-2.5 text-xs text-slate-600 flex-1 min-h-0 overflow-y-auto pr-1 pb-12">
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                <p className="leading-relaxed">
                                    <strong>Duy trì tự động:</strong> Hoàn thành tối thiểu 1 phiên học Flashcard (đạt từ 50% câu đúng) mỗi ngày trước 23:59 (GMT+7) để tăng chuỗi.
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                                <p className="leading-relaxed">
                                    <strong>Cứu chuỗi kịp thời:</strong> Khi bị gián đoạn 1-2 ngày, nút <em>"Khôi phục Chuỗi"</em> sẽ xuất hiện để cứu chuỗi bằng 1 lượt Quota.
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                <p className="leading-relaxed">
                                    <strong>Lưu ý:</strong> Quota được cấp cố định mỗi kỳ học. Hãy sử dụng cẩn trọng cho các trường hợp bất khả kháng!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL THÔNG BÁO KHÔI PHỤC THÀNH CÔNG (PORTAL TO DOCUMENT.BODY) */}
            {showModal && (
                <StreakModal
                    data={modalData}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}
