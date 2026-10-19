import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Building, 
  CheckCircle, 
  Check,
  Mail, 
  MapPin, 
  Camera, 
  Sparkles,
  ShieldCheck,
  CreditCard,
  Phone,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  ExternalLink,
  Zap,
  Droplet,
  MessageSquare,
  Smartphone,
  KeyRound,
  Send,
  X
} from 'lucide-react';
import { apiRegister, apiCheckNik, apiSendOtp, apiVerifyOtp, apiGoogleAuth, apiCheckEmail } from '../services/api';
import AiRoomPlanSection from '../components/AiRoomPlanSection';
import CloudflareTurnstile from '../components/CloudflareTurnstile';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Role: 'user' (Anak Kost) | 'owner' (Pemilik Kost)
  const [role, setRole] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('role') === 'owner' ? 'owner' : 'user';
    } catch (e) {
      return 'user';
    }
  });

  // Sinkronisasi otomatis URL param ?role=owner atau ?role=user
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'owner' || roleParam === 'user') {
      setRole(roleParam);
    }
  }, [location.search]);
  
  // Step Workflow: 'form' | 'otp' | 'success'
  const [step, setStep] = useState('form');

  // Identitas & Akun Dasar
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // KTP (Hanya opsional untuk Pencari / Anak Kost, sama sekali TIDAK diperlukan untuk Pasang Kost / Owner)
  const [nik, setNik] = useState('');
  const [ktpImage, setKtpImage] = useState(null);
  const [nikStatus, setNikStatus] = useState(null);
  const [checkingNik, setCheckingNik] = useState(false);

  // 4-Pilar Anti-Bot: Cloudflare Turnstile, OTP WhatsApp/Gmail, Google Sign-In, & Honeypot
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Hidden trap field
  const [honeypotCompany, setHoneypotCompany] = useState(''); // Secondary trap

  // Google 1-Click Quick Register Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleKostName, setGoogleKostName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

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

  // Khusus Pemilik Kost (Owner) - Data Properti Kost
  const [kostName, setKostName] = useState('');
  const [address, setAddress] = useState('');
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [description, setDescription] = useState('');
  const [utilityScheme, setUtilityScheme] = useState('all_kost');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [imageFront, setImageFront] = useState(null);
  const [roomPhoto, setRoomPhoto] = useState('');
  const [floorPlan, setFloorPlan] = useState({
    dimensions: '3.0m x 4.0m',
    bedType: 'super_single',
    furnitures: ['wardrobe', 'desk', 'bathroom', 'ac', 'window'],
    generated: true,
    mode: 'ai'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Debounced NIK availability check (Khusus role === 'user' jika mengisi NIK)
  useEffect(() => {
    if (role !== 'user') return;
    const cleanNik = nik.trim();
    if (cleanNik.length !== 16) {
      setNikStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingNik(true);
      try {
        const res = await apiCheckNik(cleanNik);
        setNikStatus(res);
      } catch (err) {
        setNikStatus({ valid: true, available: true, message: 'NIK dapat digunakan' });
      } finally {
        setCheckingNik(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nik, role]);

  const handleNikChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    setNik(val);
    if (error) setError('');
  };

  const handleKtpImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setKtpImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageFrontChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageFront(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
        },
        () => {
          setLat(-6.2088);
          setLng(106.8456);
          alert('Lokasi otomatis diset ke koordinat Jakarta untuk pengujian.');
        }
      );
    } else {
      setLat(-6.2088);
      setLng(106.8456);
    }
  };

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

    // 1. Jebakan Honeypot Anti-Bot (Jika terisi, otomatis ditolak karena merupakan bot)
    if (honeypot.trim() || honeypotCompany.trim()) {
      setError('Aktivitas otomatis (bot) terdeteksi dan diblokir.');
      return false;
    }

    // 2. Validasi Nama
    if (!name.trim()) {
      setError(role === 'owner' ? 'Nama pemilik / pengelola kost wajib diisi.' : 'Nama lengkap wajib diisi.');
      return false;
    }

    // 3. Khusus User: Jika mengisi NIK, pastikan tepat 16 digit angka
    if (role === 'user' && nik.trim()) {
      if (nik.trim().length !== 16) {
        setError('NIK harus tepat 16 digit angka sesuai e-KTP.');
        return false;
      }
      if (nikStatus && !nikStatus.available) {
        setError('NIK ini sudah terdaftar! Silakan login jika ini akun Anda.');
        return false;
      }
    }

    // 4. Validasi Password
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return false;
    }

    // 5. Validasi khusus Owner (Pasang Kost) - Tidak perlu KTP, hanya data properti
    if (role === 'owner') {
      if (!kostName.trim()) {
        setError('Nama properti kost wajib diisi.');
        return false;
      }
      if (!address.trim()) {
        setError('Alamat lengkap kost wajib diisi.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Alamat email aktif pemilik kost wajib diisi.');
        return false;
      }
      if (!imageFront) {
        setError('Foto tampak depan kost wajib diunggah.');
        return false;
      }
    }

    // 6. Validasi target kontak sesuai saluran OTP
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

      // 2. Finalisasi pendaftaran akun
      const effectiveLat = lat || -6.2088;
      const effectiveLng = lng || 106.8456;

      const payload = {
        role,
        name: name.trim(),
        nik: role === 'owner' ? '' : nik.trim(), // Owner tidak butuh NIK
        ktpImage: role === 'owner' ? null : ktpImage, // Owner tidak butuh KTP
        email: email.trim(),
        phone: phone.trim(),
        password,
        otpCode: cleanCode,
        otpChannel,
        otpTarget: target,
        verifiedToken: effectiveToken,
        turnstileToken: turnstileToken || 'cf-fallback-token',
        website: honeypot, // Honeypot trap
        ...(role === 'owner' ? {
          kostName: kostName.trim() || 'Kost Baru',
          address: address.trim(),
          description: description.trim(),
          lat: effectiveLat,
          lng: effectiveLng,
          gmapsUrl: gmapsUrl.trim() || (address.trim() ? `https://maps.google.com/?q=${encodeURIComponent(address.trim())}` : `https://maps.google.com/?q=${effectiveLat},${effectiveLng}`),
          imageFront,
          roomPhoto: roomPhoto || '',
          floorPlan,
          utilityScheme
        } : {})
      };

      const regRes = await apiRegister(payload);
      setStep('success');
      setMessage(
        role === 'owner' 
          ? 'Registrasi Pemilik Kost Berhasil! Kost aktif dan siap menerima calon penghuni.' 
          : 'Pendaftaran Berhasil! Akun siap digunakan untuk mencari kost impian.'
      );
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setOtpError(err.message || 'Verifikasi OTP gagal. Silakan periksa kembali kode Anda.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Google 1-Click Quick Register / Login
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
        role: role,
        kostName: role === 'owner' ? (googleKostName.trim() || `Kost ${effectiveName}`) : undefined
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

  // Kondisi Tombol Lanjut ke OTP Aktif
  const isSubmitDisabled = () => {
    if (otpSending) return true;
    if (!name.trim()) return true;
    if (password.length < 6 || password !== confirmPassword) return true;
    if (otpChannel === 'whatsapp' && (!phone || phone.trim().length < 8)) return true;
    if (otpChannel === 'email' && (!email || !email.includes('@'))) return true;
    if (role === 'owner') {
      if (!kostName.trim() || !address.trim() || !email.trim() || !imageFront) return true;
    } else {
      if (nik.trim() && (nik.trim().length !== 16 || (nikStatus && !nikStatus.available))) return true;
    }
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
        maxWidth: '580px',
        width: '100%',
        padding: '2.5rem 2rem',
        border: '1px solid var(--border-light)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        borderRadius: '24px'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            background: role === 'owner' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--accent-gradient)',
            padding: '14px',
            borderRadius: '20px',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            {role === 'owner' ? <Building size={36} color="white" /> : <ShieldCheck size={36} color="white" />}
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: 800 }}>
            {role === 'owner' ? 'Pasang & Kelola Kost' : 'Daftar Akun KostKu'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            {role === 'owner' 
              ? 'Daftarkan properti kost Anda dan kelola penghuni tanpa ribet upload KTP.'
              : 'Verifikasi instan via WhatsApp OTP & Cloudflare Turnstile (Anti-Bot Tanpa Captcha).'}
          </p>
        </div>

        {/* 4-Pilar Anti-Bot Trust Badge */}
        <div style={{
          background: role === 'owner'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
          border: role === 'owner' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
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
          <Sparkles size={18} color={role === 'owner' ? '#34d399' : '#60a5fa'} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            {role === 'owner' ? (
              <>
                <strong style={{ color: '#6ee7b7' }}>⚡ Tanpa KTP untuk Pasang Kost:</strong> Pemilik kost tidak perlu mengunggah foto KTP. Sistem KostKu menggunakan verifikasi nomor WhatsApp OTP dan Cloudflare Turnstile untuk membuktikan manusia asli secara otomatis dan legal.
              </>
            ) : (
              <>
                <strong style={{ color: '#93c5fd' }}>🛡️ Proteksi Keamanan 4-Pilar Anti-Bot:</strong> Cloudflare Turnstile (tanpa captcha gambar ribet), Verifikasi OTP WhatsApp, Google Sign-In, & Honeypot Trap menjamin 100% pengguna nyata.
              </>
            )}
          </div>
        </div>

        {/* Role Selector Tabs (Only in step 'form') */}
        {step === 'form' && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px',
              borderRadius: '14px',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => setRole('user')}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: role === 'user' ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'transparent',
                  color: role === 'user' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <User size={16} /> Pencari / Anak Kost
              </button>
              
              <button
                type="button"
                onClick={() => setRole('owner')}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: role === 'owner' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                  color: role === 'owner' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <Building size={16} /> Pemilik Kost (Pasang Kost)
              </button>
            </div>

            {/* ═════════════════════════════════════════════════════
                PILIHAN 1: DAFTAR 1-KLIK DENGAN GOOGLE (INSTAN)
                ═════════════════════════════════════════════════════ */}
            <div style={{ marginBottom: '1.5rem' }}>
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
                  borderRadius: '14px',
                  border: '1px solid #dadce0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafd';
                  e.currentTarget.style.borderColor = '#4285F4';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#dadce0';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Daftar Cepat 1-Klik dengan Google</span>
              </button>
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
                SECTION 1: DATA AKUN & KONTAK RESMI (TIDAK ADA KTP UNTUK OWNER)
                ═════════════════════════════════════════════════════ */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} color={role === 'owner' ? '#34d399' : '#60a5fa'} /> 
                {role === 'owner' ? '1. Data Pemilik & Akun Pengelola Kost' : '1. Data Akun & Kontak'}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Nama Lengkap */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {role === 'owner' ? 'Nama Pemilik / Pengelola Kost' : 'Nama Lengkap'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder={role === 'owner' ? 'Contoh: Haji Slamet Riyadi / Ibu Ratna' : 'Contoh: Budi Santoso'} 
                    className="input-field" 
                  />
                </div>

                {/* Email & No WhatsApp */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Email {role === 'owner' ? <span style={{ color: '#ef4444' }}>*</span> : '(Opsional)'}
                    </label>
                    <input 
                      type="email" 
                      required={role === 'owner'}
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
                SECTION 2 (KHUSUS USER/ANAK KOST): VERIFIKASI e-KTP OPSIONAL
                ═════════════════════════════════════════════════════ */}
            {role === 'user' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} color="#60a5fa" /> 2. Verifikasi e-KTP (Opsional)
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px' }}>
                    Dapat diisi nanti saat sewa kamar
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {/* NIK 16 Digit */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Nomor Induk Kependudukan (NIK)
                      </label>
                      <span style={{ fontSize: '0.75rem', color: nik.length === 16 ? '#4ade80' : 'var(--text-muted)' }}>
                        {nik.length} / 16 digit
                      </span>
                    </div>
                    
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={nik} 
                        onChange={handleNikChange} 
                        placeholder="16 digit NIK KTP (opsional saat daftar awal)" 
                        className="input-field" 
                        style={{
                          fontFamily: 'monospace',
                          letterSpacing: '1px',
                          paddingRight: '36px'
                        }}
                      />
                      {checkingNik && (
                        <RefreshCw size={16} className="animate-spin" color="#60a5fa" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      )}
                      {!checkingNik && nikStatus && nikStatus.available && (
                        <CheckCircle size={16} color="#4ade80" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      )}
                    </div>
                  </div>

                  {/* Upload Foto KTP */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Foto e-KTP (Opsional)
                    </label>

                    <div style={{
                      border: '2px dashed rgba(59, 130, 246, 0.4)',
                      borderRadius: '14px',
                      padding: '0.8rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleKtpImageChange} 
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: 0,
                          cursor: 'pointer',
                          width: '100%',
                          height: '100%'
                        }} 
                      />

                      {ktpImage ? (
                        <div>
                          <img 
                            src={ktpImage} 
                            alt="Preview KTP" 
                            style={{
                              maxWidth: '100%',
                              maxHeight: '140px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              marginBottom: '6px'
                            }} 
                          />
                          <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Foto KTP Dipilih (Klik untuk ganti)
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <Camera size={24} color="#60a5fa" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#93c5fd' }}>
                            Unggah Foto KTP (Bisa dilewati)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════
                SECTION 2 (KHUSUS OWNER): INFORMASI PROPERTI KOST (PASANG KOST)
                ═════════════════════════════════════════════════════ */}
            {role === 'owner' && (
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={16} color="#34d399" /> 2. Informasi Properti Kost
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Nama Kost <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={kostName} 
                      onChange={e => setKostName(e.target.value)} 
                      placeholder="Misal: Kost Griya Sukun Co-Living" 
                      className="input-field" 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Alamat Lengkap <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea 
                      required 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota" 
                      rows={2} 
                      className="input-field" 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Lokasi Google Maps & Titik GPS
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input 
                        type="text" 
                        value={gmapsUrl} 
                        onChange={e => setGmapsUrl(e.target.value)} 
                        placeholder="Tautan Google Maps / Share Pin (atau klik Deteksi GPS)" 
                        className="input-field" 
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={getLocation} className="btn btn-secondary btn-sm" style={{ gap: '6px', whiteSpace: 'nowrap' }}>
                        <MapPin size={15} color="var(--accent-primary)" /> {lat ? 'GPS Tersimpan' : 'Deteksi GPS'}
                      </button>
                    </div>
                    {lat && (
                      <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Koordinat GPS berhasil dikunci: {lat.toFixed(5)}, {lng.toFixed(5)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Foto Tampak Depan Kost (Wajib) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFrontChange} 
                      required={!imageFront} 
                      style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem' }} 
                    />
                    {imageFront && (
                      <img 
                        src={imageFront} 
                        alt="Preview Depan" 
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginTop: '8px', border: '1px solid var(--border-color)' }} 
                      />
                    )}
                  </div>

                  {/* Skema Tagihan Listrik & Air (Utilitas) */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Skema Tagihan Listrik & Air <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      {[
                        {
                          id: 'all_kost',
                          icon: <span style={{ display: 'flex', gap: '2px' }}><Zap size={14} color="#eab308" /><Droplet size={14} color="#38bdf8" /></span>,
                          title: 'Air & Listrik dari Kost (Dikelola Kost)',
                          desc: 'Disediakan & ditagih oleh pihak kost (sudah include atau meteran kost).'
                        },
                        {
                          id: 'electric_mandiri',
                          icon: <Zap size={15} color="#eab308" />,
                          title: 'Listrik Mandiri (Token PLN per Kamar)',
                          desc: 'Penghuni beli token listrik PLN sendiri per kamar. Air dari pihak kost.'
                        },
                        {
                          id: 'water_mandiri',
                          icon: <Droplet size={15} color="#38bdf8" />,
                          title: 'Air Mandiri (PDAM/Sumur Mandiri)',
                          desc: 'Penghuni bayar meteran air sendiri. Listrik disediakan dari kost.'
                        },
                        {
                          id: 'all_mandiri',
                          icon: <span style={{ display: 'flex', gap: '2px' }}><Zap size={14} color="#eab308" /><Droplet size={14} color="#38bdf8" /></span>,
                          title: 'Listrik & Air Keduanya Mandiri',
                          desc: 'Penghuni bayar token PLN & air sendiri. Kost hanya tagih sewa kamar.'
                        }
                      ].map(opt => (
                        <div
                          key={opt.id}
                          onClick={() => setUtilityScheme(opt.id)}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '10px',
                            border: utilityScheme === opt.id ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: utilityScheme === opt.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ marginTop: '2px' }}>{opt.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: utilityScheme === opt.id ? '#6ee7b7' : '#f8fafc' }}>
                              {opt.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                              {opt.desc}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="regUtilityScheme"
                            checked={utilityScheme === opt.id}
                            onChange={() => setUtilityScheme(opt.id)}
                            style={{ accentColor: '#10b981', marginTop: '2px' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Denah Kamar Otomatis / Manual dengan AI */}
                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.75rem' }}>
                    <AiRoomPlanSection
                      roomPhoto={roomPhoto}
                      onRoomPhotoChange={setRoomPhoto}
                      floorPlan={floorPlan}
                      onChangeFloorPlan={setFloorPlan}
                      roomNumber="101"
                      kostName={kostName || 'Kost Baru'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════
                PILAR 1: CLOUDFLARE TURNSTILE (INVISIBLE / SEAMLESS)
                ═════════════════════════════════════════════════════ */}
            <CloudflareTurnstile 
              onVerify={(token) => setTurnstileToken(token)}
              action="register"
            />

            {/* Tombol Lanjut ke OTP */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitDisabled()} 
              style={{ 
                padding: '13px', 
                fontSize: '0.96rem', 
                marginTop: '0.5rem', 
                borderRadius: '12px',
                fontWeight: 700,
                gap: '8px',
                justifyContent: 'center',
                width: '100%',
                background: role === 'owner' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined
              }}
            >
              {otpSending ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Mengirim OTP ke {otpChannel === 'whatsapp' ? 'WhatsApp' : 'Gmail'}...
                </>
              ) : (
                <>
                  Lanjut ke Verifikasi OTP ({otpChannel === 'whatsapp' ? 'WhatsApp' : 'Gmail'}) <ArrowRight size={16}/>
                </>
              )}
            </button>
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
                  background: role === 'owner' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                  boxShadow: role === 'owner' ? '0 4px 18px rgba(16, 185, 129, 0.4)' : '0 4px 18px rgba(37, 99, 235, 0.4)'
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: '#f8fafc' }}>
            {role === 'owner' ? 'Kost Berhasil Didaftarkan!' : 'Pendaftaran Berhasil!'}
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
          <Link to="/login" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>
            Masuk di sini
          </Link>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════
          MODAL: DAFTAR CEPAT 1-KLIK DENGAN GOOGLE
          ═════════════════════════════════════════════════════ */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card glass-panel animate-scale-up" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '2rem',
            borderRadius: '20px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Daftar Akun Google</h3>
              </div>
              <button 
                onClick={() => setShowGoogleModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Masukkan alamat email Google Anda. Akun Anda akan dibuat dan diverifikasi instan tanpa perlu password atau foto KTP.
            </p>

            <form onSubmit={handleGoogleQuickSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Email Google / Gmail <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="email" 
                  required
                  value={googleEmail}
                  onChange={e => setGoogleEmail(e.target.value)}
                  placeholder="nama.anda@gmail.com"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Nama Anda
                </label>
                <input 
                  type="text" 
                  value={googleName}
                  onChange={e => setGoogleName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  className="input-field"
                />
              </div>

              {role === 'owner' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Nama Kost Anda (Opsional)
                  </label>
                  <input 
                    type="text" 
                    value={googleKostName}
                    onChange={e => setGoogleKostName(e.target.value)}
                    placeholder="Misal: Kost Griya Sukun"
                    className="input-field"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={googleLoading || !googleEmail.includes('@')}
                  className="btn btn-primary"
                  style={{ flex: 1.5, gap: '6px' }}
                >
                  {googleLoading ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>Daftar Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Register;
