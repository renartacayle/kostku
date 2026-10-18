import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  FileText,
  Lock,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Upload,
  Camera,
  Download,
  Printer,
  Sparkles,
  MapPin,
  Building,
  Check,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

// Helper: Decode Indonesian NIK structure
const parseNik = (nikStr, tenantName) => {
  const clean = (nikStr || '').replace(/\D/g, '');
  
  const provinces = {
    '11': 'Aceh', '12': 'Sumatera Utara', '13': 'Sumatera Barat', '14': 'Riau', '15': 'Jambi',
    '16': 'Sumatera Selatan', '17': 'Bengkulu', '18': 'Lampung', '19': 'Kep. Bangka Belitung', '21': 'Kepulauan Riau',
    '31': 'DKI Jakarta', '32': 'Jawa Barat', '33': 'Jawa Tengah', '34': 'DI Yogyakarta', '35': 'Jawa Timur',
    '36': 'Banten', '51': 'Bali', '52': 'Nusa Tenggara Barat', '53': 'Nusa Tenggara Timur',
    '61': 'Kalimantan Barat', '62': 'Kalimantan Tengah', '63': 'Kalimantan Selatan', '64': 'Kalimantan Timur',
    '71': 'Sulawesi Utara', '72': 'Sulawesi Tengah', '73': 'Sulawesi Selatan', '74': 'Sulawesi Tenggara',
    '81': 'Maluku', '82': 'Maluku Utara', '91': 'Papua', '92': 'Papua Barat'
  };

  const cities = {
    '3171': 'Jakarta Pusat', '3172': 'Jakarta Utara', '3173': 'Jakarta Barat', '3174': 'Jakarta Selatan', '3175': 'Jakarta Timur',
    '3273': 'Kota Bandung', '3204': 'Kab. Bandung', '3277': 'Kota Cimahi', '3271': 'Kota Bogor', '3275': 'Kota Bekasi',
    '3276': 'Kota Depok', '3374': 'Kota Semarang', '3471': 'Kota Yogyakarta', '3578': 'Kota Surabaya'
  };

  const provCode = clean.substring(0, 2);
  const cityCode = clean.substring(0, 4);
  const province = provinces[provCode] || 'Jawa Barat';
  const city = cities[cityCode] || (provinces[provCode] ? `Wilayah ${provinces[provCode]}` : 'Kota Bandung');

  let day = parseInt(clean.substring(6, 8), 10) || 15;
  let gender = 'LAKI-LAKI';
  if (day > 40) {
    day -= 40;
    gender = 'PEREMPUAN';
  } else if (tenantName && /annisa|putri|siti|ayu|nur|dewi|maya|tiara/i.test(tenantName)) {
    gender = 'PEREMPUAN';
  }

  const month = clean.substring(8, 10) || '09';
  const year = clean.substring(10, 12) || '01';
  const fullYear = parseInt(year, 10) > 30 ? `19${year}` : `20${year}`;
  const birthDate = `${String(day).padStart(2, '0')}-${month}-${fullYear}`;

  return {
    isValid: clean.length === 16,
    province,
    city,
    gender,
    birthDate,
    rawNik: clean.padEnd(16, '0')
  };
};

