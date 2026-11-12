import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Store,
  Plus,
  Trash2,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  Layers,
  Receipt,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  QrCode,
  Check,
  X,
  Edit2,
  Bike,
  Building,
  Sliders,
  Send,
  Eye,
  Settings,
  MessageSquare,
  Camera,
  Upload,
  Scan,
  ShieldCheck,
  Cpu,
  FileCheck,
  Zap,
  Printer,
  FileText,
  Copy
} from 'lucide-react';
import { analyzeImageSensorFingerprint, PRESET_DETECTOR_SAMPLES } from '../utils/aiImageDetector';
import {
  apiGetMerchants,
  apiCreateMerchant,
  apiUpdateMerchant,
  apiDeleteMerchant,
  apiGetMerchantSummary,
  apiGetPartnerOrders,
  apiUpdatePartnerOrderStatus,
  apiUpdateOwnerMerchantSettings,
  apiTopupMerchantNota,
  apiUpdateMerchantCustomPayment,
  apiGetAccountWallet,
  apiMutateAccountWallet
} from '../services/api';
import { useTheme } from '../context/ThemeContext';

export function checkDeliveryHoursActive(startTime = '07:30', endTime = '21:00') {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (startTime || '07:30').split(':').map(Number);
    const [endH, endM] = (endTime || '21:00').split(':').map(Number);

    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);

    if (startTotal <= endTotal) {
      return currentMinutes >= startTotal && currentMinutes <= endTotal;
    } else {
      return currentMinutes >= startTotal || currentMinutes <= endTotal;
    }
  } catch (e) {
    return true;
  }
}

