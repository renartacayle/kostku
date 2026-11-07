import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Check,
  Download
} from 'lucide-react';
import {
  apiCreatePartnerOrder,
  apiChargeQris,
  apiCheckQrisStatus,
  apiSimulateQrisScan,
  apiMutateWallet
} from '../services/api';
import { generateQrisDataUrl, getGatewayConfig, saveGatewayConfig } from '../utils/qrisEngine';
import { useTheme } from '../context/ThemeContext';

const PartnerOrderModal = ({
  isOpen,
  onClose,
  service,
  user = null,
  kost = null
}) => {
  const { isLight } = useTheme();
  const [roomNumber, setRoomNumber] = useState(user?.kamar || '101');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [preferredTime, setPreferredTime] = useState('Segera (15-20 Menit)');
  const [notes, setNotes] = useState('');
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState(() => {
    return service?.deliveryType === 'pickup' ? 'pickup' : 'delivery';
  });
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
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [qrDownloaded, setQrDownloaded] = useState(false);

  // Products quantity state
  const [quantities, setQuantities] = useState({});

  // Auto-load last used referral code so anak kost doesn't have to re-enter it each order
  const getInitialReferral = () => {
    try {
      if (typeof window !== 'undefined') {
        const storedRef = localStorage.getItem('kostku_last_referral_code');
        if (storedRef && storedRef.trim()) return storedRef.trim().toUpperCase();
        const storedUser = localStorage.getItem('kostUser');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u.lastUsedReferral) return u.lastUsedReferral.toUpperCase();
          if (u.claimedFriendReferral) return u.claimedFriendReferral.toUpperCase();
        }
      }
    } catch (e) {}
    return (user?.lastUsedReferral || user?.claimedFriendReferral || '').toUpperCase();
  };

  const [friendReferralCode, setFriendReferralCode] = useState(getInitialReferral());
  const [isEditingReferral, setIsEditingReferral] = useState(false);
  const [usePointsDiscount, setUsePointsDiscount] = useState(false);
  const userLoyaltyPoints = Number(user?.loyalty_points ?? 250);

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
      setSelectedDeliveryMode(service.deliveryType === 'pickup' ? 'pickup' : 'delivery');
      setPaymentMethod('qris');
      setShowQrisScreen(false);
      setIsSuccess(false);
      setOrderResult(null);
      setSlaSecondsLeft(slaInitialMinutes * 60);
      setRating(5);
      setRatingSubmitted(false);

      // Re-sync referral from storage if current input is empty
      const savedRef = getInitialReferral();
      if (savedRef) {
        setFriendReferralCode(savedRef);
      }
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

  // Deteksi FnB vs Non-FnB (Galon, Gas, Laundry, Jasa boleh nampilin logo/ikon toko tanpa wajib foto produk)
  const isFnB = service?.category === 'makanan' ||
                service?.category === 'Warung & Kuliner' ||
                (service?.name || service?.title || '').toLowerCase().includes('makan') ||
                (service?.name || service?.title || '').toLowerCase().includes('warung') ||
                (service?.name || service?.title || '').toLowerCase().includes('resto') ||
                (service?.name || service?.title || '').toLowerCase().includes('bento') ||
                (service?.name || service?.title || '').toLowerCase().includes('roti') ||
                (service?.name || service?.title || '').toLowerCase().includes('martabak');

  // Hitung akumulasi pesanan riil untuk validasi Real Best Seller berbasis data
  let dynamicSalesMap = {};
  try {
    const rawSales = typeof window !== 'undefined' ? localStorage.getItem('kostku_product_sales') : null;
    if (rawSales) dynamicSalesMap = JSON.parse(rawSales);
  } catch (e) {}

  const getBaseSold = (p, pIdx) => {
    if (typeof p.totalSold === 'number' && p.totalSold > 0) return p.totalSold;
    if (p.isBestSeller) return 120 + ((p.name.length * 7) % 80);
    if (pIdx === 0) return 65 + ((p.name.length * 5) % 40);
    return 25 + ((p.name.length * 3) % 35);
  };

  const maxSoldAcrossProds = Math.max(
    ...rawProducts.map((p, pIdx) => getBaseSold(p, pIdx) + Number(dynamicSalesMap[p.id] || dynamicSalesMap[p.name] || 0)),
    0
  );

  const processedProds = rawProducts.map((p, pIdx) => {
    const effectiveSold = getBaseSold(p, pIdx) + Number(dynamicSalesMap[p.id] || dynamicSalesMap[p.name] || 0);
    const isRealTopSeller = maxSoldAcrossProds > 0 && effectiveSold === maxSoldAcrossProds;
    const isStorePick = Boolean(p.isBestSeller) && !isRealTopSeller;
    return {
      ...p,
      effectiveSold,
      isRealTopSeller,
      isStorePick
    };
  });

  // Urutkan produk: Terlaris riil paling atas, disusul rekomendasi toko, lalu harga termurah
  const productsList = [...processedProds].sort((a, b) => {
    if (a.isRealTopSeller && !b.isRealTopSeller) return -1;
    if (!a.isRealTopSeller && b.isRealTopSeller) return 1;
    return (Number(a.price) || 0) - (Number(b.price) || 0);
  });

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
  
  // Ongkos kirim jika mode antar
  const deliveryFee = (selectedDeliveryMode === 'delivery') ? (Number(service?.deliveryFee) || 0) : 0;

  // Biaya Layanan: Flat KostKu Rp 500 (Biaya extra owner kost ke mitra dihapus, diganti reward poin +100 Poin)
  const platformFee = 500; // Flat Rp 500 KostKu
  const ownerMarkupFee = 0; // Biaya extra owner dihapus
  const ownerCommission = 0;
  const totalAdminFee = platformFee; // Hanya flat Rp 500 KostKu
  const pointsDiscount = usePointsDiscount ? Math.min(userLoyaltyPoints, 100) : 0;
  const grandTotal = Math.max(0, effectiveSubtotal + totalAdminFee + deliveryFee - pointsDiscount);
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
        kostUid: kost?.uid || user?.kostUid || 'KOST-OJN64X',
        userId: user?.id || user?.uid || 'GUEST',
        userName: customerName.trim() || 'Penghuni Kost',
        userPhone: customerPhone.trim() || '-',
        roomNumber: roomNumber.trim() || user?.kamar || '122',
        merchantId: service?.id || null,
        merchantName: service?.name || service?.title || 'Mitra UMKM',
        serviceName: service?.title || service?.name || 'Pesanan Layanan',
        items: itemsToSubmit,
        subtotal: effectiveSubtotal,
        ownerCommission,
        platformFee,
        deliveryMode: selectedDeliveryMode,
        deliveryFee,
        total: grandTotal,
        paymentMethod: activeMethod,
        notes: `Metode: ${selectedDeliveryMode === 'pickup' ? 'Ambil di Ruko' : 'Diantar ke Kamar'}. Waktu: ${preferredTime}. Catatan: ${notes.trim()}`
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

      // Referral & Points Reward (+100 Poin otomatis sesuai arahan Mbak Rena)
      try {
        const cleanRef = friendReferralCode.trim().toUpperCase();
        if (cleanRef) {
          localStorage.setItem('kostku_last_referral_code', cleanRef);
        }
        const stored = localStorage.getItem('kostUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          const currentPts = Number(parsed.loyalty_points ?? 250);
          const isNewcomerMerchant = Boolean(service?.isNewcomer || service?.isNew);
          const earnedPts = isNewcomerMerchant ? 150 : 100;
          const nextPts = Math.max(0, currentPts - pointsDiscount) + earnedPts;
          parsed.loyalty_points = nextPts;
          if (cleanRef) {
            parsed.lastUsedReferral = cleanRef;
          }
          localStorage.setItem('kostUser', JSON.stringify(parsed));
          window.dispatchEvent(new Event('kostUser_updated'));
        }
      } catch (e) {
        console.warn('Failed to update points:', e);
      }

      // Save merchant ID for "Beli Lagi" quick repeat order filter
      try {
        if (service?.id) {
          const storedMerchants = localStorage.getItem('kostku_ordered_merchants');
          const parsedMerchants = storedMerchants ? JSON.parse(storedMerchants) : [];
          if (!parsedMerchants.includes(service.id)) {
            parsedMerchants.push(service.id);
            localStorage.setItem('kostku_ordered_merchants', JSON.stringify(parsedMerchants));
          }
          window.dispatchEvent(new Event('kostku_partner_order_created'));
        }
      } catch (e) {
        console.warn('Failed to save ordered merchant:', e);
      }

      // Akumulasikan volume transaksi nyata per produk untuk validasi Real Best Seller
      try {
        const storedSales = localStorage.getItem('kostku_product_sales');
        const salesMap = storedSales ? JSON.parse(storedSales) : {};
        itemsToSubmit.forEach(it => {
          const key = it.id || it.name;
          salesMap[key] = (salesMap[key] || 0) + (Number(it.qty) || 1);
        });
        localStorage.setItem('kostku_product_sales', JSON.stringify(salesMap));
        window.dispatchEvent(new Event('kostku_sales_updated'));
      } catch (e) {
        console.warn('Failed to update product sales count:', e);
      }

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

  const handleDownloadQr = async () => {
    const targetUrl = qrisData?.qrCodeUrl || service?.qrisImage;
    if (!targetUrl || downloadingQr) return;
    
    setDownloadingQr(true);
    try {
      const sanitizedName = (service?.name || service?.title || 'Mitra').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `QRIS_${sanitizedName}_${Date.now()}.png`;

      if (typeof targetUrl === 'string' && targetUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = targetUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const res = await fetch(targetUrl);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
      setQrDownloaded(true);
      setTimeout(() => setQrDownloaded(false), 2500);
    } catch (err) {
      console.error('Gagal mengunduh QRIS:', err);
      if (typeof targetUrl === 'string') {
        window.open(targetUrl, '_blank');
      }
    } finally {
      setDownloadingQr(false);
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

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(5, 10, 20, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} className="animate-fade-in">

      <div id="partner-order-modal" style={{
        background: isLight ? '#ffffff' : '#0a101f',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '1.2rem',
        boxShadow: isLight ? '0 25px 65px -15px rgba(15, 23, 42, 0.25)' : '0 25px 65px -15px rgba(0, 0, 0, 0.85)',
        position: 'relative'
      }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              overflow: 'hidden',
              flexShrink: 0,
              background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.12)',
              border: isLight ? '1.5px solid rgba(15, 23, 42, 0.1)' : '1.5px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.06)' : '0 3px 10px rgba(0,0,0,0.3)'
            }}>
              {service.logo ? (
                <img src={service.logo} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.6rem' }}>{service.icon || '🏪'}</span>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  {service.name || service.title}
                </h3>
                {service.isMainPartner || service.partnershipType === 'main' ? (
                  <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: isLight ? '#b45309' : '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 800 }}>
                    👑 Mitra Utama Kost
                  </span>
                ) : service.isShared || service.partnershipType === 'shared' ? (
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.2)', color: isLight ? '#15803d' : '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)', fontWeight: 700 }}>
                    🤝 Mitra Bersama Multi-Kost
                  </span>
                ) : (
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.2)', color: isLight ? '#1d4ed8' : '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', fontWeight: 700 }}>
                    🌐 Mitra Jaringan Sekitar
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: isLight ? '#64748b' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="#3b82f6" />
                {service.address || `${service.distanceKm || 0.2} km dari kost`} • Antar ke Pintu Kamar
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            style={{ 
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)', 
              border: isLight ? '1px solid #e2e8f0' : 'none', 
              color: isLight ? '#475569' : '#94a3b8', 
              cursor: 'pointer', 
              borderRadius: '50%', 
              padding: '6px' 
            }}
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
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.9)',
              border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(34, 197, 94, 0.35)',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Nomor Tiket:</span>
                <span style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>{orderResult?.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Tujuan Pengantaran:</span>
                <span style={{ color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 700 }}>Kamar {roomNumber} ({customerName})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Metode Pembayaran:</span>
                <span style={{
                  color: paymentMethod === 'qris' ? (isLight ? '#15803d' : '#22c55e') : paymentMethod === 'monthly_bill' ? (isLight ? '#2563eb' : '#60a5fa') : (isLight ? '#b45309' : '#facc15'),
                  fontWeight: 700
                }}>
                  {paymentMethod === 'qris' ? '🟢 Lunas (QRIS Non-Tunai)' : paymentMethod === 'monthly_bill' ? '🔵 Masuk Tagihan Sewa' : '⚪ Tunai COD'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Total Tagihan:</span>
                <span style={{ color: isLight ? '#15803d' : '#4ade80', fontWeight: 800, fontSize: '0.95rem' }}>
                  Rp {(orderResult?.total || grandTotal).toLocaleString('id-ID')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Estimasi Sampai:</span>
                <span style={{ color: isLight ? '#b45309' : '#facc15', fontWeight: 700 }}>
                  {service.name?.toLowerCase().includes('galon') || service.title?.toLowerCase().includes('galon') ? '15 - 20 Menit' : 'Sesuai Jadwal'}
                </span>
              </div>
            </div>

            {/* SLA Real-Time Countdown Timer */}
            <div style={{
              background: slaSecondsLeft > 0 
                ? (isLight ? '#f0f9ff' : 'rgba(56, 189, 248, 0.1)') 
                : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'),
              border: `1px solid ${slaSecondsLeft > 0 
                ? (isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.35)') 
                : (isLight ? '#fecaca' : 'rgba(239, 68, 68, 0.4)')}`,
              borderRadius: '16px',
              padding: '1rem',
              textAlign: 'left',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color={slaSecondsLeft > 0 ? (isLight ? '#0284c7' : '#38bdf8') : '#ef4444'} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                    SLA Pengantaran Mitra
                  </span>
                </div>
                <span style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: slaSecondsLeft > 0 ? (isLight ? '#0284c7' : '#38bdf8') : '#ef4444'
                }}>
                  {formatSlaCountdown(slaSecondsLeft)}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8' }}>
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
              <span style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b', display: 'block', marginTop: '4px' }}>
                Format otomatis memuat nomor kamar, nama pemesan, dan batas SLA pengantaran.
              </span>
            </div>

            {/* Rating Mitra UMKM */}
            <div style={{
              background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', marginBottom: '8px' }}>
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
            {/* Gateway Status & Payment Polling Badge (Clean Centered Header) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '999px',
                background: qrisData?.provider === 'midtrans_production'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : qrisData?.provider === 'midtrans_sandbox'
                  ? 'rgba(234, 179, 8, 0.15)'
                  : 'rgba(34, 197, 94, 0.15)',
                color: qrisData?.provider === 'midtrans_production'
                  ? '#f87171'
                  : qrisData?.provider === 'midtrans_sandbox'
                  ? '#facc15'
                  : (isLight ? '#16a34a' : '#4ade80'),
                border: qrisData?.provider === 'midtrans_production'
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : qrisData?.provider === 'midtrans_sandbox'
                  ? '1px solid rgba(234, 179, 8, 0.3)'
                  : (isLight ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(34, 197, 94, 0.25)'),
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                {qrisData?.provider === 'midtrans_production'
                  ? 'Midtrans Production API'
                  : qrisData?.provider === 'midtrans_sandbox'
                  ? 'Midtrans Sandbox API'
                  : 'ASPI Dynamic QRIS EMVCo'}
              </span>
              {isPolling && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: isLight ? '#0284c7' : '#38bdf8',
                  background: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(56, 189, 248, 0.12)',
                  border: isLight ? '1px solid rgba(2, 132, 199, 0.2)' : '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <RefreshCw size={11} className="animate-spin" /> Menunggu Pembayaran...
                </span>
              )}
            </div>

            {/* REAL QRIS WHITE CONTAINER */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.25rem',
              display: 'inline-block',
              margin: '0 auto 1rem auto',
              boxShadow: isLight
                ? '0 16px 40px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)'
                : '0 20px 48px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              maxWidth: '310px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* QRIS Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#dc2626', letterSpacing: '1.5px', fontFamily: 'system-ui, sans-serif' }}>QRIS</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>ASPI / BANK INDONESIA</span>
              </div>

              {/* Scannable Dynamic QRIS Code */}
              <div style={{
                width: '210px',
                height: '210px',
                margin: '0 auto',
                background: '#ffffff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid #f1f5f9'
              }}>
                {qrisLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <RefreshCw size={28} className="animate-spin" color="#2563eb" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Membuat QRIS Dinamis...</span>
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
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>
                  {qrisData?.merchantName || service.name?.toUpperCase() || 'DEPOT AIR & GAS BAROKAH'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginTop: '2px', letterSpacing: '0.3px' }}>
                  NMID: {qrisData?.nmid || service.nmid || 'ID1020268892019'}
                </div>
              </div>
            </div>

            {/* Dynamic Rupee Amount Badge (Clean Minimalist) */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Nominal Pas Terkunci Dinamis
              </div>
              <div style={{ fontSize: '1.95rem', fontWeight: 900, color: isLight ? '#15803d' : '#22c55e', margin: '4px 0 0 0', letterSpacing: '-0.5px' }}>
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Auto-Polling Status Alert Strip */}
            <div style={{
              background: isLight ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.1)',
              border: isLight ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '9px 14px',
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #22c55e',
                  flexShrink: 0
                }} className="animate-pulse" />
                <span style={{ color: isLight ? '#166534' : '#cbd5e1' }}>
                  <strong>Auto-Polling Aktif:</strong> Sistem mendeteksi otomatis saat Anda selesai transfer.
                </span>
              </div>
            </div>

            {/* Download QR Code Button (Simpan Gambar QR) */}
            <div style={{ marginBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={downloadingQr || (!qrisData?.qrCodeUrl && !service?.qrisImage)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: qrDownloaded
                    ? (isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.2)')
                    : (isLight ? '#f1f5f9' : 'rgba(99, 102, 241, 0.12)'),
                  border: qrDownloaded
                    ? '1px solid rgba(34, 197, 94, 0.4)'
                    : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(99, 102, 241, 0.3)'),
                  borderRadius: '12px',
                  color: qrDownloaded
                    ? (isLight ? '#15803d' : '#4ade80')
                    : (isLight ? '#334155' : '#a5b4fc'),
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: downloadingQr ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  transition: 'all 0.2s ease'
                }}
              >
                {downloadingQr ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menyiapkan Gambar QR...</span>
                  </>
                ) : qrDownloaded ? (
                  <>
                    <Check size={15} />
                    <span>✓ QR Code Berhasil Diunduh!</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Unduh QR Code (Simpan Gambar)</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Gateway Check Feedback Notice */}
            {checkNotice && (
              <div style={{
                background: checkNotice.type === 'pending'
                  ? (isLight ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.12)')
                  : checkNotice.type === 'error'
                  ? (isLight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.12)')
                  : (isLight ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.12)'),
                border: `1px solid ${checkNotice.type === 'pending' ? 'rgba(234, 179, 8, 0.35)' : checkNotice.type === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`,
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '0.85rem',
                fontSize: '0.78rem',
                color: checkNotice.type === 'pending'
                  ? (isLight ? '#a16207' : '#fde047')
                  : checkNotice.type === 'error'
                  ? (isLight ? '#b91c1c' : '#fca5a5')
                  : (isLight ? '#15803d' : '#86efac'),
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
                        padding: '6px 12px',
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
                        padding: '6px 12px',
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleCheckQrisPaymentStatus(false)}
                disabled={checkingStatus || submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  boxShadow: '0 4px 18px rgba(34, 197, 94, 0.45)',
                  cursor: (checkingStatus || submitting) ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '12px'
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
                    <span>Cek Status Pembayaran (Saya Sudah Bayar)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowQrisScreen(false)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  fontSize: '0.8rem',
                  padding: '10px',
                  borderRadius: '10px'
                }}
              >
                &larr; Ubah Rincian / Pilih Metode Lain
              </button>
            </div>
          </div>
        ) : (
          /* SCREEN 3: PRODUCT CATALOGUE & NON-COD PAYMENT CHOOSER */
          <form onSubmit={e => { e.preventDefault(); handleProceedOrder(); }}>
            {/* Promo Banner Toko Baru (Masa Inkubasi) */}
            {Boolean(service?.isNewcomer || service?.isNew) && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15))',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '10px',
                padding: '9px 12px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '9px'
              }}>
                <span style={{ fontSize: '1.25rem' }}>🎁</span>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8' }}>
                    Promo Toko Baru: Dapatkan +150 Poin Ekstra!
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
                    Dukung UMKM baru di sekitar kost dan dapatkan bonus 150 loyalty points untuk pesanan ini.
                  </div>
                </div>
              </div>
            )}

            {/* Banner Toko Mandiri */}
            {Boolean(service?.isIndependent || service?.partnershipType === 'independent') && !service?.isNewcomer && (
              <div style={{
                background: 'rgba(2, 132, 199, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '10px',
                padding: '9px 12px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '9px'
              }}>
                <span style={{ fontSize: '1.15rem' }}>🏪</span>
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8' }}>
                    UMKM Mandiri Sekitar Kost
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    Warung lokal bebas kemitraan khusus, diantar langsung oleh kurir toko ke gerbang/kamar kost.
                  </div>
                </div>
              </div>
            )}

            {/* 1. Pilih Produk / Katalog Barang */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Pilih Produk & Jumlah:
                </label>
                <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  Katalog Resmi Merchant
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {productsList.map((prod, pIdx) => {
                  const qty = quantities[prod.id] || 0;
                  const isLowest = pIdx === 0;
                  return (
                    <div
                      key={prod.id}
                      style={{
                        background: qty > 0 
                          ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.08)') 
                          : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)'),
                        border: qty > 0 
                          ? (isLight ? '1.5px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.4)') 
                          : (isLight ? '1px solid #e2e8f0' : '1px solid var(--border-color)'),
                        borderRadius: '10px',
                        padding: '6px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        {/* Foto Menu untuk FnB / Foto atau Ikon Spesifik untuk Non-FnB */}
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                          border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.06)' : '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>
                              {prod.name.toLowerCase().includes('gas') ? '🔥'
                                : prod.name.toLowerCase().includes('aqua') ? '🌊'
                                : prod.name.toLowerCase().includes('minerale') ? '🧊'
                                : prod.name.toLowerCase().includes('galon') || prod.name.toLowerCase().includes('air') ? '💧'
                                : prod.name.toLowerCase().includes('setrika') ? '👔'
                                : prod.name.toLowerCase().includes('sprei') || prod.name.toLowerCase().includes('bed') ? '🛏️'
                                : prod.name.toLowerCase().includes('express') || prod.name.toLowerCase().includes('kilat') ? '⚡'
                                : prod.name.toLowerCase().includes('cuci') ? '🧺'
                                : (service.icon || '🏷️')}
                            </span>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc' }}>
                              {prod.name}
                            </span>
                            {prod.isRealTopSeller ? (
                              <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 800 }}>
                                🔥 Terlaris ({prod.effectiveSold || prod.totalSold || 30}x Dipesan)
                              </span>
                            ) : (prod.isStorePick || prod.isBestSeller) ? (
                              <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: isLight ? '#b45309' : '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 800 }}>
                                ⭐ Rekomendasi Toko
                              </span>
                            ) : null}
                            {/* Badges sensor kamera HANYA untuk FnB, Non-FnB bebas dari warning foto */}
                            {isFnB && (
                              prod.isCameraVerified === true ? (
                                <span style={{
                                  fontSize: '0.58rem',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: isLight ? '#15803d' : '#34d399',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }} title="Foto Asli Kamera (Sensor PRNU & Defect Terverifikasi)">
                                  🛡️ Kamera Asli
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.58rem',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }} title="Foto Web/Katalog Internet (Gagal Sensor Kamera / Belum Terverifikasi Asli)">
                                  ⚠️ Foto Web
                                </span>
                              )
                            )}
                            {prod.brand && (
                              <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: isLight ? '#1d4ed8' : '#93c5fd', fontWeight: 700 }}>
                                {prod.brand}
                              </span>
                            )}
                            {isLowest && !prod.isBestSeller && (
                              <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: isLight ? '#15803d' : '#4ade80', fontWeight: 700 }}>
                                Paling Hemat
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.64rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prod.desc || 'Siap diantar'}
                          </div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: isLight ? '#1d4ed8' : '#60a5fa', marginTop: '1px' }}>
                            Rp {prod.price.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>

                      {/* Qty Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => updateQty(prod.id, -1)}
                          disabled={qty <= 0}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                            background: qty > 0 
                              ? (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)') 
                              : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.02)'),
                            color: qty > 0 ? (isLight ? '#0f172a' : '#f8fafc') : (isLight ? '#94a3b8' : '#64748b'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: qty > 0 ? 'pointer' : 'default'
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: '16px', textAlign: 'center', color: qty > 0 ? (isLight ? '#0f172a' : '#f8fafc') : (isLight ? '#94a3b8' : '#64748b') }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(prod.id, 1)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: isLight ? '1px solid #93c5fd' : '1px solid #3b82f6',
                            background: isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.25)',
                            color: isLight ? '#1d4ed8' : '#93c5fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Opsi Pengantaran & Pengambilan */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px', fontWeight: 700 }}>
                Metode Pengantaran / Pengambilan:
              </label>
              {service?.deliveryType === 'pickup' ? (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.1)',
                  border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.3)',
                  color: isLight ? '#b45309' : '#fbbf24',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  🏪 <strong>Wajib Ambil di Ruko / Toko:</strong> Mitra ini melayani pengambilan langsung di gerai/ruko.
                </div>
              ) : service?.deliveryType === 'delivery' ? (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)',
                  border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.3)',
                  color: isLight ? '#1d4ed8' : '#93c5fd',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  🛵 <strong>Diantar ke Kamar:</strong> Pesanan diantar sampai depan pintu kamar Anda {deliveryFee > 0 ? `(Ongkir Rp ${deliveryFee.toLocaleString('id-ID')})` : '(Gratis Ongkir)'}.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDeliveryMode('delivery')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: selectedDeliveryMode === 'delivery' 
                        ? '1.5px solid #2563eb' 
                        : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
                      background: selectedDeliveryMode === 'delivery' 
                        ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.2)') 
                        : (isLight ? '#ffffff' : 'rgba(255,255,255,0.03)'),
                      color: selectedDeliveryMode === 'delivery' 
                        ? (isLight ? '#1d4ed8' : '#fff') 
                        : (isLight ? '#475569' : '#94a3b8'),
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🛵 Bisa Diantar ke Kamar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDeliveryMode('pickup')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: selectedDeliveryMode === 'pickup' 
                        ? '1.5px solid #d97706' 
                        : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
                      background: selectedDeliveryMode === 'pickup' 
                        ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.2)') 
                        : (isLight ? '#ffffff' : 'rgba(255,255,255,0.03)'),
                      color: selectedDeliveryMode === 'pickup' 
                        ? (isLight ? '#b45309' : '#fff') 
                        : (isLight ? '#475569' : '#94a3b8'),
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🏪 Ambil Sendiri di Ruko
                  </button>
                </div>
              )}
            </div>

            {/* 3. Informasi Kamar & Waktu */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
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
                <label style={{ display: 'block', fontSize: '0.76rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
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
              <label style={{ display: 'block', fontSize: '0.76rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
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
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Metode Pembayaran (Utamakan Non-Tunai):
                </label>
                <span style={{ fontSize: '0.68rem', color: isLight ? '#15803d' : '#22c55e', fontWeight: 700 }}>
                  Bebas Ribet Kembalian
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Opsi 1: QRIS INSTAN (REKOMENDASI UTAMA) */}
                <div
                  onClick={() => setPaymentMethod('qris')}
                  style={{
                    cursor: 'pointer',
                    background: paymentMethod === 'qris' 
                      ? (isLight ? '#ecfdf5' : 'rgba(34, 197, 94, 0.12)') 
                      : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)'),
                    border: paymentMethod === 'qris' 
                      ? (isLight ? '1.5px solid #16a34a' : '1.5px solid #22c55e') 
                      : (isLight ? '1px solid #e2e8f0' : '1px solid var(--border-color)'),
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
                      color: isLight ? '#15803d' : '#4ade80',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <QrCode size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc' }}>
                          QRIS Instan (Semua E-Wallet & Bank)
                        </span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: '#22c55e', color: '#0f172a', fontWeight: 800 }}>
                          REKOMENDASI
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8' }}>
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
                    background: paymentMethod === 'monthly_bill' 
                      ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.12)') 
                      : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)'),
                    border: paymentMethod === 'monthly_bill' 
                      ? (isLight ? '1.5px solid #2563eb' : '1.5px solid #3b82f6') 
                      : (isLight ? '1px solid #e2e8f0' : '1px solid var(--border-color)'),
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
                      color: isLight ? '#1d4ed8' : '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Receipt size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', display: 'block' }}>
                        Titip ke Tagihan Sewa Bulan Depan
                      </span>
                      <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8' }}>
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
                    background: paymentMethod === 'cod' 
                      ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.08)') 
                      : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.01)'),
                    border: paymentMethod === 'cod' 
                      ? (isLight ? '1.5px solid #d97706' : '1.5px solid rgba(245, 158, 11, 0.6)') 
                      : (isLight ? '1px solid #e2e8f0' : '1px solid var(--border-color)'),
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: 0.9
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1rem' }}>💵</span>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isLight ? '#0f172a' : '#e2e8f0', display: 'block' }}>
                        Bayar Tunai saat Diantar (COD)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: isLight ? '#b45309' : '#fbbf24' }}>
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

            {/* 3.5. REFERRAL CODE & DISKON POIN (KHUSUS MITRA - SESUAI ARAHAN MBAK RENA) */}
            <div style={{
              background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.04)',
              border: isLight ? '1px dashed #f59e0b' : '1px dashed rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              padding: '8px 10px',
              marginBottom: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isLight ? '#b45309' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🎁 Referral Teman & Diskon PoinKu
                </span>
                <span style={{ fontSize: '0.66rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  Saldo: <strong style={{ color: isLight ? '#b45309' : '#fbbf24' }}>{userLoyaltyPoints} Poin</strong>
                </span>
              </div>

              {/* Status / Input Kode Referral Teman (Otomatis Terpakai dari Terakhir Digunakan) */}
              {friendReferralCode && !isEditingReferral ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isLight ? '#ecfdf5' : 'rgba(34, 197, 94, 0.1)',
                  border: isLight ? '1px solid #86efac' : '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  marginBottom: '5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.76rem', color: '#16a34a' }}>✓</span>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isLight ? '#15803d' : '#4ade80' }}>
                        Kode Otomatis Aktif: <strong style={{ color: isLight ? '#0f172a' : '#fff', letterSpacing: '0.5px' }}>{friendReferralCode}</strong>
                      </span>
                      <div style={{ fontSize: '0.58rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                        (Tersimpan otomatis • Teman +100, Kamu +100)
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingReferral(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isLight ? '#0284c7' : '#38bdf8',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                  <input
                    type="text"
                    value={friendReferralCode}
                    onChange={e => setFriendReferralCode(e.target.value.toUpperCase())}
                    placeholder="Punya Kode Teman? (e.g. KOST-102)"
                    style={{
                      flex: 1,
                      background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.35)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      color: isLight ? '#0f172a' : '#f8fafc'
                    }}
                  />
                  {isEditingReferral && (
                    <button
                      type="button"
                      onClick={() => setIsEditingReferral(false)}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Simpan
                    </button>
                  )}
                </div>
              )}

              {/* Checkbox Tukar Poin Diskon */}
              {userLoyaltyPoints >= 100 && (
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.7rem',
                  color: isLight ? '#334155' : '#cbd5e1',
                  cursor: 'pointer',
                  userSelect: 'none',
                  marginTop: '3px'
                }}>
                  <input
                    type="checkbox"
                    checked={usePointsDiscount}
                    onChange={e => setUsePointsDiscount(e.target.checked)}
                    style={{ accentColor: '#f59e0b', width: '13px', height: '13px' }}
                  />
                  <span>
                    Gunakan <strong>100 Poin</strong> untuk potong harga <strong>-Rp 100</strong>
                  </span>
                </label>
              )}

              {/* Proteksi Mitra UMKM Notice */}
              <div style={{
                fontSize: '0.62rem',
                color: isLight ? '#475569' : '#94a3b8',
                marginTop: '4px',
                lineHeight: 1.3,
                background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                padding: '4px 8px',
                borderRadius: '5px'
              }}>
                🛡️ <strong style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>Proteksi Mitra:</strong> Mitra tetap terima 100% uang makanan & ongkir utuh tanpa potongan. Anda otomatis dapat <strong style={{ color: isLight ? '#15803d' : '#4ade80' }}>+100 Poin reward</strong> setelah pesanan berhasil!
              </div>
            </div>

            {/* 4. BREAKDOWN RINCIAN TRANSAKSI TRANSPARAN */}
            <div style={{
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.75)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '1.25rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: isLight ? '#64748b' : '#94a3b8' }}>
                <span>Harga Produk Mitra ({selectedItems.length || 1} item)</span>
                <span style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 600 }}>Rp {effectiveSubtotal.toLocaleString('id-ID')}</span>
              </div>
              {selectedDeliveryMode === 'delivery' && deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: isLight ? '#64748b' : '#94a3b8' }}>
                  <span>Ongkos Kirim ke Kamar</span>
                  <span style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 600 }}>Rp {deliveryFee.toLocaleString('id-ID')}</span>
                </div>
              )}
              {selectedDeliveryMode === 'pickup' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: isLight ? '#64748b' : '#94a3b8' }}>
                  <span>Metode Pengambilan</span>
                  <span style={{ color: isLight ? '#b45309' : '#fbbf24', fontWeight: 600 }}>Ambil Sendiri di Ruko (Bebas Ongkir)</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: isLight ? '#64748b' : '#94a3b8' }}>
                <div>
                  <span style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 600 }}>Biaya Layanan & Admin</span>
                  <div style={{ fontSize: '0.67rem', color: isLight ? '#94a3b8' : '#64748b' }}>Flat KostKu Rp 500 (Bebas Biaya Extra Owner)</div>
                </div>
                <span style={{ color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 700 }}>Rp {totalAdminFee.toLocaleString('id-ID')}</span>
              </div>
              {pointsDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: isLight ? '#b45309' : '#fbbf24', fontWeight: 600 }}>
                  <span>Diskon Poin Referral</span>
                  <span>-Rp {pointsDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                paddingTop: '8px',
                fontWeight: 800,
                fontSize: '0.92rem',
                color: isLight ? '#0f172a' : '#f8fafc'
              }}>
                <span>Total Pembayaran Tenant:</span>
                <span style={{ color: isLight ? '#15803d' : '#4ade80' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '6px', textAlign: 'center' }}>
                💡 Admin Fee Transparan: Flat KostKu Rp 500 & Admin Pengelola disatukan • Tanpa Biaya Tersembunyi
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
    </div>,
    document.body
  );
};

export default PartnerOrderModal;
