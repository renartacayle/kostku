import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  ArrowRight, 
  ArrowLeft,
  Lock, 
  User, 
  Sparkles, 
  AlertCircle, 
  X, 
  Check, 
  UserPlus, 
  Building, 
  Key, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  CheckCircle2,
  Crown,
  Wrench,
  Search,
  Zap,
  Copy,
  ExternalLink,
  Truck,
  CreditCard
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  apiLogin, 
  apiGoogleAuth, 
  apiCheckEmail, 
  apiGetGoogleClientId, 
  apiSetGoogleClientId 
} from '../services/api';
import { DEFAULT_GOOGLE_CLIENT_ID } from '../config/version';
import { useTheme } from '../context/ThemeContext';
import AccountRecoveryModal from '../components/AccountRecoveryModal';

export default function Login({ onLogin }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Google Sign-In State: Default to 'user' (penghuni)
  const [googleRole] = useState('user');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Anti-Bot Honeypot Trap
  const [honeypot, setHoneypot] = useState('');

  // Google OAuth 2.0 / Client ID Configuration
  const [googleClientId, setGoogleClientId] = useState('');

  const mainGoogleBtnContainerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load Google Client ID on mount
  useEffect(() => {
    const loadClientId = async () => {
      let cid = localStorage.getItem('kostku_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID || '';
      try {
        const res = await apiGetGoogleClientId();
        if (res?.clientId) {
          cid = res.clientId;
        }
      } catch (err) {
        // use local
      }
      if (cid) {
        setGoogleClientId(cid);
      }
    };
    loadClientId();
  }, [location.search]);

  // Handle callback when Google OAuth returns real JWT credential (from One Tap or renderButton)
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;

    try {
      setGoogleLoading(true);
      setError('');

      // Send real credential token to backend
      const data = await apiGoogleAuth({
        credential: response.credential,
        role: googleRole
      });

      handleSuccessfulGoogleLogin(data);
    } catch (err) {
      setError(err.message || 'Gagal masuk dengan akun Google resmi.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Trigger Native Google Popup (Direct accounts.google.com UI)
  const triggerGoogleOAuthPopup = (role = googleRole) => {
    setError('');
    const activeCid = googleClientId || DEFAULT_GOOGLE_CLIENT_ID;

    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && activeCid) {
      try {
        setGoogleLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeCid,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.error('Google OAuth error:', tokenResponse);
              setGoogleLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setError(`Google Sign-In: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }

            try {
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              if (!userRes.ok) throw new Error('Gagal memverifikasi profil Google');
              const profile = await userRes.json();

              const data = await apiGoogleAuth({
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
                googleId: profile.sub,
                role: role
              });

              handleSuccessfulGoogleLogin(data);
            } catch (err) {
              setError(err.message || 'Gagal masuk dengan akun Google.');
            } finally {
              setGoogleLoading(false);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Gagal memicu Google OAuth2 Popup:', err);
        setGoogleLoading(false);
      }
    }

    // Fallback if Google SDK not yet ready or blocked
    setError('Layanan Google Sign-In sedang memuat atau diblokir. Silakan login menggunakan nama/email dan password.');
  };

  // Initialize official Google Identity Services (GSI) when Client ID is available
  useEffect(() => {
    const activeCid = googleClientId || DEFAULT_GOOGLE_CLIENT_ID;
    if (!activeCid || typeof window === 'undefined') return;

    const setupGsi = () => {
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: activeCid,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render official Google button on main login page
        if (mainGoogleBtnContainerRef.current) {
          mainGoogleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(mainGoogleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 320,
            logo_alignment: 'left'
          });
        }

        // Show Google One Tap prompt automatically
        try {
          window.google.accounts.id.prompt();
        } catch (e) {}
      } catch (err) {
        console.warn('Inisialisasi Google Identity gagal:', err);
      }
    };

    if (window.google?.accounts?.id) {
      setupGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          setupGsi();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

  // Helper to determine destination path based on redirect & action URL query params
  const getDestinationPath = (userData) => {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get('redirect');
    const action = searchParams.get('action');

    if (redirect === 'home' || redirect === '/') {
      return action ? `/?action=${action}` : '/';
    }
    if (redirect === 'search') {
      return action ? `/search?action=${action}` : '/search';
    }
    if (userData?.role === 'mitra') return '/mitra';
    if (userData?.role === 'staff') return '/kasir';
    return '/dashboard';
  };

  // Success handler for Google auth flow
  const handleSuccessfulGoogleLogin = (data) => {
    if (data.kostName) {
      localStorage.setItem('kostName', data.kostName);
    }

    // Default to 'user' (penghuni) only if role is missing
    if (data.user && !data.user.role) {
      data.user.role = 'user';
      if (!data.user.kamar) data.user.kamar = '122';
    }

    // Ensure kostUser is in localStorage synchronously BEFORE onLogin and navigate
    localStorage.setItem('kostUser', JSON.stringify(data.user));
    onLogin(data.user, data.kostName);
    navigate(getDestinationPath(data.user), { replace: true });
  };

  // Handler for successful account recovery
  const handleRecoverySuccess = (userData, customKostName) => {
    if (customKostName) {
      localStorage.setItem('kostName', customKostName);
    }
    localStorage.setItem('kostUser', JSON.stringify(userData));
    setShowRecoveryModal(false);
    onLogin(userData, customKostName);
    navigate(getDestinationPath(userData), { replace: true });
  };

  const handleCopyText = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Standard password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check Honeypot trap
    if (honeypot.trim()) {
      setLoading(false);
      setError('Aktivitas otomatis (bot) terdeteksi.');
      return;
    }

    try {
      const data = await apiLogin(loginId, password, { website: honeypot });
      if (data.kostName) {
        localStorage.setItem('kostName', data.kostName);
      }
      // Default to 'user' (penghuni) only if role is missing
      if (data.user && !data.user.role) {
        data.user.role = 'user';
        if (!data.user.kamar) data.user.kamar = '122';
      }
      localStorage.setItem('kostUser', JSON.stringify(data.user));
      onLogin(data.user, data.kostName);
      navigate(getDestinationPath(data.user), { replace: true });
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa kembali email/nama dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.15) 0%, var(--bg-main) 70%)',
      padding: 'clamp(1rem, 2.5vw, 2rem) 1rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* FORM LOGIN UTAMA (REAL PRODUKSI) */}
        <div className="card glass-panel animate-fade-in" style={{
          width: '100%',
          padding: 'clamp(1.25rem, 3.5vw, 1.85rem) clamp(1rem, 3.5vw, 1.75rem)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div>
            {/* Top Back & Cancel Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isLight ? '#1e293b' : '#cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = isLight ? '#0f172a' : '#ffffff';
                  e.currentTarget.style.background = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = isLight ? '#1e293b' : '#cbd5e1';
                  e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)';
                }}
                title="Kembali ke halaman sebelumnya"
              >
                <ArrowLeft size={15} />
                <span>Kembali</span>
              </button>

              <Link
                to="/"
                style={{
                  fontSize: '0.8rem',
                  color: isLight ? '#64748b' : '#94a3b8',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.color = isLight ? '#0f172a' : '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.color = isLight ? '#64748b' : '#94a3b8'}
                title="Batalkan login dan kembali ke beranda"
              >
                Batal
              </Link>
            </div>

            {/* Brand Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <img 
                src="/logo.png" 
                alt="Logo KostKu" 
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  objectFit: 'contain',
                  boxShadow: 'var(--shadow-glow)'
                }} 
              />
            </div>

            <h2 style={{
              textAlign: 'center',
              margin: '0 0 0.5rem 0',
              fontSize: '1.6rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              background: isLight 
                ? 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' 
                : 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Masuk ke KostKu
            </h2>

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
              Platform Manajemen & Marketplace Kost Terverifikasi
            </p>

            {new URLSearchParams(location.search).get('action') === 'add-kost' && (
              <div style={{
                background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.18)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: isLight ? '#1d4ed8' : '#93c5fd',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: 1.4
              }}>
                <Sparkles size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Akses Tambah Kost:</strong> Silakan masuk terlebih dahulu. Setelah berhasil masuk, Anda akan langsung diarahkan untuk mendaftarkan properti kost baru Anda!
                </span>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-danger)',
                padding: '0.8rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                TOMBOL LOGIN RESMI GOOGLE (NATIVE UI & ONE-TAP)
                ══════════════════════════════════════════════════ */}
            {/* ══════════════════════════════════════════════════
                TOMBOL LOGIN RESMI GOOGLE (100% REAL)
                ══════════════════════════════════════════════════ */}
            <div style={{ marginBottom: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Official Google GSI Rendered Button (Single Real Button) */}
              <div 
                ref={mainGoogleBtnContainerRef} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  width: '100%', 
                  minHeight: '44px'
                }} 
              />
              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: isLight ? '#2563eb' : '#60a5fa' }}>
                  ✦ Login resmi Google: 1-klik akun tanpa password
                </span>
              </div>
            </div>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ margin: '0 10px', color: 'var(--text-muted)' }}>atau login dengan password</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            {/* Standard Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Anti-Bot Honeypot Trap */}
              <div style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                <input 
                  type="text" 
                  name="website" 
                  tabIndex={-1} 
                  autoComplete="off" 
                  value={honeypot} 
                  onChange={e => setHoneypot(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Email atau Nama Akun
                </label>
                <input 
                  type="text" 
                  required
                  value={loginId} 
                  onChange={e => setLoginId(e.target.value)}
                  placeholder="nama@email.com atau nama akun" 
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <input 
                  type="password" 
                  required
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda" 
                  className="input-field"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button 
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Key size={13} /> Lupa Password? Pulihkan Akun
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    if (window.history.length > 1) {
                      navigate(-1);
                    } else {
                      navigate('/');
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px', fontSize: '0.92rem' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary"
                  style={{ flex: 1.8, padding: '12px', fontSize: '0.95rem', gap: '6px' }}
                >
                  {loading ? 'Memeriksa Akun...' : 'Masuk Sekarang'} <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Belum memiliki akun terverifikasi?{' '}
            <Link to="/register" style={{ color: isLight ? '#2563eb' : '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>
              Daftar Akun Baru
            </Link>
          </div>

          {/* Legal Footer Links */}
          <div style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: isLight ? '#475569' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <Link to="/syarat-ketentuan" style={{ color: isLight ? '#475569' : '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
              📜 Syarat & Ketentuan
            </Link>
            <span>•</span>
            <Link to="/kebijakan-privasi" style={{ color: isLight ? '#475569' : '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
              🛡️ Kebijakan Privasi
            </Link>
            <span>•</span>
            <Link to="/tentang-kami" style={{ color: isLight ? '#475569' : '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
              🏢 Tentang Kami
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Pemulihan Akun */}
      <AccountRecoveryModal 
        isOpen={showRecoveryModal} 
        onClose={() => setShowRecoveryModal(false)} 
        onSuccessLogin={handleRecoverySuccess} 
      />
    </div>
  );
}
