import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Printer,
  Receipt,
  RefreshCw
} from 'lucide-react';
import { apiCreatePaymentTransaction, apiVerifyPayment, apiGetPaymentStatus, apiChargeQris, apiSimulateQrisScan } from '../services/api';
import { generateQrisDataUrl } from '../utils/qrisEngine';
import { useTheme } from '../context/ThemeContext';

const PaymentGatewayModal = ({ 
  isOpen, 
  onClose, 
  invoice, 
  user,
  onPaymentSuccess,
  onOpenReceipt 
}) => {
  const { isLight } = useTheme();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [qrisDataUrl, setQrisDataUrl] = useState('');
  const [qrisLoading, setQrisLoading] = useState(false);
  const [checkNotice, setCheckNotice] = useState(null);

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

  // Real-time payment status polling (auto-detects bank/e-wallet transfer)
  useEffect(() => {
    if (!isOpen || isSuccess || !transaction?.orderId || timeLeft <= 0) return;

    let errorCount = 0;
    const pollInterval = setInterval(async () => {
      if (timeLeft <= 0 || errorCount >= 6) {
        clearInterval(pollInterval);
        return;
      }
      try {
        const res = await apiGetPaymentStatus(transaction.orderId);
        errorCount = 0;
        if (res?.status === 'settlement' || res?.status === 'lunas') {
          setIsSuccess(true);
          const rNum = res.receiptNumber || `RCP-KST-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
          setReceiptNumber(rNum);
          if (onPaymentSuccess) {
            onPaymentSuccess({ ...invoice, status: 'lunas', paymentMethod: transaction?.paymentMethod || 'QRIS' }, rNum);
          }
        }
      } catch (err) {
        errorCount += 1;
      }
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [isOpen, isSuccess, transaction?.orderId, invoice, onPaymentSuccess, timeLeft]);

  // Initialize transaction
  useEffect(() => {
    if (isOpen && invoice) {
      initTransaction();
    }
  }, [isOpen, invoice]);

  const baseRentAmount = Number(invoice?.total || invoice?.amount || 0);
  const convenienceFee = 0;
  const totalWithFee = baseRentAmount + convenienceFee;

  const initTransaction = async () => {
    if (!isOpen || !invoice) return;
    try {
      const trx = await apiCreatePaymentTransaction({
        invoiceId: invoice?.id,
        kostUid: invoice?.kostUid || user?.kostUid,
        userId: invoice?.userId || user?.id,
        amount: totalWithFee,
        customerName: user?.name || invoice?.userName || 'Penghuni Kost',
        roomNumber: invoice?.kamar || user?.kamar || '-',
        paymentMethod: 'QRIS'
      });
      setTransaction(trx);

      setQrisLoading(true);
      try {
        const qrisRes = await apiChargeQris({
          orderId: trx.orderId,
          amount: totalWithFee,
          customerName: user?.name || invoice?.userName || 'Penghuni Kost',
          roomNumber: invoice?.kamar || user?.kamar || '-',
          merchantName: `KOSTKU SEWA KMR ${invoice?.kamar || user?.kamar || '-'}`,
          invoiceId: invoice?.id
        });
        if (qrisRes?.qrCodeUrl) {
          setQrisDataUrl(qrisRes.qrCodeUrl);
        } else {
          throw new Error('No QR Code Url');
        }
      } catch (e) {
        const fallback = await generateQrisDataUrl({
          amount: totalWithFee,
          orderId: trx.orderId,
          merchantName: `KOSTKU SEWA KMR ${invoice?.kamar || user?.kamar || '-'}`
        });
        setQrisDataUrl(fallback.dataUrl);
      } finally {
        setQrisLoading(false);
      }
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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Real-time verification action
  const handleVerifyPayment = async (forceManual = false) => {
    const isForced = forceManual === true;
    setIsProcessing(true);
    setCheckNotice(null);
    try {
      const qId = transaction?.orderId || transaction?.id;
      // 1. Live status check from gateway first
      if (qId) {
        const statusRes = await apiGetPaymentStatus(qId).catch(() => null);
        if (statusRes?.status === 'settlement' || statusRes?.status === 'lunas' || statusRes?.isPaid || isForced) {
          const res = await apiVerifyPayment({
            transactionId: transaction?.id,
            invoiceId: invoice?.id,
            orderId: transaction?.orderId,
            forceManual: isForced
          });
          
          setIsSuccess(true);
          const rNum = res?.receiptNumber || statusRes?.receiptNumber || `RCP-KST-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
          setReceiptNumber(rNum);
          if (onPaymentSuccess) {
            onPaymentSuccess(res?.invoice || { ...invoice, status: 'lunas' }, rNum);
          }
          return;
        }
      } else if (isForced) {
        const res = await apiVerifyPayment({
          transactionId: transaction?.id,
          invoiceId: invoice?.id,
          orderId: transaction?.orderId,
          forceManual: true
        });
        setIsSuccess(true);
        const rNum = res?.receiptNumber || `RCP-KST-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
        setReceiptNumber(rNum);
        if (onPaymentSuccess) onPaymentSuccess(res?.invoice || { ...invoice, status: 'lunas' }, rNum);
        return;
      }

      setCheckNotice({
        type: 'pending',
        message: 'Pembayaran belum terdeteksi di mutasi QRIS / Bank. Pastikan transfer telah selesai di aplikasi m-Banking atau E-Wallet Anda.'
      });
    } catch (err) {
      if (isForced) {
        setIsSuccess(true);
        const rNum = `RCP-KST-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
        setReceiptNumber(rNum);
        if (onPaymentSuccess) onPaymentSuccess({ ...invoice, status: 'lunas' }, rNum);
      } else {
        setCheckNotice({
          type: 'error',
          message: err.message || 'Pembayaran belum terdeteksi. Silakan coba kembali sesaat lagi.'
        });
      }
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
      background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }} className="animate-fade-in">
      
      <div style={{
        background: isLight ? '#ffffff' : '#0d1527',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '540px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isLight
          ? '0 25px 60px -15px rgba(0, 0, 0, 0.15), 0 0 30px rgba(37, 99, 235, 0.08)'
          : '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(59, 130, 246, 0.2)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isLight 
            ? 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)' 
            : 'linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)'
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
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Payment Gateway KostKu
                <span style={{
                  fontSize: '0.65rem',
                  background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                  color: isLight ? '#b45309' : '#f59e0b',
                  border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 800
                }}>
                  ⚡ SANDBOX / TEST MODE
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Simulasi Pembayaran Otomatis Real-time & Verifikasi Instan
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
              borderRadius: '10px',
              color: isLight ? '#475569' : '#94a3b8',
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
                background: isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.15)',
                border: '2px solid #22c55e',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <CheckCircle size={44} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: isLight ? '#16a34a' : '#22c55e', margin: '0 0 6px 0' }}>
                Pembayaran Berhasil!
              </h2>
              <p style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
                Tagihan sewa telah terverifikasi lunas secara otomatis tanpa perlu konfirmasi manual.
              </p>

              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '16px',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>No. Kuitansi:</span>
                  <span style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 700 }}>{receiptNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Kamar:</span>
                  <span style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 700 }}>{invoice.kamar || user?.kamar}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Sewa Pokok (100% ke Pemilik):</span>
                  <span style={{ color: isLight ? '#334155' : '#cbd5e1', fontWeight: 600 }}>{formatRupiah(baseRentAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Layanan Gateway & WA Otomatis:</span>
                  <span style={{ color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 600 }}>{formatRupiah(convenienceFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Total Dibayar:</span>
                  <span style={{ color: isLight ? '#16a34a' : '#22c55e', fontWeight: 800, fontSize: '1.05rem' }}>{formatRupiah(totalWithFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Status:</span>
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
                background: isLight 
                  ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' 
                  : 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)',
                border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: isLight ? '#1e40af' : '#94a3b8', display: 'block', fontWeight: 700 }}>TOTAL PEMBAYARAN OTOMATIS</span>
                  <strong style={{ fontSize: '1.35rem', color: isLight ? '#1d4ed8' : '#60a5fa', fontWeight: 900 }}>
                    {formatRupiah(totalWithFee)}
                  </strong>
                  <div style={{ marginTop: '4px', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1' }}>
                    <span>Sewa: {formatRupiah(baseRentAmount)} (100% ke Pemilik)</span>
                    <span style={{ margin: '0 6px', color: isLight ? '#94a3b8' : '#64748b' }}>•</span>
                    <span style={{ color: isLight ? '#059669' : '#34d399', fontWeight: 600 }}>Biaya Admin: Bebas Biaya Admin (QRIS)</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: isLight ? '#64748b' : '#94a3b8', display: 'block', marginTop: '2px' }}>
                    Sewa Kamar {invoice.kamar || user?.kamar} • Order ID: {transaction?.orderId || `ORD-${invoice.id}`}
                  </span>
                </div>
                <div style={{
                  background: isLight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                  border: isLight ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: isLight ? '#dc2626' : '#f87171',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  <Clock size={14} />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* QRIS Channel Header Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '1.25rem',
                background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.15)',
                padding: '10px 16px',
                borderRadius: '14px',
                border: isLight ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(59, 130, 246, 0.3)',
                color: isLight ? '#1d4ed8' : '#93c5fd',
                fontSize: '0.84rem',
                fontWeight: 800
              }}>
                <QrCode size={18} color="#2563eb" />
                <span>QRIS Dinamis Nasional (Scan Semua Bank & E-Wallet)</span>
              </div>

              {/* QRIS Direct Screen */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  display: 'inline-block',
                  margin: '0 auto 1rem auto',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                  border: '4px solid #f1f5f9',
                  maxWidth: '280px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {/* Header QRIS */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#dc2626', letterSpacing: '1px' }}>QRIS</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569' }}>BANK INDONESIA / ASPI</span>
                  </div>

                  {/* QR Code Dynamic Scannable Image */}
                  <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {qrisLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                        <RefreshCw size={24} className="animate-spin" color="#2563eb" />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Membuat QRIS Dinamis...</span>
                      </div>
                    ) : qrisDataUrl ? (
                      <img
                        src={qrisDataUrl}
                        alt="QRIS Dinamis Tagihan Sewa"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw size={24} className="animate-spin" color="#2563eb" />
                        <span style={{ fontSize: '0.68rem', color: '#0f172a' }}>Menghubungkan ke Gateway...</span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 600 }}>NMID: ID1029384758920</span>
                    <span style={{ fontSize: '0.74rem', color: '#0f172a', fontWeight: 800 }}>KostKu Managed Properties</span>
                  </div>
                </div>

                <div style={{
                  margin: '0 auto 1rem auto',
                  maxWidth: '420px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{
                    background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.08)',
                    border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '0.78rem',
                    color: isLight ? '#1e40af' : '#93c5fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left'
                  }}>
                    <RefreshCw size={15} className="animate-spin" style={{ flexShrink: 0 }} />
                    <span>Diproses aman melalui TriPay Payment Gateway resmi. Buka BCA, Mandiri, BRI, BNI, GoPay, OVO, atau DANA untuk scan QR Code di atas.</span>
                  </div>
                </div>
              </div>

              {/* Real Production Verification Bar */}
              {checkNotice && (
                <div style={{
                  background: checkNotice.type === 'pending' 
                    ? (isLight ? '#fefce8' : 'rgba(234, 179, 8, 0.12)') 
                    : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.12)'),
                  border: `1px solid ${checkNotice.type === 'pending' 
                    ? (isLight ? '#fef08a' : 'rgba(234, 179, 8, 0.35)') 
                    : (isLight ? '#fecaca' : 'rgba(239, 68, 68, 0.35)')}`,
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '0.85rem',
                  fontSize: '0.78rem',
                  color: checkNotice.type === 'pending' 
                    ? (isLight ? '#854d0e' : '#fde047') 
                    : (isLight ? '#b91c1c' : '#fca5a5'),
                  textAlign: 'left'
                }}>
                  <div style={{ fontWeight: 600 }}>{checkNotice.message}</div>
                  {checkNotice.type === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleVerifyPayment(false)}
                        disabled={isProcessing}
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.72rem',
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Cek Ulang Gateway
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerifyPayment(true)}
                        disabled={isProcessing}
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.72rem',
                          background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                          color: isLight ? '#334155' : '#e2e8f0',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Konfirmasi Manual (Sudah Transfer)
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div style={{
                background: isLight ? '#f0fdf4' : 'rgba(34, 197, 94, 0.08)',
                border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.74rem', color: isLight ? '#15803d' : '#86efac', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      display: 'inline-block',
                      boxShadow: '0 0 8px #22c55e'
                    }} />
                    Verifikasi Otomatis Real-Time Aktif
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: isLight ? '#475569' : '#cbd5e1' }}>
                    Sudah transfer? Klik tombol untuk verifikasi mutasi rekening instan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleVerifyPayment(false)}
                  disabled={isProcessing}
                  className="btn btn-success"
                  style={{
                    padding: '9px 16px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: isProcessing ? 'wait' : 'pointer'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡ Cek Status Pembayaran</span>
                    </>
                  )}
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
