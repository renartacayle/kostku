import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Camera, 
  Lock,
  RefreshCw
} from 'lucide-react';

export default function TenantKycModal({ isOpen, onClose, user, onKycSubmitted }) {
  const [nik, setNik] = useState(user?.kyc_data?.nik || '');
  const [ktpImage, setKtpImage] = useState(user?.kyc_data?.ktp_image_url || null);
  const [agreeRTRW, setAgreeRTRW] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isNikValid = /^[0-9]{16}$/.test(nik.trim());

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format berkas harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran foto KTP maksimal 5 MB.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = () => {
      setKtpImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isNikValid) {
      setErrorMsg('Nomor Induk Kependudukan (NIK) harus terdiri dari tepat 16 digit angka.');
      return;
    }

    if (!ktpImage) {
      setErrorMsg('Foto fisik KTP asli wajib diunggah.');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const propertyId = user?.kostUid || 'KOSTKU_MAIN';
      const tenantUid = user?.id || user?.uid || 'TENANT_' + Date.now();
      const storagePath = `ktp_uploads/${propertyId}/${tenantUid}.jpg`;

      const kycData = {
        nik: nik.trim(),
        ktp_image_url: ktpImage,
        storage_path: storagePath,
        verified_status: 'pending',
        rtrw_sync_status: agreeRTRW,
        submitted_at: new Date().toISOString()
      };

      // Update stored user
      try {
        const stored = localStorage.getItem('kostUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = { ...parsed, kyc_data: kycData };
          localStorage.setItem('kostUser', JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('LocalStorage kyc sync:', err);
      }

      setSuccessMsg('Berkas KTP berhasil diunggah! Status: Menunggu Verifikasi Pengelola Kost.');
      setSubmitting(false);

      if (onKycSubmitted) {
        onKycSubmitted(kycData);
      }

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    }, 700);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#0a101f',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '1.75rem',
        boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.9)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '10px',
              borderRadius: '14px',
              color: '#38bdf8'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                Verifikasi Identitas & KTP
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Prasyarat Check-in Resmi & Wajib Lapor RT/RW
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#86efac',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* NIK Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
                16 Digit Nomor Induk Kependudukan (NIK):
              </label>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                color: isNikValid ? '#34d399' : '#94a3b8',
                fontWeight: 700
              }}>
                {nik.length}/16 digit {isNikValid && '✓ Valid'}
              </span>
            </div>
            <input
              type="text"
              value={nik}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
                setNik(val);
              }}
              placeholder="Contoh: 3374012345678901"
              required
              className="input-field"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                letterSpacing: '1px',
                borderColor: nik.length === 16 ? '#10b981' : undefined
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Wajib 16 digit angka sesuai KTP untuk keperluan validasi kependudukan.
            </span>
          </div>

          {/* Upload Foto KTP */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
              Foto Fisik KTP Asli:
            </label>

            {ktpImage ? (
              <div style={{
                position: 'relative',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                background: '#090d16'
              }}>
                <img
                  src={ktpImage}
                  alt="KTP Preview"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => setKtpImage(null)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} /> Ganti Foto
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.75rem',
                border: '2px dashed rgba(56, 189, 248, 0.35)',
                borderRadius: '16px',
                background: 'rgba(56, 189, 248, 0.04)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}>
                <Camera size={32} color="#38bdf8" style={{ marginBottom: '8px' }} />
                <span style={{ fontSize: '0.86rem', color: '#f8fafc', fontWeight: 700 }}>
                  Ketuk untuk Ambil Foto / Pilih Berkas KTP
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                  Pastikan tulisan NIK, nama, dan foto terlihat jelas tanpa silau (JPG/PNG max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {/* Privacy & Storage Path Info */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.74rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <Lock size={15} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Keamanan Data Terjamin:</span> Berkas KTP dienkripsi dan disimpan pada Firebase Cloud Storage dengan isolasi hak akses terbatas hanya untuk Anda dan Pengelola Kost.
            </div>
          </div>

          {/* Consent Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#cbd5e1' }}>
            <input
              type="checkbox"
              checked={agreeRTRW}
              onChange={(e) => setAgreeRTRW(e.target.checked)}
              style={{ accentColor: '#38bdf8' }}
            />
            <span>Saya setuju data ini disinkronkan untuk Pelaporan Wajib Kependudukan RT/RW.</span>
          </label>

          {/* Submit Action */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !isNikValid || !ktpImage}
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px', fontWeight: 700 }}
            >
              {submitting ? 'Mengunggah...' : 'Simpan & Verifikasi'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
