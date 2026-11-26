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
  Banknote,
  Gift,
  HelpCircle,
  Award,
  Sun,
  Moon,
  MapPin,
  MessageSquare,
  AlertTriangle,
  Tag,
  Coffee,
  Package,
  ExternalLink,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Star,
  Flame,
  Zap,
  Lock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { formatStoreHeaderLines } from '../utils/thermalPrinter';
import { calculateQrisCustomerFee } from '../utils/qrisEngine';

export default function OrderMeja() {
  const { tableToken } = useParams();
  const navigate = useNavigate();
  const { isLight, toggleTheme } = useTheme();

  // State Data
  const [tableInfo, setTableInfo] = useState({ number: 'Memuat Meja...', token: tableToken });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Makanan');
  // View Mode: 'list' (Daftar List Memanjang - default) vs 'grid' (Kotak Box)
  const [viewMode, setViewMode] = useState('list');
  // Collapsible Dropdown Kategori: Default semua kategori kebuka (open: true)!
  const [openCategories, setOpenCategories] = useState({});
  // Secondary UI disclosures
  const [showPromoInput, setShowPromoInput] = useState(false);

  // Per-tab session ID untuk tracking hold kuota promo saat item masuk keranjang
  const [cartSessionId] = useState(() => {
    try {
      const existing = sessionStorage.getItem('kostku_pos_cart_session_id');
      if (existing) return existing;
      const created = 'SES-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem('kostku_pos_cart_session_id', created);
      return created;
    } catch (_) {
      return 'SES-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    }
  });

  const isDemoMode = (() => {
    try {
      return new URLSearchParams(window.location.search).get('demo') === 'true';
    } catch (_) {
      return false;
    }
  })();

  const withDemoQs = (url) => {
    if (!isDemoMode || url.includes('demo=true')) return url;
    return `${url}${url.includes('?') ? '&' : '?'}demo=true`;
  };

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

  // Cart, Per-Menu Note Modal & Order State
  const [cart, setCart] = useState({});
  const [selectedQtys, setSelectedQtys] = useState({});
  const [customerPhone] = useState(() => {
    try {
      const u = localStorage.getItem('currentUser');
      return u ? (JSON.parse(u).phone || '') : '';
    } catch (_) {
      return '';
    }
  });
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [menuNoteModal, setMenuNoteModal] = useState(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Promo Makanan & Extra/Topping State
  const [promosList, setPromosList] = useState([]);
  const [storeExtras, setStoreExtras] = useState([]);
  const [selectedStorePromo, setSelectedStorePromo] = useState(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState(null);
  const [promoHoldNotice, setPromoHoldNotice] = useState(null);
  const holdSeqRef = useRef({});
  const promoNoticeTimerRef = useRef(null);

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

  // Bottom-Sheet Scroll Lock & Swipe-Down-to-Dismiss State
  const [sheetDragY, setSheetDragY] = useState(0);
  const sheetTouchStartYRef = useRef(0);
  const sheetDragActiveRef = useRef(false);
  const sheetDragYRef = useRef(0);
  const menuModalBodyRef = useRef(null);

  const isMenuNoteModalOpen = Boolean(menuNoteModal);
  const isAnyModalOverlayOpen = Boolean(menuNoteModal || (showCartDrawer && !activeOrder) || showSpinModal);

  useEffect(() => {
    if (!isAnyModalOverlayOpen) return;
    const lockedScrollY = window.scrollY || window.pageYOffset || 0;
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const prevHtml = {
      overflow: htmlStyle.overflow,
      overscrollBehavior: htmlStyle.overscrollBehavior
    };
    const prevBody = {
      overflow: bodyStyle.overflow,
      position: bodyStyle.position,
      top: bodyStyle.top,
      left: bodyStyle.left,
      right: bodyStyle.right,
      width: bodyStyle.width,
      overscrollBehavior: bodyStyle.overscrollBehavior
    };

    htmlStyle.overflow = 'hidden';
    htmlStyle.overscrollBehavior = 'none';
    bodyStyle.overflow = 'hidden';
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${lockedScrollY}px`;
    bodyStyle.left = '0';
    bodyStyle.right = '0';
    bodyStyle.width = '100%';
    bodyStyle.overscrollBehavior = 'none';

    return () => {
      htmlStyle.overflow = prevHtml.overflow;
      htmlStyle.overscrollBehavior = prevHtml.overscrollBehavior;
      bodyStyle.overflow = prevBody.overflow;
      bodyStyle.position = prevBody.position;
      bodyStyle.top = prevBody.top;
      bodyStyle.left = prevBody.left;
      bodyStyle.right = prevBody.right;
      bodyStyle.width = prevBody.width;
      bodyStyle.overscrollBehavior = prevBody.overscrollBehavior;
      window.scrollTo(0, lockedScrollY);
    };
  }, [isAnyModalOverlayOpen]);

  useEffect(() => {
    sheetDragYRef.current = 0;
    sheetDragActiveRef.current = false;
    setSheetDragY(0);
  }, [isMenuNoteModalOpen]);

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
        let authUser = null;
        let savedActiveStoreId = '';
        try {
          const raw = localStorage.getItem('kostUser');
          if (raw) authUser = JSON.parse(raw);
          savedActiveStoreId = localStorage.getItem('kostku_active_pos_store') || '';
        } catch (_) {}

        const ownerParam = authUser
          ? (['staff', 'admin', 'karyawan'].includes(String(authUser.role || '').toLowerCase())
              ? (authUser.ownerId || authUser.ownerUid || authUser.employerId || authUser.id)
              : authUser.id)
          : '';

        const urlParams = new URLSearchParams(window.location.search);
        const scopeParams = new URLSearchParams();
        if (tableToken) {
          scopeParams.set('tableToken', tableToken);
        } else if (ownerParam) {
          scopeParams.set('ownerId', String(ownerParam));
          if (savedActiveStoreId) scopeParams.set('storeId', savedActiveStoreId);
        }
        if (urlParams.get('demo') === 'true') {
          scopeParams.set('demo', 'true');
        }
        const scopeQs = scopeParams.toString();

        if (!scopeQs) {
          setProducts([]);
          setTableInfo({ number: 'Scan QR Meja', qrToken: '' });
          setStoreInfo(prev => ({ ...prev, storeName: 'Scan QR Meja Toko', merchantId: null }));
          setLoading(false);
          return;
        }

        const reqHeaders = authUser?.id
          ? { 'x-user-id': String(authUser.id), 'x-user-role': String(authUser.role || '') }
          : undefined;

        const [resTables, resStore, resProd, resPromos, resExtras] = await Promise.all([
          fetch(`/api/pos/tables?${scopeQs}`, { headers: reqHeaders }),
          fetch(`/api/pos/store?${scopeQs}`, { headers: reqHeaders }),
          fetch(`/api/pos/products?${scopeQs}`, { headers: reqHeaders }),
          fetch(`/api/pos/promos?${scopeQs}&sessionId=${encodeURIComponent(cartSessionId)}`, { headers: reqHeaders }),
          fetch(`/api/pos/extras?${scopeQs}&activeOnly=true`, { headers: reqHeaders })
        ]);

        if (resTables.ok) {
          const tbls = await resTables.json();
          const match = tableToken
            ? tbls.find(t => t.qrToken === tableToken)
            : tbls[0];
          if (match) {
            setTableInfo(match);
          } else {
            setTableInfo({ number: 'Meja Tamu', qrToken: tableToken });
          }
        }

        if (resStore.ok) setStoreInfo(await resStore.json());
        if (resProd.ok) setProducts(await resProd.json());
        if (resPromos.ok) {
          const promoData = await resPromos.json();
          setPromosList(promoData.promos || []);
        }
        if (resExtras.ok) {
          const extraData = await resExtras.json();
          setStoreExtras(Array.isArray(extraData) ? extraData : []);
        }
      } catch (err) {
        console.warn('Gagal memuat katalog POS:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tableToken, cartSessionId]);

  // 1b. Helper refresh promo list (untuk sinkronisasi kuota real-time antar meja)
  const refreshPromosList = async () => {
    try {
      const qs = new URLSearchParams();
      if (tableToken) qs.set('tableToken', tableToken);
      if (storeInfo?.merchantId) qs.set('storeId', storeInfo.merchantId);
      if (isDemoMode) qs.set('demo', 'true');
      qs.set('sessionId', cartSessionId);
      const res = await fetch(`/api/pos/promos?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.promos)) {
          setPromosList(data.promos);
        }
      }
    } catch (_) {}
  };

  // Live polling kuota promo tiap 5 detik selama pelanggan belum checkout
  useEffect(() => {
    if (activeOrder?.id || loading) return;
    const timer = setInterval(() => {
      refreshPromosList();
    }, 5000);
    return () => clearInterval(timer);
  }, [activeOrder?.id, loading, tableToken, storeInfo?.merchantId, cartSessionId, isDemoMode]);

  // Lepas semua hold kuota promo jika tab ditutup / ditinggalkan sebelum checkout
  useEffect(() => {
    const releaseSessionHolds = () => {
      try {
        const payload = JSON.stringify({ sessionId: cartSessionId });
        const url = withDemoQs('/api/pos/promos/release-session');
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        } else {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      } catch (_) {}
    };
    window.addEventListener('pagehide', releaseSessionHolds);
    window.addEventListener('beforeunload', releaseSessionHolds);
    return () => {
      window.removeEventListener('pagehide', releaseSessionHolds);
      window.removeEventListener('beforeunload', releaseSessionHolds);
    };
  }, [cartSessionId, isDemoMode]);

  const isStoreTier2 = Boolean(
    storeInfo?.billingTier === 'TIER_2_LOYALTY' ||
    storeInfo?.loyaltyPoolId ||
    storeInfo?.loyalty_pool_id ||
    storeInfo?.canRedeemPoints
  );
  const storePointValueIdr = Number(storeInfo?.pointValueIdr) || 10;

  // 2. Fetch User Points when Phone Number is entered
  useEffect(() => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const qs = new URLSearchParams();
      if (storeInfo?.merchantId) qs.set('storeId', storeInfo.merchantId);
      if (tableInfo?.qrToken || tableToken) qs.set('tableToken', tableInfo?.qrToken || tableToken);
      if (isDemoMode) qs.set('demo', 'true');
      fetch(`/api/pos/points/${cleanPhone}${qs.toString() ? `?${qs.toString()}` : ''}`)
        .then(r => r.json())
        .then(data => setUserPoints(data.points || 0))
        .catch(() => {});
    } else {
      setUserPoints(0);
    }
  }, [customerPhone, storeInfo?.merchantId, tableInfo?.qrToken, tableToken, isDemoMode]);

  useEffect(() => {
    if (!isStoreTier2 && usePoints) {
      setUsePoints(false);
    }
  }, [isStoreTier2, usePoints]);

  // 3. Realtime Order Status Polling when Order is active
  useEffect(() => {
    if (!activeOrder?.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(withDemoQs(`/api/pos/orders/${activeOrder.id}`));
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
  }, [activeOrder?.id, spinResult, isDemoMode]);

  const isCategoryOpen = (cat) => openCategories[cat] !== false; // Default kebuka!
  const toggleCategory = (cat) => {
    setOpenCategories(prev => ({
      ...prev,
      [cat]: prev[cat] === false ? true : false
    }));
  };
  const toggleAllCategories = (catList) => {
    const list = catList || categoriesList;
    const allCurrentlyOpen = list.every(c => isCategoryOpen(c));
    const nextState = {};
    list.forEach(c => {
      nextState[c] = !allCurrentlyOpen;
    });
    setOpenCategories(nextState);
  };

  const availableCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const categoriesList = availableCategories.length > 0
    ? availableCategories
    : ['Makanan', 'Snack', 'Minuman'];

  // Menu Baru: Produk dengan flag isNew/isRecent atau 3 produk terakhir
  const flaggedNew = products.filter(p => p.isNew || p.badge === 'baru' || p.isRecent);
  const newProductsList = flaggedNew.length > 0 ? flaggedNew : products.slice(-3);

  const categories = availableCategories.length > 0
    ? [...availableCategories, 'Semua']
    : ['Makanan', 'Snack', 'Minuman', 'Semua'];

  const filteredProducts = activeCategory === 'Semua' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const getCategoryIcon = (cat) => {
    const c = String(cat).toLowerCase();
    if (c.includes('makan')) return <Utensils size={14} />;
    if (c.includes('snack') || c.includes('camilan') || c.includes('goreng')) return <Package size={14} />;
    if (c.includes('minum') || c.includes('teh') || c.includes('kopi')) return <Coffee size={14} />;
    if (c.includes('paket')) return <ShoppingBag size={14} />;
    return <Utensils size={14} />;
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

  const showHoldToast = (type, text) => {
    setPromoHoldNotice({ type, text });
    if (promoNoticeTimerRef.current) clearTimeout(promoNoticeTimerRef.current);
    promoNoticeTimerRef.current = setTimeout(() => {
      setPromoHoldNotice(null);
    }, 4500);
  };

  // Promo helpers & real-time Cart Quota Hold sync
  const eligiblePromos = promosList.filter(
    (p) =>
      p &&
      p.isActive &&
      !p.isDateExpired &&
      (isStoreTier2 || !(p.createdByRole === 'customer' || String(p.code || '').toUpperCase().startsWith('POIN-')))
  );

  const getProductPromo = (productId) =>
    eligiblePromos.find((p) => p.scope === 'SPECIFIC_ITEM' && p.targetProductId === productId) || null;

  const getPromoPricing = (prod, promo) => {
    const basePrice = Number(prod?.price) || 0;
    if (!promo) {
      return { basePrice, finalPrice: basePrice, hasDiscount: false, savingsPerUnit: 0, badgeLabel: '' };
    }
    const isQuotaTracked = promo.limitType === 'QUOTA' || promo.limitType === 'BOTH';
    const hasUsableQuota = !isQuotaTracked || (promo.remainingQuota || 0) > 0 || (promo.myHeldCount || 0) > 0;
    if (!hasUsableQuota) {
      return { basePrice, finalPrice: basePrice, hasDiscount: false, savingsPerUnit: 0, badgeLabel: 'Kuota Habis' };
    }
    let savingsPerUnit = 0;
    let badgeLabel = '';
    if (promo.discountType === 'PERCENT') {
      const pct = Math.min(100, Number(promo.discountValue) || 0);
      savingsPerUnit = Math.round(basePrice * (pct / 100));
      badgeLabel = `-${pct}%`;
    } else {
      const val = Number(promo.discountValue) || 0;
      savingsPerUnit = Math.min(basePrice, val);
      badgeLabel = val >= 1000 && val % 1000 === 0
        ? `-Rp ${val / 1000}rb`
        : `-Rp ${val.toLocaleString('id-ID')}`;
    }
    return {
      basePrice,
      finalPrice: Math.max(0, basePrice - savingsPerUnit),
      hasDiscount: savingsPerUnit > 0,
      savingsPerUnit,
      badgeLabel
    };
  };

  const patchPromoInList = (updatedPromo) => {
    if (!updatedPromo?.id) return;
    setPromosList((prev) => {
      const exists = prev.some((p) => p.id === updatedPromo.id);
      if (!exists) return [updatedPromo, ...prev];
      return prev.map((p) => (p.id === updatedPromo.id ? { ...p, ...updatedPromo } : p));
    });
  };

  const syncPromoHold = async (promo, desiredQty) => {
    if (!promo || (promo.limitType !== 'QUOTA' && promo.limitType !== 'BOTH')) {
      return null;
    }
    const seq = (holdSeqRef.current[promo.id] || 0) + 1;
    holdSeqRef.current[promo.id] = seq;

    try {
      const endpoint = desiredQty > 0 ? '/api/pos/promos/hold' : '/api/pos/promos/release';
      const res = await fetch(withDemoQs(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoId: promo.id,
          sessionId: cartSessionId,
          tableToken: tableInfo?.qrToken || tableToken || null,
          qty: desiredQty,
          storeId: storeInfo?.merchantId || null
        })
      });
      const data = await res.json().catch(() => null);
      if (seq !== holdSeqRef.current[promo.id]) return data;
      if (res.ok && data) {
        if (data.promo) patchPromoInList(data.promo);
        if (desiredQty > 0 && (data.capped || data.exhausted)) {
          showHoldToast('warning', data.message || 'Sebagian/seluruh kuota promo sedang di-hold pelanggan lain.');
        }
      }
      return data;
    } catch (_) {
      return null;
    }
  };

  const getCommonQuestionsForProduct = (prod) => {
    if (Array.isArray(prod?.commonNotes) && prod.commonNotes.length > 0) {
      return prod.commonNotes;
    }
    const isDrink = /minum|es |teh|kopi|jus|susu|latte|matcha/i.test(`${prod?.category || ''} ${prod?.name || ''}`);
    return isDrink
      ? ['Es Sedikit', 'Tanpa Es', 'Kurangi Gula', 'Normal Sugar', 'Bungkus']
      : ['Tidak Pedas', 'Pedas Sedang', 'Ekstra Pedas', 'Kuah Dipisah', 'Tanpa Bawang', 'Bungkus'];
  };

  const getAvailableExtrasForProduct = (prod) => {
    if (!prod) return [];
    const map = new Map();
    const prodCategory = String(prod.category || '').trim().toLowerCase();
    for (const ext of storeExtras) {
      if (!ext || ext.isAvailable === false) continue;
      const scope = String(ext.scope || 'ALL').toUpperCase();
      if (scope === 'CATEGORY') {
        const cats = Array.isArray(ext.targetCategories)
          ? ext.targetCategories
          : (ext.targetCategory ? [ext.targetCategory] : []);
        if (!cats.some(c => String(c || '').trim().toLowerCase() === prodCategory)) continue;
      } else if (scope === 'SPECIFIC_MENU') {
        const ids = Array.isArray(ext.targetProductIds) ? ext.targetProductIds.map(String) : [];
        if (!ids.includes(String(prod.id))) continue;
      }
      map.set(String(ext.id), {
        id: String(ext.id),
        name: String(ext.name || ''),
        price: Math.max(0, Number(ext.price) || 0)
      });
    }
    if (Array.isArray(prod.extras)) {
      for (const mExt of prod.extras) {
        if (!mExt || mExt.isAvailable === false || !mExt.name) continue;
        map.set(String(mExt.id), {
          id: String(mExt.id),
          name: String(mExt.name),
          price: Math.max(0, Number(mExt.price) || 0)
        });
      }
    }
    return Array.from(map.values());
  };

  const composeItemNote = (selectedQuestions = [], customNote = '') => {
    const parts = [
      ...(Array.isArray(selectedQuestions) ? selectedQuestions.map(q => String(q || '').trim()).filter(Boolean) : []),
      ...(String(customNote || '').trim() ? [String(customNote || '').trim()] : [])
    ];
    return parts.join(', ');
  };

  const getItemExtrasUnitTotal = (entry) =>
    (Array.isArray(entry?.selectedExtras) ? entry.selectedExtras : [])
      .reduce((sum, ex) => sum + (Math.max(0, Number(ex?.price) || 0) * Math.max(1, Number(ex?.qty) || 1)), 0);

  const openMenuNoteModal = (product, mode = 'add') => {
    const existing = cart[product.id];
    const commonQs = getCommonQuestionsForProduct(product);
    let initQuestions = Array.isArray(existing?.selectedQuestions) ? existing.selectedQuestions : [];
    let initCustom = typeof existing?.customNote === 'string' ? existing.customNote : '';

    // Fallback parsing jika entry lama hanya punya notes string
    if (existing && !Array.isArray(existing.selectedQuestions) && existing.notes) {
      const tokens = String(existing.notes).split(',').map(s => s.trim()).filter(Boolean);
      const qSet = new Set(commonQs.map(q => q.toLowerCase()));
      initQuestions = tokens.filter(t => qSet.has(t.toLowerCase()));
      initCustom = tokens.filter(t => !qSet.has(t.toLowerCase())).join(', ');
    }

    setMenuNoteModal({
      product,
      mode,
      qty: existing?.qty || 1,
      selectedQuestions: initQuestions,
      selectedExtras: Array.isArray(existing?.selectedExtras)
        ? existing.selectedExtras.map(ex => ({
            ...ex,
            qty: Math.max(1, parseInt(ex?.qty ?? 1, 10) || 1)
          }))
        : [],
      customNote: initCustom,
      notes: existing?.notes || '',
      promo: getProductPromo(product.id)
    });
  };

  const setCartItemWithNote = (product, nextQty, noteConfig = '') => {
    const parsedQty = Math.max(0, Math.min(99, parseInt(nextQty, 10) || 0));
    const isObj = noteConfig && typeof noteConfig === 'object';
    const cleanQuestions = isObj && Array.isArray(noteConfig.selectedQuestions)
      ? noteConfig.selectedQuestions.map(q => String(q || '').trim()).filter(Boolean)
      : [];
    const cleanExtras = isObj && Array.isArray(noteConfig.selectedExtras)
      ? noteConfig.selectedExtras
          .filter(e => e && e.id && e.name && (parseInt(e.qty ?? 1, 10) || 0) > 0)
          .map(e => ({
            id: String(e.id),
            name: String(e.name),
            price: Math.max(0, Number(e.price) || 0),
            qty: Math.min(99, Math.max(1, parseInt(e.qty ?? 1, 10) || 1))
          }))
      : [];
    const cleanCustomNote = isObj
      ? String(noteConfig.customNote || '').trim()
      : String(noteConfig || '').trim();
    const cleanedNotes = isObj && typeof noteConfig.notes === 'string' && cleanQuestions.length === 0 && !cleanCustomNote
      ? noteConfig.notes.trim()
      : composeItemNote(cleanQuestions, cleanCustomNote);

    const nextCart = { ...cart };
    if (parsedQty <= 0) {
      delete nextCart[product.id];
    } else {
      nextCart[product.id] = {
        product,
        qty: parsedQty,
        selectedQuestions: cleanQuestions,
        selectedExtras: cleanExtras,
        customNote: cleanCustomNote,
        notes: cleanedNotes
      };
    }

    const nextCartLength = Object.keys(nextCart).length;
    const nextCartSubtotal = Object.values(nextCart).reduce(
      (s, it) => s + ((Number(it.product.price || 0) + getItemExtrasUnitTotal(it)) * it.qty),
      0
    );
    setCart(nextCart);

    if (parsedQty > 0) {
      try { playTone(880, 0.08); } catch (_) {}
    }

    const itemPromo = getProductPromo(product.id);
    if (itemPromo) {
      syncPromoHold(itemPromo, parsedQty);
    }

    if (selectedStorePromo) {
      const liveStorePromo = promosList.find((p) => p.id === selectedStorePromo.id) || selectedStorePromo;
      const meetsMin = !liveStorePromo.minOrder || nextCartSubtotal >= liveStorePromo.minOrder;
      const isQuotaTracked = liveStorePromo.limitType === 'QUOTA' || liveStorePromo.limitType === 'BOTH';
      if (nextCartLength > 0 && meetsMin) {
        if (isQuotaTracked && (liveStorePromo.myHeldCount || 0) <= 0) {
          syncPromoHold(liveStorePromo, 1).then((holdRes) => {
            if (holdRes && holdRes.heldQty > 0) {
              setSelectedStorePromo(holdRes.promo || liveStorePromo);
              setPromoFeedback({ type: 'success', text: holdRes.message || `Promo ${liveStorePromo.code} aktif & di-hold untuk keranjangmu!` });
            }
          });
        }
      } else {
        if (isQuotaTracked && (liveStorePromo.myHeldCount || 0) > 0) {
          syncPromoHold(liveStorePromo, 0);
        }
        setSelectedStorePromo((prev) => (prev ? { ...prev, myHeldCount: 0 } : null));
        setPromoFeedback(null);
      }
    }
  };

  const incrementCartItem = (product) => {
    const existing = cart[product.id];
    const nextQty = (existing?.qty || 0) + 1;
    setCartItemWithNote(product, nextQty, existing || {});
  };

  const decrementCartItem = (product) => {
    const existing = cart[product.id];
    const nextQty = (existing?.qty || 0) - 1;
    setCartItemWithNote(product, nextQty, existing || {});
  };

  const handleToggleStorePromo = async (promo) => {
    if (!promo) return;
    if (selectedStorePromo?.id === promo.id) {
      if (promo.limitType === 'QUOTA' || promo.limitType === 'BOTH') {
        await syncPromoHold(promo, 0);
      }
      setSelectedStorePromo(null);
      setPromoFeedback(null);
      return;
    }

    const livePromo = promosList.find((p) => p.id === promo.id) || promo;
    const isQuotaTracked = livePromo.limitType === 'QUOTA' || livePromo.limitType === 'BOTH';
    if (isQuotaTracked && (livePromo.remainingQuota || 0) <= 0 && (livePromo.myHeldCount || 0) <= 0) {
      showHoldToast('warning', `Maaf, kuota promo ${livePromo.code} sedang habis.`);
      return;
    }

    if (selectedStorePromo && selectedStorePromo.id !== livePromo.id) {
      if (selectedStorePromo.limitType === 'QUOTA' || selectedStorePromo.limitType === 'BOTH') {
        await syncPromoHold(selectedStorePromo, 0);
      }
    }

    setSelectedStorePromo(livePromo);

    const currentCartItems = Object.values(cart);
    const currentSubtotal = currentCartItems.reduce(
      (sum, it) => sum + ((Number(it.product.price || 0) + getItemExtrasUnitTotal(it)) * it.qty),
      0
    );
    const meetsMin = !livePromo.minOrder || currentSubtotal >= livePromo.minOrder;

    if (currentCartItems.length > 0 && meetsMin) {
      if (isQuotaTracked) {
        const holdRes = await syncPromoHold(livePromo, 1);
        if (holdRes && holdRes.heldQty > 0) {
          setSelectedStorePromo(holdRes.promo || livePromo);
          setPromoFeedback({ type: 'success', text: holdRes.message || `Promo ${livePromo.code} di-hold untuk keranjangmu!` });
        } else {
          setSelectedStorePromo(null);
          showHoldToast('warning', holdRes?.message || `Kuota promo ${livePromo.code} sedang habis.`);
        }
      } else {
        setPromoFeedback({ type: 'success', text: `Promo ${livePromo.code} diterapkan.` });
      }
    } else {
      setPromoFeedback(null);
    }
  };

  const renderQuotaBadge = (promo, compact = false) => {
    if (!promo) return null;
    const isQuotaTracked = promo.limitType === 'QUOTA' || promo.limitType === 'BOTH';
    if (!isQuotaTracked) {
      return promo.expiryDate ? (
        <span style={{
          fontSize: compact ? '0.62rem' : '0.66rem',
          fontWeight: 700,
          color: '#2563eb'
        }}>
          s/d {promo.expiryDate}
        </span>
      ) : null;
    }

    const rem = promo.remainingQuota ?? Math.max(0, (promo.maxQuota || 0) - (promo.usedCount || 0));
    const held = promo.myHeldCount || 0;
    const isHeldByMe = held > 0;
    const isExhausted = rem <= 0 && !isHeldByMe;

    return (
      <span
        data-testid={`promo-quota-${promo.id}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: compact ? '2px 6px' : '2px 8px',
          borderRadius: '999px',
          fontSize: compact ? '0.62rem' : '0.66rem',
          fontWeight: 800,
          background: isHeldByMe
            ? (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.2)')
            : isExhausted
              ? (isLight ? '#f1f5f9' : '#1e293b')
              : (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.18)'),
          color: isHeldByMe
            ? '#15803d'
            : isExhausted
              ? textSecondary
              : '#b45309',
          border: isHeldByMe
            ? '1px solid #86efac'
            : isExhausted
              ? `1px solid ${borderColor}`
              : '1px solid #fde68a'
        }}
      >
        {isHeldByMe ? (
          <>
            <Lock size={10} strokeWidth={2.5} />
            <span>Sisa {rem} kuota • {held} di-hold</span>
          </>
        ) : isExhausted ? (
          <span>Kuota Habis</span>
        ) : (
          <>
            <Zap size={10} strokeWidth={2.5} />
            <span>Sisa {rem} kuota</span>
          </>
        )}
      </span>
    );
  };

  // Render Card Grid Mode: Kotak Box Box (adaptif untuk Menu Biasa maupun Menu Promo Featured)
  const renderProductGridCard = (prod, isNewBadge = false, explicitPromo = null, isFullWidthFeatured = false) => {
    const cartEntry = cart[prod.id];
    const inCart = cartEntry?.qty || 0;
    const itemNotes = cartEntry?.notes || '';
    const itemExtras = Array.isArray(cartEntry?.selectedExtras) ? cartEntry.selectedExtras : [];
    const itemExtrasTotal = getItemExtrasUnitTotal(cartEntry);
    const hasCustom = Boolean(itemNotes) || itemExtras.length > 0;
    const availExtrasCount = getAvailableExtrasForProduct(prod).length;
    const isNew = isNewBadge || prod.isNew || prod.badge === 'baru';
    const promo = explicitPromo || getProductPromo(prod.id);
    const pricing = getPromoPricing(prod, promo);

    return (
      <div
        key={`${explicitPromo ? 'promo-' : ''}${prod.id}`}
        data-testid={`${explicitPromo ? 'promo-card-' : 'product-card-'}${prod.id}`}
        onClick={() => openMenuNoteModal(prod, inCart > 0 ? 'edit' : 'add')}
        style={{
          background: bgCard,
          border: inCart > 0
            ? (isLight ? '2px solid #2563eb' : '2px solid #3b82f6')
            : promo && pricing.hasDiscount
              ? (isLight ? '1.5px solid #fbbf24' : '1.5px solid rgba(245, 158, 11, 0.45)')
              : `1px solid ${borderColor}`,
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isFullWidthFeatured ? 'row' : 'column',
          justifyContent: 'space-between',
          boxShadow: inCart > 0 ? '0 6px 20px rgba(37, 99, 235, 0.18)' : '0 2px 8px rgba(0,0,0,0.03)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Food Image with High-End Overlay */}
        <div style={{
          position: 'relative',
          width: isFullWidthFeatured ? '122px' : '100%',
          height: isFullWidthFeatured ? 'auto' : '120px',
          minHeight: isFullWidthFeatured ? '132px' : undefined,
          flexShrink: 0,
          overflow: 'hidden'
        }}>
          <img
            src={prod.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
            alt={prod.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          {promo && pricing.hasDiscount ? (
            <span style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              padding: '3px 8px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '0.64rem',
              letterSpacing: '0.2px',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Flame size={10} strokeWidth={2.5} />
              <span>{pricing.badgeLabel}</span>
            </span>
          ) : isNew ? (
            <span style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              padding: '3px 8px',
              borderRadius: '999px',
              background: '#ef4444',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.62rem',
              letterSpacing: '0.3px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Sparkles size={10} strokeWidth={2.5} />
              <span>Baru</span>
            </span>
          ) : null}
          {inCart > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '3px 8px',
              borderRadius: '999px',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '0.68rem',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Check size={11} strokeWidth={3} /> {inCart}x
            </span>
          )}
        </div>

        {/* Content Details */}
        <div style={{
          padding: '10px 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          justifyContent: 'space-between'
        }}>
          <div>
            <h4 style={{
              margin: 0,
              fontSize: '0.88rem',
              fontWeight: 800,
              color: textPrimary,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: isFullWidthFeatured ? undefined : '2.3em'
            }}>
              {prod.name}
            </h4>
            <p style={{
              margin: '3px 0 0',
              fontSize: '0.7rem',
              color: textSecondary,
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: isFullWidthFeatured ? 2 : 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {prod.description}
            </p>
            {promo && (
              <div style={{ marginTop: '6px' }}>
                {renderQuotaBadge(promo)}
              </div>
            )}
          </div>

          <div style={{ marginTop: '8px' }}>
            {pricing.hasDiscount ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '7px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.96rem',
                  fontWeight: 900,
                  color: '#dc2626',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Rp {pricing.finalPrice.toLocaleString('id-ID')}
                </span>
                <span style={{
                  fontSize: '0.74rem',
                  color: textSecondary,
                  textDecoration: 'line-through',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Rp {pricing.basePrice.toLocaleString('id-ID')}
                </span>
              </div>
            ) : (
              <span style={{
                display: 'block',
                fontSize: '0.94rem',
                fontWeight: 900,
                color: isLight ? '#0f172a' : '#f8fafc',
                fontFamily: 'var(--font-mono)',
                marginBottom: '8px'
              }}>
                Rp {prod.price?.toLocaleString('id-ID')}
              </span>
            )}

            {/* Action: "+ Tambah" (buka modal catatan per menu) -> "- [ qty ] +" + pill catatan */}
            {inCart === 0 ? (
              <button
                type="button"
                data-testid={`${explicitPromo ? 'promo-add-' : 'add-menu-'}${prod.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openMenuNoteModal(prod, 'add');
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: promo && pricing.hasDiscount
                    ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: promo && pricing.hasDiscount
                    ? '0 2px 8px rgba(234, 88, 12, 0.3)'
                    : '0 2px 8px rgba(37, 99, 235, 0.25)',
                  transition: 'transform 0.1s ease'
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Tambah</span>
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isLight ? '#eff6ff' : '#1e293b',
                  border: '1.5px solid #3b82f6',
                  borderRadius: '10px',
                  padding: '2px 4px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <button
                    type="button"
                    aria-label={`Kurangi ${prod.name}`}
                    data-testid={`qty-minus-${prod.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      decrementCartItem(prod);
                    }}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '7px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Minus size={13} strokeWidth={2.5} />
                  </button>
                  <span style={{
                    fontWeight: 900,
                    fontSize: '0.86rem',
                    color: textPrimary,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {inCart}
                  </span>
                  <button
                    type="button"
                    aria-label={`Tambah ${prod.name}`}
                    data-testid={`qty-plus-${prod.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      incrementCartItem(prod);
                    }}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '7px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Clickable Per-Menu Note & Extras Chip */}
                <button
                  type="button"
                  data-testid={`edit-note-${prod.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openMenuNoteModal(prod, 'edit');
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 7px',
                    borderRadius: '8px',
                    border: `1px dashed ${hasCustom ? '#3b82f6' : borderColor}`,
                    background: hasCustom
                      ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.14)')
                      : (isLight ? '#f8fafc' : '#1e293b'),
                    color: hasCustom ? '#1d4ed8' : textSecondary,
                    fontSize: '0.67rem',
                    fontWeight: hasCustom ? 700 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <MessageSquare size={11} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hasCustom
                      ? [
                          itemExtras.length > 0
                            ? `+${itemExtras.reduce((s, e) => s + Math.max(1, Number(e.qty) || 1), 0)} Extra (+Rp ${itemExtrasTotal.toLocaleString('id-ID')})`
                            : null,
                          itemNotes || null
                        ].filter(Boolean).join(' • ')
                      : (availExtrasCount > 0 ? '+ Catatan & Extra' : '+ Catatan menu')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Card List Mode: Daftar Baris Ramping
  const renderProductListRow = (prod, isNewBadge = false, explicitPromo = null) => {
    const cartEntry = cart[prod.id];
    const inCart = cartEntry?.qty || 0;
    const itemNotes = cartEntry?.notes || '';
    const itemExtras = Array.isArray(cartEntry?.selectedExtras) ? cartEntry.selectedExtras : [];
    const itemExtrasTotal = getItemExtrasUnitTotal(cartEntry);
    const hasCustom = Boolean(itemNotes) || itemExtras.length > 0;
    const availExtrasCount = getAvailableExtrasForProduct(prod).length;
    const isNew = isNewBadge || prod.isNew || prod.badge === 'baru';
    const promo = explicitPromo || getProductPromo(prod.id);
    const pricing = getPromoPricing(prod, promo);

    return (
      <div
        key={`${explicitPromo ? 'promo-list-' : ''}${prod.id}`}
        data-testid={`${explicitPromo ? 'promo-row-' : 'product-row-'}${prod.id}`}
        onClick={() => openMenuNoteModal(prod, inCart > 0 ? 'edit' : 'add')}
        style={{
          background: bgCard,
          border: inCart > 0
            ? (isLight ? '2px solid #2563eb' : '2px solid #3b82f6')
            : promo && pricing.hasDiscount
              ? (isLight ? '1.5px solid #fbbf24' : '1.5px solid rgba(245, 158, 11, 0.45)')
              : `1px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: inCart > 0 ? '0 4px 14px rgba(37, 99, 235, 0.12)' : '0 1px 4px rgba(0,0,0,0.02)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Left Thumbnail with Image & Badge */}
          <div style={{ position: 'relative', width: '74px', height: '74px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src={prod.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
              alt={prod.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            {promo && pricing.hasDiscount ? (
              <span style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                padding: '1px 6px',
                borderRadius: '5px',
                background: '#dc2626',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.58rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Flame size={10} strokeWidth={2.5} />
                <span>{pricing.badgeLabel}</span>
              </span>
            ) : isNew ? (
              <span style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                padding: '1px 5px',
                borderRadius: '4px',
                background: '#ef4444',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.58rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Sparkles size={10} strokeWidth={2.5} />
                <span>Baru</span>
              </span>
            ) : null}
          </div>

          {/* Center Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              margin: 0,
              fontSize: '0.88rem',
              fontWeight: 800,
              color: textPrimary,
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {prod.name}
            </h4>
            <p style={{
              margin: '2px 0 0',
              fontSize: '0.7rem',
              color: textSecondary,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {prod.description}
            </p>
            {promo && (
              <div style={{ marginTop: '4px' }}>
                {renderQuotaBadge(promo, true)}
              </div>
            )}
            {pricing.hasDiscount ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  color: '#dc2626',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap'
                }}>
                  Rp {pricing.finalPrice.toLocaleString('id-ID')}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  color: textSecondary,
                  textDecoration: 'line-through',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap'
                }}>
                  Rp {pricing.basePrice.toLocaleString('id-ID')}
                </span>
              </div>
            ) : (
              <span style={{
                display: 'block',
                fontSize: '0.92rem',
                fontWeight: 900,
                color: isLight ? '#0f172a' : '#f8fafc',
                fontFamily: 'var(--font-mono)',
                marginTop: '4px'
              }}>
                Rp {prod.price?.toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* Right Action: Button or Stepper */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ flexShrink: 0, minWidth: '84px', display: 'flex', justifyContent: 'flex-end' }}
          >
            {inCart === 0 ? (
              <button
                type="button"
                data-testid={`${explicitPromo ? 'promo-add-' : 'add-menu-'}${prod.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openMenuNoteModal(prod, 'add');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: promo && pricing.hasDiscount
                    ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Tambah</span>
              </button>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isLight ? '#eff6ff' : '#1e293b',
                border: '1.5px solid #3b82f6',
                borderRadius: '8px',
                padding: '2px 5px'
              }}>
                <button
                  type="button"
                  aria-label={`Kurangi ${prod.name}`}
                  data-testid={`qty-minus-${prod.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    decrementCartItem(prod);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Minus size={11} strokeWidth={2.5} />
                </button>
                <span style={{
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  color: textPrimary,
                  fontFamily: 'var(--font-mono)',
                  minWidth: '16px',
                  textAlign: 'center'
                }}>
                  {inCart}
                </span>
                <button
                  type="button"
                  aria-label={`Tambah ${prod.name}`}
                  data-testid={`qty-plus-${prod.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    incrementCartItem(prod);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={11} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>

        {inCart > 0 && (
          <button
            type="button"
            data-testid={`edit-note-${prod.id}`}
            onClick={(e) => {
              e.stopPropagation();
              openMenuNoteModal(prod, 'edit');
            }}
            style={{
              width: '100%',
              padding: '4px 8px',
              borderRadius: '8px',
              border: `1px dashed ${hasCustom ? '#3b82f6' : borderColor}`,
              background: hasCustom
                ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.14)')
                : (isLight ? '#f8fafc' : '#1e293b'),
              color: hasCustom ? '#1d4ed8' : textSecondary,
              fontSize: '0.68rem',
              fontWeight: hasCustom ? 700 : 600,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <MessageSquare size={11} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {hasCustom
                ? [
                    itemExtras.length > 0
                      ? `Extra: ${itemExtras.map(e => {
                          const eQty = Math.max(1, Number(e.qty) || 1);
                          return `${eQty > 1 ? `${eQty}x ` : ''}${e.name}`;
                        }).join(', ')} (+Rp ${itemExtrasTotal.toLocaleString('id-ID')})`
                      : null,
                    itemNotes ? `Catatan: ${itemNotes}` : null
                  ].filter(Boolean).join(' • ')
                : (availExtrasCount > 0 ? '+ Tambah catatan & extra untuk menu ini' : '+ Tambah catatan untuk menu ini')}
            </span>
          </button>
        )}
      </div>
    );
  };

  const cartItems = Object.values(cart);
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + ((Number(item.product.price || 0) + getItemExtrasUnitTotal(item)) * item.qty),
    0
  );

  // Perhitungan otomatis diskon promo per-item (berdasarkan kuota yg ter-hold / tersedia) + promo belanja toko
  const activeItemPromosSummary = [];
  let itemPromosDiscount = 0;
  cartItems.forEach((item) => {
    const itemPromo = getProductPromo(item.product.id);
    if (!itemPromo) return;
    if (itemPromo.minOrder && cartSubtotal < itemPromo.minOrder) return;

    const isQuotaTracked = itemPromo.limitType === 'QUOTA' || itemPromo.limitType === 'BOTH';
    let eligibleQty = item.qty;
    if (isQuotaTracked) {
      if ((itemPromo.myHeldCount || 0) > 0) {
        eligibleQty = Math.min(item.qty, itemPromo.myHeldCount);
      } else {
        eligibleQty = Math.min(item.qty, Math.max(0, itemPromo.remainingQuota || 0));
      }
    }
    if (eligibleQty <= 0) return;

    const { savingsPerUnit } = getPromoPricing(item.product, itemPromo);
    const totalItemDiscount = savingsPerUnit * eligibleQty;
    if (totalItemDiscount > 0) {
      itemPromosDiscount += totalItemDiscount;
      activeItemPromosSummary.push({ promo: itemPromo, eligibleQty, amount: totalItemDiscount });
    }
  });

  const activeStorePromo = selectedStorePromo
    ? (promosList.find((p) => p.id === selectedStorePromo.id) || selectedStorePromo)
    : null;

  const storePromoDiscount = (() => {
    if (!activeStorePromo || cartItems.length === 0) return 0;
    if (activeStorePromo.minOrder && cartSubtotal < activeStorePromo.minOrder) return 0;
    const isQuotaTracked = activeStorePromo.limitType === 'QUOTA' || activeStorePromo.limitType === 'BOTH';
    if (isQuotaTracked && (activeStorePromo.myHeldCount || 0) <= 0 && (activeStorePromo.remainingQuota || 0) <= 0) {
      return 0;
    }
    const baseRemaining = Math.max(0, cartSubtotal - itemPromosDiscount);
    if (activeStorePromo.discountType === 'PERCENT') {
      return Math.round(baseRemaining * (Math.min(100, activeStorePromo.discountValue) / 100));
    }
    return Math.min(baseRemaining, Number(activeStorePromo.discountValue) || 0);
  })();

  const promoDiscount = itemPromosDiscount + storePromoDiscount;
  const appliedPromoIds = [
    ...new Set([
      ...activeItemPromosSummary.map((x) => x.promo.id),
      ...(storePromoDiscount > 0 && activeStorePromo ? [activeStorePromo.id] : [])
    ])
  ];

  const maxRedeemablePoints = Math.min(userPoints, 500);
  const discountAmount = (isStoreTier2 && usePoints && maxRedeemablePoints > 0)
    ? Math.min(maxRedeemablePoints * storePointValueIdr, Math.max(0, cartSubtotal - promoDiscount))
    : 0;
  const autoDiscVal = Number(storeInfo?.customerDiscountValue || 0);
  const autoDiscMin = Math.max(0, Number(storeInfo?.customerDiscountMinOrder || 0));
  const autoCustomerDiscount = (Boolean(storeInfo?.customerDiscountEnabled) && autoDiscVal > 0 && cartSubtotal >= autoDiscMin)
    ? (storeInfo?.customerDiscountType === 'FIXED'
      ? Math.min(Math.max(0, cartSubtotal - promoDiscount - discountAmount), Math.round(autoDiscVal))
      : Math.min(Math.max(0, cartSubtotal - promoDiscount - discountAmount), Math.round((cartSubtotal * Math.min(100, autoDiscVal)) / 100)))
    : 0;
  // Kebijakan: Transaksi Mitra bebas biaya admin bagi pelanggan (beban ke owner/bisnis)
  const platformFee = 0;
  const cartTotal = Math.max(0, cartSubtotal - promoDiscount - discountAmount - autoCustomerDiscount);

  const handleApplyPromoCode = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    if (!isStoreTier2 && code.startsWith('POIN-')) {
      setPromoFeedback({
        type: 'error',
        text: 'Toko ini belum bergabung di Loyalty Pool (Tier 2). Voucher tukar poin hanya berlaku di toko Tier 2.'
      });
      return;
    }
    try {
      const res = await fetch(withDemoQs('/api/pos/promos/validate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoCode: code,
          sessionId: cartSessionId,
          storeId: storeInfo?.merchantId || undefined,
          tableToken: tableInfo?.qrToken || tableToken || undefined,
          items: cartItems.map(it => ({ productId: it.product.id, qty: it.qty, price: it.product.price })),
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
          scope: data.scope || 'ALL',
          targetProductId: data.targetProductId || null,
          remainingQuota: data.remainingQuota
        };
        if (matched.scope === 'ALL') {
          await handleToggleStorePromo(matched);
        } else {
          setPromoFeedback({ type: 'success', text: data.message });
        }
      } else {
        setPromoFeedback({ type: 'error', text: data.message || data.error || 'Kode promo tidak valid atau kadaluarsa' });
      }
    } catch (err) {
      setPromoFeedback({ type: 'error', text: 'Gagal memvalidasi promo: ' + err.message });
    }
  };

  // 4. Handle Submit Order to Kitchen (Status: PENDING_CONFIRMATION) — otomatis atas nama Meja!
  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;

    const autoTableCustomerName = (tableInfo?.number && tableInfo.number !== 'Memuat Meja...')
      ? tableInfo.number
      : 'Meja Tamu';

    try {
      setSubmittingOrder(true);
      const eligibleStorePromoId = (storePromoDiscount > 0 && activeStorePromo) ? activeStorePromo.id : null;
      const primaryAppliedId = appliedPromoIds[0] || eligibleStorePromoId || null;
      const primaryAppliedObj = primaryAppliedId
        ? promosList.find((p) => p.id === primaryAppliedId) || (eligibleStorePromoId === primaryAppliedId ? activeStorePromo : null)
        : null;

      const payload = {
        storeId: storeInfo?.merchantId || undefined,
        tableToken: tableInfo.qrToken || tableToken,
        customerName: autoTableCustomerName,
        customerPhone: customerPhone.trim(),
        isLoggedIn: Boolean(currentUser),
        sessionId: cartSessionId,
        items: cartItems.map(item => ({
          productId: item.product.id,
          qty: item.qty,
          notes: item.notes || '',
          selectedExtras: (item.selectedExtras || []).map(ex => ({
            id: ex.id,
            name: ex.name,
            price: ex.price,
            qty: Math.max(1, Number(ex.qty) || 1)
          }))
        })),
        notes: '',
        pointsToRedeem: (isStoreTier2 && currentUser && usePoints) ? Math.floor(discountAmount / Math.max(1, storePointValueIdr)) : 0,
        discountAmount: promoDiscount + discountAmount + autoCustomerDiscount,
        autoCustomerDiscountAmount: autoCustomerDiscount,
        autoCustomerDiscountApplied: true,
        promoId: primaryAppliedId,
        promoCode: primaryAppliedObj?.code || null,
        appliedPromoIds
      };

      const res = await fetch(withDemoQs('/api/pos/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const order = await res.json();
        setActiveOrder(order);
        setCart({});
        setSelectedStorePromo(null);
        setShowCartDrawer(false);
        refreshPromosList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengirim pesanan ke dapur');
        refreshPromosList();
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // 5. Handle Payment Selection (Bayar via KostKu QRIS TriPay atau Cash di Kasir)
  const handleProcessPayment = async (selectedMethod = 'TRIPAY') => {
    if (!activeOrder?.id) return;
    try {
      setPayingLoading(true);
      const res = await fetch(withDemoQs(`/api/pos/orders/${activeOrder.id}/pay`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: selectedMethod
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (selectedMethod === 'CASH_COUNTER') {
          setPaymentData(null);
          if (data.order) {
            setActiveOrder(data.order);
          } else {
            setActiveOrder(prev => prev ? ({
              ...prev,
              paymentMethod: 'CASH',
              customerSelectedPayment: 'CASH_COUNTER',
              paymentStatus: 'WAITING_CASHIER',
              qrisFee: 0,
              customerAdminFee: Number(data.customerAdminFee) || 0,
              notaFeeBearer: data.notaFeeBearer || prev.notaFeeBearer,
              totalAmount: data.total ?? prev.totalAmount
            }) : prev);
          }
        } else {
          setPaymentData(data);
          setActiveOrder(prev => prev ? ({
            ...prev,
            customerSelectedPayment: 'TRIPAY',
            paymentMethod: 'TRIPAY',
            qrisFee: Number(data.qrisFee) || 0,
            customerAdminFee: Number(data.customerAdminFee) || 0,
            notaFeeBearer: data.notaFeeBearer || prev.notaFeeBearer,
            totalAmount: data.total ?? prev.totalAmount
          }) : prev);
        }
      } else {
        alert(data.error || 'Gagal memproses pilihan pembayaran');
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
      const res = await fetch(withDemoQs(`/api/pos/orders/${activeOrder.id}/spin`), {
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
      {/* ── TOP STICKY APP BAR (SLIM, MODERN & AESTHETIC) ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: isLight ? '#ffffff' : '#0f172a',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${borderColor}`,
        padding: '0.65rem 1rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          {/* Logo & Store Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
              flexShrink: 0
            }}>
              <Utensils size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontSize: '0.86rem',
                fontWeight: 900,
                color: textPrimary,
                display: 'block',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {formatStoreHeaderLines(storeInfo || {}).storeName}
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#f59e0b' }}>
                Self-Order Meja
              </span>
            </div>
          </div>

          {/* Table Pill & Points */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 9px',
              borderRadius: '999px',
              background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#059669'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              {tableInfo.number}
            </span>

            {userPoints > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '999px',
                background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)',
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#d97706'
              }}>
                <Award size={12} /> {userPoints} Pts
              </span>
            )}
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
                {activeOrder.status === 'PREPARING' && 'Sedang Dimasak'}
                {activeOrder.status === 'COMPLETED' && 'Selesai Disajikan'}
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
            {activeOrder.status === 'WAITING_PAYMENT' && !paymentData && (() => {
              const baseOrderAmount = Number(
                activeOrder.baseAmountBeforePaymentFee ??
                Math.max(
                  0,
                  Number(activeOrder.totalAmount || 0) -
                    (Number(activeOrder.qrisFee) || 0) -
                    (Number(activeOrder.customerAdminFee) || 0)
                )
              );
              const notaFeeBearer = (storeInfo?.notaFeeBearer || activeOrder.notaFeeBorneBy || activeOrder.notaFeeBearer) === 'customer'
                ? 'customer'
                : 'store';
              const activeNotaFee = Math.max(0, Number(activeOrder.adminFee || activeOrder.billing_fee_idr || storeInfo?.notaFeePerNotaIdr || 25));
              const customerAdminFee = notaFeeBearer === 'customer' ? activeNotaFee : 0;
              const qrisCalc = calculateQrisCustomerFee(baseOrderAmount, 'customer');
              const totalQrisWithAllFees = baseOrderAmount + qrisCalc.fee + customerAdminFee;
              const totalCashAtCounter = baseOrderAmount + customerAdminFee;
              const isWaitingCashier = activeOrder.customerSelectedPayment === 'CASH_COUNTER';

              if (isWaitingCashier) {
                return (
                  <div
                    data-testid="waiting-cashier-banner"
                    style={{
                      background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.14)',
                      border: '1px solid #fcd34d',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <Banknote size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.84rem', color: isLight ? '#92400e' : '#fcd34d' }}>
                          Menunggu Pembayaran Tunai di Kasir
                        </strong>
                        <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: textSecondary }}>
                          Silakan menuju meja kasir dan sebutkan pesanan <strong>{activeOrder.customerName}</strong>{activeOrder.tableNumber && activeOrder.tableNumber !== activeOrder.customerName ? ` (${activeOrder.tableNumber})` : ''}.
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: '8px 10px', borderRadius: '10px', background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)', border: `1px solid ${borderColor}`, fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: textSecondary }}>
                        <span>Subtotal Pesanan</span>
                        <strong style={{ color: textPrimary, fontFamily: 'var(--font-mono)' }}>Rp {baseOrderAmount.toLocaleString('id-ID')}</strong>
                      </div>
                      {customerAdminFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                          <span>Biaya Admin Nota (Customer)</span>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>+Rp {customerAdminFee.toLocaleString('id-ID')}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', marginTop: '2px', borderTop: `1px dashed ${borderColor}`, fontWeight: 800, color: textPrimary }}>
                        <span>Total Bayar Tunai di Kasir</span>
                        <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>Rp {totalCashAtCounter.toLocaleString('id-ID')}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={payingLoading}
                      onClick={() => handleProcessPayment('TRIPAY')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #bfdbfe',
                        background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.2)',
                        color: isLight ? '#1d4ed8' : '#93c5fd',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <CreditCard size={15} />
                      {payingLoading ? 'Memproses...' : 'Ubah / Bayar via KostKu (QRIS)'}
                    </button>
                  </div>
                );
              }

              return (
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
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.84rem', color: isLight ? '#1e40af' : '#93c5fd' }}>
                        Pesanan di-ACC! Pilih Metode Pembayaran di Meja
                      </strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: textSecondary }}>
                        Anda dapat langsung bayar online via KostKu (QRIS) atau bayar tunai langsung ke kasir.
                      </p>
                    </div>
                  </div>

                  {/* Opsi 1: Bayar via KostKu (QRIS Dinamis) */}
                  <div style={{
                    padding: '11px',
                    borderRadius: '12px',
                    border: '1px solid #93c5fd',
                    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.65)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9px',
                        background: '#2563eb',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CreditCard size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '0.84rem', color: textPrimary }}>
                          Bayar via KostKu (QRIS Dinamis)
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: textSecondary }}>
                          GoPay, OVO, Dana, ShopeePay, BCA, Mandiri &amp; BRImo — langsung masuk dapur!
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '7px 9px', borderRadius: '8px', background: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.6)', border: `1px solid ${borderColor}`, fontSize: '0.73rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: textSecondary }}>
                        <span>Subtotal Pesanan</span>
                        <strong style={{ color: textPrimary, fontFamily: 'var(--font-mono)' }}>Rp {baseOrderAmount.toLocaleString('id-ID')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
                        <span>Biaya QRIS (Rp 750 + 0,70%)</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>+Rp {qrisCalc.fee.toLocaleString('id-ID')}</strong>
                      </div>
                      {customerAdminFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                          <span>Biaya Admin Nota (Customer)</span>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>+Rp {customerAdminFee.toLocaleString('id-ID')}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', marginTop: '2px', borderTop: `1px dashed ${borderColor}`, color: textPrimary, fontWeight: 800 }}>
                        <span>Total Tagihan QRIS</span>
                        <strong style={{ color: '#16a34a', fontFamily: 'var(--font-mono)' }}>Rp {totalQrisWithAllFees.toLocaleString('id-ID')}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid="pay-kostku-qris-btn"
                      onClick={() => handleProcessPayment('TRIPAY')}
                      disabled={payingLoading}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px'
                      }}
                    >
                      <CreditCard size={16} />
                      {payingLoading ? 'Memproses...' : `Bayar via KostKu (Rp ${totalQrisWithAllFees.toLocaleString('id-ID')})`}
                    </button>
                  </div>

                  {/* Opsi 2: Bayar Cash di Kasir */}
                  <div style={{
                    padding: '11px',
                    borderRadius: '12px',
                    border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(148, 163, 184, 0.35)'}`,
                    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.55)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9px',
                        background: '#059669',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Banknote size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '0.84rem', color: textPrimary }}>
                          Bayar Cash di Kasir
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: textSecondary }}>
                          Tanpa biaya QRIS. Bayar uang tunai langsung ke kasir toko.
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '7px 9px', borderRadius: '8px', background: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.6)', border: `1px solid ${borderColor}`, fontSize: '0.73rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: textSecondary }}>
                        <span>Subtotal Pesanan</span>
                        <strong style={{ color: textPrimary, fontFamily: 'var(--font-mono)' }}>Rp {baseOrderAmount.toLocaleString('id-ID')}</strong>
                      </div>
                      {customerAdminFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                          <span>Biaya Admin Nota (Customer)</span>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>+Rp {customerAdminFee.toLocaleString('id-ID')}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', marginTop: '2px', borderTop: `1px dashed ${borderColor}`, color: textPrimary, fontWeight: 800 }}>
                        <span>Total Bayar Cash</span>
                        <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>Rp {totalCashAtCounter.toLocaleString('id-ID')}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid="pay-cash-counter-btn"
                      onClick={() => handleProcessPayment('CASH_COUNTER')}
                      disabled={payingLoading}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #10b981',
                        background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)',
                        color: isLight ? '#047857' : '#6ee7b7',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px'
                      }}
                    >
                      <Banknote size={16} />
                      {payingLoading ? 'Menyimpan...' : `Pilih Bayar Cash di Kasir (Rp ${totalCashAtCounter.toLocaleString('id-ID')})`}
                    </button>
                  </div>
                </div>
              );
            })()}

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
                  Pindai QRIS TriPay (KostKu)
                </span>
                {paymentData.qrDataUrl ? (
                  <img src={paymentData.qrDataUrl} alt="QRIS" style={{ width: '180px', height: '180px', margin: '0 auto', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '6px' }} />
                ) : (
                  <div style={{ width: '160px', height: '160px', margin: '0 auto', borderRadius: '12px', border: '1px dashed #93c5fd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#2563eb', gap: '6px' }}>
                    <QrCode size={72} />
                    <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{paymentData.reference || 'QRIS TriPay'}</span>
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: textSecondary }}>
                  {Number(paymentData.qrisFee) > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#2563eb', marginBottom: '3px', fontWeight: 700 }}>
                      Biaya Layanan QRIS (Rp 750 + 0,70%): +Rp {Number(paymentData.qrisFee).toLocaleString('id-ID')}
                    </div>
                  )}
                  {Number(paymentData.customerAdminFee) > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#d97706', marginBottom: '3px', fontWeight: 700 }}>
                      Biaya Admin Nota: +Rp {Number(paymentData.customerAdminFee).toLocaleString('id-ID')}
                    </div>
                  )}
                  Total Bayar: <strong style={{ color: '#16a34a', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>Rp {paymentData.total?.toLocaleString('id-ID')}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    data-testid="confirm-qris-sim-btn"
                    onClick={() => {
                      fetch(withDemoQs(`/api/pos/orders/${activeOrder.id}/confirm-payment`), { method: 'POST' })
                        .then(r => r.json())
                        .then((resData) => {
                          setPaymentData(null);
                          if (resData?.order) setActiveOrder(resData.order);
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
                  <button
                    type="button"
                    disabled={payingLoading}
                    onClick={() => handleProcessPayment('CASH_COUNTER')}
                    style={{
                      padding: '7px',
                      borderRadius: '9px',
                      border: `1px solid ${borderColor}`,
                      background: 'transparent',
                      color: textSecondary,
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    Ganti ke Bayar Cash di Kasir
                  </button>
                </div>
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
                        {allItemsReady ? 'Semua Menu Sudah Siap!' : 'Sedang Dimasak di Dapur'}
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                            <span style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: isItemReady ? '#15803d' : textPrimary,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}>
                              {isItemReady ? <CheckCircle2 size={13} color="#16a34a" /> : <Clock size={13} color="#d97706" />}
                              <span><strong>{it.qty}x</strong> {it.name}</span>
                            </span>
                            {Array.isArray(it.extras) && it.extras.length > 0 && (
                              <span style={{ fontSize: '0.68rem', color: isLight ? '#b45309' : '#fbbf24', paddingLeft: '18px', fontWeight: 700 }}>
                                + Extra: {it.extras.map(ex => {
                                  const exQty = Math.max(1, Number(ex.qty) || 1);
                                  const exTotal = (Number(ex.price) || 0) * exQty;
                                  return `${exQty > 1 ? `${exQty}x ` : ''}${ex.name} (+Rp ${exTotal.toLocaleString('id-ID')})`;
                                }).join(', ')}
                              </span>
                            )}
                            {it.notes && (
                              <span style={{ fontSize: '0.7rem', color: textSecondary, paddingLeft: '18px', fontStyle: 'italic' }}>
                                Catatan: {it.notes}
                              </span>
                            )}
                          </div>
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
      <main style={{ maxWidth: '480px', margin: '0.75rem auto 0', padding: '0 0.85rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* ── 1. HEADER TOKO, DESKRIPSI & BINTANG RATING (ATAS) ── */}
        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '18px',
          padding: '1rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Accent Glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #f59e0b 0%, #ea580c 50%, #2563eb 100%)'
          }} />

          {/* Toko Name, Utensils Icon & Table Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                flexShrink: 0
              }}>
                <Utensils size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: textPrimary, letterSpacing: '-0.2px' }}>
                    {formatStoreHeaderLines(storeInfo || {}).storeName}
                  </h2>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    <Check size={10} strokeWidth={3} />
                    <span>Terverifikasi</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.18)',
                    color: '#2563eb',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <MapPin size={11} strokeWidth={2.5} />
                    <span>{tableInfo.number}</span>
                  </span>
                  <span style={{ fontSize: '0.68rem', color: textSecondary }}>
                    Self-Order POS Meja
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Points Pill */}
            {currentUser && (
              <div style={{
                textAlign: 'right',
                background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.12)',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}>
                <span style={{ fontSize: '0.62rem', color: textSecondary, display: 'block' }}>Poin Kamu</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                  <Award size={12} /> {userPoints} Pts
                </span>
              </div>
            )}
          </div>

          {/* Bintang Rating & Review Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '10px',
            background: isLight ? '#fefce8' : 'rgba(234, 179, 8, 0.08)',
            border: isLight ? '1px solid #fef08a' : '1px solid rgba(234, 179, 8, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(st => (
                <Star
                  key={st}
                  size={14}
                  fill="#f59e0b"
                  color="#f59e0b"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3))' }}
                />
              ))}
            </div>
            <strong style={{ fontSize: '0.84rem', fontWeight: 900, color: isLight ? '#854d0e' : '#fef08a' }}>
              {Number(storeInfo?.rating || 4.9).toFixed(1)}
            </strong>
            <span style={{ fontSize: '0.7rem', color: textSecondary }}>
              ({storeInfo?.reviewsCount || 128}+ ulasan pelanggan)
            </span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#16a34a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              whiteSpace: 'nowrap'
            }}>
              <Zap size={12} strokeWidth={2.5} />
              <span>Cepat Saji</span>
            </span>
          </div>

          {/* Deskripsi Toko */}
          <p style={{
            margin: 0,
            fontSize: '0.76rem',
            lineHeight: 1.45,
            color: textSecondary
          }}>
            {storeInfo?.description || 'Kantin lezat, bersih, dan higienis khas KostKu. Menyediakan hidangan rumahan hangat, snack gurih, dan aneka minuman segar siap saji ke mejamu.'}
          </p>

          {/* Points Toggle for Tier 2 Loyalty (Member Login Only) */}
          {isStoreTier2 && userPoints > 0 && currentUser && (
            <div style={{
              paddingTop: '8px',
              borderTop: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.72rem', color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gift size={13} color="#f59e0b" />
                Gunakan {Math.min(userPoints, 500)} Poin (Hemat Rp {(Math.min(userPoints, 500) * storePointValueIdr).toLocaleString('id-ID')})
              </span>
              <input
                data-testid="meja-use-points-checkbox"
                type="checkbox"
                checked={usePoints}
                onChange={e => setUsePoints(e.target.checked)}
                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>

        {/* ── 2. PILIHAN TAMPILAN MENU (KOTAK BOX BOX vs LIST RAMPING) ── */}
        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '14px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              display: 'block'
            }}>
              Pilihan Tampilan Menu
            </span>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: textPrimary }}>
              {viewMode === 'list' ? 'List Ramping (Daftar)' : 'Kotak Box (Grid)'}
            </span>
          </div>

          {/* Switcher Toggle Buttons */}
          <div style={{
            display: 'flex',
            background: isLight ? '#f1f5f9' : '#0f172a',
            padding: '2px',
            borderRadius: '10px',
            border: `1px solid ${borderColor}`
          }}>
            <button
              type="button"
              data-testid="view-mode-list"
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'list'
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : textSecondary,
                fontWeight: viewMode === 'list' ? 800 : 600,
                fontSize: '0.74rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 2px 6px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <List size={13} />
              <span>List</span>
            </button>

            <button
              type="button"
              data-testid="view-mode-grid"
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'grid'
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : textSecondary,
                fontWeight: viewMode === 'grid' ? 800 : 600,
                fontSize: '0.74rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={13} />
              <span>Kotak Box</span>
            </button>
          </div>
        </div>

        {/* ── 3. PROMO MAKANAN (MENU PROMO LANGSUNG HOLD KUOTA SAAT MASUK KERANJANG) ── */}
        {(() => {
          const promoMenuEntries = eligiblePromos
            .filter((p) => p.scope === 'SPECIFIC_ITEM' && p.targetProductId)
            .map((promo) => ({
              promo,
              prod: products.find((item) => item.id === promo.targetProductId)
            }))
            .filter((entry) => Boolean(entry.prod));

          const storePromos = eligiblePromos.filter((p) => p.scope !== 'SPECIFIC_ITEM');

          return (
            <div
              data-testid="promo-makanan-section"
              style={{
                background: bgCard,
                border: promoDiscount > 0 ? '1.5px solid #10b981' : `1px solid ${borderColor}`,
                borderRadius: '18px',
                padding: '12px 14px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isLight ? '#fff7ed' : 'rgba(234, 88, 12, 0.18)',
                    border: '1px solid rgba(234, 88, 12, 0.28)'
                  }}>
                    <Flame size={15} color="#ea580c" strokeWidth={2.4} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: textPrimary }}>
                      Promo Makanan
                    </h3>
                    <span style={{ fontSize: '0.66rem', color: textSecondary, display: 'block', lineHeight: 1.3 }}>
                      Masuk keranjang hold kuota • Hapus kembali
                    </span>
                  </div>
                </div>
                {promoDiscount > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.2)',
                    color: '#15803d',
                    border: '1px solid #86efac',
                    whiteSpace: 'nowrap'
                  }}>
                    Hemat Rp {promoDiscount.toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              {promoHoldNotice && (
                <div style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: promoHoldNotice.type === 'warning'
                    ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.16)')
                    : (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)'),
                  color: promoHoldNotice.type === 'warning' ? '#b45309' : '#15803d',
                  border: `1px solid ${promoHoldNotice.type === 'warning' ? '#fde68a' : '#86efac'}`
                }}>
                  {promoHoldNotice.text}
                </div>
              )}

              {/* Primary: Menu Makanan Berpromo (Sesuai Kotak Box / List Mode) */}
              {promoMenuEntries.length > 0 ? (
                viewMode === 'grid' ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: promoMenuEntries.length === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                    gap: '10px',
                    alignItems: 'stretch'
                  }}>
                    {promoMenuEntries.map((entry) =>
                      renderProductGridCard(entry.prod, false, entry.promo, promoMenuEntries.length === 1)
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {promoMenuEntries.map((entry) =>
                      renderProductListRow(entry.prod, false, entry.promo)
                    )}
                  </div>
                )
              ) : (
                storePromos.length === 0 && (
                  <p style={{ margin: 0, fontSize: '0.74rem', color: textSecondary, fontStyle: 'italic' }}>
                    Belum ada menu promo makanan aktif saat ini.
                  </p>
                )
              )}

              {/* Secondary: Diskon Tambahan Keranjang (Vertical Full-Width List + Live Claim Status) */}
              {storePromos.length > 0 && (
                <div style={{
                  paddingTop: promoMenuEntries.length > 0 ? '10px' : 0,
                  borderTop: promoMenuEntries.length > 0 ? `1px dashed ${borderColor}` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.35px' }}>
                      Diskon Tambahan Keranjang
                    </span>
                    {activeStorePromo && (
                      <button
                        type="button"
                        onClick={() => handleToggleStorePromo(activeStorePromo)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <span>Lepas Promo</span>
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    width: '100%'
                  }}>
                    {storePromos.map((promo) => {
                      const isSelected = activeStorePromo?.id === promo.id;
                      const isActiveNow = isSelected && storePromoDiscount > 0;
                      const discountText = promo.discountType === 'PERCENT'
                        ? `Diskon ${promo.discountValue}%`
                        : `Potongan Rp ${(promo.discountValue || 0).toLocaleString('id-ID')}`;
                      return (
                        <button
                          key={promo.id}
                          type="button"
                          data-testid={`store-promo-pill-${promo.id}`}
                          aria-pressed={isSelected}
                          onClick={() => handleToggleStorePromo(promo)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: isActiveNow
                              ? '1.5px solid #10b981'
                              : isSelected
                                ? '1.5px solid #f59e0b'
                                : `1px solid ${borderColor}`,
                            background: isActiveNow
                              ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)')
                              : isSelected
                                ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.14)')
                                : (isLight ? '#f8fafc' : '#1e293b'),
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            textAlign: 'left',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <strong style={{
                                fontSize: '0.82rem',
                                color: isActiveNow ? '#15803d' : isSelected ? '#b45309' : textPrimary,
                                lineHeight: 1.25,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                <Tag size={13} strokeWidth={2.4} />
                                <span>{discountText}</span>
                              </strong>
                              <span style={{
                                fontSize: '0.64rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '5px',
                                background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                                color: '#b45309',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {promo.code}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.68rem', color: textSecondary }}>
                                {promo.minOrder > 0
                                  ? `Min. belanja Rp ${promo.minOrder.toLocaleString('id-ID')}`
                                  : 'Tanpa min. belanja'}
                              </span>
                              {renderQuotaBadge(promo, true)}
                            </div>
                          </div>

                          <span style={{
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                            padding: '5px 10px',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isActiveNow
                              ? '#10b981'
                              : isSelected
                                ? '#d97706'
                                : (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.18)'),
                            color: isSelected ? '#ffffff' : '#2563eb',
                            border: isSelected ? 'none' : '1px solid rgba(37, 99, 235, 0.3)'
                          }}>
                            {isActiveNow ? (
                              <>
                                <Check size={11} strokeWidth={3} />
                                <span>Aktif</span>
                              </>
                            ) : isSelected ? (
                              <>
                                <Check size={11} strokeWidth={3} />
                                <span>Dipilih</span>
                              </>
                            ) : (
                              'Pakai'
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeStorePromo && (() => {
                    const minReq = Number(activeStorePromo.minOrder) || 0;
                    const shortfall = Math.max(0, minReq - cartSubtotal);
                    const pct = minReq > 0 ? Math.min(100, Math.round((cartSubtotal / minReq) * 100)) : 100;
                    const isActivated = storePromoDiscount > 0;
                    return (
                      <div
                        data-testid="store-promo-status"
                        style={{
                          padding: '9px 11px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: isActivated
                            ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)')
                            : (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)'),
                          color: isActivated ? '#15803d' : '#b45309',
                          border: `1px solid ${isActivated ? '#86efac' : '#fde68a'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          {isActivated && <Check size={13} strokeWidth={3} style={{ flexShrink: 0, marginTop: '1px' }} />}
                          <span>
                            {isActivated
                              ? `Promo ${activeStorePromo.code} aktif! Hemat Rp ${storePromoDiscount.toLocaleString('id-ID')} otomatis terpotong di keranjang.`
                              : cartItems.length === 0
                                ? `Voucher ${activeStorePromo.code} dipilih — pilih menu dulu ke keranjang${minReq > 0 ? ` (min. belanja Rp ${minReq.toLocaleString('id-ID')})` : ''} untuk aktifkan potongan.`
                                : `Voucher ${activeStorePromo.code} dipilih — tambah belanja Rp ${shortfall.toLocaleString('id-ID')} lagi agar potongan otomatis aktif!`}
                          </span>
                        </div>
                        {!isActivated && minReq > 0 && (
                          <div style={{
                            width: '100%',
                            height: '5px',
                            borderRadius: '999px',
                            background: isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.25)',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: '#d97706',
                              borderRadius: '999px',
                              transition: 'width 0.25s ease'
                            }} />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Collapsible Manual Voucher Code Input */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setShowPromoInput(!showPromoInput)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '2px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Tag size={12} />
                  <span>{showPromoInput ? 'Tutup input kode' : 'Punya kode promo lain? ▾'}</span>
                </button>
              </div>

              {showPromoInput && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Contoh: KENYANG5K..."
                    value={promoCodeInput}
                    onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${borderLight}`,
                      background: isLight ? '#f8fafc' : '#1e293b',
                      color: textPrimary,
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Gunakan
                  </button>
                </div>
              )}

              {promoFeedback && (
                <div style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: promoFeedback.type === 'success' ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)') : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'),
                  color: promoFeedback.type === 'success' ? '#15803d' : '#b91c1c',
                  border: `1px solid ${promoFeedback.type === 'success' ? '#86efac' : '#fca5a5'}`
                }}>
                  {promoFeedback.text}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── 4. MENU BARU & REKOMENDASI ── */}
        {newProductsList.length > 0 && (
          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '18px',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(245, 158, 11, 0.28)'
                }}>
                  <Sparkles size={15} color="#d97706" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: textPrimary }}>
                    Menu Baru &amp; Rekomendasi
                  </h3>
                  <span style={{ fontSize: '0.68rem', color: textSecondary }}>
                    Pilihan terfavorit &amp; kreasi baru dapur
                  </span>
                </div>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                background: '#ef4444',
                color: '#ffffff'
              }}>
                {newProductsList.length} Baru
              </span>
            </div>

            {/* Render sesuai viewMode yang dipilih! */}
            {viewMode === 'grid' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '10px',
                alignItems: 'stretch'
              }}>
                {newProductsList.map(prod => renderProductGridCard(prod, true))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {newProductsList.map(prod => renderProductListRow(prod, true))}
              </div>
            )}
          </div>
        )}

        {/* ── 5. MENU BERDASARKAN KATEGORI (DROPDOWN ACCORDION - DEFAULT KEBUKA) ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginTop: '4px'
        }}>
          {/* Section Header with Quick Toggle All */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Daftar Lengkap
              </span>
              <h3 style={{ margin: '1px 0 0', fontSize: '0.94rem', fontWeight: 900, color: textPrimary }}>
                Menu Berdasarkan Kategori
              </h3>
            </div>

            <button
              type="button"
              onClick={() => toggleAllCategories(categoriesList)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#2563eb',
                background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                padding: '4px 10px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {categoriesList.every(c => isCategoryOpen(c)) ? 'Tutup Semua' : 'Buka Semua'}
            </button>
          </div>

          {/* Collapsible Category Cards */}
          {categoriesList.map(cat => {
            const catProds = products.filter(p => p.category === cat);
            const isOpen = isCategoryOpen(cat); // Default true (kebuka)!

            return (
              <div
                key={cat}
                style={{
                  background: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Accordion Header - Clickable to open/close */}
                <button
                  type="button"
                  data-testid={`category-header-${cat}`}
                  onClick={() => toggleCategory(cat)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isOpen
                      ? (isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.5)')
                      : bgCard,
                    border: 'none',
                    borderBottom: isOpen ? `1px solid ${borderColor}` : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.15rem' }}>{getCategoryIcon(cat)}</span>
                    <strong style={{ fontSize: '0.88rem', fontWeight: 800, color: textPrimary }}>
                      {cat}
                    </strong>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: isLight ? '#e2e8f0' : '#334155',
                      color: textSecondary
                    }}>
                      {catProds.length} menu
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: textSecondary }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {isOpen ? 'Tutup' : 'Buka'}
                    </span>
                    {isOpen ? <ChevronUp size={18} color="#2563eb" /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Accordion Content Body - Default kebuka */}
                {isOpen && (
                  <div style={{ padding: '12px 12px 14px' }}>
                    {loading ? (
                      <p style={{ textAlign: 'center', color: textSecondary, fontSize: '0.78rem', margin: '1rem 0' }}>
                        Memuat menu {cat}...
                      </p>
                    ) : catProds.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '1.2rem',
                        color: textSecondary,
                        fontSize: '0.78rem',
                        fontStyle: 'italic'
                      }}>
                        Belum ada menu di kategori {cat}.
                      </div>
                    ) : viewMode === 'grid' ? (
                      /* Mode Kotak Box Box 2-Kolom */
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: '10px',
                        alignItems: 'stretch'
                      }}>
                        {catProds.map(prod => renderProductGridCard(prod, false))}
                      </div>
                    ) : (
                      /* Mode List Ramping 1-Kolom */
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {catProds.map(prod => renderProductListRow(prod, false))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
          background: isLight ? '#ffffff' : '#0f172a',
          borderTop: `1px solid ${borderColor}`,
          padding: '0.85rem 1rem',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {promoDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#16a34a', fontWeight: 700 }}>
                <span>
                  Diskon Promo Di-Hold ({activeItemPromosSummary.length + (storePromoDiscount > 0 ? 1 : 0)}):
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-Rp {promoDiscount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <button
                type="button"
                data-testid="toggle-cart-drawer-btn"
                onClick={() => setShowCartDrawer(true)}
                style={{
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  padding: '5px 9px',
                  color: textPrimary,
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <ShoppingBag size={13} color="#2563eb" />
                <span>{cartItems.reduce((s, it) => s + it.qty, 0)} Item • Detail &amp; Catatan ▴</span>
              </button>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.68rem', color: '#16a34a', display: 'block', fontWeight: 600 }}>
                  {tableInfo.number} • Bebas Admin (Rp 0)
                </span>
                <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                  Rp {cartTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              type="button"
              data-testid="submit-order-btn"
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

      {/* ── MODAL CATATAN UMUM (CHECKBOX) + EXTRA / TOPPING PER MENU ── */}
      {menuNoteModal && (() => {
        const {
          product: mProd,
          mode: mMode,
          qty: mQty,
          selectedQuestions: mQuestions = [],
          selectedExtras: mExtras = [],
          customNote: mCustomNote = '',
          promo: mPromo
        } = menuNoteModal;
        const pricing = getPromoPricing(mProd, mPromo);
        const unitPrice = pricing.hasDiscount ? pricing.finalPrice : Number(mProd.price || 0);
        const commonQuestions = getCommonQuestionsForProduct(mProd);
        const availableExtras = getAvailableExtrasForProduct(mProd);
        const modalExtrasUnitTotal = mExtras.reduce(
          (sum, ex) => sum + (Math.max(0, Number(ex?.price) || 0) * Math.max(1, Number(ex?.qty) || 1)),
          0
        );
        const modalExtrasTotalCount = mExtras.reduce(
          (sum, ex) => sum + Math.max(1, Number(ex?.qty) || 1),
          0
        );
        const unitPriceWithExtras = unitPrice + modalExtrasUnitTotal;
        const isDrink = /minum|es |teh|kopi|jus|susu|latte|matcha/i.test(`${mProd.category || ''} ${mProd.name || ''}`);

        const toggleCommonQuestion = (label) => {
          setMenuNoteModal((prev) => {
            if (!prev) return prev;
            const cur = Array.isArray(prev.selectedQuestions) ? prev.selectedQuestions : [];
            const exists = cur.some(q => q.toLowerCase() === label.toLowerCase());
            const nextQuestions = exists
              ? cur.filter(q => q.toLowerCase() !== label.toLowerCase())
              : [...cur, label];
            return { ...prev, selectedQuestions: nextQuestions };
          });
        };

        const updateExtraQty = (extraObj, delta) => {
          setMenuNoteModal((prev) => {
            if (!prev) return prev;
            const cur = Array.isArray(prev.selectedExtras) ? prev.selectedExtras : [];
            const idx = cur.findIndex(ex => String(ex.id) === String(extraObj.id));
            const curQty = idx >= 0 ? Math.max(1, parseInt(cur[idx].qty ?? 1, 10) || 1) : 0;
            const nextQty = Math.min(99, Math.max(0, curQty + delta));
            let nextExtras;
            if (nextQty <= 0) {
              nextExtras = cur.filter(ex => String(ex.id) !== String(extraObj.id));
            } else if (idx >= 0) {
              nextExtras = cur.map((ex, i) =>
                i === idx
                  ? { id: extraObj.id, name: extraObj.name, price: extraObj.price, qty: nextQty }
                  : ex
              );
            } else {
              nextExtras = [...cur, { id: extraObj.id, name: extraObj.name, price: extraObj.price, qty: nextQty }];
            }
            return { ...prev, selectedExtras: nextExtras };
          });
        };

        const startSheetDrag = (clientY) => {
          sheetTouchStartYRef.current = clientY;
          sheetDragActiveRef.current = true;
        };
        const moveSheetDrag = (clientY) => {
          if (!sheetDragActiveRef.current) return;
          const dy = Math.max(0, clientY - sheetTouchStartYRef.current);
          sheetDragYRef.current = dy;
          setSheetDragY(dy);
        };
        const endSheetDrag = () => {
          if (!sheetDragActiveRef.current) return;
          const finalDy = sheetDragYRef.current;
          sheetDragActiveRef.current = false;
          sheetDragYRef.current = 0;
          setSheetDragY(0);
          if (finalDy > 85) setMenuNoteModal(null);
        };

        return (
          <div
            data-testid="menu-note-modal"
            onClick={() => setMenuNoteModal(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              background: 'rgba(0, 0, 0, 0.62)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              overscrollBehavior: 'none',
              touchAction: 'none'
            }}
          >
            <div
              data-testid="menu-note-sheet"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '480px',
                maxHeight: '90dvh',
                background: bgCard,
                color: textPrimary,
                borderTopLeftRadius: '22px',
                borderTopRightRadius: '22px',
                borderTop: `1px solid ${borderColor}`,
                padding: '0.65rem 1.05rem calc(1.1rem + env(safe-area-inset-bottom, 0px))',
                boxShadow: '0 -10px 35px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                overscrollBehavior: 'contain',
                transform: sheetDragY > 0 ? `translateY(${sheetDragY}px)` : 'translateY(0)',
                transition: sheetDragActiveRef.current ? 'none' : 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            >
              {/* Compact Sticky Top Bar: Grab Handle + Title & Category + Close */}
              <div
                data-testid="menu-note-drag-handle"
                onTouchStart={(e) => e.touches?.[0] && startSheetDrag(e.touches[0].clientY)}
                onTouchMove={(e) => e.touches?.[0] && moveSheetDrag(e.touches[0].clientY)}
                onTouchEnd={endSheetDrag}
                onTouchCancel={endSheetDrag}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flexShrink: 0,
                  paddingBottom: '4px',
                  borderBottom: `1px solid ${borderColor}`,
                  touchAction: 'none'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '4px',
                  borderRadius: '999px',
                  background: isLight ? '#cbd5e1' : '#475569',
                  margin: '0 auto 2px'
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: textPrimary, lineHeight: 1.25 }}>
                      {mProd.name}
                    </h4>
                    {mProd.category && (
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: isLight ? '#f1f5f9' : '#1e293b',
                        color: textSecondary,
                        border: `1px solid ${borderColor}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {mProd.category}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Tutup modal"
                    onClick={() => setMenuNoteModal(null)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '999px',
                      border: `1px solid ${borderColor}`,
                      background: isLight ? '#f8fafc' : '#1e293b',
                      color: textSecondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body: Photo + Full Description + Price Summary + Sections A/B/C */}
              <div
                ref={menuModalBodyRef}
                data-testid="menu-note-scroll-body"
                onTouchStart={(e) => {
                  if (!e.touches?.[0]) return;
                  if ((menuModalBodyRef.current?.scrollTop || 0) <= 0) {
                    startSheetDrag(e.touches[0].clientY);
                  } else {
                    sheetDragActiveRef.current = false;
                  }
                }}
                onTouchMove={(e) => {
                  if (!sheetDragActiveRef.current || !e.touches?.[0]) return;
                  const dy = e.touches[0].clientY - sheetTouchStartYRef.current;
                  if (dy > 0 && (menuModalBodyRef.current?.scrollTop || 0) <= 0) {
                    sheetDragYRef.current = dy;
                    setSheetDragY(dy);
                  } else if (dy < 0) {
                    sheetDragActiveRef.current = false;
                    sheetDragYRef.current = 0;
                    setSheetDragY(0);
                  }
                }}
                onTouchEnd={endSheetDrag}
                onTouchCancel={endSheetDrag}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  paddingRight: '2px',
                  overscrollBehavior: 'contain',
                  overscrollBehaviorY: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y'
                }}
              >
                {/* Menu Photo + Full Description + Price Summary Block */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '146px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: isLight ? '#f1f5f9' : '#1e293b'
                  }}>
                    <img
                      src={mProd.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                      alt={mProd.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {mPromo && pricing.hasDiscount && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        background: '#dc2626',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '0.68rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Flame size={11} strokeWidth={2.5} />
                        <span>{pricing.badgeLabel}</span>
                      </span>
                    )}
                  </div>
                  <p
                    data-testid="menu-modal-description"
                    style={{ margin: '8px 0 6px', fontSize: '0.8rem', color: textSecondary, lineHeight: 1.45 }}
                  >
                    {mProd.description || 'Menu pilihan segar yang dimasak langsung dari dapur.'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.96rem', fontWeight: 900, color: pricing.hasDiscount ? '#dc2626' : textPrimary, fontFamily: 'var(--font-mono)' }}>
                      Rp {unitPriceWithExtras.toLocaleString('id-ID')}
                    </span>
                    {pricing.hasDiscount && (
                      <span style={{ fontSize: '0.74rem', color: textSecondary, textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                        Rp {pricing.basePrice.toLocaleString('id-ID')}
                      </span>
                    )}
                    {modalExtrasUnitTotal > 0 && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                        color: isLight ? '#b45309' : '#fbbf24',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        +Extra Rp {modalExtrasUnitTotal.toLocaleString('id-ID')}
                      </span>
                    )}
                    {mPromo && renderQuotaBadge(mPromo, true)}
                  </div>
                </div>
                {/* Section A: Catatan Umum (Checkbox Grid) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MessageSquare size={14} color="#2563eb" />
                      <span>Pilih Catatan Umum (Opsional)</span>
                    </span>
                    {mQuestions.length > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb' }}>
                        {mQuestions.length} dipilih
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
                    {commonQuestions.map((qLabel, idx) => {
                      const isChecked = mQuestions.some(q => q.toLowerCase() === qLabel.toLowerCase());
                      return (
                        <label
                          key={`${qLabel}-${idx}`}
                          data-testid={`common-q-${idx}`}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCommonQuestion(qLabel);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '7px 9px',
                            borderRadius: '10px',
                            border: `1.5px solid ${isChecked ? '#2563eb' : borderColor}`,
                            background: isChecked
                              ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.18)')
                              : (isLight ? '#f8fafc' : '#1e293b'),
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                          />
                          <span style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '5px',
                            border: `1.5px solid ${isChecked ? '#2563eb' : borderLight}`,
                            background: isChecked ? '#2563eb' : (isLight ? '#ffffff' : '#0f172a'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isChecked && <Check size={11} color="#ffffff" strokeWidth={3} />}
                          </span>
                          <span style={{
                            fontSize: '0.73rem',
                            fontWeight: isChecked ? 800 : 600,
                            color: isChecked ? (isLight ? '#1e40af' : '#93c5fd') : textPrimary,
                            lineHeight: 1.2
                          }}>
                            {qLabel}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Section B: Extra / Topping Berbayar (Stepper - / + Jumlah) */}
                {availableExtras.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Sparkles size={14} color="#d97706" />
                        <span>Tambah Extra / Topping (Opsional)</span>
                      </span>
                      {modalExtrasTotalCount > 0 && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                          {modalExtrasTotalCount} extra • +Rp {modalExtrasUnitTotal.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {availableExtras.map((ex) => {
                        const matched = mExtras.find(sel => String(sel.id) === String(ex.id));
                        const exQty = matched ? Math.max(1, parseInt(matched.qty ?? 1, 10) || 1) : 0;
                        const exLineTotal = (Number(ex.price) || 0) * Math.max(1, exQty);
                        return (
                          <div
                            key={ex.id}
                            data-testid={`extra-option-${ex.id}`}
                            onClick={() => {
                              if (exQty === 0) updateExtraQty(ex, 1);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '8px 10px',
                              borderRadius: '10px',
                              border: `1.5px solid ${exQty > 0 ? '#d97706' : borderColor}`,
                              background: exQty > 0
                                ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.14)')
                                : (isLight ? '#f8fafc' : '#1e293b'),
                              cursor: exQty === 0 ? 'pointer' : 'default',
                              userSelect: 'none'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                              <span style={{
                                fontSize: '0.78rem',
                                fontWeight: exQty > 0 ? 800 : 600,
                                color: textPrimary,
                                lineHeight: 1.25
                              }}>
                                {ex.name}
                              </span>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: exQty > 0 ? '#b45309' : textSecondary,
                                fontFamily: 'var(--font-mono)',
                                marginTop: '1px'
                              }}>
                                {ex.price > 0
                                  ? (exQty > 1
                                      ? `+Rp ${Number(ex.price).toLocaleString('id-ID')} × ${exQty} = +Rp ${exLineTotal.toLocaleString('id-ID')}`
                                      : `+Rp ${Number(ex.price).toLocaleString('id-ID')}`)
                                  : 'Gratis'}
                              </span>
                            </div>

                            {exQty === 0 ? (
                              <button
                                type="button"
                                data-testid={`extra-plus-${ex.id}`}
                                aria-label={`Tambah ${ex.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateExtraQty(ex, 1);
                                }}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #d97706',
                                  background: isLight ? '#fff7ed' : 'rgba(217, 119, 6, 0.18)',
                                  color: isLight ? '#b45309' : '#fbbf24',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flexShrink: 0
                                }}
                              >
                                <Plus size={12} strokeWidth={2.5} />
                                <span>Tambah</span>
                              </button>
                            ) : (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: isLight ? '#ffffff' : '#0f172a',
                                  border: '1px solid #f59e0b',
                                  borderRadius: '8px',
                                  padding: '2px 4px',
                                  flexShrink: 0
                                }}
                              >
                                <button
                                  type="button"
                                  data-testid={`extra-minus-${ex.id}`}
                                  aria-label={`Kurangi ${ex.name}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateExtraQty(ex, -1);
                                  }}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: isLight ? '#fef3c7' : '#334155',
                                    color: isLight ? '#b45309' : '#f8fafc',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Minus size={12} strokeWidth={2.5} />
                                </button>
                                <span
                                  data-testid={`extra-qty-${ex.id}`}
                                  style={{
                                    minWidth: '18px',
                                    textAlign: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 900,
                                    color: textPrimary,
                                    fontFamily: 'var(--font-mono)'
                                  }}
                                >
                                  {exQty}
                                </span>
                                <button
                                  type="button"
                                  data-testid={`extra-plus-${ex.id}`}
                                  aria-label={`Tambah ${ex.name}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateExtraQty(ex, 1);
                                  }}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#d97706',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Plus size={12} strokeWidth={2.5} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section C: Catatan Tambahan Khusus */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: textSecondary }}>
                    Catatan Tambahan Lainnya (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    data-testid="item-note-input"
                    placeholder={isDrink ? 'Contoh: Tanpa sedotan, gelas terpisah...' : 'Contoh: Sambal dipisah, alergi kacang...'}
                    value={mCustomNote}
                    onChange={(e) => setMenuNoteModal((prev) => prev ? { ...prev, customNote: e.target.value } : prev)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: `1.5px solid ${borderLight}`,
                      background: isLight ? '#f8fafc' : '#1e293b',
                      color: textPrimary,
                      fontSize: '0.8rem',
                      fontFamily: 'inherit',
                      resize: 'none',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Quantity Stepper & Sticky Confirm Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '6px', borderTop: `1px solid ${borderColor}`, flexShrink: 0, touchAction: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '12px',
                  padding: '5px 8px'
                }}>
                  <button
                    type="button"
                    data-testid="modal-qty-minus"
                    onClick={() =>
                      setMenuNoteModal((prev) => {
                        if (!prev) return prev;
                        const minAllowed = mMode === 'edit' ? 0 : 1;
                        return { ...prev, qty: Math.max(minAllowed, prev.qty - 1) };
                      })
                    }
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      border: 'none',
                      background: bgCard,
                      color: textPrimary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 900, fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
                    {mQty}
                  </span>
                  <button
                    type="button"
                    data-testid="modal-qty-plus"
                    onClick={() =>
                      setMenuNoteModal((prev) => prev ? { ...prev, qty: Math.min(99, prev.qty + 1) } : prev)
                    }
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="confirm-add-menu-btn"
                  onClick={() => {
                    setCartItemWithNote(mProd, mQty, {
                      selectedQuestions: mQuestions,
                      selectedExtras: mExtras,
                      customNote: mCustomNote
                    });
                    setMenuNoteModal(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: mQty === 0
                      ? '#ef4444'
                      : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)'
                  }}
                >
                  {mQty === 0
                    ? 'Hapus dari Keranjang'
                    : mMode === 'edit'
                      ? `Simpan • Rp ${(unitPriceWithExtras * mQty).toLocaleString('id-ID')}`
                      : `Tambah ke Keranjang • Rp ${(unitPriceWithExtras * mQty).toLocaleString('id-ID')}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── CART REVIEW DRAWER (RINCIAN ITEM, CATATAN PER MENU & PROMO HOLD) ── */}
      {showCartDrawer && cartItems.length > 0 && !activeOrder && (
        <div
          data-testid="cart-review-drawer"
          onClick={() => setShowCartDrawer(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 55,
            background: 'rgba(0, 0, 0, 0.62)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            overscrollBehavior: 'none',
            touchAction: 'none'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '82vh',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              overscrollBehaviorY: 'contain',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              background: bgCard,
              color: textPrimary,
              borderTopLeftRadius: '22px',
              borderTopRightRadius: '22px',
              borderTop: `1px solid ${borderColor}`,
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900 }}>
                  Keranjang Pesanan • {tableInfo.number}
                </h4>
                <span style={{ fontSize: '0.7rem', color: textSecondary }}>
                  Cek ulang jumlah, promo di-hold, &amp; catatan tiap menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCartDrawer(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '999px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#f8fafc' : '#1e293b',
                  color: textSecondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cartItems.map((item) => {
                const itemPromo = getProductPromo(item.product.id);
                const pricing = getPromoPricing(item.product, itemPromo);
                const itemExtras = Array.isArray(item.selectedExtras) ? item.selectedExtras : [];
                const itemExtrasTotal = getItemExtrasUnitTotal(item);
                const unitPriceFinal = (pricing.hasDiscount ? pricing.finalPrice : item.product.price) + itemExtrasTotal;
                const hasCustom = Boolean(item.notes) || itemExtras.length > 0;
                return (
                  <div
                    key={item.product.id}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: `1px solid ${borderColor}`,
                      background: isLight ? '#f8fafc' : '#1e293b',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ fontSize: '0.84rem', display: 'block', color: textPrimary }}>
                          {item.product.name}
                        </strong>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: pricing.hasDiscount ? '#dc2626' : textSecondary, fontFamily: 'var(--font-mono)' }}>
                          Rp {unitPriceFinal.toLocaleString('id-ID')} x {item.qty}
                          {itemExtrasTotal > 0 ? ` (termasuk extra +Rp ${itemExtrasTotal.toLocaleString('id-ID')})` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => decrementCartItem(item.product)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '7px',
                            border: 'none',
                            background: '#2563eb',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <strong style={{ minWidth: '18px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{item.qty}</strong>
                        <button
                          type="button"
                          onClick={() => incrementCartItem(item.product)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '7px',
                            border: 'none',
                            background: '#2563eb',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {itemExtras.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {itemExtras.map((ex) => {
                          const exQty = Math.max(1, Number(ex.qty) || 1);
                          const exLineTotal = (Number(ex.price) || 0) * exQty;
                          return (
                            <span
                              key={ex.id}
                              style={{
                                fontSize: '0.67rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.16)',
                                color: isLight ? '#b45309' : '#fbbf24',
                                border: `1px solid ${isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.3)'}`
                              }}
                            >
                              + {exQty > 1 ? `${exQty}x ` : ''}{ex.name} ({exLineTotal > 0 ? `+Rp ${exLineTotal.toLocaleString('id-ID')}` : 'Gratis'})
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowCartDrawer(false);
                        openMenuNoteModal(item.product, 'edit');
                      }}
                      style={{
                        background: isLight ? '#ffffff' : '#0f172a',
                        border: `1px dashed ${borderColor}`,
                        borderRadius: '8px',
                        padding: '5px 8px',
                        fontSize: '0.7rem',
                        color: hasCustom ? '#1d4ed8' : textSecondary,
                        fontWeight: hasCustom ? 700 : 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <MessageSquare size={12} />
                      <span>
                        {item.notes
                          ? `Catatan: ${item.notes} (Edit)`
                          : (itemExtras.length > 0 ? 'Ubah extra / tambah catatan' : '+ Tambah catatan & extra menu')}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {activeStorePromo && storePromoDiscount === 0 && Number(activeStorePromo.minOrder || 0) > cartSubtotal && (
              <div style={{
                padding: '8px 10px',
                borderRadius: '10px',
                background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.14)',
                border: '1px solid #fde68a',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#b45309'
              }}>
                Voucher {activeStorePromo.code} terpasang • tambah Rp {(activeStorePromo.minOrder - cartSubtotal).toLocaleString('id-ID')} lagi untuk aktifkan diskon.
              </div>
            )}

            {promoDiscount > 0 && (
              <div style={{
                padding: '8px 10px',
                borderRadius: '10px',
                background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)',
                border: '1px solid #86efac',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#15803d'
              }}>
                <span>Total Hemat Promo Di-Hold</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-Rp {promoDiscount.toLocaleString('id-ID')}</span>
              </div>
            )}

            {autoCustomerDiscount > 0 && (
              <div
                data-testid="ordermeja-auto-customer-discount-row"
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid #86efac',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#15803d'
                }}
              >
                <span>Diskon Otomatis Toko</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-Rp {autoCustomerDiscount.toLocaleString('id-ID')}</span>
              </div>
            )}

            <button
              type="button"
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {submittingOrder ? 'Mengirim ke Dapur...' : `Pesan Sekarang ke Dapur • Rp ${cartTotal.toLocaleString('id-ID')}`}
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
          padding: '1rem',
          overscrollBehavior: 'none',
          touchAction: 'none'
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
            gap: '12px',
            overscrollBehavior: 'contain'
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
