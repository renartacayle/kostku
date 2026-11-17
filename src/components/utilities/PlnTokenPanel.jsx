import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  Copy,
  Check,
  Sparkles,
  QrCode,
  Building2,
  RefreshCw,
  History,
  CheckCircle2,
  Share2,
  ShieldCheck
} from 'lucide-react';
import {
  apiInquiryPln,
  apiCreateElectricityOrder,
  apiGetPaymentStatus,
  apiVerifyPayment,
  apiGetElectricityHistory,
  apiTopUpElectricity
} from '../../services/api';
import { generateQrisDataUrl } from '../../utils/qrisEngine';
import { useTheme } from '../../context/ThemeContext';
import UnpaidNoticeModal from '../UnpaidNoticeModal';
import UtilityQrisPaymentCard from './UtilityQrisPaymentCard';
import { awardUtilityLoyaltyPoints, formatRupiah } from './utilityFormatters';

const NOMINAL_OPTIONS = [
  { value: 20000, label: 'Rp 20.000', kwh: 13.8 },
  { value: 50000, label: 'Rp 50.000', kwh: 34.6 },
  { value: 100000, label: 'Rp 100.000', kwh: 69.2 },
  { value: 200000, label: 'Rp 200.000', kwh: 138.4 },
  { value: 500000, label: 'Rp 500.000', kwh: 346.1 }
];

const PAYMENT_METHODS = [
  {
    id: 'QRIS',
    name: 'QRIS Realtime (Semua E-Wallet & Mobile Banking)',
    desc: 'Scan via BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA',
    fee: 100
  }
];

const PLN_GATEWAY_FEE = 100;

