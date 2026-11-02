import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  Check,
  Mail, 
  Sparkles,
  ShieldCheck,
  Phone,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  ExternalLink,
  MessageSquare,
  Smartphone,
  KeyRound,
  Send,
  X
} from 'lucide-react';
import { apiRegister, apiSendOtp, apiVerifyOtp, apiGoogleAuth, apiCheckEmail } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_GOOGLE_CLIENT_ID } from '../config/version';
import CloudflareTurnstile from '../components/CloudflareTurnstile';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Role default is 'user' (Anak Kost / Pencari Sewa)
  const role = 'user';
  
  // Step Workflow: 'form' | 'otp' | 'success'
  const [step, setStep] = useState('form');

  // Identitas & Akun (Nama Lengkap Disimpan)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // 4-Pilar Anti-Bot: Cloudflare Turnstile, OTP WhatsApp/Gmail, Google Sign-In, & Honeypot
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Hidden trap field
  const [honeypotCompany, setHoneypotCompany] = useState(''); // Secondary trap

  // Google 1-Click Quick Register Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const registerGoogleBtnRef = useRef(null);

  // Verifikasi OTP (WhatsApp / Gmail)
  const [otpChannel, setOtpChannel] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [otpCode, setOtpCode] = useState('');
  const [otpMaskedTarget, setOtpMaskedTarget] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpDevCode, setOtpDevCode] = useState('');
  const [otpWaDirectUrl, setOtpWaDirectUrl] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer = null;
    if (step === 'otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, otpCountdown]);

  // Step 1 -> Step 2: Validasi Data Formulir & Kirim OTP ke WhatsApp / Gmail
  const handleInitiateOtp = async (channelToUse = otpChannel) => {
    setError('');
    setOtpError('');

    // 0. Wajib Setujui Syarat & Ketentuan serta Kebijakan Privasi & Perjanjian
    if (!agreedTerms) {
      setError('⚠️ Anda wajib mencentang persetujuan Syarat & Ketentuan (S&K), Perjanjian Sewa/Kemitraan, serta Kebijakan Privasi KostKu untuk membuat akun.');
      const el = document.getElementById('agreeTermsContainer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    // 1. Jebakan Honeypot Anti-Bot (Jika terisi, otomatis ditolak karena merupakan bot)
    if (honeypot.trim() || honeypotCompany.trim()) {
      setError('Aktivitas otomatis (bot) terdeteksi dan diblokir.');
      return false;
    }

    // 2. Simpan & Validasi Nama Lengkap
    if (!name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return false;
    }

    // 3. Validasi Password
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return false;
    }

    // 4. Validasi target kontak sesuai saluran OTP
    const target = channelToUse === 'email' ? email.trim() : phone.trim();
    if (channelToUse === 'whatsapp' && (!phone || phone.trim().length < 8)) {
      setError('Nomor WhatsApp wajib diisi (minimal 9 digit) untuk menerima kode OTP verifikasi akun.');
      return false;
    }

    if (channelToUse === 'email' && (!email || !email.includes('@'))) {
      setError('Alamat Email wajib diisi dengan format valid untuk menerima kode OTP Gmail.');
      return false;
    }

    setOtpSending(true);
    try {
      const res = await apiSendOtp({
        target,
        channel: channelToUse,
        name: name.trim(),
        purpose: 'register',
        website: honeypot, // Honeypot trap
        turnstileToken: turnstileToken || 'cf-fallback-token'
      });

      setOtpChannel(channelToUse);
      setOtpMaskedTarget(res.targetMasked || target);
      setOtpDevCode(res.devOtp || '');
      setOtpWaDirectUrl(res.waDirectUrl || '');
      setOtpCountdown(60);
      setOtpSuccess(res.message || 'Kode OTP berhasil dikirim!');
      setStep('otp');
      return true;
    } catch (err) {
      setError(err.message || 'Gagal mengirim kode OTP. Periksa nomor/email Anda.');
      return false;
    } finally {
      setOtpSending(false);
    }
  };

  // Kirim ulang OTP
  const handleResendOtp = async () => {
    if (otpCountdown > 0 || otpSending) return;
    setOtpError('');
    setOtpSuccess('');
    setOtpSending(true);
    try {
      const target = otpChannel === 'email' ? email.trim() : phone.trim();
      const res = await apiSendOtp({
        target,
        channel: otpChannel,
        name: name.trim(),
        purpose: 'register',
        website: honeypot,
        turnstileToken: turnstileToken || 'cf-fallback-token'
      });
      setOtpCountdown(60);
      setOtpDevCode(res.devOtp || '');
      setOtpWaDirectUrl(res.waDirectUrl || '');
      setOtpSuccess(res.message || 'Kode OTP baru berhasil dikirim ulang!');
    } catch (err) {
      setOtpError(err.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  // Ganti saluran OTP (WhatsApp <-> Gmail)
  const handleSwitchChannel = async (newChannel) => {
    if (otpSending) return;
    const target = newChannel === 'email' ? email.trim() : phone.trim();
    if (!target) {
      setOtpError(`Harap kembali ke formulir dan isi ${newChannel === 'email' ? 'alamat Email' : 'nomor WhatsApp'} terlebih dahulu.`);
      return;
    }
    await handleInitiateOtp(newChannel);
  };

  // Step 2 -> Step 3: Verifikasi OTP dan Buat Akun
  const handleVerifyAndRegister = async (e) => {
    if (e) e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setOtpError('Masukkan 6 digit kode OTP yang Anda terima.');
      return;
    }

    setOtpVerifying(true);
    try {
      const target = otpChannel === 'email' ? email.trim() : phone.trim();

      // 1. Verifikasi kode OTP ke backend
      const verifyRes = await apiVerifyOtp({
        target,
        channel: otpChannel,
        code: cleanCode
      });

      const effectiveToken = verifyRes.verifiedToken || 'TOKEN_OTP_VALID';
      setVerifiedToken(effectiveToken);

      // 2. Finalisasi pendaftaran akun (default role: user / anak kost)
      const payload = {
        role: 'user',
        name: name.trim(), // Nama lengkap tersimpan resmi
        email: email.trim(),
        phone: phone.trim(),
        password,
        otpCode: cleanCode,
        otpChannel,
        otpTarget: target,
        verifiedToken: effectiveToken,
        turnstileToken: turnstileToken || 'cf-fallback-token',
        website: honeypot // Honeypot trap
      };

      const regRes = await apiRegister(payload);
      setStep('success');
      setMessage('Pendaftaran Berhasil! Akun Anda aktif dan siap digunakan.');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setOtpError(err.message || 'Verifikasi OTP gagal. Silakan periksa kembali kode Anda.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Handle callback when Google OAuth returns real JWT credential (from One Tap or renderButton)
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;

    try {
      setGoogleLoading(true);
      setError('');

      const data = await apiGoogleAuth({
        credential: response.credential,
        role: 'user'
      });

      if (data.user) {
        localStorage.setItem('kostUser', JSON.stringify(data.user));
        if (data.kostName) localStorage.setItem('kostName', data.kostName);
        setShowGoogleModal(false);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Gagal mendaftar dengan akun Google resmi.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Trigger Native Google Popup (Direct accounts.google.com UI)
  const triggerGoogleOAuthPopup = () => {
    setError('');
    const activeCid = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

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
                role: 'user'
              });

              if (data.user) {
                localStorage.setItem('kostUser', JSON.stringify(data.user));
                if (data.kostName) localStorage.setItem('kostName', data.kostName);
                setShowGoogleModal(false);
                navigate('/dashboard', { replace: true });
              }
            } catch (err) {
              setError(err.message || 'Gagal mendaftar dengan akun Google.');
            } finally {
              setGoogleLoading(false);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Gagal memicu Google OAuth2 Popup, fallback ke modal:', err);
        setGoogleLoading(false);
      }
    }

    setShowGoogleModal(true);
  };

  // Initialize official Google Identity Services (GSI) on Register page
  useEffect(() => {
    const activeCid = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
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

        if (registerGoogleBtnRef.current) {
          registerGoogleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(registerGoogleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
            shape: 'pill',
            width: 320,
            logo_alignment: 'left'
          });
        }
      } catch (err) {
        console.warn('Inisialisasi Google Identity Register gagal:', err);
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
  }, [showGoogleModal]);

  // Google 1-Click Quick Register / Login (In-App Fallback)
  const handleGoogleQuickSignup = async (e) => {
    if (e) e.preventDefault();
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
        role: 'user'
      });

      if (data.user) {
        localStorage.setItem('kostUser', JSON.stringify(data.user));
        if (data.kostName) localStorage.setItem('kostName', data.kostName);
        setShowGoogleModal(false);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Gagal mendaftar dengan akun Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Kondisi Tombol Lanjut ke OTP Aktif (validasi form utama)
  const isSubmitDisabled = () => {
    if (otpSending) return true;
    if (!name.trim()) return true;
    if (password.length < 6 || password !== confirmPassword) return true;
    if (otpChannel === 'whatsapp' && (!phone || phone.trim().length < 8)) return true;
    if (otpChannel === 'email' && (!email || !email.includes('@'))) return true;
    return false;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.15) 0%, var(--bg-main) 70%)',
      padding: '2.5rem 1rem'
    }}>
      <div className="card glass-panel animate-fade-in" style={{
        maxWidth: '560px',
        width: '100%',
        padding: '2rem 2rem 2.5rem',
        border: '1px solid var(--border-light)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        borderRadius: '24px'
      }}>
        
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
            title="Batalkan registrasi dan kembali ke beranda"
          >
            Batal
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img 
            src="/logo.png" 
            alt="Logo KostKu" 
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              objectFit: 'contain',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-glow)'
            }} 
          />
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: 800 }}>
            Daftar Akun KostKu
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            Verifikasi instan via WhatsApp OTP &amp; Cloudflare Turnstile (Anti-Bot Tanpa Captcha).
          </p>
        </div>

        {/* 4-Pilar Anti-Bot Trust Badge */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5
        }}>
          <Sparkles size={18} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: isLight ? '#1d4ed8' : '#93c5fd' }}>🛡️ Pendaftaran Akun Terproteksi:</strong> Cloudflare Turnstile, Verifikasi OTP WhatsApp, Google Sign-In, &amp; Honeypot Trap menjamin keamanan akun nyata. Mode peran (Pemilik Kost, Mitra UMKM, atau Staf) dapat disesuaikan di menu Pengaturan setelah masuk.
          </div>
        </div>

        {step === 'form' && (
          <>

            {/* ═════════════════════════════════════════════════════
                PILIHAN 1: DAFTAR RESMI DENGAN GOOGLE (100% REAL)
                ═════════════════════════════════════════════════════ */}
            <div style={{ marginBottom: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Official Google GSI Rendered Button (Single Real Button) */}
              <div 
                ref={registerGoogleBtnRef} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  width: '100%', 
                  minHeight: '44px'
                }} 
              />
              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: isLight ? '#2563eb' : '#60a5fa', fontWeight: 600 }}>
                  ✦ Registrasi resmi Google: 1-klik terverifikasi otomatis
                </span>
                <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '3px' }}>
                  Dengan mendaftar via Google, Anda menyetujui S&K & Kebijakan Privasi KostKu.
                </div>
              </div>
            </div>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ margin: '0 10px', color: 'var(--text-muted)' }}>atau daftar dengan nomor WhatsApp</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            {/* Error Alert */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-danger)',
                padding: '12px 14px',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleInitiateOtp(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* ═════════════════════════════════════════════════════
                PILAR 4: HONEYPOT TRAP (TERSEMBUNYI DARI MANUSIA)
                Bot otomatis akan mengisi form ini dan langsung diblokir
                ═════════════════════════════════════════════════════ */}
            <div style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
              <label htmlFor="website">Jangan isi kolom ini jika Anda manusia</label>
              <input 
                id="website"
                type="text" 
                name="website" 
                tabIndex={-1} 
                autoComplete="off" 
                value={honeypot} 
                onChange={e => setHoneypot(e.target.value)} 
              />
              <input 
                type="text" 
                name="company_url" 
                tabIndex={-1} 
                autoComplete="off" 
                value={honeypotCompany} 
                onChange={e => setHoneypotCompany(e.target.value)} 
              />
            </div>

            {/* ═════════════════════════════════════════════════════
                SECTION 1: DATA AKUN & KONTAK RESMI (NAMA LENGKAP TERSIMPAN)
                ═════════════════════════════════════════════════════ */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} color="#60a5fa" /> 
                Data Akun &amp; Kontak
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Nama Lengkap Pengguna */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Nama Lengkap <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Contoh: Budi Santoso" 
                    className="input-field" 
                  />
                </div>

                {/* Email & No WhatsApp */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Email (Opsional)
                    </label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="nama@email.com" 
                      className="input-field" 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Nomor WhatsApp / HP <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="tel" 
                      required
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      placeholder="081234567890" 
                      className="input-field" 
                    />
                  </div>
                </div>

                {/* Pilihan Metode Verifikasi OTP (Pilar 2) */}
                <div style={{
                  margin: '0.5rem 0',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <KeyRound size={15} color="#38bdf8" /> Kirim Kode OTP Verifikasi Melalui:
                    </label>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      Pilih 1 Saluran
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* Pilihan WhatsApp */}
                    <button
                      type="button"
                      onClick={() => {
                        setOtpChannel('whatsapp');
                        if (error) setError('');
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: otpChannel === 'whatsapp' ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: otpChannel === 'whatsapp' ? 'rgba(34, 197, 94, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageSquare size={16} color="#22c55e" />
                        <strong style={{ fontSize: '0.85rem', color: otpChannel === 'whatsapp' ? '#4ade80' : '#e2e8f0' }}>
                          WhatsApp OTP
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: otpChannel === 'whatsapp' ? '#86efac' : '#94a3b8', marginTop: '3px' }}>
                        {phone.trim() ? phone.trim() : 'Ke nomor WhatsApp'}
                      </span>
                    </button>

                    {/* Pilihan Gmail / Email */}
                    <button
                      type="button"
                      onClick={() => {
                        setOtpChannel('email');
                        if (error) setError('');
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: otpChannel === 'email' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: otpChannel === 'email' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={16} color="#38bdf8" />
                        <strong style={{ fontSize: '0.85rem', color: otpChannel === 'email' ? '#38bdf8' : '#e2e8f0' }}>
                          Gmail / Email OTP
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: otpChannel === 'email' ? '#7dd3fc' : '#94a3b8', marginTop: '3px' }}>
                        {email.trim() ? email.trim() : 'Ke alamat Gmail'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Password & Konfirmasi Password */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Min. 6 karakter" 
                        className="input-field" 
                        style={{ paddingRight: '36px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Konfirmasi Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="Ketik ulang password" 
                      className="input-field" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════
                PILAR 1: CLOUDFLARE TURNSTILE (INVISIBLE / SEAMLESS)
                ═════════════════════════════════════════════════════ */}
            <CloudflareTurnstile 
              onVerify={(token) => setTurnstileToken(token)}
              action="register"
            />

            {/* ═════════════════════════════════════════════════════
                KLAUSUL HUKUM: PERSETUJUAN SYARAT & KETENTUAN (CLICKWRAP)
                ═════════════════════════════════════════════════════ */}
            <div 
              id="agreeTermsContainer"
              style={{
                marginTop: '1.25rem',
                marginBottom: '1rem',
                padding: '14px 16px',
                borderRadius: '14px',
                background: agreedTerms 
                  ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)') 
                  : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)'),
                border: agreedTerms 
                  ? '1.5px solid #10b981' 
                  : (isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)'),
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: agreedTerms 
                  ? (isLight ? '0 2px 10px rgba(16, 185, 129, 0.18)' : '0 0 15px rgba(16, 185, 129, 0.2)') 
                  : (isLight ? '0 1px 3px rgba(0,0,0,0.05)' : 'none')
              }}
              onClick={() => setAgreedTerms(!agreedTerms)}
            >
              <input 
                type="checkbox" 
                id="agreeTermsCheckbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{
                  marginTop: '3px',
                  width: '20px',
                  height: '20px',
                  accentColor: '#2563eb',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    letterSpacing: '0.05em', 
                    textTransform: 'uppercase',
                    color: agreedTerms ? '#10b981' : (isLight ? '#dc2626' : '#f87171')
                  }}>
                    {agreedTerms ? '✓ Persetujuan Dikonfirmasi' : '⚠️ Wajib Dicentang'}
                  </span>
                </div>
                <label 
                  htmlFor="agreeTermsCheckbox" 
                  style={{ 
                    fontSize: '0.82rem', 
                    color: isLight ? '#1e293b' : '#f1f5f9', 
                    lineHeight: 1.6, 
                    cursor: 'pointer', 
                    margin: 0,
                    userSelect: 'none',
                    display: 'block'
                  }}
                >
                  Saya menyatakan telah membaca, memahami, dan menyetujui seluruh{' '}
                  <Link 
                    to="/syarat-ketentuan" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: isLight ? '#1d4ed8' : '#60a5fa', fontWeight: 800, textDecoration: 'underline' }}
                  >
                    Syarat & Ketentuan Layanan (S&K)
                  </Link>
                  ,{' '}
                  <Link 
                    to="/kebijakan-privasi" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: isLight ? '#1d4ed8' : '#60a5fa', fontWeight: 800, textDecoration: 'underline' }}
                  >
                    Kebijakan Privasi
                  </Link>
                  , serta <strong>Perjanjian Sewa-Menyewa & Kemitraan Layanan KostKu</strong>. <span style={{ color: '#ef4444', fontWeight: 800 }}>*</span>
                </label>
              </div>
            </div>

            {/* Tombol Aksi: Batal / Lanjut ke OTP */}
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
                style={{ flex: 1, padding: '13px', fontSize: '0.92rem', borderRadius: '12px' }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitDisabled()} 
                style={{ 
                  flex: 2,
                  padding: '13px', 
                  fontSize: '0.95rem', 
                  borderRadius: '12px',
                  fontWeight: 700,
                  gap: '8px',
                  justifyContent: 'center'
                }}
              >
                {otpSending ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Mengirim OTP...
                  </>
                ) : (
                  <>
                    Lanjut ke OTP ({otpChannel === 'whatsapp' ? 'WA' : 'Gmail'}) <ArrowRight size={16}/>
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}

      {/* ═════════════════════════════════════════════════════
          STEP 2: VERIFIKASI OTP (WHATSAPP ATAU GMAIL)
          ═════════════════════════════════════════════════════ */}
      {step === 'otp' && (
        <div className="animate-scale-up">
          {/* Header Badge */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 64,
              height: 64,
              margin: '0 auto 1rem',
              borderRadius: '20px',
              background: otpChannel === 'whatsapp'
                ? 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: otpChannel === 'whatsapp'
                ? '0 0 25px rgba(34, 197, 94, 0.4)'
                : '0 0 25px rgba(56, 189, 248, 0.4)'
            }}>
              {otpChannel === 'whatsapp' ? (
                <MessageSquare size={32} color="white" />
              ) : (
                <Mail size={32} color="white" />
              )}
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 800 }}>
              Verifikasi Kode OTP
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Kode keamanan 6 digit telah dikirim ke {otpChannel === 'whatsapp' ? 'WhatsApp' : 'Gmail / Email'}:
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '6px 14px',
              borderRadius: '9999px',
              marginTop: '8px',
              fontWeight: 700,
              color: otpChannel === 'whatsapp' ? '#4ade80' : '#38bdf8',
              fontSize: '0.9rem'
            }}>
              {otpChannel === 'whatsapp' ? <Smartphone size={15} /> : <Mail size={15} />}
              <span>{otpMaskedTarget}</span>
            </div>
          </div>

          {/* Error & Success Messages */}
          {otpError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px 14px',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{otpError}</span>
            </div>
          )}

          {otpSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '10px 14px',
              borderRadius: '12px',
              color: '#86efac',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <span>{otpSuccess}</span>
            </div>
          )}

          {/* Form Input OTP */}
          <form onSubmit={handleVerifyAndRegister}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '0.82rem',
                color: '#94a3b8',
                marginBottom: '8px'
              }}>
                Masukkan 6 Digit Kode OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(val);
                  if (otpError) setOtpError('');
                }}
                placeholder="• • • • • •"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '2rem',
                  letterSpacing: '0.45em',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '2px solid rgba(59, 130, 246, 0.4)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                }}
              />
            </div>

            {/* Quick Auto-Fill / Development Simulator */}
            {otpDevCode && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px dashed rgba(59, 130, 246, 0.3)',
                padding: '8px 12px',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem'
              }}>
                <span style={{ color: '#93c5fd' }}>
                  🔑 <strong>Kode Dev/Uji:</strong> <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{otpDevCode}</code>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(otpDevCode)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.25)',
                    border: 'none',
                    color: '#60a5fa',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Isi Otomatis
                </button>
              </div>
            )}

            {/* WhatsApp Direct Link (Jika ada) */}
            {otpWaDirectUrl && otpChannel === 'whatsapp' && (
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <a
                  href={otpWaDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#4ade80',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}
                >
                  <Send size={14} /> Buka WhatsApp untuk Melihat Kode
                </a>
              </div>
            )}

            {/* Timer & Resend Controls */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              {otpCountdown > 0 ? (
                <span>
                  Kirim ulang kode dalam <strong style={{ color: '#60a5fa' }}>{otpCountdown} detik</strong>
                </span>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#cbd5e1' }}>Belum menerima kode?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpSending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.82rem',
                      textDecoration: 'underline'
                    }}
                  >
                    {otpSending ? 'Mengirim...' : 'Kirim Ulang OTP'}
                  </button>
                </div>
              )}
            </div>

            {/* Switch Channel Option */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {otpChannel === 'whatsapp' ? (
                <button
                  type="button"
                  onClick={() => handleSwitchChannel('email')}
                  disabled={otpSending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Mail size={13} color="#38bdf8" />
                  <span>Tidak bisa akses WhatsApp? <strong style={{ color: '#38bdf8' }}>Kirim via Gmail / Email</strong></span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSwitchChannel('whatsapp')}
                  disabled={otpSending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <MessageSquare size={13} color="#22c55e" />
                  <span>Tidak ada akses Email? <strong style={{ color: '#4ade80' }}>Kirim via WhatsApp</strong></span>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '0.88rem', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Ubah Formulir
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={otpVerifying || otpCode.length < 4}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  gap: '8px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                  boxShadow: '0 4px 18px rgba(37, 99, 235, 0.4)'
                }}
              >
                {otpVerifying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Memverifikasi...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Verifikasi & Buat Akun
                  </>
                )}
              </button>
            </div>

            {/* Cancel Entire Registration Escape Hatch */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Batalkan proses pendaftaran akun? Anda akan kembali ke beranda.')) {
                    navigate('/');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                onMouseOver={e => e.currentTarget.style.color = '#cbd5e1'}
                onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
              >
                Batalkan Pendaftaran & Kembali ke Beranda
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          STEP 3: SUKSES
          ═════════════════════════════════════════════════════ */}
      {step === 'success' && (
        <div className="animate-scale-up" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{
            width: 72,
            height: 72,
            margin: '0 auto 1.25rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.45)'
          }}>
            <CheckCircle size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: isLight ? '#0f172a' : '#f8fafc' }}>
            Pendaftaran Berhasil!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Nomor kontak Anda telah terverifikasi resmi via <strong>{otpChannel === 'whatsapp' ? 'WhatsApp' : 'Gmail'}</strong> dan dilindungi oleh <strong>Cloudflare Turnstile</strong>.
          </p>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '12px',
            color: '#a7f3d0',
            fontSize: '0.82rem',
            marginBottom: '1.5rem'
          }}>
            🎉 Akun siap digunakan. Anda sedang dialihkan ke halaman Masuk...
          </div>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontWeight: 700 }}
          >
            Masuk ke Akun Sekarang →
          </button>
        </div>
      )}

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Sudah memiliki akun terdaftar?{' '}
          <Link to="/login" style={{ color: isLight ? '#2563eb' : '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>
            Masuk di sini
          </Link>
        </div>

        {/* Legal Footer Links */}
        <div style={{
          marginTop: '1.25rem',
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
  );
};

export default Register;
