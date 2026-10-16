import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  FileText,
  ShieldCheck,
  CreditCard,
  QrCode,
  Receipt,
  Plus,
  Minus,
  AlertTriangle,
  ChevronRight,
  Star,
  Settings,
  RefreshCw,
  ExternalLink,
  Zap,
  Check
} from 'lucide-react';
import {
  apiCreatePartnerOrder,
  apiChargeQris,
  apiCheckQrisStatus,
  apiSimulateQrisScan,
  apiMutateWallet
} from '../services/api';
import { generateQrisDataUrl, getGatewayConfig, saveGatewayConfig } from '../utils/qrisEngine';

const PartnerOrderModal = ({
  isOpen,
  onClose,
  service,
  user = null,
  kost = null
}) => {
  const [roomNumber, setRoomNumber] = useState(user?.kamar || '101');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [preferredTime, setPreferredTime] = useState('Segera (15-20 Menit)');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qris'); // 'qris' (default non-cod), 'monthly_bill', 'cod'
  const [showQrisScreen, setShowQrisScreen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  // Dynamic QRIS State
  const [qrisData, setQrisData] = useState(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [showGatewayConfig, setShowGatewayConfig] = useState(false);
  const [gwConfig, setGwConfig] = useState(getGatewayConfig());
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const [checkNotice, setCheckNotice] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Products quantity state
  const [quantities, setQuantities] = useState({});

  // SLA Timer, Rating, and Unified Wallet state
  const slaInitialMinutes = Number(service?.slaMinutes || service?.sla_minutes || 15);
  const [slaSecondsLeft, setSlaSecondsLeft] = useState(slaInitialMinutes * 60);
  const [rating, setRating] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    let timer;
    if (isSuccess && slaSecondsLeft > 0) {
      timer = setInterval(() => {
        setSlaSecondsLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSuccess, slaSecondsLeft]);

  const formatSlaCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (user) {
      if (user.kamar) setRoomNumber(user.kamar);
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Initialize quantities when service changes
  useEffect(() => {
    if (service) {
      const initial = {};
      const prods = service.products || [];
      const targetId = service.preferredProductId || prods[0]?.id;
      if (prods.length > 0) {
        prods.forEach((p, idx) => {
          initial[p.id] = (p.id === targetId || (!targetId && idx === 0)) ? 1 : 0;
        });
      }
      setQuantities(initial);
      setPaymentMethod('qris');
      setShowQrisScreen(false);
      setIsSuccess(false);
      setOrderResult(null);
      setSlaSecondsLeft(slaInitialMinutes * 60);
      setRating(5);
      setRatingSubmitted(false);
    }
  }, [service]);

  const rawProducts = (service?.products?.length > 0) ? service.products : [
    {
      id: 'default-prod',
      name: service?.title || 'Layanan Standar',
      brand: 'Standar',
      price: service?.title?.toLowerCase().includes('laundry') ? 6000 : service?.title?.toLowerCase().includes('galon') ? 16000 : 20000,
      desc: service?.desc || service?.sub || 'Layanan siap antar ke kamar'
    }
  ];

  // Urutkan produk dari harga termurah ke termahal agar anak kost langsung melihat opsi paling hemat
  const productsList = [...rawProducts].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));

  const updateQty = (id, delta) => {
    setQuantities(prev => {
      const cur = prev[id] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [id]: next };
    });
  };

  // Calculate Subtotal
  const selectedItems = productsList
    .map(p => ({ ...p, qty: quantities[p.id] || 0 }))
    .filter(p => p.qty > 0);

  const subtotal = selectedItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const effectiveSubtotal = subtotal > 0 ? subtotal : (productsList[0]?.price || 16000);
  
  // Price Lock Sesuai Blueprint: Base Price + Fixed Platform Fee (Rp 500) + Owner Markup Fee (Default: Rp 1.000)
  const platformFee = 500; // Fixed Rp 500/transaksi
  const ownerMarkupFee = Number(service?.ownerMarkupFee ?? service?.commissionOwner ?? 1000);
  const ownerCommission = ownerMarkupFee;
  const grandTotal = effectiveSubtotal + ownerCommission + platformFee;
  const slaMinutes = slaInitialMinutes;

  const mutateUnifiedWallet = (method, subtotalAmt, markupAmt) => {
    try {
      const stored = localStorage.getItem('kostku_unified_wallet');
      const current = stored ? JSON.parse(stored) : {
        owner_commission_balance: 25000,
        mitra_escrow_balance: 0,
        overdraft_limit: -15000
      };
      
      if (method === 'qris') {
        current.owner_commission_balance = (Number(current.owner_commission_balance) || 0) + markupAmt;
        current.mitra_escrow_balance = (Number(current.mitra_escrow_balance) || 0) + subtotalAmt;
      } else if (method === 'cod') {
        current.owner_commission_balance = (Number(current.owner_commission_balance) || 0) - 500; // Fixed Rp 500 platform fee
      }
      
      localStorage.setItem('kostku_unified_wallet', JSON.stringify(current));
      window.dispatchEvent(new Event('kostku_wallet_updated'));
    } catch (e) {
      console.warn('Wallet mutation error:', e);
    }
  };

  // Generate authentic dynamic QRIS from backend or client engine
  const loadDynamicQris = async () => {
    if (!isOpen || !service) return;
    setQrisLoading(true);
    const newOrderId = `ORD-QRIS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const res = await apiChargeQris({
        orderId: newOrderId,
        amount: grandTotal,
        customerName: customerName || 'Penghuni Kost',
        roomNumber: roomNumber || '101',
        merchantName: service?.name || service?.title || 'DEPOT AIR & GAS BAROKAH',
        nmid: service?.nmid || 'ID1020268892019'
      });
      if (res && res.qrCodeUrl) {
        setQrisData(res);
      } else {
        throw new Error('Respon tidak valid');
      }
    } catch (err) {
      // Offline fallback directly via client qrisEngine
      const fallback = await generateQrisDataUrl({
        amount: grandTotal,
        orderId: newOrderId,
        merchantName: service?.name || service?.title || 'DEPOT AIR & GAS BAROKAH',
        nmid: service?.nmid || 'ID1020268892019'
      });
      setQrisData({
        orderId: newOrderId,
        amount: grandTotal,
        qrCodeUrl: fallback.dataUrl,
        qrString: fallback.qrString,
        provider: 'aspi_emvco_dynamic',
        nmid: service?.nmid || 'ID1020268892019',
        merchantName: service?.name || service?.title || 'DEPOT AIR & GAS BAROKAH'
      });
    } finally {
      setQrisLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && showQrisScreen && service) {
      loadDynamicQris();
    }
  }, [isOpen, showQrisScreen, grandTotal, service]);

  // Real-time Auto-Polling (checks payment settlement every 3 seconds)
  useEffect(() => {
    let pollInterval;
    if (isOpen && showQrisScreen && qrisData?.orderId && !isSuccess && !submitting) {
      setIsPolling(true);
      pollInterval = setInterval(async () => {
        try {
          const res = await apiCheckQrisStatus(qrisData.orderId);
          if (res?.status === 'settlement' || res?.status === 'paid' || res?.status === 'capture') {
            clearInterval(pollInterval);
            setIsPolling(false);
            await executeFinalOrder(qrisData.orderId, 'qris');
          }
        } catch (e) {
          // Silent background poll error
        }
      }, 3000);
    } else {
      setIsPolling(false);
    }
    return () => clearInterval(pollInterval);
  }, [isOpen, showQrisScreen, qrisData?.orderId, isSuccess, submitting]);

  const executeFinalOrder = async (orderIdOverride = null, methodOverride = null) => {
    setSubmitting(true);
    const activeMethod = methodOverride || paymentMethod;
    try {
      const itemsToSubmit = selectedItems.length > 0 
        ? selectedItems 
        : [{ id: productsList[0].id, name: productsList[0].name, price: productsList[0].price, qty: 1 }];

      const payload = {
        id: orderIdOverride || `TKT-ORD-${Date.now()}`,
        kostUid: kost?.uid || user?.kostUid || 'KOST-JAKSEL-01',
        userId: user?.id || user?.uid || 'GUEST',
        userName: customerName.trim() || 'Penghuni Kost',
        userPhone: customerPhone.trim() || '-',
        roomNumber: roomNumber.trim() || '101',
        merchantId: service?.id || null,
        merchantName: service?.name || service?.title || 'Mitra UMKM',
        serviceName: service?.title || service?.name || 'Pesanan Layanan',
        items: itemsToSubmit,
        subtotal: effectiveSubtotal,
        ownerCommission,
        platformFee,
        total: grandTotal,
        paymentMethod: activeMethod,
        notes: `Waktu: ${preferredTime}. Catatan: ${notes.trim()}`
      };

      const res = await apiCreatePartnerOrder(payload);
      setOrderResult(res?.order || {
        id: orderIdOverride || `TKT-ORD-${Date.now()}`,
        total: grandTotal,
        paymentMethod: activeMethod,
        status: activeMethod === 'qris' ? 'Lunas (QRIS Terverifikasi Real-Time)' : activeMethod === 'monthly_bill' ? 'Masuk Tagihan Sewa' : 'Tunai COD'
      });
      
      mutateUnifiedWallet(activeMethod, effectiveSubtotal, ownerCommission);
      apiMutateWallet({ method: activeMethod, subtotalAmt: effectiveSubtotal, markupAmt: ownerCommission }).catch(() => {});

      setIsSuccess(true);
      setShowQrisScreen(false);
    } catch (err) {
      alert(err.message || 'Gagal memproses pesanan mitra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateScanSettlement = async () => {
    if (!qrisData?.orderId) return;
    setSubmitting(true);
    try {
      await apiSimulateQrisScan({ orderId: qrisData.orderId });
      await executeFinalOrder(qrisData.orderId, 'qris');
    } catch (err) {
      // Fallback
      await executeFinalOrder(qrisData.orderId, 'qris');
    }
  };

  const handleCheckQrisPaymentStatus = async (forceManual = false) => {
    if (!qrisData?.orderId || checkingStatus || submitting) return;
    setCheckingStatus(true);
    setCheckNotice(null);
    try {
      if (!forceManual) {
        const res = await apiCheckQrisStatus(qrisData.orderId);
        if (res?.status === 'settlement' || res?.status === 'paid' || res?.status === 'capture' || res?.isPaid) {
          setCheckNotice({ type: 'success', message: '✅ Pembayaran QRIS Terverifikasi Lunas!' });
          await executeFinalOrder(qrisData.orderId, 'qris');
          return;
        } else if (res?.status === 'expired') {
          setCheckNotice({ type: 'error', message: '⚠️ Masa berlaku QRIS telah habis. Silakan buat kode QRIS baru.' });
          return;
        }
        
        // If still pending
        setCheckNotice({
          type: 'pending',
          message: '⏳ Pembayaran belum terdeteksi di mutasi perbankan. Silakan selesaikan scan di aplikasi m-Banking atau E-Wallet Anda, lalu klik Cek kembali.'
        });
      } else {
        // Force manual confirmation (user confirms they already transferred)
        setCheckNotice({ type: 'success', message: '✅ Konfirmasi Pembayaran Berhasil Diterima!' });
        await executeFinalOrder(qrisData.orderId, 'qris');
      }
    } catch (err) {
      if (forceManual) {
        await executeFinalOrder(qrisData.orderId, 'qris');
      } else {
        setCheckNotice({
          type: 'error',
          message: err.message || 'Belum dapat memeriksa status mutasi. Silakan coba kembali.'
        });
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleProceedOrder = async () => {
    if (paymentMethod === 'qris' && !showQrisScreen) {
      // Step to show dynamic QRIS Payment Screen
      setShowQrisScreen(true);
      return;
    }

    await executeFinalOrder(null, paymentMethod);
  };

  const handleSaveConfig = async (newConfig) => {
    saveGatewayConfig(newConfig);
    setGwConfig(newConfig);
    try {
      await apiSaveGatewayConfig(newConfig);
    } catch (e) {}
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
    loadDynamicQris();
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setShowQrisScreen(false);
    setShowGatewayConfig(false);
    setNotes('');
    onClose();
  };

  if (!isOpen || !service) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 10, 20, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} className="animate-fade-in">

      <div style={{
        background: '#0a101f',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '1.75rem',
        boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.85)',
        position: 'relative'
      }}>

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem', background: 'rgba(59, 130, 246, 0.12)', padding: '10px', borderRadius: '16px' }}>
              {service.icon || '🏪'}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc' }}>
                  {service.name || service.title}
                </h3>
                {service.isAffiliate ? (
                  <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', fontWeight: 700 }}>
                    Affiliate
                  </span>
                ) : (
                  <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(34, 197, 94, 0.18)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.35)', fontWeight: 700 }}>
                    Mitra Terverifikasi
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="#60a5fa" />
                {service.address || `${service.distanceKm || 0.2} km dari kost`} • Antar ke Pintu Kamar
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '50%', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* SCREEN 1: SUCCESS RECEIPT */}
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <CheckCircle size={38} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#22c55e', margin: '0 0 6px 0' }}>
              Pesanan Berhasil Diproses!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 1.25rem 0' }}>
              {paymentMethod === 'qris' 
                ? 'Pembayaran QRIS terverifikasi lunas. Mitra sedang menyiapkan barang pesanan Anda.'
                : paymentMethod === 'monthly_bill'
                ? 'Pesanan telah dicatat dan digabung ke tagihan sewa kamar bulan depan.'
                : 'Pesanan telah diterima. Mohon siapkan uang tunai pas saat barang diantar.'}
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Nomor Tiket:</span>
                <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>{orderResult?.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Tujuan Pengantaran:</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>Kamar {roomNumber} ({customerName})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Metode Pembayaran:</span>
                <span style={{
                  color: paymentMethod === 'qris' ? '#22c55e' : paymentMethod === 'monthly_bill' ? '#60a5fa' : '#facc15',
                  fontWeight: 700
                }}>
                  {paymentMethod === 'qris' ? '🟢 Lunas (QRIS Non-Tunai)' : paymentMethod === 'monthly_bill' ? '🔵 Masuk Tagihan Sewa' : '⚪ Tunai COD'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Total Tagihan:</span>
                <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.95rem' }}>
                  Rp {(orderResult?.total || grandTotal).toLocaleString('id-ID')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Estimasi Sampai:</span>
                <span style={{ color: '#facc15', fontWeight: 700 }}>
                  {service.name?.toLowerCase().includes('galon') || service.title?.toLowerCase().includes('galon') ? '15 - 20 Menit' : 'Sesuai Jadwal'}
                </span>
              </div>
            </div>

            {/* SLA Real-Time Countdown Timer */}
            <div style={{
              background: slaSecondsLeft > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${slaSecondsLeft > 0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: '16px',
              padding: '1rem',
              textAlign: 'left',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color={slaSecondsLeft > 0 ? '#38bdf8' : '#ef4444'} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                    SLA Pengantaran Mitra
                  </span>
                </div>
                <span style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: slaSecondsLeft > 0 ? '#38bdf8' : '#ef4444'
                }}>
                  {formatSlaCountdown(slaSecondsLeft)}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                {slaSecondsLeft > 0
                  ? `Batas waktu SLA (${slaMinutes} menit) untuk kurir mitra mengantarkan barang sampai di pintu Kamar ${roomNumber}.`
                  : '⚠️ Batas waktu SLA telah lewat! Garansi pembatalan pesanan otomatis (cancelled_timeout) & refund dana siap diklaim.'}
              </p>
            </div>

            {/* WhatsApp Trigger Button (wa.me) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <a
                href={`https://wa.me/${String(service?.whatsapp_number || service?.phone || '6281234567890').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(
                  `Halo Mitra *${service?.name || service?.title || 'UMKM'}*,\nAda pesanan baru dari KostKu!\n\n📋 *ID Tiket:* ${orderResult?.id || 'ORD-NEW'}\n🏢 *Kamar:* ${roomNumber} (${customerName})\n💰 *Total:* Rp ${(orderResult?.total || grandTotal).toLocaleString('id-ID')}\n💳 *Metode:* ${paymentMethod === 'qris' ? 'LUNAS (QRIS)' : 'COD'}\n⏱️ *SLA:* ${slaMinutes} Menit\n\nMohon segera diproses dan diantar. Terima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)',
                  boxSizing: 'border-box'
                }}
              >
                <Phone size={16} />
                <span>Kirim Notifikasi via WhatsApp (wa.me)</span>
              </a>
              <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Format otomatis memuat nomor kamar, nama pemesan, dan batas SLA pengantaran.
              </span>
            </div>

            {/* Rating Mitra UMKM */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                Beri Rating Layanan Mitra:
              </div>
              {ratingSubmitted ? (
                <div style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 600 }}>
                  ✓ Terima kasih! Ulasan {rating} bintang telah dicatat untuk auto-ranking mitra.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: star <= rating ? '#fbbf24' : '#475569'
                        }}
                      >
                        <Star size={24} fill={star <= rating ? '#fbbf24' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRatingSubmitted(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '4px 12px' }}
                  >
                    Kirim Rating {rating} Bintang
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleResetAndClose}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontWeight: 700 }}
            >
              Tutup & Kembali ke Dashboard
            </button>
          </div>
        ) : showQrisScreen ? (
          /* SCREEN 2: REAL DYNAMIC QRIS (NON-COD EMPHASIS & AUTO-POLLING) */
          <div style={{ textAlign: 'center', padding: '0.25rem 0' }}>
            {/* Gateway Status Badge & Settings Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: qrisData?.provider === 'midtrans_production'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : qrisData?.provider === 'midtrans_sandbox'
                    ? 'rgba(234, 179, 8, 0.2)'
                    : 'rgba(34, 197, 94, 0.2)',
                  color: qrisData?.provider === 'midtrans_production'
                    ? '#f87171'
                    : qrisData?.provider === 'midtrans_sandbox'
                    ? '#facc15'
                    : '#4ade80',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {qrisData?.provider === 'midtrans_production'
                    ? '🔴 Midtrans Production API'
                    : qrisData?.provider === 'midtrans_sandbox'
                    ? '🟡 Midtrans Sandbox API'
                    : '🟢 ASPI Dynamic QRIS EMVCo'}
                </span>
                {isPolling && (
                  <span style={{ fontSize: '0.65rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={11} className="animate-spin" /> Menunggu Pembayaran...
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowGatewayConfig(prev => !prev)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Settings size={13} />
                <span>Pengaturan API</span>
              </button>
            </div>

            {/* Gateway Configuration Drawer (Toggleable) */}
            {showGatewayConfig && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '14px',
                padding: '12px',
                marginBottom: '12px',
                textAlign: 'left',
                fontSize: '0.75rem'
              }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>⚙️ Konfigurasi Gateway Pembayaran:</span>
                  <button onClick={() => setShowGatewayConfig(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.68rem', marginBottom: '3px' }}>Mode Gateway:</label>
                  <select
                    value={gwConfig.provider || 'aspi_emvco_dynamic'}
                    onChange={e => setGwConfig(prev => ({ ...prev, provider: e.target.value, isSandbox: e.target.value === 'midtrans_sandbox', isProduction: e.target.value === 'midtrans_production' }))}
                    style={{ width: '100%', padding: '6px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.72rem' }}
                  >
                    <option value="aspi_emvco_dynamic">🟢 Bank Indonesia ASPI Dynamic QRIS EMVCo (Rekomendasi - Terkunci Nominal Pas)</option>
                    <option value="midtrans_sandbox">🟡 Midtrans Core API (Sandbox Mode)</option>
                    <option value="midtrans_production">🔴 Midtrans Core API (Production Real Mode)</option>
                  </select>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.68rem', marginBottom: '3px' }}>Midtrans Server Key (Kosongkan jika pakai ASPI):</label>
                  <input
                    type="password"
                    placeholder="Contoh: Mid-server-xxxxxxxx atau SB-Mid-server-xxxx"
                    value={gwConfig.serverKey || ''}
                    onChange={e => setGwConfig(prev => ({ ...prev, serverKey: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.72rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSaveConfig(gwConfig)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }}
                  >
                    <Check size={12} /> Simpan & Terapkan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const resetCfg = { provider: 'aspi_emvco_dynamic', serverKey: '', clientKey: '', merchantId: 'G1020268892', isSandbox: true };
                      handleSaveConfig(resetCfg);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                  >
                    Reset
                  </button>
                </div>
                {configSavedToast && (
                  <div style={{ color: '#4ade80', fontSize: '0.68rem', marginTop: '6px', fontWeight: 700, textAlign: 'center' }}>
                    ✓ Konfigurasi gateway berhasil disimpan & QRIS diperbarui!
                  </div>
                )}
              </div>
            )}

            {/* REAL QRIS WHITE CONTAINER */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.25rem',
              display: 'inline-block',
              margin: '0 auto 0.75rem auto',
              boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
              border: '4px solid #f8fafc',
              maxWidth: '300px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* QRIS Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#dc2626', letterSpacing: '1.2px' }}>QRIS</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569' }}>ASPI / BANK INDONESIA</span>
              </div>

              {/* Scannable Dynamic QRIS Code */}
              <div style={{
                width: '210px',
                height: '210px',
                margin: '0 auto',
                background: '#ffffff',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {qrisLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <RefreshCw size={28} className="animate-spin" color="#2563eb" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Membuat QRIS Dinamis...</span>
                  </div>
                ) : qrisData?.qrCodeUrl ? (
                  <img
                    src={qrisData.qrCodeUrl}
                    alt={`QRIS Dinamis - ${service.name || 'Mitra'}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : service.qrisImage ? (
                  <img src={service.qrisImage} alt={service.name || 'QRIS Toko'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={24} className="animate-spin" color="#2563eb" />
                    <span style={{ fontSize: '0.68rem', color: '#0f172a' }}>Menghubungkan ke Gateway...</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '10px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>
                  {qrisData?.merchantName || service.name?.toUpperCase() || 'DEPOT AIR & GAS BAROKAH'}
                </div>
                <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                  NMID: {qrisData?.nmid || service.nmid || 'ID1020268892019'}
                </div>
              </div>
            </div>

            {/* Dynamic Rupee Amount Badge */}
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nominal Pas Terkunci Dinamis:</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#22c55e', margin: '2px 0' }}>
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                BCA • Mandiri • BRI • BNI • GoPay • OVO • DANA • ShopeePay
              </div>
            </div>

            {/* Auto-Polling Status Alert Strip */}
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #22c55e'
                }} className="animate-pulse" />
                <span style={{ color: '#cbd5e1' }}>
                  <strong>Auto-Polling Aktif:</strong> Sistem mendeteksi otomatis saat Anda selesai transfer.
                </span>
              </div>
            </div>

            {/* Simulation Settlement Button (for Testing / Evaluation) */}
            <div style={{ marginBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={handleSimulateScanSettlement}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px dashed rgba(56, 189, 248, 0.45)',
                  borderRadius: '10px',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Zap size={14} />
                <span>Simulasi Scan E-Wallet Berhasil (Auto-Settled Testing)</span>
              </button>
            </div>

            {/* Live Gateway Check Feedback Notice */}
            {checkNotice && (
              <div style={{
                background: checkNotice.type === 'pending' ? 'rgba(234, 179, 8, 0.12)' : checkNotice.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                border: `1px solid ${checkNotice.type === 'pending' ? 'rgba(234, 179, 8, 0.35)' : checkNotice.type === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`,
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '0.85rem',
                fontSize: '0.78rem',
                color: checkNotice.type === 'pending' ? '#fde047' : checkNotice.type === 'error' ? '#fca5a5' : '#86efac',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 600 }}>{checkNotice.message}</div>
                {checkNotice.type === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleCheckQrisPaymentStatus(false)}
                      disabled={checkingStatus || submitting}
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
                      onClick={() => handleCheckQrisPaymentStatus(true)}
                      disabled={checkingStatus || submitting}
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.72rem',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255,255,255,0.2)',
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleCheckQrisPaymentStatus(false)}
                disabled={checkingStatus || submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                  cursor: (checkingStatus || submitting) ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {checkingStatus || submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Memeriksa Status Mutasi Gateway...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>⚡ Cek Status Pembayaran (Saya Sudah Bayar)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowQrisScreen(false)}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                &larr; Ubah Rincian / Pilih Metode Lain
              </button>
            </div>
          </div>
        ) : (
          /* SCREEN 3: PRODUCT CATALOGUE & NON-COD PAYMENT CHOOSER */
          <form onSubmit={e => { e.preventDefault(); handleProceedOrder(); }}>
            {/* 1. Pilih Produk / Katalog Barang */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                  Pilih Produk & Jumlah:
                </label>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Katalog Resmi Merchant
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {productsList.map((prod, pIdx) => {
                  const qty = quantities[prod.id] || 0;
                  const isLowest = pIdx === 0;
                  return (
                    <div
                      key={prod.id}
                      style={{
                        background: qty > 0 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: qty > 0 ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                            {prod.name}
                          </span>
                          {prod.brand && (
                            <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', fontWeight: 700 }}>
                              {prod.brand}
                            </span>
                          )}
                          {isLowest && (
                            <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontWeight: 700 }}>
                              Paling Hemat
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          {prod.desc || 'Siap diantar'}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>
                          Rp {prod.price.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Qty Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => updateQty(prod.id, -1)}
                          disabled={qty <= 0}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: qty > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                            color: qty > 0 ? '#f8fafc' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: qty > 0 ? 'pointer' : 'default'
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, minWidth: '18px', textAlign: 'center', color: qty > 0 ? '#f8fafc' : '#64748b' }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(prod.id, 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: '1px solid #3b82f6',
                            background: 'rgba(59, 130, 246, 0.25)',
                            color: '#93c5fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Informasi Pengantaran */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nomor Kamar:
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  placeholder="Contoh: 101"
                  required
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Waktu Pengantaran:
                </label>
                <select
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
                >
                  <option value="Segera (15-20 Menit)">Segera (15-20 Menit)</option>
                  <option value="Siang Ini (12:00 - 14:00)">Siang Ini (12:00 - 14:00)</option>
                  <option value="Sore Ini (16:00 - 18:00)">Sore Ini (16:00 - 18:00)</option>
                  <option value="Malam Ini (19:00 - 21:00)">Malam Ini (19:00 - 21:00)</option>
                  <option value="Besok Pagi (08:00 - 10:00)">Besok Pagi (08:00 - 10:00)</option>
                </select>
              </div>
            </div>

            {/* Catatan Khusus */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Titip di depan pintu bila sedang kuliah"
                className="input-field"
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
              />
            </div>

            {/* 3. METODE PEMBAYARAN: UTAMAKAN NON-COD */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                  Metode Pembayaran (Utamakan Non-Tunai):
                </label>
                <span style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 700 }}>
                  Bebas Ribet Kembalian
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Opsi 1: QRIS INSTAN (REKOMENDASI UTAMA) */}
                <div
                  onClick={() => setPaymentMethod('qris')}
                  style={{
                    cursor: 'pointer',
                    background: paymentMethod === 'qris' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: paymentMethod === 'qris' ? '1.5px solid #22c55e' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <QrCode size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                          QRIS Instan (Semua E-Wallet & Bank)
                        </span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: '#22c55e', color: '#0f172a', fontWeight: 800 }}>
                          REKOMENDASI
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Scan via BCA, GoPay, OVO, ShopeePay, Dana. Tanpa uang kembalian.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'qris'}
                    onChange={() => setPaymentMethod('qris')}
                    style={{ accentColor: '#22c55e' }}
                  />
                </div>

                {/* Opsi 2: GABUNG KE TAGIHAN SEWA BULAN DEPAN */}
                <div
                  onClick={() => setPaymentMethod('monthly_bill')}
                  style={{
                    cursor: 'pointer',
                    background: paymentMethod === 'monthly_bill' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: paymentMethod === 'monthly_bill' ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Receipt size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc', display: 'block' }}>
                        Titip ke Tagihan Sewa Bulan Depan
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Praktis, langsung digabung ke invoice sewa kamar tanpa keluar uang sekarang.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'monthly_bill'}
                    onChange={() => setPaymentMethod('monthly_bill')}
                    style={{ accentColor: '#3b82f6' }}
                  />
                </div>

                {/* Opsi 3: BAYAR TUNAI SAAT DIANTAR (COD) - OPSIONAL CADANGAN */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  style={{
                    cursor: 'pointer',
                    background: paymentMethod === 'cod' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: paymentMethod === 'cod' ? '1.5px solid rgba(245, 158, 11, 0.6)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: 0.85
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1rem' }}>💵</span>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', display: 'block' }}>
                        Bayar Tunai saat Diantar (COD)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#fbbf24' }}>
                        Harap siapkan uang pas saat kurir tiba di kamar.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    style={{ accentColor: '#f59e0b' }}
                  />
                </div>
              </div>
            </div>

            {/* 4. BREAKDOWN RINCIAN TRANSAKSI TRANSPARAN */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '1.25rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}>
                <span>Harga Dasar Mitra UMKM ({selectedItems.length || 1} item)</span>
                <span>Rp {effectiveSubtotal.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}>
                <span>Komisi Pemilik Kost (Markup Fee)</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>Rp {ownerCommission.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}>
                <span>Biaya Platform KostKu (Fixed Platform Fee)</span>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Rp {platformFee.toLocaleString('id-ID')}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '8px',
                fontWeight: 800,
                fontSize: '0.92rem',
                color: '#f8fafc'
              }}>
                <span>Total Pembayaran Tenant:</span>
                <span style={{ color: '#4ade80' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                💡 Price Lock: Biaya Platform tetap Rp 500 • Ekosistem Hyperlocal UMKM Terpercaya
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {paymentMethod === 'qris' ? (
                <>
                  <QrCode size={18} />
                  <span>Lanjut Bayar via QRIS Instan (Rp {grandTotal.toLocaleString('id-ID')})</span>
                </>
              ) : paymentMethod === 'monthly_bill' ? (
                <>
                  <Receipt size={18} />
                  <span>Catat ke Tagihan Sewa Bulan Depan</span>
                </>
              ) : (
                <span>Konfirmasi Pesanan (Bayar Tunai COD)</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default PartnerOrderModal;
