import React from 'react';
import { useStreak } from '../../hooks/useStreak';
import { useLanguage } from '../../contexts/LanguageContext';

export default function FlashcardStreakBadge({ subjectId }) {
  const { t } = useLanguage();
  const { streaks, loading } = useStreak(subjectId);

  if (loading || !streaks) {
    return (
      <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: '9999px' }} />
    );
  }

  const streakData = streaks;
  const isCompletedToday = streakData.status === 'completed_today';

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: '6px 14px', borderRadius: '9999px',
      background: isCompletedToday ? 'var(--color-accent-teal-light)' : '#fff1e7',
      border: `1px solid ${isCompletedToday ? 'rgba(13,148,136,0.3)' : 'rgba(242,112,36,0.3)'}`,
      color: isCompletedToday ? 'var(--color-accent-teal)' : 'var(--color-primary-dark)',
      fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
      boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s ease'
    }}>
      <span className="material-symbols-outlined" style={{ 
        fontSize: '18px', 
        color: isCompletedToday ? 'var(--color-accent-teal)' : 'var(--color-primary)',
        animation: isCompletedToday ? 'none' : 'pulse-ring 1.5s ease-in-out infinite' 
      }}>
        local_fire_department
      </span>
      <span>{streakData.currentStreak || 0} {t.streak?.days || 'ngày Streak'}</span>
      {isCompletedToday && (
        <span style={{ fontSize: '10px', background: 'var(--color-accent-teal)', color: 'white', padding: '1px 6px', borderRadius: '4px' }}>
          ✓
        </span>
      )}
    </div>
  );
}