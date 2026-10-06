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
  ShieldCheck
} from 'lucide-react';
import { 
  apiGetComplaints, 
  apiCreateComplaint, 
  apiGetInvoices,
  apiGetContract 
} from '../services/api';

import PaymentGatewayModal from '../components/PaymentGatewayModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import SignaturePadModal from '../components/SignaturePadModal';
import SmartLockAndTokenModal from '../components/SmartLockAndTokenModal';
import PackageLockerCard from '../components/PackageLockerCard';

const UserDashboard = ({ user }) => {
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
    try {
      const [comps, invs, ctc] = await Promise.all([
        apiGetComplaints(user.kostUid, user.id).catch(() => []),
        apiGetInvoices(user.kostUid, user.id).catch(() => []),
        apiGetContract(user.id).catch(() => ({ contract: null }))
      ]);
      setComplaints(Array.isArray(comps) ? comps : []);
      setInvoices(Array.isArray(invs) ? invs : []);
      setContract(ctc?.contract || null);
    } catch (err) {
      console.error('Failed to fetch tenant data', err);
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
        kostUid: user.kostUid,
        userId: user.id,
        userName: user.name,
        kamar: user.kamar,
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
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
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Halo, {user.name} 👋</h1>
            <span className="badge badge-primary">Penghuni Aktif</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Kamar: <strong style={{ color: 'white' }}>{user.kamar || 'Belum diatur'}</strong> • Cuci Sprei: <strong style={{ color: 'var(--accent-success)' }}>{user.bedsheets || 0}x</strong>
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
      <PackageLockerCard user={user} isStaff={false} />

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

      {/* Modals */}
      {latestInvoice && (
        <PaymentGatewayModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          invoice={latestInvoice}
          user={user}
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
        user={user}
        existingContract={contract}
        onSignedSuccess={(c) => {
          setContract(c);
          fetchData();
        }}
      />

      <SmartLockAndTokenModal
        isOpen={showSmartLockModal}
        onClose={() => setShowSmartLockModal(false)}
        user={user}
        roomNumber={user?.kamar || '101'}
      />

    </div>
  );
};

export default UserDashboard;
