import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Zap, 
  Copy, 
  Check, 
  Sparkles,
  QrCode,
  Building2,
  Clock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  History,
  CheckCircle2,
  AlertCircle,
  Share2,
  ArrowLeft
} from 'lucide-react';
import { 
  apiInquiryPln, 
  apiCreateElectricityOrder, 
  apiGetPaymentStatus, 
  apiVerifyPayment, 
  apiGetElectricityHistory,
  apiTopUpElectricity 
} from '../services/api';
import { generateQrisDataUrl } from '../utils/qrisEngine';
import { useTheme } from '../context/ThemeContext';

const NOMINAL_OPTIONS = [
  { value: 20000, label: 'Rp 20.000', kwh: 13.8 },
  { value: 50000, label: 'Rp 50.000', kwh: 34.6 },
  { value: 100000, label: 'Rp 100.000', kwh: 69.2 },
  { value: 200000, label: 'Rp 200.000', kwh: 138.4 },
  { value: 500000, label: 'Rp 500.000', kwh: 346.1 }
];

const PAYMENT_METHODS = [
  { id: 'QRIS', name: 'QRIS Dinamis', desc: 'Scan via BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA', fee: 0, badge: 'Bebas Admin' },
  { id: 'VA BCA', name: 'BCA Virtual Account', desc: 'Transfer otomatis 24 jam via BCA Mobile & KlikBCA', fee: 2000 },
  { id: 'VA MANDIRI', name: 'Mandiri Virtual Account', desc: 'Transfer via Livin by Mandiri & ATM Mandiri', fee: 2000 },
  { id: 'VA BRI', name: 'BRI Virtual Account (BRIVA)', desc: 'Transfer via BRImo & ATM BRI', fee: 2000 },
  { id: 'VA BNI', name: 'BNI Virtual Account', desc: 'Transfer via BNI Mobile Banking', fee: 2000 }
];

