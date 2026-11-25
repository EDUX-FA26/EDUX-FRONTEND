import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStreak } from '../../hooks/useStreak';
import LearningService from '../../services/learning.service';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    Flame,
    Trophy,
    LayoutGrid,
    RefreshCw,
    BookOpen,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    X
} from 'lucide-react';
import { generateCalendarHeatmap } from '../../helper/calendar';
import { formatDateDMY } from '../../helper/dateFormat';
import { getTodayVNDate } from '../../helper/VietNamDate';

export default function StreakDetailPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { streaks, loading: streakLoading, error: streakError, refresh, recoverStreak } = useStreak();
    const [heatmapData, setHeatmapData] = useState([]);
    const [activityHistory, setActivityHistory] = useState([]);
    const [loadingExtra, setLoadingExtra] = useState(true);

    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [notice, setNotice] = useState(null);
    const [hoveredDay, setHoveredDay] = useState(null);

    const todayStr = getTodayVNDate();

    useEffect(() => {
        let cancelled = false;
        async function fetchAllData() {
            try {
                setLoadingExtra(true);
                const [heatmapRes, historyRes] = await Promise.all([
                    LearningService.getHeatmap(),
                    LearningService.getActivityHistory({ limit: 10 })
                ]);

                if (!cancelled) {
                    setHeatmapData(heatmapRes?.data || heatmapRes || []);
                    setActivityHistory(historyRes?.data || historyRes || []);
                }
            } catch (err) {
                console.error('Failed to load analytics', err);
            } finally {
                if (!cancelled) setLoadingExtra(false);
            }
        }
        fetchAllData();
        return () => { cancelled = true; };
    }, []);

    const handleRecover = async (e, subjectId) => {
        e.stopPropagation();
        try {
            setActionLoadingId(subjectId);
            setNotice(null);
            const res = await recoverStreak(subjectId);
            setNotice({ type: 'success', text: res.message || t.streakPage?.recoverSuccess || 'Khôi phục streak thành công!' });
            refresh();
        } catch (err) {
            setNotice({ type: 'error', text: err.response?.data?.message || t.streakPage?.recoverError || 'Không thể khôi phục streak lúc này.' });
        } finally {
            setActionLoadingId(null);
        }
    };

    const S = t.streakPage || {};

    function formatActivityType(type, S = {}) {
        switch (type) {
            case 'flashcard_deck_completed':
                return S.typeFlashcardCompleted || 'Hoàn thành bộ thẻ';
            case 'streak_recovered':
                return S.typeStreakRecovered || 'Khôi phục chuỗi';
            case 'quiz_completed':
                return S.typeQuizCompleted || 'Hoàn thành bài kiểm tra';
            default:
                return S.typeDefault || 'Kiểm tra';
        }
    }

    if (streakLoading) {
        return (
            <div className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-6 pt-3 sm:pt-4 pb-3 sm:pb-4 box-border">
                <div className="skeleton h-10 w-72 rounded-xl mb-2.5 shrink-0" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-3 shrink-0">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton h-16 rounded-xl" />
                    ))}
                </div>
                <div className="flex-1 min-h-0 space-y-4">
                    <div className="skeleton w-full h-44 rounded-2xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-6 skeleton h-72 rounded-2xl" />
                        <div className="lg:col-span-6 skeleton h-72 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (streakError) {
        return (
            <div className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col justify-center items-center px-4 box-border">
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center max-w-md">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                    <h3 className="font-bold text-base mb-1">Không thể tải dữ liệu Streak</h3>
                    <p className="text-xs text-rose-600 mb-4">{streakError}</p>
                    <button
                        onClick={() => refresh()}
                        className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 cursor-pointer"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const streakList = Array.isArray(streaks) ? streaks : (Array.isArray(streaks?.data) ? streaks.data : []);

    // KPI Metrics
    const maxCurrent = streakList.length > 0 ? Math.max(...streakList.map(s => Number(s.currentStreak) || 0)) : 0;
    const maxLongest = streakList.length > 0 ? Math.max(...streakList.map(s => Number(s.longestStreak) || 0)) : 0;
    const activeSubjects = streakList.filter(s => (Number(s.currentStreak) || 0) > 0).length;
    const totalActiveDays = heatmapData.filter(d => (Number(d.count) || Number(d.activity_count) || 0) > 0).length;

    return (
        <div className="animate-fade-in w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-6 pt-3 sm:pt-4 pb-4 box-border">

            {/* 1. CỐ ĐỊNH TẦNG TRÊN: HEADER + HÀNG 4 THẺ KPI (SHRINK-0) */}
            <div className="shrink-0">
                {/* 1.1 Page Header */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                                <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                                {S.badge || 'Hệ thống Quản lý Chuỗi Học tập (Streak)'}
                            </span>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                {S.title || 'Trung tâm Theo dõi Động lực Học tập'}
                            </h1>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {S.desc || 'Duy trì học flashcard mỗi ngày theo múi giờ Việt Nam để thắp sáng ngọn lửa streak, theo dõi bản đồ nhiệt hoạt động và cứu chuỗi kịp thời.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => refresh()}
                            className="h-8 sm:h-9 px-3 sm:px-3.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${streakLoading ? 'animate-spin' : ''}`} />
                            <span>Làm mới</span>
                        </button>
                    </div>
                </div>

                {/* 1.2 Thông báo Notice Alert (nếu có) */}
                {notice && (
                    <div className={`py-1.5 px-3 mb-2.5 rounded-lg text-xs flex items-center justify-between border ${
                        notice.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                        <div className="flex items-center gap-1.5">
                            {notice.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span className="font-medium">{notice.text}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setNotice(null)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* 1.3 Hàng 4 thẻ KPI Streak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-3">
                    {/* Thẻ 1: Chuỗi hiện tại */}
                    <div className="py-2.5 px-3.5 sm:px-4 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                        <div className="min-w-0 pr-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
                                {S.currentStreak || 'Chuỗi hiện tại'}
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-xl font-extrabold text-slate-900 font-mono">
                                    {maxCurrent}
                                </span>
                                <span className="text-xs font-semibold text-orange-600">
                                    ngày
                                </span>
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                            <Flame className="w-5 h-5 text-orange-600 fill-orange-500" />
                        </div>
                    </div>

                    {/* Thẻ 2: Kỷ lục dài nhất */}
                    <div className="py-2.5 px-3.5 sm:px-4 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                        <div className="min-w-0 pr-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
                                {S.longestStreak || 'Kỷ lục dài nhất'}
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-xl font-extrabold text-slate-900 font-mono">
                                    {maxLongest}
                                </span>
                                <span className="text-xs font-semibold text-amber-600">
                                    ngày
                                </span>
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                            <Trophy className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>

                    {/* Thẻ 3: Môn đang duy trì chuỗi */}
                    <div className="py-2.5 px-3.5 sm:px-4 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                        <div className="min-w-0 pr-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
                                {S.activeSubjects || 'Môn duy trì chuỗi'}
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-xl font-extrabold text-slate-900 font-mono">
                                    {activeSubjects}
                                </span>
                                <span className="text-xs font-semibold text-teal-600">
                                    / {streakList.length} môn
                                </span>
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-teal-600" />
                        </div>
                    </div>

                    {/* Thẻ 4: Tổng ngày điểm danh */}
                    <div className="py-2.5 px-3.5 sm:px-4 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                        <div className="min-w-0 pr-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
                                {S.totalDays || 'Tổng ngày điểm danh'}
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-xl font-extrabold text-slate-900 font-mono">
                                    {totalActiveDays}
                                </span>
                                <span className="text-xs font-semibold text-indigo-600">
                                    ngày học
                                </span>
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. VÙNG CUỘN ĐỘC LẬP CHO 3 CARD BÊN DƯỚI */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-4 pb-2">

                {/* TẦNG 1 — CARD BẢN ĐỒ NHIỆT HOẠT ĐỘNG HỌC TẬP (HEATMAP) FULL RỘNG */}
                <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs shrink-0 flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                                <LayoutGrid className="w-4 h-4 text-orange-500" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                {S.heatmapTitle || 'Bản đồ nhiệt hoạt động học tập (Heatmap)'}
                            </h2>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                            {S.heatmapSubtitle || 'Hiển thị 90 ngày gần nhất (Có cả ngày nghỉ) • Múi giờ Việt Nam (GMT+7)'}
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

                {/* TẦNG 2 — LƯỚI 2 CỘT NGANG BẰNG CHIỀU CAO (ITEMS-STRETCH) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 items-stretch">

                    {/* CỘT TRÁI (6 COLS): TRẠNG THÁI STREAK THEO TỪNG MÔN HỌC */}
                    <div className="lg:col-span-6 h-full min-h-[360px] bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col">
                        {/* Header cố định */}
                        <div className="shrink-0 pb-3 mb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-orange-500" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    {S.sectionTitle || 'Trạng thái Streak theo từng Môn học'}
                                </h2>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">
                                Tổng cộng: {streakList.length} môn
                            </span>
                        </div>

                        {/* Danh sách thẻ môn học cuộn dọc độc lập */}
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-6">
                            {streakList.length === 0 ? (
                                <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center text-slate-400 py-8">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                        <BookOpen className="w-6 h-6 text-slate-400 opacity-60" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-500">
                                        {S.emptySubjects || 'Chưa có dữ liệu streak môn học nào.'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Hãy bắt đầu học flashcard để khởi động chuỗi ngày!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {streakList.map((item) => {
                                        const isRecoverable = item.status === 'broken_recoverable';
                                        const isBusy = actionLoadingId === item.subjectId;
                                        const isCompletedToday = item.currentStreak > 0 && item.lastActivityDate === todayStr;

                                        return (
                                            <div
                                                key={item.subjectId}
                                                onClick={() => navigate(`/student/streak/${item.subjectId}`)}
                                                className="bg-slate-50/70 hover:bg-[#fff8f5] hover:border-orange-200 transition-all rounded-xl border border-slate-200/80 p-3 flex flex-col justify-between cursor-pointer shadow-2xs group"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                                        <span className="text-[10px] font-bold font-mono bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                                            {item.subjectCode || 'CODE'}
                                                        </span>
                                                        <div>
                                                            {isCompletedToday ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                    {S.completedToday || 'Đã học hôm nay'}
                                                                </span>
                                                            ) : isRecoverable ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                                                    {S.recoverable || 'Có thể cứu'}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                                                                    {S.notStudiedToday || 'Chưa học hôm nay'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-2" title={item.subjectName}>
                                                        {item.subjectName}
                                                    </h3>

                                                    {/* Thống kê streak & kỷ lục */}
                                                    <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-white border border-slate-100 mb-2">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 font-medium block">
                                                                {S.currentStreak || 'Chuỗi hiện tại'}
                                                            </span>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Flame className={`w-3.5 h-3.5 ${isCompletedToday ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
                                                                <span className={`text-xs font-extrabold font-mono ${isCompletedToday ? 'text-orange-600' : 'text-slate-600'}`}>
                                                                    {item.currentStreak || 0} ngày
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 font-medium block">
                                                                {S.longestStreak || 'Kỷ lục'}
                                                            </span>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                                                <span className="text-xs font-bold font-mono text-slate-800">
                                                                    {item.longestStreak || 0} ngày
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer thẻ: quota & nút cứu */}
                                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                                                    <span className="text-[10px] text-slate-400">
                                                        Quota: <strong className="font-mono text-slate-700">{item.recoveryRemaining ?? 3}/3</strong>
                                                    </span>

                                                    {isRecoverable && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleRecover(e, item.subjectId)}
                                                            disabled={isBusy || (item.recoveryRemaining ?? 0) <= 0}
                                                            className="h-6 px-2 text-[10px] font-bold rounded-md bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-2xs"
                                                        >
                                                            <RefreshCw className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
                                                            <span>{isBusy ? (S.rescuing || 'Đang cứu...') : (S.rescueBtn || 'Cứu')}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CARD 3 (CỘT PHẢI — 6 COLS): LỊCH SỬ HOẠT ĐỘNG GẦN ĐÂY */}
                    <div className="lg:col-span-6 h-full min-h-[360px] bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col">
                        {/* Header cố định */}
                        <div className="shrink-0 pb-3 mb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    {S.activityHistoryTitle || 'Lịch sử hoạt động gần đây'}
                                </h2>
                            </div>
                            <span className="text-xs text-slate-400 font-medium shrink-0">
                                {S.activityHistorySubtitle || 'Các phiên học flashcard mới nhất'}
                            </span>
                        </div>

                        {/* Danh sách hoạt động gần đây cuộn dọc độc lập */}
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 pb-12">
                            {loadingExtra ? (
                                <div className="space-y-2.5">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="skeleton h-16 rounded-xl" />
                                    ))}
                                </div>
                            ) : Array.isArray(activityHistory) && activityHistory.length > 0 ? (
                                activityHistory.map((activity, idx) => (
                                    <div
                                        key={activity.id || idx}
                                        className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-[#fff8f5] transition-colors flex items-center justify-between gap-3 shadow-2xs"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1 min-w-0">
                                                <span className="text-[10px] font-bold font-mono bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                                    {activity.subject_code || 'CODE'}
                                                </span>
                                                <span className="text-xs font-bold text-slate-900 truncate" title={activity.subject_name}>
                                                    {activity.subject_name}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate mb-0.5">
                                                {activity.deck_title ? `Bộ thẻ: ${activity.deck_title}` : formatActivityType(activity.activity_type, S)}
                                            </p>
                                            {activity.flashcard_score !== null && activity.flashcard_score !== undefined && (
                                                <span className={`text-[11px] ${
                                                    Number(activity.flashcard_score) >= 80
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
                                                {formatActivityType(activity.activity_type, S)}
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
                                        <Calendar className="w-6 h-6 text-slate-400 opacity-60" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-500">
                                        {S.activityEmpty || 'Chưa ghi nhận lịch sử hoạt động nào.'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Các phiên học flashcard và kiểm tra sẽ được lưu tại đây.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}
