import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();

  const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({ onCredential, onError, disabled, labels }) {
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [scriptFailed, setScriptFailed] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hostedDomain = import.meta.env.VITE_GOOGLE_ALLOWED_DOMAIN;

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId) return undefined;

    let active = true;
    loadGoogleIdentityScript()
      .then(() => {
        if (!active || !containerRef.current) return;
        const googleIdentity = window.google?.accounts?.id;
        if (!googleIdentity) throw new Error('Google Identity Services is unavailable');

        googleIdentity.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredentialRef.current(response.credential);
              return;
            }
            onErrorRef.current(labels.failed);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          hd: hostedDomain || undefined,
        });
        googleIdentity.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 320,
        });
      })
      .catch(() => {
        if (active) setScriptFailed(true);
      });

    return () => {
      active = false;
      if (containerRef.current) containerRef.current.replaceChildren();
    };
  }, [clientId, hostedDomain, labels.failed]);

  if (!clientId || scriptFailed) {
    return (
      <button
        type="button"
        disabled
        title={!clientId ? labels.notConfigured : labels.unavailable}
        style={{
          width: '100%', height: '44px', borderRadius: '8px',
          border: '1px solid var(--color-border-medium)', background: 'var(--color-surface)',
          color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 600,
          cursor: 'not-allowed', opacity: 0.72,
        }}
      >
        <span style={{ fontWeight: 800, color: '#4285f4', fontSize: '1rem' }}>G</span>
        {labels.signIn}
      </button>
    );
  }

  return (
    <div
      aria-disabled={disabled}
      style={{
        minHeight: '44px', display: 'flex', justifyContent: 'center', alignItems: 'center',
        opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <div ref={containerRef} />
    </div>
  );
}