export default function PlnTokenPanel({ user, roomNumber = '101', initialMeterNumber = '' }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState('buy'); // 'buy' | 'history'
  const [step, setStep] = useState('form'); // 'form' | 'payment' | 'success'

  const effectiveRoom = user?.kamar || roomNumber || '101';
  const defaultMeter = initialMeterNumber || user?.meterNumber || `14120938${String(effectiveRoom).replace(/[^0-9]/g, '').padStart(3, '0')}`;
  const [meterNumber, setMeterNumber] = useState(defaultMeter);
  const [nominal, setNominal] = useState(50000);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');

  const [inquiryData, setInquiryData] = useState({
    subscriberName: user?.name ? `${user.name.toUpperCase()} / KM ${effectiveRoom}` : 'PELANGGAN KOSTKU',
    segmentPower: 'R1M / 900 VA'
  });
  const [inquiryLoading, setInquiryLoading] = useState(false);

  const [activeOrder, setActiveOrder] = useState(null);
  const [qrisImage, setQrisImage] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [unpaidErrorMsg, setUnpaidErrorMsg] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900);

  const [settledData, setSettledData] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pollingRef = useRef(null);

  useEffect(() => {
    setMeterNumber(defaultMeter);
  }, [defaultMeter]);

  useEffect(() => {
    setInquiryData(prev => ({
      ...prev,
      subscriberName: user?.name ? `${user.name.toUpperCase()} / KM ${effectiveRoom}` : 'PELANGGAN KOSTKU'
    }));
  }, [user?.name, effectiveRoom]);

  const handleInquiry = useCallback(async (customMeter = null) => {
    const targetMeter = customMeter || meterNumber;
    if (!targetMeter || targetMeter.length < 8) return;
    setInquiryLoading(true);
    try {
      const res = await apiInquiryPln(targetMeter);
      if (res?.success) {
        setInquiryData({
          subscriberName: res.subscriberName || 'PELANGGAN KOSTKU',
          segmentPower: res.segmentPower || 'R1M / 900 VA'
        });
      }
    } catch (err) {
      console.warn('[PlnTokenPanel] Inquiry notice:', err.message);
    } finally {
      setInquiryLoading(false);
    }
  }, [meterNumber]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiGetElectricityHistory({
        meterNumber,
        roomNumber: effectiveRoom,
        kostUid: user?.kostUid,
        userId: user?.id
      });
      if (res?.success) {
        setHistoryList(res.history || []);
      }
    } catch (err) {
      console.warn('[PlnTokenPanel] History fetch notice:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [meterNumber, effectiveRoom, user?.kostUid, user?.id]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  useEffect(() => {
    if (meterNumber && meterNumber.length >= 8) {
      const timer = setTimeout(() => {
        handleInquiry(meterNumber);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [meterNumber, handleInquiry]);

  const checkStatusSilently = useCallback(async (orderId) => {
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
        awardUtilityLoyaltyPoints(100);
        setStep('success');
      }
    } catch (err) {
      console.warn('[PlnTokenPanel] Silent polling notice:', err.message);
    }
  }, [nominal, meterNumber, inquiryData.subscriberName]);

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

  const handleProceedPayment = async () => {
    if (!meterNumber || meterNumber.length < 8) {
      setOrderError('Masukkan Nomor Meter PLN minimal 8 digit terlebih dahulu.');
      return;
    }
    setOrderError(null);
    setLoadingOrder(true);
    try {
      const payload = {
        meterNumber,
        nominal,
        paymentMethod,
        customerName: user?.name || 'Penghuni Kost',
        customerPhone: user?.phone || '08123456789',
        customerEmail: user?.email || 'penyewa@kostku.id',
        roomNumber: effectiveRoom,
        kostUid: user?.kostUid || null,
        userId: user?.id || null
      };

      const res = await apiCreateElectricityOrder(payload);
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
              merchantName: 'KOSTKU TRIPAY MERCHANT',
              qrString: trx.qrString
            });
            const validUrl = typeof fallbackQr === 'string' ? fallbackQr : (fallbackQr?.dataUrl || '');
            setQrisImage(validUrl);
          }
        }

        setStep('payment');
      }
    } catch (err) {
      console.error('[PlnTokenPanel] Create order error:', err);
      try {
        const direct = await apiTopUpElectricity({
          kostUid: user?.kostUid,
          roomNumber: effectiveRoom,
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
        awardUtilityLoyaltyPoints(100);
        setStep('success');
      } catch (fallbackErr) {
        setOrderError(fallbackErr.message || err.message || 'Gagal memproses transaksi Token PLN.');
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
          token: res.electricityToken || res.transaction?.electricityToken,
          kwhAdded: res.kwhAdded || Math.round((nominal / 1444.7) * 10) / 10,
          nominal: res.transaction?.amount || nominal,
          meterNumber: res.meterNumber || meterNumber,
          subscriberName: res.customerPlnName || inquiryData.subscriberName,
          receiptNumber: res.receiptNumber,
          paymentMethod: res.transaction?.paymentMethod || activeOrder.paymentMethod
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

  const handleCopyToken = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!settledData?.token) return;
    const msg = `*BUKTI PEMBELIAN TOKEN LISTRIK PLN - KOSTKU*\n\n` +
      `• No. Meter / IDPEL: ${settledData.meterNumber}\n` +
      `• Nama Pelanggan: ${settledData.subscriberName}\n` +
      `• Nominal: Rp ${Number(settledData.nominal).toLocaleString('id-ID')}\n` +
      `• Tambahan Daya: +${settledData.kwhAdded} kWh\n` +
      `• No. Referensi: ${settledData.receiptNumber}\n\n` +
      `*KODE TOKEN PLN (20 DIGIT):*\n` +
      `*${settledData.token}*\n\n` +
      `_Status: Lunas Terverifikasi via TriPay Payment Gateway (Merchant T53543)._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const selectedNominalOpt = NOMINAL_OPTIONS.find(opt => opt.value === nominal) || NOMINAL_OPTIONS[1];
  const totalPayment = nominal + PLN_GATEWAY_FEE;

  const cardSurfaceStyle = {
    background: isLight ? '#ffffff' : 'rgba(14, 23, 38, 0.9)',
    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    boxShadow: isLight ? 'var(--shadow-md)' : '0 16px 36px rgba(0, 0, 0, 0.35)'
  };

  return (
    <div className="animate-fade-in">
      {/* Sub-navigation bar inside PLN */}
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
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
          }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                Token Listrik PLN Prabayar
              </h2>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: isLight ? '#b45309' : '#fbbf24',
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '2px 7px',
                borderRadius: '6px'
              }}>
                TriPay T53543
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              Isi ulang mandiri Kamar {effectiveRoom} atau nomor meter PLN lain 24 jam
            </p>
          </div>
        </div>

        {/* Buy vs History Switcher */}
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
            data-testid="pln-subtab-buy"
            onClick={() => {
              setActiveTab('buy');
              if (step === 'success') setStep('form');
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'buy' ? (isLight ? '#ffffff' : '#d97706') : 'transparent',
              color: activeTab === 'buy' ? (isLight ? '#b45309' : '#ffffff') : (isLight ? '#475569' : '#94a3b8'),
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'buy' && isLight ? '0 1px 4px rgba(15, 23, 42, 0.1)' : 'none'
            }}
          >
            <Zap size={14} /> Beli Token
          </button>

          <button
            type="button"
            data-testid="pln-subtab-history"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'history' ? (isLight ? '#ffffff' : '#d97706') : 'transparent',
              color: activeTab === 'history' ? (isLight ? '#b45309' : '#ffffff') : (isLight ? '#475569' : '#94a3b8'),
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'history' && isLight ? '0 1px 4px rgba(15, 23, 42, 0.1)' : 'none'
            }}
          >
            <History size={14} /> Riwayat Token
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div style={cardSurfaceStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.84rem', color: isLight ? '#475569' : '#94a3b8', fontWeight: 700 }}>
              Daftar Token Kamar {effectiveRoom} / Meter {meterNumber}:
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
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Memuat riwayat transaksi token...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.45)',
              borderRadius: '16px',
              border: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <Zap size={32} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: isLight ? '#0f172a' : '#cbd5e1', fontWeight: 700 }}>
                Belum Ada Riwayat Token
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Token listrik PLN yang dibeli akan otomatis tersimpan rapi di sini.
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
                      <strong style={{ fontSize: '0.9rem', color: '#d97706', display: 'block' }}>
                        {formatRupiah(item.plnNominal || item.amount)} (+{item.kwhAdded || item.kwhEstimated || 0} kWh)
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                        {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: item.status === 'settlement' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: item.status === 'settlement' ? '#16a34a' : '#d97706',
                      whiteSpace: 'nowrap'
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
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        color: isLight ? '#92400e' : '#f8fafc',
                        letterSpacing: '0.5px',
                        overflowWrap: 'anywhere'
                      }}>
                        {item.electricityToken}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyToken(item.electricityToken)}
                        style={{
                          background: isLight ? '#fef3c7' : 'rgba(255, 255, 255, 0.08)',
                          border: isLight ? '1px solid #fde68a' : 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          color: isLight ? '#92400e' : '#cbd5e1',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
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
            ✓ PEMBAYARAN LUNAS (TRIPAY PPOB)
          </span>
          <h3 style={{ margin: '4px 0 8px', fontSize: '1.25rem', color: isLight ? '#0f172a' : 'white', fontWeight: 900 }}>
            Token Listrik Berhasil Diterbitkan!
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
            background: isLight ? '#fffbeb' : '#070d19',
            border: isLight ? '2px solid #f59e0b' : '2px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '18px',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            boxShadow: isLight ? '0 10px 25px rgba(245, 158, 11, 0.15)' : '0 0 30px rgba(245, 158, 11, 0.2)'
          }}>
            <span style={{ fontSize: '0.72rem', color: isLight ? '#92400e' : '#94a3b8', display: 'block', fontWeight: 700 }}>
              MASUKKAN 20 DIGIT KE METERAN PLN:
            </span>

            <strong style={{
              fontSize: 'clamp(1.15rem, 3vw, 1.5rem)',
              color: isLight ? '#b45309' : '#fbbf24',
              display: 'block',
              letterSpacing: '2px',
              margin: '10px 0',
              fontFamily: 'var(--font-mono)',
              overflowWrap: 'anywhere'
            }}>
              {settledData?.token}
            </strong>

            <button
              type="button"
              onClick={() => handleCopyToken(settledData?.token)}
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

          <div style={{
            background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px 14px',
            textAlign: 'left',
            fontSize: '0.8rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px' }}>
              <span>No. Meter / IDPEL:</span>
              <strong style={{ color: isLight ? '#0f172a' : 'white', fontFamily: 'var(--font-mono)' }}>{settledData?.meterNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px' }}>
              <span>Nama Pelanggan:</span>
              <strong style={{ color: isLight ? '#0f172a' : 'white' }}>{settledData?.subscriberName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px' }}>
              <span>Tambahan Daya:</span>
              <strong style={{ color: '#16a34a' }}>+{settledData?.kwhAdded} kWh</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8', borderTop: isLight ? '1px dashed #e2e8f0' : '1px dashed rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '6px' }}>
              <span>Nomor Resi / Referensi:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#d97706' }}>{settledData?.receiptNumber}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              style={{
                flex: 1,
                minWidth: '170px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '12px',
                padding: '11px',
                color: '#16a34a',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
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
                minWidth: '170px',
                justifyContent: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.84rem',
                borderRadius: '12px'
              }}
            >
              <Zap size={16} /> Beli Token Lagi
            </button>
          </div>
        </div>
      ) : (
        <div className="utilitas-two-col">
          {/* Left Column: Form & Configuration */}
          <div style={cardSurfaceStyle}>
            {step === 'payment' ? (
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#d97706',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Detail Pesanan Token Listrik
                </span>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Menunggu Pembayaran QRIS
                </h3>

                <div style={{
                  background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.65)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '0.84rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>No. Meter / IDPEL</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: isLight ? '#0f172a' : '#f8fafc' }}>{meterNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Nama Pelanggan</span>
                    <strong style={{ color: isLight ? '#0f172a' : '#f8fafc', textAlign: 'right' }}>{inquiryData.subscriberName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Tarif / Daya</span>
                    <strong style={{ color: '#d97706' }}>{inquiryData.segmentPower}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Nominal &amp; Estimasi kWh</span>
                    <strong style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{formatRupiah(nominal)} (~{selectedNominalOpt.kwh} kWh)</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Meter Number Input */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    htmlFor="pln-meter-input"
                    style={{
                      fontSize: '0.8rem',
                      color: isLight ? '#475569' : '#cbd5e1',
                      display: 'block',
                      marginBottom: '6px',
                      fontWeight: 700
                    }}
                  >
                    Nomor Meter PLN / ID Pelanggan (11–12 Digit):
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      id="pln-meter-input"
                      type="text"
                      inputMode="numeric"
                      value={meterNumber}
                      onChange={(e) => {
                        setMeterNumber(e.target.value.replace(/[^0-9]/g, ''));
                        setOrderError(null);
                      }}
                      placeholder="Contoh: 14120938472"
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
                        letterSpacing: '1px',
                        outline: 'none'
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
                        padding: '11px 16px',
                        color: isLight ? '#b45309' : '#fbbf24',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: inquiryLoading ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {inquiryLoading ? 'Memeriksa...' : 'Cek Pelanggan'}
                    </button>
                  </div>

                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                      Default Kamar {effectiveRoom}. Bisa diganti bebas ke meteran mana saja.
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

                  <div style={{
                    marginTop: '10px',
                    background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.08)',
                    border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>
                        NAMA PELANGGAN PLN
                      </span>
                      <strong style={{ fontSize: '0.86rem', color: isLight ? '#0f172a' : '#f8fafc' }}>
                        {inquiryData.subscriberName}
                      </strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.68rem', color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>
                        TARIF / DAYA
                      </span>
                      <strong style={{ fontSize: '0.86rem', color: '#d97706' }}>
                        {inquiryData.segmentPower}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Nominal Selector Grid */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{
                    fontSize: '0.8rem',
                    color: isLight ? '#475569' : '#cbd5e1',
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 700
                  }}>
                    Pilih Nominal Token Listrik:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '8px' }}>
                    {NOMINAL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNominal(opt.value)}
                        style={{
                          padding: '12px 8px',
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
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        {opt.label}
                        <span style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          color: nominal === opt.value ? (isLight ? '#b45309' : '#fde68a') : (isLight ? '#64748b' : '#94a3b8'),
                          marginTop: '3px',
                          fontWeight: 600
                        }}>
                          ~{opt.kwh} kWh
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label style={{
                    fontSize: '0.8rem',
                    color: isLight ? '#475569' : '#cbd5e1',
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 700
                  }}>
                    Metode Pembayaran (TriPay Payment Gateway):
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PAYMENT_METHODS.map(m => (
                      <div
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: paymentMethod === m.id
                            ? '1.5px solid #d97706'
                            : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
                          background: paymentMethod === m.id
                            ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.12)')
                            : (isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)'),
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {m.id === 'QRIS' ? <QrCode size={20} color="#16a34a" /> : <Building2 size={20} color="#2563eb" />}
                          <div>
                            <strong style={{ fontSize: '0.84rem', color: isLight ? '#0f172a' : 'white', display: 'block' }}>{m.name}</strong>
                            <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>{m.desc}</span>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: isLight ? '#92400e' : '#fbbf24',
                          whiteSpace: 'nowrap'
                        }}>
                          +Rp {m.fee.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Summary / Active QRIS Checkout */}
          <div style={cardSurfaceStyle}>
            {step === 'payment' ? (
              <UtilityQrisPaymentCard
                isLight={isLight}
                accentColor="#d97706"
                timeLeft={timeLeft}
                activeOrder={activeOrder}
                qrisImage={qrisImage}
                fallbackAmount={totalPayment}
                fallbackMerchantName="KOSTKU TRIPAY MERCHANT"
                scanTitle="SCAN QRIS RESMI TRIPAY"
                amountLabel="Nominal"
                checkoutLinkLabel="Buka Halaman Pembayaran TriPay"
                backButtonLabel="Ganti Nominal"
                helperNote="Sistem mendeteksi pembayaran secara real-time. Token 20 digit akan otomatis muncul begitu transaksi lunas."
                checkingPayment={checkingPayment}
                onBack={() => setStep('form')}
                onManualCheck={handleManualCheck}
              />
            ) : (
              <div>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Ringkasan Transaksi PLN
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
                    <span>No. Meter PLN:</span>
                    <strong style={{ color: isLight ? '#0f172a' : 'white', fontFamily: 'var(--font-mono)' }}>{meterNumber || '-'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: isLight ? '#475569' : '#94a3b8' }}>
                    <span>Estimasi Tambahan Daya:</span>
                    <strong style={{ color: '#16a34a' }}>+{selectedNominalOpt.kwh} kWh</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: isLight ? '#475569' : '#94a3b8' }}>
                    <span>Nominal Token PLN:</span>
                    <span style={{ color: isLight ? '#0f172a' : 'white', fontWeight: 700 }}>{formatRupiah(nominal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: isLight ? '#475569' : '#94a3b8' }}>
                    <span>Biaya Admin Biller PLN:</span>
                    <span style={{ color: '#16a34a', fontWeight: 700, background: 'rgba(22, 163, 74, 0.12)', padding: '1px 7px', borderRadius: '5px', fontSize: '0.74rem' }}>
                      Rp 0 (Bebas Admin)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: isLight ? '#475569' : '#94a3b8' }}>
                    <span>Biaya Layanan Gateway QRIS:</span>
                    <span style={{ color: isLight ? '#0f172a' : 'white', fontWeight: 700 }}>
                      {formatRupiah(PLN_GATEWAY_FEE)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '1rem',
                    fontWeight: 900,
                    color: '#d97706',
                    borderTop: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.12)',
                    paddingTop: '10px',
                    marginTop: '4px'
                  }}>
                    <span>Total Pembayaran:</span>
                    <span>{formatRupiah(totalPayment)}</span>
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
                  data-testid="pln-submit-payment"
                  onClick={handleProceedPayment}
                  disabled={loadingOrder || !meterNumber}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    fontWeight: 800,
                    padding: '13px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                    fontSize: '0.92rem'
                  }}
                >
                  <Zap size={18} /> {loadingOrder ? 'Membuat Tagihan QRIS...' : `Bayar ${formatRupiah(totalPayment)} via QRIS`}
                </button>

                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.74rem',
                  color: isLight ? '#64748b' : '#94a3b8'
                }}>
                  <ShieldCheck size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Token 20 digit terbit instan otomatis begitu pembayaran QRIS terverifikasi.</span>
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
        amount={activeOrder?.amount || totalPayment}
        orderId={activeOrder?.orderId}
        paymentMethod="QRIS Realtime (TriPay)"
        serviceName="Token Listrik PLN"
        message={unpaidErrorMsg || 'Sistem belum menerima konfirmasi pembayaran dari QRIS. Jika Anda baru saja melakukan transfer atau scan di aplikasi perbankan/e-wallet, mohon tunggu 5–15 detik agar mutasi berhasil diverifikasi oleh gateway.'}
      />
    </div>
  );
}
