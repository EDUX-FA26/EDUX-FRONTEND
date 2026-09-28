import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ROLE_HOME } from '../../config/constants';
import SettingsToggle from '../../components/common/SettingsToggle';

export default function LoginPage() {
  const { login, isAuthenticated, user, loading, error, clearError } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const L = t.login;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || ROLE_HOME[user.role] || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  useEffect(() => {
    if (error) setLocalError(error);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!identifier.trim() || !password.trim()) {
      setLocalError(L.validationError);
      return;
    }

    const result = await login(identifier.trim(), password);
    if (result.success) {
      navigate(result.redirectTo, { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'var(--color-primary-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', position: 'relative', overflow: 'hidden',
      transition: 'background 0.3s',
    }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '360px', height: '360px', background: 'rgba(242,112,36,0.08)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '360px', height: '360px', background: 'rgba(49,167,154,0.08)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* ── Settings toggle — top right floating ── */}
      <div style={{ position: 'fixed', top: '16px', right: '20px', zIndex: 100 }}>
        <SettingsToggle />
      </div>

      {/* Main card */}
      <div className="animate-fade-in" style={{
        position: 'relative', width: '100%', maxWidth: '1160px',
        background: 'var(--color-surface)',
        borderRadius: '24px', boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden', display: 'flex', flexDirection: 'row', minHeight: '680px',
        transition: 'background 0.3s, border-color 0.3s',
      }}>

        {/* ─── LEFT PANEL — Brand ─── */}
        <div style={{
          flex: '0 0 44%', background: 'var(--color-primary-card)',
          padding: '48px 40px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--color-border)',
          position: 'relative', overflow: 'hidden',
          transition: 'background 0.3s',
        }}>
          {/* Watermark */}
          <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '280px', height: '280px', background: 'rgba(255,219,204,0.4)', borderRadius: '50%', filter: 'blur(40px)' }} />

          {/* Top: Logo */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                background: 'var(--color-primary)', color: 'white',
                width: '44px', height: '44px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(242, 112, 36, 0.3)', flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>school</span>
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{
                  fontWeight: 900, fontSize: '1.5rem', color: 'var(--color-primary)',
                  letterSpacing: '1px', fontFamily: 'var(--font-sans)',
                }}>
                  EDUX
                </div>
                <div style={{
                  fontSize: '0.6875rem', fontWeight: 800,
                  color: 'var(--color-primary-dark)', letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  FPT UNIVERSITY
                </div>
              </div>
            </div>

            {/* Semester badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '9999px',
              background: 'rgba(242, 112, 36, 0.1)', border: '1px solid rgba(242, 112, 36, 0.2)',
              color: 'var(--color-primary-dark)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block', animation: 'pulse-ring 1.5s ease-in-out infinite' }} />
              {L.semesterBadge}
            </div>
          </div>

          {/* Center: Illustration & Title */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', margin: '24px 0' }}>
            <div style={{
              width: '100%', maxWidth: '380px', margin: '0 auto 16px',
              background: 'var(--color-surface)', borderRadius: '20px',
              border: '1px solid var(--color-border)', padding: '20px 16px 16px',
              boxShadow: 'var(--shadow-sm)', transition: 'background 0.3s, border-color 0.3s',
            }}>
              <svg viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxHeight: '140px' }}>
                <circle cx="250" cy="40" r="40" fill="rgba(242,112,36,0.12)" />
                <circle cx="70" cy="95" r="30" fill="rgba(0,106,97,0.10)" />
                <path d="M95 35 L97 42 L104 44 L97 46 L95 53 L93 46 L86 44 L93 42 Z" fill="#f59e0b" />
                <path d="M235 28 L236.5 33 L241.5 34.5 L236.5 36 L235 41 L233.5 36 L228.5 34.5 L233.5 33 Z" fill="#f27024" />
                <circle cx="238" cy="70" r="3" fill="#f59e0b" />
                <rect x="100" y="98" width="120" height="16" rx="4" fill="#006a61" />
                <rect x="105" y="102" width="110" height="8" rx="2" fill="#e6f7f5" opacity="0.7" />
                <rect x="106" y="81" width="108" height="16" rx="4" fill="#f27024" />
                <rect x="111" y="85" width="98" height="8" rx="2" fill="#fff1e7" opacity="0.7" />
                <path d="M132 65 C132 57 188 57 188 65 L188 77 C188 82 132 82 132 77 Z" fill="#d97706" />
                <path d="M135 66 C135 60 185 60 185 66 L185 76 C185 80 135 80 135 76 Z" fill="#b45309" />
                <polygon points="160,35 220,55 160,75 100,55" fill="#ea580c" />
                <polygon points="160,38 214,55 160,72 106,55" fill="#f97316" />
                <circle cx="160" cy="55" r="4" fill="#fef08a" />
                <path d="M160 55 Q 182 61 192 79" stroke="#fef08a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="192" cy="81" r="3" fill="#fef08a" />
              </svg>

              <h3 style={{
                color: 'var(--color-primary-dark)', fontSize: '1.025rem', fontWeight: 800,
                marginTop: '10px', marginBottom: '4px', letterSpacing: '-0.01em',
              }}>
                Cổng Học Tập Số &amp; Đào Tạo Đại Học
              </h3>
              <p style={{
                color: 'var(--color-ink-muted)', fontSize: '0.75rem', fontWeight: 500, margin: 0,
              }}>
                Hệ thống thông tin học tập thông minh FPT Edu
              </p>
            </div>

            <p style={{
              color: 'var(--color-ink-warm)', fontSize: '0.8125rem',
              textAlign: 'left', lineHeight: 1.65,
              maxWidth: '380px', margin: '0 auto',
            }}>
              {L.brandDesc}
            </p>
          </div>

          {/* Bottom Feature cards (3 columns matching user image) */}
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { icon: 'calendar_month', key: 'timetable', color: '#f27024', bgColor: 'rgba(242, 112, 36, 0.12)' },
              { icon: 'school', key: 'lms', color: '#006a61', bgColor: 'rgba(0, 106, 97, 0.12)' },
              { icon: 'headset_mic', key: 'support', color: '#f27024', bgColor: 'rgba(242, 112, 36, 0.12)' },
            ].map((feat) => {
              const feat_t = L.features?.[feat.key];
              return (
                <div key={feat.key} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 8px',
                  background: 'var(--color-surface)', borderRadius: '12px',
                  border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xs)',
                  transition: 'background 0.3s, border-color 0.3s', overflow: 'hidden',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: feat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{ color: feat.color, fontSize: '18px' }}>{feat.icon}</span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{
                      fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }} title={feat_t?.label}>
                      {feat_t?.label}
                    </p>
                    <p style={{
                      fontSize: '0.625rem', color: 'var(--color-ink-muted)', margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }} title={feat_t?.sub}>
                      {feat_t?.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── RIGHT PANEL — Login Form ─── */}
        <div style={{
          flex: 1, padding: '48px 52px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: 'var(--color-surface)', transition: 'background 0.3s',
        }}>
          <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>

            {/* Form Header */}
            <div style={{ marginBottom: '28px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-primary-dark)' }}>
                {L.tagline}
              </span>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: '6px', letterSpacing: '-0.02em' }}>
                {L.title}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', marginTop: '6px' }}>
                {L.subtitle}
              </p>
            </div>

            {/* Error banner */}
            {localError && (
              <div style={{
                marginBottom: '16px', padding: '12px 16px',
                background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px',
                color: '#ef4444', fontSize: '0.8125rem',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>error</span>
                <span>{localError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Identifier */}
              <div>
                <label htmlFor="login-identifier" style={{
                  display: 'block', marginBottom: '6px',
                  fontSize: '0.6875rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  color: 'var(--color-ink-warm)',
                }}>
                  {L.emailLabel}
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-soft)', fontSize: '20px', pointerEvents: 'none' }}>mail</span>
                  <input
                    id="login-identifier"
                    type="text"
                    className="input"
                    style={{ paddingLeft: '44px' }}
                    placeholder={L.emailPlaceholder}
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); setLocalError(''); clearError(); }}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label htmlFor="login-password" style={{
                    fontSize: '0.6875rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    color: 'var(--color-ink-warm)',
                  }}>
                    {L.passwordLabel}
                  </label>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', padding: 0 }}
                  >
                    {L.forgotPassword}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-soft)', fontSize: '20px', pointerEvents: 'none' }}>lock</span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: '44px', paddingRight: '48px' }}
                    placeholder={L.passwordPlaceholder}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLocalError(''); clearError(); }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)', display: 'flex', alignItems: 'center' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-warm)' }}>{L.rememberMe}</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.9375rem' }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>progress_activity</span>
                    {L.submitting}
                  </>
                ) : (
                  <>
                    {L.submit}
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
              <div style={{ position: 'absolute', inset: '50% 0 auto', height: '1px', background: 'var(--color-border)' }} />
              <span style={{ position: 'relative', background: 'var(--color-surface)', padding: '0 16px', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-ink-soft)' }}>
                {L.support}
              </span>
            </div>

            {/* Role info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { role: L.roleStudent, icon: 'school', color: 'var(--color-primary)' },
                { role: L.roleLecturer, icon: 'person_book', color: 'var(--color-accent-teal)' },
                { role: L.roleAdmin, icon: 'admin_panel_settings', color: 'var(--color-primary-dark)' },
              ].map((r) => (
                <div key={r.role} style={{
                  padding: '12px', background: 'var(--color-primary-card)',
                  borderRadius: '10px', border: '1px solid var(--color-border)', textAlign: 'center',
                  transition: 'background 0.3s',
                }}>
                  <span className="material-symbols-outlined" style={{ color: r.color, fontSize: '22px', display: 'block', marginBottom: '4px' }}>{r.icon}</span>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{r.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            maxWidth: '420px', width: '100%', margin: '24px auto 0',
            padding: '14px 18px', background: 'var(--color-primary-card)',
            borderRadius: '12px', border: '1px solid var(--color-border)',
            textAlign: 'center', transition: 'background 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '16px' }}>headset_mic</span>
              <a href="mailto:itsupport@fpt.edu.vn" style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>itsupport@fpt.edu.vn</a>
              <span style={{ color: 'var(--color-border-medium)' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink)' }}>(024) 7300 1866</span>
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft)', margin: 0 }}>{L.copyright}</p>
          </div>
        </div>
      </div>
    </div>
  );
}