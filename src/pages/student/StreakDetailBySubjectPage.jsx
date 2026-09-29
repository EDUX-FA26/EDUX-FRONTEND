import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LearningService from '../../services/learning.service';
import { useLanguage } from '../../contexts/LanguageContext';
import { Flame, Trophy, Calendar, ShieldCheck, ArrowLeft } from 'lucide-react';
import { formatDateDMY } from '../../helper/dateFormat';

export default function StreakDetailBySubjectPage() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [subjectData, setSubjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchSubjectStreak() {
            try {
                setLoading(true);
                const res = await LearningService.getSubjectStreak(subjectId);
                if (!cancelled) {
                    setSubjectData(res?.data || res);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || t.streak?.loadingError || 'Không thể tải thông tin chi tiết môn học.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        fetchSubjectStreak();
        return () => { cancelled = true; };
    }, [subjectId, t]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: '8px' }} />
                <div className="skeleton" style={{ width: '100%', height: '140px', borderRadius: '20px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div className="skeleton" style={{ height: '100px', borderRadius: '14px' }} />
                    <div className="skeleton" style={{ height: '100px', borderRadius: '14px' }} />
                    <div className="skeleton" style={{ height: '100px', borderRadius: '14px' }} />
                    <div className="skeleton" style={{ height: '100px', borderRadius: '14px' }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.875rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', verticalAlign: 'middle', marginRight: '8px' }}>error</span>
                {error}
            </div>
        );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const isCompletedToday = subjectData?.currentStreak > 0 && subjectData?.lastActivityDate === todayStr;
    const flameColor = isCompletedToday ? 'var(--color-primary)' : 'var(--color-ink-muted)';

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>

            {/* Nút quay lại */}
            <div>
                <button
                    onClick={() => navigate('/student/streak')}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
                        color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: 0
                    }}
                >
                    <ArrowLeft style={{ width: '18px', height: '18px' }} />
                    {t.streak?.backToList || 'Quay lại danh sách Streak'}
                </button>
            </div>

            {/* Header Chi tiết môn */}
            <div className="card" style={{ padding: '32px 36px', background: 'linear-gradient(135deg, #1e293b 0%, #2c3b52 100%)', color: 'white', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)' }}>
                        <Flame
                            className={isCompletedToday ? 'animate-flame' : ''}
                            style={{ width: '48px', height: '48px', color: flameColor }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.15)', color: '#ffdbcc', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>
                                {t.streak?.detailTitle || 'CHI TIẾT MÔN HỌC'}
                            </span>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--color-primary)', color: 'white', padding: '3px 10px', borderRadius: '6px', boxShadow: '0 2px 6px rgba(242,112,36,0.3)', letterSpacing: '0.05em' }}>
                                {subjectData?.subjectCode || t.streak?.codePlaceholder || 'MÃ MÔN HỌC'}
                            </span>
                        </div>

                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>
                            {subjectData?.subjectName || t.streak?.subjectDefault || 'Môn học'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Thống kê chi tiết */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

                {/* Chuỗi hiện tại */}
                <div className="card" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>{t.streak?.currentStreak || 'Chuỗi hiện tại (Current Streak)'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <Flame className={isCompletedToday ? 'animate-flame' : ''} style={{ width: '28px', height: '28px', color: flameColor }} />
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: isCompletedToday ? 'var(--color-primary)' : 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
                            {subjectData?.currentStreak || 0} {t.streak?.days || 'ngày'}
                        </span>
                    </div>
                </div>

                {/* Kỷ lục dài nhất */}
                <div className="card" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>{t.streak?.longestStreak || 'Kỷ lục dài nhất (Longest Streak)'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <Trophy style={{ width: '28px', height: '28px', color: '#eab308' }} />
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                            {subjectData?.longestStreak || 0} {t.streak?.days || 'ngày'}
                        </span>
                    </div>
                </div>

                {/* Lần học gần nhất */}
                <div className="card" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                        {t.streak?.lastActivity || 'Lần học gần nhất'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                        <Calendar style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                            {subjectData?.lastActivityDate
                                ? formatDateDMY(subjectData.lastActivityDate)
                                : (t.streak?.neverStudied || 'Chưa ghi nhận')}
                        </span>
                    </div>
                </div>

                {/* Quota khôi phục */}
                <div className="card" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>{t.streak?.recoveryQuota || 'Quota khôi phục còn lại'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                        <ShieldCheck style={{ width: '20px', height: '20px', color: 'var(--color-accent-teal)' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                            {subjectData?.recoveryRemaining ?? 3} / 3 {t.streak?.times || 'lần'}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}