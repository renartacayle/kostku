import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  User, 
  Lock, 
  ArrowRight, 
  Building, 
  CheckCircle, 
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
  ExternalLink
} from 'lucide-react';
import { apiRegister, apiCheckNik } from '../services/api';
import AiRoomPlanSection from '../components/AiRoomPlanSection';

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('user'); // 'user' (Anak Kost) or 'owner' (Pemilik Kost)
  
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

  // Khusus Pemilik Kost (Owner)
  const [kostName, setKostName] = useState('');
  const [address, setAddress] = useState('');
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [description, setDescription] = useState('');
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validasi NIK & Nama KTP
    if (!name.trim()) {
      setError('Nama lengkap sesuai KTP wajib diisi.');
      setLoading(false);
      return;
    }

    if (nik.length !== 16) {
      setError('NIK harus tepat 16 digit angka sesuai e-KTP.');
      setLoading(false);
      return;
    }

    if (nikStatus && !nikStatus.available) {
      setError('NIK ini sudah terdaftar! 1 KTP hanya berlaku untuk 1 akun. Silakan gunakan menu Pemulihan Akun dengan NIK jika ini akun Anda.');
      setLoading(false);
      return;
    }

    if (!ktpImage) {
      setError('Foto KTP wajib diunggah untuk verifikasi identitas resmi (anti-bot).');
      setLoading(false);
      return;
    }

    // Validasi Password
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      setLoading(false);
      return;
    }

    // Validasi khusus Owner
    if (role === 'owner') {
      if (!email) {
        setError('Alamat email wajib diisi untuk akun Pemilik Kost.');
        setLoading(false);
        return;
      }
      if (!imageFront) {
        setError('Foto depan kost wajib diunggah untuk verifikasi properti.');
        setLoading(false);
        return;
      }
    }

    const effectiveLat = lat || -6.2088;
    const effectiveLng = lng || 106.8456;

    try {
      const payload = {
        role,
        name: name.trim(),
        nik: nik.trim(),
        ktpImage,
        email: email.trim(),
        phone: phone.trim(),
        password,
        ...(role === 'owner' ? {
          kostName: kostName.trim() || 'Kost Baru',
          address: address.trim(),
          description: description.trim(),
          lat: effectiveLat,
          lng: effectiveLng,
          gmapsUrl: gmapsUrl.trim() || (address.trim() ? `https://maps.google.com/?q=${encodeURIComponent(address.trim())}` : `https://maps.google.com/?q=${effectiveLat},${effectiveLng}`),
          imageFront,
          roomPhoto: roomPhoto || '',
          floorPlan
        } : {})
      };

      const res = await apiRegister(payload);
      setMessage(res.message || 'Registrasi berhasil! Identitas KTP Anda terverifikasi.');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setError(err.message || 'Gagal mendaftar. Silakan periksa kembali formulir Anda.');
    } finally {
      setLoading(false);
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

        {/* Role Selector Tabs */}
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

        {/* Success Alert */}
        {message ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <CheckCircle size={56} color="var(--accent-success)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--accent-success)', margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>{message}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Mengalihkan ke halaman login...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
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

            {/* Tombol Submit */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || nik.length !== 16 || (nikStatus && !nikStatus.available) || !ktpImage} 
              style={{ 
                padding: '13px', 
                fontSize: '0.96rem', 
                marginTop: '0.5rem', 
                borderRadius: '12px',
                fontWeight: 700,
                gap: '8px',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Mendaftarkan Akun Resmi...
                </>
              ) : (
                <>
                  {role === 'owner' ? 'Daftarkan Kost & Verifikasi KTP' : 'Daftar Akun Pencari Kost Resmi'} <ArrowRight size={16}/>
                </>
              )}
            </button>
          </form>
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
