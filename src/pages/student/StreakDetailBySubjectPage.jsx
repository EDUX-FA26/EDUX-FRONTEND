import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LearningService from '../../services/learning.service';
import { useLanguage } from '../../contexts/LanguageContext';
import { Flame, Trophy, Calendar, ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, X } from 'lucide-react';
import { formatDateDMY } from '../../helper/dateFormat';

// ─── Streak Modal Component ──────────────────────────────────────────────────
function StreakModal({ data, onClose }) {
    const { t } = useLanguage();
    const S = t?.streak || {};

    if (!data) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', animation: 'fadeIn 0.3s ease'
        }}>
            <div style={{
                background: 'var(--color-surface)', borderRadius: '24px',
                padding: '32px 24px', width: '100%', maxWidth: '360px',
                textAlign: 'center', position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                {/* Nút đóng */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'var(--color-primary-bg)', border: 'none',
                    borderRadius: '50%', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--color-ink-muted)'
                }}>
                    <X size={18} />
                </button>

                {/* Icon Ngọn lửa */}
                <div style={{
                    width: '80px', height: '80px', margin: '0 auto 16px',
                    borderRadius: '50%', background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
                }}>
                    <Flame size={44} color="#ea580c" fill="#ea580c" />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '8px' }}>
                    {S.streakModalTitle || 'Tuyệt vời!'}
                </h2>

                {/* Mã môn học */}
                {data.subjectCode && (
                    <div style={{ marginBottom: '12px' }}>
                        <span style={{
                            fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                            background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)',
                            padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--color-border)',
                            display: 'inline-block'
                        }}>
                            {S.subjectPrefix || 'Môn'}: {data.subjectCode}
                        </span>
                    </div>
                )}

                <p style={{ fontSize: '0.95rem', color: 'var(--color-ink-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
                    {S.recoverSuccessDesc || 'Chuỗi học tập của bạn đã được khôi phục thành công cho môn học này. Tiếp tục cố gắng và duy trì chuỗi học tập của bạn!'}
                </p>

                <div style={{
                    display: 'flex', justifyContent: 'space-around',
                    background: 'var(--color-primary-bg)', padding: '16px',
                    borderRadius: '16px', marginBottom: '24px'
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                            {S.record || 'Kỷ lục'}
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                            {data.longestStreak} {S.days || 'ngày'}
                        </div>
                    </div>
                    <div style={{ width: '1px', background: 'var(--color-border)' }}></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                            {S.protection || 'Bảo vệ chuỗi'}
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: data.recoveryRemaining > 0 ? '#16a34a' : '#dc2626' }}>
                            {S.remainingPrefix || 'Còn'} {data.recoveryRemaining}
                        </div>
                    </div>
                </div>

                <button onClick={onClose} style={{
                    width: '100%', padding: '14px', borderRadius: '14px',
                    background: 'var(--color-primary)', color: 'white',
                    border: 'none', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}>
                    {S.continueBtn || 'Tiếp tục'}
                </button>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </div>
    );
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function StreakDetailBySubjectPage() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const S = t?.streak || {};

    const [subjectData, setSubjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [recovering, setRecovering] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchSubjectStreak = async () => {
        try {
            setLoading(true);
            const res = await LearningService.getSubjectStreak(subjectId);
            setSubjectData(res?.data || res);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || S.loadingError || 'Không thể tải thông tin chi tiết môn học.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                const res = await LearningService.getSubjectStreak(subjectId);
                if (!cancelled) {
                    setSubjectData(res?.data || res);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || S.loadingError || 'Không thể tải thông tin chi tiết môn học.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
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

            await fetchSubjectStreak();

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
                    {S.backToList || 'Quay lại danh sách Streak'}
                </button>
            </div>

            {/* Thông báo lỗi khi khôi phục thất bại */}
            {actionError && (
                <div style={{
                    padding: '14px 20px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(220,38,38,0.1)', color: '#dc2626',
                    border: '1px solid rgba(220,38,38,0.2)'
                }}>
                    <AlertCircle size={18} />
                    {actionError}
                </div>
            )}

            {/* Header Chi tiết môn */}
            <div className="card" style={{ padding: '32px 36px', background: 'linear-gradient(135deg, #1e293b 0%, #2c3b52 100%)', color: 'white', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
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
                                    {S.detailTitle || 'CHI TIẾT MÔN HỌC'}
                                </span>
                                <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--color-primary)', color: 'white', padding: '3px 10px', borderRadius: '6px', boxShadow: '0 2px 6px rgba(242,112,36,0.3)', letterSpacing: '0.05em' }}>
                                    {subjectData?.subjectCode || S.codePlaceholder || 'MÃ MÔN HỌC'}
                                </span>
                            </div>

                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>
                                {subjectData?.subjectName || S.subjectDefault || 'Môn học'}
                            </h1>
                        </div>
                    </div>

                    {/* NÚT KHÔI PHỤC STREAK */}
                    {canRecover && (
                        <button
                            onClick={handleRecover}
                            disabled={recovering}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '12px 20px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white', border: 'none', fontWeight: 700, fontSize: '0.875rem',
                                cursor: recovering ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            <RefreshCw size={18} className={recovering ? 'spin' : ''} />
                            {recovering ? (S.recovering || 'Đang khôi phục...') : (S.recoverBtn || 'Khôi phục Chuỗi')}
                        </button>
                    )}
                </div>
            </div>

            {/* Thống kê chi tiết */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

                {/* Chuỗi hiện tại */}
                <div className="card" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>{S.currentStreak || 'Chuỗi hiện tại'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <Flame className={isCompletedToday ? 'animate-flame' : ''} style={{ width: '28px', height: '28px', color: flameColor }} />
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: isCompletedToday ? 'var(--color-primary)' : 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
                            {subjectData?.currentStreak || 0} {S.days || 'ngày'}
                        </span>
                    </div>
                </div>

                {/* Kỷ lục dài nhất */}
                <div className="card" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>{S.longestStreak || 'Kỷ lục dài nhất'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <Trophy style={{ width: '28px', height: '28px', color: '#eab308' }} />
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                            {subjectData?.longestStreak || 0} {S.days || 'ngày'}
                        </span>
                    </div>
                </div>

                {/* Lần học gần nhất */}
                <div className="card" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                        {S.lastActivity || 'Lần học gần nhất'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                        <Calendar style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                            {subjectData?.lastActivityDate
                                ? formatDateDMY(subjectData.lastActivityDate)
                                : (S.neverStudied || 'Chưa ghi nhận')}
                        </span>
                    </div>
                </div>

                {/* Quota khôi phục */}
                <div className="card" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>{S.recoveryQuota || 'Quota khôi phục còn lại'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                        <ShieldCheck style={{ width: '20px', height: '20px', color: 'var(--color-accent-teal)' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                            {subjectData?.recoveryRemaining ?? 3} / 3 {S.times || 'lần'}
                        </span>
                    </div>
                </div>
            </div>

            {/* MODAL THÔNG BÁO KHÔI PHỤC THÀNH CÔNG */}
            {showModal && (
                <StreakModal
                    data={modalData}
                    onClose={() => setShowModal(false)}
                />
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}