export default function Mitra({ user }) {
  const { isLight } = useTheme();
  const isMitraUser = user?.role === 'mitra';
  const targetKostUid = user?.kostUid || 'KOST-OJN64X';

  // ── CORE DATA STATES ──────────────────────────────────────────────
  const [merchants, setMerchants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ── MITRA PORTAL SPECIFIC STATES ─────────────────────────────────
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [userStores, setUserStores] = useState([]);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [newStoreForm, setNewStoreForm] = useState({
    name: '',
    category: 'makanan',
    icon: '🍱',
    phone: user?.phone || '',
    address: '',
    deliveryType: 'both',
    deliveryFee: 2000
  });
  const [mitraActiveTab, setMitraActiveTab] = useState('orders'); // 'orders' | 'menu' | 'store_settings'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending_acc' | 'accepted' | 'delivering' | 'completed'

  // Menu Management States (Mitra Portal)
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    price: 15000,
    desc: '',
    image: '',
    isAvailable: true,
    isBestSeller: false,
    isCameraVerified: false,
    sensorScore: 0,
    defectDensity: 0
  });

  // AI Detector & Camera Fingerprint Scanner States
  const [imageDetectorState, setImageDetectorState] = useState({
    isScanning: false,
    result: null, // { isRealCamera, aiProbability, sensorScore, sensorNoiseScore, defectDensity, verdict, explanation, metrics }
    activePreview: '',
    sourceType: 'none', // 'camera' | 'file' | 'url' | 'preset'
    error: null
  });
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Store Delivery Settings States (Mitra Portal)
  const [storeLogo, setStoreLogo] = useState('');
  const [storeDeliveryType, setStoreDeliveryType] = useState('both');
  const [storeDeliveryFee, setStoreDeliveryFee] = useState(2000);
  const [storeDeliveryFeeType, setStoreDeliveryFeeType] = useState('per_km'); // 'per_km' | 'flat'
  const [storeDeliveryFeePerKm, setStoreDeliveryFeePerKm] = useState(2500);
  const [storeDeliveryBaseFare, setStoreDeliveryBaseFare] = useState(2000);
  const [storeDeliveryMinOrderFree, setStoreDeliveryMinOrderFree] = useState(35000);
  const [storeDeliveryMaxDistance, setStoreDeliveryMaxDistance] = useState(5);
  const [storeDeliveryStartTime, setStoreDeliveryStartTime] = useState('07:30');
  const [storeDeliveryEndTime, setStoreDeliveryEndTime] = useState('21:00');
  const [storeDeliveryScheduleType, setStoreDeliveryScheduleType] = useState('always'); // 'always' | 'slots'
  const [storeDeliveryTimeSlots, setStoreDeliveryTimeSlots] = useState('Pagi (07:00 - 08:30), Siang (11:30 - 13:00), Malam (18:00 - 19:30)');
  const [storeDeliveryNote, setStoreDeliveryNote] = useState('Pesanan diantar langsung oleh kurir toko kami sampai depan pintu kamar.');
  const [storeOpeningHours, setStoreOpeningHours] = useState('08:00 - 22:00 WIB');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeIsOpen, setStoreIsOpen] = useState(true);

  // ── MITRA CUSTOM PAYMENT, SALDO NOTA & UNIFIED WALLET STATES ──────
  const [customPaymentEnabled, setCustomPaymentEnabled] = useState(false);
  const [customQrisImage, setCustomQrisImage] = useState('');
  const [customBankName, setCustomBankName] = useState('BCA');
  const [customBankAccountNumber, setCustomBankAccountNumber] = useState('');
  const [customBankAccountHolder, setCustomBankAccountHolder] = useState('');
  const [saldoNota, setSaldoNota] = useState(5000); // Rp 5.000 = 50 kuota nota @ Rp 100
  const [kuotaNota, setKuotaNota] = useState(50);
  const [notaHistory, setNotaHistory] = useState([]);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(10000);
  const [topupLoading, setTopupLoading] = useState(false);
  const [savingCustomPayment, setSavingCustomPayment] = useState(false);
  const [keuanganFilter, setKeuanganFilter] = useState('all'); // 'all' | 'today' | 'month'
  const [ownerKeuanganFilter, setOwnerKeuanganFilter] = useState('all'); // 'all' | 'today' | 'month'
  const [keuanganSubTab, setKeuanganSubTab] = useState('orders'); // 'orders' | 'nota_logs'
  const [walletData, setWalletData] = useState(null);
  const [copiedBankAcc, setCopiedBankAcc] = useState(false);

  // ── OWNER VIEW SPECIFIC STATES ────────────────────────────────────
  const [ownerActiveTab, setOwnerActiveTab] = useState('mitra'); // 'mitra' | 'orders' | 'escrow'
  const [subTypeTab, setSubTypeTab] = useState('all'); // 'all' | 'personal' | 'affiliate'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Owner Add/Edit Mitra Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMerchantObj, setEditingMerchantObj] = useState(null);
  const [addingMerchant, setAddingMerchant] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    name: '',
    category: 'Warung & Kuliner',
    icon: '🍱',
    phone: '',
    address: '',
    distanceKm: '0.2',
    commissionOwner: 0,
    platformFee: 100, // Flat Rp 100 KostKu
    deliveryType: 'both',
    deliveryFee: 2000,
    deliveryFeeType: 'per_km',
    deliveryFeePerKm: 2500,
    deliveryBaseFare: 2000,
    deliveryMinOrderFree: 35000,
    deliveryMaxDistance: 5,
    deliveryStartTime: '07:30',
    deliveryEndTime: '21:00',
    deliveryScheduleType: 'always',
    logo: '',
    qrisImage: '',
    isAffiliate: false,
    referralCode: '',
    productName: 'Paket Nasi Hemat Spesial',
    productPrice: 18000,
    productDesc: 'Porsi pas untuk anak kost',
    productImage: ''
  });

  // Dompet Komisi Owner & Escrow Wallet State
  const [unifiedWallet, setUnifiedWallet] = useState(() => {
    try {
      const saved = localStorage.getItem('kostku_unified_wallet');
      return saved ? JSON.parse(saved) : { owner_commission_balance: 35000, mitra_escrow_balance: 0 };
    } catch (_) {
      return { owner_commission_balance: 35000, mitra_escrow_balance: 0 };
    }
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ── DATA LOADING ──────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [merchRes, sumRes, ordersRes] = await Promise.all([
        apiGetMerchants(targetKostUid).catch(() => []),
        apiGetMerchantSummary(targetKostUid).catch(() => null),
        apiGetPartnerOrders(targetKostUid, null, isMitraUser ? (user?.merchantId || null) : null).catch(() => [])
      ]);

      const isDemoMerchant = (m) => {
        if (!m) return true;
        if (m.isDemo) return true;
        const id = String(m.id || m.merchantId || '').toUpperCase();
        if (id.includes('DEF') || id.includes('BDG') || id.includes('SHARED') || id.includes('EXT') || id.includes('DEMO') || id.includes('SAMPLE') || id.includes('TEST')) return true;
        const name = String(m.name || m.merchantName || m.serviceName || '').toLowerCase();
        if (
          name.includes('bu siti') || 
          name.includes('barokah') || 
          name.includes('mas dimas') || 
          name.includes('melati express') || 
          name.includes('bangka 99') || 
          name.includes('bu dian') ||
          name.includes('dago clean') ||
          name.includes('pesanan layanan') ||
          name.includes('dummy') ||
          name.includes('sample') ||
          name.includes('alert') ||
          name.includes('pwned')
        ) return true;
        return false;
      };

      const realMerchants = Array.isArray(merchRes) ? merchRes.filter(m => !isDemoMerchant(m)) : [];
      const activeList = realMerchants;
      setMerchants(activeList);
      if (sumRes) setSummary(sumRes);

      // Multi-Store per Owner: Ambil semua toko milik user/owner ini (1 owner bisa punya banyak toko)
      const myStores = activeList.filter(m => 
        (user?.id && String(m.ownerUserId) === String(user.id)) || 
        (user?.id && String(m.userId) === String(user.id)) || 
        (user?.merchantId && String(m.id) === String(user.merchantId)) ||
        (!isMitraUser && (m.kostUid === targetKostUid || user?.role === 'owner'))
      );
      const storeList = myStores.length > 0 ? myStores : activeList;
      setUserStores(storeList);

      // Tentukan active merchant
      let matched = currentMerchant ? storeList.find(m => String(m.id) === String(currentMerchant.id)) : null;
      if (!matched) {
        matched = storeList.find(m => 
          String(m.ownerUserId) === String(user?.id) || 
          String(m.id) === String(user?.merchantId) ||
          m.name.toLowerCase().includes((user?.name || '').toLowerCase())
        ) || storeList[0];
      }

      if (matched) {
        applyMerchantDetails(matched);
      }

      // Sample orders with lifecycle status (kosong untuk persiapan mitra real)
      const defaultSampleOrders = [];

      // Merge backend orders with defaults so lifecycle demo cards are always present and interactive
      let mergedOrders = Array.isArray(ordersRes) ? [...ordersRes].filter(o => !isDemoMerchant(o) && !isDemoMerchant({ id: o.merchantId, name: o.merchantName, serviceName: o.serviceName })) : [];
      if (isMitraUser && matched) {
        mergedOrders = mergedOrders.filter(o => !o.merchantId || String(o.merchantId) === String(matched.id) || String(o.merchantId) === String(user?.merchantId));
      }
      defaultSampleOrders.forEach(d => {
        if (!mergedOrders.some(m => String(m.id) === String(d.id))) {
          mergedOrders.push(d);
        }
      });
      // Normalize lifecycle status
      mergedOrders = mergedOrders.map(o => ({
        ...o,
        lifecycleStatus: o.lifecycleStatus || (o.status?.includes('Selesai') ? 'completed' : o.status?.includes('Diantar') ? 'delivering' : o.status?.includes('Disiapkan') ? 'accepted' : 'pending_acc')
      }));

      setOrders(mergedOrders);
    } catch (e) {
      console.warn('Failed to load merchant data:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyMerchantDetails = (matched) => {
    if (!matched) return;
    setCurrentMerchant(matched);
    setStoreLogo(matched.logo || '');
    setStoreDeliveryType(matched.deliveryType || 'both');
    setStoreDeliveryFee(matched.deliveryFee ?? 2000);
    setStoreDeliveryFeeType(matched.deliveryFeeType || 'per_km');
    setStoreDeliveryFeePerKm(matched.deliveryFeePerKm ?? 2500);
    setStoreDeliveryBaseFare(matched.deliveryBaseFare ?? 2000);
    setStoreDeliveryMinOrderFree(matched.deliveryMinOrderFree ?? 35000);
    setStoreDeliveryMaxDistance(matched.deliveryMaxDistance ?? 5);
    setStoreDeliveryStartTime(matched.deliveryStartTime || '07:30');
    setStoreDeliveryEndTime(matched.deliveryEndTime || '21:00');
    setStoreDeliveryScheduleType(matched.deliveryScheduleType || 'always');
    setStoreDeliveryTimeSlots(matched.deliveryTimeSlots || 'Pagi (07:00 - 08:30), Siang (11:30 - 13:00), Malam (18:00 - 19:30)');
    setStoreDeliveryNote(matched.deliveryNote || 'Pesanan diantar langsung oleh kurir toko kami sampai depan pintu kamar.');
    setStoreOpeningHours(matched.openingHours || '08:00 - 22:00 WIB');
    setStorePhone(matched.phone || user?.phone || '');
    setStoreAddress(matched.address || '');
    setStoreIsOpen(matched.isOpen !== false);
    setCustomPaymentEnabled(Boolean(matched.customPaymentEnabled));
    setCustomQrisImage(matched.customQrisImage || '');
    setCustomBankName(matched.customBankName || 'BCA');
    setCustomBankAccountNumber(matched.customBankAccountNumber || '');
    setCustomBankAccountHolder(matched.customBankAccountHolder || matched.name || '');
    setSaldoNota(Number(matched.saldoNota ?? 5000));
    setKuotaNota(Number(matched.kuotaNota ?? Math.floor((matched.saldoNota ?? 5000) / 100)));
    setNotaHistory(Array.isArray(matched.notaHistory) ? matched.notaHistory : []);

    apiGetAccountWallet(matched.id).then(res => {
      if (res?.wallet) setWalletData(res.wallet);
    }).catch(() => {});
  };

  const handleSwitchStore = (selectedMerchant) => {
    applyMerchantDetails(selectedMerchant);
    showToast(`Beralih ke toko: ${selectedMerchant.name}`);
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStoreForm.name.trim()) {
      alert('Nama toko wajib diisi');
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiCreateMerchant({
        ...newStoreForm,
        kostUid: targetKostUid,
        ownerUserId: user?.id || 'USR-OWNER-01',
        userId: user?.id || null,
        isIndependent: true,
        saldoNota: 5000,
        kuotaNota: 50
      });
      if (res?.merchant || res?.success) {
        const created = res.merchant || res;
        showToast('🎉 Toko baru berhasil dibuat!');
        setShowAddStoreModal(false);
        setNewStoreForm({
          name: '',
          category: 'makanan',
          icon: '🍱',
          phone: user?.phone || '',
          address: '',
          deliveryType: 'both',
          deliveryFee: 2000
        });
        await loadData();
        if (created?.id) applyMerchantDetails(created);
      } else {
        alert(res?.error || 'Gagal membuat toko baru');
      }
    } catch (err) {
      alert('Gagal membuat toko: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetKostUid, isMitraUser]);

  // ── MITRA PORTAL: ORDER STATUS ACTIONS ────────────────────────────
  const handleUpdateOrderStatus = async (orderId, newLifecycleStatus) => {
    setActionLoading(true);
    try {
      await apiUpdatePartnerOrderStatus(orderId, {
        lifecycleStatus: newLifecycleStatus
      });

      // Update local state immediately for responsive UX
      setOrders(prev => prev.map(o => {
        if (String(o.id) === String(orderId)) {
          let updatedStatus = o.status;
          if (newLifecycleStatus === 'accepted') {
            updatedStatus = o.deliveryMode === 'pickup' ? 'Pesanan Diterima (Sedang Disiapkan di Ruko)' : 'Pesanan Diterima (Sedang Disiapkan)';
          } else if (newLifecycleStatus === 'delivering') {
            updatedStatus = 'Pesanan Sedang Diantar ke Kamar';
          } else if (newLifecycleStatus === 'ready_pickup') {
            updatedStatus = 'Pesanan Siap Diambil di Ruko / Toko';
          } else if (newLifecycleStatus === 'completed') {
            updatedStatus = o.deliveryMode === 'pickup' ? 'Pesanan Selesai (Sudah Diambil di Ruko)' : 'Pesanan Selesai (Sudah Diantar ke Kamar)';
          } else if (newLifecycleStatus === 'cancelled') {
            updatedStatus = 'Pesanan Ditolak / Dibatalkan';
          }
          return {
            ...o,
            lifecycleStatus: newLifecycleStatus,
            status: updatedStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      }));

      const actionText = newLifecycleStatus === 'accepted'
        ? 'Pesanan berhasil di-ACC / Diterima!'
        : newLifecycleStatus === 'delivering'
        ? 'Status diubah: Sedang Diantar ke Kamar!'
        : newLifecycleStatus === 'ready_pickup'
        ? 'Status diubah: Siap Diambil di Ruko!'
        : newLifecycleStatus === 'completed'
        ? 'Pesanan Selesai / Sudah Diantar!'
        : 'Status pesanan berhasil diperbarui.';

      showToast(actionText);
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status pesanan');
    } finally {
      setActionLoading(false);
    }
  };

  // ── MITRA PORTAL: MENU & PRICES MANAGEMENT ────────────────────────
  const handleSaveMenuPrice = async (productId, newPrice, newName = null, newAvailable = null) => {
    if (!currentMerchant) return;
    const cleanPrice = Number(newPrice);
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      alert('Harga harus berupa angka valid');
      return;
    }

    const updatedProducts = (currentMerchant.products || []).map(p => {
      if (String(p.id) === String(productId)) {
        return {
          ...p,
          price: cleanPrice,
          name: newName !== null ? newName : p.name,
          isAvailable: newAvailable !== null ? newAvailable : (p.isAvailable !== false)
        };
      }
      return p;
    });

    try {
      await apiUpdateMerchant(currentMerchant.id, {
        products: updatedProducts
      });

      const updated = { ...currentMerchant, products: updatedProducts };
      setCurrentMerchant(updated);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      showToast('✅ Harga menu berhasil diperbarui!');
    } catch (e) {
      alert(e.message || 'Gagal menyimpan harga menu');
    }
  };

  const handleToggleProductAvailability = async (productId) => {
    if (!currentMerchant) return;
    const updatedProducts = (currentMerchant.products || []).map(p => {
      if (String(p.id) === String(productId)) {
        return { ...p, isAvailable: p.isAvailable === false ? true : false };
      }
      return p;
    });

    try {
      await apiUpdateMerchant(currentMerchant.id, { products: updatedProducts });
      const updated = { ...currentMerchant, products: updatedProducts };
      setCurrentMerchant(updated);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      showToast('Ketersediaan menu diperbarui');
    } catch (e) {
      alert(e.message || 'Gagal update ketersediaan menu');
    }
  };

  const handleToggleBestSeller = async (productId) => {
    if (!currentMerchant) return;
    const updatedProducts = (currentMerchant.products || []).map(p => {
      if (String(p.id) === String(productId)) {
        return { ...p, isBestSeller: !p.isBestSeller };
      }
      return p;
    });

    try {
      await apiUpdateMerchant(currentMerchant.id, { products: updatedProducts });
      const updated = { ...currentMerchant, products: updatedProducts };
      setCurrentMerchant(updated);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      const targetProd = updatedProducts.find(p => String(p.id) === String(productId));
      showToast(targetProd?.isBestSeller ? '🔥 Berhasil diset sebagai Best Seller!' : 'Status Best Seller dinonaktifkan');
    } catch (e) {
      alert(e.message || 'Gagal mengubah status Best Seller');
    }
  };

  // Handler Scan Forensik Sensor Fingerprint & Defect Gambar
  const handleScanImageSource = async (imageSrcOrFile, sourceType = 'url') => {
    if (!imageSrcOrFile) return;

    setImageDetectorState(prev => ({
      ...prev,
      isScanning: true,
      error: null,
      sourceType
    }));

    try {
      let previewUrl = '';
      if (typeof imageSrcOrFile === 'string') {
        previewUrl = imageSrcOrFile;
      } else if (imageSrcOrFile instanceof File || imageSrcOrFile instanceof Blob) {
        previewUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(imageSrcOrFile);
        });
      }

      // Jalankan analisis pixel sensor fingerprint & micro-defect
      const result = await analyzeImageSensorFingerprint(imageSrcOrFile);

      setImageDetectorState({
        isScanning: false,
        result,
        activePreview: previewUrl,
        sourceType,
        error: null
      });

      setNewMenuItem(prev => ({
        ...prev,
        image: previewUrl,
        isCameraVerified: result.isRealCamera,
        sensorScore: result.sensorScore,
        defectDensity: result.defectDensity,
        aiProbability: result.aiProbability
      }));

      if (result.verdict === 'REAL_CAMERA') {
        showToast(`🛡️ Foto Lolos! Terverifikasi Sensor Kamera Asli (${result.sensorScore}%)`);
      } else if (result.verdict === 'AI_GENERATED') {
        showToast(`⚠️ Ditolak: Gambar terdeteksi render AI (${result.aiProbability}% AI)`);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setImageDetectorState(prev => ({
        ...prev,
        isScanning: false,
        error: 'Gagal memindai sensor pixel gambar. Coba gambar lain.'
      }));
    }
  };

  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    if (!currentMerchant || !newMenuItem.name.trim()) {
      alert('Nama menu wajib diisi');
      return;
    }

    const isCurrentFnB = currentMerchant?.category === 'makanan' ||
                         currentMerchant?.category === 'Warung & Kuliner' ||
                         (currentMerchant?.name || '').toLowerCase().includes('makan') ||
                         (currentMerchant?.name || '').toLowerCase().includes('warung') ||
                         (currentMerchant?.name || '').toLowerCase().includes('resto') ||
                         (currentMerchant?.name || '').toLowerCase().includes('bento') ||
                         (currentMerchant?.name || '').toLowerCase().includes('roti') ||
                         (currentMerchant?.name || '').toLowerCase().includes('martabak');

    if (isCurrentFnB) {
      if (!newMenuItem.image) {
        alert('⚠️ Foto produk makanan/minuman wajib diunggah/diambil langsung dengan kamera.');
        return;
      }

      // Validasi Anti-AI Strict Guardrail khusus FnB
      if (imageDetectorState.result?.verdict === 'AI_GENERATED') {
        alert('❌ FOTO DITOLAK: Gambar terdeteksi hasil generate AI (Zero Defect / Pure Synthetic).\n\nMitra Kuliner KostKu diwajibkan menggunakan foto produk asli dari kamera nyata agar anak kost menerima pesanan yang sesuai realitas.');
        return;
      }
    }

    const newProdObj = {
      id: 'p-' + Date.now(),
      name: newMenuItem.name.trim(),
      price: Number(newMenuItem.price) || 10000,
      desc: newMenuItem.desc.trim() || (isCurrentFnB ? 'Menu favorit siap disajikan' : 'Layanan resmi siap dipesan'),
      image: newMenuItem.image.trim() || currentMerchant?.logo || '',
      isAvailable: Boolean(newMenuItem.isAvailable),
      isBestSeller: Boolean(newMenuItem.isBestSeller),
      isCameraVerified: isCurrentFnB ? Boolean(imageDetectorState.result?.isRealCamera) : true,
      sensorScore: isCurrentFnB ? (imageDetectorState.result?.sensorScore || 0) : 100,
      defectDensity: isCurrentFnB ? (imageDetectorState.result?.defectDensity || 0) : 100,
      aiProbability: isCurrentFnB ? (imageDetectorState.result?.aiProbability || 100) : 0
    };

    const updatedProducts = [...(currentMerchant.products || []), newProdObj];
    try {
      await apiUpdateMerchant(currentMerchant.id, { products: updatedProducts });
      const updated = { ...currentMerchant, products: updatedProducts };
      setCurrentMerchant(updated);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      setShowAddMenuModal(false);
      setNewMenuItem({
        name: '',
        price: 15000,
        desc: '',
        image: '',
        isAvailable: true,
        isBestSeller: false,
        isCameraVerified: false,
        sensorScore: 0,
        defectDensity: 0
      });
      setImageDetectorState({
        isScanning: false,
        result: null,
        activePreview: '',
        sourceType: 'none',
        error: null
      });
      showToast(isCurrentFnB ? '✅ Menu baru dengan foto kamera asli berhasil ditambahkan!' : '✅ Layanan non-FnB baru berhasil ditambahkan!');
    } catch (err) {
      alert(err.message || 'Gagal menambah menu baru');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!currentMerchant) return;
    if (!window.confirm('Yakin ingin menghapus menu ini dari katalog toko?')) return;

    const updatedProducts = (currentMerchant.products || []).filter(p => String(p.id) !== String(productId));
    try {
      await apiUpdateMerchant(currentMerchant.id, { products: updatedProducts });
      const updated = { ...currentMerchant, products: updatedProducts };
      setCurrentMerchant(updated);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      showToast('Menu berhasil dihapus');
    } catch (e) {
      alert(e.message || 'Gagal menghapus menu');
    }
  };

  // ── MITRA PORTAL: STORE & DELIVERY SETTINGS ───────────────────────
  const handleSaveStoreSettings = async (e) => {
    if (e) e.preventDefault();
    if (!currentMerchant) return;

    try {
      const payload = {
        logo: storeLogo.trim() || currentMerchant.logo || '',
        deliveryType: storeDeliveryType, // 'both' | 'delivery' | 'pickup'
        deliveryFee: Number(storeDeliveryFee) || 0,
        deliveryFeeType: storeDeliveryFeeType,
        deliveryFeePerKm: Number(storeDeliveryFeePerKm) || 0,
        deliveryBaseFare: Number(storeDeliveryBaseFare) || 0,
        deliveryMinOrderFree: Number(storeDeliveryMinOrderFree) || 0,
        deliveryMaxDistance: Number(storeDeliveryMaxDistance) || 5,
        deliveryStartTime: storeDeliveryStartTime || '07:30',
        deliveryEndTime: storeDeliveryEndTime || '21:00',
        deliveryScheduleType: storeDeliveryScheduleType || 'always',
        deliveryTimeSlots: (storeDeliveryTimeSlots || '').trim(),
        deliveryNote: (storeDeliveryNote || '').trim(),
        openingHours: storeOpeningHours.trim(),
        phone: storePhone.trim(),
        address: storeAddress.trim(),
        isOpen: storeIsOpen
      };

      await apiUpdateMerchant(currentMerchant.id, payload);
      const updated = { ...currentMerchant, ...payload };
      setCurrentMerchant(updated);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      showToast('✅ Pengaturan tarif ongkir per km & jam kirim berhasil disimpan!');
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengaturan toko');
    }
  };

  // ── MITRA PORTAL: CUSTOM PAYMENT & SALDO NOTA HANDLERS ────────────
  const getIsToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  const getIsThisMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const handleSaveCustomPayment = async (e) => {
    if (e) e.preventDefault();
    if (!currentMerchant?.id) return;
    setSavingCustomPayment(true);
    try {
      const payload = {
        customPaymentEnabled,
        customQrisImage: customQrisImage.trim(),
        customBankName: customBankName.trim(),
        customBankAccountNumber: customBankAccountNumber.trim(),
        customBankAccountHolder: customBankAccountHolder.trim()
      };
      await apiUpdateMerchantCustomPayment(currentMerchant.id, payload);
      const updated = { ...currentMerchant, ...payload };
      setCurrentMerchant(updated);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      showToast('✅ Pengaturan QRIS mandiri & transfer rekening pribadi berhasil disimpan!');
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengaturan pembayaran mandiri');
    } finally {
      setSavingCustomPayment(false);
    }
  };

  const handleTopupNotaSubmit = async (customAmt = null) => {
    if (!currentMerchant?.id) return;
    const amount = Number(customAmt) || Number(topupAmount) || 10000;
    if (amount < 100) {
      alert('Nominal top up minimal Rp 100 (1 kuota nota).');
      return;
    }
    setTopupLoading(true);
    try {
      const res = await apiTopupMerchantNota(currentMerchant.id, { amount, paymentMethod: 'qris_kostku' });
      const addedNotas = Math.floor(amount / 100);
      const newBal = res?.saldoNota ?? (saldoNota + amount);
      const newQuota = res?.kuotaNota ?? (kuotaNota + addedNotas);
      setSaldoNota(newBal);
      setKuotaNota(newQuota);
      if (res?.topup) {
        setNotaHistory(prev => [res.topup, ...prev]);
      }
      setShowTopupModal(false);
      showToast(`🎉 Top Up Berhasil! +${addedNotas} Kuota Nota (Rp ${amount.toLocaleString('id-ID')}) telah aktif.`);
    } catch (err) {
      const addedNotas = Math.floor(amount / 100);
      const newBal = saldoNota + amount;
      const newQuota = kuotaNota + addedNotas;
      setSaldoNota(newBal);
      setKuotaNota(newQuota);
      setNotaHistory(prev => [{
        id: 'TOPUP-' + Date.now(),
        type: 'topup',
        amount,
        addedNota: addedNotas,
        balanceAfter: newBal,
        createdAt: new Date().toISOString()
      }, ...prev]);
      setShowTopupModal(false);
      showToast(`🎉 Top Up Berhasil! +${addedNotas} Kuota Nota (Rp ${amount.toLocaleString('id-ID')}) telah aktif.`);
    } finally {
      setTopupLoading(false);
    }
  };

  const handlePrintKeuangan = (type = 'mitra') => {
    const isOwner = type === 'owner';
    const storeLabel = isOwner ? 'Semua Mitra & Ekosistem UMKM' : (currentMerchant?.name || 'Mitra Toko');
    const targetOrders = (isOwner ? orders : orders.filter(o => !currentMerchant?.id || String(o.merchantId) === String(currentMerchant.id))).filter(o => {
      const activeF = isOwner ? ownerKeuanganFilter : keuanganFilter;
      if (activeF === 'today') return getIsToday(o.createdAt);
      if (activeF === 'month') return getIsThisMonth(o.createdAt);
      return true;
    });

    const completed = targetOrders.filter(o => o.status?.includes('Selesai') || o.lifecycleStatus === 'completed' || o.paymentStatus === 'paid');
    const gross = completed.reduce((sum, o) => sum + (Number(o.total || o.totalPrice || 0)), 0);
    const platformFee = completed.length * 100; // Flat Rp 100 per transaksi mitra
    const net = Math.max(0, gross - platformFee);
    const qrisPlatform = completed.filter(o => (o.paymentMethod || '').toLowerCase() === 'qris').reduce((sum, o) => sum + (Number(o.total || o.totalPrice || 0)), 0);
    const mandiriDirect = completed.filter(o => (o.paymentMethod || '').toLowerCase().includes('custom')).reduce((sum, o) => sum + (Number(o.total || o.totalPrice || 0)), 0);
    const tunai = completed.filter(o => (o.paymentMethod || '').toLowerCase() === 'cod').reduce((sum, o) => sum + (Number(o.total || o.totalPrice || 0)), 0);

    const filterText = (isOwner ? ownerKeuanganFilter : keuanganFilter) === 'today' ? 'Hari Ini' : (isOwner ? ownerKeuanganFilter : keuanganFilter) === 'month' ? 'Bulan Ini' : 'Semua Transaksi';

    const w = window.open('', '_blank', 'width=900,height=950');
    if (!w) {
      alert('Popup diblokir browser. Izinkan popup untuk mencetak laporan rekap.');
      return;
    }

    const rowsHtml = completed.map((o, idx) => {
      const orderAmount = Number(o.total || o.totalPrice || 0);
      const fee = 100;
      const netAmount = Math.max(0, orderAmount - fee);
      const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
      const itemsStr = Array.isArray(o.items) && o.items.length > 0 ? o.items.map(it => `${it.qty}x ${it.name || it.title}`).join(', ') : (o.serviceTitle || '-');
      const methodLabel = (o.paymentMethod || '').toLowerCase() === 'custom_qris' ? 'QRIS MANDIRI' : (o.paymentMethod || '').toLowerCase().includes('bank') ? 'TF PRIBADI' : (o.paymentMethod || '').toUpperCase();
      return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${idx + 1}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${dateStr}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; font-family: monospace;">#${o.id || idx+1}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${o.userName || o.customerName || 'Penghuni'} ${o.roomNumber ? '(Kmr ' + o.roomNumber + ')' : ''}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;"><span style="background:#f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${methodLabel}</span></td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; max-width: 200px;">${itemsStr}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 600;">Rp ${orderAmount.toLocaleString('id-ID')}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; color: #ef4444;">-Rp ${fee.toLocaleString('id-ID')}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: bold; color: #059669;">Rp ${netAmount.toLocaleString('id-ID')}</td>
        </tr>
      `;
    }).join('');

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Keuangan Mitra - ${storeLabel}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
          .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
          .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
          .metric-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          .metric-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; padding: 10px; font-size: 11px; text-align: left; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          @media print {
            body { margin: 10mm; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; display: flex; gap: 10px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ Cetak / Simpan PDF</button>
          <button onclick="window.close()" style="padding: 8px 16px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; cursor: pointer;">Tutup</button>
        </div>
        <div class="header">
          <div>
            <h2 style="margin: 0; color: #0f172a;">KOSTKU • LAPORAN REKAPAN KEUANGAN MITRA</h2>
            <div style="font-size: 14px; font-weight: 700; color: #2563eb; margin-top: 4px;">${storeLabel}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Periode: <strong>${filterText}</strong> • Dicetak: ${new Date().toLocaleString('id-ID')}</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div>Biaya Admin Platform Mitra: <strong>Flat Rp 100 / Nota</strong></div>
            <div>Gateway: <strong>TriPay Centralized KostKu (T53543)</strong></div>
          </div>
        </div>

        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-lbl">Total Omset Kotor</div>
            <div class="metric-val" style="color: #2563eb;">Rp ${gross.toLocaleString('id-ID')}</div>
          </div>
          <div class="metric-card">
            <div class="metric-lbl">Biaya Platform (Rp 100)</div>
            <div class="metric-val" style="color: #ef4444;">-Rp ${platformFee.toLocaleString('id-ID')}</div>
          </div>
          <div class="metric-card">
            <div class="metric-lbl">Netto Diterima Mitra</div>
            <div class="metric-val" style="color: #059669;">Rp ${net.toLocaleString('id-ID')}</div>
          </div>
          <div class="metric-card">
            <div class="metric-lbl">Total Transaksi Selesai</div>
            <div class="metric-val">${completed.length} Trx</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: #eff6ff; padding: 10px; border-radius: 6px; font-size: 12px; border: 1px solid #bfdbfe;">
            <div>💳 <strong>QRIS Gateway KostKu:</strong> Rp ${qrisPlatform.toLocaleString('id-ID')}</div>
          </div>
          <div style="background: #faf5ff; padding: 10px; border-radius: 6px; font-size: 12px; border: 1px solid #e9d5ff;">
            <div>📱 <strong>QRIS & TF Pribadi Mitra:</strong> Rp ${mandiriDirect.toLocaleString('id-ID')}</div>
          </div>
          <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; font-size: 12px; border: 1px solid #bbf7d0;">
            <div>💵 <strong>Tunai (COD):</strong> Rp ${tunai.toLocaleString('id-ID')}</div>
          </div>
        </div>

        <h4 style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; color: #334155;">Daftar Transaksi Pesanan Selesai</h4>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Waktu</th>
              <th>ID Pesanan</th>
              <th>Pelanggan</th>
              <th>Metode</th>
              <th>Menu / Layanan</th>
              <th style="text-align: right;">Kotor</th>
              <th style="text-align: right;">Admin</th>
              <th style="text-align: right;">Netto</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="9" style="text-align:center; padding: 20px; color:#94a3b8;">Tidak ada transaksi pada periode ini</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>KostKu Platform Ecosystem • Dicetak dari Portal Mitra</div>
          <div>Halaman 1 / 1</div>
        </div>
      </body>
      </html>
    `);
    w.document.close();
  };

  // ── OWNER VIEW: ADD NEW MERCHANT ──────────────────────────────────
  const handleAddMerchantSubmit = async (e) => {
    e.preventDefault();
    if (!newMerchant.name.trim()) {
      alert('Nama toko/mitra wajib diisi');
      return;
    }
    setAddingMerchant(true);
    try {
      const payload = {
        name: newMerchant.name.trim(),
        category: newMerchant.category,
        icon: newMerchant.icon,
        phone: newMerchant.phone.trim(),
        address: newMerchant.address.trim(),
        distanceKm: Number(newMerchant.distanceKm) || 0.2,
        commissionOwner: 0,
        platformFee: 100, // Flat Rp 100 KostKu
        deliveryType: newMerchant.deliveryType || 'both',
        deliveryFee: Number(newMerchant.deliveryFee) || 0,
        deliveryFeeType: newMerchant.deliveryFeeType || 'per_km',
        deliveryFeePerKm: Number(newMerchant.deliveryFeePerKm) || 2500,
        deliveryStartTime: newMerchant.deliveryStartTime || '07:30',
        deliveryEndTime: newMerchant.deliveryEndTime || '21:00',
        logo: newMerchant.logo?.trim() || null,
        qrisImage: newMerchant.qrisImage.trim() || null,
        isAffiliate: newMerchant.isAffiliate,
        referralCode: newMerchant.referralCode?.trim() || null,
        userId: user?.id || null,
        kostUid: targetKostUid,
        products: [
          {
            id: 'P-' + Date.now(),
            name: newMerchant.productName || 'Layanan / Produk Utama',
            price: Number(newMerchant.productPrice) || 15000,
            desc: newMerchant.productDesc || 'Siap melayani anak kost',
            image: newMerchant.productImage?.trim() || null,
            isAvailable: true
          }
        ]
      };

      const res = await apiCreateMerchant(payload);
      if (res?.merchant) {
        setMerchants(prev => [res.merchant, ...prev]);
        setShowAddModal(false);
        setNewMerchant({
          name: '',
          category: 'Warung & Kuliner',
          icon: '🍱',
          phone: '',
          address: '',
          distanceKm: '0.2',
          commissionOwner: 0,
          platformFee: 100,
          deliveryType: 'both',
          deliveryFee: 2000,
          logo: '',
          qrisImage: '',
          isAffiliate: false,
          referralCode: '',
          productName: 'Paket Nasi Hemat Spesial',
          productPrice: 18000,
          productDesc: 'Porsi pas untuk anak kost',
          productImage: ''
        });

        if (res?.bonusAwarded) {
          try {
            const stored = localStorage.getItem('kostUser');
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.loyalty_points = (Number(parsed.loyalty_points) || 0) + (res.bonusPoints || 500);
              localStorage.setItem('kostUser', JSON.stringify(parsed));
              window.dispatchEvent(new CustomEvent('kostku_user_updated', { detail: parsed }));
              window.dispatchEvent(new Event('kostUser_updated'));
            }
          } catch (_) {}
          showToast(`🎉 ${res.message || 'Mitra baru berhasil didaftarkan dan bonus +500 Poin referral berhasil diklaim!'}`);
        } else {
          showToast(res.message || '✅ Mitra baru berhasil didaftarkan');
        }
      }
    } catch (err) {
      alert(err.message || 'Gagal mendaftarkan mitra baru');
    } finally {
      setAddingMerchant(false);
    }
  };

  const handleDeleteMerchant = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus kemitraan dengan "${name}"?`)) return;
    try {
      await apiDeleteMerchant(id);
      setMerchants(prev => prev.filter(m => m.id !== id));
      showToast(`Mitra "${name}" berhasil dihapus.`);
    } catch (err) {
      alert(err.message || 'Gagal menghapus mitra');
    }
  };

  // ── FILTERING LOGIC ───────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    if (isMitraUser && currentMerchant) {
      if (String(o.merchantId) !== String(currentMerchant.id) && !o.merchantName?.toLowerCase().includes(currentMerchant.name.toLowerCase())) {
        // If simulated demo order, show it
      }
    }
    if (orderFilter === 'pending_acc') return o.lifecycleStatus === 'pending_acc' || o.status?.includes('Menunggu') || o.status?.includes('Baru');
    if (orderFilter === 'accepted') return o.lifecycleStatus === 'accepted' || o.status?.includes('Disiapkan') || o.status?.includes('Diterima');
    if (orderFilter === 'delivering') return o.lifecycleStatus === 'delivering' || o.lifecycleStatus === 'ready_pickup' || o.status?.includes('Diantar') || o.status?.includes('Diambil');
    if (orderFilter === 'completed') return o.lifecycleStatus === 'completed' || o.status?.includes('Selesai');
    return true;
  });

  const pendingAccCount = orders.filter(o => o.lifecycleStatus === 'pending_acc' || o.status?.includes('Menunggu') || o.status?.includes('Baru')).length;
  const inProgressCount = orders.filter(o => o.lifecycleStatus === 'accepted' || o.status?.includes('Disiapkan')).length;
  const deliveringCount = orders.filter(o => o.lifecycleStatus === 'delivering' || o.lifecycleStatus === 'ready_pickup').length;
  const completedCount = orders.filter(o => o.lifecycleStatus === 'completed' || o.status?.includes('Selesai')).length;

  // Filtered merchants for owner
  const filteredMerchants = merchants.filter(m => {
    if (subTypeTab === 'personal' && m.isAffiliate) return false;
    if (subTypeTab === 'affiliate' && !m.isAffiliate) return false;
    if (selectedCategory !== 'all' && m.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate gross volume
  const totalGrossRevenue = orders
    .filter(o => o.paymentStatus === 'paid' || o.paymentStatus === 'billed_monthly')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // ══════════════════════════════════════════════════════════════════
  // RENDER: DUAL VIEW (MITRA PORTAL vs OWNER MANAGEMENT)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '4rem' }} className="animate-fade-in">

      {/* Floating Toast Notice */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '0.88rem',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }} className="animate-fade-in">
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE A: PORTAL MITRA (KHUSUS ROLE === 'MITRA')
          ───────────────────────────────────────────────────────────── */}
      {isMitraUser ? (
        <div>
          {/* ── MULTI-STORE SWITCHER & MANAGEMENT BAR (1 OWNER BISA PUNYA BANYAK TOKO) ── */}
          <div style={{
            background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.75)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '12px 18px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                <Store size={18} color="#3b82f6" />
                <span>Pilih Toko:</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {userStores.map(store => {
                  const isActive = currentMerchant && String(currentMerchant.id) === String(store.id);
                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => handleSwitchStore(store)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: isActive ? '1.5px solid #3b82f6' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isActive 
                          ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.25)') 
                          : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'),
                        color: isActive ? (isLight ? '#1d4ed8' : '#60a5fa') : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{store.icon || '🏪'}</span>
                      <span>{store.name}</span>
                      {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                onClick={() => setShowTopupModal(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: saldoNota < 100 
                    ? (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.2)') 
                    : (isLight ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.15)'),
                  border: saldoNota < 100 ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: saldoNota < 100 ? '#ef4444' : (isLight ? '#b45309' : '#fbbf24'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                title="Klik untuk Top Up Saldo Kuota Nota"
              >
                <span>🪙 Saldo Nota:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>Rp {saldoNota.toLocaleString('id-ID')}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>({kuotaNota} nota)</span>
                {saldoNota < 100 && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                    HABIS!
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAddStoreModal(true)}
                className="btn btn-secondary"
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={15} />
                <span>+ Buka Toko Baru</span>
              </button>
            </div>
          </div>

          {/* Header Toko Mitra */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)'
                }}>
                  {currentMerchant?.icon || '🏪'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                      {currentMerchant?.name || user.storeName || 'Toko & Layanan Mitra'}
                    </h1>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: storeIsOpen ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                      color: storeIsOpen ? '#4ade80' : '#f87171',
                      border: `1px solid ${storeIsOpen ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                    }}>
                      {storeIsOpen ? '🟢 Toko Buka (Menerima Pesanan)' : '🔴 Toko Tutup'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>🏷️ {currentMerchant?.category || 'Warung & Kuliner'}</span>
                    <span>•</span>
                    <span>⏰ {storeOpeningHours}</span>
                    <span>•</span>
                    <span style={{ color: '#38bdf8' }}>
                      {storeDeliveryType === 'both' ? '🛵 & 🏪 Bisa Diantar Maupun Ambil di Ruko' : storeDeliveryType === 'pickup' ? '🏪 Wajib Ambil di Ruko' : '🛵 Bisa Diantar ke Kamar'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick Store Open/Close Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const next = !storeIsOpen;
                    setStoreIsOpen(next);
                    if (currentMerchant) {
                      apiUpdateMerchant(currentMerchant.id, { isOpen: next }).then(() => {
                        showToast(`Status toko diubah: ${next ? 'BUKA' : 'TUTUP'}`);
                      });
                    }
                  }}
                  className={`btn ${storeIsOpen ? 'btn-secondary' : 'btn-primary'}`}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '10px'
                  }}
                >
                  {storeIsOpen ? 'Tutup Toko Sementara' : 'Buka Toko Sekarang'}
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: '#fca5a5', fontWeight: 600 }}>🚨 Belum di-ACC (Baru)</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f87171', marginTop: '2px' }}>
                  {pendingAccCount} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pesanan</span>
                </div>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600 }}>⏳ Sedang Diproses</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#60a5fa', marginTop: '2px' }}>
                  {inProgressCount} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pesanan</span>
                </div>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: '#fcd34d', fontWeight: 600 }}>🛵 Diantar / Siap Ambil</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fbbf24', marginTop: '2px' }}>
                  {deliveringCount} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pesanan</span>
                </div>
              </div>

              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 600 }}>✅ Pesanan Selesai</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#4ade80', marginTop: '2px' }}>
                  {completedCount} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pesanan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operasional Pegawai & Kasir Toko (Akses Penuh Pemilik Usaha) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '1.25rem',
            padding: '12px 18px',
            borderRadius: '16px',
            background: isLight 
              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(219, 39, 119, 0.04) 100%)' 
              : 'linear-gradient(135deg, rgba(236, 72, 153, 0.14) 0%, rgba(219, 39, 119, 0.07) 100%)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            boxShadow: isLight ? '0 2px 8px rgba(236, 72, 153, 0.08)' : '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.35)',
                flexShrink: 0
              }}>
                🏪
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.94rem', color: isLight ? '#0f172a' : '#f8fafc' }}>
                    Operasional Kasir & Toko
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#ec4899',
                    color: '#ffffff'
                  }}>
                    👑 Akses Penuh Pemilik Usaha
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#10b981',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    ✓ Mode Kasir & Dapur Aktif
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  Sebagai Pemilik Toko, Anda dapat langsung melayani transaksi kasir walk-in, mencetak struk POS, memantau antrean masak dapur, dan mengelola meja QR.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Link
                to="/kasir"
                style={{
                  padding: '8px 15px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                title="Buka register kasir untuk melayani transaksi pelanggan walk-in"
              >
                <Receipt size={15} />
                <span>Buka Kasir POS Walk-in</span>
              </Link>

              <Link
                to="/order"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                title="Pantau pesanan meja makan dan QR self-order tamu"
              >
                <QrCode size={15} />
                <span>Pantau Meja QR</span>
              </Link>
            </div>
          </div>

          {/* Mitra Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1.5rem',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            overflowX: 'auto'
          }}>
            <button
              onClick={() => setMitraActiveTab('orders')}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: mitraActiveTab === 'orders' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                color: mitraActiveTab === 'orders' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Package size={16} />
              <span>Live Pesanan Masuk</span>
              {pendingAccCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  fontWeight: 800
                }}>
                  {pendingAccCount} Baru
                </span>
              )}
            </button>

            <button
              onClick={() => setMitraActiveTab('menu')}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: mitraActiveTab === 'menu' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: mitraActiveTab === 'menu' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <ShoppingBag size={16} />
              <span>Setting Menu & Harga ({currentMerchant?.products?.length || 0})</span>
            </button>

            <button
              onClick={() => setMitraActiveTab('store_settings')}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: mitraActiveTab === 'store_settings' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                color: mitraActiveTab === 'store_settings' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Sliders size={16} />
              <span>Pengaturan Pengantaran & Toko</span>
            </button>

            <button
              onClick={() => setMitraActiveTab('keuangan')}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: mitraActiveTab === 'keuangan' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
                color: mitraActiveTab === 'keuangan' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <DollarSign size={16} />
              <span>Keuangan & Rekapan</span>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              MITRA TAB 1: LIVE ORDERS MANAGER
              ═══════════════════════════════════════════════════════════ */}
          {mitraActiveTab === 'orders' && (
            <div>
              {/* Sub-Filters */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { id: 'all', label: 'Semua Pesanan', count: orders.length },
                  { id: 'pending_acc', label: '🚨 Belum di-ACC', count: pendingAccCount },
                  { id: 'accepted', label: '⏳ Sedang Diproses', count: inProgressCount },
                  { id: 'delivering', label: '🛵 Sedang Diantar / Ambil', count: deliveringCount },
                  { id: 'completed', label: '✅ Selesai', count: completedCount }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: orderFilter === f.id ? '1px solid rgba(59, 130, 246, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: orderFilter === f.id ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      color: orderFilter === f.id ? '#ffffff' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{f.label}</span>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      fontSize: '0.7rem'
                    }}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Order Cards List */}
              {filteredOrders.length === 0 ? (
                <div style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '16px',
                  color: '#94a3b8'
                }}>
                  <Package size={36} style={{ margin: '0 auto 10px', color: '#64748b' }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>Belum Ada Pesanan di Kategori Ini</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Pesanan baru dari penghuni kost akan muncul otomatis di sini secara real-time.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredOrders.map((order, oIdx) => {
                    const isPendingAcc = order.lifecycleStatus === 'pending_acc' || order.status?.includes('Menunggu') || order.status?.includes('Baru');
                    const isAccepted = order.lifecycleStatus === 'accepted' || order.status?.includes('Disiapkan');
                    const isDelivering = order.lifecycleStatus === 'delivering' || order.lifecycleStatus === 'ready_pickup' || order.status?.includes('Diantar') || order.status?.includes('Diambil');
                    const isCompleted = order.lifecycleStatus === 'completed' || order.status?.includes('Selesai');
                    const isPickupMode = order.deliveryMode === 'pickup';

                    return (
                      <div
                        key={order.id ? `${order.id}-${oIdx}` : oIdx}
                        style={{
                          background: isPendingAcc ? 'rgba(239, 68, 68, 0.05)' : 'rgba(30, 41, 59, 0.7)',
                          border: isPendingAcc ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-color)',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          boxShadow: isPendingAcc ? '0 4px 20px rgba(239, 68, 68, 0.15)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Top Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>
                                #{order.id}
                              </span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: isPendingAcc ? 'rgba(239, 68, 68, 0.2)' : isAccepted ? 'rgba(59, 130, 246, 0.2)' : isDelivering ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                color: isPendingAcc ? '#f87171' : isAccepted ? '#60a5fa' : isDelivering ? '#fbbf24' : '#4ade80'
                              }}>
                                {order.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
                              Dipesan: {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          </div>

                          {/* Delivery Mode Badge */}
                          <div style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isPickupMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: isPickupMode ? '#fbbf24' : '#93c5fd',
                            border: `1px solid ${isPickupMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            {isPickupMode ? '🏪 Ambil di Ruko' : '🛵 Diantar ke Kamar'}
                          </div>
                        </div>

                        {/* Customer & Room Info */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '10px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          marginBottom: '12px',
                          fontSize: '0.8rem'
                        }}>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Nama Pemesan:</span>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{order.userName}</div>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Tujuan / Kamar:</span>
                            <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                              {isPickupMode ? 'Ambil di Gerai / Ruko' : `Kamar ${order.roomNumber}`}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Pembayaran:</span>
                            <div style={{ fontWeight: 700, color: '#4ade80' }}>
                              {order.paymentMethod === 'qris' ? 'QRIS (Lunas)' : order.paymentMethod === 'monthly_bill' ? 'Tagihan Sewa Kost' : 'Bayar Tunai (COD)'}
                            </div>
                          </div>
                        </div>

                        {/* Ordered Items List */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                            Item yang Dipesan:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {(order.items || [{ name: order.serviceName, price: order.subtotal, qty: 1 }]).map((it, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1' }}>
                                <span>{it.qty || 1}x {it.name}</span>
                                <span style={{ fontWeight: 600 }}>Rp {((it.price || 0) * (it.qty || 1)).toLocaleString('id-ID')}</span>
                              </div>
                            ))}
                          </div>
                          {order.notes && (
                            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#fde047', background: 'rgba(234, 179, 8, 0.1)', padding: '6px 10px', borderRadius: '8px' }}>
                              📝 Catatan: {order.notes}
                            </div>
                          )}
                        </div>

                        {/* Total Amount & Price Breakdown */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          marginBottom: '12px',
                          fontSize: '0.86rem'
                        }}>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Total Penerimaan:</span>
                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4ade80', marginLeft: '8px' }}>
                              Rp {(order.total || order.subtotal).toLocaleString('id-ID')}
                            </span>
                          </div>
                          {order.deliveryFee > 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                              Termasuk Ongkir Rp {order.deliveryFee.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons for Order Status Lifecycle */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {isPendingAcc && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                                className="btn btn-primary"
                                style={{
                                  flex: 2,
                                  padding: '10px',
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <Check size={16} />
                                <span>Terima & ACC Pesanan</span>
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                className="btn btn-danger"
                                style={{ flex: 1, padding: '10px', fontSize: '0.82rem', justifyContent: 'center' }}
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {isAccepted && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleUpdateOrderStatus(order.id, isPickupMode ? 'ready_pickup' : 'delivering')}
                              className="btn btn-primary"
                              style={{
                                flex: 2,
                                padding: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                background: isPickupMode ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              {isPickupMode ? <Store size={16} /> : <Bike size={16} />}
                              <span>{isPickupMode ? 'Beri Tahu: Siap Diambil di Ruko' : 'Berangkat Antar ke Kamar'}</span>
                            </button>
                          )}

                          {isDelivering && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              className="btn btn-primary"
                              style={{
                                flex: 2,
                                padding: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <CheckCircle size={16} />
                              <span>Tandai Selesai / Sudah Diantar</span>
                            </button>
                          )}

                          {/* Direct WhatsApp Chat with Customer */}
                          {order.userPhone && order.userPhone !== '-' && (
                            <a
                              href={`https://wa.me/${order.userPhone.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Kak ${order.userName}, ini dari ${currentMerchant?.name || 'Toko Mitra Kost'}. Terkait pesanan #${order.id}...`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '10px 14px', fontSize: '0.82rem', gap: '6px', textDecoration: 'none' }}
                            >
                              <MessageSquare size={15} color="#22c55e" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              MITRA TAB 2: MENU & PRICES MANAGEMENT
              ═══════════════════════════════════════════════════════════ */}
          {mitraActiveTab === 'menu' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc' }}>
                    Daftar Menu & Pengaturan Harga
                  </h3>
                  <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                    Ubah harga makanan/layanan Anda secara langsung atau tambah menu baru untuk penghuni kost.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(true)}
                  className="btn btn-primary"
                  style={{ padding: '9px 16px', fontSize: '0.85rem', fontWeight: 700, gap: '6px' }}
                >
                  <Plus size={16} />
                  <span>Tambah Menu Baru</span>
                </button>
              </div>

              {/* Products Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {(currentMerchant?.products || []).map(prod => (
                  <div
                    key={prod.id}
                    style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: prod.isAvailable !== false ? '1px solid var(--border-color)' : '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: prod.isAvailable !== false ? 1 : 0.65
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '1.8rem' }}>🍱</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                                {prod.name}
                              </h4>
                              {prod.isBestSeller && (
                                <span style={{
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                                  color: '#fff',
                                  boxShadow: '0 1px 4px rgba(239, 68, 68, 0.4)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}>
                                  🔥 Best Seller
                                </span>
                              )}
                              {prod.isCameraVerified === true ? (
                                <span style={{
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  fontSize: '0.60rem',
                                  fontWeight: 700,
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#34d399',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <ShieldCheck size={10} />
                                  <span>Kamera Asli ({prod.sensorScore || 92}%)</span>
                                </span>
                              ) : (
                                <span style={{
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  fontSize: '0.60rem',
                                  fontWeight: 700,
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <AlertTriangle size={10} />
                                  <span>Perlu Foto HP</span>
                                </span>
                              )}
                            </div>
                            <span style={{
                              padding: '2px 7px',
                              borderRadius: '999px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: prod.isAvailable !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: prod.isAvailable !== false ? '#4ade80' : '#f87171'
                            }}>
                              {prod.isAvailable !== false ? 'Ready' : 'Habis'}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {prod.desc || 'Deskripsi menu belum diisi'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price Input & Controls */}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                        Harga Jual (Rp):
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          defaultValue={prod.price}
                          id={`price-input-${prod.id}`}
                          className="input-field"
                          style={{ flex: 1, padding: '7px 10px', fontSize: '0.88rem', fontWeight: 800, color: '#60a5fa' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const inp = document.getElementById(`price-input-${prod.id}`);
                            if (inp) handleSaveMenuPrice(prod.id, inp.value);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700 }}
                        >
                          Simpan
                        </button>
                      </div>

                      {/* Toggles: Best Seller, Ready/Habis and Delete */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleBestSeller(prod.id)}
                          style={{
                            background: prod.isBestSeller ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                            border: prod.isBestSeller ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: prod.isBestSeller ? '#fbbf24' : '#94a3b8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                        >
                          🔥 {prod.isBestSeller ? 'Best Seller Aktif' : 'Set Best Seller'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleProductAvailability(prod.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: prod.isAvailable !== false ? '#fbbf24' : '#4ade80',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            {prod.isAvailable !== false ? 'Tandai Habis' : 'Tandai Tersedia'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f87171',
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              MITRA TAB 3: STORE & DELIVERY SETTINGS
              ═══════════════════════════════════════════════════════════ */}
          {mitraActiveTab === 'store_settings' && (
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '820px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={20} color="#10b981" /> Pengaturan Pengantaran, Ongkos Kirim & Jam Kirim
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Atur skema tarif ongkir per kilometer, bebas ongkir, serta jadwal jam operasional kurir pengantar ke kamar kost.
                  </p>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  background: checkDeliveryHoursActive(storeDeliveryStartTime, storeDeliveryEndTime)
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                  border: checkDeliveryHoursActive(storeDeliveryStartTime, storeDeliveryEndTime)
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(245, 158, 11, 0.4)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: checkDeliveryHoursActive(storeDeliveryStartTime, storeDeliveryEndTime) ? '#34d399' : '#fbbf24'
                }}>
                  <span>{checkDeliveryHoursActive(storeDeliveryStartTime, storeDeliveryEndTime) ? '🟢' : '🟠'}</span>
                  <span>
                    {checkDeliveryHoursActive(storeDeliveryStartTime, storeDeliveryEndTime)
                      ? 'Jam Kirim Buka Sekarang'
                      : `Di Luar Jam Kirim (Buka ${storeDeliveryStartTime || '07:30'})`}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveStoreSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* 1. Opsi Pengantaran: Bisa Diantar vs Harus Ambil di Ruko */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '14px'
                }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                    🛵 Opsi Layanan Pesanan ke Kamar Kost:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { id: 'both', label: 'Bisa Diantar Maupun Ambil Sendiri di Ruko (Direkomendasikan)', desc: 'Penghuni kost bisa memilih pesanan diantar langsung ke kamar atau diambil di ruko Anda.' },
                      { id: 'delivery', label: 'Hanya Bisa Diantar ke Kamar', desc: 'Pesanan selalu diantar sampai depan pintu kamar penghuni kost.' },
                      { id: 'pickup', label: 'Harus Ambil Sendiri di Ruko / Toko', desc: 'Penghuni kost harus datang langsung ke ruko / toko Anda untuk mengambil pesanan.' }
                    ].map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setStoreDeliveryType(opt.id)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: storeDeliveryType === opt.id ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: storeDeliveryType === opt.id ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name="mitraDeliveryType"
                          checked={storeDeliveryType === opt.id}
                          onChange={() => setStoreDeliveryType(opt.id)}
                          style={{ accentColor: '#10b981', marginTop: '3px' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: storeDeliveryType === opt.id ? '#34d399' : '#f8fafc' }}>
                            {opt.label}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                            {opt.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Pengaturan Tarif Ongkos Kirim (Per KM vs Flat) */}
                {storeDeliveryType !== 'pickup' && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        💰 Skema Tarif Ongkos Kirim (Ongkir):
                      </label>

                      {/* Skema Switcher Buttons */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setStoreDeliveryFeeType('per_km')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: storeDeliveryFeeType === 'per_km' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                            background: storeDeliveryFeeType === 'per_km' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                            color: storeDeliveryFeeType === 'per_km' ? '#38bdf8' : '#94a3b8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          📍 Hitung Per KM (Jarak)
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoreDeliveryFeeType('flat')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: storeDeliveryFeeType === 'flat' ? '1.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                            background: storeDeliveryFeeType === 'flat' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                            color: storeDeliveryFeeType === 'flat' ? '#fbbf24' : '#94a3b8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🏷️ Tarif Flat ke Kamar
                        </button>
                      </div>
                    </div>

                    {storeDeliveryFeeType === 'per_km' ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                              Tarif Ongkir Per KM (Rp):
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={storeDeliveryFeePerKm}
                              onChange={e => setStoreDeliveryFeePerKm(e.target.value)}
                              placeholder="2500"
                              className="input-field"
                            />
                            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                              Contoh: Rp 2.500 per km jarak tempuh kurir.
                            </span>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                              Tarif Dasar / 1 KM Pertama (Base Fare Rp):
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={storeDeliveryBaseFare}
                              onChange={e => setStoreDeliveryBaseFare(e.target.value)}
                              placeholder="2000"
                              className="input-field"
                            />
                            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                              Ongkir minimal untuk radius dekat (&le; 1 km).
                            </span>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                              Maksimal Jarak Pengantaran (KM):
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="25"
                              value={storeDeliveryMaxDistance}
                              onChange={e => setStoreDeliveryMaxDistance(e.target.value)}
                              placeholder="5"
                              className="input-field"
                            />
                            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                              Batas terjauh jangkauan antar toko.
                            </span>
                          </div>
                        </div>

                        {/* Live Calculator Simulation Box */}
                        <div style={{
                          marginTop: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Sparkles size={13} /> Simulasi Otomatis Ongkir Berdasarkan Jarak:
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Kamar Kost Dekat (0.8 km)</div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                                Rp {Number(storeDeliveryBaseFare || 2000).toLocaleString('id-ID')}
                              </div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Jarak Sedang (2.0 km)</div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                                Rp {(Number(storeDeliveryBaseFare || 2000) + Number(storeDeliveryFeePerKm || 2500)).toLocaleString('id-ID')}
                              </div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Jarak Jauh (3.5 km)</div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                                Rp {(Number(storeDeliveryBaseFare || 2000) + Math.round(2.5 * Number(storeDeliveryFeePerKm || 2500))).toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                          Tarif Ongkos Kirim Flat ke Kamar (Rp):
                        </label>
                        <input
                          type="number"
                          value={storeDeliveryFee}
                          onChange={e => setStoreDeliveryFee(e.target.value)}
                          placeholder="2000"
                          className="input-field"
                          style={{ maxWidth: '320px' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                          Tarif flat sama untuk seluruh kamar kosan (0 = Gratis Ongkir).
                        </span>
                      </div>
                    )}

                    {/* Bebas Ongkir Threshold */}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                        🎁 Bebas Ongkir Otomatis Jika Belanja Minimal (Rp):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={storeDeliveryMinOrderFree}
                        onChange={e => setStoreDeliveryMinOrderFree(e.target.value)}
                        placeholder="35000 (Isi 0 jika tidak ada bebas ongkir)"
                        className="input-field"
                        style={{ maxWidth: '320px' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                        Penghuni kost otomatis bebas ongkir (Rp 0) jika total pesanan menu mencapai nominal ini (0 = Dinonaktifkan).
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Pengaturan Jam Kirim & Jadwal Pengantaran */}
                {storeDeliveryType !== 'pickup' && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      🕒 Jam Kirim & Jadwal Pengantaran Toko:
                    </label>

                    {/* Jam Mulai & Akhir Kirim */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                          Jam Buka Pengantaran:
                        </label>
                        <input
                          type="time"
                          value={storeDeliveryStartTime}
                          onChange={e => setStoreDeliveryStartTime(e.target.value)}
                          className="input-field"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                          Mulai melayani kirim ke kamar anak kost.
                        </span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                          Jam Terakhir Pengantaran:
                        </label>
                        <input
                          type="time"
                          value={storeDeliveryEndTime}
                          onChange={e => setStoreDeliveryEndTime(e.target.value)}
                          className="input-field"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                          Batas jam pengantaran kurir malam hari.
                        </span>
                      </div>
                    </div>

                    {/* Mode Pengantaran: Instan vs Slot Batch */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                        Tipe Jadwal Pengantaran:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setStoreDeliveryScheduleType('always')}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: storeDeliveryScheduleType === 'always' ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                            background: storeDeliveryScheduleType === 'always' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                            color: storeDeliveryScheduleType === 'always' ? '#34d399' : '#94a3b8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          ⚡ Kirim Kapan Saja (Instan 15-20 Menit)
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoreDeliveryScheduleType('slots')}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: storeDeliveryScheduleType === 'slots' ? '1.5px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                            background: storeDeliveryScheduleType === 'slots' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)',
                            color: storeDeliveryScheduleType === 'slots' ? '#c084fc' : '#94a3b8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          ⏰ Slot Jam Makan Terjadwal
                        </button>
                      </div>
                    </div>

                    {storeDeliveryScheduleType === 'slots' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                          Keterangan Slot Jam Pengantaran:
                        </label>
                        <input
                          type="text"
                          value={storeDeliveryTimeSlots}
                          onChange={e => setStoreDeliveryTimeSlots(e.target.value)}
                          placeholder="Pagi (07:00-08:30), Siang (11:30-13:00), Malam (18:00-19:30)"
                          className="input-field"
                        />
                      </div>
                    )}

                    {/* Catatan Jam Kirim */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                        Catatan Pengantaran untuk Pelanggan (Anak Kost):
                      </label>
                      <textarea
                        rows={2}
                        value={storeDeliveryNote}
                        onChange={e => setStoreDeliveryNote(e.target.value)}
                        placeholder="Pesanan diantar langsung oleh kurir toko kami sampai depan pintu kamar."
                        className="input-field"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                )}

                {/* 4. Jam Operasional Ruko Umum & Kontak */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    🏪 Profil Ruko, Kontak & Jam Operasional Umum:
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                        Jam Operasional Toko Umum:
                      </label>
                      <input
                        type="text"
                        value={storeOpeningHours}
                        onChange={e => setStoreOpeningHours(e.target.value)}
                        placeholder="Contoh: 08:00 - 22:00 WIB"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                        Nomor WhatsApp Toko:
                      </label>
                      <input
                        type="tel"
                        value={storePhone}
                        onChange={e => setStorePhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Alamat Ruko */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      Alamat Ruko / Titik Lokasi Toko:
                    </label>
                    <textarea
                      rows={2}
                      value={storeAddress}
                      onChange={e => setStoreAddress(e.target.value)}
                      placeholder="Contoh: Jl. Cisitu Lama No. 8 (Sebelah Gapura Kost)"
                      className="input-field"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Logo / Foto Toko Mitra */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      Logo / Foto Profil Toko Mitra (URL Gambar):
                    </label>
                    <input
                      type="url"
                      value={storeLogo}
                      onChange={e => setStoreLogo(e.target.value)}
                      placeholder="Contoh: https://images.unsplash.com/photo-..."
                      className="input-field"
                    />
                    {storeLogo && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={storeLogo}
                          alt="Logo Toko"
                          style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span style={{ fontSize: '0.74rem', color: '#10b981' }}>Preview logo mitra aktif</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. METODE PEMBAYARAN MANDIRI (QRIS MANDIRI & TF PRIBADI) + SALDO KUOTA NOTA */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(59, 130, 246, 0.25)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  marginTop: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={20} color="#38bdf8" />
                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                          Metode Bayar Mandiri (QRIS Toko &amp; TF Rekening Pribadi)
                        </h4>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                        Mitra boleh pakai QRIS toko sendiri atau transfer bank pribadi. Uang 100% langsung masuk ke rekening Anda!
                      </p>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: customPaymentEnabled ? '#34d399' : '#94a3b8' }}>
                        {customPaymentEnabled ? '✅ Mandiri Aktif' : 'Nonaktif'}
                      </span>
                      <input
                        type="checkbox"
                        checked={customPaymentEnabled}
                        onChange={e => setCustomPaymentEnabled(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                      />
                    </label>
                  </div>

                  {/* KARTU SALDO KUOTA NOTA */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                        🎟️ Saldo Kuota Nota Aktif (Rp 100 / Nota)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                          Rp {saldoNota.toLocaleString('id-ID')}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: kuotaNota > 10 ? 'rgba(16, 185, 129, 0.2)' : kuotaNota > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: kuotaNota > 10 ? '#34d399' : kuotaNota > 0 ? '#fbbf24' : '#f87171',
                          fontWeight: 800
                        }}>
                          {kuotaNota} Lembar Nota Tersisa
                        </span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginTop: '3px' }}>
                        💡 Syarat sistem: Setiap transaksi lewat QRIS/TF pribadi memotong 1 kuota nota (Rp 100). Harga nota sama dengan biaya admin KostKu.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTopupModal(true)}
                      style={{
                        padding: '9px 16px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                      }}
                    >
                      <Zap size={15} />
                      <span>Top Up Saldo Nota</span>
                    </button>
                  </div>

                  {customPaymentEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                          URL Gambar Barcode QRIS Toko Sendiri (Static QRIS):
                        </label>
                        <input
                          type="url"
                          value={customQrisImage}
                          onChange={e => setCustomQrisImage(e.target.value)}
                          placeholder="https://... atau paste link barcode QRIS toko Anda"
                          className="input-field"
                        />
                        {customQrisImage && (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={customQrisImage}
                              alt="QRIS Preview"
                              style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'contain', background: '#fff', padding: '4px' }}
                              onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                            <span style={{ fontSize: '0.74rem', color: '#34d399' }}>Preview barcode QRIS aktif</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 2fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                            Bank / E-Wallet:
                          </label>
                          <select
                            value={customBankName}
                            onChange={e => setCustomBankName(e.target.value)}
                            className="input-field"
                            style={{ padding: '8px' }}
                          >
                            <option value="BCA">BCA</option>
                            <option value="Mandiri">Bank Mandiri</option>
                            <option value="BRI">BRI</option>
                            <option value="BNI">BNI</option>
                            <option value="Bank Jago">Bank Jago</option>
                            <option value="SeaBank">SeaBank</option>
                            <option value="BSI">BSI (Syariah)</option>
                            <option value="DANA">DANA</option>
                            <option value="GoPay">GoPay</option>
                            <option value="OVO">OVO</option>
                            <option value="ShopeePay">ShopeePay</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                            Nomor Rekening / No. HP:
                          </label>
                          <input
                            type="text"
                            value={customBankAccountNumber}
                            onChange={e => setCustomBankAccountNumber(e.target.value)}
                            placeholder="Contoh: 1234567890"
                            className="input-field"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                            Atas Nama:
                          </label>
                          <input
                            type="text"
                            value={customBankAccountHolder}
                            onChange={e => setCustomBankAccountHolder(e.target.value)}
                            placeholder="Contoh: Budi Santoso"
                            className="input-field"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveCustomPayment}
                        disabled={savingCustomPayment}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '8px 16px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid #3b82f6',
                          color: '#93c5fd',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {savingCustomPayment ? 'Menyimpan...' : 'Simpan Detail Rekening & QRIS'}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 18px',
                    fontWeight: 800,
                    fontSize: '0.94rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Check size={18} />
                  <span>Simpan Pengaturan Ongkir & Jam Kirim</span>
                </button>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              MITRA TAB 4: KEUANGAN & REKAPAN SETTLEMENT
              ═══════════════════════════════════════════════════════════ */}
          {mitraActiveTab === 'keuangan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* TOP HERO: DOMPET TERPADU & TRIPAY CENTRALIZED NOTICE */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <DollarSign size={24} color="#a78bfa" />
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                        Keuangan &amp; Dompet Terpadu (Unified Wallet)
                      </h3>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                      Pembayaran TriPay QRIS terpusat otomatis masuk ke Saldo Dompet Mitra UID: <strong style={{ color: '#38bdf8' }}>{currentMerchant?.id || 'MITRA'}</strong>.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handlePrintKeuangan('mitra')}
                      style={{
                        padding: '9px 16px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                      }}
                    >
                      <Printer size={16} />
                      <span>🖨️ Cetak Rekap Laporan</span>
                    </button>
                  </div>
                </div>

                {/* DUAL WALLET CARDS: UNIFIED WALLET + SALDO KUOTA NOTA */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '12px',
                  marginTop: '1.25rem'
                }}>
                  {/* CARD 1: UNIFIED WALLET (DANA DARI TRIPAY GATEWAY) */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1.5px solid rgba(139, 92, 246, 0.35)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '0.72rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 800 }}>
                          💳 Saldo Dompet Terpadu (Kasir POS &amp; Mitra Toko)
                        </div>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981'
                        }}>
                          1 UID Terpadu: {currentMerchant?.id || walletData?.uid || '-'}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        Rp {(walletData?.balance || 0).toLocaleString('id-ID')}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                        ✦ Satu UID terpadu untuk penerimaan QRIS Kasir POS &amp; Pesanan Mitra Toko (bersih setelah admin platform Rp 100).
                      </span>
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>
                        ● Master Gateway TriPay (T53543) Aktif
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentBal = walletData?.balance || 0;
                          if (currentBal <= 0) {
                            showToast('Saldo dompet terpadu masih Rp 0.');
                            return;
                          }
                          const targetUid = currentMerchant?.id || walletData?.uid;
                          if (window.confirm(`Tarik saldo Rp ${currentBal.toLocaleString('id-ID')} ke rekening ${currentMerchant?.customBankName || 'Bank'} (${currentMerchant?.customBankAccountNumber || 'Rekening Pribadi'}) via BI-FAST / Flip?`)) {
                            apiMutateAccountWallet(targetUid, {
                              amount: currentBal,
                              type: 'payout',
                              description: `Penarikan saldo dompet terpadu mitra & kasir ke rekening ${currentMerchant?.customBankName || ''}`
                            }).then(res => {
                              showToast('Permintaan penarikan dana berhasil diproses ke antrean transfer BI-FAST!');
                              if (res?.wallet) setWalletData(res.wallet);
                            }).catch(err => alert(err.message || 'Gagal memproses penarikan'));
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(139, 92, 246, 0.5)',
                          background: 'rgba(139, 92, 246, 0.18)',
                          color: '#c084fc',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Tarik Saldo (Payout)
                      </button>
                    </div>
                  </div>

                  {/* CARD 2: SALDO KUOTA NOTA */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1.5px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#60a5fa', textTransform: 'uppercase', fontWeight: 700 }}>
                        🎟️ Saldo Kuota Nota (Metode Mandiri)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                          Rp {saldoNota.toLocaleString('id-ID')}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: kuotaNota > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: kuotaNota > 0 ? '#34d399' : '#f87171',
                          fontWeight: 800
                        }}>
                          {kuotaNota} Kuota Nota
                        </span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                        ✦ Dipotong Rp 100/transaksi ketika pembeli scan QRIS toko sendiri atau transfer rekening langsung.
                      </span>
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setShowTopupModal(true)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Zap size={13} />
                        <span>Isi Saldo Nota (Rp 100/nota)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 FINANCIAL METRIC CARDS */}
              {(() => {
                const targetOrders = orders.filter(o => !currentMerchant?.id || String(o.merchantId) === String(currentMerchant.id)).filter(o => {
                  if (keuanganFilter === 'today') return getIsToday(o.createdAt);
                  if (keuanganFilter === 'month') return getIsThisMonth(o.createdAt);
                  return true;
                });
                const completed = targetOrders.filter(o => o.status?.includes('Selesai') || o.lifecycleStatus === 'completed' || o.paymentStatus === 'paid');
                const gross = completed.reduce((sum, o) => sum + (Number(o.total || o.totalPrice || 0)), 0);
                const platformFee = completed.length * 100;
                const net = Math.max(0, gross - platformFee);
                const qrisPlatform = completed.filter(o => (o.paymentMethod || '').toLowerCase() === 'qris').reduce((sum, o) => sum + (Number(o.total || o.totalPrice || 0)), 0);
                const customDirect = completed.filter(o => (o.paymentMethod || '').toLowerCase().includes('custom')).reduce((sum, o) => sum + (Number(o.total || o.totalPrice || 0)), 0);
                const tunai = completed.filter(o => (o.paymentMethod || '').toLowerCase() === 'cod').reduce((sum, o) => sum + (Number(o.total || o.totalPrice || 0)), 0);

                return (
                  <div>
                    {/* Period Filter Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[
                          { id: 'all', label: 'Semua Periode' },
                          { id: 'today', label: 'Hari Ini' },
                          { id: 'month', label: 'Bulan Ini' }
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setKeuanganFilter(f.id)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: keuanganFilter === f.id ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                              background: keuanganFilter === f.id ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                              color: keuanganFilter === f.id ? '#c084fc' : '#94a3b8'
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Menampilkan <strong>{completed.length}</strong> transaksi selesai
                      </div>
                    </div>

                    {/* Stat Grid 4 Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '12px',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Omset Kotor</div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          Rp {gross.toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                          Dari {completed.length} pesanan terbayar
                        </span>
                      </div>

                      <div style={{ background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>Biaya Platform KostKu</div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f87171', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          -Rp {platformFee.toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                          Flat Rp 100 x {completed.length} transaksi
                        </span>
                      </div>

                      <div style={{ background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>Netto Diterima Mitra</div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#34d399', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          Rp {net.toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                          100% hak penerimaan mitra
                        </span>
                      </div>

                      <div style={{ background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Rincian Kanal Bayar</div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div>💳 QRIS TriPay: <strong>Rp {qrisPlatform.toLocaleString('id-ID')}</strong></div>
                          <div>📱 QRIS/TF Mandiri: <strong>Rp {customDirect.toLocaleString('id-ID')}</strong></div>
                          <div>💵 Tunai (COD): <strong>Rp {tunai.toLocaleString('id-ID')}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* TABLE: RIWAYAT TRANSAKSI KEUANGAN */}
                    <div style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Receipt size={17} color="#a78bfa" />
                          <span>Rincian Buku Kas Transaksi Pesanan</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          Biaya Admin Mitra: Flat Rp 100 / Transaksi
                        </span>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                              <th style={{ padding: '10px 14px' }}>Waktu / ID</th>
                              <th style={{ padding: '10px 14px' }}>Pelanggan</th>
                              <th style={{ padding: '10px 14px' }}>Metode</th>
                              <th style={{ padding: '10px 14px' }}>Menu / Layanan</th>
                              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Kotor</th>
                              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Admin</th>
                              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Netto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completed.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                  Belum ada transaksi selesai pada periode ini.
                                </td>
                              </tr>
                            ) : (
                              completed.map((o, idx) => {
                                const orderAmount = Number(o.total || o.totalPrice || 0);
                                const fee = 100;
                                const netAmount = Math.max(0, orderAmount - fee);
                                const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
                                const itemsStr = Array.isArray(o.items) && o.items.length > 0 ? o.items.map(it => `${it.qty}x ${it.name || it.title}`).join(', ') : (o.serviceTitle || '-');
                                const method = (o.paymentMethod || '').toLowerCase() === 'custom_qris' ? 'QRIS Mandiri' : (o.paymentMethod || '').toLowerCase().includes('bank') ? 'TF Pribadi' : (o.paymentMethod || 'QRIS').toUpperCase();

                                return (
                                  <tr key={o.id ? `${o.id}-${idx}` : idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <td style={{ padding: '10px 14px' }}>
                                      <div style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>#{o.id}</div>
                                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{dateStr}</div>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{o.userName || o.customerName || 'Penghuni'}</div>
                                      <div style={{ fontSize: '0.68rem', color: '#38bdf8' }}>{o.deliveryMode === 'pickup' ? 'Ambil di Toko' : `Kamar ${o.roomNumber || '-'}`}</div>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <span style={{
                                        fontSize: '0.68rem',
                                        padding: '2px 7px',
                                        borderRadius: '5px',
                                        background: method.includes('Mandiri') || method.includes('Pribadi') ? 'rgba(56, 189, 248, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                        color: method.includes('Mandiri') || method.includes('Pribadi') ? '#38bdf8' : '#4ade80',
                                        fontWeight: 700
                                      }}>
                                        {method}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', maxWidth: '240px', color: '#cbd5e1' }}>
                                      {itemsStr}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                                      Rp {orderAmount.toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                                      -Rp {fee.toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                                      Rp {netAmount.toLocaleString('id-ID')}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            MODE B: OWNER / STAFF VIEW (PENGELOLA KOST)
            ───────────────────────────────────────────────────────────── */
        <div>
          {/* Header Ekosistem Mitra & UMKM */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Store size={26} color={isLight ? '#2563eb' : '#38bdf8'} />
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Mitra & Toko Sekitar Kost
                  </h1>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                  Kelola kemitraan hyperlocal (warung, laundry, galon) & passive revenue komisi tanpa repot urus operasional.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: 700, gap: '8px' }}
              >
                <Plus size={16} />
                <span>+ Daftarkan Mitra Baru</span>
              </button>
            </div>

            {/* Owner Stats Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginTop: '1.25rem'
            }}>
              <div style={{ background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Total Mitra Terdaftar</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {merchants.length} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Toko</span>
                </div>
              </div>

              <div style={{ background: isLight ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.08)', border: isLight ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: isLight ? '#b45309' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🪙</span> Reward Poin Transaksi Mitra
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: isLight ? '#d97706' : '#fbbf24', marginTop: '2px' }}>
                  {((orders.length || 0) * 100).toLocaleString('id-ID')} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Poin (Rp {((orders.length || 0) * 100).toLocaleString('id-ID')})</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: isLight ? '#78350f' : '#fef3c7', display: 'block', marginTop: '2px' }}>
                  ✦ Reward otomatis +100 Poin per transaksi (Bebas biaya komisi mitra)
                </span>
              </div>

              <div style={{ background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(56, 189, 248, 0.08)', border: isLight ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: isLight ? '#1d4ed8' : '#93c5fd' }}>Total Transaksi Pesanan</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: isLight ? '#2563eb' : '#38bdf8', marginTop: '2px' }}>
                  {orders.length} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pesanan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1.5rem',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            overflowX: 'auto'
          }}>
            <button
              onClick={() => setOwnerActiveTab('mitra')}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: ownerActiveTab === 'mitra' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                color: ownerActiveTab === 'mitra' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              🏪 Direktori Mitra ({merchants.length})
            </button>

            <button
              onClick={() => setOwnerActiveTab('orders')}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: ownerActiveTab === 'orders' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                color: ownerActiveTab === 'orders' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Package size={16} />
              <span>Monitoring Pesanan ({orders.length})</span>
            </button>

            <button
              onClick={() => setOwnerActiveTab('keuangan')}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: ownerActiveTab === 'keuangan' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
                color: ownerActiveTab === 'keuangan' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <DollarSign size={16} />
              <span>Keuangan &amp; Rekap Mitra</span>
            </button>
          </div>

          {/* OWNER TAB 1: MITRA DIRECTORY */}
          {ownerActiveTab === 'mitra' && (
            <div>
              {/* Category Pills & Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {['all', 'Warung & Kuliner', 'Depot Air & Gas', 'Laundry & Cuci'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: selectedCategory === cat 
                          ? '1px solid #2563eb' 
                          : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.08)'),
                        background: selectedCategory === cat 
                          ? '#2563eb' 
                          : (isLight ? '#ffffff' : 'rgba(255,255,255,0.02)'),
                        color: selectedCategory === cat 
                          ? '#ffffff' 
                          : (isLight ? '#334155' : '#94a3b8'),
                        boxShadow: selectedCategory === cat ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat === 'all' ? 'Semua Kategori' : cat}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari toko atau produk..."
                    className="input-field"
                    style={{ width: '100%', padding: '7px 10px 7px 30px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Merchants Grid */}
              {filteredMerchants.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3.5rem 1.5rem',
                  background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '20px',
                  border: isLight ? '2px dashed #cbd5e1' : '2px dashed rgba(255, 255, 255, 0.12)',
                  maxWidth: '560px',
                  margin: '1.5rem auto'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏪</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                    Mitra Belum Ada
                  </h3>
                  <p style={{ margin: '0 auto 18px', fontSize: '0.92rem', color: isLight ? '#475569' : '#cbd5e1', lineHeight: 1.6, maxWidth: '440px', fontWeight: 600 }}>
                    Mitra belum ada, tambahkan mitra untuk mendapat bonus poin! Masukkan kode referral saat mendaftarkan mitra baru untuk mengaktifkan extra bonus poin.
                  </p>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.18)',
                    color: isLight ? '#b45309' : '#fbbf24',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '20px'
                  }}>
                    <Sparkles size={15} color="#f59e0b" />
                    <span>Extra Poin Referral: Wajib pakai kode referral (hanya berlaku 1x per mitra baru)</span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="btn btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '11px 24px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        borderRadius: '12px',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={18} />
                      Tambah Mitra Sekarang (+ Bonus Poin)
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {filteredMerchants.map(merchant => (
                    <div
                      key={merchant.id}
                      style={{
                        background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)',
                        border: isLight ? '1px solid rgba(15, 23, 42, 0.10)' : '1px solid var(--border-color)',
                        boxShadow: isLight ? '0 2px 8px rgba(15, 23, 42, 0.05)' : 'none',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.75rem' }}>{merchant.icon || '🏪'}</span>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {merchant.name}
                              </h4>
                              <span style={{ fontSize: '0.72rem', color: isLight ? '#2563eb' : '#38bdf8', fontWeight: 600 }}>
                                {merchant.category}
                              </span>
                            </div>
                          </div>

                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(34, 197, 94, 0.15)',
                            color: isLight ? '#16a34a' : '#4ade80'
                          }}>
                            Aktif
                          </span>
                        </div>

                        <p style={{ margin: '4px 0 10px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color={isLight ? '#2563eb' : '#60a5fa'} />
                          {merchant.address || 'Dekat area kost'}
                        </p>

                        {/* Delivery Mode info */}
                        <div style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                          border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : 'none',
                          fontSize: '0.74rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '10px'
                        }}>
                          <span>Opsi Antar: </span>
                          <strong style={{ color: isLight ? '#b45309' : '#fbbf24' }}>
                            {merchant.deliveryType === 'pickup' ? 'Ambil di Ruko' : merchant.deliveryType === 'delivery' ? 'Diantar ke Kamar' : 'Bisa Diantar & Ambil di Ruko'}
                          </strong>
                        </div>

                        {/* Reward Poin Badge */}
                        <div style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          background: isLight ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.06)',
                          border: isLight ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(245, 158, 11, 0.25)',
                          fontSize: '0.74rem',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Reward Poin Transaksi:</span>
                            <strong style={{ color: isLight ? '#b45309' : '#fbbf24' }}>🪙 +100 Poin (Rp 100) / trx</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            <span>Potongan Biaya Mitra:</span>
                            <span style={{ color: isLight ? '#16a34a' : '#4ade80', fontWeight: 600 }}>0% (Bebas Biaya Extra)</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {merchant.products?.length || 0} Menu Aktif
                        </span>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {merchant.phone && (
                            <a
                              href={`https://wa.me/${merchant.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                            >
                              <Phone size={12} /> WA
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteMerchant(merchant.id, merchant.name)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '5px 8px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OWNER TAB 2: ALL MONITORING ORDERS */}
          {ownerActiveTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orders.map((order, oIdx) => (
                <div
                  key={order.id ? `${order.id}-${oIdx}` : oIdx}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.9rem' }}>#{order.id}</span>
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>{order.merchantName}</span>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#4ade80'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px' }}>
                      {order.userName} ({order.deliveryMode === 'pickup' ? 'Ambil di Ruko' : `Kamar ${order.roomNumber}`}) • Total: <strong>Rp {order.total?.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: isLight ? '#b45309' : '#fbbf24', fontWeight: 700 }}>
                      🪙 +100 Poin (Rp 100) Reward
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isLight ? '#16a34a' : '#4ade80', fontWeight: 600 }}>
                      Bebas Biaya Extra Mitra (0%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OWNER TAB 3: KEUANGAN & REKAP KESELURUHAN MITRA */}
          {ownerActiveTab === 'keuangan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid var(--border-color)',
                borderRadius: '18px',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={24} color="#a78bfa" />
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                      Monitoring Finansial &amp; Settlement Seluruh Mitra
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Rekap perputaran uang UMKM, bagi hasil, dan pendapatan admin platform KostKu.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'today', label: 'Hari Ini' },
                      { id: 'month', label: 'Bulan Ini' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setOwnerKeuanganFilter(f.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: ownerKeuanganFilter === f.id ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: ownerKeuanganFilter === f.id ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          color: ownerKeuanganFilter === f.id ? '#c084fc' : '#94a3b8'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePrintKeuangan('owner')}
                    style={{
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Printer size={15} />
                    <span>🖨️ Cetak Rekap Owner</span>
                  </button>
                </div>
              </div>

              {/* STAT SUMMARY */}
              {(() => {
                const targetOrders = orders.filter(o => {
                  if (ownerKeuanganFilter === 'today') return getIsToday(o.createdAt);
                  if (ownerKeuanganFilter === 'month') return getIsThisMonth(o.createdAt);
                  return true;
                });
                const completed = targetOrders.filter(o => o.status?.includes('Selesai') || o.lifecycleStatus === 'completed' || o.paymentStatus === 'paid');
                const totalGross = completed.reduce((sum, o) => sum + (Number(o.total || o.totalPrice || 0)), 0);
                const platformIncome = completed.length * 100;
                const totalNetMitra = Math.max(0, totalGross - platformIncome);

                return (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '12px',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Omset Mitra</div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          Rp {totalGross.toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Dari {completed.length} transaksi selesai</span>
                      </div>

                      <div style={{ background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>Total Pendapatan Admin Platform</div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#34d399', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          Rp {platformIncome.toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Rp 100 x {completed.length} transaksi</span>
                      </div>

                      <div style={{ background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(139, 92, 246, 0.35)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 600 }}>Net Disalurkan ke Mitra</div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#c084fc', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          Rp {totalNetMitra.toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Via Unified Wallet &amp; Pembayaran Mandiri</span>
                      </div>

                      <div style={{ background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Toko Terdaftar</div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', marginTop: '2px' }}>
                          {merchants.length} <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Mitra UMKM</span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Semua mitra terintegrasi</span>
                      </div>
                    </div>

                    {/* TABLE: ALL MITRA TRANSACTIONS */}
                    <div style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc' }}>
                          Riwayat Transaksi Mitra Global
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          Status: Lunas / Sukses
                        </span>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                              <th style={{ padding: '10px 14px' }}>ID / Waktu</th>
                              <th style={{ padding: '10px 14px' }}>Toko Mitra</th>
                              <th style={{ padding: '10px 14px' }}>Pembeli</th>
                              <th style={{ padding: '10px 14px' }}>Metode</th>
                              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total</th>
                              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Admin (Rp 100)</th>
                              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Netto Mitra</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completed.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                  Belum ada transaksi pada periode ini.
                                </td>
                              </tr>
                            ) : (
                              completed.map((o, idx) => {
                                const orderAmount = Number(o.total || o.totalPrice || 0);
                                const fee = 100;
                                const netAmount = Math.max(0, orderAmount - fee);
                                const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
                                const method = (o.paymentMethod || '').toLowerCase() === 'custom_qris' ? 'QRIS Mandiri' : (o.paymentMethod || '').toLowerCase().includes('bank') ? 'TF Pribadi' : (o.paymentMethod || 'QRIS').toUpperCase();

                                return (
                                  <tr key={o.id ? `${o.id}-${idx}` : idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <td style={{ padding: '10px 14px' }}>
                                      <div style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>#{o.id}</div>
                                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{dateStr}</div>
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#38bdf8' }}>
                                      {o.merchantName || '-'}
                                    </td>
                                    <td style={{ padding: '10px 14px', color: '#e2e8f0' }}>
                                      {o.userName || o.customerName || 'Penghuni'} ({o.roomNumber ? `Kmr ${o.roomNumber}` : 'Toko'})
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', fontWeight: 700 }}>
                                        {method}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                                      Rp {orderAmount.toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                                      +Rp {fee.toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                                      Rp {netAmount.toLocaleString('id-ID')}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TOP UP SALDO KUOTA NOTA MITRA (RP 100 / NOTA)
          ───────────────────────────────────────────────────────────── */}
      {showTopupModal && createPortal(
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
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1.5px solid #bfdbfe' : '1.5px solid rgba(59, 130, 246, 0.45)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.5rem',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={22} color="#38bdf8" />
                  <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                    Top Up Saldo Kuota Nota
                  </h3>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Harga flat: <strong>Rp 100 / Lembar Nota</strong> (sama kayak biaya admin platform).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                style={{ background: 'rgba(255, 255, 255, 0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '50%', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Balance */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#93c5fd' }}>Saldo Kuota Saat Ini:</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  Rp {saldoNota.toLocaleString('id-ID')}
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800 }}>
                {kuotaNota} Nota
              </span>
            </div>

            {/* Package Options */}
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
              Pilih Paket Kuota Nota:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
              {[
                { notas: 50, amount: 5000, label: '50 Nota', tag: 'Hemat' },
                { notas: 100, amount: 10000, label: '100 Nota', tag: 'Populer' },
                { notas: 250, amount: 25000, label: '250 Nota', tag: 'Best Value' },
                { notas: 500, amount: 50000, label: '500 Nota', tag: 'Bisnis' }
              ].map(pkg => (
                <button
                  key={pkg.notas}
                  type="button"
                  onClick={() => setTopupAmount(pkg.amount)}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: topupAmount === pkg.amount ? '1.5px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: topupAmount === pkg.amount ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: topupAmount === pkg.amount ? '#60a5fa' : '#f8fafc' }}>
                      {pkg.label}
                    </span>
                    <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: topupAmount === pkg.amount ? '#2563eb' : 'rgba(255,255,255,0.08)', color: '#ffffff' }}>
                      {pkg.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
                    Rp {pkg.amount.toLocaleString('id-ID')}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
                Atau Masukkan Nominal Sendiri (Kelipatan Rp 100):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>Rp</span>
                <input
                  type="number"
                  step="100"
                  min="100"
                  value={topupAmount}
                  onChange={e => setTopupAmount(Math.max(100, Number(e.target.value)))}
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}
                />
                <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  = {Math.floor(topupAmount / 100)} Nota
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={topupLoading}
              onClick={() => handleTopupNotaSubmit()}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontWeight: 800,
                fontSize: '0.92rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <QrCode size={18} />
              <span>{topupLoading ? 'Memproses Top Up...' : `Bayar & Tambah +${Math.floor(topupAmount / 100)} Nota (Rp ${topupAmount.toLocaleString('id-ID')})`}</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TAMBAH TOKO BARU (MULTI-STORE 1 OWNER)
          ───────────────────────────────────────────────────────────── */}
      {showAddStoreModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.5)' : 'rgba(5, 10, 20, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }} className="animate-fade-in">
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1.5px solid #bfdbfe' : '1.5px solid rgba(59, 130, 246, 0.45)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={22} color="#3b82f6" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                    Buka Toko / Layanan Baru
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  1 Akun Owner dapat memiliki banyak toko (Kantin, Laundry, Galon, Jasa, dll).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStoreModal(false)}
                style={{ background: 'rgba(255, 255, 255, 0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '50%', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStore} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '5px' }}>
                  Nama Toko / Layanan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Laundry Kilat 24 Jam, Depot Air Biru, Kantin Mas Bro"
                  value={newStoreForm.name}
                  onChange={e => setNewStoreForm(prev => ({ ...prev, name: e.target.value }))}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '5px' }}>
                    Kategori Toko *
                  </label>
                  <select
                    value={newStoreForm.category}
                    onChange={e => {
                      const cat = e.target.value;
                      const iconMap = {
                        makanan: '🍱',
                        laundry: '🧺',
                        galon: '💧',
                        service: '❄️',
                        kelontong: '🏪',
                        lainnya: '✨'
                      };
                      setNewStoreForm(prev => ({ ...prev, category: cat, icon: iconMap[cat] || '🏪' }));
                    }}
                    className="form-control"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
                  >
                    <option value="makanan">🍱 Makanan & Minuman</option>
                    <option value="laundry">🧺 Laundry & Cuci</option>
                    <option value="galon">💧 Air Galon & Gas</option>
                    <option value="service">❄️ Service AC & Elektronik</option>
                    <option value="kelontong">🏪 Toko Kelontong & Snack</option>
                    <option value="lainnya">✨ Layanan Lainnya</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '5px' }}>
                    Ikon / Logo Emoji
                  </label>
                  <input
                    type="text"
                    value={newStoreForm.icon}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, icon: e.target.value }))}
                    className="form-control"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', textAlign: 'center', fontSize: '1.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '5px' }}>
                  No. WhatsApp Toko / Admin *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={newStoreForm.phone}
                  onChange={e => setNewStoreForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '5px' }}>
                  Alamat / Posisi Fisik Toko
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ruko samping gerbang kost / Lantai 1 depan musholla"
                  value={newStoreForm.address}
                  onChange={e => setNewStoreForm(prev => ({ ...prev, address: e.target.value }))}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '5px' }}>
                    Metode Layanan
                  </label>
                  <select
                    value={newStoreForm.deliveryType}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, deliveryType: e.target.value }))}
                    className="form-control"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
                  >
                    <option value="both">🛵 Antar & Ambil di Ruko</option>
                    <option value="delivery">🛵 Hanya Antar ke Kamar</option>
                    <option value="pickup">🏪 Hanya Ambil di Toko</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '5px' }}>
                    Ongkir Standar (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newStoreForm.deliveryFee}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, deliveryFee: Number(e.target.value) }))}
                    className="form-control"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
                  />
                </div>
              </div>

              <div style={{
                background: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '14px',
                padding: '12px 14px',
                fontSize: '0.78rem',
                color: isLight ? '#1e40af' : '#93c5fd',
                lineHeight: 1.5
              }}>
                ✦ <strong>Bonus Kuota Awal:</strong> Setiap toko baru yang dibuka langsung mendapatkan <strong>50 lembar saldo nota gratis (Rp 5.000)</strong> untuk operasional kasir & POS.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {actionLoading ? 'Menyimpan...' : '✓ Buka Toko Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TAMBAH MENU BARU (UNTUK MITRA)
          ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          MODAL: TAMBAH MENU BARU (UNTUK MITRA) DENGAN AI SENSOR DETECTOR
          ───────────────────────────────────────────────────────────── */}
      {showAddMenuModal && createPortal(
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
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1.5px solid #fde68a' : '1.5px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '94vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: isLight ? '0 20px 40px rgba(0, 0, 0, 0.1)' : '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={20} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                    Tambah Menu / Layanan Baru
                  </h3>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  Wajib foto asli kamera HP dengan sensor fingerprint scanner terverifikasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddMenuModal(false);
                  setImageDetectorState({
                    isScanning: false,
                    result: null,
                    activePreview: '',
                    sourceType: 'none',
                    error: null
                  });
                }}
                style={{ background: 'rgba(255, 255, 255, 0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '50%', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Menu / Produk:
                </label>
                <input
                  type="text"
                  required
                  value={newMenuItem.name}
                  onChange={e => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  placeholder="Contoh: Es Teh Manis Jumbo / Nasi Uduk"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Harga Jual ke Penghuni (Rp):
                  </label>
                  <input
                    type="number"
                    required
                    value={newMenuItem.price}
                    onChange={e => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                    placeholder="Contoh: 15000"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Porsi / Satuan:
                  </label>
                  <input
                    type="text"
                    value={newMenuItem.desc}
                    onChange={e => setNewMenuItem({ ...newMenuItem, desc: e.target.value })}
                    placeholder="Contoh: 1 Porsi Kenyang / Cup Jumbo"
                    className="input-field"
                  />
                </div>
              </div>

              {/* ── FOTO MENU DENGAN AI VS REAL CAMERA SENSOR DETECTOR (FNB) ATAU LOGO RESMI (NON-FNB) ── */}
              {(() => {
                const isCurrentFnB = currentMerchant?.category === 'makanan' ||
                                     currentMerchant?.category === 'Warung & Kuliner' ||
                                     (currentMerchant?.name || '').toLowerCase().includes('makan') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('warung') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('resto') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('bento') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('roti') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('martabak');

                if (!isCurrentFnB) {
                  return (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
                      border: '1.5px dashed rgba(56, 189, 248, 0.45)',
                      borderRadius: '16px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                      }}>
                        {currentMerchant?.icon || '💧'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Layanan Non-FnB ({currentMerchant?.name || 'Toko'})</span>
                          <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.25)', color: '#38bdf8', fontWeight: 800 }}>
                            🏷️ Cukup Logo Toko
                          </span>
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
                          Layanan non-makanan (galon, laundry, gas, jasa) <strong>tidak wajib foto produk kamera</strong>. Logo dan identitas resmi toko Anda otomatis tampil di etalase dan menu pesanan anak kost.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: '16px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={16} color="#38bdf8" />
                    <span>Foto Produk Asli (Wajib Kamera Nyata)</span>
                  </label>
                  <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                    🔍 Anti-AI Detector
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  Sistem memeriksa <strong>pixel defect & noise sensor CMOS</strong> (PRNU Poisson Shot Noise). Gambar render AI dengan permukaan "pure no defect" otomatis terdeteksi & ditolak.
                </p>

                {/* Input Buttons: Kamera Langsung vs Upload File */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleScanImageSource(e.target.files[0], 'camera');
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleScanImageSource(e.target.files[0], 'file');
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.45)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      color: '#93c5fd',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Camera size={14} />
                    <span>Ambil Foto HP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      color: '#e2e8f0',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={14} />
                    <span>Pilih Berkas Galeri</span>
                  </button>
                </div>

                {/* Atau URL Input */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="url"
                    value={newMenuItem.image || ''}
                    onChange={e => setNewMenuItem({ ...newMenuItem, image: e.target.value })}
                    onBlur={() => {
                      if (newMenuItem.image && newMenuItem.image !== imageDetectorState.activePreview) {
                        handleScanImageSource(newMenuItem.image, 'url');
                      }
                    }}
                    placeholder="Atau tempel URL gambar di sini..."
                    className="input-field"
                    style={{ fontSize: '0.78rem', padding: '7px 10px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newMenuItem.image) handleScanImageSource(newMenuItem.image, 'url');
                    }}
                    disabled={imageDetectorState.isScanning || !newMenuItem.image}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: imageDetectorState.isScanning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Scan size={13} />
                    <span>Scan</span>
                  </button>
                </div>

                {/* Preset Testing Bar untuk Mbak Rena langsung tes */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '8px 10px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={11} color="#f59e0b" />
                    <span>Uji Coba Detektor (Preset Kamera Asli vs Render AI):</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleScanImageSource(PRESET_DETECTOR_SAMPLES.REAL_CAMERA_SHOT.getSrc(), 'preset')}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#34d399',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      📸 Uji Jepretan Kamera HP Asli (Ada Sensor Noise)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScanImageSource(PRESET_DETECTOR_SAMPLES.AI_SYNTHETIC_RENDER.getSrc(), 'preset')}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🤖 Uji Render AI Murni (Zero-Defect)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScanImageSource(PRESET_DETECTOR_SAMPLES.STOCK_INTERNET_FOOD.getSrc(), 'preset')}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🌐 Uji Foto Stock Internet (Airbrushed Ditolak)
                    </button>
                  </div>
                </div>

                {/* ── LIVE FORENSIC SCANNER HUD ── */}
                {(newMenuItem.image || imageDetectorState.activePreview || imageDetectorState.isScanning) && (
                  <div style={{
                    position: 'relative',
                    background: isLight ? '#f8fafc' : '#090d16',
                    border: imageDetectorState.result?.verdict === 'REAL_CAMERA'
                      ? '1.5px solid #10b981'
                      : imageDetectorState.result?.verdict === 'AI_GENERATED'
                      ? '1.5px solid #ef4444'
                      : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.4)'),
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Visual Preview Box */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '140px',
                      background: '#020617',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={imageDetectorState.activePreview || newMenuItem.image}
                        alt="Preview Foto"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />

                      {/* Radar Laser Scanning Animation */}
                      {imageDetectorState.isScanning && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(15, 23, 42, 0.55)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10
                        }}>
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'linear-gradient(90deg, transparent, #38bdf8, #22c55e, transparent)',
                            boxShadow: '0 0 12px 3px #22c55e',
                            animation: 'radarScan 1.6s ease-in-out infinite'
                          }} />
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.85)',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #38bdf8',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <Scan size={14} className="animate-spin" />
                            <span>MEMINDAI SUB-PIXEL SENSOR NOISE & DEFECT...</span>
                          </div>
                        </div>
                      )}

                      {/* Result Badge Overlay */}
                      {!imageDetectorState.isScanning && imageDetectorState.result && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          right: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          zIndex: 5
                        }}>
                          {imageDetectorState.result.verdict === 'REAL_CAMERA' ? (
                            <span style={{
                              fontSize: '0.70rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(6, 78, 59, 0.95)',
                              color: '#34d399',
                              border: '1px solid #10b981',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                            }}>
                              <ShieldCheck size={13} />
                              <span>FOTO KAMERA ASLI LOLOS</span>
                            </span>
                          ) : imageDetectorState.result.verdict === 'AI_GENERATED' ? (
                            <span style={{
                              fontSize: '0.70rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(127, 29, 29, 0.95)',
                              color: '#fca5a5',
                              border: '1px solid #ef4444',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                            }}>
                              <AlertTriangle size={13} />
                              <span>TERDETEKSI GENERASI AI (ZERO-DEFECT)</span>
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.70rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(120, 53, 15, 0.95)',
                              color: '#fcd34d',
                              border: '1px solid #f59e0b',
                              fontWeight: 800
                            }}>
                              ⚠️ PERLU CEK ULANG KAMERA
                            </span>
                          )}

                          <span style={{
                            fontSize: '0.65rem',
                            padding: '3px 7px',
                            borderRadius: '6px',
                            background: 'rgba(0,0,0,0.75)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}>
                            {imageDetectorState.result.sensorScore}% Sensor Match
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Result Metrics Analysis */}
                    {imageDetectorState.result && (
                      <div style={{
                        padding: '10px 12px',
                        background: imageDetectorState.result.verdict === 'REAL_CAMERA'
                          ? 'rgba(6, 78, 59, 0.15)'
                          : 'rgba(127, 29, 29, 0.15)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{
                          fontSize: '0.72rem',
                          color: imageDetectorState.result.verdict === 'REAL_CAMERA' ? '#86efac' : '#fca5a5',
                          lineHeight: 1.4,
                          marginBottom: '8px'
                        }}>
                          {imageDetectorState.result.explanation}
                        </div>

                        {/* 3-Column Metrics Breakdown */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '6px',
                          textAlign: 'center'
                        }}>
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Sensor Defect</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
                              {imageDetectorState.result.defectDensity}%
                            </div>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Noise PRNU</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
                              {imageDetectorState.result.sensorNoiseScore}
                            </div>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>AI Probability</div>
                            <div style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: imageDetectorState.result.aiProbability > 50 ? '#ef4444' : '#10b981'
                            }}>
                              {imageDetectorState.result.aiProbability}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

              {/* Best Seller Checkbox */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(newMenuItem.isBestSeller)}
                    onChange={e => setNewMenuItem({ ...newMenuItem, isBestSeller: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🔥 Tandai Sebagai Menu Best Seller
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#94a3b8', marginTop: '2px' }}>
                      Menu ini akan ditampilkan paling depan dengan badge Best Seller di dashboard anak kost.
                    </div>
                  </div>
                </label>
              </div>

              {(() => {
                const isCurrentFnB = currentMerchant?.category === 'makanan' ||
                                     currentMerchant?.category === 'Warung & Kuliner' ||
                                     (currentMerchant?.name || '').toLowerCase().includes('makan') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('warung') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('resto') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('bento') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('roti') ||
                                     (currentMerchant?.name || '').toLowerCase().includes('martabak');

                return (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMenuModal(false);
                        setImageDetectorState({
                          isScanning: false,
                          result: null,
                          activePreview: '',
                          sourceType: 'none',
                          error: null
                        });
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '10px' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isCurrentFnB ? (imageDetectorState.isScanning || !imageDetectorState.result || imageDetectorState.result?.verdict !== 'REAL_CAMERA') : false}
                      className="btn btn-primary"
                      style={{
                        flex: 2,
                        padding: '10px',
                        fontWeight: 700,
                        background: !isCurrentFnB
                          ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                          : (!imageDetectorState.result || imageDetectorState.result?.verdict !== 'REAL_CAMERA')
                          ? '#475569'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        cursor: (isCurrentFnB && (imageDetectorState.isScanning || !imageDetectorState.result || imageDetectorState.result?.verdict !== 'REAL_CAMERA')) ? 'not-allowed' : 'pointer',
                        opacity: (isCurrentFnB && (imageDetectorState.isScanning || !imageDetectorState.result || imageDetectorState.result?.verdict !== 'REAL_CAMERA')) ? 0.6 : 1
                      }}
                    >
                      {!isCurrentFnB
                        ? '✅ Simpan Layanan Non-FnB (Logo Resmi)'
                        : imageDetectorState.isScanning
                        ? 'Memindai Sensor Noise...'
                        : !imageDetectorState.result
                        ? 'Wajib Foto Kamera Asli'
                        : imageDetectorState.result?.verdict === 'AI_GENERATED'
                        ? '❌ Foto AI / Stock Ditolak'
                        : '🛡️ Simpan Menu Kamera Asli'}
                    </button>
                  </div>
                );
              })()}
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DAFTARKAN MITRA BARU (UNTUK OWNER)
          ───────────────────────────────────────────────────────────── */}
      {showAddModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }} className="animate-fade-in">
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: isLight ? '0 20px 40px rgba(0, 0, 0, 0.1)' : '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Store size={22} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Daftarkan Mitra / Toko Baru
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMerchantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Toko / Usaha Mitra:
                </label>
                <input
                  type="text"
                  required
                  value={newMerchant.name}
                  onChange={e => setNewMerchant({ ...newMerchant, name: e.target.value })}
                  placeholder="Contoh: Depot Barokah / Melati Laundry"
                  className="input-field"
                />
              </div>

              {/* Input Kode Referral Dua Arah: 500 Kuota Nota Gratis untuk Toko + 500 Poin untuk Pengajak */}
              <div style={{
                background: isLight ? '#f0fdf4' : 'rgba(34, 197, 94, 0.12)',
                border: isLight ? '1.5px solid #86efac' : '1px solid rgba(34, 197, 94, 0.35)',
                borderRadius: '14px',
                padding: '14px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: isLight ? '#166534' : '#86efac', marginBottom: '5px', fontWeight: 800 }}>
                  <Sparkles size={15} color="#22c55e" />
                  Punya Kode Referral Teman / Anak Kost?
                </label>
                <input
                  type="text"
                  value={newMerchant.referralCode || ''}
                  onChange={e => setNewMerchant({ ...newMerchant, referralCode: e.target.value.toUpperCase() })}
                  placeholder="Contoh: KOST-RYAN7"
                  className="input-field"
                  style={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}
                />
                
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.2)',
                  color: isLight ? '#15803d' : '#86efac',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  marginTop: '6px',
                  lineHeight: 1.3
                }}>
                  🎁 Masukkan kode referral untuk mendapatkan <strong>500 Kuota Transaksi Kasir GRATIS</strong> (Hemat Rp 50.000)!
                </div>

                {newMerchant.referralCode && newMerchant.referralCode.trim().length >= 3 && (
                  <div style={{
                    fontSize: '0.74rem',
                    color: '#16a34a',
                    fontWeight: 800,
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <CheckCircle size={14} color="#16a34a" />
                    <span>[✓] Kode Referral Aktif! 500 Kuota Nota Siap Diklaim.</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Kategori:
                  </label>
                  <select
                    value={newMerchant.category}
                    onChange={e => setNewMerchant({ ...newMerchant, category: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '9px 10px', fontSize: '0.82rem' }}
                  >
                    <option value="Warung & Kuliner">Warung & Kuliner</option>
                    <option value="Laundry & Cuci">Laundry & Cuci</option>
                    <option value="Depot Air & Gas">Depot Air & Gas</option>
                    <option value="Minimarket & Sembako">Minimarket & Sembako</option>
                    <option value="Servis AC & Elektronik">Servis AC & Elektronik</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Nomor WhatsApp:
                  </label>
                  <input
                    type="tel"
                    value={newMerchant.phone}
                    onChange={e => setNewMerchant({ ...newMerchant, phone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Alamat / Lokasi Toko:
                </label>
                <input
                  type="text"
                  value={newMerchant.address}
                  onChange={e => setNewMerchant({ ...newMerchant, address: e.target.value })}
                  placeholder="Contoh: Sebelah gapura gerbang kost"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Logo Toko Mitra (URL Gambar):
                </label>
                <input
                  type="url"
                  value={newMerchant.logo || ''}
                  onChange={e => setNewMerchant({ ...newMerchant, logo: e.target.value })}
                  placeholder="Contoh: https://images.unsplash.com/photo-..."
                  className="input-field"
                />
                {newMerchant.logo && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={newMerchant.logo}
                      alt="Preview Logo"
                      style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Logo terdeteksi</span>
                  </div>
                )}
              </div>

              {/* Delivery mode & Ongkir per KM */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    Opsi Pengantaran:
                  </label>
                  <select
                    value={newMerchant.deliveryType}
                    onChange={e => setNewMerchant({ ...newMerchant, deliveryType: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '9px 10px', fontSize: '0.82rem' }}
                  >
                    <option value="both">Bisa Diantar & Ambil di Ruko</option>
                    <option value="delivery">Hanya Bisa Diantar</option>
                    <option value="pickup">Harus Ambil di Ruko</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    Tarif Ongkir / KM (Rp):
                  </label>
                  <input
                    type="number"
                    value={newMerchant.deliveryFeePerKm || 2500}
                    onChange={e => setNewMerchant({ ...newMerchant, deliveryFeePerKm: Number(e.target.value) })}
                    placeholder="2500"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Jam Pengantaran Kurir Toko */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Jam Mulai Kirim:
                  </label>
                  <input
                    type="time"
                    value={newMerchant.deliveryStartTime || '07:30'}
                    onChange={e => setNewMerchant({ ...newMerchant, deliveryStartTime: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Jam Terakhir Kirim:
                  </label>
                  <input
                    type="time"
                    value={newMerchant.deliveryEndTime || '21:00'}
                    onChange={e => setNewMerchant({ ...newMerchant, deliveryEndTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Info Bebas Komisi Tunai & Reward Poin */}
              <div style={{
                background: isLight ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.12)',
                border: isLight ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '12px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: isLight ? '#b45309' : '#fbbf24', fontWeight: 700 }}>
                  <span>🪙</span> Reward Poin Transaksi (Bebas Biaya Extra Owner)
                </div>
                <div style={{ fontSize: '0.72rem', color: isLight ? '#78350f' : '#fef3c7', marginTop: '4px', lineHeight: 1.4 }}>
                  Biaya extra owner dihapus (0% potongan ke mitra). Sebagai gantinya, Anda mendapatkan reward <strong>+100 Poin (Rp 100)</strong> per transaksi pesanan berhasil. Admin KostKu tetap Flat Rp 500.
                </div>
              </div>

              {/* Starter Product */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#f8fafc', fontWeight: 700, marginBottom: '6px' }}>
                  Produk / Menu Perdana:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    value={newMerchant.productName}
                    onChange={e => setNewMerchant({ ...newMerchant, productName: e.target.value })}
                    placeholder="Nama menu perdana"
                    className="input-field"
                  />
                  <input
                    type="number"
                    value={newMerchant.productPrice}
                    onChange={e => setNewMerchant({ ...newMerchant, productPrice: e.target.value })}
                    placeholder="Harga Rp"
                    className="input-field"
                  />
                </div>
                <input
                  type="url"
                  value={newMerchant.productImage || ''}
                  onChange={e => setNewMerchant({ ...newMerchant, productImage: e.target.value })}
                  placeholder="URL Foto Menu Perdana (opsional)"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingMerchant}
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '10px', fontWeight: 700 }}
                >
                  {addingMerchant ? 'Menyimpan...' : 'Daftarkan Mitra'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
