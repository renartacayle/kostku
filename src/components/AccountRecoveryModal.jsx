import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Key, 
  User, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { apiRecoverAccount } from '../services/api';

const AccountRecoveryModal = ({ isOpen, onClose, onSuccessLogin }) => {
  const [step, setStep] = useState(1); // 1 = Check NIK & Name, 2 = Set New Password
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [matchedUser, setMatchedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleNikChange = (e) => {
    // Only allow numbers and limit to 16 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    setNik(val);
    if (error) setError('');
  };

  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    if (nik.length !== 16) {
      setError('NIK wajib 16 digit angka sesuai KTP Anda.');
      return;
    }
    if (!name.trim()) {
      setError('Nama lengkap sesuai KTP wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiRecoverAccount({
        nik: nik.trim(),
        name: name.trim()
      });

      if (res.success && res.matchedUser) {
        setMatchedUser(res.matchedUser);
        setStep(2);
      } else {
        setError(res.error || 'Verifikasi NIK gagal.');
      }
    } catch (err) {
      setError(err.message || 'Gagal memverifikasi NIK. Periksa kembali NIK dan Nama Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiRecoverAccount({
        nik: nik.trim(),
        name: name.trim(),
        newPassword
      });

      if (res.success) {
        setSuccessMessage('Password berhasil diperbarui! Sedang menyiapkan akun Anda...');
        setTimeout(() => {
          if (onSuccessLogin && res.user) {
            onSuccessLogin(res.user, res.kostName);
          }
          handleClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengatur ulang password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setNik('');
    setName('');
    setNewPassword('');
    setConfirmPassword('');
    setMatchedUser(null);
    setError('');
    setSuccessMessage('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="card glass-panel animate-fade-in" style={{
        maxWidth: '480px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        padding: '2rem 1.75rem'
      }}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: 800 }}>
            {step === 1 ? 'Pulihkan Akun dengan NIK' : 'Buat Password Baru'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {step === 1 
              ? 'Verifikasi kepemilikan akun Anda secara aman menggunakan data NIK & Nama KTP resmi.'
              : 'Identitas KTP Anda berhasil dicocokkan! Masukkan password baru untuk akun Anda.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            padding: '10px 14px',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Input NIK & Nama Sesuai KTP */}
        {step === 1 && (
          <form onSubmit={handleVerifyIdentity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
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
                  placeholder="Contoh: 3301012304990001"
                  className="input-field"
                  style={{
                    paddingLeft: '38px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    fontSize: '0.95rem'
                  }}
                  required
                />
                <CreditCard size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                Nama Lengkap Sesuai KTP
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Masukkan nama persis seperti di KTP"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  required
                />
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '8px',
              lineHeight: 1.4
            }}>
              <Sparkles size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Keamanan 1 KTP = 1 Akun:</strong> Sistem hanya memulihkan akun yang terdaftar dengan NIK dan Nama yang cocok persis.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || nik.length !== 16 || !name.trim()}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.92rem',
                marginTop: '0.25rem',
                gap: '8px',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Memeriksa Data KTP...
                </>
              ) : (
                <>
                  Verifikasi Identitas NIK <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Matched User Card & Set New Password */}
        {step === 2 && matchedUser && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Matched Account Badge */}
            <div style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '14px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4ade80'
              }}>
                <CheckCircle2 size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>
                    {matchedUser.name}
                  </h4>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                    {matchedUser.role}
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Email Terdaftar: <strong>{matchedUser.email}</strong>
                </p>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                Password Baru
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  required
                />
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                Konfirmasi Password Baru
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  required
                />
                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.92rem',
                marginTop: '0.25rem',
                gap: '8px',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Menyimpan Password...
                </>
              ) : (
                <>
                  Simpan Password & Masuk Otomatis 🚀
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              ← Kembali ke input NIK
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountRecoveryModal;
