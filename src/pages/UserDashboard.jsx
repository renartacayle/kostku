import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Send, 
  Wrench, 
  DollarSign, 
  Bed, 
  Receipt, 
  FileText, 
  CreditCard, 
  Sparkles, 
  Key, 
  PenTool, 
  Package, 
  Zap, 
  ShieldCheck,
  Search,
  Home,
  RefreshCw,
  Building2,
  ArrowRight,
  Star,
  MessageCircle,
  Camera,
  X,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { compressImage } from '../utils/imageCompressor';
import { 
  apiGetComplaints, 
  apiCreateComplaint, 
  apiGetInvoices, 
  apiGetContract,
  apiGetUserProfile,
  apiGetMerchants
} from '../services/api';

import PaymentGatewayModal from '../components/PaymentGatewayModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import SignaturePadModal from '../components/SignaturePadModal';
import SmartLockAndTokenModal from '../components/SmartLockAndTokenModal';
import PackageLockerCard from '../components/PackageLockerCard';
import InAppChatModal from '../components/InAppChatModal';
import PartnerOrderModal from '../components/PartnerOrderModal';
import TenantKycModal from '../components/TenantKycModal';

const UserDashboard = ({ user }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [activeApplication, setActiveApplication] = useState(null);
  const [kostName, setKostName] = useState('');
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [newComplaint, setNewComplaint] = useState('');
  const [complaintPhoto, setComplaintPhoto] = useState(null);
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const [selectedComplaintPhoto, setSelectedComplaintPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTransferInfo, setShowTransferInfo] = useState(false);

  // Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSmartLockModal, setShowSmartLockModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showOwnerChat, setShowOwnerChat] = useState(false);
  const [merchants, setMerchants] = useState([]);
  const [partnerCategory, setPartnerCategory] = useState('all');
  const [partnerSort, setPartnerSort] = useState('cheapest'); // 'cheapest', 'distance'
  const [partnerBrand, setPartnerBrand] = useState('all');
  const [partnerSearch, setPartnerSearch] = useState('');

  const fetchData = async () => {
    if (!user?.id) return;
    setSyncingProfile(true);
    try {
      let activeKostUid = currentUser?.kostUid || user?.kostUid;
      const activeUserId = user.id;

      // 1. Sync latest user profile and pending application from server
      try {
        const profileRes = await apiGetUserProfile(user.id);
        if (profileRes?.user) {
          const merged = { ...user, ...currentUser, ...profileRes.user };
          setCurrentUser(merged);
          activeKostUid = merged.kostUid;
          localStorage.setItem('kostUser', JSON.stringify(merged));
        }
        if (profileRes?.activeApplication) {
          setActiveApplication(profileRes.activeApplication);
        }
        if (profileRes?.kostName) {
          setKostName(profileRes.kostName);
        }
      } catch (err) {
        console.warn('apiGetUserProfile sync failed:', err);
      }

      // 2. Fetch tenant dashboard data if assigned to a kost
      if (activeKostUid) {
        const [comps, invs, ctc, merchList] = await Promise.all([
          apiGetComplaints(activeKostUid, activeUserId).catch(() => []),
          apiGetInvoices(activeKostUid, activeUserId).catch(() => []),
          apiGetContract(activeUserId).catch(() => ({ contract: null })),
          apiGetMerchants(activeKostUid).catch(() => [])
        ]);
        setComplaints(Array.isArray(comps) ? comps : []);
        setInvoices(Array.isArray(invs) ? invs : []);
        setContract(ctc?.contract || null);
        if (Array.isArray(merchList) && merchList.length > 0) {
          setMerchants(merchList);
        }
      } else {
        const merchList = await apiGetMerchants('KOST-JAKSEL-01').catch(() => []);
        if (Array.isArray(merchList) && merchList.length > 0) {
          setMerchants(merchList);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tenant data', err);
    } finally {
      setSyncingProfile(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleComplaintPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCompressingPhoto(true);
      const compressed = await compressImage(file, 1200, 1200, 0.8);
      setComplaintPhoto(compressed);
    } catch (err) {
      alert('Gagal memproses foto: ' + (err.message || ''));
    } finally {
      setCompressingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComplaint.trim()) return;

    setLoading(true);
    try {
      await apiCreateComplaint({
        kostUid: currentUser.kostUid,
        userId: currentUser.id,
        userName: currentUser.name,
        kamar: currentUser.kamar,
        text: newComplaint,
        photo: complaintPhoto
      });
      setNewComplaint('');
      setComplaintPhoto(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal mengirim komplain');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(number || 0);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="badge badge-warning"><Clock size={12}/> Menunggu</span>;
      case 'diproses': return <span className="badge badge-primary"><Wrench size={12}/> Diproses</span>;
      case 'selesai': return <span className="badge badge-success"><CheckCircle size={12}/> Selesai</span>;
      default: return null;
    }
  };

  // Latest invoice
  const latestInvoice = invoices.length > 0 ? invoices[0] : null;
  const isInvoicePaid = latestInvoice?.status === 'lunas';

  const isAssigned = Boolean(currentUser?.kostUid && currentUser?.kamar);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* State A: Belum Punya Kamar & Ada Pengajuan Menunggu Persetujuan */}
      {!isAssigned && activeApplication && activeApplication.status === 'pending' && (
        <div className="card glass-panel" style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: '#eab308',
                color: '#000',
                padding: '0.85rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)'
              }}>
                <Clock size={28} />
              </div>
              <div>
                <span className="badge badge-warning" style={{ marginBottom: '0.35rem' }}>Status: Menunggu Persetujuan Pemilik</span>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Pengajuan Sewa Kamar Sedang Ditinjau</h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Halo <strong>{currentUser.name}</strong>, Anda telah memilih kamar dari fitur Cari Kost. Menunggu pemilik kost menyetujui pengajuan Anda.
                </p>
              </div>
            </div>

            <button 
              onClick={fetchData} 
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={syncingProfile ? 'animate-spin' : ''} /> Cek Status Terbaru
            </button>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kost Tujuan</span>
              <h4 style={{ margin: '0.2rem 0 0', color: 'var(--text-main)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} color="#38bdf8" /> {activeApplication.kostName || kostName || 'Kost Pilihan'}
              </h4>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kamar Pilihan</span>
              <h4 style={{ margin: '0.2rem 0 0', color: '#60a5fa', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bed size={16} color="#60a5fa" /> Kamar {activeApplication.kamar}
              </h4>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Durasi Sewa</span>
              <h4 style={{ margin: '0.2rem 0 0', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                {activeApplication.duration || 1} Bulan
              </h4>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tanggal Pengajuan</span>
              <h4 style={{ margin: '0.2rem 0 0', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                {new Date(activeApplication.date || Date.now()).toLocaleDateString('id-ID')}
              </h4>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(234, 179, 8, 0.08)', 
            border: '1px dashed rgba(234, 179, 8, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} color="#eab308" />
            <span>
              <strong>Otomatisasi:</strong> Saat pemilik kost menekan tombol "Terima", kamar akan langsung di-assign ke akun Anda, dan Anda dapat langsung membayar tagihan via QRIS/Transfer serta menandatangani kontrak secara digital.
            </span>
          </div>
        </div>
      )}

      {/* State B: Belum Punya Kamar & Belum Mengajukan (Atau Ditolak) */}
      {!isAssigned && (!activeApplication || activeApplication.status === 'rejected') && (
        <div className="card glass-panel" style={{
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa'
          }}>
            <Home size={36} />
          </div>

          <div style={{ maxWidth: '540px' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: 800 }}>Belum Memilih Kamar Kost</h2>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Halo <strong>{currentUser.name}</strong>! Anda belum terdaftar di kamar kost manapun. Silakan cari kost impian Anda di marketplace Cari Kost, pilih kamar yang tersedia, lalu ajukan sewa. Setelah pemilik menyetujui, akun Anda otomatis terhubung ke kamar kost tersebut.
            </p>
          </div>

          {activeApplication?.status === 'rejected' && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.25rem',
              color: '#f87171',
              fontSize: '0.85rem'
            }}>
              Pengajuan sewa kamar sebelumnya tidak dapat diterima atau telah ditolak oleh pemilik kost. Anda dapat memilih kost atau kamar lainnya.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link 
              to="/search" 
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <Search size={18} /> Cari & Pilih Kost Sekarang
            </Link>
            <button 
              onClick={fetchData} 
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} className={syncingProfile ? 'animate-spin' : ''} /> Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* State C: Penghuni Aktif (Sudah Di-Assign Kost & Kamar) */}
      {isAssigned && (
        <>
          {/* Welcome Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Halo, {currentUser.name} 👋</h1>
                <span className="badge badge-primary">Penghuni Aktif</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {kostName && <><strong style={{ color: '#93c5fd' }}>{kostName}</strong> • </>}Kamar: <strong style={{ color: 'white' }}>{currentUser.kamar}</strong> • Cuci Sprei: <strong style={{ color: 'var(--accent-success)' }}>{currentUser.bedsheets || 0}x</strong> • Poin: <strong style={{ color: '#fbbf24' }}>{currentUser?.loyalty_points || 250} Poin</strong>
              </p>
            </div>

            {/* Quick Service Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowSmartLockModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 12px', gap: '6px' }}
              >
                <Zap size={14} color="#fbbf24" /> Token Listrik PLN
              </button>

              <button
                onClick={() => setShowSignatureModal(true)}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 12px',
                  gap: '6px',
                  borderColor: contract?.signedAt ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'
                }}
              >
                <PenTool size={14} color={contract?.signedAt ? '#4ade80' : '#fbbf24'} />
                {contract?.signedAt ? '✓ Kontrak Tertandatangani' : '✍️ TTD Kontrak'}
              </button>

              {currentUser?.kostUid && (
                <Link
                  to={`/kost/${currentUser.kostUid}`}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 12px',
                    gap: '6px',
                    textDecoration: 'none',
                    borderColor: 'rgba(250, 204, 21, 0.4)'
                  }}
                  title="Beri rating dan ulasan untuk kost Anda"
                >
                  <Star size={14} color="#facc15" fill="#facc15" />
                  <span>Beri Rating Kost</span>
                </Link>
              )}

              <button
                onClick={() => setShowOwnerChat(true)}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 12px',
                  gap: '6px',
                  borderColor: 'rgba(59, 130, 246, 0.45)',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#60a5fa'
                }}
                title="Chat langsung dengan pemilik kost tanpa keluar aplikasi"
              >
                <MessageCircle size={14} />
                <span>💬 Chat Pemilik</span>
              </button>
            </div>
          </div>

          {/* KYC KTP & Wajib Lapor RT/RW Banner */}
          {currentUser?.kyc_data?.verified_status === 'verified' ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '16px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="#34d399" />
                <div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                    ✓ Identitas Terverifikasi Resmi RT/RW
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>
                    NIK: {currentUser?.kyc_data?.nik ? `${currentUser.kyc_data.nik.slice(0, 6)}******${currentUser.kyc_data.nik.slice(-4)}` : '337401******1234'} • Sinkronisasi Data Kependudukan Aktif
                  </span>
                </div>
              </div>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700, fontSize: '0.74rem' }}>
                Check-in Sah Hukum
              </span>
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '16px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '10px', color: '#fbbf24' }}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>
                    {currentUser?.kyc_data?.verified_status === 'pending'
                      ? '⏳ Verifikasi KTP Sedang Ditinjau Pengelola Kost'
                      : '⚠️ Wajib Lapor Kependudukan RT/RW: Lengkapi KTP & NIK 16 Digit'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '2px' }}>
                    {currentUser?.kyc_data?.verified_status === 'pending'
                      ? `NIK: ${currentUser.kyc_data.nik} • Pengelola sedang memeriksa keaslian foto KTP Anda.`
                      : 'Wajib diisi oleh seluruh penghuni saat check-in agar tercatat resmi di sistem kependudukan lingkungan kost.'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowKycModal(true)}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', fontWeight: 700, padding: '8px 14px' }}
              >
                <ShieldCheck size={14} />
                <span>{currentUser?.kyc_data?.verified_status === 'pending' ? 'Perbarui KTP' : 'Unggah KTP & NIK Sekarang'}</span>
              </button>
            </div>
          )}
          {/* Approved Application Alert Banner if applicable */}
          {activeApplication?.status === 'approved' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <CheckCircle size={22} color="#4ade80" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#4ade80' }}>
                  Pengajuan Sewa Kamar Telah Disetujui!
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  Selamat, kamar <strong>{currentUser.kamar}</strong> di <strong>{kostName || 'KostKu'}</strong> telah berhasil dialokasikan untuk Anda. Tagihan sewa pertama sudah tersedia di bawah ini.
                </p>
              </div>
            </div>
          )}

          {/* Main Grid: Tagihan (Left) & Form Komplain (Right) */}
          <div className="grid-responsive-equal">
            
            {/* Tagihan Card */}
            <div className="card glass-panel" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderLeft: `4px solid ${isInvoicePaid ? 'var(--accent-success)' : 'var(--accent-warning)'}`
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Tagihan Sewa Kamar</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {latestInvoice ? `Tanggal: ${new Date(latestInvoice.date).toLocaleDateString('id-ID')}` : 'Belum ada tagihan'}
                    </span>
                  </div>
                  <span className={`badge ${isInvoicePaid ? 'badge-success' : 'badge-warning'}`}>
                    {isInvoicePaid ? 'LUNAS' : 'BELUM LUNAS'}
                  </span>
                </div>

                {latestInvoice ? (
                  <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Sewa Kamar ({latestInvoice.kamar})</span>
                      <span>{formatRupiah(latestInvoice.basePrice)}</span>
                    </div>
                    {Number(latestInvoice.deposit) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Deposit Kamar</span>
                        <span>{formatRupiah(latestInvoice.deposit)}</span>
                      </div>
                    )}
                    {Number(latestInvoice.waterCost) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Biaya Air</span>
                        <span>{formatRupiah(latestInvoice.waterCost)}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-color)',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      color: isInvoicePaid ? 'var(--accent-success)' : 'white'
                    }}>
                      <span>Total Tagihan</span>
                      <span>{formatRupiah(latestInvoice.total)}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '1rem 0' }}>
                    Tidak ada tagihan tertunda untuk kamar Anda.
                  </p>
                )}
              </div>

              <div>
                {!isInvoicePaid && latestInvoice ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Instant Payment Gateway Button */}
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="btn btn-primary" 
                      style={{
                        width: '100%',
                        gap: '8px',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                        fontWeight: 800,
                        boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                      }}
                    >
                      <CreditCard size={16} /> Bayar Sekarang (QRIS & Virtual Account)
                    </button>

                    <button 
                      onClick={() => setShowTransferInfo(!showTransferInfo)}
                      className="btn btn-secondary" 
                      style={{ width: '100%', gap: '8px', justifyContent: 'center', fontSize: '0.8rem' }}
                    >
                      {showTransferInfo ? 'Sembunyikan Info Rekening' : 'Info Rekening Manual'}
                    </button>

                    {showTransferInfo && (
                      <div style={{
                        padding: '0.85rem',
                        background: 'rgba(15, 23, 42, 0.8)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.82rem'
                      }}>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#93c5fd' }}>Transfer ke Rekening Pemilik:</p>
                        <p style={{ margin: '0 0 2px 0' }}>• BCA: <strong>1234-5678-90</strong> (A.N Pemilik)</p>
                        <p style={{ margin: 0 }}>• Mandiri: <strong>987-654-321</strong></p>
                      </div>
                    )}
                  </div>
                ) : latestInvoice ? (
                  /* Receipt Button for paid invoice */
                  <button
                    onClick={() => {
                      setSelectedReceiptId(latestInvoice.id);
                      setShowReceiptModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      gap: '8px',
                      justifyContent: 'center',
                      background: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'rgba(34, 197, 94, 0.3)',
                      color: '#4ade80',
                      fontWeight: 700
                    }}
                  >
                    <Receipt size={16} /> Unduh / Lihat Kuitansi Resmi
                  </button>
                ) : null}
              </div>
            </div>

            {/* Buat Komplain Card */}
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Punya Keluhan atau Kerusakan?</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Laporkan masalah fasilitas kamar atau gangguan langsung ke pengelola kost beserta bukti foto.
                  </p>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.68rem', gap: '4px' }}>
                  <Camera size={11} /> Foto Bukti
                </span>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                <textarea 
                  value={newComplaint}
                  onChange={e => setNewComplaint(e.target.value)}
                  placeholder="Jelaskan kendala Anda... (Contoh: Lampu kamar mandi mati, kran wastafel bocor, AC kurang dingin)" 
                  className="input-field"
                  style={{ flex: 1, minHeight: '85px', resize: 'vertical' }}
                  required
                />

                {/* Photo Attachment / Camera Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {complaintPhoto ? (
                    <div style={{
                      position: 'relative',
                      display: 'inline-block',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid rgba(56, 189, 248, 0.5)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      background: '#0f172a'
                    }}>
                      <img 
                        src={complaintPhoto} 
                        alt="Foto Bukti Komplain" 
                        style={{ height: '75px', width: 'auto', display: 'block', objectFit: 'cover' }} 
                      />
                      <button
                        type="button"
                        onClick={() => setComplaintPhoto(null)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Hapus Foto"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: '1px dashed rgba(56, 189, 248, 0.4)',
                      background: 'rgba(56, 189, 248, 0.05)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#93c5fd',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}>
                      <Camera size={15} color="#38bdf8" />
                      <span>{compressingPhoto ? 'Mengompresi Gambar...' : '📸 Ambil Foto / Unggah Bukti Kerusakan'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleComplaintPhotoChange}
                        style={{ display: 'none' }}
                        disabled={compressingPhoto}
                      />
                    </label>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || compressingPhoto} 
                  className="btn btn-primary"
                  style={{ gap: '8px', marginTop: '4px' }}
                >
                  <Send size={15} /> {loading ? 'Mengirim...' : 'Kirim Laporan Keluhan'}
                </button>
              </form>
            </div>

          </div>

          {/* Titipan Paket Digital Locker Card */}
          <PackageLockerCard user={currentUser} isStaff={false} />

          {/* Riwayat Komplain Saya */}
          <div className="card glass-panel">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem' }}>Riwayat Keluhan Anda</h3>

            {complaints.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                Belum ada keluhan yang dilaporkan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {complaints.map(c => (
                  <div 
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
                      {c.photo && (
                        <button
                          type="button"
                          onClick={() => setSelectedComplaintPhoto(c.photo)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            borderRadius: '8px',
                            padding: 0,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            width: '48px',
                            height: '48px',
                            flexShrink: 0,
                            position: 'relative'
                          }}
                          title="Klik untuk memperbesar foto bukti"
                        >
                          <img src={c.photo} alt="Bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Eye size={14} color="white" />
                          </div>
                        </button>
                      )}
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{c.text}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Dilaporkan: {new Date(c.date).toLocaleDateString('id-ID')}
                          {c.photo && ' • 📸 Ada Foto Bukti'}
                        </span>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(c.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lightbox Modal for Complaint Photo */}
          {selectedComplaintPhoto && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.9)',
              backdropFilter: 'blur(8px)',
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}>
              <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                <button
                  type="button"
                  onClick={() => setSelectedComplaintPhoto(null)}
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: 0,
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
                <img 
                  src={selectedComplaintPhoto} 
                  alt="Bukti Kerusakan Penuh" 
                  style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }} 
                />
              </div>
            </div>
          )}

          {/* Direktori Layanan Sekitar Kost (0% Gangguan UX - Fasilitas Concierge Non-Tunai) */}
          <div className="card glass-panel" style={{ border: '1px solid rgba(59, 130, 246, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#60a5fa" /> Layanan Toko & Mitra Sekitar Kost
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Bebas pilih toko langganan & bandingkan harga termurah / beda merek • Antar langsung ke pintu kamar
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  fontWeight: 700,
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  💳 Non-Tunai: QRIS & Masuk Tagihan Sewa
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#93c5fd',
                  fontWeight: 700,
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  🏷️ Komisi Hemat Max Rp 500
                </span>
              </div>
            </div>

            {/* Filter Kategori, Sortir & Pencarian */}
            {(() => {
              const defaultUserMerchants = [
                {
                  id: 'PTR-DEF-01',
                  icon: '💧',
                  name: 'Depot Air & Gas Barokah',
                  category: 'galon',
                  distanceKm: 0.15,
                  isAffiliate: false,
                  commissionOwner: 500,
                  products: [
                    { id: 'P-GLN-03', name: 'Air Galon Vit 19L', brand: 'Vit', price: 16000, desc: 'Paling hemat & higienis' },
                    { id: 'P-GLN-01', name: 'Air Galon Aqua 19L', brand: 'Aqua', price: 19000, desc: 'Air mineral alami pegunungan' },
                    { id: 'P-GLN-02', name: 'Air Galon Le Minerale 19L', brand: 'Le Minerale', price: 21000, desc: 'Galon sekali pakai higienis' },
                    { id: 'P-GAS-01', name: 'Gas LPG 3kg Melon', brand: 'Pertamina', price: 23000, desc: 'Tabung gas segel resmi SNI' }
                  ]
                },
                {
                  id: 'PTR-DEF-02',
                  icon: '🧺',
                  name: 'Melati Express Laundry Kiloan',
                  category: 'laundry',
                  distanceKm: 0.35,
                  isAffiliate: false,
                  commissionOwner: 500,
                  products: [
                    { id: 'P-LND-01', name: 'Cuci + Setrika Reguler (2 Hari)', brand: 'Reguler', price: 6000, desc: 'Harga per kg, wangi rapi' },
                    { id: 'P-LND-02', name: 'Cuci Komplit Kilat Express (1 Hari)', brand: 'Express', price: 9000, desc: 'Harga per kg, selesai 24 jam' },
                    { id: 'P-LND-03', name: 'Cuci Sprei & Selimut Tebal', brand: 'Bedding', price: 20000, desc: 'Per set sprei + sarung bantal' }
                  ]
                }
              ];

              const rawList = merchants.length > 0 ? merchants : defaultUserMerchants;

              // Filter by category
              let list = rawList.filter(m => {
                if (partnerCategory === 'all') return true;
                if (partnerCategory === 'galon') return m.category === 'galon' || (m.products || []).some(p => p.name.toLowerCase().includes('galon'));
                if (partnerCategory === 'laundry') return m.category === 'laundry' || (m.products || []).some(p => p.name.toLowerCase().includes('laundry') || p.name.toLowerCase().includes('cuci'));
                if (partnerCategory === 'gas') return m.category === 'gas' || (m.products || []).some(p => p.name.toLowerCase().includes('gas') || p.name.toLowerCase().includes('lpg'));
                if (partnerCategory === 'makanan') return m.category === 'makanan';
                if (partnerCategory === 'service') return m.category === 'service';
                return m.category === partnerCategory;
              });

              // Filter by brand
              if (partnerBrand !== 'all') {
                list = list.filter(m => {
                  return (m.products || []).some(p => 
                    (p.brand || '').toLowerCase() === partnerBrand.toLowerCase() ||
                    p.name.toLowerCase().includes(partnerBrand.toLowerCase())
                  );
                });
              }

              // Filter by search query
              if (partnerSearch.trim()) {
                const q = partnerSearch.toLowerCase();
                list = list.filter(m => {
                  const matchName = m.name?.toLowerCase().includes(q);
                  const matchProd = (m.products || []).some(p => 
                    p.name?.toLowerCase().includes(q) || 
                    p.desc?.toLowerCase().includes(q) || 
                    p.brand?.toLowerCase().includes(q)
                  );
                  return matchName || matchProd;
                });
              }

              // Sort list
              list.sort((a, b) => {
                if (partnerSort === 'cheapest') {
                  const minA = Math.min(...(a.products || [{ price: 999999 }]).map(p => p.price));
                  const minB = Math.min(...(b.products || [{ price: 999999 }]).map(p => p.price));
                  return minA - minB;
                } else if (partnerSort === 'distance') {
                  return (a.distanceKm || 0) - (b.distanceKm || 0);
                }
                return 0;
              });

              return (
                <div>
                  {/* Controls Bar: Category Tabs & Sort Pills */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {/* Category Selector */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'all', label: 'Semua Layanan' },
                        { id: 'galon', label: '💧 Air Galon' },
                        { id: 'laundry', label: '🧺 Laundry' },
                        { id: 'gas', label: '🔥 Gas LPG' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setPartnerCategory(cat.id); setPartnerBrand('all'); }}
                          style={{
                            background: partnerCategory === cat.id ? '#2563eb' : 'rgba(255, 255, 255, 0.04)',
                            border: partnerCategory === cat.id ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                            color: partnerCategory === cat.id ? '#ffffff' : '#cbd5e1',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Sorting Toggle: Termurah vs Terdekat */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '3px 6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Urutkan:</span>
                      <button
                        type="button"
                        onClick={() => setPartnerSort('cheapest')}
                        style={{
                          background: partnerSort === 'cheapest' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                          color: partnerSort === 'cheapest' ? '#4ade80' : '#94a3b8',
                          border: partnerSort === 'cheapest' ? '1px solid #22c55e' : 'none',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        🏷️ Termurah
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartnerSort('distance')}
                        style={{
                          background: partnerSort === 'distance' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          color: partnerSort === 'distance' ? '#60a5fa' : '#94a3b8',
                          border: partnerSort === 'distance' ? '1px solid #3b82f6' : 'none',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📍 Terdekat GPS
                      </button>
                    </div>
                  </div>

                  {/* Brand Selector Pills (Khusus Galon atau jika ada filter merek) */}
                  {(partnerCategory === 'galon' || partnerCategory === 'all') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Pilih Merek Galon:</span>
                      {[
                        { id: 'all', label: 'Semua Merek' },
                        { id: 'Vit', label: 'Vit (Rp 16rb - Hemat)' },
                        { id: 'Aqua', label: 'Aqua (Rp 19rb)' },
                        { id: 'Le Minerale', label: 'Le Minerale (Rp 21rb)' }
                      ].map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setPartnerBrand(b.id)}
                          style={{
                            background: partnerBrand === b.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                            border: partnerBrand === b.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.07)',
                            color: partnerBrand === b.id ? '#38bdf8' : '#94a3b8',
                            borderRadius: '999px',
                            padding: '2px 9px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Grid Cards */}
                  {list.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
                        Tidak ditemukan mitra atau affiliate yang cocok dengan filter ini.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setPartnerCategory('all'); setPartnerBrand('all'); setPartnerSearch(''); }}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '8px', fontSize: '0.74rem' }}
                      >
                        Reset Filter
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      {list.map((item, idx) => {
                        const sortedProds = [...(item.products || [])].sort((a, b) => a.price - b.price);
                        const cheapestProd = sortedProds[0];

                        return (
                          <div
                            key={item.id || idx}
                            style={{
                              background: 'rgba(255, 255, 255, 0.025)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '14px',
                              padding: '14px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '10px',
                              transition: 'all 0.2s',
                              position: 'relative'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)'; }}
                          >
                            <div>
                              {/* Top Bar: Icon, Name, Badge */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{item.icon || '🏪'}</span>
                                  <div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.25 }}>
                                      {item.name || item.title}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                      📍 {item.distanceKm || 0.2} km dari kost • Antar ke Pintu Kamar
                                    </div>
                                  </div>
                                </div>
                                {item.isAffiliate ? (
                                  <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 700, flexShrink: 0 }}>
                                    Affiliate GPS
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 700, flexShrink: 0 }}>
                                    Mitra Kost
                                  </span>
                                )}
                              </div>

                              {/* Pilihan Merek & Produk dalam Toko ini */}
                              <div style={{
                                background: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: '10px',
                                padding: '8px 10px',
                                margin: '6px 0'
                              }}>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                                  Pilihan Varian / Merek Tersedia:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {sortedProds.slice(0, 3).map((p, pIdx) => (
                                    <div
                                      key={p.id || pIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedService({ ...item, preferredProductId: p.id });
                                      }}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.72rem',
                                        padding: '3px 6px',
                                        borderRadius: '6px',
                                        background: pIdx === 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{p.name}</span>
                                        {pIdx === 0 && (
                                          <span style={{ fontSize: '0.58rem', padding: '1px 4px', borderRadius: '3px', background: '#22c55e', color: '#0f172a', fontWeight: 800 }}>
                                            Termurah
                                          </span>
                                        )}
                                      </div>
                                      <span style={{ color: '#4ade80', fontWeight: 700 }}>
                                        Rp {p.price.toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  ))}
                                  {sortedProds.length > 3 && (
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'right', marginTop: '2px' }}>
                                      +{sortedProds.length - 3} varian lainnya
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Bottom Card Footer: Admin Transparan & Tombol Pesan */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <div>
                                <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Mulai dari:</div>
                                <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#4ade80' }}>
                                  Rp {(cheapestProd?.price || 16000).toLocaleString('id-ID')}
                                </div>
                                <div style={{ fontSize: '0.62rem', color: '#38bdf8' }}>
                                  +Rp 500 jasa antar/komisi
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedService(item)}
                                className="btn btn-primary btn-sm"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                                  borderRadius: '8px'
                                }}
                              >
                                Pilih Merek & Pesan &rarr;
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* Modals */}
      {latestInvoice && (
        <PaymentGatewayModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          invoice={latestInvoice}
          user={currentUser}
          onPaymentSuccess={() => {
            fetchData();
          }}
          onOpenReceipt={(invId) => {
            setSelectedReceiptId(invId);
            setShowReceiptModal(true);
          }}
        />
      )}

      {selectedReceiptId && (
        <DigitalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          invoiceId={selectedReceiptId}
        />
      )}

      <SignaturePadModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        user={currentUser}
        existingContract={contract}
        onSignedSuccess={(c) => {
          setContract(c);
          fetchData();
        }}
      />

      <SmartLockAndTokenModal
        isOpen={showSmartLockModal}
        onClose={() => setShowSmartLockModal(false)}
        user={currentUser}
        roomNumber={currentUser?.kamar || '101'}
      />

      {/* IN-APP DIRECT CHAT WITH OWNER (0% FAKE WA SPAM) */}
      <InAppChatModal
        isOpen={showOwnerChat}
        onClose={() => setShowOwnerChat(false)}
        kost={{ uid: currentUser?.kostUid || user?.kostUid, kostName: kostName || 'Pengelola Kost' }}
        roomNumber={currentUser?.kamar || user?.kamar}
        user={currentUser || user}
      />

      {/* IN-APP PARTNER SERVICE ORDER MODAL (0% EXTERNAL SPAM) */}
      <PartnerOrderModal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        service={selectedService}
        user={currentUser || user}
        kost={{ uid: currentUser?.kostUid || user?.kostUid, kostName: kostName || 'KostKu' }}
      />

      {/* TENANT KYC & KTP CHECK-IN MODAL */}
      <TenantKycModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        user={currentUser || user}
        onKycSubmitted={(newKyc) => {
          setCurrentUser(prev => ({ ...prev, kyc_data: newKyc }));
        }}
      />

    </div>
  );
};

export default UserDashboard;
