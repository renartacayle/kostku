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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  apiGetComplaints, 
  apiCreateComplaint, 
  apiGetInvoices, 
  apiGetContract,
  apiGetUserProfile 
} from '../services/api';

import PaymentGatewayModal from '../components/PaymentGatewayModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import SignaturePadModal from '../components/SignaturePadModal';
import SmartLockAndTokenModal from '../components/SmartLockAndTokenModal';
import PackageLockerCard from '../components/PackageLockerCard';

const UserDashboard = ({ user }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [activeApplication, setActiveApplication] = useState(null);
  const [kostName, setKostName] = useState('');
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contract, setContract] = useState(null);
  const [newComplaint, setNewComplaint] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTransferInfo, setShowTransferInfo] = useState(false);

  // Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSmartLockModal, setShowSmartLockModal] = useState(false);

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
        const [comps, invs, ctc] = await Promise.all([
          apiGetComplaints(activeKostUid, activeUserId).catch(() => []),
          apiGetInvoices(activeKostUid, activeUserId).catch(() => []),
          apiGetContract(activeUserId).catch(() => ({ contract: null }))
        ]);
        setComplaints(Array.isArray(comps) ? comps : []);
        setInvoices(Array.isArray(invs) ? invs : []);
        setContract(ctc?.contract || null);
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
        text: newComplaint
      });
      setNewComplaint('');
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
                {kostName && <><strong style={{ color: '#93c5fd' }}>{kostName}</strong> • </>}Kamar: <strong style={{ color: 'white' }}>{currentUser.kamar}</strong> • Cuci Sprei: <strong style={{ color: 'var(--accent-success)' }}>{currentUser.bedsheets || 0}x</strong>
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
            </div>
          </div>
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
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Punya Keluhan atau Kerusakan?</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Laporkan masalah fasilitas kamar atau gangguan langsung ke pengelola kost.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                <textarea 
                  value={newComplaint}
                  onChange={e => setNewComplaint(e.target.value)}
                  placeholder="Jelaskan kendala Anda... (Contoh: Lampu kamar mandi mati, air keran pelan)" 
                  className="input-field"
                  style={{ flex: 1, minHeight: '100px', resize: 'vertical' }}
                  required
                />
                
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary"
                  style={{ gap: '8px' }}
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
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{c.text}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Dilaporkan: {new Date(c.date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div>
                      {getStatusBadge(c.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

    </div>
  );
};

export default UserDashboard;
