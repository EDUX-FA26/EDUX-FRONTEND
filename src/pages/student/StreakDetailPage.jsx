import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStreak } from '../../hooks/useStreak';
import LearningService from '../../services/learning.service';
import { useLanguage } from '../../contexts/LanguageContext';
// Import các icon đẹp từ lucide-react
import { Flame, Trophy, LayoutGrid, RefreshCw, BookOpen } from 'lucide-react';
import { generateCalendarHeatmap } from '../../helper/calendar';
import { formatDateDMY } from '../../helper/dateFormat';

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


    useEffect(() => {
        let cancelled = false;
        async function fetchAllData() {
            try {
                setLoadingExtra(true);
                // Gọi song song TẤT CẢ các API (streak, heatmap, activity history) cùng một lúc
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

    if (streakLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                <div className="skeleton" style={{ width: '100%', height: '140px', borderRadius: '20px' }} />
                <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '20px' }} />
            </div>
        );
    }

    if (streakError) {
        return (
            <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.875rem', width: '100%' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', verticalAlign: 'middle', marginRight: '8px' }}>error</span>
                {streakError}
            </div>
        );
    }

    const streakList = Array.isArray(streaks) ? streaks : (Array.isArray(streaks?.data) ? streaks.data : []);
    const S = t.streakPage || {};

    // Hàm chuyển đổi activity_type sang tên hiển thị thân thiện
    function formatActivityType(type, S = {}) {
        switch (type) {
            case 'flashcard_deck_completed':
                return S.typeFlashcardCompleted || 'Hoàn thành bộ thẻ';
            case 'streak_recovered':
                return S.typeStreakRecovered || 'Khôi phục chuỗi';
            case 'quiz_completed':
                return S.typeQuizCompleted || 'Hoàn thành bài kiểm tra';
            default:
                return S.typeDefault || 'Học tập';
        }
    }
    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>

            {/* Header Banner */}
            <div className="card" style={{ padding: '32px 36px', background: 'linear-gradient(135deg, #1e293b 0%, #2c3b52 100%)', color: 'white', borderRadius: '20px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#ffdbcc', fontWeight: 600, marginBottom: '10px' }}>
                            <Flame style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
                            {S.badge || 'Hệ thống Quản lý Chuỗi Học tập (Streak)'}
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                            {S.title || 'Trung tâm Theo dõi Động lực Học tập'}
                        </h1>
                        <p style={{ marginTop: '6px', color: '#94a3b8', fontSize: '0.9375rem', margin: 0, maxWidth: '850px' }}>
                            {S.desc || 'Duy trì học flashcard mỗi ngày theo múi giờ Việt Nam để thắp sáng ngọn lửa streak, theo dõi bản đồ nhiệt hoạt động và cứu chuỗi kịp thời.'}
                        </p>
                    </div>
                </div>
            </div>

            {notice && (
                <div style={{
                    padding: '14px 20px', borderRadius: '12px', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box',
                    background: notice.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                    color: notice.type === 'success' ? '#16a34a' : '#dc2626',
                    border: `1px solid ${notice.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`
                }}>
                    {notice.text}
                </div>
            )}

            {/* 1. Bản đồ nhiệt Heatmap phân theo tháng */}
            <div className="card" style={{ padding: '24px 28px', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LayoutGrid style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                            {S.heatmapTitle || 'Bản đồ nhiệt hoạt động học tập (Heatmap)'}
                        </h2>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                        {S.heatmapSubtitle || 'Hiển thị 90 ngày gần nhất (Có cả ngày nghỉ)'}
                    </span>
                </div>

                {loadingExtra ? (
                    <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '12px' }} />
                ) : (
                    <div style={{ position: 'relative' }}>
                        {/* Custom Tooltip tối giản hiển thị khi hover */}
                        {hoveredDay && (
                            <div style={{
                                position: 'absolute',
                                top: '-38px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#1e293b',
                                color: '#fff',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                pointerEvents: 'none',
                                zIndex: 10,
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {formatDateDMY(hoveredDay.date)} • <strong style={{ color: 'var(--color-primary)' }}>{hoveredDay.count}</strong> hoạt động
                            </div>
                        )}

                        <div style={{
                            display: 'flex', gap: '16px', overflowX: 'auto', padding: '12px 4px',
                            background: 'var(--color-primary-bg)', borderRadius: '12px', border: '1px solid var(--color-border)'
                        }}>
                            {generateCalendarHeatmap(heatmapData, 90).map((group, gIdx) => (
                                <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 'fit-content' }}>
                                    {/* Tên tháng */}
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                                        {group.monthName}
                                    </span>

                                    {/* Lưới các ô ngày trong tháng đó */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 14px)', gap: '4px' }}>
                                        {group.days.map((item, idx) => {
                                            let bg = 'var(--color-border)';
                                            if (item.count > 3) bg = 'var(--color-primary)';
                                            else if (item.count > 0) bg = 'var(--color-accent-teal)';

                                            return (
                                                <div
                                                    key={idx}
                                                    onMouseEnter={() => setHoveredDay(item)}
                                                    onMouseLeave={() => setHoveredDay(null)}
                                                    style={{
                                                        width: '14px', height: '14px', borderRadius: '3px', background: bg,
                                                        opacity: item.count > 0 ? 1 : 0.35, cursor: 'pointer',
                                                        transition: 'transform 0.15s ease, opacity 0.15s ease'
                                                    }}
                                                    onMouseEnterCapture={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
                                                    onMouseLeaveCapture={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Danh sách các môn học & Streak */}
            <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '16px' }}>
                    {S.sectionTitle || 'Trạng thái Streak theo từng Môn học'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', width: '100%' }}>
                    {streakList.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--color-ink-muted)' }}>
                            <BookOpen style={{ width: '48px', height: '48px', opacity: 0.4, display: 'block', margin: '0 auto 12px' }} />
                            <p style={{ fontSize: '0.9375rem' }}>{S.emptySubjects || 'Chưa có dữ liệu streak môn học nào.'}</p>
                        </div>
                    ) : (
                        streakList.map((item) => {
                            const isRecoverable = item.status === 'broken_recoverable';
                            const isCompletedToday = item.status === 'completed_today';
                            const isBusy = actionLoadingId === item.subjectId;
                            const flameColor = isCompletedToday ? 'var(--color-primary)' : 'var(--color-ink-muted)';

                            return (
                                <div
                                    key={item.subjectId}
                                    className="card"
                                    onClick={() => navigate(`/student/streak/${item.subjectId}`)}
                                    style={{
                                        padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                        gap: '20px', height: '100%', boxSizing: 'border-box', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', padding: '3px 10px', borderRadius: '6px' }}>
                                                {item.subjectCode || 'SUBJECT CODE'}
                                            </span>
                                            <div>
                                                {isCompletedToday ? (
                                                    <span className="badge badge-teal">{S.completedToday || 'Đã học hôm nay'}</span>
                                                ) : isRecoverable ? (
                                                    <span className="badge badge-orange">{S.recoverable || 'Có thể khôi phục'}</span>
                                                ) : (
                                                    <span className="badge" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-ink-muted)' }}>
                                                        {S.notStudiedToday || 'Chưa học hôm nay'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 16px', lineHeight: '1.4' }}>
                                            {item.subjectName}
                                        </h3>

                                        {/* Thống kê chỉ số với icon Flame & Trophy từ lucide-react */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', borderRadius: '14px', background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)' }}>
                                            <div>
                                                <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>{S.currentStreak || 'Chuỗi hiện tại'}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                    <Flame className={isCompletedToday ? 'animate-flame' : ''} style={{ width: '22px', height: '22px', color: flameColor }} />
                                                    <span style={{ fontSize: '1.375rem', fontWeight: 800, color: isCompletedToday ? 'var(--color-primary)' : 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
                                                        {item.currentStreak || 0} {S.days || 'ngày'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>{S.longestStreak || 'Kỷ lục dài nhất'}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                    <Trophy style={{ width: '20px', height: '20px', color: '#eab308' }} />
                                                    <span style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                                                        {item.longestStreak || 0} {S.days || 'ngày'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phần khôi phục & quota */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                                            {S.recoveryQuota || 'Quota cứu chuỗi:'} <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{item.recoveryRemaining ?? 3}/3</strong>
                                        </div>

                                        {isRecoverable && (
                                            <button
                                                onClick={(e) => handleRecover(e, item.subjectId)}
                                                disabled={isBusy || (item.recoveryRemaining ?? 0) <= 0}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '8px 14px', borderRadius: '8px', background: 'var(--color-primary)', color: 'white',
                                                    border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                                    opacity: isBusy || (item.recoveryRemaining ?? 0) <= 0 ? 0.6 : 1
                                                }}
                                            >
                                                <RefreshCw style={{ width: '14px', height: '14px' }} className={isBusy ? 'animate-spin' : ''} />
                                                {isBusy ? (S.rescuing || 'Đang cứu...') : (S.rescueBtn || 'Cứu Streak')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 3. Lịch sử hoạt động học tập gần đây */}
            <div className="card" style={{ padding: '24px 28px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                            {S.activityHistoryTitle || 'Lịch sử hoạt động gần đây'}
                        </h2>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                        {S.activityHistorySubtitle || 'Các phiên học flashcard mới nhất'}
                    </span>
                </div>

                {loadingExtra ? (
                    <div className="skeleton" style={{ width: '100%', height: '100px', borderRadius: '12px' }} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Array.isArray(activityHistory) && activityHistory.length > 0 ? (
                            activityHistory.map((activity, idx) => (
                                <div key={activity.id || idx} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', borderRadius: '10px', background: 'var(--color-primary-bg)',
                                    border: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '10px'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {activity.subject_code || 'CODE'}
                                            </span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                                                {activity.subject_name}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
                                            {activity.deck_title ? `Bộ thẻ: ${activity.deck_title}` : formatActivityType(activity.activity_type, S)}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {/* Hiển thị loại hoạt động đã được dịch thân thiện */}
                                        <span className="badge badge-teal" style={{ fontSize: '0.75rem' }}>
                                            {formatActivityType(activity.activity_type, S)}
                                        </span>
                                        {/* Ngày định dạng d/m/y */}
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                                            {formatDateDMY(activity.activity_date)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--color-ink-muted)', fontSize: '0.8125rem', padding: '20px' }}>
                                {S.activityEmpty || 'Chưa ghi nhận lịch sử hoạt động nào.'}
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}