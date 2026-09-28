import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * SettingsToggle — nút chuyển Theme (Light/Dark) và Ngôn ngữ (VI/EN)
 * Dùng chung cho Header và LoginPage
 */
export default function SettingsToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLanguage();

  const btnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    transition: 'all 0.2s',
    background: 'var(--color-surface)',
    color: 'var(--color-ink)',
  };

  const size = compact
    ? { padding: '5px 10px', fontSize: '0.6875rem', height: '32px' }
    : { padding: '6px 14px', fontSize: '0.75rem', height: '36px' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {/* ── Theme Toggle ── */}
      <button
        id="theme-toggle-btn"
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        aria-label="Toggle dark mode"
        style={{
          ...btnStyle,
          ...size,
          background: isDark ? '#2e2219' : '#fff1e7',
          borderColor: isDark ? '#4a3728' : 'rgba(224,192,178,0.6)',
          color: isDark ? '#f5a370' : 'var(--color-primary-dark)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: compact ? '16px' : '18px' }}>
          {isDark ? 'light_mode' : 'dark_mode'}
        </span>
        {!compact && (
          <span>{isDark ? 'Sáng' : 'Tối'}</span>
        )}
      </button>

      {/* ── Language Toggle ── */}
      <button
        id="lang-toggle-btn"
        type="button"
        onClick={toggleLang}
        title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        aria-label="Toggle language"
        style={{
          ...btnStyle,
          ...size,
          background: 'var(--color-surface)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--color-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        {/* Flag emoji */}

        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em',
          color: 'var(--color-primary-dark)',
          fontWeight: '600'
        }}>
          {lang === 'vi' ? (
            <>
              <span className="fi fi-vn" style={{ fontSize: '16px', borderRadius: '2px' }}></span>
              VI
            </>
          ) : (
            <>
              <span className="fi fi-gb" style={{ fontSize: '16px', borderRadius: '2px' }}></span>
              EN
            </>
          )}
        </span>
        {/* Pill indicator */}
        <span style={{
          position: 'absolute', right: '0', top: '0',
          width: '6px', height: '6px',
          borderRadius: '0 10px 0 4px',
          background: 'var(--color-primary)',
        }} />
      </button>
    </div>
  );
}