export default function TenantKycDetailModal({ isOpen, onClose, tenant, onUpdateStatus }) {
  if (!isOpen || !tenant) return null;

  const [activeTab, setActiveTab] = useState('ektp'); // 'ektp', 'photo', 'dukcapil'
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotate, setPhotoRotate] = useState(0);
  const [copiedNik, setCopiedNik] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const kyc = tenant.kyc_data || {
    nik: tenant.nik || '3273015509010003',
    ktp_image_url: tenant.ktp_image_url || null,
    verified_status: tenant.verified ? 'verified' : 'pending',
    rtrw_sync_status: true
  };

  const [currentKtpPhoto, setCurrentKtpPhoto] = useState(
    kyc.ktp_image_url || tenant.ktp_image_url || null
  );

  const parsed = parseNik(kyc.nik || tenant.nik || '3273015509010003', tenant.name);

  const handleCopyNik = () => {
    navigator.clipboard?.writeText(kyc.nik || parsed.rawNik);
    setCopiedNik(true);
    setTimeout(() => setCopiedNik(false), 2000);
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressImage(file, 1400, 1400, 0.82);
      setCurrentKtpPhoto(compressedDataUrl);

      // Persist in parent if available
      if (onUpdateStatus) {
        onUpdateStatus(tenant.id, kyc.verified_status || 'pending', {
          ...kyc,
          ktp_image_url: compressedDataUrl
        });
      }
    } catch (err) {
      alert(err.message || 'Gagal memproses foto KTP');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDecision = (status) => {
    if (status === 'rejected' && !showRejectBox) {
      setShowRejectBox(true);
      return;
    }

    if (onUpdateStatus) {
      onUpdateStatus(tenant.id, status, {
        ...kyc,
        ktp_image_url: currentKtpPhoto,
        rejectionReason: status === 'rejected' ? rejectionReason : null
      });
    }
    onClose();
  };

  const formattedNik = (kyc.nik || parsed.rawNik)
    .replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1  $2  $3  $4');

  const tenantAvatar = tenant.picture || 
    (parsed.gender === 'PEREMPUAN'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div className="animate-scale-up" style={{
        background: '#090e1a',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '94vh',
        overflowY: 'auto',
        padding: '1.5rem',
        boxShadow: '0 25px 65px -10px rgba(0, 0, 0, 0.95), 0 0 40px rgba(56, 189, 248, 0.15)',
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              padding: '10px',
              borderRadius: '14px',
              color: '#38bdf8',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.25)'
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                  Verifikasi Berkas KTP Penghuni
                </h3>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  DUKCAPIL SYNC
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Validasi Keaslian Identitas Kependudukan & Formulir Wajib Lapor RT/RW 1x24 Jam
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', cursor: 'pointer', borderRadius: '10px', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tenant Summary Strip */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.5) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>NAMA PENGHUNI</span>
            <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{tenant.name || 'Penghuni'}</strong>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>NOMOR KAMAR</span>
            <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>
              Kamar {tenant.kamar || tenant.room_number || '-'}
            </strong>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>16 DIGIT NIK</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <code style={{ color: '#34d399', fontWeight: 800, fontSize: '0.85rem' }}>
                {kyc.nik || parsed.rawNik}
              </code>
              <button
                type="button"
                onClick={handleCopyNik}
                title="Salin NIK"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copiedNik ? '#10b981' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                {copiedNik ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>STATUS VERIFIKASI</span>
            <span style={{
              display: 'inline-block',
              marginTop: '2px',
              padding: '3px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: kyc.verified_status === 'verified'
                ? 'rgba(16, 185, 129, 0.2)'
                : kyc.verified_status === 'rejected'
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(245, 158, 11, 0.2)',
              color: kyc.verified_status === 'verified'
                ? '#34d399'
                : kyc.verified_status === 'rejected'
                ? '#ef4444'
                : '#fbbf24',
              border: `1px solid ${
                kyc.verified_status === 'verified'
                  ? 'rgba(16, 185, 129, 0.4)'
                  : kyc.verified_status === 'rejected'
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(245, 158, 11, 0.4)'
              }`
            }}>
              {kyc.verified_status === 'verified' ? '✓ Terverifikasi' : kyc.verified_status === 'rejected' ? '✕ Ditolak' : '⏳ Menunggu Validasi'}
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '1rem',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('ektp')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeTab === 'ektp' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
              color: activeTab === 'ektp' ? 'white' : '#94a3b8',
              boxShadow: activeTab === 'ektp' ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>🪪 Kartu e-KTP Digital Resmi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeTab === 'photo' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
              color: activeTab === 'photo' ? 'white' : '#94a3b8',
              boxShadow: activeTab === 'photo' ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>📷 Foto Dokumen Fisik</span>
            {currentKtpPhoto && (
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399' }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dukcapil')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeTab === 'dukcapil' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
              color: activeTab === 'dukcapil' ? 'white' : '#94a3b8',
              boxShadow: activeTab === 'dukcapil' ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>🏛️ Bedah Data NIK (RT/RW)</span>
          </button>
        </div>

        {/* TAB 1: e-KTP Digital Card (Authentic Indonesian Identity Card) */}
        {activeTab === 'ektp' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 35%, #0f2b5c 70%, #0a192f 100%)',
              color: '#ffffff',
              padding: '1.25rem 1.5rem',
              fontFamily: "'Courier New', Courier, monospace, system-ui",
              minHeight: '330px',
              border: '2px solid rgba(56, 189, 248, 0.3)'
            }}>
              
              {/* Subtle Guilloche / Holographic Pattern Background */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 75% 25%, rgba(56, 189, 248, 0.18) 0%, transparent 50%), repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 2px, transparent 2px, transparent 8px)',
                pointerEvents: 'none'
              }} />

              {/* Diagonal Watermark for Anti-Penyalahgunaan */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                color: 'rgba(255, 255, 255, 0.12)',
                fontSize: '1.35rem',
                fontWeight: 900,
                letterSpacing: '4px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                borderTop: '2px dashed rgba(255, 255, 255, 0.15)',
                borderBottom: '2px dashed rgba(255, 255, 255, 0.15)',
                padding: '6px 20px',
                zIndex: 1
              }}>
                UNTUK VERIFIKASI KOSTKU • ANTI PENYALAHGUNAAN
              </div>

              {/* Card Header */}
              <div style={{ textAlign: 'center', marginBottom: '8px', position: 'relative', zIndex: 2 }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, letterSpacing: '2.5px', color: '#ffffff' }}>
                  REPUBLIK INDONESIA
                </h4>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '1.5px', color: '#93c5fd', marginTop: '1px' }}>
                  PROVINSI {parsed.province.toUpperCase()}
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '1px', color: '#bae6fd' }}>
                  {parsed.city.toUpperCase()}
                </div>
              </div>

              {/* NIK Display */}
              <div style={{ marginBottom: '10px', position: 'relative', zIndex: 2 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fef08a' }}>NIK</span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>:</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '1.5px', color: '#ffffff', fontFamily: 'monospace' }}>
                    {formattedNik}
                  </span>
                </div>
              </div>

              {/* Main Body: Biodata (Left) & Photo/Chip (Right) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '14px', position: 'relative', zIndex: 2 }}>
                
                {/* Biodata Rows */}
                <div style={{ fontSize: '0.72rem', lineHeight: 1.6, color: '#e2e8f0', textTransform: 'uppercase' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span>Nama</span><span>:</span><strong style={{ color: '#ffffff' }}>{tenant.name || 'ANNISA RAHMAWATI'}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span>Tempat/Tgl Lahir</span><span>:</span><span>{parsed.city.replace('Kota ', '')}, {parsed.birthDate}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span>Jenis Kelamin</span><span>:</span>
                    <span>{parsed.gender} &nbsp;&nbsp; Gol. Darah : O</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span>Alamat</span><span>:</span><span>JL. GANESHA NO. 10</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span style={{ paddingLeft: '14px' }}>• RT / RW</span><span>:</span><span>003 / 005</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span style={{ paddingLeft: '14px' }}>• Kel / Desa</span><span>:</span><span>LEBAKGEDE</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span style={{ paddingLeft: '14px' }}>• Kecamatan</span><span>:</span><span>COBLONG</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span>Agama</span><span>:</span><span>ISLAM</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span>Status Perkawinan</span><span>:</span><span>BELUM KAWIN</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span>Pekerjaan</span><span>:</span><span>MAHASISWA / KARYAWAN SWASTA</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', marginBottom: '2px' }}>
                    <span>Kewarganegaraan</span><span>:</span><span>WNI</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr' }}>
                    <span>Berlaku Hingga</span><span>:</span><strong style={{ color: '#86efac' }}>SEUMUR HIDUP</strong>
                  </div>
                </div>

                {/* Right Column: Smart Chip & Official Portrait Photo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  
                  {/* Smart Chip Graphic */}
                  <div style={{
                    width: '38px',
                    height: '28px',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                    borderRadius: '4px',
                    border: '1px solid #78350f',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }} title="e-KTP Contactless Smart Chip (ISO/IEC 14443)">
                    <div style={{ position: 'absolute', inset: '4px', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '2px' }} />
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.25)' }} />
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.25)' }} />
                  </div>

                  {/* Photo Frame (Official Blue/Red Background as per standard) */}
                  <div style={{
                    width: '105px',
                    height: '135px',
                    background: parsed.gender === 'PEREMPUAN' ? '#1d4ed8' : '#b91c1c', // Official blue for even birth year, red for odd
                    borderRadius: '6px',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img 
                      src={tenantAvatar} 
                      alt="Foto Pas KTP" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0,0,0,0.6)',
                      fontSize: '0.55rem',
                      textAlign: 'center',
                      padding: '2px 0',
                      color: '#ffffff'
                    }}>
                      PAS FOTO RESMI
                    </div>
                  </div>

                  {/* City & Issue Date + Hologram Seal */}
                  <div style={{ textAlign: 'center', fontSize: '0.62rem', color: '#cbd5e1' }}>
                    <div>{parsed.city.toUpperCase()}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.58rem' }}>16-09-2018</div>
                    {/* Digital Signature representation */}
                    <div style={{
                      fontFamily: "'Brush Script MT', cursive, sans-serif",
                      fontSize: '1.1rem',
                      color: 'rgba(255,255,255,0.7)',
                      letterSpacing: '1px',
                      transform: 'rotate(-5deg)',
                      marginTop: '2px'
                    }}>
                      {tenant.name ? tenant.name.split(' ')[0] : 'Annisa'}
                    </div>
                  </div>

                </div>

              </div>

            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              padding: '0 4px',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}>
              <span>🔒 Format: ISO/IEC 7810 ID-1 Kependudukan Resmi</span>
              <span style={{ color: '#38bdf8' }}>✓ Checksum & Enkripsi NIK Sah</span>
            </div>
          </div>
        )}

        {/* TAB 2: Physical Photo Document (Upload / Replace / Zoom) */}
        {activeTab === 'photo' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              background: '#050a14',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              overflow: 'hidden',
              position: 'relative',
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}>
              
              {currentKtpPhoto ? (
                <div style={{ position: 'relative', width: '100%', textAlign: 'center', overflow: 'hidden' }}>
                  <img
                    src={currentKtpPhoto}
                    alt="Foto Fisik KTP"
                    style={{
                      maxHeight: '280px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      transform: `scale(${photoZoom}) rotate(${photoRotate}deg)`,
                      transition: 'transform 0.25s ease',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)'
                    }}
                  />

                  {/* Photo Manipulation Toolbar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    width: 'fit-content',
                    margin: '12px auto 0'
                  }}>
                    <button
                      type="button"
                      onClick={() => setPhotoZoom(prev => Math.min(2.5, prev + 0.2))}
                      className="btn-icon"
                      title="Perbesar"
                      style={{ color: '#94a3b8' }}
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoZoom(prev => Math.max(0.6, prev - 0.2))}
                      className="btn-icon"
                      title="Perkecil"
                      style={{ color: '#94a3b8' }}
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoRotate(prev => (prev + 90) % 360)}
                      className="btn-icon"
                      title="Putar 90 Derajat"
                      style={{ color: '#94a3b8' }}
                    >
                      <RotateCw size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhotoZoom(1); setPhotoRotate(0); }}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.74rem', cursor: 'pointer' }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(56, 189, 248, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: '#38bdf8'
                  }}>
                    <Camera size={30} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', color: '#f8fafc', fontSize: '1rem' }}>
                    Belum Ada Foto Fisik KTP Terlampir
                  </h4>
                  <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '0.82rem', maxWidth: '400px' }}>
                    Penghuni belum mengunggah foto kartu fisik KTP. Anda dapat mengunggah hasil jepretan kamera atau foto yang dikirim anak kost sekarang.
                  </p>
                </div>
              )}

              {/* Upload or Replace Button */}
              <div style={{ marginTop: '12px' }}>
                <label 
                  htmlFor="ktp-upload-input" 
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: 'pointer', gap: '6px', fontSize: '0.8rem' }}
                >
                  <Upload size={14} />
                  {isUploading ? 'Mengompresi Gambar...' : currentKtpPhoto ? 'Ganti Foto Fisik KTP' : 'Unggah Foto Fisik KTP Sekarang'}
                </label>
                <input
                  id="ktp-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: Dukcapil Intelligence & RT/RW Report Breakdown */}
        {activeTab === 'dukcapil' && (
          <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Building size={18} color="#38bdf8" />
                <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>
                  Struktur Kode Wilayah NIK Nasional
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>PROVINSI (DIGIT 1-2)</span>
                  <div style={{ fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                    {parsed.province} (Kode: {parsed.rawNik.substring(0, 2)})
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>KABUPATEN / KOTA (DIGIT 3-4)</span>
                  <div style={{ fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                    {parsed.city} (Kode: {parsed.rawNik.substring(2, 4)})
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>TANGGAL LAHIR & GENDER (DIGIT 7-12)</span>
                  <div style={{ fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
                    {parsed.birthDate} • {parsed.gender}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>KEPATUHAN LAPOR RT/RW</span>
                  <div style={{ fontWeight: 700, color: '#fde047', marginTop: '2px' }}>
                    Terdaftar di Form Wajib Lapor 1x24 Jam
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px dashed rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: '#a7f3d0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} color="#10b981" />
              <span>
                <strong>Sesuai UU No. 27 Tahun 2022 (UU PDP):</strong> Data NIK tersimpan dengan enkripsi end-to-end dan hanya dipakai untuk kepentingan administrasi legalitas hunian sewa serta pelaporan Ketua RT/RW setempat.
              </span>
            </div>
          </div>
        )}

        {/* Rejection Note Input Box if triggered */}
        {showRejectBox && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            padding: '12px',
            marginBottom: '1rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Pilih / Ketik Alasan Penolakan KTP:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {['Foto buram / tidak terbaca', 'NIK tidak cocok dengan nama', 'KTP terpotong / rusak'].map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReason(reason)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: rejectionReason === reason ? '#ef4444' : 'rgba(255,255,255,0.06)',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.74rem',
                    cursor: 'pointer'
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Ketik catatan penolakan untuk penghuni..."
              className="input-field"
              style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px' }}
            />
          </div>
        )}

        {/* Footer Decision Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleDecision('rejected')}
            className="btn btn-secondary"
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '11px',
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.08)',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <XCircle size={16} /> Tolak Berkas KTP
          </button>

          <button
            type="button"
            onClick={() => handleDecision('verified')}
            className="btn btn-primary"
            style={{
              flex: 1.5,
              minWidth: '200px',
              padding: '11px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderColor: '#10b981',
              gap: '8px',
              fontWeight: 800,
              boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)'
            }}
          >
            <CheckCircle size={17} /> Setujui & Verifikasi KTP Resmi
          </button>
        </div>

      </div>
    </div>
  );
}
