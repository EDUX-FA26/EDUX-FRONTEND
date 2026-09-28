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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                background: 'var(--color-primary)', color: 'white',
                fontWeight: 800, fontSize: '1.5rem',
                padding: '6px 16px', borderRadius: '10px',
                letterSpacing: '2px', fontFamily: 'var(--font-mono)',
              }}>
                EDUX
              </div>
              <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.4 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>FPT University</div>
                <div>Cổng Đào Tạo &amp; Dịch Vụ Sinh Viên</div>
              </div>
            </div>

            {/* Semester badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '9999px',
              background: '#f6ece6', border: '1px solid rgba(224,192,178,0.5)',
              color: 'var(--color-primary-dark)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block', animation: 'pulse-ring 1.5s ease-in-out infinite' }} />
              {L.semesterBadge}
            </div>
          </div>

          {/* Center: Illustration */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', margin: '32px 0' }}>
            <div style={{
              width: '100%', maxWidth: '360px', margin: '0 auto 20px',
              background: 'var(--color-surface)', borderRadius: '16px',
              border: '1px solid var(--color-border-medium)', padding: '20px',
              boxShadow: 'var(--shadow-sm)', transition: 'background 0.3s',
            }}>
              <svg viewBox="0 0 340 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
                <rect width="340" height="180" rx="12" fill="var(--color-primary-bg)"/>
                <rect x="20" y="60" width="50" height="100" rx="6" fill="var(--color-primary-card)"/>
                <rect x="30" y="50" width="30" height="15" rx="3" fill="var(--color-border-medium)"/>
                <rect x="30" y="75" width="8" height="30" rx="2" fill="#f27024" opacity="0.5"/>
                <rect x="44" y="75" width="8" height="30" rx="2" fill="#f27024" opacity="0.5"/>
                <rect x="30" y="120" width="30" height="40" rx="3" fill="#fff1e7"/>
                <rect x="90" y="30" width="160" height="130" rx="8" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1.5"/>
                <rect x="90" y="30" width="160" height="30" rx="8" fill="#f27024"/>
                <text x="170" y="52" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="sans-serif">EDUX</text>
                <rect x="105" y="75" width="24" height="20" rx="3" fill="#fff1e7" stroke="var(--color-border)"/>
                <rect x="140" y="75" width="24" height="20" rx="3" fill="#fff1e7" stroke="var(--color-border)"/>
                <rect x="175" y="75" width="24" height="20" rx="3" fill="#e6f7f5" stroke="var(--color-border)"/>
                <rect x="210" y="75" width="24" height="20" rx="3" fill="#fff1e7" stroke="var(--color-border)"/>
                <rect x="105" y="108" width="24" height="20" rx="3" fill="#fff1e7" stroke="var(--color-border)"/>
                <rect x="140" y="108" width="24" height="20" rx="3" fill="#e6f7f5" stroke="var(--color-border)"/>
                <rect x="175" y="108" width="24" height="20" rx="3" fill="#fff1e7" stroke="var(--color-border)"/>
                <rect x="210" y="108" width="24" height="20" rx="3" fill="#e6f7f5" stroke="var(--color-border)"/>
                <rect x="152" y="130" width="36" height="30" rx="4" fill="#f27024" opacity="0.3"/>
                <circle cx="182" cy="146" r="2.5" fill="#a04100"/>
                <rect x="270" y="70" width="50" height="90" rx="6" fill="var(--color-primary-card)"/>
                <rect x="280" y="60" width="30" height="15" rx="3" fill="var(--color-border-medium)"/>
                <rect x="280" y="85" width="8" height="20" rx="2" fill="#006a61" opacity="0.4"/>
                <rect x="294" y="85" width="8" height="20" rx="2" fill="#006a61" opacity="0.4"/>
                <rect x="0" y="162" width="340" height="18" fill="var(--color-primary-card)"/>
                <ellipse cx="75" cy="155" rx="12" ry="10" fill="#006a61" opacity="0.6"/>
                <rect x="73" y="155" width="4" height="10" fill="#a04100" opacity="0.5"/>
                <ellipse cx="265" cy="158" rx="10" ry="8" fill="#006a61" opacity="0.5"/>
                <rect x="263" y="158" width="4" height="7" fill="#a04100" opacity="0.5"/>
              </svg>
            </div>

            <p style={{
              color: 'var(--color-ink-warm)', fontSize: '0.8125rem',
              textAlign: 'left', lineHeight: 1.7,
              maxWidth: '320px', margin: '0 auto',
            }}>
              {L.brandDesc}
            </p>
          </div>

          {/* Feature pills */}
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { icon: 'dashboard', key: 'dashboard', color: 'var(--color-primary)' },
              { icon: 'assignment', key: 'assignment', color: 'var(--color-accent-teal)' },
              { icon: 'campaign', key: 'notification', color: 'var(--color-primary-dark)' },
            ].map((feat) => {
              const feat_t = L.features?.[feat.key];
              return (
                <div key={feat.icon} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  gap: '6px', padding: '12px',
                  background: 'var(--color-surface)', borderRadius: '12px',
                  border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xs)',
                  transition: 'background 0.3s',
                }}>
                  <span className="material-symbols-outlined" style={{ color: feat.color, fontSize: '22px' }}>{feat.icon}</span>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>{feat_t?.label}</p>
                  <p style={{ fontSize: '0.625rem', color: 'var(--color-ink-muted)', margin: 0 }}>{feat_t?.sub}</p>
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