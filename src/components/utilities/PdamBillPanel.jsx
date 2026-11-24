import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Droplets,
  QrCode,
  Building2,
  RefreshCw,
  History,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Share2,
  Search,
  ChevronDown,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  apiGetPdamOperators,
  apiInquiryPdam,
  apiCreatePdamOrder,
  apiGetPaymentStatus,
  apiVerifyPayment,
  apiGetPdamHistory,
  apiPayPdamDirect
} from '../../services/api';
import { generateQrisDataUrl } from '../../utils/qrisEngine';
import { useTheme } from '../../context/ThemeContext';
import UnpaidNoticeModal from '../UnpaidNoticeModal';
import UtilityQrisPaymentCard from './UtilityQrisPaymentCard';
import { awardUtilityLoyaltyPoints, formatRupiah } from './utilityFormatters';

const PAYMENT_METHODS = [
  {
    id: 'QRIS',
    name: 'QRIS Realtime (Semua E-Wallet & Bank)',
    desc: 'Scan via BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA',
    fee: 500
  }
];

const PDAM_GATEWAY_FEE = 500;

export default function PdamBillPanel({ user, roomNumber = '101', initialCustomerNumber = '' }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState('pay'); // 'pay' | 'history'
  const [step, setStep] = useState('form'); // 'form' | 'payment' | 'success'

  const [operators, setOperators] = useState([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState('PDAM_KOTA_SEMARANG');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOperatorDropdown, setShowOperatorDropdown] = useState(false);

  const effectiveRoom = user?.kamar || roomNumber || '101';
  const defaultPdamNo = initialCustomerNumber || user?.pdamMeterNo || `PDAM-SMG-${String(effectiveRoom).replace(/[^0-9]/g, '') || '701'}`;
  const [customerNumber, setCustomerNumber] = useState(defaultPdamNo);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');

  const [inquiryResult, setInquiryResult] = useState(null);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [unsupportedWarning, setUnsupportedWarning] = useState(null);

  const [activeOrder, setActiveOrder] = useState(null);
  const [qrisImage, setQrisImage] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [unpaidErrorMsg, setUnpaidErrorMsg] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900);

  const [settledData, setSettledData] = useState(null);

  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pollingRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setCustomerNumber(defaultPdamNo);
  }, [defaultPdamNo]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOperatorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const loadOperators = useCallback(async () => {
    try {
      const res = await apiGetPdamOperators();
      if (res?.success && Array.isArray(res.operators)) {
        setOperators(res.operators);
      }
    } catch (err) {
      console.warn('[PdamBillPanel] Load operators fallback:', err.message);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiGetPdamHistory({
        customerNumber,
        roomNumber: effectiveRoom,
        kostUid: user?.kostUid,
        userId: user?.id
      });
      if (res?.success) {
        setHistoryList(res.history || []);
      }
    } catch (err) {
      console.warn('[PdamBillPanel] Load history notice:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [customerNumber, effectiveRoom, user?.kostUid, user?.id]);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const filteredOperators = operators.filter(op =>
    op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (op.city && op.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedOperator = operators.find(op => op.id === selectedOperatorId) || operators[0] || {
    id: 'PDAM_KOTA_SEMARANG',
    name: 'PDAM Tirta Moedal Kota Semarang',
    region: 'Jawa Tengah',
    adminFee: 2500
  };

  const checkStatusSilently = useCallback(async (orderId) => {
    try {
      const res = await apiGetPaymentStatus(orderId);
      if (res?.isPaid || res?.status === 'settlement') {
        clearInterval(pollingRef.current);
        setSettledData({
          operatorName: res.operatorName || selectedOperator.name,
          customerNumber: res.pdamCustomerNumber || customerNumber,
          subscriberName: inquiryResult?.subscriberName || 'PELANGGAN KOSTKU',
          billingPeriod: res.billingPeriod || inquiryResult?.billingPeriod || 'Periode Berjalan',
          usageM3: res.usageM3 || inquiryResult?.usageM3 || 18,
          totalAmount: res.amount || (inquiryResult ? inquiryResult.totalAmount + PDAM_GATEWAY_FEE : 0),
          receiptNumber: res.pdamReceipt || res.receiptNumber,
          billerRef: res.billerRef || `TRP-PDAM-${Date.now()}`
        });
        awardUtilityLoyaltyPoints(100);
        setStep('success');
      }
    } catch (err) {
      console.warn('[PdamBillPanel] Silent polling notice:', err.message);
    }
  }, [selectedOperator.name, customerNumber, inquiryResult]);

  useEffect(() => {
    if (step !== 'payment' || !activeOrder?.orderId) return undefined;

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
  }, [step, activeOrder, checkStatusSilently]);

  const handleInquiry = async () => {
    if (!customerNumber || customerNumber.trim().length < 4) {
      setUnsupportedWarning('Masukkan nomor sambungan / ID Pelanggan PDAM minimal 4 digit.');
      return;
    }

    setInquiryLoading(true);
    setUnsupportedWarning(null);
    setInquiryResult(null);
    setOrderError(null);

    try {
      const res = await apiInquiryPdam({
        operatorId: selectedOperatorId,
        customerNumber: customerNumber.trim(),
        roomNumber: effectiveRoom,
        kostUid: user?.kostUid
      });

      if (res?.success) {
        setInquiryResult(res);
      } else if (res?.supported === false) {
        setUnsupportedWarning(res.message || 'Wilayah PDAM ini belum didukung oleh koneksi online resmi.');
      } else {
        setUnsupportedWarning(res?.message || 'Nomor sambungan PDAM tidak ditemukan.');
      }
    } catch (err) {
      setUnsupportedWarning(err.message || 'Gagal memeriksa tagihan PDAM.');
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleProceedPayment = async () => {
    if (!inquiryResult) return;
    setLoadingOrder(true);
    setOrderError(null);
    try {
      const payload = {
        operatorId: selectedOperator.id,
        customerNumber,
        billAmount: inquiryResult.billAmount,
        adminFee: inquiryResult.adminFee || 2500,
        paymentMethod,
        customerName: user?.name || 'Penghuni Kost',
        customerPhone: user?.phone || '08123456789',
        customerEmail: user?.email || 'penyewa@kostku.id',
        roomNumber: effectiveRoom,
        kostUid: user?.kostUid || null,
        userId: user?.id || null,
        billingPeriod: inquiryResult.billingPeriod,
        usageM3: inquiryResult.usageM3
      };

      const res = await apiCreatePdamOrder(payload);
      if (res?.success && res.transaction) {
        const trx = res.transaction;
        setActiveOrder(trx);
        setTimeLeft(900);

        if (trx.paymentMethod === 'QRIS') {
          if (trx.qrCodeUrl && typeof trx.qrCodeUrl === 'string' && (trx.qrCodeUrl.startsWith('data:') || trx.qrCodeUrl.startsWith('http'))) {
            setQrisImage(trx.qrCodeUrl);
          } else {
            const fallbackQr = await generateQrisDataUrl({
              amount: trx.amount,
              orderId: trx.orderId,
              merchantName: 'KOSTKU PDAM WATER BILL',
              qrString: trx.qrString
            });
            const validUrl = typeof fallbackQr === 'string' ? fallbackQr : (fallbackQr?.dataUrl || '');
            setQrisImage(validUrl);
          }
        }

        setStep('payment');
      }
    } catch (err) {
      console.error('[PdamBillPanel] Create order error:', err);
      try {
        const direct = await apiPayPdamDirect({
          operatorId: selectedOperator.id,
          customerNumber,
          roomNumber: effectiveRoom,
          kostUid: user?.kostUid,
          amount: inquiryResult.totalAmount + PDAM_GATEWAY_FEE
        });
        setSettledData({
          operatorName: selectedOperator.name,
          customerNumber,
          subscriberName: inquiryResult.subscriberName,
          billingPeriod: inquiryResult.billingPeriod,
          usageM3: inquiryResult.usageM3,
          totalAmount: inquiryResult.totalAmount + PDAM_GATEWAY_FEE,
          receiptNumber: direct.receiptNumber,
          billerRef: direct.billerRef
        });
        awardUtilityLoyaltyPoints(100);
        setStep('success');
      } catch (fallbackErr) {
        setOrderError(fallbackErr.message || err.message || 'Gagal memproses tagihan PDAM.');
      }
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleManualCheck = async () => {
    if (!activeOrder?.orderId) return;
    setCheckingPayment(true);
    setUnpaidErrorMsg(null);
    try {
      const res = await apiVerifyPayment({ orderId: activeOrder.orderId });
      if (res?.success && (res.status === 'settlement' || res.isPaid)) {
        clearInterval(pollingRef.current);
        setShowUnpaidModal(false);
        setSettledData({
          operatorName: res.operatorName || selectedOperator.name,
          customerNumber: res.pdamCustomerNumber || customerNumber,
          subscriberName: inquiryResult?.subscriberName || 'PELANGGAN KOSTKU',
          billingPeriod: res.billingPeriod || inquiryResult?.billingPeriod || 'Periode Berjalan',
          usageM3: res.usageM3 || inquiryResult?.usageM3 || 18,
          totalAmount: res.transaction?.amount || (inquiryResult ? inquiryResult.totalAmount + PDAM_GATEWAY_FEE : 0),
          receiptNumber: res.pdamReceipt || res.receiptNumber,
          billerRef: res.billerRef || `TRP-PDAM-${Date.now()}`
        });
        awardUtilityLoyaltyPoints(100);
        setStep('success');
      } else {
        setShowUnpaidModal(true);
      }
    } catch (err) {
      setUnpaidErrorMsg(err.message || 'Gagal memeriksa status pembayaran');
      setShowUnpaidModal(true);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!settledData) return;
    const msg = `*BUKTI PEMBAYARAN TAGIHAN AIR PDAM - KOSTKU*\n\n` +
      `• Biller: ${settledData.operatorName}\n` +
      `• No. Sambungan / IDPEL: ${settledData.customerNumber}\n` +
      `• Nama Pelanggan: ${settledData.subscriberName}\n` +
      `• Periode: ${settledData.billingPeriod}\n` +
      `• Pemakaian Air: ${settledData.usageM3} m³\n` +
      `• Total Bayar: Rp ${Number(settledData.totalAmount).toLocaleString('id-ID')}\n` +
      `• No. Referensi Biller: ${settledData.billerRef}\n` +
      `• Nomor Resi: ${settledData.receiptNumber}\n\n` +
      `*STATUS: LUNAS TERVERIFIKASI RESMI*\n` +
      `_Diproses otomatis via TriPay Payment Gateway & PPOB Biller._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const totalPdamBill = inquiryResult ? inquiryResult.totalAmount + PDAM_GATEWAY_FEE : 0;

  const cardSurfaceStyle = {
    background: isLight ? '#ffffff' : 'rgba(14, 23, 38, 0.9)',
    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    boxShadow: isLight ? 'var(--shadow-md)' : '0 16px 36px rgba(0, 0, 0, 0.35)'
  };

  return (
    <div className="animate-fade-in">
      {/* Sub-navigation bar inside PDAM */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
          }}>
            <Droplets size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                Tagihan Air PDAM (30+ Kota)
              </h2>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: isLight ? '#0284c7' : '#38bdf8',
                background: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(56, 189, 248, 0.15)',
                border: isLight ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(56, 189, 248, 0.3)',
                padding: '2px 7px',
                borderRadius: '6px'
              }}>
                TriPay T53543
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              Cek &amp; bayar tagihan air Kamar {effectiveRoom} atau pelanggan PDAM daerah resmi
            </p>
          </div>
        </div>

        {/* Pay vs History Switcher */}
        <div style={{
          display: 'inline-flex',
          padding: '4px',
          borderRadius: '12px',
          background: isLight ? '#e2e8f0' : 'rgba(15, 23, 42, 0.75)',
          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
          gap: '4px'
        }}>
          <button
            type="button"
            data-testid="pdam-subtab-pay"
            onClick={() => {
              setActiveTab('pay');
              if (step === 'success') setStep('form');
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'pay' ? (isLight ? '#ffffff' : '#0284c7') : 'transparent',
              color: activeTab === 'pay' ? (isLight ? '#0284c7' : '#ffffff') : (isLight ? '#475569' : '#94a3b8'),
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'pay' && isLight ? '0 1px 4px rgba(15, 23, 42, 0.1)' : 'none'
            }}
          >
            <Droplets size={14} /> Cek &amp; Bayar
          </button>

          <button
            type="button"
            data-testid="pdam-subtab-history"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'history' ? (isLight ? '#ffffff' : '#0284c7') : 'transparent',
              color: activeTab === 'history' ? (isLight ? '#0284c7' : '#ffffff') : (isLight ? '#475569' : '#94a3b8'),
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'history' && isLight ? '0 1px 4px rgba(15, 23, 42, 0.1)' : 'none'
            }}
          >
            <History size={14} /> Riwayat PDAM
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div style={cardSurfaceStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.84rem', color: isLight ? '#475569' : '#94a3b8', fontWeight: 700 }}>
              Riwayat Pembayaran Air Kamar {effectiveRoom}:
            </span>
            <button
              type="button"
              onClick={loadHistory}
              disabled={historyLoading}
              style={{
                background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isLight ? '#334155' : '#cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} /> Segarkan
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: isLight ? '#64748b' : '#94a3b8' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Memuat riwayat transaksi PDAM...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.45)',
              borderRadius: '16px',
              border: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <Droplets size={32} color={isLight ? '#94a3b8' : '#64748b'} style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: isLight ? '#1e293b' : '#cbd5e1', fontWeight: 700 }}>
                Belum Ada Riwayat PDAM
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Bukti lunas tagihan PDAM yang dibayar via TriPay akan otomatis tersimpan di sini.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: isLight ? '#0284c7' : '#38bdf8', display: 'block' }}>
                        {formatRupiah(item.amount)} ({item.billingPeriod || 'Periode Berjalan'})
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                        {item.operatorName} • {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: item.status === 'settlement' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: item.status === 'settlement' ? '#16a34a' : (isLight ? '#b45309' : '#fbbf24'),
                      whiteSpace: 'nowrap'
                    }}>
                      {item.status === 'settlement' ? '✓ Lunas' : 'Menunggu Bayar'}
                    </span>
                  </div>

                  <div style={{
                    background: isLight ? '#ffffff' : '#070f1e',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '0.72rem',
                    color: isLight ? '#475569' : '#cbd5e1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span>No. Resi: <strong style={{ color: isLight ? '#0f172a' : 'white', fontFamily: 'var(--font-mono)' }}>{item.receiptNumber || item.pdamReceipt || '-'}</strong></span>
                    <span>Ref Biller: <strong style={{ color: isLight ? '#0284c7' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>{item.billerRef || '-'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : step === 'success' ? (
        <div style={{ ...cardSurfaceStyle, maxWidth: '620px', margin: '0 auto', textAlign: 'center' }}>
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
            ✓ TAGIHAN AIR PDAM LUNAS TERVERIFIKASI
          </span>
          <h3 style={{ margin: '4px 0 8px', fontSize: '1.25rem', color: isLight ? '#0f172a' : 'white', fontWeight: 900 }}>
            Pembayaran Berhasil!
          </h3>

          {localStorage.getItem('kostUser') && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.15)',
              border: '1px solid #86efac',
              borderRadius: '10px',
              padding: '6px 14px',
              color: isLight ? '#166534' : '#86efac',
              fontSize: '0.78rem',
              fontWeight: 800,
              marginBottom: '14px'
            }}>
              <Sparkles size={16} style={{ flexShrink: 0 }} />
              <span>+100 Poin Loyalty Berhasil Dikreditkan!</span>
            </div>
          )}

          <div style={{
            background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1.5px solid rgba(2, 132, 199, 0.35)' : '1.5px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'left',
            fontSize: '0.8rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '6px', gap: '8px' }}>
              <span>Biller PDAM:</span>
              <strong style={{ color: isLight ? '#0f172a' : 'white', textAlign: 'right' }}>{settledData?.operatorName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '6px' }}>
              <span>No. Sambungan:</span>
              <strong style={{ color: isLight ? '#0f172a' : 'white', fontFamily: 'var(--font-mono)' }}>{settledData?.customerNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '6px' }}>
              <span>Nama Pelanggan:</span>
              <strong style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>{settledData?.subscriberName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '6px' }}>
              <span>Periode / Kubikasi:</span>
              <strong style={{ color: isLight ? '#0f172a' : 'white' }}>{settledData?.billingPeriod} ({settledData?.usageM3} m³)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '6px' }}>
              <span>Total Tagihan:</span>
              <strong style={{ color: '#16a34a' }}>{formatRupiah(settledData?.totalAmount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#64748b' : '#94a3b8', borderTop: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '6px' }}>
              <span>Ref Biller:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: isLight ? '#0284c7' : '#38bdf8' }}>{settledData?.billerRef}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
              <span>Nomor Resi Resmi:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: isLight ? '#0f172a' : 'white' }}>{settledData?.receiptNumber}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              style={{
                flex: 1,
                minWidth: '170px',
                background: isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.15)',
                border: isLight ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '12px',
                padding: '11px',
                color: isLight ? '#15803d' : '#4ade80',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Share2 size={16} /> Kirim Resi ke WhatsApp
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setInquiryResult(null);
                setActiveOrder(null);
                setSettledData(null);
              }}
              className="btn btn-primary"
              style={{
                flex: 1,
                minWidth: '170px',
                justifyContent: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.84rem',
                borderRadius: '12px'
              }}
            >
              <Droplets size={16} /> Selesai
            </button>
          </div>
        </div>
      ) : (
        <div className="utilitas-two-col">
          {/* Left Column: Operator & Customer ID Inquiry */}
          <div style={cardSurfaceStyle}>
            {step === 'payment' ? (
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isLight ? '#0284c7' : '#38bdf8',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Detail Tagihan Air PDAM
                </span>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Menunggu Pembayaran QRIS
                </h3>

                <div style={{
                  background: isLight ? '#f0f9ff' : 'rgba(15, 23, 42, 0.65)',
                  border: isLight ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '0.84rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Biller PDAM</span>
                    <strong style={{ color: isLight ? '#0f172a' : '#f8fafc', textAlign: 'right' }}>{selectedOperator.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>No. Sambungan</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: isLight ? '#0f172a' : '#f8fafc' }}>{customerNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Nama Pelanggan</span>
                    <strong style={{ color: isLight ? '#0284c7' : '#38bdf8', textAlign: 'right' }}>{inquiryResult?.subscriberName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Periode / Pemakaian</span>
                    <strong style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{inquiryResult?.billingPeriod} ({inquiryResult?.usageM3} m³)</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Searchable PDAM Operator Selector */}
                <div ref={dropdownRef} style={{ marginBottom: '1.25rem' }}>
                  <label style={{
                    fontSize: '0.8rem',
                    color: isLight ? '#475569' : '#cbd5e1',
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: 700
                  }}>
                    Pilih Wilayah / Biller PDAM Resmi (Tersedia 30+ Kota):
                  </label>

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      data-testid="pdam-operator-toggle"
                      onClick={() => setShowOperatorDropdown(prev => !prev)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '12px',
                        padding: '11px 14px',
                        color: isLight ? '#0f172a' : 'white',
                        fontSize: '0.86rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <strong style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>{selectedOperator.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                          Wilayah: {selectedOperator.region} {selectedOperator.city ? `• ${selectedOperator.city}` : ''}
                        </span>
                      </div>
                      <ChevronDown size={18} color={isLight ? '#64748b' : '#94a3b8'} />
                    </button>

                    {showOperatorDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '105%',
                        left: 0,
                        right: 0,
                        background: isLight ? '#ffffff' : '#0d192e',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '12px',
                        zIndex: 25,
                        maxHeight: '240px',
                        overflowY: 'auto',
                        boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.12)' : '0 10px 30px rgba(0,0,0,0.85)'
                      }}>
                        <div style={{
                          padding: '8px',
                          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                          position: 'sticky',
                          top: 0,
                          background: isLight ? '#ffffff' : '#0d192e'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.9)',
                            padding: '6px 10px',
                            borderRadius: '8px'
                          }}>
                            <Search size={14} color={isLight ? '#64748b' : '#94a3b8'} />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Cari kota / kabupaten PDAM..."
                              style={{
                                background: 'none',
                                border: 'none',
                                color: isLight ? '#0f172a' : 'white',
                                fontSize: '0.78rem',
                                outline: 'none',
                                width: '100%'
                              }}
                            />
                          </div>
                        </div>

                        {filteredOperators.length === 0 ? (
                          <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.76rem', color: '#ef4444' }}>
                            <AlertTriangle size={16} style={{ margin: '0 auto 4px', display: 'block' }} />
                            Wilayah PDAM &ldquo;{searchQuery}&rdquo; belum didukung oleh koneksi online resmi.
                          </div>
                        ) : (
                          filteredOperators.map(op => (
                            <div
                              key={op.id}
                              onClick={() => {
                                setSelectedOperatorId(op.id);
                                setShowOperatorDropdown(false);
                                setUnsupportedWarning(null);
                                setInquiryResult(null);
                              }}
                              style={{
                                padding: '10px 14px',
                                borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                                background: selectedOperatorId === op.id ? (isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)') : 'transparent',
                                color: selectedOperatorId === op.id ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#1e293b' : '#e2e8f0'),
                                fontSize: '0.82rem'
                              }}
                            >
                              <strong>{op.name}</strong>
                              <span style={{ display: 'block', fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                                {op.region} {op.city ? `• ${op.city}` : ''}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Number Input */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    htmlFor="pdam-customer-input"
                    style={{
                      fontSize: '0.8rem',
                      color: isLight ? '#475569' : '#cbd5e1',
                      display: 'block',
                      marginBottom: '6px',
                      fontWeight: 700
                    }}
                  >
                    Nomor Sambungan / ID Pelanggan PDAM:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      id="pdam-customer-input"
                      type="text"
                      value={customerNumber}
                      onChange={(e) => {
                        setCustomerNumber(e.target.value);
                        setInquiryResult(null);
                        setUnsupportedWarning(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInquiry();
                        }
                      }}
                      placeholder="Contoh: 01029384 atau PDAM-SMG-701"
                      style={{
                        flex: 1,
                        minWidth: '190px',
                        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '12px',
                        padding: '11px 14px',
                        color: isLight ? '#0f172a' : 'white',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.96rem',
                        letterSpacing: '0.8px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      data-testid="pdam-check-bill"
                      onClick={handleInquiry}
                      disabled={inquiryLoading || !customerNumber}
                      style={{
                        background: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.18)',
                        border: isLight ? '1px solid rgba(2, 132, 199, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: '12px',
                        padding: '11px 16px',
                        color: isLight ? '#0284c7' : '#38bdf8',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: inquiryLoading ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {inquiryLoading ? 'Mengecek...' : 'Cek Tagihan'}
                    </button>
                  </div>

                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                      Default Kamar {effectiveRoom}. Anda bebas mengganti ke nomor sambungan lain.
                    </span>
                    {customerNumber !== defaultPdamNo && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerNumber(defaultPdamNo);
                          setInquiryResult(null);
                          setUnsupportedWarning(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isLight ? '#0284c7' : '#38bdf8',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        Reset ke Kamar {effectiveRoom}
                      </button>
                    )}
                  </div>
                </div>

                {unsupportedWarning && (
                  <div style={{
                    background: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.12)',
                    border: isLight ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#ef4444', display: 'block', marginBottom: '2px' }}>
                        Peringatan Biller PDAM
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: isLight ? '#b91c1c' : '#fca5a5', lineHeight: 1.45 }}>
                        {unsupportedWarning}
                      </p>
                    </div>
                  </div>
                )}

                {inquiryResult && (
                  <div style={{
                    background: isLight ? '#f0f9ff' : 'rgba(15, 23, 42, 0.85)',
                    border: isLight ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '16px',
                    padding: '1.15rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      borderBottom: isLight ? '1px solid rgba(2, 132, 199, 0.15)' : '1px solid rgba(255,255,255,0.08)',
                      paddingBottom: '8px',
                      gap: '8px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>
                          NAMA PELANGGAN RESMI
                        </span>
                        <strong style={{ fontSize: '0.92rem', color: isLight ? '#0f172a' : 'white' }}>
                          {inquiryResult.subscriberName}
                        </strong>
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        background: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                        color: isLight ? '#b45309' : '#fbbf24',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap'
                      }}>
                        BELUM LUNAS
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.78rem' }}>
                      <div>
                        <span style={{ color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>Periode Tagihan:</span>
                        <strong style={{ color: isLight ? '#1e293b' : '#cbd5e1' }}>{inquiryResult.billingPeriod}</strong>
                      </div>
                      <div>
                        <span style={{ color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>Pemakaian Kubikasi:</span>
                        <strong style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>
                          {inquiryResult.usageM3} m³ ({inquiryResult.meterStart} - {inquiryResult.meterEnd})
                        </strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px', borderTop: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                      <label style={{ fontSize: '0.76rem', color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                        Metode Pembayaran (TriPay Payment Gateway):
                      </label>
                      {PAYMENT_METHODS.map(m => (
                        <div
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: paymentMethod === m.id
                              ? (isLight ? '1.5px solid #0284c7' : '1.5px solid #38bdf8')
                              : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
                            background: paymentMethod === m.id
                              ? (isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.12)')
                              : (isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.5)'),
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {m.id === 'QRIS' ? <QrCode size={17} color="#10b981" /> : <Building2 size={17} color={isLight ? '#0284c7' : '#38bdf8'} />}
                            <div>
                              <span style={{ fontSize: '0.8rem', color: isLight ? '#0f172a' : 'white', fontWeight: 700, display: 'block' }}>{m.name}</span>
                              <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8' }}>{m.desc}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            +Rp {m.fee.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Summary or Active QRIS Checkout */}
          <div style={cardSurfaceStyle}>
            {step === 'payment' ? (
              <UtilityQrisPaymentCard
                isLight={isLight}
                accentColor={isLight ? '#0284c7' : '#38bdf8'}
                timeLeft={timeLeft}
                activeOrder={activeOrder}
                qrisImage={qrisImage}
                fallbackAmount={totalPdamBill}
                fallbackMerchantName="KOSTKU PDAM WATER BILL"
                scanTitle="SCAN QRIS TAGIHAN AIR PDAM"
                amountLabel="Total Tagihan"
                checkoutLinkLabel="Buka Halaman Checkout TriPay"
                backButtonLabel="Ganti Tagihan"
                helperNote="Begitu pembayaran lunas, server PDAM daerah akan langsung menandai tagihan Anda lunas dan menerbitkan resi sah."
                checkingPayment={checkingPayment}
                onBack={() => setStep('form')}
                onManualCheck={handleManualCheck}
              />
            ) : inquiryResult ? (
              <div>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Rincian Tagihan PDAM
                </h3>

                <div style={{
                  background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.78)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '14px',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: isLight ? '#475569' : '#94a3b8' }}>
                    <span>Biaya Pemakaian Air:</span>
                    <span style={{ color: isLight ? '#0f172a' : 'white', fontWeight: 700 }}>{formatRupiah(inquiryResult.billAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: isLight ? '#475569' : '#94a3b8' }}>
                    <span>Biaya Admin Biller Loket PDAM:</span>
                    <span style={{ color: isLight ? '#0f172a' : 'white', fontWeight: 700 }}>{formatRupiah(inquiryResult.adminFee || 2500)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: isLight ? '#475569' : '#94a3b8' }}>
                    <span>Biaya Layanan Gateway QRIS:</span>
                    <span style={{ color: isLight ? '#0f172a' : 'white', fontWeight: 700 }}>{formatRupiah(PDAM_GATEWAY_FEE)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255,255,255,0.12)',
                    paddingTop: '10px',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontSize: '0.88rem', color: isLight ? '#475569' : '#94a3b8', fontWeight: 700 }}>Total Tagihan Lunas:</span>
                    <strong style={{ fontSize: '1.15rem', color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 900 }}>
                      {formatRupiah(totalPdamBill)}
                    </strong>
                  </div>
                </div>

                {orderError && (
                  <div style={{
                    marginBottom: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: isLight ? '#b91c1c' : '#fca5a5',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}>
                    {orderError}
                  </div>
                )}

                <button
                  type="button"
                  data-testid="pdam-submit-payment"
                  onClick={handleProceedPayment}
                  disabled={loadingOrder}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    fontWeight: 800,
                    padding: '13px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
                    fontSize: '0.92rem'
                  }}
                >
                  <Droplets size={17} /> {loadingOrder ? 'Membuat Tagihan QRIS...' : `Bayar ${formatRupiah(totalPdamBill)} via QRIS`}
                </button>
              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '1.5rem 0.75rem',
                gap: '10px'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(56, 189, 248, 0.14)',
                  color: isLight ? '#0284c7' : '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <Droplets size={26} />
                </div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Siap Cek Tagihan PDAM
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.5 }}>
                  Pilih wilayah PDAM kota Anda lalu tekan <strong>Cek Tagihan</strong> untuk menampilkan rincian kubikasi, periode, dan total bayar QRIS.
                </p>
                <div style={{
                  marginTop: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  color: isLight ? '#0369a1' : '#7dd3fc',
                  fontWeight: 600
                }}>
                  <ShieldCheck size={15} /> Terhubung ke 30+ Biller PDAM Resmi via TriPay
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <UnpaidNoticeModal
        isOpen={showUnpaidModal}
        onClose={() => setShowUnpaidModal(false)}
        onRetry={handleManualCheck}
        isRetrying={checkingPayment}
        amount={activeOrder?.amount || totalPdamBill}
        orderId={activeOrder?.orderId}
        paymentMethod="QRIS Realtime (TriPay)"
        serviceName={`Tagihan Air PDAM (${selectedOperator?.name || 'PDAM'})`}
        message={unpaidErrorMsg || 'Sistem belum menerima konfirmasi pembayaran dari QRIS. Jika Anda baru saja melakukan transfer atau scan di aplikasi perbankan/e-wallet, mohon tunggu 5–15 detik agar mutasi berhasil diverifikasi oleh gateway.'}
      />
    </div>
  );
}
