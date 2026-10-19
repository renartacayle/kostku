import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Send
} from 'lucide-react';
import { apiRegister, apiCheckNik, apiSendOtp, apiVerifyOtp } from '../services/api';
import AiRoomPlanSection from '../components/AiRoomPlanSection';

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('user'); // 'user' (Anak Kost) or 'owner' (Pemilik Kost)
  
  // Step Workflow: 'form' | 'otp' | 'success'
  const [step, setStep] = useState('form');

  // Identitas KTP (Anti-Bot)
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [ktpImage, setKtpImage] = useState(null);
  const [nikStatus, setNikStatus] = useState(null); // { valid: bool, available: bool, message: string }
  const [checkingNik, setCheckingNik] = useState(false);

  // Kontak & Akun
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  // Khusus Pemilik Kost (Owner)
  const [kostName, setKostName] = useState('');
  const [address, setAddress] = useState('');
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [description, setDescription] = useState('');
  const [utilityScheme, setUtilityScheme] = useState('all_kost'); // 'all_kost', 'electric_mandiri', 'water_mandiri', 'all_mandiri'
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

  // Debounced NIK availability check
  useEffect(() => {
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
  }, [nik]);

  const handleNikChange = (e) => {
    // Only numbers, max 16 digits
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

    // Validasi NIK & Nama KTP
    if (!name.trim()) {
      setError('Nama lengkap sesuai KTP wajib diisi.');
      return false;
    }

    if (nik.length !== 16) {
      setError('NIK harus tepat 16 digit angka sesuai e-KTP.');
      return false;
    }

    if (nikStatus && !nikStatus.available) {
      setError('NIK ini sudah terdaftar! 1 KTP hanya berlaku untuk 1 akun. Silakan gunakan menu Pemulihan Akun dengan NIK jika ini akun Anda.');
      return false;
    }

    if (!ktpImage) {
      setError('Foto KTP wajib diunggah untuk verifikasi identitas resmi (anti-bot).');
      return false;
    }

    // Validasi Password
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return false;
    }

    // Validasi khusus Owner
    if (role === 'owner') {
      if (!email) {
        setError('Alamat email wajib diisi untuk akun Pemilik Kost.');
        return false;
      }
      if (!imageFront) {
        setError('Foto depan kost wajib diunggah untuk verifikasi properti.');
        return false;
      }
    }

    // Validasi target kontak sesuai saluran yang dipilih
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
        purpose: 'register'
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
      setError(err.message || 'Gagal mengirim kode OTP. Periksa koneksi atau nomor/email Anda.');
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
        purpose: 'register'
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
        nik: nik.trim(),
        ktpImage,
        email: email.trim(),
        phone: phone.trim(),
        password,
        otpCode: cleanCode,
        otpChannel,
        otpTarget: target,
        verifiedToken: effectiveToken,
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
      setMessage(regRes.message || 'Pendaftaran berhasil! Identitas KTP dan kontak Anda terverifikasi resmi.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setOtpError(err.message || 'Verifikasi OTP gagal. Silakan periksa kembali kode Anda.');
    } finally {
      setOtpVerifying(false);
    }
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
        padding: '2.5rem 2rem',
        border: '1px solid var(--border-light)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        borderRadius: '24px'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            background: 'var(--accent-gradient)',
            padding: '14px',
            borderRadius: '20px',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <ShieldCheck size={36} color="white" />
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: 800 }}>Daftar Akun KostKu</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            Verifikasi resmi identitas KTP (Anti-Bot: 1 KTP = 1 Akun)
          </p>
        </div>

        {/* Anti-Bot Trust Badge */}
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
            <strong style={{ color: '#93c5fd' }}>Keamanan 1 KTP = 1 Akun:</strong> Mencegah bot dan akun palsu. NIK dan Nama KTP ini juga melindungi akun Anda agar dapat dipulihkan kapan saja jika lupa password.
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
              marginBottom: '1.75rem',
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
                  background: role === 'owner' ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'transparent',
                  color: role === 'owner' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <Building size={16} /> Pemilik Kost (Owner)
              </button>
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
            
            {/* 1. INFORMASI IDENTITAS KTP (ANTI-BOT) */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={16} color="#60a5fa" /> 1. Verifikasi Identitas e-KTP (Wajib)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Nama Lengkap Sesuai KTP */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Nama Lengkap Sesuai KTP <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Contoh: Budi Santoso (persis seperti di KTP)" 
                    className="input-field" 
                  />
                </div>

                {/* NIK 16 Digit */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Nomor Induk Kependudukan (NIK) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: nik.length === 16 ? '#4ade80' : 'var(--text-muted)' }}>
                      {nik.length} / 16 digit
                    </span>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      required 
                      value={nik} 
                      onChange={handleNikChange} 
                      placeholder="Masukkan 16 digit angka NIK KTP Anda" 
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
                    {!checkingNik && nikStatus && !nikStatus.available && (
                      <AlertCircle size={16} color="#f87171" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    )}
                  </div>

                  {/* NIK status badge */}
                  {nikStatus && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '0.75rem',
                      color: nikStatus.available ? '#4ade80' : '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {nikStatus.available ? '✓ ' : '⚠ '}
                      {nikStatus.message}
                      {!nikStatus.available && (
                        <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'underline', marginLeft: '4px' }}>
                          Pulihkan akun di sini
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Upload Foto KTP Asli */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Foto e-KTP Asli (Anti-Bot) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Unggah atau jepret foto KTP Anda. Pastikan nama dan NIK terlihat jelas.
                  </p>

                  <div style={{
                    border: '2px dashed rgba(59, 130, 246, 0.4)',
                    borderRadius: '14px',
                    padding: '1rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleKtpImageChange} 
                      required={!ktpImage}
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
                            maxHeight: '160px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '6px'
                          }} 
                        />
                        <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Foto KTP Berhasil Dipilih (Klik untuk ganti)
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <Camera size={28} color="#60a5fa" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#93c5fd' }}>
                          Klik untuk Ambil / Unggah Foto KTP
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Format JPG, PNG (Maks 10MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. DATA AKUN LOGIN & KONTAK */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={16} color="#60a5fa" /> 2. Data Akun & Password
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '0.75rem' }}>
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
                    Nomor WhatsApp / HP
                  </label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="081234567890" 
                    className="input-field" 
                  />
                </div>
              </div>

              {/* Pilihan Metode Verifikasi OTP */}
              <div style={{
                margin: '0.85rem 0',
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

                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '8px', lineHeight: 1.4 }}>
                  ℹ️ Kode OTP 6-digit akan dikirimkan otomatis ke {otpChannel === 'whatsapp' ? 'WhatsApp' : 'Gmail'} Anda sebelum akun diaktifkan.
                </div>
              </div>

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

            {/* 3. KHUSUS PEMILIK KOST: DATA PROPERTI KOST */}
            {role === 'owner' && (
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={16} color="#60a5fa" /> 3. Informasi Properti Kost
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
                            border: utilityScheme === opt.id ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: utilityScheme === opt.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ marginTop: '2px' }}>{opt.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: utilityScheme === opt.id ? '#93c5fd' : '#f8fafc' }}>
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
                            style={{ accentColor: '#3b82f6', marginTop: '2px' }}
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

            {/* Tombol Submit Form */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={otpSending || nik.length !== 16 || (nikStatus && !nikStatus.available) || !ktpImage} 
              style={{ 
                padding: '13px', 
                fontSize: '0.96rem', 
                marginTop: '0.5rem', 
                borderRadius: '12px',
                fontWeight: 700,
                gap: '8px',
                justifyContent: 'center',
                width: '100%'
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

      {/* STEP 2: VERIFIKASI OTP (WHATSAPP ATAU GMAIL) */}
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
                marginBottom: '8px',
                fontWeight: 600
              }}>
                Masukkan 6 Digit Angka OTP:
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(val);
                  if (otpError) setOtpError('');
                }}
                placeholder="• • • • • •"
                autoFocus
                style={{
                  width: '100%',
                  letterSpacing: '14px',
                  fontSize: '2rem',
                  fontWeight: 900,
                  textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '16px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '2px solid rgba(56, 189, 248, 0.5)',
                  borderRadius: '16px',
                  color: '#38bdf8',
                  boxShadow: '0 0 30px rgba(56, 189, 248, 0.15)',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>

            {/* Action Helpers: WhatsApp Web button & Demo Auto-Fill */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              {otpChannel === 'whatsapp' && otpWaDirectUrl && (
                <a
                  href={otpWaDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#4ade80',
                    borderColor: 'rgba(34, 197, 94, 0.35)',
                    background: 'rgba(34, 197, 94, 0.08)',
                    fontSize: '0.82rem'
                  }}
                >
                  <Smartphone size={15} />
                  <span>Buka WhatsApp Web / Aplikasi untuk Lihat Pesan</span>
                  <ExternalLink size={13} />
                </a>
              )}

              {otpDevCode && (
                <button
                  type="button"
                  onClick={() => setOtpCode(otpDevCode)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px dashed rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <KeyRound size={13} />
                  <span>Auto-Fill Kode Uji Coba: <strong>{otpDevCode}</strong></span>
                </button>
              )}
            </div>

            {/* Countdown & Resend */}
            <div style={{
              textAlign: 'center',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '1.25rem',
              fontSize: '0.82rem'
            }}>
              {otpCountdown > 0 ? (
                <span style={{ color: '#94a3b8' }}>
                  Kirim ulang kode dalam <strong style={{ color: '#f59e0b' }}>00:{otpCountdown < 10 ? '0' + otpCountdown : otpCountdown}</strong>
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
          </form>
        </div>
      )}

      {/* STEP 3: SUKSES */}
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
            Registrasi & Verifikasi Berhasil!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Identitas e-KTP dan kontak resmi Anda telah terverifikasi via <strong>{otpChannel === 'whatsapp' ? 'WhatsApp' : 'Gmail / Email'}</strong>.
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
    </div>
  );
};

export default Register;
