import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  CreditCard, 
  QrCode, 
  Building2, 
  Wallet, 
  Copy, 
  Check, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Printer,
  Receipt
} from 'lucide-react';
import { apiCreatePaymentTransaction, apiSimulatePaymentSuccess } from '../services/api';

const PaymentGatewayModal = ({ 
  isOpen, 
  onClose, 
  invoice, 
  user,
  onPaymentSuccess,
  onOpenReceipt 
}) => {
  const [activeTab, setActiveTab] = useState('qris'); // 'qris' | 'va' | 'ewallet'
  const [selectedBank, setSelectedBank] = useState('BCA');
  const [selectedWallet, setSelectedWallet] = useState('GOPAY');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState('');

  // 15-minute countdown
  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      setIsProcessing(false);
      setTimeLeft(900);
      setTransaction(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Initialize transaction
  useEffect(() => {
    if (isOpen && invoice) {
      initTransaction();
    }
  }, [isOpen, invoice, activeTab, selectedBank]);

  const initTransaction = async () => {
    try {
      const trx = await apiCreatePaymentTransaction({
        invoiceId: invoice.id,
        kostUid: invoice.kostUid || user?.kostUid,
        userId: invoice.userId || user?.id,
        amount: invoice.total,
        customerName: user?.name || invoice.userName || 'Penghuni Kost',
        roomNumber: invoice.kamar || user?.kamar || '-',
        paymentMethod: activeTab === 'va' ? `VA ${selectedBank}` : activeTab === 'ewallet' ? selectedWallet : 'QRIS'
      });
      setTransaction(trx);
    } catch (err) {
      console.error('Error creating payment transaction:', err);
    }
  };

  if (!isOpen || !invoice) return null;

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const vaNumber = transaction?.vaNumber || `89888${String(user?.id || 102938).slice(-4)}${invoice.id || 12}`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Instant simulator action (triggers webhook success)
  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await apiSimulatePaymentSuccess({
        transactionId: transaction?.id,
        invoiceId: invoice.id
      });
      
      setIsSuccess(true);
      setReceiptNumber(res.receiptNumber || `RCP-${Date.now()}`);
      if (onPaymentSuccess) {
        onPaymentSuccess(res.invoice || { ...invoice, status: 'lunas' }, res.receiptNumber);
      }
    } catch (err) {
      alert(err.message || 'Gagal memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }} className="animate-fade-in">
      
      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '540px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(59, 130, 246, 0.2)'
      }}>

        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#2563eb',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Payment Gateway KostKu
                <span style={{ fontSize: '0.65rem', background: '#22c55e', color: '#000', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>LIVE</span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                Pembayaran Otomatis Real-time & Verifikasi Instan
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '10px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          
          {/* Success Screen */}
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '2px solid #22c55e',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <CheckCircle size={44} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e', margin: '0 0 6px 0' }}>
                Pembayaran Berhasil!
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
                Tagihan sewa telah terverifikasi lunas secara otomatis tanpa perlu konfirmasi manual.
              </p>

              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '16px',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: '#94a3b8' }}>No. Kuitansi:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 700 }}>{receiptNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: '#94a3b8' }}>Kamar:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 700 }}>{invoice.kamar || user?.kamar}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: '#94a3b8' }}>Total Dibayar:</span>
                  <span style={{ color: '#22c55e', fontWeight: 800, fontSize: '1.05rem' }}>{formatRupiah(invoice.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#94a3b8' }}>Status:</span>
                  <span className="badge badge-success" style={{ fontWeight: 800 }}>LUNAS (AUTO-SETTLED)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenReceipt) onOpenReceipt(invoice.id);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, gap: '8px', justifyContent: 'center' }}
                >
                  <Receipt size={16} /> Lihat Kuitansi Resmi
                </button>
                <button
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Order Summary Strip */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>TOTAL PEMBAYARAN</span>
                  <strong style={{ fontSize: '1.35rem', color: '#60a5fa', fontWeight: 900 }}>
                    {formatRupiah(invoice.total)}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'block', marginTop: '2px' }}>
                    Sewa Kamar {invoice.kamar || user?.kamar} • Order ID: {transaction?.orderId || `ORD-${invoice.id}`}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#f87171',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  <Clock size={14} />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '1.25rem',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '5px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('qris')}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'qris' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                    color: activeTab === 'qris' ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <QrCode size={16} />
                  <span>QRIS Instan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('va')}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'va' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                    color: activeTab === 'va' ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Building2 size={16} />
                  <span>Virtual Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ewallet')}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'ewallet' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                    color: activeTab === 'ewallet' ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Wallet size={16} />
                  <span>E-Wallet</span>
                </button>
              </div>

              {/* Tab 1: QRIS */}
              {activeTab === 'qris' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '1.25rem',
                    display: 'inline-block',
                    margin: '0 auto 1rem auto',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                    border: '4px solid #f1f5f9'
                  }}>
                    {/* Header QRIS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#dc2626', letterSpacing: '1px' }}>QRIS</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569' }}>PEMBAYARAN RESMI</span>
                    </div>

                    {/* QR Code Graphic (SVG generated) */}
                    <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto' }}>
                      <svg viewBox="0 0 100 100" width="180" height="180">
                        {/* Background */}
                        <rect width="100" height="100" fill="#ffffff" />
                        
                        {/* Corner Targets */}
                        <rect x="5" y="5" width="26" height="26" fill="#000000" rx="3" />
                        <rect x="8" y="8" width="20" height="20" fill="#ffffff" rx="2" />
                        <rect x="12" y="12" width="12" height="12" fill="#000000" rx="1" />

                        <rect x="69" y="5" width="26" height="26" fill="#000000" rx="3" />
                        <rect x="72" y="8" width="20" height="20" fill="#ffffff" rx="2" />
                        <rect x="76" y="12" width="12" height="12" fill="#000000" rx="1" />

                        <rect x="5" y="69" width="26" height="26" fill="#000000" rx="3" />
                        <rect x="8" y="72" width="20" height="20" fill="#ffffff" rx="2" />
                        <rect x="12" y="76" width="12" height="12" fill="#000000" rx="1" />

                        {/* QR Matrix Bits */}
                        <rect x="36" y="8" width="6" height="6" fill="#000000" />
                        <rect x="46" y="8" width="6" height="6" fill="#000000" />
                        <rect x="56" y="8" width="6" height="6" fill="#000000" />
                        <rect x="36" y="18" width="6" height="6" fill="#000000" />
                        <rect x="46" y="24" width="6" height="6" fill="#000000" />

                        <rect x="8" y="36" width="6" height="6" fill="#000000" />
                        <rect x="18" y="42" width="6" height="6" fill="#000000" />
                        <rect x="28" y="36" width="6" height="6" fill="#000000" />

                        <rect x="36" y="36" width="28" height="28" fill="#1e40af" rx="4" />
                        <text x="50" y="53" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">KOST</text>

                        <rect x="68" y="36" width="6" height="6" fill="#000000" />
                        <rect x="78" y="42" width="6" height="6" fill="#000000" />
                        <rect x="86" y="36" width="6" height="6" fill="#000000" />

                        <rect x="36" y="68" width="6" height="6" fill="#000000" />
                        <rect x="46" y="76" width="6" height="6" fill="#000000" />
                        <rect x="56" y="68" width="6" height="6" fill="#000000" />
                        <rect x="68" y="74" width="6" height="6" fill="#000000" />
                        <rect x="76" y="84" width="6" height="6" fill="#000000" />
                        <rect x="84" y="68" width="6" height="6" fill="#000000" />
                      </svg>
                    </div>

                    <div style={{ marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 600 }}>NMID: ID1029384758920</span>
                      <span style={{ fontSize: '0.72rem', color: '#0f172a', fontWeight: 800 }}>KostKu Managed Properties</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
                    Buka BCA Mobile, Livin, BRImo, GoPay, OVO, ShopeePay, atau DANA, lalu scan kode QR di atas.
                  </p>
                </div>
              )}

              {/* Tab 2: Virtual Account */}
              {activeTab === 'va' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1rem' }}>
                    {['BCA', 'MANDIRI', 'BRI', 'BNI'].map(bank => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '10px',
                          border: selectedBank === bank ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: selectedBank === bank ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          color: selectedBank === bank ? '#60a5fa' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>NOMOR VIRTUAL ACCOUNT {selectedBank}</span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '6px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '10px 14px',
                      borderRadius: '10px'
                    }}>
                      <strong style={{ fontSize: '1.25rem', color: '#38bdf8', letterSpacing: '1px' }}>
                        {vaNumber}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(vaNumber)}
                        style={{
                          background: copied ? '#22c55e' : 'rgba(59, 130, 246, 0.3)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>

                    <div style={{ marginTop: '12px', fontSize: '0.76rem', color: '#94a3b8', lineHeight: '1.4' }}>
                      <p style={{ margin: '0 0 4px 0' }}>• Buka m-Banking {selectedBank} &gt; Pilih Bayar &gt; Virtual Account</p>
                      <p style={{ margin: '0 0 4px 0' }}>• Masukkan nomor VA di atas</p>
                      <p style={{ margin: 0 }}>• Nominal otomatis sesuai tagihan ({formatRupiah(invoice.total)})</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: E-Wallet */}
              {activeTab === 'ewallet' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1rem' }}>
                    {['GOPAY', 'OVO', 'SHOPEEPAY'].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWallet(w)}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '10px',
                          border: selectedWallet === w ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: selectedWallet === w ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          color: selectedWallet === w ? '#60a5fa' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {w}
                      </button>
                    ))}
                  </div>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: '0 0 10px 0' }}>
                      Nomor Handphone Terdaftar:
                    </p>
                    <strong style={{ fontSize: '1.15rem', color: '#38bdf8' }}>
                      {user?.phone || '0812-3456-7890'}
                    </strong>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '10px 0 0 0' }}>
                      Notifikasi konfirmasi pembayaran akan dikirimkan otomatis ke aplikasi {selectedWallet} Anda.
                    </p>
                  </div>
                </div>
              )}

              {/* Instant Simulator Action Button */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} /> MODE SIMULATOR GATEWAY
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1' }}>
                    Klik tombol untuk menyimulasikan transfer / scan berhasil seketika.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="btn btn-success"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)'
                  }}
                >
                  {isProcessing ? 'Memproses...' : '⚡ Bayar Sekarang'}
                </button>
              </div>

              {/* Security Seal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '0.72rem' }}>
                <ShieldCheck size={14} color="#3b82f6" />
                <span>Enkripsi 256-Bit SSL • Terverifikasi Bank Indonesia & ASPI</span>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
};

export default PaymentGatewayModal;
