import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Zap
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
  apiUpdateOwnerMerchantSettings
} from '../services/api';
import { useTheme } from '../context/ThemeContext';

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
  const [storeOpeningHours, setStoreOpeningHours] = useState('08:00 - 22:00 WIB');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeIsOpen, setStoreIsOpen] = useState(true);

  // ── OWNER VIEW SPECIFIC STATES ────────────────────────────────────
  const [ownerActiveTab, setOwnerActiveTab] = useState('mitra'); // 'mitra' | 'orders' | 'escrow'
  const [subTypeTab, setSubTypeTab] = useState('all'); // 'all' | 'personal' | 'affiliate'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Owner Admin Fee Setting State (Setting admin owner untuk ads mitra, flat KostKu 500)
  const [ownerAdsFee, setOwnerAdsFee] = useState(1000);
  const [savingOwnerFee, setSavingOwnerFee] = useState(false);

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
    commissionOwner: 1000,
    platformFee: 500, // Flat Rp 500 KostKu
    deliveryType: 'both',
    deliveryFee: 2000,
    logo: '',
    qrisImage: '',
    isAffiliate: false,
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
        apiGetPartnerOrders(targetKostUid, null, isMitraUser ? (user?.merchantId || 'PTR-DEF-03') : null).catch(() => [])
      ]);

      const isDemoMerchant = (m) => {
        if (!m) return true;
        if (m.isDemo) return true;
        const id = String(m.id || '').toUpperCase();
        if (id.includes('DEF') || id.includes('BDG') || id.includes('SHARED') || id.includes('EXT') || id.includes('DEMO')) return true;
        const name = String(m.name || '').toLowerCase();
        if (
          name.includes('bu siti') || 
          name.includes('barokah') || 
          name.includes('mas dimas') || 
          name.includes('melati express') || 
          name.includes('bangka 99') || 
          name.includes('bu dian') ||
          name.includes('dago clean')
        ) return true;
        return false;
      };

      const realMerchants = Array.isArray(merchRes) ? merchRes.filter(m => !isDemoMerchant(m)) : [];
      const activeList = realMerchants;
      setMerchants(activeList);
      if (sumRes) setSummary(sumRes);

      // Determine active merchant for Mitra Portal
      if (isMitraUser) {
        let matched = activeList.find(m => 
          String(m.ownerUserId) === String(user.id) || 
          String(m.id) === String(user.merchantId) ||
          m.name.toLowerCase().includes(user.name.toLowerCase())
        );
        if (!matched && activeList.length > 0) {
          matched = activeList[0];
        }
        if (matched) {
          setCurrentMerchant(matched);
          setStoreLogo(matched.logo || '');
          setStoreDeliveryType(matched.deliveryType || 'both');
          setStoreDeliveryFee(matched.deliveryFee ?? 2000);
          setStoreOpeningHours(matched.openingHours || '08:00 - 22:00 WIB');
          setStorePhone(matched.phone || user.phone || '');
          setStoreAddress(matched.address || '');
          setStoreIsOpen(matched.isOpen !== false);
        }
      }

      // Sample orders with lifecycle status (kosong untuk persiapan mitra real)
      const defaultSampleOrders = [];

      // Merge backend orders with defaults so lifecycle demo cards are always present and interactive
      let mergedOrders = Array.isArray(ordersRes) ? [...ordersRes].filter(o => !isDemoMerchant({ id: o.merchantId, name: o.merchantName })) : [];
      if (isMitraUser) {
        mergedOrders = mergedOrders.filter(o => !o.merchantId || String(o.merchantId) === String(user?.merchantId));
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
        openingHours: storeOpeningHours.trim(),
        phone: storePhone.trim(),
        address: storeAddress.trim(),
        isOpen: storeIsOpen
      };

      await apiUpdateMerchant(currentMerchant.id, payload);
      const updated = { ...currentMerchant, ...payload };
      setCurrentMerchant(updated);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      showToast('✅ Pengaturan toko & opsi pengantaran berhasil disimpan!');
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengaturan toko');
    }
  };

  // ── OWNER VIEW: SAVE OWNER ADS / ADMIN FEE SETTING ────────────────
  const handleSaveOwnerAdsFee = async (e) => {
    if (e) e.preventDefault();
    setSavingOwnerFee(true);
    try {
      const cleanFee = Math.max(0, Number(ownerAdsFee));
      const res = await apiUpdateOwnerMerchantSettings({
        kostUid: targetKostUid,
        defaultCommissionOwner: cleanFee,
        applyToAll: true
      });

      // Update local state
      setMerchants(prev => prev.map(m => ({ ...m, commissionOwner: cleanFee, platformFee: 500 })));
      showToast(res?.message || `✅ Biaya admin owner diset Rp ${cleanFee.toLocaleString('id-ID')} (KostKu flat Rp 500, admin fee dijadiin satu)!`);
    } catch (err) {
      alert(err.message || 'Gagal menyimpan setting biaya admin owner');
    } finally {
      setSavingOwnerFee(false);
    }
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
        commissionOwner: Math.max(0, Number(newMerchant.commissionOwner) || 1000),
        platformFee: 500, // Flat Rp 500 KostKu
        deliveryType: newMerchant.deliveryType || 'both',
        deliveryFee: Number(newMerchant.deliveryFee) || 0,
        logo: newMerchant.logo?.trim() || null,
        qrisImage: newMerchant.qrisImage.trim() || null,
        isAffiliate: newMerchant.isAffiliate,
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
          commissionOwner: 1000,
          platformFee: 500,
          deliveryType: 'both',
          deliveryFee: 2000,
          logo: '',
          qrisImage: '',
          isAffiliate: false,
          productName: 'Paket Nasi Hemat Spesial',
          productPrice: 18000,
          productDesc: 'Porsi pas untuk anak kost',
          productImage: ''
        });
        showToast('✅ Mitra UMKM baru berhasil didaftarkan!');
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
              maxWidth: '720px'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc' }}>
                Pengaturan Opsi Pengantaran & Toko
              </h3>

              <form onSubmit={handleSaveStoreSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1. Opsi Pengantaran: Bisa Diantar vs Harus Ambil di Ruko */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                    Opsi Pengantaran Pesanan ke Kamar Anak Kost:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { id: 'both', label: 'Bisa Diantar Maupun Ambil Sendiri di Ruko (Direkomendasikan)', desc: 'Penghuni kost bisa memilih pesanan diantar langsung ke kamar atau diambil di ruko Anda.' },
                      { id: 'delivery', label: 'Hanya Bisa Diantar ke Kamar', desc: 'Pesanan selalu diantar sampai depan pintu kamar penghuni.' },
                      { id: 'pickup', label: 'Harus Ambil Sendiri di Ruko / Toko', desc: 'Penghuni kost harus datang langsung ke ruko / toko Anda untuk mengambil pesanan.' }
                    ].map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setStoreDeliveryType(opt.id)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: storeDeliveryType === opt.id ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: storeDeliveryType === opt.id ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}
                      >
                        <input
                          type="radio"
                          name="mitraDeliveryType"
                          checked={storeDeliveryType === opt.id}
                          onChange={() => setStoreDeliveryType(opt.id)}
                          style={{ accentColor: '#f59e0b', marginTop: '3px' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: storeDeliveryType === opt.id ? '#fbbf24' : '#f8fafc' }}>
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

                {/* 2. Ongkir Flat */}
                {storeDeliveryType !== 'pickup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Tarif Ongkos Kirim Flat ke Kamar (Rp):
                    </label>
                    <input
                      type="number"
                      value={storeDeliveryFee}
                      onChange={e => setStoreDeliveryFee(e.target.value)}
                      placeholder="Contoh: 2000 (Isi 0 untuk gratis)"
                      className="input-field"
                      style={{ maxWidth: '300px' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                      Tarif flat yang dibayarkan penghuni untuk jasa antar sampai depan kamar kost (0 = Bebas Ongkir).
                    </span>
                  </div>
                )}

                {/* 3. Jam Operasional & Nomor WA */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Jam Operasional:
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
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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

                {/* 4. Alamat Ruko */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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

                {/* 5. Logo / Foto Toko Mitra */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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
                        style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#10b981' }}>Preview logo mitra aktif</span>
                    </div>
                  )}
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                    Logo akan ditampilkan pada avatar mitra di dashboard anak kost dan modal pesanan.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    justifyContent: 'center',
                    marginTop: '0.5rem'
                  }}
                >
                  Simpan Pengaturan Toko
                </button>
              </form>
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

            {/* ═══════════════════════════════════════════════════════════
                SETTING ADMIN/ADS OWNER PER TRANSAKSI MITRA
                (Permintaan User: Setting admin owner bisa diatur di mitra owner,
                admin KostKu flat Rp 500, admin fee dijadiin satu di pemesan)
                ═══════════════════════════════════════════════════════════ */}
            <div style={{
              marginTop: '1.5rem',
              background: isLight ? 'rgba(37, 99, 235, 0.05)' : 'rgba(56, 189, 248, 0.08)',
              border: isLight ? '1px solid rgba(37, 99, 235, 0.22)' : '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '14px',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={18} color={isLight ? '#2563eb' : '#38bdf8'} />
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Setting Biaya Admin / Ads Owner Per Transaksi Mitra:
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    Biaya admin KostKu <strong style={{ color: isLight ? '#16a34a' : '#4ade80' }}>Flat Rp 500</strong>. Di sisi anak kost (checkout), admin owner & admin KostKu <strong>dijadikan satu</strong> agar transparan dan tidak membingungkan.
                  </div>
                </div>

                {/* Setting Input */}
                <form onSubmit={handleSaveOwnerAdsFee} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Rp</span>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={ownerAdsFee}
                      onChange={e => setOwnerAdsFee(e.target.value)}
                      className="input-field"
                      style={{ width: '110px', padding: '6px 10px', fontSize: '0.88rem', fontWeight: 800, color: isLight ? '#1d4ed8' : '#38bdf8' }}
                      title="Atur komisi/ads fee owner per transaksi mitra"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingOwnerFee}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    {savingOwnerFee ? <RefreshCw size={13} className="animate-spin" /> : 'Simpan Setting'}
                  </button>
                </form>
              </div>

              <div style={{ marginTop: '8px', fontSize: '0.72rem', color: isLight ? '#1d4ed8' : '#93c5fd', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>✦ Komisi Owner: <strong>Rp {Number(ownerAdsFee || 0).toLocaleString('id-ID')}</strong></span>
                <span>✦ Admin KostKu: <strong>Flat Rp 500</strong></span>
                <span>✦ Total Admin Fee di Pemesan (Dijadikan Satu): <strong style={{ color: isLight ? '#16a34a' : '#4ade80' }}>Rp {(Number(ownerAdsFee || 0) + 500).toLocaleString('id-ID')}</strong></span>
              </div>
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

              <div style={{ background: isLight ? 'rgba(22, 163, 74, 0.08)' : 'rgba(34, 197, 94, 0.08)', border: isLight ? '1px solid rgba(22, 163, 74, 0.25)' : '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: isLight ? '#15803d' : '#86efac' }}>Saldo Dompet Komisi Owner</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: isLight ? '#16a34a' : '#4ade80', marginTop: '2px' }}>
                  Rp {(unifiedWallet.owner_commission_balance || 35000).toLocaleString('id-ID')}
                </div>
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

                      {/* Fee Breakdown Badge */}
                      <div style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: isLight ? 'rgba(37, 99, 235, 0.05)' : 'rgba(56, 189, 248, 0.06)',
                        border: isLight ? '1px solid rgba(37, 99, 235, 0.15)' : '1px solid rgba(56, 189, 248, 0.2)',
                        fontSize: '0.74rem',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span>Komisi / Ads Owner:</span>
                          <strong style={{ color: isLight ? '#1d4ed8' : '#38bdf8' }}>+Rp {(merchant.commissionOwner || 1000).toLocaleString('id-ID')} / trx</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          <span>Admin KostKu:</span>
                          <span>Flat Rp 500</span>
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
                    <div style={{ fontSize: '0.78rem', color: '#86efac', fontWeight: 700 }}>
                      +Rp {(order.ownerCommission || 1000).toLocaleString('id-ID')} Komisi Owner
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Flat KostKu: Rp 500 (Dijadikan satu)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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

              {/* Delivery mode */}
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
                  <option value="both">Bisa Diantar ke Kamar & Ambil Sendiri di Ruko</option>
                  <option value="delivery">Hanya Bisa Diantar ke Kamar</option>
                  <option value="pickup">Harus Ambil Sendiri di Ruko / Toko</option>
                </select>
              </div>

              {/* Setting Komisi Owner & Platform Fee */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '12px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#93c5fd', marginBottom: '3px', fontWeight: 600 }}>
                      Komisi/Ads Owner (Rp):
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={newMerchant.commissionOwner}
                      onChange={e => setNewMerchant({ ...newMerchant, commissionOwner: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#93c5fd', marginBottom: '3px', fontWeight: 600 }}>
                      Admin KostKu:
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Flat Rp 500"
                      className="input-field"
                      style={{ opacity: 0.8 }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px' }}>
                  Total admin fee dijadiin satu di invoice pemesan: <strong>Rp {((Number(newMerchant.commissionOwner) || 1000) + 500).toLocaleString('id-ID')}</strong>
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
