import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Utensils,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Building,
  RotateCcw,
  Check,
  ChevronRight,
  Plus,
  Minus,
  X,
  CreditCard,
  Gift,
  HelpCircle,
  Award,
  Sun,
  Moon,
  MapPin,
  MessageSquare,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function OrderMeja() {
  const { tableToken } = useParams();
  const navigate = useNavigate();
  const { isLight, toggleTheme } = useTheme();

  // State Data
  const [tableInfo, setTableInfo] = useState({ number: 'Memuat Meja...', token: tableToken });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Makanan');

  // Current Logged-in User Detection
  const [currentUser] = useState(() => {
    try {
      const u = localStorage.getItem('currentUser');
      return u ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  });

  const [storeInfo, setStoreInfo] = useState(null);

  // Cart & Order Form State
  const [cart, setCart] = useState({});
  const [selectedQtys, setSelectedQtys] = useState({});
  const [customerName, setCustomerName] = useState(() => {
    try {
      const u = localStorage.getItem('currentUser');
      return u ? (JSON.parse(u).name || '') : '';
    } catch (_) {
      return '';
    }
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    try {
      const u = localStorage.getItem('currentUser');
      return u ? (JSON.parse(u).phone || '') : '';
    } catch (_) {
      return '';
    }
  });
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Promo Makanan State (Limit Kuota / Tanggal / Keduanya)
  const [promosList, setPromosList] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState(null);
  const [showPromoPicker, setShowPromoPicker] = useState(false);

  // Active Live Order Tracking State
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const saved = sessionStorage.getItem('kostku_pos_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    if (activeOrder) {
      sessionStorage.setItem('kostku_pos_active_order', JSON.stringify(activeOrder));
    }
  }, [activeOrder]);
  const [paymentData, setPaymentData] = useState(null);
  const [payingLoading, setPayingLoading] = useState(false);

  // Lucky Spin Wheel Modal & Animation State
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const canvasRef = useRef(null);
  const currentRotationRef = useRef(0);

  // Theme constants matching KostKu
  const bgPage = isLight ? '#f1f5f9' : '#0b0f19';
  const bgCard = isLight ? '#ffffff' : '#131b2e';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#475569' : '#94a3b8';
  const borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const borderLight = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)';

  // 1. Fetch Products & Table Info on Mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const resProd = await fetch('/api/pos/products');
        if (resProd.ok) setProducts(await resProd.json());

        const resTables = await fetch('/api/pos/tables');
        if (resTables.ok) {
          const tables = await resTables.json();
          const match = tables.find(t => t.qrToken === tableToken);
          if (match) {
            setTableInfo(match);
          } else {
            setTableInfo({ number: 'Meja Tamu', qrToken: tableToken });
          }
        }

        // Fetch validated store info
        const resStore = await fetch('/api/pos/store');
        if (resStore.ok) setStoreInfo(await resStore.json());

        // Fetch active food promos
        const resPromos = await fetch('/api/pos/promos');
        if (resPromos.ok) {
          const promoData = await resPromos.json();
          setPromosList(promoData.promos || []);
        }
      } catch (err) {
        console.warn('Gagal memuat katalog POS:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tableToken]);

  // 2. Fetch User Points when Phone Number is entered
  useEffect(() => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      fetch(`/api/pos/points/${cleanPhone}`)
        .then(r => r.json())
        .then(data => setUserPoints(data.points || 0))
        .catch(() => {});
    } else {
      setUserPoints(0);
    }
  }, [customerPhone]);

  // 3. Realtime Order Status Polling when Order is active
  useEffect(() => {
    if (!activeOrder?.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pos/orders/${activeOrder.id}`);
        if (res.ok) {
          const updated = await res.json();
          setActiveOrder(updated);

          if (
            (updated.status === 'PREPARING' || updated.status === 'PAID' || updated.status === 'BILLED_TO_ROOM') &&
            !updated.hasSpun &&
            !spinResult
          ) {
            setShowSpinModal(true);
          }
        }
      } catch (_) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [activeOrder?.id, spinResult]);

  const availableCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const categories = availableCategories.length > 0
    ? [...availableCategories, 'Semua']
    : ['Makanan', 'Snack', 'Minuman', 'Semua'];

  const filteredProducts = activeCategory === 'Semua' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const getCategoryIcon = (cat) => {
    const c = String(cat).toLowerCase();
    if (c.includes('makan')) return '🍜';
    if (c.includes('snack') || c.includes('camilan') || c.includes('goreng')) return '🍟';
    if (c.includes('minum') || c.includes('teh') || c.includes('kopi')) return '🥤';
    if (c.includes('paket')) return '🍱';
    return '🍽️';
  };

  // Direct quantity selector per product before adding to cart (auto reset to 1 after add)
  const getSelectedQty = (productId) => selectedQtys[productId] || 1;
  const updateSelectedQty = (productId, delta) => {
    setSelectedQtys(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(99, current + delta));
      return { ...prev, [productId]: next };
    });
  };
  const setDirectSelectedQty = (productId, val) => {
    const parsed = parseInt(val, 10);
    const next = isNaN(parsed) || parsed < 1 ? 1 : Math.min(99, parsed);
    setSelectedQtys(prev => ({ ...prev, [productId]: next }));
  };

  const addToCart = (product, quantity = 1) => {
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    setCart(prev => {
      const currentQty = prev[product.id]?.qty || 0;
      return {
        ...prev,
        [product.id]: {
          product,
          qty: currentQty + qtyToAdd,
          notes: prev[product.id]?.notes || ''
        }
      };
    });
    try { playChime(880, 0.08); } catch (_) {}
  };

  const handleAddWithQty = (product) => {
    const qty = getSelectedQty(product.id);
    addToCart(product, qty);
    // Reset back to 1 immediately so fingers don't get tired
    setSelectedQtys(prev => ({ ...prev, [product.id]: 1 }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const currentQty = prev[productId]?.qty || 0;
      if (currentQty <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          qty: currentQty - 1
        }
      };
    });
  };

  const cartItems = Object.values(cart);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  // Perhitungan Diskon Promo Makanan
  const calculatePromoDiscount = (promo, items) => {
    if (!promo || !items || items.length === 0) return 0;
    const subtotal = items.reduce((s, it) => s + (it.product.price * it.qty), 0);
    if (promo.minOrder && subtotal < promo.minOrder) return 0;

    if (promo.scope === 'SPECIFIC_ITEM' && promo.targetProductId) {
      const targetItems = items.filter(it => it.product.id === promo.targetProductId);
      const targetSubtotal = targetItems.reduce((s, it) => s + (it.product.price * it.qty), 0);
      if (targetSubtotal === 0) return 0;

      if (promo.discountType === 'PERCENT') {
        return Math.round(targetSubtotal * (Math.min(100, promo.discountValue) / 100));
      } else {
        const totalQty = targetItems.reduce((s, it) => s + it.qty, 0);
        return Math.min(targetSubtotal, promo.discountValue * totalQty);
      }
    } else {
      if (promo.discountType === 'PERCENT') {
        return Math.round(subtotal * (Math.min(100, promo.discountValue) / 100));
      } else {
        return Math.min(subtotal, promo.discountValue);
      }
    }
  };

  const promoDiscount = selectedPromo ? calculatePromoDiscount(selectedPromo, cartItems) : 0;
  const discountAmount = usePoints ? Math.min(Math.floor(userPoints / 100) * 1000, Math.max(0, cartSubtotal - promoDiscount)) : 0;
  // Kebijakan: Transaksi Mitra bebas biaya admin bagi pelanggan (beban ke owner/bisnis)
  const platformFee = 0; 
  const cartTotal = Math.max(0, cartSubtotal - promoDiscount - discountAmount);

  const handleApplyPromoCode = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await fetch('/api/pos/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoCode: code,
          items: cartItems.map(it => ({ productId: it.product.id, qty: it.qty })),
          subtotal: cartSubtotal
        })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        const matched = promosList.find(p => p.id === data.promoId) || {
          id: data.promoId,
          code: data.code,
          title: data.title,
          discountType: data.discountType,
          discountValue: data.discountValue,
          limitType: data.limitType,
          scope: 'ALL'
        };
        setSelectedPromo(matched);
        setPromoFeedback({ type: 'success', text: data.message });
      } else {
        setPromoFeedback({ type: 'error', text: data.error || 'Kode promo tidak valid atau kadaluarsa' });
      }
    } catch (err) {
      setPromoFeedback({ type: 'error', text: 'Gagal memvalidasi promo: ' + err.message });
    }
  };

  // 4. Handle Submit Order to Kitchen (Status: PENDING_CONFIRMATION)
  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;

    // VALIDASI WAJIB: Beli atas nama siapa!
    if (!customerName.trim()) {
      alert('Nama pemesan wajib diisi (beli atas nama siapa)!');
      return;
    }

    try {
      setSubmittingOrder(true);
      const payload = {
        tableToken: tableInfo.qrToken,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        isLoggedIn: Boolean(currentUser),
        items: cartItems.map(item => ({
          productId: item.product.id,
          qty: item.qty,
          notes: item.notes
        })),
        notes: orderNotes.trim(),
        pointsToRedeem: (currentUser && usePoints) ? Math.floor(discountAmount / 10) : 0,
        promoId: selectedPromo?.id || null,
        promoCode: selectedPromo?.code || null
      };

      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const order = await res.json();
        setActiveOrder(order);
        setCart({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengirim pesanan ke dapur');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // 5. Handle Payment Selection (QRIS TriPay Otomatis)
  const handleProcessPayment = async () => {
    if (!activeOrder?.id) return;
    try {
      setPayingLoading(true);
      const res = await fetch(`/api/pos/orders/${activeOrder.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'TRIPAY'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentData(data);
      } else {
        alert(data.error || 'Gagal memproses pembayaran QRIS');
      }
    } catch (err) {
      alert('Kesalahan pembayaran: ' + err.message);
    } finally {
      setPayingLoading(false);
    }
  };

  const playTone = (freq, duration, type = 'sine') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  };

  // 6. Draw Lucky Spin Wheel on Canvas
  const slices = [
    { label: '100 POIN', sub: 'JACKPOT', color: '#10B981', textColor: '#FFFFFF', pts: 100 },
    { label: '50 POIN', sub: 'MEDIUM', color: '#6366F1', textColor: '#FFFFFF', pts: 50 },
    { label: '25 POIN', sub: 'LUCKY', color: '#F59E0B', textColor: '#FFFFFF', pts: 25 },
    { label: '10 POIN', sub: 'MINI', color: '#EC4899', textColor: '#FFFFFF', pts: 10 },
    { label: '100 POIN', sub: 'JACKPOT', color: '#10B981', textColor: '#FFFFFF', pts: 100 },
    { label: '50 POIN', sub: 'MEDIUM', color: '#3B82F6', textColor: '#FFFFFF', pts: 50 },
    { label: '25 POIN', sub: 'LUCKY', color: '#8B5CF6', textColor: '#FFFFFF', pts: 25 },
    { label: '100 POIN', sub: 'JACKPOT', color: '#10B981', textColor: '#FFFFFF', pts: 100 }
  ];

  const drawWheel = (rotationAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = centerX - 10;
    const sliceAngle = (2 * Math.PI) / slices.length;

    ctx.clearRect(0, 0, width, height);

    slices.forEach((slice, i) => {
      const startAngle = rotationAngle + (i * sliceAngle);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = slice.textColor;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(slice.label, radius - 20, 5);
      ctx.font = '9px sans-serif';
      ctx.fillText(slice.sub, radius - 20, 18);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#1E293B';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#F8FAFC';
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', centerX, centerY + 4);
  };

  useEffect(() => {
    if (showSpinModal) {
      drawWheel(currentRotationRef.current);
    }
  }, [showSpinModal]);

  const handleSpinWheel = async () => {
    if (spinning || spinResult) return;
    try {
      setSpinning(true);
      const res = await fetch(`/api/pos/orders/${activeOrder.id}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customerPhone || activeOrder.customerPhone })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal memutar roda keberuntungan');
        setSpinning(false);
        return;
      }

      const sliceAngle = (2 * Math.PI) / slices.length;
      const targetIndex = data.targetSliceIndex || 0;
      const extraRotations = 6 * (2 * Math.PI);
      const finalAngle = extraRotations + (3 * Math.PI / 2) - ((targetIndex + 0.5) * sliceAngle);

      const startTime = performance.now();
      const duration = 4000;
      const startAngle = currentRotationRef.current % (2 * Math.PI);
      let lastTickAngle = startAngle;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentAngle = startAngle + (finalAngle - startAngle) * ease;

        drawWheel(currentAngle);

        if (Math.abs(currentAngle - lastTickAngle) >= sliceAngle) {
          playTone(400 + Math.random() * 200, 0.05, 'triangle');
          lastTickAngle = currentAngle;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentRotationRef.current = currentAngle;
          setSpinning(false);
          setSpinResult(data);
          playTone(523.25, 0.2);
          setTimeout(() => playTone(659.25, 0.2), 150);
          setTimeout(() => playTone(783.99, 0.4), 300);
        }
      };

      requestAnimationFrame(animate);
    } catch (err) {
      alert('Kesalahan koneksi saat spin: ' + err.message);
      setSpinning(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: bgPage,
      color: textPrimary,
      fontFamily: 'var(--font-main, "Plus Jakarta Sans", sans-serif)',
      paddingBottom: '8rem'
    }}>
      {/* ── TOP HEADER (CLEAN AIRY AESTHETIC) ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${borderColor}`,
        padding: '0.75rem 1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.25)'
            }}>
              <Utensils size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: textPrimary }}>
                  {storeInfo?.storeName || 'Kantin Riuph POS'}
                </h1>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '6px',
                  background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                  color: isLight ? '#b45309' : '#fbbf24'
                }}>
                  Self-Order
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                {tableInfo.number} {storeInfo?.location ? `• 📍 ${storeInfo.location}` : '• Pesan dari Meja'}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', color: textSecondary, display: 'block' }}>Poin Kamu</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
              <Award size={14} /> {userPoints} Pts
            </span>
          </div>
        </div>
      </header>

      {/* ── ACTIVE ORDER STATUS STEPPER (TRANSPARENT & CLEAR) ── */}
      {activeOrder && (
        <div style={{ maxWidth: '480px', margin: '1rem auto 0', padding: '0 1rem' }}>
          <div style={{
            background: bgCard,
            border: `1.5px solid ${borderColor}`,
            borderRadius: '18px',
            padding: '1rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                  Status Pesanan Meja
                </span>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
                  {activeOrder.id}
                </h3>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '9999px',
                background: activeOrder.status === 'PENDING_CONFIRMATION' ? '#fef3c7' :
                            activeOrder.status === 'WAITING_PAYMENT' ? '#dbeafe' :
                            activeOrder.status === 'PREPARING' ? '#dcfce7' : '#f3e8ff',
                color: activeOrder.status === 'PENDING_CONFIRMATION' ? '#b45309' :
                       activeOrder.status === 'WAITING_PAYMENT' ? '#1d4ed8' :
                       activeOrder.status === 'PREPARING' ? '#15803d' : '#7e22ce'
              }}>
                {activeOrder.status === 'PENDING_CONFIRMATION' && 'Menunggu ACC Dapur'}
                {activeOrder.status === 'WAITING_PAYMENT' && 'Siap Dibayar'}
                {activeOrder.status === 'PREPARING' && 'Sedang Dimasak 👨‍🍳'}
                {activeOrder.status === 'COMPLETED' && 'Selesai Disajikan ✨'}
                {activeOrder.status === 'CANCELLED' && 'Dibatalkan'}
              </span>
            </div>

            {/* Step Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center' }}>
              {['1. Masuk', '2. Cek Stok', '3. Dimasak', '4. Selesai'].map((step, idx) => {
                const isPassed = (idx === 0) ||
                  (idx === 1 && activeOrder.status !== 'PENDING_CONFIRMATION') ||
                  (idx === 2 && (activeOrder.status === 'PREPARING' || activeOrder.status === 'COMPLETED')) ||
                  (idx === 3 && activeOrder.status === 'COMPLETED');
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '5px 2px',
                      borderRadius: '8px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      background: isPassed ? (isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.2)') : (isLight ? '#f1f5f9' : '#1e293b'),
                      color: isPassed ? '#15803d' : textSecondary
                    }}
                  >
                    {step}
                  </div>
                );
              })}
            </div>

            {/* Explanation Notice */}
            {activeOrder.status === 'PENDING_CONFIRMATION' && (
              <div style={{
                background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.12)',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '0.78rem',
                color: isLight ? '#92400e' : '#fde68a',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <Clock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Dapur sedang memeriksa pesanan Anda...</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', opacity: 0.9 }}>
                    Koki memastikan semua menu tersedia. Setelah di-ACC, pilihan pembayaran akan otomatis muncul di layar ini.
                  </p>
                </div>
              </div>
            )}

            {/* Ready to Pay Notice */}
            {activeOrder.status === 'WAITING_PAYMENT' && (
              <div style={{
                background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.12)',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: isLight ? '#1e40af' : '#93c5fd' }}>
                      Semua menu tersedia! Silakan selesaikan pembayaran
                    </strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: textSecondary }}>
                      Total Tagihan (termasuk biaya admin Rp 100): <strong style={{ color: textPrimary, fontFamily: 'var(--font-mono)' }}>Rp {activeOrder.totalAmount?.toLocaleString('id-ID')}</strong>
                    </p>
                  </div>
                </div>

                {/* Pembayaran via QRIS TriPay Dinamis */}
                <div style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #bfdbfe',
                  background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: textPrimary }}>
                      Pembayaran QRIS TriPay Real-Time
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: textSecondary }}>
                      Bisa discan via BCA Mobile, Mandiri, BRImo, GoPay, OVO, Dana, &amp; ShopeePay.
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProcessPayment}
                  disabled={payingLoading}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <CreditCard size={18} />
                  {payingLoading ? 'Memproses Barcode QRIS...' : 'Bayar via QRIS Dinamis Sekarang'}
                </button>
              </div>
            )}

            {/* QRIS Display */}
            {paymentData && activeOrder.status === 'WAITING_PAYMENT' && (
              <div style={{
                background: bgCard,
                border: '1px solid #bfdbfe',
                borderRadius: '14px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                  Pindai QRIS TriPay
                </span>
                {paymentData.qrDataUrl && (
                  <img src={paymentData.qrDataUrl} alt="QRIS" style={{ width: '180px', height: '180px', margin: '0 auto', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '6px' }} />
                )}
                <div style={{ fontSize: '0.82rem', color: textSecondary }}>
                  Total Bayar: <strong style={{ color: '#16a34a', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>Rp {paymentData.total?.toLocaleString('id-ID')}</strong>
                </div>
                <button
                  onClick={() => {
                    fetch(`/api/pos/orders/${activeOrder.id}/confirm-payment`, { method: 'POST' })
                      .then(() => {
                        setPaymentData(null);
                        setShowSpinModal(true);
                      });
                  }}
                  style={{
                    padding: '9px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Simulasi: Saya Sudah Bayar
                </button>
              </div>
            )}

            {/* Cooking State & Live Item-by-Item Kitchen Tracker */}
            {activeOrder.status === 'PREPARING' && (() => {
              const readyCount = (activeOrder.items || []).filter(it => it.isReady).length;
              const totalItems = (activeOrder.items || []).length;
              const allItemsReady = totalItems > 0 && readyCount === totalItems;

              return (
                <div style={{
                  background: allItemsReady
                    ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)')
                    : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)'),
                  border: `1.5px solid ${allItemsReady ? '#86efac' : borderColor}`,
                  borderRadius: '14px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {/* Status Banner Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{
                        fontSize: '0.85rem',
                        color: allItemsReady ? '#16a34a' : (isLight ? '#0f172a' : '#f8fafc'),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {allItemsReady ? '✨ Semua Menu Sudah Siap!' : '👨‍🍳 Sedang Dimasak di Dapur'}
                      </strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: textSecondary }}>
                        {allItemsReady
                          ? 'Pelayan sedang membawa nampan ke mejamu.'
                          : `${readyCount} dari ${totalItems} menu sudah matang & siap di nampan.`}
                      </p>
                    </div>

                    {!activeOrder.hasSpun && !spinResult && (
                      <button
                        onClick={() => setShowSpinModal(true)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        <Gift size={14} /> Spin Poin!
                      </button>
                    )}
                  </div>

                  {/* Readiness Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '999px',
                    background: isLight ? '#e2e8f0' : '#1e293b',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.round((readyCount / Math.max(1, totalItems)) * 100)}%`,
                      height: '100%',
                      background: allItemsReady
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #3b82f6, #10b981)',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  {/* Item by Item Status Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Status Kesiapan Tiap Menu:
                    </span>
                    {(activeOrder.items || []).map((it, idx) => {
                      const isItemReady = Boolean(it.isReady);
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '10px',
                            background: isItemReady
                              ? (isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.15)')
                              : (isLight ? '#ffffff' : '#1e293b'),
                            border: `1px solid ${isItemReady ? '#bbf7d0' : borderColor}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: isItemReady ? '#15803d' : textPrimary
                          }}>
                            {isItemReady ? '✅ ' : '⏳ '}
                            <strong>{it.qty}x</strong> {it.name}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: isItemReady ? '#16a34a' : (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)'),
                            color: isItemReady ? '#ffffff' : (isLight ? '#b45309' : '#fbbf24')
                          }}>
                            {isItemReady ? 'Sudah Siap' : 'Sedang Dimasak'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── MENU CATALOG & FORM ── */}
      <main style={{ maxWidth: '480px', margin: '1rem auto 0', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Customer Identity & Notes Card */}
        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '1rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase' }}>
              Data Pemesan (Beli Atas Nama)
            </span>
            {currentUser ? (
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <CheckCircle2 size={12} /> Member Login
              </span>
            ) : (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <AlertTriangle size={12} /> Tamu (Tanpa Akun)
              </span>
            )}
          </div>

          {/* Member Login Notice vs Guest Notice */}
          {currentUser ? (
            <div style={{
              background: isLight ? '#f0fdf4' : 'rgba(34, 197, 94, 0.12)',
              border: '1px solid #86efac',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              color: isLight ? '#166534' : '#86efac',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Sparkles size={13} style={{ flexShrink: 0 }} />
              <span>Login sebagai <strong>{currentUser.name}</strong> • Berhak mendapatkan Poin Loyalitas & Lucky Spin!</span>
            </div>
          ) : (
            <div style={{
              background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.12)',
              border: '1px solid #fde68a',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              color: isLight ? '#92400e' : '#fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span>Memesan sebagai Tamu. Poin loyalitas & spin hanya berlaku bagi yang login akun KostKu.</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '3px' }}>
                Atas Nama Siapa? <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Mas Budi / Rina..."
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minWidth: 0,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: !customerName.trim() ? '1.5px solid #f87171' : `1px solid ${borderLight}`,
                  background: isLight ? '#f8fafc' : '#1e293b',
                  color: textPrimary,
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '3px' }}>
                No. WhatsApp
              </label>
              <input
                type="tel"
                placeholder="0812xxxxxxxx"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minWidth: 0,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${borderLight}`,
                  background: isLight ? '#f8fafc' : '#1e293b',
                  color: textPrimary,
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* Catatan Kustom ke Kasir / Dapur */}
          <div style={{ marginTop: '2px' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <MessageSquare size={12} />
              <span>Catatan Kustom ke Kasir / Dapur (Opsional):</span>
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Jangan terlalu pedas, kuah dipisah, minta sendok 2..."
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: '10px',
                border: `1px solid ${borderLight}`,
                background: isLight ? '#f8fafc' : '#1e293b',
                color: textPrimary,
                fontSize: '0.8rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            {/* Quick Chips for easy tapping */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
              {['Tidak Pedas 🌶️', 'Pedas Sedang 🔥', 'Bungkus / Takeaway 🥡', 'Sendok 🍴', 'Kuah Dipisah 🥣'].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setOrderNotes(prev => prev ? `${prev}, ${chip}` : chip)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '999px',
                    border: `1px solid ${borderColor}`,
                    background: isLight ? '#f1f5f9' : '#1e293b',
                    color: textSecondary,
                    fontSize: '0.68rem',
                    cursor: 'pointer'
                  }}
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {userPoints > 0 && currentUser && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: `1px solid ${borderColor}` }}>
              <span style={{ fontSize: '0.78rem', color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gift size={14} color="#f59e0b" />
                Gunakan {Math.min(userPoints, 500)} Poin (Diskon Rp {(Math.floor(Math.min(userPoints, 500) / 100) * 1000).toLocaleString('id-ID')})
              </span>
              <input
                type="checkbox"
                checked={usePoints}
                onChange={e => setUsePoints(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>

        {/* ── PROMO MAKANAN (KUOTA / TANGGAL / KEDUANYA OLEH OWNER/MITRA/KASIR/ADMIN) ── */}
        <div style={{
          background: bgCard,
          border: selectedPromo ? '1.5px solid #10b981' : `1px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '1rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={16} color="#d97706" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Promo Makanan &amp; Diskon Meja
              </span>
            </div>
            {selectedPromo && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPromo(null);
                  setPromoFeedback(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Batalkan Promo
              </button>
            )}
          </div>

          {/* Active Promo Notice */}
          {selectedPromo ? (
            <div style={{
              background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.12)',
              border: '1px solid #6ee7b7',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.84rem', color: '#15803d' }}>
                  🎉 {selectedPromo.title}
                </strong>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#10b981',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {selectedPromo.code}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: textSecondary }}>
                <span>
                  {selectedPromo.discountType === 'PERCENT'
                    ? `Diskon ${selectedPromo.discountValue}%`
                    : `Potongan Rp ${selectedPromo.discountValue?.toLocaleString('id-ID')}`}
                  {selectedPromo.scope === 'SPECIFIC_ITEM' && ' (menu tertentu)'}
                </span>
                <span style={{ fontWeight: 800, color: '#15803d' }}>
                  Hemat Rp {promoDiscount.toLocaleString('id-ID')}
                </span>
              </div>
              {selectedPromo.limitType === 'QUOTA' && selectedPromo.remainingQuota !== null && (
                <span style={{ fontSize: '0.68rem', color: '#b45309' }}>
                  ⚡ Batas kuota: Sisa {selectedPromo.remainingQuota} porsi lagi!
                </span>
              )}
              {selectedPromo.limitType === 'DATE' && selectedPromo.expiryDate && (
                <span style={{ fontSize: '0.68rem', color: '#2563eb' }}>
                  📅 Batas tanggal: Berlaku s/d {selectedPromo.expiryDate}
                </span>
              )}
              {selectedPromo.limitType === 'BOTH' && (
                <span style={{ fontSize: '0.68rem', color: '#7c3aed' }}>
                  🏷️ Hybrid: Sisa {selectedPromo.remainingQuota ?? selectedPromo.maxQuota} kuota • Berlaku s/d {selectedPromo.expiryDate}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Promo Quick Badges / Selector */}
              {promosList.filter(p => p.isAvailable).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: textSecondary }}>
                    Pilih promo yang tersedia untuk mejamu:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {promosList.filter(p => p.isAvailable).map(promo => {
                      const limitLabel = promo.limitType === 'QUOTA'
                        ? `Kuota: ${promo.remainingQuota ?? (promo.maxQuota - promo.usedCount)} tersisa`
                        : promo.limitType === 'DATE'
                        ? `s/d ${promo.expiryDate}`
                        : `Sisa ${promo.remainingQuota ?? (promo.maxQuota - promo.usedCount)} • s/d ${promo.expiryDate}`;

                      return (
                        <div
                          key={promo.id}
                          onClick={() => {
                            setSelectedPromo(promo);
                            setPromoFeedback(null);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: `1.5px dashed ${borderColor}`,
                            background: isLight ? '#f8fafc' : '#1e293b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: '#fef3c7',
                                color: '#b45309',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {promo.code}
                              </span>
                              <strong style={{ fontSize: '0.78rem', color: textPrimary }}>
                                {promo.title}
                              </strong>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: textSecondary, display: 'block', marginTop: '2px' }}>
                              {promo.createdByRole && `Dibuat oleh: ${promo.createdByRole.toUpperCase()} • `}
                              {limitLabel}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#2563eb',
                            whiteSpace: 'nowrap'
                          }}>
                            Pakai ➔
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manual Promo Code Input */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="Punya voucher lain? Masukkan kode..."
                  value={promoCodeInput}
                  onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyPromoCode}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Gunakan
                </button>
              </div>

              {promoFeedback && (
                <div style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: promoFeedback.type === 'success' ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)') : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'),
                  color: promoFeedback.type === 'success' ? '#15803d' : '#b91c1c',
                  border: `1px solid ${promoFeedback.type === 'success' ? '#86efac' : '#fca5a5'}`
                }}>
                  {promoFeedback.text}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Header & Filter Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              1. Pilih Kategori Menu
            </span>
            <span style={{ fontSize: '0.72rem', color: textSecondary }}>
              Ketuk untuk beralih kategori
            </span>
          </div>

          {/* Category Filter Pills: 2-COLUMN GRID (NO HORIZONTAL SCROLL) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '8px',
            width: '100%',
            marginBottom: '4px'
          }}>
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              const count = cat === 'Semua' 
                ? products.length 
                : products.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    border: isActive
                      ? '1.5px solid #2563eb'
                      : `1px solid ${borderColor}`,
                    background: isActive
                      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                      : bgCard,
                    color: isActive ? '#ffffff' : textSecondary,
                    boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'var(--shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>{getCategoryIcon(cat)}</span>
                    <span>{cat}</span>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : (isLight ? '#f1f5f9' : '#1e293b'),
                    color: isActive ? '#ffffff' : textSecondary
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Active Category Banner & 2-Column Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <h3 style={{
            margin: 0,
            fontSize: '0.92rem',
            fontWeight: 800,
            color: textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>{getCategoryIcon(activeCategory)}</span>
            <span>Menu {activeCategory === 'Semua' ? 'Seluruh Kantin' : activeCategory}</span>
          </h3>
          <span style={{ fontSize: '0.72rem', color: textSecondary }}>
            {filteredProducts.length} pilihan menu
          </span>
        </div>

        {/* Product Cards: 2-Column Grid ("2 baris kebawah") */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '12px',
          alignItems: 'stretch'
        }}>
          {loading ? (
            <p style={{ gridColumn: 'span 2', textAlign: 'center', color: textSecondary, fontSize: '0.8rem', padding: '2rem 0' }}>
              Memuat daftar menu lezat...
            </p>
          ) : filteredProducts.length === 0 ? (
            <div style={{
              gridColumn: 'span 2',
              textAlign: 'center',
              padding: '2.5rem 1rem',
              background: bgCard,
              border: `1.5px dashed ${borderColor}`,
              borderRadius: '16px',
              color: textSecondary,
              fontSize: '0.82rem'
            }}>
              Belum ada menu di kategori {activeCategory}. Silakan pilih kategori lain.
            </div>
          ) : (
            filteredProducts.map(prod => {
              const inCart = cart[prod.id]?.qty || 0;
              return (
                <div
                  key={prod.id}
                  style={{
                    background: bgCard,
                    border: inCart > 0 
                      ? (isLight ? '2px solid #2563eb' : '2px solid #3b82f6')
                      : `1px solid ${borderColor}`,
                    borderRadius: '16px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: inCart > 0 ? '0 4px 14px rgba(37, 99, 235, 0.15)' : 'var(--shadow-sm)',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Image & In-Cart Badge */}
                  <div style={{ position: 'relative', width: '100%', marginBottom: '8px' }}>
                    <img
                      src={prod.image}
                      alt={prod.name}
                      style={{
                        width: '100%',
                        height: '115px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        display: 'block'
                      }}
                    />
                    {inCart > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <Check size={12} strokeWidth={3} /> {inCart} di Pesanan
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: textPrimary,
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.2em'
                      }}>
                        {prod.name}
                      </h4>
                      <p style={{
                        margin: '3px 0 0',
                        fontSize: '0.7rem',
                        color: textSecondary,
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {prod.description}
                      </p>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <span style={{
                        display: 'block',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: '#2563eb',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: '8px'
                      }}>
                        Rp {prod.price?.toLocaleString('id-ID')}
                      </span>

                      {/* Quantity Stepper & Add Button with Auto-Reset to 1 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isLight ? '#f8fafc' : '#0f172a',
                          border: `1.5px solid ${borderColor}`,
                          borderRadius: '10px',
                          padding: '2px 4px'
                        }}>
                          <button
                            type="button"
                            onClick={() => updateSelectedQty(prod.id, -1)}
                            disabled={getSelectedQty(prod.id) <= 1}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              border: 'none',
                              background: getSelectedQty(prod.id) <= 1 ? 'transparent' : (isLight ? '#e2e8f0' : '#334155'),
                              color: getSelectedQty(prod.id) <= 1 ? (isLight ? '#cbd5e1' : '#475569') : textPrimary,
                              cursor: getSelectedQty(prod.id) <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={getSelectedQty(prod.id)}
                            onChange={(e) => setDirectSelectedQty(prod.id, e.target.value)}
                            style={{
                              width: '38px',
                              textAlign: 'center',
                              border: 'none',
                              background: 'transparent',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              color: textPrimary,
                              fontFamily: 'var(--font-mono)',
                              padding: 0
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => updateSelectedQty(prod.id, 1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              border: 'none',
                              background: isLight ? '#e2e8f0' : '#334155',
                              color: textPrimary,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddWithQty(prod)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Plus size={14} strokeWidth={2.5} />
                          <span>+ Tambah {getSelectedQty(prod.id) > 1 ? `(${getSelectedQty(prod.id)})` : ''}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ── BOTTOM STICKY CART BAR ── */}
      {cartItems.length > 0 && !activeOrder && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${borderColor}`,
          padding: '0.75rem 1rem',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {promoDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                <span>Diskon Promo ({selectedPromo?.code}):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-Rp {promoDiscount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <span style={{ color: textSecondary }}>
                {cartItems.reduce((s, it) => s + it.qty, 0)} Item Dipilih
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.68rem', color: '#16a34a', display: 'block', fontWeight: 600 }}>Bebas Admin (Rp 0)</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                  Rp {cartTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={submittingOrder}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {submittingOrder ? 'Mengirim ke Dapur...' : 'Pesan Sekarang ke Dapur'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── LUCKY SPIN WHEEL MODAL ── */}
      {showSpinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: bgCard,
            color: textPrimary,
            maxWidth: '340px',
            width: '100%',
            borderRadius: '24px',
            padding: '1.5rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                color: '#f59e0b',
                background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                padding: '3px 8px',
                borderRadius: '9999px',
                textTransform: 'uppercase'
              }}>
                Reward Pembayaran
              </span>
              <h3 style={{ margin: '6px 0 2px', fontSize: '1.2rem', fontWeight: 800, color: textPrimary }}>
                Roda Keberuntungan
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: textSecondary }}>
                Putar roda untuk dapatkan poin diskon belanja berikutnya!
              </p>
            </div>

            <div style={{ position: 'relative', width: '250px', height: '250px', margin: '4px auto' }}>
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '18px solid #f59e0b'
              }}></div>
              <canvas ref={canvasRef} width={250} height={250} style={{ borderRadius: '50%' }} />
            </div>

            {spinResult && (
              <div style={{
                background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #a7f3d0',
                borderRadius: '12px',
                padding: '10px'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>SELAMAT KAMU DAPAT:</span>
                <h4 style={{ margin: '2px 0', fontSize: '1.4rem', fontWeight: 900, color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                  +{spinResult.points} POIN!
                </h4>
                <p style={{ margin: 0, fontSize: '0.72rem', color: textSecondary }}>
                  Saldo sekarang: <strong>{spinResult.userCurrentBalance} Pts</strong>
                </p>
              </div>
            )}

            {!spinResult ? (
              <button
                onClick={handleSpinWheel}
                disabled={spinning}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                }}
              >
                {spinning ? 'Memutar Roda...' : 'PUTAR RODA SEKARANG!'}
              </button>
            ) : (
              <button
                onClick={() => setShowSpinModal(false)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  color: textPrimary,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Tutup & Kembali
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
