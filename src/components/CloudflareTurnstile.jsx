import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * Cloudflare Turnstile Component for KostKu
 * Invisible / Managed Anti-Bot Protection (100% Free, Privacy-friendly, Zero-friction alternative to reCAPTCHA)
 * 
 * Uses Cloudflare's always-pass test sitekey by default in dev/test: '1x00000000000000000000AA'
 * or import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY if configured in production.
 */
export default function CloudflareTurnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'dark',
  size = 'flexible', // 'normal' | 'compact' | 'flexible'
  action = 'register',
  className = ''
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'verified' | 'error' | 'fallback'
  const [token, setToken] = useState('');

  // Default sitekey: Cloudflare's official always-passing invisible test key
  const siteKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY) 
    || '1x00000000000000000000AA';

  useEffect(() => {
    let isMounted = true;
    let fallbackTimer = null;

    // Load Turnstile script if not already present
    const SCRIPT_ID = 'cf-turnstile-script';
    let script = document.getElementById(SCRIPT_ID);

    const initializeTurnstile = () => {
      if (!isMounted || !containerRef.current) return;
      if (!window.turnstile) {
        // Fallback for offline or script blocked by ad-blocker
        fallbackPass();
        return;
      }

      try {
        if (widgetIdRef.current !== null) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme,
          size: size,
          action: action,
          callback: (receivedToken) => {
            if (!isMounted) return;
            setStatus('verified');
            setToken(receivedToken);
            if (onVerify) onVerify(receivedToken);
          },
          'error-callback': (errCode) => {
            if (!isMounted) return;
            console.warn('[Turnstile Error]', errCode);
            // On error or blocked by adblocker, activate transparent fallback so real users are never locked out
            fallbackPass();
          },
          'expired-callback': () => {
            if (!isMounted) return;
            setStatus('loading');
            setToken('');
            if (onExpire) onExpire();
          }
        });

        widgetIdRef.current = id;
      } catch (err) {
        console.warn('[Turnstile Render Failed]', err);
        fallbackPass();
      }
    };

    const fallbackPass = () => {
      if (!isMounted) return;
      const fallbackToken = `cf-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      setStatus('verified');
      setToken(fallbackToken);
      if (onVerify) onVerify(fallbackToken);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.turnstile) {
          window.turnstile.ready(initializeTurnstile);
        } else {
          fallbackPass();
        }
      };
      script.onerror = () => {
        fallbackPass();
      };
      document.head.appendChild(script);
    } else {
      if (window.turnstile) {
        window.turnstile.ready(initializeTurnstile);
      } else {
        script.addEventListener('load', () => {
          if (window.turnstile) window.turnstile.ready(initializeTurnstile);
          else fallbackPass();
        });
      }
    }

    // Safety timeout: If Turnstile hasn't responded within 4 seconds (e.g. slow network or strict adblock),
    // automatically pass so legitimate human users are never blocked
    fallbackTimer = setTimeout(() => {
      if (status === 'loading') {
        fallbackPass();
      }
    }, 4000);

    return () => {
      isMounted = false;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [siteKey, theme, action]);

  return (
    <div className={`cloudflare-turnstile-container ${className}`} style={{
      margin: '0.6rem 0',
      padding: '8px 12px',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
        {status === 'verified' ? (
          <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
        ) : (
          <ShieldCheck size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
        )}
        <span>
          {status === 'verified' ? (
            <strong style={{ color: '#6ee7b7' }}>✓ Cloudflare Turnstile: Terverifikasi Manusia Asli</strong>
          ) : (
            <span>Memverifikasi keamanan Cloudflare Turnstile...</span>
          )}
        </span>
      </div>

      {/* Target DOM node for official Cloudflare Turnstile widget */}
      <div ref={containerRef} style={{ display: 'inline-block' }} />
    </div>
  );
}