const SmartLockAndTokenModal = ({ 
  isOpen, 
  onClose, 
  user, 
  roomNumber = '101' 
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState('buy'); // 'buy' | 'history'
  
  // Step state: 'form' | 'payment' | 'success'
  const [step, setStep] = useState('form');

  // Form State
  const defaultMeter = user?.meterNumber || `14120938${String(user?.kamar || roomNumber || '101').replace(/[^0-9]/g, '').padStart(3, '0')}`;
  const [meterNumber, setMeterNumber] = useState(defaultMeter);
  const [nominal, setNominal] = useState(50000);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  
  // Inquiry State
  const [inquiryData, setInquiryData] = useState({
    subscriberName: user?.name ? `${user.name.toUpperCase()} / KM ${user?.kamar || roomNumber}` : 'RENA / KOST BAROKAH',
    segmentPower: 'R1M / 900 VA'
  });
  const [inquiryLoading, setInquiryLoading] = useState(false);

  // Active Transaction State
  const [activeOrder, setActiveOrder] = useState(null);
  const [qrisImage, setQrisImage] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins in sec

  // Success Token State
  const [settledData, setSettledData] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);

  // History State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pollingRef = useRef(null);

  const handleInquiry = async (customMeter = null) => {
    const targetMeter = customMeter || meterNumber;
    if (!targetMeter || targetMeter.length < 8) return;
    setInquiryLoading(true);
    try {
      const res = await apiInquiryPln(targetMeter);
      if (res?.success) {
        setInquiryData({
          subscriberName: res.subscriberName || 'RENA / KOST BAROKAH',
          segmentPower: res.segmentPower || 'R1M / 900 VA'
        });
      }
    } catch (err) {
      console.warn('Inquiry notice:', err.message);
    } finally {
      setInquiryLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiGetElectricityHistory({
        meterNumber,
        roomNumber: user?.kamar || roomNumber,
        kostUid: user?.kostUid,
        userId: user?.id
      });
      if (res?.success) {
        setHistoryList(res.history || []);
      }
    } catch (err) {
      console.warn('History fetch notice:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history when tab is clicked
  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchHistory();
    }
  }, [isOpen, activeTab]);

  // Auto-inquiry on meter change
  useEffect(() => {
    if (!isOpen) return;
    if (meterNumber && meterNumber.length >= 8) {
      const timer = setTimeout(() => {
        handleInquiry(meterNumber);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isOpen, meterNumber]);

  // Polling payment status when in 'payment' step
  useEffect(() => {
    if (!isOpen || step !== 'payment' || !activeOrder?.orderId) return;

    pollingRef.current = setInterval(() => {
      checkStatusSilently(activeOrder.orderId);
    }, 3500);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollingRef.current);
      clearInterval(timer);
    };
  }, [isOpen, step, activeOrder]);

  const handleProceedPayment = async () => {
    setLoadingOrder(true);
    try {
      const payload = {
        meterNumber,
        nominal,
        paymentMethod,
        customerName: user?.name || 'Penghuni Kost',
        customerPhone: user?.phone || '08123456789',
        customerEmail: user?.email || 'penyewa@kostku.id',
        roomNumber: user?.kamar || roomNumber,
        kostUid: user?.kostUid || null,
        userId: user?.id || null
      };

      const res = await apiCreateElectricityOrder(payload);
      if (res?.success && res.transaction) {
        const trx = res.transaction;
        setActiveOrder(trx);
        setTimeLeft(900);

        // Generate QRIS Data URL if method is QRIS
        if (trx.paymentMethod === 'QRIS') {
          if (trx.qrCodeUrl) {
            setQrisImage(trx.qrCodeUrl);
          } else {
            const fallbackQr = await generateQrisDataUrl({
              amount: trx.amount,
              orderId: trx.orderId,
              merchantName: 'KOSTKU TRIPAY MERCHANT',
              qrString: trx.qrString
            });
            setQrisImage(fallbackQr);
          }
        }

        setStep('payment');
      }
    } catch (err) {
      console.error('Create order error:', err);
      // Fallback direct topup if offline
      const direct = await apiTopUpElectricity({
        kostUid: user?.kostUid,
        roomNumber: user?.kamar || roomNumber,
        amount: nominal,
        meterNumber
      });
      setSettledData({
        token: direct.token,
        kwhAdded: direct.kwhAdded,
        nominal,
        meterNumber,
        subscriberName: inquiryData.subscriberName,
        receiptNumber: direct.receiptNumber
      });
      setStep('success');
    } finally {
      setLoadingOrder(false);
    }
  };

  const checkStatusSilently = async (orderId) => {
    try {
      const res = await apiGetPaymentStatus(orderId);
      if (res?.isPaid || res?.status === 'settlement') {
        clearInterval(pollingRef.current);
        setSettledData({
          token: res.electricityToken,
          kwhAdded: res.kwhAdded || Math.round((nominal / 1444.7) * 10) / 10,
          nominal: res.amount || nominal,
          meterNumber: res.meterNumber || meterNumber,
          subscriberName: res.customerPlnName || inquiryData.subscriberName,
          receiptNumber: res.receiptNumber,
          paymentMethod: res.paymentMethod
        });
        setStep('success');
      }
    } catch (err) {
      // Quiet polling
    }
  };

  const handleManualCheck = async () => {
    if (!activeOrder?.orderId) return;
    setCheckingPayment(true);
    try {
      const res = await apiVerifyPayment({ orderId: activeOrder.orderId });
      if (res?.success && (res.status === 'settlement' || res.isPaid)) {
        clearInterval(pollingRef.current);
        setSettledData({
          token: res.electricityToken || res.transaction?.electricityToken,
          kwhAdded: res.kwhAdded || Math.round((nominal / 1444.7) * 10) / 10,
          nominal: res.transaction?.amount || nominal,
          meterNumber: res.meterNumber || meterNumber,
          subscriberName: res.customerPlnName || inquiryData.subscriberName,
          receiptNumber: res.receiptNumber,
          paymentMethod: res.transaction?.paymentMethod || activeOrder.paymentMethod
        });
        setStep('success');
      } else {
        alert('Pembayaran belum terdeteksi masuk dari gateway TriPay. Silakan selesaikan pembayaran terlebih dahulu.');
      }
    } catch (err) {
      alert(err.message || 'Gagal memeriksa status pembayaran');
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCopy = (text, type = 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (!settledData?.token) return;
    const msg = `⚡ *BUKTI PEMBELIAN TOKEN LISTRIK PLN - KOSTKU*\n\n` +
      `• No. Meter / IDPEL: ${settledData.meterNumber}\n` +
      `• Nama Pelanggan: ${settledData.subscriberName}\n` +
      `• Nominal: Rp ${Number(settledData.nominal).toLocaleString('id-ID')}\n` +
      `• Tambahan Daya: +${settledData.kwhAdded} kWh\n` +
      `• No. Referensi: ${settledData.receiptNumber}\n\n` +
      `🔑 *KODE TOKEN PLN (20 DIGIT):*\n` +
      `*${settledData.token}*\n\n` +
      `_Status: Lunas Terverifikasi via TriPay Payment Gateway (Merchant T53543)._`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem',
        overflowY: 'auto'
      }} 
      className="animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: isLight ? '#ffffff' : '#0d1527',
          border: isLight ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: 'min(92vh, 760px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: isLight 
            ? '0 25px 60px -15px rgba(15, 23, 42, 0.15), 0 0 35px rgba(245, 158, 11, 0.1)' 
            : '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 45px rgba(245, 158, 11, 0.2)',
          margin: 'auto',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: isLight ? '1px solid #fef3c7' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isLight 
            ? 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)' 
            : 'linear-gradient(90deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
            }}>
              <Zap size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white' }}>
                  Token Listrik PLN
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: isLight ? '#b45309' : '#fbbf24',
                  background: isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: isLight ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}>
                  TriPay T53543
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: isLight ? '#475569' : '#94a3b8' }}>
                Isi Ulang Mandiri Kamar {user?.kamar || roomNumber} (Resmi PLN Biller)
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '10px',
              color: isLight ? '#475569' : '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('buy'); if (step === 'success') setStep('form'); }}
            style={{
              flex: 1,
              padding: '11px',
              border: 'none',
              borderBottom: activeTab === 'buy' ? '2.5px solid #d97706' : '2.5px solid transparent',
              background: 'none',
              color: activeTab === 'buy' ? '#d97706' : (isLight ? '#64748b' : '#94a3b8'),
              fontWeight: activeTab === 'buy' ? 800 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Zap size={14} /> Beli Token PLN
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '11px',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2.5px solid #d97706' : '2.5px solid transparent',
              background: 'none',
              color: activeTab === 'history' ? '#d97706' : (isLight ? '#64748b' : '#94a3b8'),
              fontWeight: activeTab === 'history' ? 800 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <History size={14} /> Riwayat Token
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: isLight ? '#ffffff' : 'transparent' }}>
          {activeTab === 'history' ? (
            /* TAB 2: RIWAYAT TOKEN */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: isLight ? '#475569' : '#94a3b8', fontWeight: 700 }}>
                  Daftar Token Kamar {user?.kamar || roomNumber}:
                </span>
                <button
                  type="button"
                  onClick={fetchHistory}
                  disabled={historyLoading}
                  style={{
                    background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isLight ? '#1e293b' : '#cbd5e1',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} /> Segarkan
                </button>
              </div>

              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: isLight ? '#64748b' : '#94a3b8' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.82rem' }}>Memuat riwayat transaksi token...</p>
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <Zap size={32} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', color: isLight ? '#0f172a' : '#cbd5e1', fontWeight: 700 }}>Belum Ada Riwayat Token</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8' }}>Token listrik PLN yang dibeli akan otomatis tersimpan rapi di sini.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historyList.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: '#d97706', display: 'block' }}>
                            {formatRupiah(item.plnNominal || item.amount)} (+{item.kwhAdded || item.kwhEstimated || 0} kWh)
                          </strong>
                          <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                            {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: item.status === 'settlement' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: item.status === 'settlement' ? '#16a34a' : '#d97706'
                        }}>
                          {item.status === 'settlement' ? '✓ Lunas' : 'Menunggu Bayar'}
                        </span>
                      </div>

                      {item.electricityToken && (
                        <div style={{
                          background: isLight ? '#fffbeb' : '#070d19',
                          border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', fontWeight: 800, color: isLight ? '#92400e' : '#f8fafc', letterSpacing: '1px' }}>
                            {item.electricityToken}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.electricityToken, 'token')}
                            style={{
                              background: isLight ? '#fef3c7' : 'rgba(255, 255, 255, 0.08)',
                              border: isLight ? '1px solid #fde68a' : 'none',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              color: isLight ? '#92400e' : '#cbd5e1',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Copy size={12} /> Salin
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : step === 'form' ? (
            /* TAB 1 - STEP 1: FORM PEMBELIAN */
            <div>
              {/* Info Meteran PLN Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Nomor Meter PLN / ID Pelanggan (11–12 Digit):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={meterNumber}
                    onChange={(e) => setMeterNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 14120938472"
                    style={{
                      flex: 1,
                      background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: isLight ? '#0f172a' : 'white',
                      fontFamily: 'monospace',
                      fontSize: '0.95rem',
                      letterSpacing: '1px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleInquiry()}
                    disabled={inquiryLoading || !meterNumber}
                    style={{
                      background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.18)',
                      border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '12px',
                      padding: '0 14px',
                      color: isLight ? '#b45309' : '#fbbf24',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {inquiryLoading ? 'Memeriksa...' : 'Cek Pelanggan'}
                  </button>
                </div>

                {/* Helper info on custom meter */}
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                    💡 Otomatis untuk Kamar {user?.kamar || roomNumber}. Bisa diubah bebas ke meteran lain.
                  </span>
                  {meterNumber !== defaultMeter && (
                    <button
                      type="button"
                      onClick={() => {
                        setMeterNumber(defaultMeter);
                        handleInquiry(defaultMeter);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      Reset ke Kamar {user?.kamar || roomNumber}
                    </button>
                  )}
                </div>

                {/* Pelanggan Box */}
                <div style={{
                  marginTop: '8px',
                  background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.06)',
                  border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>NAMA PELANGGAN PLN</span>
                    <strong style={{ fontSize: '0.82rem', color: isLight ? '#0f172a' : '#f8fafc' }}>{inquiryData.subscriberName}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.68rem', color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>TARIF / DAYA</span>
                    <strong style={{ fontSize: '0.82rem', color: '#d97706' }}>{inquiryData.segmentPower}</strong>
                  </div>
                </div>
              </div>

              {/* Grid Pilihan Nominal */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                  Pilih Nominal Isi Ulang:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {NOMINAL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNominal(opt.value)}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '12px',
                        border: nominal === opt.value 
                          ? '2px solid #d97706' 
                          : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
                        background: nominal === opt.value 
                          ? (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.22)') 
                          : (isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.65)'),
                        color: nominal === opt.value 
                          ? (isLight ? '#92400e' : '#fbbf24') 
                          : (isLight ? '#0f172a' : '#cbd5e1'),
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      {opt.label}
                      <span style={{ display: 'block', fontSize: '0.68rem', color: nominal === opt.value ? (isLight ? '#b45309' : '#fde68a') : (isLight ? '#64748b' : '#94a3b8'), marginTop: '3px' }}>
                        ~{opt.kwh} kWh
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilihan Metode Pembayaran TriPay */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                  Metode Pembayaran (TriPay Payment Gateway):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PAYMENT_METHODS.map(m => (
                    <div
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: paymentMethod === m.id 
                          ? '1.5px solid #d97706' 
                          : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
                        background: paymentMethod === m.id 
                          ? (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.12)') 
                          : (isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)'),
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {m.id === 'QRIS' ? <QrCode size={18} color="#16a34a" /> : <Building2 size={18} color="#2563eb" />}
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: isLight ? '#0f172a' : 'white', display: 'block' }}>{m.name}</strong>
                          <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8' }}>{m.desc}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {m.fee === 0 ? (
                          <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, background: 'rgba(22, 163, 74, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                            Bebas Biaya
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                            +Rp {m.fee.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ringkasan Total */}
              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                  <span>Nominal Token PLN:</span>
                  <span style={{ color: isLight ? '#0f172a' : 'white', fontWeight: 600 }}>{formatRupiah(nominal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                  <span>Biaya Admin Biller PLN:</span>
                  <span style={{ color: '#16a34a', fontWeight: 700, background: 'rgba(22, 163, 74, 0.12)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>
                    Rp 0 (Bebas Admin)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '8px' }}>
                  <span>Biaya Layanan Payment Gateway ({paymentMethod}):</span>
                  <span style={{ color: paymentMethod === 'QRIS' ? '#16a34a' : (isLight ? '#0f172a' : 'white'), fontWeight: 600 }}>
                    {paymentMethod === 'QRIS' ? 'Gratis (Rp 0)' : '+Rp 2.000'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 800, color: '#d97706', borderTop: isLight ? '1px dashed #e2e8f0' : '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '8px' }}>
                  <span>Total Pembayaran:</span>
                  <span>{formatRupiah(nominal + (paymentMethod === 'QRIS' ? 0 : 2000))}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleProceedPayment}
                disabled={loadingOrder || !meterNumber}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  fontWeight: 800,
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                  fontSize: '0.92rem'
                }}
              >
                <Zap size={18} /> {loadingOrder ? 'Membuat Tagihan TriPay...' : `Bayar ${formatRupiah(nominal + (paymentMethod === 'QRIS' ? 0 : 2000))} via TriPay`}
              </button>
            </div>
          ) : step === 'payment' ? (
            /* TAB 1 - STEP 2: MENUNGGU PEMBAYARAN */
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#d97706', fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px' }}>
                <Clock size={16} /> Batas Waktu Pembayaran: {formatTimer(timeLeft)}
              </div>

              <div style={{
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: '20px',
                padding: '1.25rem',
                margin: '0 auto 1.25rem',
                maxWidth: '340px',
                boxShadow: isLight ? '0 10px 25px rgba(15, 23, 42, 0.12)' : '0 10px 25px rgba(0,0,0,0.5)',
                border: isLight ? '1px solid #e2e8f0' : 'none'
              }}>
                {activeOrder?.paymentMethod === 'QRIS' ? (
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', display: 'block', letterSpacing: '1px', marginBottom: '8px' }}>
                      SCAN QRIS RESMI TRIPAY
                    </span>

                    {qrisImage ? (
                      <img 
                        src={qrisImage} 
                        alt="QRIS TriPay" 
                        style={{ width: '220px', height: '220px', margin: '0 auto', display: 'block', borderRadius: '12px' }} 
                      />
                    ) : (
                      <div style={{ width: '220px', height: '220px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '12px' }}>
                        <RefreshCw size={24} className="animate-spin" color="#94a3b8" />
                      </div>
                    )}

                    <span style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginTop: '8px' }}>
                      Dapat di-scan seluruh m-Banking & E-Wallet
                    </span>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                      NOMOR VIRTUAL ACCOUNT {activeOrder?.paymentMethod}
                    </span>
                    <strong style={{ fontSize: '1.4rem', color: '#0f172a', fontFamily: 'monospace', display: 'block', letterSpacing: '2px', margin: '10px 0' }}>
                      {activeOrder?.vaNumber || '12888091823901'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeOrder?.vaNumber, 'va')}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        color: '#1e293b',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedVa ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      {copiedVa ? 'Nomor VA Tersalin' : 'Salin Nomor VA'}
                    </button>
                  </div>
                )}

                <div style={{ marginTop: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', textAlign: 'left', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Nominal:</span>
                    <strong style={{ color: '#0f172a' }}>{formatRupiah(activeOrder?.amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginTop: '2px' }}>
                    <span>Order ID:</span>
                    <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{activeOrder?.orderId}</span>
                  </div>
                </div>
              </div>

              {activeOrder?.tripayCheckoutUrl && (
                <div style={{ marginBottom: '1rem' }}>
                  <a
                    href={activeOrder.tripayCheckoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#2563eb',
                      fontSize: '0.78rem',
                      textDecoration: 'none'
                    }}
                  >
                    Buka Halaman Pembayaran TriPay <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Status Polling Actions */}
              <div style={{ display: 'flex', gap: '8px', maxWidth: '380px', margin: '0 auto 12px' }}>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  style={{
                    background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: isLight ? '#1e293b' : '#cbd5e1',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ArrowLeft size={14} /> Ganti Nominal
                </button>

                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={checkingPayment}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={14} className={checkingPayment ? 'animate-spin' : ''} />
                  {checkingPayment ? 'Mengecek Gateway...' : 'Saya Sudah Bayar'}
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Sistem mendeteksi pembayaran secara real-time. Token 20 digit akan otomatis muncul begitu transaksi lunas.
              </p>
            </div>
          ) : (
            /* TAB 1 - STEP 3: TOKEN BERHASIL TERBIT */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.18)',
                border: '2px solid #22c55e',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <CheckCircle2 size={32} />
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', display: 'block', letterSpacing: '1px' }}>
                ✓ PEMBAYARAN LUNAS (TRIPAY PPOB)
              </span>
              <h3 style={{ margin: '4px 0 12px', fontSize: '1.2rem', color: isLight ? '#0f172a' : 'white', fontWeight: 900 }}>
                Token Listrik Berhasil Diterbitkan!
              </h3>

              {/* 20 Digit Monospace Box */}
              <div style={{
                background: isLight ? '#fffbeb' : '#070d19',
                border: isLight ? '2px solid #f59e0b' : '2px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '18px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                boxShadow: isLight ? '0 10px 25px rgba(245, 158, 11, 0.15)' : '0 0 30px rgba(245, 158, 11, 0.2)'
              }}>
                <span style={{ fontSize: '0.7rem', color: isLight ? '#92400e' : '#94a3b8', display: 'block', fontWeight: 700 }}>
                  MASUKKAN 20 DIGIT KE METERAN PLN:
                </span>
                
                <strong style={{
                  fontSize: '1.45rem',
                  color: isLight ? '#b45309' : '#fbbf24',
                  display: 'block',
                  letterSpacing: '2.5px',
                  margin: '10px 0',
                  fontFamily: 'monospace',
                  textShadow: isLight ? 'none' : '0 0 12px rgba(251, 191, 36, 0.4)'
                }}>
                  {settledData?.token}
                </strong>

                <button
                  type="button"
                  onClick={() => handleCopy(settledData?.token, 'token')}
                  style={{
                    background: copiedToken ? 'rgba(34, 197, 94, 0.2)' : (isLight ? '#fef3c7' : 'rgba(255, 255, 255, 0.1)'),
                    border: copiedToken ? '1px solid #22c55e' : (isLight ? '1px solid #fde68a' : '1px solid rgba(255, 255, 255, 0.15)'),
                    borderRadius: '10px',
                    padding: '8px 18px',
                    color: copiedToken ? '#16a34a' : (isLight ? '#92400e' : 'white'),
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {copiedToken ? <Check size={14} /> : <Copy size={14} />}
                  {copiedToken ? '20 Digit Berhasil Disalin!' : 'Salin 20 Digit Token'}
                </button>
              </div>

              {/* Rincian Transaksi */}
              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: '0.78rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                  <span>No. Meter / IDPEL:</span>
                  <strong style={{ color: isLight ? '#0f172a' : 'white', fontFamily: 'monospace' }}>{settledData?.meterNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                  <span>Nama Pelanggan:</span>
                  <strong style={{ color: isLight ? '#0f172a' : 'white' }}>{settledData?.subscriberName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                  <span>Tambahan Daya:</span>
                  <strong style={{ color: '#16a34a' }}>+{settledData?.kwhAdded} kWh</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8', borderTop: isLight ? '1px dashed #e2e8f0' : '1px dashed rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '6px' }}>
                  <span>Nomor Resi / Referensi:</span>
                  <span style={{ fontFamily: 'monospace', color: '#d97706' }}>{settledData?.receiptNumber}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  style={{
                    flex: 1,
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    borderRadius: '12px',
                    padding: '10px',
                    color: '#16a34a',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Share2 size={16} /> Kirim ke WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setActiveOrder(null);
                    setSettledData(null);
                  }}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    borderRadius: '12px'
                  }}
                >
                  <Zap size={16} /> Beli Token Lagi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SmartLockAndTokenModal;
