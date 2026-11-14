import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  UserCheck,
  Building2,
  ShieldCheck,
  MessageCircle,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Users,
  Briefcase
} from 'lucide-react';
import { apiGetPublicStaffInvite, apiAcceptStaffInvite } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const formatCurrency = (amount) => {
  const val = Number(amount || 0);
  if (!val) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

export default function StaffInviteAccept({ activeUser, onLogin }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [acceptedResult, setAcceptedResult] = useState(null);

  useEffect(() => {
    let active = true;
    const loadInvite = async () => {
      if (!token) {
        setLoadError('Token undangan tidak valid.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError('');
      try {
        const res = await apiGetPublicStaffInvite(token);
        if (!active) return;
        const inv = res?.invite;
        if (!inv) {
          setLoadError('Data undangan karyawan tidak ditemukan.');
        } else {
          setInvite(inv);
          setName(inv.suggestedName || '');
          setEmail(inv.email || '');
          setPhone(inv.phone || '');
        }
      } catch (err) {
        if (!active) return;
        setLoadError(err?.message || 'Link undangan tidak valid atau sudah kadaluarsa.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadInvite();
    return () => { active = false; };
  }, [token]);

  const handleAccept = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!name.trim()) {
      setSubmitError('Harap isi nama lengkap Anda.');
      return;
    }

    if (invite?.channel === 'email' && !email.trim()) {
      setSubmitError('Alamat Gmail tidak boleh kosong.');
      return;
    }
    if (invite?.channel === 'whatsapp' && phone.replace(/\D/g, '').length < 9 && !email.trim()) {
      setSubmitError('Harap pastikan nomor WhatsApp atau alamat Gmail valid terisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiAcceptStaffInvite(token, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim() || undefined
      });
      setAcceptedResult(res);
      // Automatically log in the employee when opened from a signed-out session
      if (!activeUser && typeof onLogin === 'function' && res?.user) {
        onLogin(res);
      }
    } catch (err) {
      setSubmitError(err?.message || 'Gagal menerima undangan karyawan.');
    } finally {
      setSubmitting(false);
    }
  };

  const bgPage = isLight
    ? 'linear-gradient(135deg, #f8fafc 0%, #ecfdf5 50%, #f1f5f9 100%)'
    : 'linear-gradient(135deg, #090d16 0%, #0f172a 55%, #064e3b25 100%)';
  const cardBg = isLight ? '#ffffff' : '#0f172a';
  const cardBorder = isLight ? '#e2e8f0' : 'rgba(51, 65, 85, 0.85)';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#475569' : '#94a3b8';
  const subtleBg = isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const inputBg = isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.9)';
  const inputBorder = isLight ? '#cbd5e1' : '#334155';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: bgPage,
      padding: '24px 14px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '22px',
        boxShadow: isLight ? '0 18px 45px rgba(15, 23, 42, 0.08)' : '0 24px 60px rgba(0, 0, 0, 0.55)',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Top Accent Banner */}
        <div style={{
          background: isLight
            ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
            : 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
          padding: '22px 20px',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.18)',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.03em'
            }}>
              <ShieldCheck size={13} /> UNDANGAN KARYAWAN RESMI
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9 }}>KostKu</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, lineHeight: 1.25 }}>
            {acceptedResult
              ? 'Akun Karyawan Resmi Aktif'
              : (invite ? `Gabung Tim ${invite.kostName}` : 'Konfirmasi Undangan Karyawan')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.92 }}>
            {invite
              ? `Anda diundang oleh ${invite.ownerName || 'Pemilik Kost'} untuk bergabung sebagai staf aktif.`
              : 'Verifikasi detail undangan untuk mengaktifkan akun kerja Anda.'}
          </p>
        </div>

        <div style={{ padding: '20px', boxSizing: 'border-box' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: textSecondary }}>
              <Clock size={32} style={{ margin: '0 auto 10px', opacity: 0.7 }} />
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: textPrimary }}>
                Memeriksa Link Undangan...
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
                Mohon tunggu sebentar selagi detail penugasan dimuat.
              </p>
            </div>
          ) : loadError ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.14)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <AlertCircle size={24} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                Link Undangan Tidak Tersedia
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: '0.84rem', color: textSecondary, lineHeight: 1.5 }}>
                {loadError}
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none'
                }}
              >
                Ke Halaman Login <ArrowRight size={15} />
              </Link>
            </div>
          ) : acceptedResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.96rem', color: isLight ? '#065f46' : '#6ee7b7' }}>
                    {acceptedResult.user?.name} Resmi Menjadi Karyawan!
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: isLight ? '#047857' : '#a7f3d0', lineHeight: 1.45 }}>
                    {acceptedResult.message}
                  </p>
                </div>
              </div>

              <div style={{
                background: subtleBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '0.82rem',
                color: textSecondary,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div>Cabang: <strong style={{ color: textPrimary }}>{acceptedResult.kostName}</strong></div>
                <div>Peran: <strong style={{ color: textPrimary }}>{acceptedResult.staffRole}</strong></div>
                {acceptedResult.user?.phone && (
                  <div>No. WhatsApp Login: <strong style={{ color: textPrimary }}>{acceptedResult.user.phone}</strong></div>
                )}
                {acceptedResult.user?.email && (
                  <div>Gmail Login: <strong style={{ color: textPrimary }}>{acceptedResult.user.email}</strong></div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onLogin === 'function' && acceptedResult.user) {
                      onLogin(acceptedResult);
                    }
                    navigate('/dashboard');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Masuk ke Portal Karyawan Sekarang <ArrowRight size={16} />
                </button>

                {activeUser && (activeUser.role === 'owner' || activeUser.role === 'master') && (
                  <button
                    type="button"
                    onClick={() => navigate('/karyawan')}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${cardBorder}`,
                      background: subtleBg,
                      color: textPrimary,
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Tetap sebagai Pemilik &amp; Lihat Daftar Karyawan
                  </button>
                )}
              </div>
            </div>
          ) : invite?.status === 'accepted' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
              <CheckCircle2 size={38} color="#10b981" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                Undangan Sudah Digunakan
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: textSecondary, lineHeight: 1.5 }}>
                Undangan untuk <strong>{invite.acceptedName || invite.target}</strong> di <strong>{invite.kostName}</strong> sudah dikonfirmasi aktif. Silakan masuk menggunakan akun karyawan Anda.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none'
                }}
              >
                Masuk ke Akun KostKu <ArrowRight size={15} />
              </Link>
            </div>
          ) : invite?.status !== 'pending' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
              <AlertCircle size={36} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                Undangan Tidak Lagi Aktif ({invite?.status})
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: textSecondary, lineHeight: 1.5 }}>
                Link undangan ini sudah kedaluwarsa atau dibatalkan oleh pemilik kost. Minta pemilik untuk mengirimkan link undangan baru.
              </p>
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${cardBorder}`,
                  background: subtleBg,
                  color: textPrimary,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textDecoration: 'none'
                }}
              >
                Kembali ke Beranda
              </Link>
            </div>
          ) : (
            <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeUser && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.14)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: isLight ? '#1e40af' : '#93c5fd',
                  fontSize: '0.78rem',
                  lineHeight: 1.45
                }}>
                  Anda saat ini login sebagai <strong>{activeUser.name}</strong> ({activeUser.role}). Mengonfirmasi form di bawah akan menambahkan akun karyawan baru ke <strong>{invite.kostName}</strong>.
                </div>
              )}

              {/* Summary Assignment Card */}
              <div style={{
                background: subtleBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '14px',
                padding: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Building2 size={16} color="#10b981" />
                  <strong style={{ fontSize: '0.92rem', color: textPrimary }}>{invite.kostName}</strong>
                  {invite.salary > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: isLight ? '#047857' : '#34d399',
                      background: isLight ? '#d1fae5' : 'rgba(16, 185, 129, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      Gaji {formatCurrency(invite.salary)}/bln
                    </span>
                  )}
                </div>

                {invite.kostAddress && (
                  <div style={{ fontSize: '0.76rem', color: textSecondary }}>{invite.kostAddress}</div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <Briefcase size={13} color={textSecondary} />
                  {(invite.roles || []).map((r, idx) => (
                    <span key={idx} style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isLight ? '#e0f2fe' : 'rgba(59, 130, 246, 0.18)',
                      color: isLight ? '#0369a1' : '#93c5fd',
                      border: '1px solid rgba(59, 130, 246, 0.28)'
                    }}>
                      {r}
                    </span>
                  ))}
                </div>

                {Array.isArray(invite.assignedStoreNames) && invite.assignedStoreNames.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: textSecondary, fontWeight: 700 }}>Cabang Toko POS:</span>
                    {invite.assignedStoreNames.map((stName, idx) => (
                      <span key={idx} style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)',
                        color: isLight ? '#047857' : '#6ee7b7',
                        border: '1px solid rgba(16, 185, 129, 0.28)'
                      }}>
                        {stName}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.76rem',
                  color: textSecondary,
                  paddingTop: '4px',
                  borderTop: `1px dashed ${cardBorder}`
                }}>
                  {invite.channel === 'email' ? <Mail size={13} color="#ef4444" /> : <MessageCircle size={13} color="#10b981" />}
                  <span>
                    Diundang via <strong>{invite.channel === 'email' ? 'Gmail' : 'WhatsApp'}</strong>: {invite.target}
                  </span>
                </div>
              </div>

              {submitError && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.16)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: isLight ? '#b91c1c' : '#fca5a5',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textPrimary, marginBottom: '5px' }}>
                  Nama Lengkap Anda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${inputBorder}`,
                    background: inputBg,
                    color: textPrimary,
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: textPrimary, marginBottom: '5px' }}>
                    <Phone size={13} color="#10b981" />
                    No. WhatsApp {invite.channel === 'whatsapp' ? '*' : '(Opsional)'}
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${inputBorder}`,
                      background: inputBg,
                      color: textPrimary,
                      fontSize: '0.86rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: textPrimary, marginBottom: '5px' }}>
                    <Mail size={13} color="#ef4444" />
                    Alamat Gmail {invite.channel === 'email' ? '*' : '(Opsional)'}
                  </label>
                  <input
                    type="email"
                    placeholder="nama@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${inputBorder}`,
                      background: inputBg,
                      color: textPrimary,
                      fontSize: '0.86rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: textPrimary, marginBottom: '5px' }}>
                  <Lock size={13} color="#3b82f6" />
                  Buat Password Login
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter (kosongkan: kostku123)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${inputBorder}`,
                      background: inputBg,
                      color: textPrimary,
                      fontSize: '0.86rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label="Toggle password visibility"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: textSecondary,
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: submitting ? '#64748b' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                <UserCheck size={17} />
                <span>{submitting ? 'Mengaktifkan Akun...' : 'Terima Undangan & Gabung Karyawan'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
