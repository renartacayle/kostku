import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  ArrowRight, 
  Lock, 
  Mail, 
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
  CheckCircle2
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  apiLogin, 
  apiGoogleAuth, 
  apiCheckEmail, 
  apiGetGoogleClientId, 
  apiSetGoogleClientId 
} from '../services/api';

export default function Login({ onLogin }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Sign-In State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleRole, setGoogleRole] = useState('owner'); // 'owner' or 'user'
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleKostName, setGoogleKostName] = useState('');
  const [emailStatus, setEmailStatus] = useState(null); // { exists: boolean, role?: string, name?: string, kostName?: string }
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [recentGoogleAccounts, setRecentGoogleAccounts] = useState([]);

  // Google OAuth 2.0 / Client ID Configuration
  const [googleClientId, setGoogleClientId] = useState('');
  const [showConfigClientId, setShowConfigClientId] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const [savingClientId, setSavingClientId] = useState(false);
  const [clientIdSavedMessage, setClientIdSavedMessage] = useState('');

  const googleBtnContainerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load saved Google accounts and Client ID on mount
  useEffect(() => {
    // 1. Load saved Google accounts from localStorage
    try {
      const savedAccounts = localStorage.getItem('kostku_saved_google_accounts');
      if (savedAccounts) {
        setRecentGoogleAccounts(JSON.parse(savedAccounts));
      } else {
        // Fallback check for single saved account
        const single = localStorage.getItem('kostku_last_google_account');
        if (single) {
          setRecentGoogleAccounts([JSON.parse(single)]);
        }
      }
    } catch (e) {
      console.warn('Gagal membaca saved google accounts:', e);
    }

    // 2. Load Google Client ID from backend or env or localStorage
    const loadClientId = async () => {
      let cid = localStorage.getItem('kostku_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
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
        setCustomClientIdInput(cid);
      }
    };
    loadClientId();

    // 3. Auto-open Google modal if requested in URL query (e.g. /login?google=owner)
    const params = new URLSearchParams(location.search);
    if (params.get('google')) {
      const paramRole = params.get('google');
      if (paramRole === 'owner' || paramRole === 'user') {
        setGoogleRole(paramRole);
      }
      setShowGoogleModal(true);
    }
  }, [location.search]);

  // Initialize official Google Identity Services (GSI) when Client ID is available
  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined' || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleBtnContainerRef.current) {
        googleBtnContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
          logo_alignment: 'left'
        });
      }
    } catch (err) {
      console.warn('Inisialisasi Google Identity gagal:', err);
    }
  }, [googleClientId, showGoogleModal]);

  // Handle callback when Google OAuth returns real JWT credential
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

  // Check email status dynamically with debounce
  useEffect(() => {
    if (!googleEmail || !googleEmail.includes('@') || googleEmail.length < 5) {
      setEmailStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await apiCheckEmail(googleEmail.trim());
        setEmailStatus(res);
        if (res.exists) {
          if (res.role) setGoogleRole(res.role);
          if (res.name && !googleName) setGoogleName(res.name);
          if (res.kostName && !googleKostName) setGoogleKostName(res.kostName);
        }
      } catch (err) {
        setEmailStatus(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [googleEmail]);

  // Success handler for all Google auth flows
  const handleSuccessfulGoogleLogin = (data) => {
    if (data.kostName) {
      localStorage.setItem('kostName', data.kostName);
    }

    // Save to recent Google accounts
    try {
      const user = data.user;
      const newEntry = {
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture || '',
        kostName: data.kostName
      };

      const existing = recentGoogleAccounts.filter(a => a.email.toLowerCase() !== user.email.toLowerCase());
      const updated = [newEntry, ...existing].slice(0, 4); // keep max 4 accounts
      setRecentGoogleAccounts(updated);
      localStorage.setItem('kostku_saved_google_accounts', JSON.stringify(updated));
      localStorage.setItem('kostku_last_google_account', JSON.stringify(newEntry));
    } catch (e) {
      console.warn('Gagal menyimpan recent account:', e);
    }

    // Ensure kostUser is in localStorage synchronously BEFORE onLogin and navigate
    localStorage.setItem('kostUser', JSON.stringify(data.user));
    setShowGoogleModal(false);
    onLogin(data.user, data.kostName);
    navigate('/dashboard', { replace: true });
  };

  // Direct login with personal Google email
  const handlePersonalGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setError('Masukkan alamat email Google yang valid (contoh: nama@gmail.com)');
      return;
    }

    try {
      setGoogleLoading(true);
      setError('');

      const effectiveName = googleName.trim() || googleEmail.split('@')[0];
      const data = await apiGoogleAuth({
        email: googleEmail.trim().toLowerCase(),
        name: effectiveName,
        role: googleRole,
        kostName: googleKostName.trim()
      });

      handleSuccessfulGoogleLogin(data);
    } catch (err) {
      setError(err.message || 'Gagal masuk dengan Akun Google pribadi.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Quick 1-click login from saved Google account
  const handleQuickLogin = (acc) => {
    setGoogleEmail(acc.email);
    setGoogleName(acc.name);
    if (acc.role) setGoogleRole(acc.role);

    // Trigger instant login
    apiGoogleAuth({
      email: acc.email,
      name: acc.name,
      role: acc.role || 'owner'
    })
    .then(handleSuccessfulGoogleLogin)
    .catch((err) => setError(err.message || 'Gagal masuk akun tersimpan'));
  };

  // Quick 1-tap instant entry for immediate access without typing
  const handleQuickDemoLogin = (targetRole) => {
    const demoEmail = targetRole === 'owner' ? 'pemilik@kostku.id' : 'penghuni@kostku.id';
    const demoName = targetRole === 'owner' ? 'Pemilik Kost' : 'Penghuni Kost';
    setGoogleLoading(true);
    setError('');
    apiGoogleAuth({
      email: demoEmail,
      name: demoName,
      role: targetRole,
      kostName: targetRole === 'owner' ? 'Kost Melati Indah' : undefined
    })
    .then(handleSuccessfulGoogleLogin)
    .catch((err) => {
      setError(err.message || 'Gagal masuk cepat.');
      setGoogleLoading(false);
    });
  };

  // Save custom Google Client ID
  const handleSaveClientId = async () => {
    setSavingClientId(true);
    setClientIdSavedMessage('');
    try {
      const clean = customClientIdInput.trim();
      localStorage.setItem('kostku_google_client_id', clean);
      setGoogleClientId(clean);
      await apiSetGoogleClientId(clean);
      setClientIdSavedMessage('✅ Google Client ID berhasil disimpan!');
      setTimeout(() => setClientIdSavedMessage(''), 3000);
    } catch (err) {
      setClientIdSavedMessage('⚠️ Disimpan di browser lokal.');
    } finally {
      setSavingClientId(false);
    }
  };

  // Clear custom Google Client ID
  const handleClearClientId = async () => {
    localStorage.removeItem('kostku_google_client_id');
    setGoogleClientId('');
    setCustomClientIdInput('');
    try {
      await apiSetGoogleClientId('');
    } catch (e) {}
    setClientIdSavedMessage('✓ Client ID dinonaktifkan.');
    setTimeout(() => setClientIdSavedMessage(''), 3000);
  };

  // Standard password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiLogin(loginId, password);
      if (data.kostName) {
        localStorage.setItem('kostName', data.kostName);
      }
      localStorage.setItem('kostUser', JSON.stringify(data.user));
      onLogin(data.user, data.kostName);
      navigate('/dashboard', { replace: true });
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
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.15) 0%, var(--bg-main) 70%)',
      padding: '1.5rem'
    }}>
      <div className="card glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '430px',
        padding: '2.5rem 2rem',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Home size={32} color="white" />
          </div>
        </div>

        <h2 style={{
          textAlign: 'center',
          margin: '0 0 0.5rem 0',
          fontSize: '1.6rem',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Masuk ke KostKu
        </h2>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
          Platform Manajemen & Marketplace Kost Terverifikasi
        </p>

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
            TOMBOL LOGIN GOOGLE PRIBADI
            ══════════════════════════════════════════════════ */}
        <div style={{ marginBottom: '1.5rem', width: '100%' }}>
          <button 
            type="button"
            onClick={() => {
              setError('');
              setShowGoogleModal(true);
            }}
            style={{ 
              width: '100%',
              padding: '12px 18px',
              background: '#ffffff',
              color: '#3c4043',
              borderRadius: '28px',
              border: '1px solid #dadce0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'Google Sans, Roboto, Inter, sans-serif'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.25), 0 2px 6px rgba(0,0,0,0.15)';
              e.currentTarget.style.backgroundColor = '#f8fafd';
              e.currentTarget.style.borderColor = '#4285F4';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)';
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#dadce0';
            }}
          >
            {/* Official Google 4-Color Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Masuk lewat Akun Google</span>
          </button>

          {/* Quick link hint */}
          <div style={{ textAlign: 'center', marginTop: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>
              ✦ Login instan untuk Pemilik Kost & Anak Kost
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
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Email Pemilik atau Nama Penghuni
            </label>
            <input 
              type="text" 
              required
              value={loginId} 
              onChange={e => setLoginId(e.target.value)}
              placeholder="nama@email.com atau nama pengguna" 
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
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '0.5rem', fontSize: '0.95rem' }}
          >
            {loading ? 'Memeriksa Akun...' : 'Masuk Sekarang'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Ingin mendaftar sebagai Pemilik Kost baru?{' '}
          <Link to="/register" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>
            Daftar di sini
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL INTERAKTIF: LOGIN DENGAN AKUN GOOGLE PRIBADI
          ══════════════════════════════════════════════════════════════════════ */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            background: '#1e1f22',
            color: '#e8eaed',
            borderRadius: '24px',
            border: '1px solid #3c4043',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden',
            fontFamily: 'Google Sans, Roboto, Inter, sans-serif'
          }}>
            {/* Top Google Loading Bar */}
            {googleLoading && (
              <div style={{
                height: '4px',
                width: '100%',
                background: '#3c4043',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '40%',
                  background: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335)',
                  borderRadius: '2px',
                  animation: 'googleBar 1.2s infinite ease-in-out'
                }} />
                <style>{`
                  @keyframes googleBar {
                    0% { left: -40%; width: 40%; }
                    50% { left: 40%; width: 60%; }
                    100% { left: 100%; width: 20%; }
                  }
                `}</style>
              </div>
            )}

            <div style={{ padding: '26px 24px 22px 24px' }}>
              {/* Header: Google Logo & Close */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#e8eaed' }}>
                      Login Akun Google Pribadi
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#9aa0a6' }}>
                      Koneksi aman ke <strong style={{ color: '#8ab4f8' }}>KostKu</strong>
                    </span>
                  </div>
                </div>

                {!googleLoading && (
                  <button 
                    onClick={() => setShowGoogleModal(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      color: '#9aa0a6',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    aria-label="Tutup"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* 1. ROLE SELECTOR (Owner vs Tenant) */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9aa0a6', marginBottom: '8px', fontWeight: 600 }}>
                  PILIH PERAN ANDA:
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: '#131416',
                  padding: '4px',
                  borderRadius: '14px',
                  border: '1px solid #3c4043'
                }}>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('owner')}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      background: googleRole === 'owner' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'transparent',
                      color: googleRole === 'owner' ? '#ffffff' : '#9aa0a6',
                      transition: 'all 0.2s'
                    }}
                  >
                    👑 Pemilik Kost
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('user')}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      background: googleRole === 'user' ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : 'transparent',
                      color: googleRole === 'user' ? '#ffffff' : '#9aa0a6',
                      transition: 'all 0.2s'
                    }}
                  >
                    🏠 Anak / Pencari Kost
                  </button>
                </div>
              </div>

              {/* Quick 1-Click Instant Entry Button (100% In-App) */}
              <div style={{
                background: googleRole === 'owner' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                border: googleRole === 'owner' ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(168, 85, 247, 0.35)',
                padding: '12px 14px',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={15} color={googleRole === 'owner' ? '#60a5fa' : '#c084fc'} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>
                      Akses Cepat 1-Klik Langsung Masuk:
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    Langsung Aktif
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(googleRole)}
                  disabled={googleLoading}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: googleLoading ? 'not-allowed' : 'pointer',
                    background: googleRole === 'owner' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: googleRole === 'owner' ? '0 4px 14px rgba(37, 99, 235, 0.4)' : '0 4px 14px rgba(124, 58, 237, 0.4)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>
                    {googleLoading ? 'Menghubungkan...' : `1-Klik Masuk sebagai ${googleRole === 'owner' ? 'Pemilik Kost' : 'Penghuni'}`}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* 2. SAVED / RECENT GOOGLE ACCOUNTS (Quick 1-Click Login) */}
              {recentGoogleAccounts.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#9aa0a6', fontWeight: 600 }}>
                      AKUN TERSIMPAN (1-KLIK MASUK):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('kostku_saved_google_accounts');
                        setRecentGoogleAccounts([]);
                      }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                    >
                      Hapus Riwayat
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {recentGoogleAccounts.map((acc, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleQuickLogin(acc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'rgba(66, 133, 244, 0.12)';
                          e.currentTarget.style.borderColor = '#4285F4';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                        }}
                      >
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: acc.role === 'owner' ? '#1a73e8' : acc.role === 'staff' ? '#059669' : '#7c3aed',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.95rem'
                        }}>
                          {acc.name ? acc.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e8eaed' }}>{acc.name}</span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: acc.role === 'owner' ? 'rgba(37, 99, 235, 0.2)' : acc.role === 'staff' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                              color: acc.role === 'owner' ? '#60a5fa' : acc.role === 'staff' ? '#6ee7b7' : '#c084fc',
                              fontWeight: 600
                            }}>
                              {acc.role === 'owner' ? 'Pemilik' : acc.role === 'staff' ? 'Staf Kost' : 'Penghuni'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#9aa0a6', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {acc.email}
                          </div>
                        </div>
                        <ArrowRight size={16} color="#60a5fa" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. INPUT FORM FOR PERSONAL GOOGLE EMAIL */}
              <form onSubmit={handlePersonalGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9aa0a6', marginBottom: '6px' }}>
                    <span>Email Google Pribadi Anda:</span>
                    {checkingEmail && <span style={{ color: '#8ab4f8' }}>Memeriksa...</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="email"
                      required
                      placeholder="contoh: nama.anda@gmail.com"
                      value={googleEmail}
                      onChange={e => setGoogleEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: '#131416',
                        border: emailStatus?.exists ? '1px solid #34A853' : '1px solid #5f6368',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8ab4f8'}
                      onBlur={(e) => e.target.style.borderColor = emailStatus?.exists ? '#34A853' : '#5f6368'}
                    />
                    {emailStatus?.exists && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#34A853',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        <CheckCircle2 size={16} />
                        <span>Terdaftar</span>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Status Helper */}
                  {emailStatus?.exists && (
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(52, 168, 83, 0.1)',
                      border: '1px solid rgba(52, 168, 83, 0.25)',
                      fontSize: '0.75rem',
                      color: '#81c995',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>
                        Akun ditemukan: <strong>{emailStatus.name}</strong> ({emailStatus.role === 'owner' ? 'Pemilik Kost' : emailStatus.role === 'staff' ? `Staf Kost (${emailStatus.jobTitle || 'Penjaga'})` : 'Penghuni'})
                      </span>
                    </div>
                  )}
                </div>

                {/* If new user, allow specifying full name */}
                {(!emailStatus || !emailStatus.exists) && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#9aa0a6', marginBottom: '6px' }}>
                      Nama Lengkap Anda:
                    </label>
                    <input 
                      type="text"
                      placeholder="Masukkan nama Anda"
                      value={googleName}
                      onChange={e => setGoogleName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: '#131416',
                        border: '1px solid #5f6368',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8ab4f8'}
                      onBlur={(e) => e.target.style.borderColor = '#5f6368'}
                    />
                  </div>
                )}

                {/* If new owner, allow specifying kost name */}
                {googleRole === 'owner' && (!emailStatus || !emailStatus.exists) && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#9aa0a6', marginBottom: '6px' }}>
                      Nama Kost Anda (Opsional):
                    </label>
                    <input 
                      type="text"
                      placeholder="contoh: Kost Melati Residence"
                      value={googleKostName}
                      onChange={e => setGoogleKostName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: '#131416',
                        border: '1px solid #5f6368',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8ab4f8'}
                      onBlur={(e) => e.target.style.borderColor = '#5f6368'}
                    />
                  </div>
                )}

                {/* Action Button */}
                <button 
                  type="submit"
                  disabled={googleLoading || !googleEmail}
                  style={{
                    marginTop: '6px',
                    padding: '12px 20px',
                    background: 'linear-gradient(90deg, #4285F4, #2563eb)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: googleLoading || !googleEmail ? 'not-allowed' : 'pointer',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(66, 133, 244, 0.4)',
                    opacity: googleLoading || !googleEmail ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {googleLoading ? (
                    'Menghubungkan ke Google...'
                  ) : (
                    <>
                      <span>Masuk dengan Akun Ini</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Official Google GSI Button Container if Client ID is configured */}
              {googleClientId && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #3c4043', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9aa0a6', display: 'block', marginBottom: '10px' }}>
                    atau gunakan Pop-up Resmi Google One-Tap:
                  </span>
                  <div ref={googleBtnContainerRef} style={{ display: 'flex', justifyContent: 'center' }} />
                </div>
              )}

              {/* 4. EXPANDABLE: GOOGLE CLIENT ID SETTINGS */}
              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowConfigClientId(!showConfigClientId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9aa0a6',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '4px 0'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} color="#8ab4f8" />
                    <span>Pengaturan Lanjutan: Google Cloud Console (Opsional)</span>
                  </span>
                  {showConfigClientId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showConfigClientId && (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px',
                    background: '#131416',
                    borderRadius: '10px',
                    border: '1px solid #3c4043',
                    fontSize: '0.8rem'
                  }}>
                    <p style={{ margin: '0 0 8px 0', color: '#9aa0a6', lineHeight: 1.4 }}>
                      💡 <em>Fitur masuk cepat di atas sudah otomatis aktif tanpa perlu pengaturan ini.</em> Jika Anda seorang pengembang dan ingin menghubungkan Client ID resmi:
                    </p>
                    <input 
                      type="text"
                      placeholder="xxxx-xxxx.apps.googleusercontent.com"
                      value={customClientIdInput}
                      onChange={e => setCustomClientIdInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#1e1f22',
                        border: '1px solid #5f6368',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.78rem',
                        marginBottom: '8px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#81c995', flex: 1 }}>{clientIdSavedMessage}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {googleClientId && (
                          <button
                            type="button"
                            onClick={handleClearClientId}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Hapus
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveClientId}
                          disabled={savingClientId}
                          style={{
                            padding: '6px 14px',
                            background: '#8ab4f8',
                            color: '#202124',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          {savingClientId ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
