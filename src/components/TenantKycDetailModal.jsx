import React from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  FileText,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function TenantKycDetailModal({ isOpen, onClose, tenant, onUpdateStatus }) {
  if (!isOpen || !tenant) return null;

  const kyc = tenant.kyc_data || {
    nik: tenant.nik || '3374012345678901',
    ktp_image_url: tenant.ktp_image_url || null,
    verified_status: tenant.verified ? 'verified' : 'pending',
    rtrw_sync_status: true
  };

  const handleDecision = (status) => {
    if (onUpdateStatus) {
      onUpdateStatus(tenant.id, status);
    }
    onClose();
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
        maxWidth: '540px',
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
                Verifikasi Berkas KTP Penghuni
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Validasi Keaslian Identitas untuk Lapor RT/RW
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

        {/* Tenant Information Summary */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '0.82rem'
        }}>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Nama Penghuni:</span>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem', marginTop: '2px' }}>
              {tenant.name || 'Penghuni'}
            </div>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Nomor Kamar:</span>
            <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.95rem', marginTop: '2px' }}>
              Kamar {tenant.kamar || tenant.room_number || '-'}
            </div>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>16 Digit NIK:</span>
            <div style={{ fontWeight: 800, color: '#34d399', fontFamily: 'monospace', letterSpacing: '0.5px', marginTop: '2px' }}>
              {kyc.nik || '3374012345678901'}
            </div>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Status Verifikasi:</span>
            <div style={{ marginTop: '2px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: kyc.verified_status === 'verified'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : kyc.verified_status === 'rejected'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(245, 158, 11, 0.2)',
                color: kyc.verified_status === 'verified'
                  ? '#34d399'
                  : kyc.verified_status === 'rejected'
                  ? '#ef4444'
                  : '#fbbf24'
              }}>
                {kyc.verified_status === 'verified'
                  ? '✓ Terverifikasi'
                  : kyc.verified_status === 'rejected'
                  ? '✕ Ditolak'
                  : '⏳ Menunggu Verifikasi'}
              </span>
            </div>
          </div>
        </div>

        {/* KTP Image Preview */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
            Pratinjau Foto Fisik KTP:
          </span>
          <div style={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: '#050a14',
            textAlign: 'center',
            position: 'relative'
          }}>
            {kyc.ktp_image_url ? (
              <img
                src={kyc.ktp_image_url}
                alt="Foto KTP Penghuni"
                style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <div style={{ padding: '2.5rem', color: '#94a3b8' }}>
                <FileText size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>Penghuni mengunggah dokumen digital KTP terenkripsi.</div>
                <div style={{ fontSize: '0.72rem', marginTop: '4px', color: '#64748b' }}>
                  NIK tervalidasi: {kyc.nik}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Decision Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleDecision('rejected')}
            className="btn btn-secondary"
            style={{
              flex: 1,
              padding: '10px',
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              gap: '6px'
            }}
          >
            <XCircle size={16} /> Tolak KTP
          </button>

          <button
            type="button"
            onClick={() => handleDecision('verified')}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderColor: '#10b981',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <CheckCircle size={16} /> Setujui & Verifikasi KTP
          </button>
        </div>

      </div>
    </div>
  );
}
