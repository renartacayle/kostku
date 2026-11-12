import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Building,
  CreditCard,
  Settings,
  Printer,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Check,
  X,
  Volume2,
  VolumeX,
  Flame,
  Coffee,
  Layers,
  Sliders,
  DollarSign,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Sun,
  Moon,
  Trash2,
  Upload,
  Camera,
  Image as ImageIcon,
  Download,
  Users,
  Edit3,
  Bluetooth,
  Usb,
  LayoutGrid,
  List,
  Percent,
  Award,
  MapPin,
  MessageSquare,
  FileText,
  Gift,
  FileSpreadsheet,
  Tag,
  Ticket,
  Calendar,
  ArrowLeft,
  Home,
  BarChart3,
  Package,
  TrendingUp,
  Store,
  AlertCircle,
  ShieldAlert,
  Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { useTheme } from '../context/ThemeContext';
import { triggerCometArc } from '../utils/cometArc';
import {
  getSavedPrinterSettings,
  savePrinterSettings,
  printReceipt,
  connectBluetoothPrinter,
  connectUsbPrinter,
  printViaBrowserDialog,
  getSampleTestOrder,
  getHardwareCapabilities,
  buildEscPosBuffer,
  kickCashDrawer,
  playCashRegisterSound,
  playChime,
  buildKickDrawerBuffer
} from '../utils/thermalPrinter';
import { apiGetAccountWallet, apiMutateAccountWallet } from '../services/api';
import KasirAnalyticsModal from '../components/kasir/KasirAnalyticsModal';
import KasirInventoryModal from '../components/kasir/KasirInventoryModal';

export default function Kasir({ user }) {
  const { isLight, toggleTheme } = useTheme();

  // Dompet Terpadu (Unified Wallet Kasir POS & Mitra UMKM - 1 UID)
  const [walletData, setWalletData] = useState(null);

  // Navigation tab: 'pos' (Kasir Meja - Default) | 'kds' (Dapur) | 'tables' (Meja & QR) | 'settings' (TriPay & Sistem)
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const qTab = new URLSearchParams(window.location.search).get('tab');
      return qTab || 'pos';
    } catch (_) {
      return 'pos';
    }
  });
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // Data States
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [audioAlert, setAudioAlert] = useState(true);

  // POS Direct Register State
  const [posCart, setPosCart] = useState({});
  const [selectedTable, setSelectedTable] = useState('');
  const [posCategory, setPosCategory] = useState('Semua');
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [showMobileCartDrawer, setShowMobileCartDrawer] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  // POS Catalog View Mode: 'grid' (2 Kolom Kartu) vs 'list' (List Ramping Cepat)
  const [posViewMode, setPosViewMode] = useState('grid');
  // Multi-Payment & Cash Register State
  const [posPaymentMethod, setPosPaymentMethod] = useState('CASH'); // 'CASH' | 'QRIS' | 'TRANSFER'
  const [posCashReceived, setPosCashReceived] = useState('');

  // Quick Quantity Modal State (Atur Banyaknya Porsi Menu Ditambahkan)
  const [quickQtyProduct, setQuickQtyProduct] = useState(null);
  const [quickQtyValue, setQuickQtyValue] = useState(1);
  const [cardSelectedQty, setCardSelectedQty] = useState({});

  // Store Location & Validity State (Validasi Toko Resmi)
  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    location: '',
    address: '',
    city: '',
    phone: '',
    isValidated: false,
    merchantId: '',
    uid: '',
    saldoNota: 5000,
    kuotaNota: 50,
    notaHistory: [],
    allOwnerStores: []
  });
  const [showPosTopupModal, setShowPosTopupModal] = useState(false);
  const [posTopupAmount, setPosTopupAmount] = useState(10000);
  const [posTopupLoading, setPosTopupLoading] = useState(false);
  const [tripayTopupData, setTripayTopupData] = useState(null);
  const [tripayCheckingStatus, setTripayCheckingStatus] = useState(false);
  const [tripayStatusFeedback, setTripayStatusFeedback] = useState(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    location: '',
    address: '',
    city: '',
    phone: ''
  });
  const [savingStore, setSavingStore] = useState(false);
  const [storeSaveMsg, setStoreSaveMsg] = useState('');

  // Hardware Thermal Printer & Cash Drawer (Laci Kasir) Settings State
  const [printerSettings, setPrinterSettings] = useState(() => getSavedPrinterSettings());
  const [showHardwareModal, setShowHardwareModal] = useState(false);
  const [hardwareModalTab, setHardwareModalTab] = useState('drawer'); // 'drawer' | 'printer'
  const [drawerKicking, setDrawerKicking] = useState(false);
  const [printerFeedback, setPrinterFeedback] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [hardwareCaps, setHardwareCaps] = useState(() => getHardwareCapabilities());

  // Admin Custom Discount Modal State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedOrderForDiscount, setSelectedOrderForDiscount] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    type: 'FIXED', // 'FIXED' (Rp) | 'PERCENT' (%)
    value: '',
    reason: ''
  });
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Member Stamp & Custom Loyalty Points State
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltySearchPhone, setLoyaltySearchPhone] = useState('');
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyFeedback, setLoyaltyFeedback] = useState('');
  const [customPointsInput, setCustomPointsInput] = useState('');
  const [customPointsReason, setCustomPointsReason] = useState('');

  // Recap Filter State
  const [recapFilter, setRecapFilter] = useState('all'); // 'all' | 'today'

  // Sistem Redeem Kode Kasir State
  const [showRedeemManagerModal, setShowRedeemManagerModal] = useState(false);
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState(null);
  const [redeemCodesList, setRedeemCodesList] = useState([]);
  const [loadingRedeemCodes, setLoadingRedeemCodes] = useState(false);
  const [newRedeemForm, setNewRedeemForm] = useState({
    code: '',
    quotaNota: 50,
    maxQuota: 10,
    description: ''
  });
  const [creatingRedeemCode, setCreatingRedeemCode] = useState(false);
  const [createCodeFeedback, setCreateCodeFeedback] = useState(null);

  // Excel Export State
  const [exportingExcel, setExportingExcel] = useState(false);

  // ── Promo Makanan State (Owner, Mitra, Kasir, Admin - Kuota / Tanggal) ──
  const [promosList, setPromosList] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [showPromoManagerModal, setShowPromoManagerModal] = useState(false);
  const [activeCartPromo, setActiveCartPromo] = useState(null);
  const [newPromoForm, setNewPromoForm] = useState({
    title: '',
    code: '',
    scope: 'ALL',
    targetProductId: '',
    discountType: 'FIXED',
    discountValue: '',
    minOrder: '',
    limitType: 'QUOTA',
    maxQuota: 25,
    expiryDate: '',
    createdByRole: 'owner',
    description: ''
  });
  const [savingPromo, setSavingPromo] = useState(false);
  const [promoSaveFeedback, setPromoSaveFeedback] = useState(null);

  // ── STATISTIK KEUANGAN MULTI-DIMENSI STATE ──
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState('perMenu'); // 'perMenu' | 'perStore' | 'crossBranch' | 'perCashier'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // ── GUDANG, RESEP & ALERT STOK MENIPIS STATE ──
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryTab, setInventoryTab] = useState('stock'); // 'stock' | 'recipes'
  const [inventoryList, setInventoryList] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [recipesList, setRecipesList] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedRecipeProduct, setSelectedRecipeProduct] = useState(null);

  // Restock Cepat State
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockTargetItem, setRestockTargetItem] = useState(null);
  const [restockQtyInput, setRestockQtyInput] = useState('');
  const [restockNotesInput, setRestockNotesInput] = useState('');
  const [savingRestock, setSavingRestock] = useState(false);
  const [restockFeedback, setRestockFeedback] = useState(null);

  // Direct quantity selector per product before adding to posCart (auto reset to 1 after add)
  const [posCardQtys, setPosCardQtys] = useState({});

  const getPosCardQty = (id) => posCardQtys[id] || 1;
  const updatePosCardQty = (id, delta) => {
    setPosCardQtys(prev => {
      const cur = prev[id] || 1;
      const next = Math.max(1, Math.min(99, cur + delta));
      return { ...prev, [id]: next };
    });
  };
  const setDirectPosCardQty = (id, val) => {
    const parsed = parseInt(val, 10);
    const next = isNaN(parsed) || parsed < 1 ? 1 : Math.min(99, parsed);
    setPosCardQtys(prev => ({ ...prev, [id]: next }));
  };

  const handleAddPosWithQty = (p) => {
    const qtyToAdd = getPosCardQty(p.id);
    try { playChime(880, 0.08); } catch (_) {}
    setPosCart(prev => ({
      ...prev,
      [p.id]: {
        product: p,
        qty: (prev[p.id]?.qty || 0) + qtyToAdd
      }
    }));
    // Auto reset back to 1 immediately so fingers don't get tired
    setPosCardQtys(prev => ({ ...prev, [p.id]: 1 }));
  };

  const updateCartItemQty = (productId, delta) => {
    setPosCart(prev => {
      const cur = prev[productId];
      if (!cur && delta > 0) {
        const prod = products.find(p => p.id === productId);
        if (!prod) return prev;
        return { ...prev, [productId]: { product: prod, qty: 1, notes: '' } };
      }
      if (!cur) return prev;
      const nextQty = cur.qty + delta;
      const copy = { ...prev };
      if (nextQty <= 0) {
        delete copy[productId];
      } else {
        copy[productId] = { ...cur, qty: nextQty };
      }
      return copy;
    });
  };

  const setCartItemExactQty = (productId, exactQty) => {
    const qty = Math.max(0, parseInt(exactQty) || 0);
    setPosCart(prev => {
      const copy = { ...prev };
      if (qty <= 0) {
        delete copy[productId];
      } else if (copy[productId]) {
        copy[productId] = { ...copy[productId], qty };
      } else {
        const prod = products.find(p => p.id === productId);
        if (prod) copy[productId] = { product: prod, qty, notes: '' };
      }
      return copy;
    });
  };

  const updateCartItemNotes = (productId, notes) => {
    setPosCart(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          notes
        }
      };
    });
  };

  // Thermal Receipt Modal State
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Add & Edit Menu State
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null if adding new, object if editing
  const [newMenuForm, setNewMenuForm] = useState({
    name: '',
    category: 'Makanan',
    customCategory: '',
    isCustomCategory: false,
    price: '',
    description: '',
    image: '',
    stock: 99,
    isAvailable: true
  });
  const [addMenuError, setAddMenuError] = useState('');
  const [savingMenu, setSavingMenu] = useState(false);
  const menuFileInputRef = useRef(null);

  // Preset Delicious Food Photos for Instant Selection
  const PHOTO_PRESETS = [
    { label: 'Mie / Ramen', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80' },
    { label: 'Nasi Goreng', url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80' },
    { label: 'Ayam Geprek', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80' },
    { label: 'Dimsum / Siomay', url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&q=80' },
    { label: 'Kentang Goreng', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&q=80' },
    { label: 'Es Teh Segar', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80' },
    { label: 'Kopi Susu Aren', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80' },
    { label: 'Boba Milk Tea', url: 'https://images.unsplash.com/photo-1558857563-b37cf5a5a92a?w=500&q=80' }
  ];

  // Dynamic Categories from Products
  const availableCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  ['Makanan', 'Snack', 'Minuman'].forEach(c => {
    if (!availableCategories.includes(c)) availableCategories.push(c);
  });
  const posCategories = ['Semua', ...availableCategories.filter(c => c !== 'Semua')];

  const getCategoryIcon = (cat) => {
    const c = String(cat).toLowerCase();
    if (c.includes('makan') || c.includes('nasi') || c.includes('mie') || c.includes('ayam')) return '🍜';
    if (c.includes('snack') || c.includes('camilan') || c.includes('goreng') || c.includes('kentang')) return '🍟';
    if (c.includes('minum') || c.includes('teh') || c.includes('kopi') || c.includes('jus') || c.includes('boba')) return '🥤';
    if (c.includes('dessert') || c.includes('kue') || c.includes('roti') || c.includes('manis')) return '🍰';
    if (c.includes('paket') || c.includes('hemat')) return '🍱';
    if (c === 'semua') return '🍽️';
    return '🍴';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAddMenuError('Ukuran file foto maksimal 5 MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setNewMenuForm(prev => ({ ...prev, image: uploadEvent.target.result }));
      setAddMenuError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNewMenu = async (e) => {
    if (e) e.preventDefault();
    setAddMenuError('');

    const targetCategory = newMenuForm.isCustomCategory
      ? newMenuForm.customCategory.trim()
      : newMenuForm.category.trim();

    if (!newMenuForm.name.trim()) {
      setAddMenuError('Nama menu wajib diisi!');
      return;
    }
    if (!targetCategory) {
      setAddMenuError('Kategori produk wajib diisi!');
      return;
    }
    if (!newMenuForm.price || isNaN(Number(newMenuForm.price)) || Number(newMenuForm.price) < 0) {
      setAddMenuError('Harga menu wajib berupa angka nominal yang valid!');
      return;
    }
    if (!newMenuForm.description.trim()) {
      setAddMenuError('Deskripsi produk wajib diisi!');
      return;
    }
    // FOTO MUST HAVE VALIDATION!
    if (!newMenuForm.image || !newMenuForm.image.trim()) {
      setAddMenuError('Foto produk WAJIB disertakan (must have)! Silakan unggah foto dari galeri atau pilih dari preset foto.');
      return;
    }

    try {
      setSavingMenu(true);
      if (editingProduct) {
        // Mode Edit Menu
        const res = await fetch(`/api/pos/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newMenuForm.name.trim(),
            category: targetCategory,
            price: Number(newMenuForm.price),
            description: newMenuForm.description.trim(),
            image: newMenuForm.image.trim(),
            stock: Number(newMenuForm.stock || 99),
            isAvailable: newMenuForm.isAvailable !== false
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui menu');

        setProducts(prev => prev.map(p => p.id === data.id ? data : p));
        setPosCategory(data.category);
        try { playChime(880, 0.1); } catch (_) {}
      } else {
        // Mode Tambah Menu Baru
        const res = await fetch('/api/pos/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newMenuForm.name.trim(),
            category: targetCategory,
            price: Number(newMenuForm.price),
            description: newMenuForm.description.trim(),
            image: newMenuForm.image.trim(),
            stock: Number(newMenuForm.stock || 99),
            isAvailable: true
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan menu');

        setProducts(prev => [data, ...prev]);
        setPosCategory(data.category);
        try { playChime(880, 0.1); } catch (_) {}
      }

      // Reset form dan tutup modal
      setEditingProduct(null);
      setNewMenuForm({
        name: '',
        category: 'Makanan',
        customCategory: '',
        isCustomCategory: false,
        price: '',
        description: '',
        image: '',
        stock: 99,
        isAvailable: true
      });
      setShowAddMenuModal(false);
    } catch (err) {
      setAddMenuError(err.message);
    } finally {
      setSavingMenu(false);
    }
  };

  const handleOpenAddMenu = () => {
    setEditingProduct(null);
    setNewMenuForm({
      name: '',
      category: 'Makanan',
      customCategory: '',
      isCustomCategory: false,
      price: '',
      description: '',
      image: '',
      stock: 99,
      isAvailable: true
    });
    setAddMenuError('');
    setShowAddMenuModal(true);
  };

  const handleOpenEditMenu = (p) => {
    setEditingProduct(p);
    setNewMenuForm({
      name: p.name,
      category: p.category,
      customCategory: '',
      isCustomCategory: !availableCategories.includes(p.category),
      price: p.price,
      description: p.description || '',
      image: p.image || '',
      stock: p.stock ?? 99,
      isAvailable: p.isAvailable !== false
    });
    setAddMenuError('');
    setShowAddMenuModal(true);
  };

  // ── STORE LOCATION HANDLERS (VALIDASI TOKO WAJIB) ──
  const handleSaveStore = async (e) => {
    if (e) e.preventDefault();
    if (!storeForm.storeName.trim()) {
      alert('Nama toko/kantin kasir wajib diisi!');
      return;
    }
    if (!storeForm.location.trim()) {
      alert('Lokasi kasir (lantai/gedung/posisi fisik) wajib diinput agar toko valid!');
      return;
    }

    try {
      setSavingStore(true);
      const res = await fetch('/api/pos/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan lokasi toko');

      setStoreInfo(data.store);
      setStoreSaveMsg('Lokasi dan toko kasir berhasil divalidasi resmi!');
      setTimeout(() => {
        setStoreSaveMsg('');
        setShowStoreModal(false);
      }, 1500);
      try { playChime(880, 0.1); } catch (_) {}
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingStore(false);
    }
  };

  // ── HARDWARE THERMAL PRINTER HANDLERS (BLUETOOTH & USB) ──
  const handlePrintReceipt = async (order, modeOverride) => {
    try {
      setIsPrinting(true);
      setPrinterFeedback('Menghubungkan ke printer thermal...');
      const targetMode = modeOverride || printerSettings.connectionType || 'browser';
      const res = await printReceipt(order, {
        connectionType: targetMode,
        paperWidth: printerSettings.paperWidth || '58mm',
        autoCut: printerSettings.autoCut !== false,
        openDrawer: printerSettings.openDrawer === true,
        storeName: storeInfo.storeName || 'KANTIN RIUPH POS',
        storeAddress: storeInfo.location ? `${storeInfo.storeName} - ${storeInfo.location}` : 'Jl. Operasional Kostku'
      });
      setPrinterFeedback('✅ ' + (res.message || 'Struk thermal berhasil dicetak!'));
      setTimeout(() => setPrinterFeedback(''), 4000);
    } catch (err) {
      setPrinterFeedback('❌ ' + (err.message || 'Gagal mencetak struk thermal.'));
      setTimeout(() => setPrinterFeedback(''), 6000);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleConnectBluetooth = async () => {
    try {
      setPrinterFeedback('Mencari perangkat printer Bluetooth (BLE)...');
      const res = await connectBluetoothPrinter();
      setPrinterSettings(prev => ({
        ...prev,
        connectionType: 'bluetooth',
        pairedBluetoothDeviceName: res.deviceName
      }));
      setPrinterFeedback(`✅ Terhubung ke Bluetooth: ${res.deviceName}`);
      setTimeout(() => setPrinterFeedback(''), 4000);
    } catch (err) {
      setPrinterFeedback('❌ ' + err.message);
      setTimeout(() => setPrinterFeedback(''), 5000);
    }
  };

  const handleConnectUsb = async () => {
    try {
      setPrinterFeedback('Mencari port USB printer thermal...');
      const res = await connectUsbPrinter();
      setPrinterSettings(prev => ({
        ...prev,
        connectionType: 'usb',
        pairedUsbPortName: res.name
      }));
      setPrinterFeedback(`✅ Terhubung ke USB: ${res.name}`);
      setTimeout(() => setPrinterFeedback(''), 4000);
    } catch (err) {
      setPrinterFeedback('❌ ' + err.message);
      setTimeout(() => setPrinterFeedback(''), 5000);
    }
  };

  const handleTestPrint = async (targetMode) => {
    try {
      setIsPrinting(true);
      setPrinterFeedback('Mencetak struk tes hardware...');
      const testOrder = getSampleTestOrder(printerSettings.paperWidth || '58mm');
      testOrder.storeName = storeInfo.storeName || 'KANTIN RIUPH POS';
      testOrder.storeLocation = storeInfo.location || 'Lokasi Kasir Terverifikasi';
      await printReceipt(testOrder, {
        connectionType: targetMode || printerSettings.connectionType || 'browser',
        paperWidth: printerSettings.paperWidth || '58mm',
        autoCut: printerSettings.autoCut !== false
      });
      setPrinterFeedback('✅ Tes cetak struk thermal berhasil!');
      setTimeout(() => setPrinterFeedback(''), 4000);
    } catch (err) {
      setPrinterFeedback('❌ ' + err.message);
      setTimeout(() => setPrinterFeedback(''), 5000);
    } finally {
      setIsPrinting(false);
    }
  };

  // ── CASH DRAWER (LACI KASIR RJ11 / USB) KICK HANDLER ──
  const handleKickDrawerManual = async () => {
    try {
      setDrawerKicking(true);
      playCashRegisterSound();
      setPrinterFeedback('⚡ Mengirim sinyal pulsa buka laci kasir (RJ11/USB)...');
      const res = await kickCashDrawer({
        connectionType: printerSettings.connectionType || 'bluetooth',
        pin: printerSettings.drawerPin || 2
      });
      setPrinterFeedback('✅ ' + (res.message || 'Laci uang kasir berhasil terbuka!'));
      setTimeout(() => setPrinterFeedback(''), 4500);
    } catch (err) {
      setPrinterFeedback('❌ ' + (err.message || 'Gagal membuka laci. Pastikan printer thermal terhubung.'));
      setTimeout(() => setPrinterFeedback(''), 5500);
    } finally {
      setTimeout(() => setDrawerKicking(false), 600);
    }
  };

  // ── ADMIN CUSTOM DISCOUNT HANDLER ──
  const handleApplyDiscount = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOrderForDiscount?.id) return;
    const num = Number(discountForm.value);
    if (!num || num <= 0) {
      alert('Masukkan nominal atau persentase diskon yang valid!');
      return;
    }

    try {
      setApplyingDiscount(true);
      const res = await fetch(`/api/pos/orders/${selectedOrderForDiscount.id}/apply-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discountType: discountForm.type,
          discountValue: num,
          reason: discountForm.reason.trim() || 'Diskon Khusus Owner / Admin'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menerapkan diskon');

      setOrders(prev => prev.map(o => o.id === data.order.id ? data.order : o));
      setShowDiscountModal(false);
      setSelectedOrderForDiscount(null);
      alert(`✅ ${data.message}`);
      try { playChime(880, 0.1); } catch (_) {}
    } catch (err) {
      alert(err.message);
    } finally {
      setApplyingDiscount(false);
    }
  };

  // ── MEMBER STAMP & CUSTOM POINTS HANDLERS ──
  const handleSearchLoyalty = async (phone) => {
    const cleanPhone = String(phone || loyaltySearchPhone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Masukkan nomor WhatsApp pelanggan!');
      return;
    }

    try {
      setLoyaltyLoading(true);
      setLoyaltyFeedback('');
      const res = await fetch(`/api/pos/loyalty/${cleanPhone}`);
      const data = await res.json();
      setLoyaltyData(data);
    } catch (err) {
      alert('Gagal memuat loyalty pelanggan: ' + err.message);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleGrantCustomPoints = async () => {
    if (!loyaltyData?.phone) return;
    const pts = parseInt(customPointsInput, 10);
    if (!pts || isNaN(pts)) {
      alert('Masukkan jumlah poin yang valid!');
      return;
    }

    try {
      const res = await fetch('/api/pos/loyalty/grant-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loyaltyData.phone,
          name: loyaltyData.name,
          points: pts,
          reason: customPointsReason.trim() || 'Bonus Poin Khusus dari Owner'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memberi poin');
      setLoyaltyFeedback(`✅ ${data.message}`);
      setCustomPointsInput('');
      setCustomPointsReason('');
      handleSearchLoyalty(loyaltyData.phone);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGrantStamp = async (delta = 1) => {
    if (!loyaltyData?.phone) return;
    try {
      const res = await fetch('/api/pos/loyalty/grant-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loyaltyData.phone,
          name: loyaltyData.name,
          change: delta,
          reason: 'Stamp Transaksi Kasir POS'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah stamp');
      setLoyaltyFeedback(`✅ ${data.message}`);
      handleSearchLoyalty(loyaltyData.phone);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRedeemStamp = async () => {
    if (!loyaltyData?.phone) return;
    if (!confirm(`Klaim reward ${loyaltyData.maxStamps} stamp untuk ${loyaltyData.name}?`)) return;
    try {
      const res = await fetch('/api/pos/loyalty/grant-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loyaltyData.phone,
          name: loyaltyData.name,
          action: 'REDEEM',
          reason: 'Klaim Gratis 1 Menu Spesial / Diskon Member'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal klaim stamp');
      setLoyaltyFeedback(`🎉 ${data.message}`);
      handleSearchLoyalty(loyaltyData.phone);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Hapus menu "${productName}" dari katalog?`)) return;
    try {
      const res = await fetch(`/api/pos/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        setPosCart(prev => {
          const copy = { ...prev };
          delete copy[productId];
          return copy;
        });
      }
    } catch (_) {}
  };

  // TriPay Settings State
  const [tripayConfig, setTripayConfig] = useState({
    merchantCode: '',
    apiKey: '',
    privateKey: '',
    isProduction: false,
    isConfigured: false
  });
  const [savingTripay, setSavingTripay] = useState(false);
  const [tripaySavedMsg, setTripaySavedMsg] = useState('');

  // 1. Fetch Orders, Products, Tables, TriPay Config & Store Validity
  const fetchData = async () => {
    try {
      setLoadingOrders(true);
      const [resOrders, resProd, resTables, resConfig, resStore] = await Promise.all([
        fetch('/api/pos/orders'),
        fetch('/api/pos/products'),
        fetch('/api/pos/tables'),
        fetch('/api/pos/config/tripay'),
        fetch('/api/pos/store')
      ]);

      if (resOrders.ok) setOrders(await resOrders.json());
      if (resProd.ok) setProducts(await resProd.json());
      if (resTables.ok) {
        const tbls = await resTables.json();
        const tablesWithQR = await Promise.all(tbls.map(async (tbl) => {
          if (tbl.qrDataUrl) return tbl;
          const orderUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://kostku.riuph.me'}/order/${tbl.qrToken || tbl.id}`;
          try {
            const qrDataUrl = await QRCode.toDataURL(orderUrl, {
              width: 320,
              margin: 1,
              color: { dark: '#0f172a', light: '#ffffff' }
            });
            return { ...tbl, qrDataUrl };
          } catch (_) {
            return tbl;
          }
        }));
        setTables(tablesWithQR);
        if (tablesWithQR.length > 0 && !selectedTable) setSelectedTable(tablesWithQR[0].number);
      }
      if (resConfig.ok) setTripayConfig(await resConfig.json());
      if (resStore.ok) {
        const st = await resStore.json();
        setStoreInfo(st);
        setStoreForm({
          storeName: st.storeName || '',
          location: st.location || '',
          address: st.address || '',
          city: st.city || '',
          phone: st.phone || ''
        });
        const targetWalletUid = st.uid || 'pos';
        apiGetAccountWallet(targetWalletUid).then(wRes => {
          if (wRes?.wallet) setWalletData(wRes.wallet);
        }).catch(() => {});
      }
      loadRedeemCodes();
      loadPromos();
      loadInventory();
      loadAnalytics();
      loadRecipes();
    } catch (err) {
      console.warn('Gagal memuat data kasir:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/pos/orders');
        if (res.ok) {
          const fresh = await res.json();
          if (audioAlert) {
            const hasNew = fresh.some(
              fo => fo.status === 'PENDING_CONFIRMATION' && !orders.some(oo => oo.id === fo.id)
            );
            if (hasNew) playNotificationBell();
          }
          setOrders(fresh);
        }
      } catch (_) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [audioAlert, orders.length]);

  const playNotificationBell = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (_) {}
  };

  // 2. Kitchen / Cashier Actions
  const handleAccOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/pos/orders/${orderId}/acc`, { method: 'POST' });
      if (res.ok) {
        playNotificationBell();
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal ACC pesanan');
      }
    } catch (err) {
      alert('Kesalahan jaringan: ' + err.message);
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = prompt('Masukkan alasan penolakan pesanan:', 'Bahan baku habis');
    if (!reason) return;
    try {
      const res = await fetch(`/api/pos/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Gagal menolak pesanan: ' + err.message);
    }
  };

  const handleSwitchPosStore = async (targetId) => {
    try {
      const res = await fetch('/api/pos/store/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: targetId })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchData();
        alert(`✅ Kasir POS berhasil beralih ke toko: ${data.store?.storeName || 'Toko'}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal beralih toko');
      }
    } catch (err) {
      alert('Gagal beralih toko: ' + err.message);
    }
  };

  const handleInitiateTripayTopup = async (nominal) => {
    try {
      setPosTopupLoading(true);
      const chosenAmount = nominal || posTopupAmount || 10000;
      const chosenQuota = Math.max(1, Math.floor(chosenAmount / 100));
      const res = await fetch('/api/pos/topup-tripay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: chosenAmount,
          quota: chosenQuota,
          merchantId: storeInfo?.merchantId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        let qrDataUrl = data.qrUrl || data.qrDataUrl || '';
        if (!qrDataUrl && data.qrString) {
          try {
            qrDataUrl = await QRCode.toDataURL(data.qrString, { width: 320 });
          } catch (_) {}
        }
        setTripayTopupData({
          ...data,
          qrDataUrl
        });
      } else {
        alert(data.error || 'Gagal membuat tagihan pembayaran TriPay');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi TriPay: ' + err.message);
    } finally {
      setPosTopupLoading(false);
    }
  };

  const handleConfirmTripayTopup = async () => {
    if (!tripayTopupData) return;
    try {
      setTripayCheckingStatus(true);
      setTripayStatusFeedback(null);
      const res = await fetch('/api/pos/topup-tripay/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: tripayTopupData.reference,
          amount: tripayTopupData.amount,
          quota: tripayTopupData.quota,
          merchantId: storeInfo?.merchantId
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.isPaid) {
        try { playChime(880, 0.2); } catch (_) {}
        setStoreInfo(prev => ({
          ...prev,
          saldoNota: data.saldoNota ?? ((prev.saldoNota || 0) + tripayTopupData.amount),
          kuotaNota: data.kuotaNota ?? ((prev.kuotaNota || 0) + tripayTopupData.quota)
        }));
        setShowPosTopupModal(false);
        setTripayTopupData(null);
        setTripayStatusFeedback(null);
        fetchData();
        alert(data.message || `🎉 Pembayaran TriPay Sukses! +${tripayTopupData.quota} nota telah ditambahkan.`);
      } else {
        setTripayStatusFeedback({
          type: 'error',
          message: data.error || 'Status di TriPay belum lunas (UNPAID).'
        });
      }
    } catch (err) {
      setTripayStatusFeedback({
        type: 'error',
        message: 'Gagal mengecek status TriPay: ' + err.message
      });
    } finally {
      setTripayCheckingStatus(false);
    }
  };

  const handleTopupPosNota = async (nominal) => {
    try {
      setPosTopupLoading(true);
      const chosenAmount = nominal || posTopupAmount || 10000;
      const chosenQuota = Math.max(1, Math.floor(chosenAmount / 100));
      const res = await fetch('/api/pos/topup-nota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: chosenAmount,
          quota: chosenQuota,
          merchantId: storeInfo?.merchantId
        })
      });
      const data = await res.json();
      if (res.ok) {
        try { playChime(880, 0.15); } catch (_) {}
        setStoreInfo(prev => ({
          ...prev,
          saldoNota: data.saldoNota ?? ((prev.saldoNota || 0) + chosenAmount),
          kuotaNota: data.kuotaNota ?? ((prev.kuotaNota || 0) + chosenQuota)
        }));
        setShowPosTopupModal(false);
        fetchData();
        alert(data.message || `🎉 Top up nota kasir berhasil! (+${chosenQuota} nota)`);
      } else {
        alert(data.error || 'Gagal top up saldo nota kasir');
      }
    } catch (err) {
      alert('Terjadi kesalahan top up: ' + err.message);
    } finally {
      setPosTopupLoading(false);
    }
  };

  const handleConfirmPaid = async (orderId) => {
    if (Number(storeInfo.saldoNota ?? 5000) < 100) {
      setShowPosTopupModal(true);
      alert(`⚠️ Saldo nota toko tidak mencukupi untuk konfirmasi bayar tunai (sisa Rp ${(storeInfo.saldoNota || 0).toLocaleString('id-ID')}, dibutuhkan Rp 100). Silakan top up saldo nota kasir terlebih dahulu.`);
      return;
    }
    try {
      const res = await fetch(`/api/pos/orders/${orderId}/confirm-payment`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresTopupNota) {
          setShowPosTopupModal(true);
        }
        alert(data.error || 'Gagal konfirmasi pembayaran');
        return;
      }
      fetchData();
      alert('✅ Pembayaran tunai berhasil dikonfirmasi! 1 nota (Rp 100) dipotong dari saldo toko.');
    } catch (err) {
      alert('Gagal konfirmasi pembayaran: ' + err.message);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/pos/orders/${orderId}/complete`, { method: 'POST' });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Gagal menyelesaikan pesanan: ' + err.message);
    }
  };

  // ── SISTEM REDEEM KODE KASIR ──
  const loadRedeemCodes = async () => {
    try {
      setLoadingRedeemCodes(true);
      const res = await fetch('/api/pos/redeem-codes');
      const data = await res.json();
      if (res.ok && data.codes) {
        setRedeemCodesList(data.codes);
      }
    } catch (err) {
      console.warn('Gagal memuat kode redeem:', err);
    } finally {
      setLoadingRedeemCodes(false);
    }
  };

  const handleClaimRedeemCode = async (customCode) => {
    const codeToUse = String(customCode || redeemCodeInput).trim().toUpperCase();
    if (!codeToUse) {
      setRedeemFeedback({ type: 'error', message: 'Masukkan kode redeem terlebih dahulu!' });
      return;
    }

    try {
      setRedeemLoading(true);
      setRedeemFeedback(null);
      const res = await fetch('/api/pos/redeem-code/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToUse,
          storeId: storeInfo.merchantId || storeInfo.uid
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRedeemFeedback({ type: 'success', message: data.message });
        setStoreInfo(prev => ({
          ...prev,
          saldoNota: data.newSaldoNota,
          kuotaNota: data.newKuotaNota
        }));
        setRedeemCodeInput('');
        loadRedeemCodes();
        triggerCometArc({
          origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          color: '#ec4899',
          title: '🎉 Kuota Nota Bertambah!',
          subtitle: `Kode ${codeToUse} berhasil diklaim (+${data.bonusNota} nota).`
        });
      } else {
        setRedeemFeedback({ type: 'error', message: data.error || 'Gagal mengklaim kode redeem' });
      }
    } catch (err) {
      setRedeemFeedback({ type: 'error', message: 'Kesalahan jaringan: ' + err.message });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleCreateRedeemCode = async (e) => {
    if (e) e.preventDefault();
    if (!newRedeemForm.code.trim()) {
      setCreateCodeFeedback({ type: 'error', message: 'Kode unik wajib diisi!' });
      return;
    }
    if (!newRedeemForm.quotaNota || Number(newRedeemForm.quotaNota) <= 0) {
      setCreateCodeFeedback({ type: 'error', message: 'Bonus nota harus lebih dari 0!' });
      return;
    }
    if (!newRedeemForm.maxQuota || Number(newRedeemForm.maxQuota) <= 0) {
      setCreateCodeFeedback({ type: 'error', message: 'Batas kuota klaim harus lebih dari 0!' });
      return;
    }

    try {
      setCreatingRedeemCode(true);
      setCreateCodeFeedback(null);
      const res = await fetch('/api/pos/redeem-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newRedeemForm.code.trim().toUpperCase(),
          quotaNota: Number(newRedeemForm.quotaNota),
          maxQuota: Number(newRedeemForm.maxQuota),
          description: newRedeemForm.description.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreateCodeFeedback({ type: 'success', message: data.message });
        setNewRedeemForm({ code: '', quotaNota: 50, maxQuota: 10, description: '' });
        loadRedeemCodes();
      } else {
        setCreateCodeFeedback({ type: 'error', message: data.error || 'Gagal menerbitkan kode redeem' });
      }
    } catch (err) {
      setCreateCodeFeedback({ type: 'error', message: 'Kesalahan jaringan: ' + err.message });
    } finally {
      setCreatingRedeemCode(false);
    }
  };

  // ── EXPORT DATA KE EXCEL (.XLSX) ──
  const handleExportExcel = () => {
    try {
      setExportingExcel(true);
      const ordersToExport = orders && orders.length > 0 ? orders : [];

      if (!ordersToExport || ordersToExport.length === 0) {
        alert('Belum ada data transaksi kasir untuk diekspor ke Excel!');
        setExportingExcel(false);
        return;
      }

      // Sheet 1: Data Transaksi Lengkap
      const transactionsData = ordersToExport.map((ord, idx) => {
        const itemsSummary = (ord.items || [])
          .map(it => `${it.name} (${it.qty || 1}x @Rp ${(it.price || 0).toLocaleString('id-ID')})`)
          .join('; ');
        const totalQty = (ord.items || []).reduce((sum, it) => sum + (it.qty || 1), 0);
        const subtotal = ord.subtotal || ord.totalAmount || 0;
        const discount = ord.discount || 0;
        const platformFee = ord.platformFee || 100;
        const total = ord.totalAmount || (subtotal - discount + platformFee);
        const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleString('id-ID') : '-';
        const methodStr = String(ord.paymentMethod || '').toUpperCase().includes('CASH') || String(ord.paymentMethod || '').toUpperCase().includes('TUNAI')
          ? 'Tunai Kasir'
          : 'QRIS TriPay';

        return {
          'No': idx + 1,
          'Tanggal & Waktu': dateStr,
          'ID Pesanan': ord.id,
          'Tipe / Meja': ord.tableNumber ? `Meja ${ord.tableNumber}` : 'Bawa Pulang (Takeaway)',
          'Nama Pelanggan': ord.customerName || 'Pelanggan Langsung',
          'No WhatsApp': ord.customerPhone || '-',
          'Rincian Menu': itemsSummary,
          'Total Qty Item': totalQty,
          'Subtotal (Rp)': subtotal,
          'Diskon (Rp)': discount,
          'Biaya Admin Platform (Rp)': platformFee,
          'Total Transaksi (Rp)': total,
          'Metode Pembayaran': methodStr,
          'Status Pembayaran': ord.paymentStatus || (ord.status === 'COMPLETED' ? 'PAID' : 'WAITING'),
          'Status Pesanan': ord.status === 'COMPLETED' ? 'Selesai' : (ord.status === 'PREPARING' ? 'Sedang Dimasak' : ord.status)
        };
      });

      // Total Row
      const totalOmsetAll = ordersToExport.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalDiscountAll = ordersToExport.reduce((sum, o) => sum + (o.discount || 0), 0);
      const totalPlatformFeeAll = ordersToExport.length * 100;

      transactionsData.push({
        'No': 'TOTAL',
        'Tanggal & Waktu': `${ordersToExport.length} Transaksi`,
        'ID Pesanan': '',
        'Tipe / Meja': '',
        'Nama Pelanggan': '',
        'No WhatsApp': '',
        'Rincian Menu': '',
        'Total Qty Item': '',
        'Subtotal (Rp)': '',
        'Diskon (Rp)': totalDiscountAll,
        'Biaya Admin Platform (Rp)': totalPlatformFeeAll,
        'Total Transaksi (Rp)': totalOmsetAll,
        'Metode Pembayaran': '',
        'Status Pembayaran': '',
        'Status Pesanan': ''
      });

      // Sheet 2: Rekap Menu Terjual
      const productSalesMap = {};
      ordersToExport.forEach(ord => {
        (ord.items || []).forEach(it => {
          const key = it.name || 'Produk';
          if (!productSalesMap[key]) {
            productSalesMap[key] = {
              name: key,
              category: it.category || 'Umum',
              qty: 0,
              revenue: 0
            };
          }
          productSalesMap[key].qty += (it.qty || 1);
          productSalesMap[key].revenue += ((it.qty || 1) * (it.price || 0));
        });
      });

      const productSalesData = Object.values(productSalesMap)
        .sort((a, b) => b.qty - a.qty)
        .map((p, idx) => ({
          'No': idx + 1,
          'Nama Menu': p.name,
          'Kategori': p.category,
          'Jumlah Terjual (Qty)': p.qty,
          'Total Omset Menu (Rp)': p.revenue
        }));

      // Sheet 3: Rekap Finansial & Saldo Nota
      const qrisTotal = ordersToExport
        .filter(o => !String(o.paymentMethod || '').toUpperCase().includes('CASH') && !String(o.paymentMethod || '').toUpperCase().includes('TUNAI'))
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const cashTotal = ordersToExport
        .filter(o => String(o.paymentMethod || '').toUpperCase().includes('CASH') || String(o.paymentMethod || '').toUpperCase().includes('TUNAI'))
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const financialSummaryData = [
        { 'Indikator Keuangan': 'Nama Toko / Unit Usaha', 'Nilai': storeInfo.storeName || 'Kantin KostKu' },
        { 'Indikator Keuangan': 'Tanggal Ekspor Laporan', 'Nilai': new Date().toLocaleString('id-ID') },
        { 'Indikator Keuangan': 'Total Transaksi Selesai', 'Nilai': `${ordersToExport.length} Pesanan` },
        { 'Indikator Keuangan': 'Total Omset Penjualan (Kotor)', 'Nilai': `Rp ${totalOmsetAll.toLocaleString('id-ID')}` },
        { 'Indikator Keuangan': 'Pemasukan QRIS TriPay (Digital)', 'Nilai': `Rp ${qrisTotal.toLocaleString('id-ID')}` },
        { 'Indikator Keuangan': 'Pemasukan Tunai Kasir (Fisik di Laci)', 'Nilai': `Rp ${cashTotal.toLocaleString('id-ID')}` },
        { 'Indikator Keuangan': 'Total Biaya Admin Platform (Flat Rp 100/nota)', 'Nilai': `Rp ${totalPlatformFeeAll.toLocaleString('id-ID')}` },
        { 'Indikator Keuangan': 'Omset Bersih Toko (Netto)', 'Nilai': `Rp ${(Math.max(0, totalOmsetAll - totalPlatformFeeAll)).toLocaleString('id-ID')}` },
        { 'Indikator Keuangan': 'Sisa Saldo Kuota Nota Toko', 'Nilai': `Rp ${(storeInfo.saldoNota || 0).toLocaleString('id-ID')} (${storeInfo.kuotaNota || 0} lembar)` }
      ];

      // Build Workbook with SheetJS
      const wb = XLSX.utils.book_new();

      const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
      wsTransactions['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 18 },
        { wch: 22 },
        { wch: 20 },
        { wch: 16 },
        { wch: 45 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 22 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 14 }
      ];
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Laporan Transaksi');

      const wsProducts = XLSX.utils.json_to_sheet(productSalesData);
      wsProducts['!cols'] = [
        { wch: 6 },
        { wch: 30 },
        { wch: 16 },
        { wch: 20 },
        { wch: 22 }
      ];
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Rekap Menu Terjual');

      const wsFinancial = XLSX.utils.json_to_sheet(financialSummaryData);
      wsFinancial['!cols'] = [
        { wch: 40 },
        { wch: 35 }
      ];
      XLSX.utils.book_append_sheet(wb, wsFinancial, 'Rekap Finansial');

      const cleanStoreName = (storeInfo.storeName || 'KASIR_KOSTKU').replace(/[^a-zA-Z0-9]/g, '_');
      const dateSlug = new Date().toISOString().slice(0, 10);
      const filename = `LAPORAN_KASIR_${cleanStoreName}_${dateSlug}.xlsx`;

      XLSX.writeFile(wb, filename);

      triggerCometArc({
        origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        color: '#10b981',
        title: '📊 Export Excel Berhasil!',
        subtitle: `File ${filename} telah diunduh.`
      });
    } catch (err) {
      alert('Gagal mengekspor data ke Excel: ' + err.message);
    } finally {
      setExportingExcel(false);
    }
  };

  // ── SISTEM PROMO MAKANAN (KUOTA / TANGGAL / KEDUANYA) ──
  const loadPromos = async () => {
    try {
      setLoadingPromos(true);
      const res = await fetch('/api/pos/promos');
      const data = await res.json();
      if (res.ok && data.promos) {
        setPromosList(data.promos);
      }
    } catch (err) {
      console.warn('Gagal memuat promo makanan:', err);
    } finally {
      setLoadingPromos(false);
    }
  };

  const handleCreatePromo = async (e) => {
    if (e) e.preventDefault();
    if (!newPromoForm.title.trim()) {
      setPromoSaveFeedback({ type: 'error', message: 'Nama/judul promo makanan wajib diisi!' });
      return;
    }
    if (!newPromoForm.discountValue || Number(newPromoForm.discountValue) <= 0) {
      setPromoSaveFeedback({ type: 'error', message: 'Nilai diskon promo harus lebih dari 0!' });
      return;
    }
    if (newPromoForm.limitType === 'QUOTA' || newPromoForm.limitType === 'BOTH') {
      if (!newPromoForm.maxQuota || Number(newPromoForm.maxQuota) <= 0) {
        setPromoSaveFeedback({ type: 'error', message: 'Batas kuota promo wajib diisi dengan angka positif!' });
        return;
      }
    }
    if (newPromoForm.limitType === 'DATE' || newPromoForm.limitType === 'BOTH') {
      if (!newPromoForm.expiryDate) {
        setPromoSaveFeedback({ type: 'error', message: 'Tanggal kadaluarsa promo wajib diisi!' });
        return;
      }
    }

    try {
      setSavingPromo(true);
      setPromoSaveFeedback(null);
      const res = await fetch('/api/pos/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPromoForm.title.trim(),
          code: newPromoForm.code.trim().toUpperCase(),
          scope: newPromoForm.scope,
          targetProductId: newPromoForm.scope === 'SPECIFIC_ITEM' ? newPromoForm.targetProductId : null,
          discountType: newPromoForm.discountType,
          discountValue: Number(newPromoForm.discountValue),
          minOrder: Number(newPromoForm.minOrder) || 0,
          limitType: newPromoForm.limitType,
          maxQuota: (newPromoForm.limitType === 'QUOTA' || newPromoForm.limitType === 'BOTH') ? Number(newPromoForm.maxQuota) : null,
          expiryDate: (newPromoForm.limitType === 'DATE' || newPromoForm.limitType === 'BOTH') ? newPromoForm.expiryDate : null,
          createdByRole: newPromoForm.createdByRole,
          description: newPromoForm.description.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPromoSaveFeedback({ type: 'success', message: data.message });
        setNewPromoForm({
          title: '',
          code: '',
          scope: 'ALL',
          targetProductId: '',
          discountType: 'FIXED',
          discountValue: '',
          minOrder: '',
          limitType: 'QUOTA',
          maxQuota: 25,
          expiryDate: '',
          createdByRole: 'owner',
          description: ''
        });
        loadPromos();
        triggerCometArc({
          origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          color: '#f59e0b',
          title: '🏷️ Promo Makanan Terbit!',
          subtitle: data.promo.title
        });
      } else {
        setPromoSaveFeedback({ type: 'error', message: data.error || 'Gagal menerbitkan promo makanan' });
      }
    } catch (err) {
      setPromoSaveFeedback({ type: 'error', message: 'Kesalahan jaringan: ' + err.message });
    } finally {
      setSavingPromo(false);
    }
  };

  const handleTogglePromo = async (id) => {
    try {
      const res = await fetch(`/api/pos/promos/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        loadPromos();
      }
    } catch (err) {
      alert('Gagal mengubah status promo: ' + err.message);
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('Yakin ingin menghapus promo makanan ini?')) return;
    try {
      const res = await fetch(`/api/pos/promos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadPromos();
        if (activeCartPromo?.id === id) setActiveCartPromo(null);
      }
    } catch (err) {
      alert('Gagal menghapus promo: ' + err.message);
    }
  };

  const calculatePromoDiscountForCart = (promo, cart) => {
    if (!promo || !cart) return 0;
    const items = Object.values(cart);
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

  // ── INVENTORY & GUDANG HANDLERS ──
  const loadInventory = async () => {
    try {
      setLoadingInventory(true);
      const res = await fetch('/api/pos/inventory');
      const data = await res.json();
      if (res.ok) {
        setInventoryList(data.inventory || []);
        setInventoryAlerts(data.alerts || []);
      }
    } catch (err) {
      console.warn('Gagal memuat inventaris gudang:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const loadRecipes = async () => {
    try {
      setLoadingRecipes(true);
      const res = await fetch('/api/pos/recipes');
      const data = await res.json();
      if (res.ok) {
        setRecipesList(data.recipes || []);
        if (!selectedRecipeProduct && data.recipes?.length > 0) {
          setSelectedRecipeProduct(data.recipes[0]);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat resep menu:', err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockTargetItem || !restockQtyInput || Number(restockQtyInput) <= 0) {
      setRestockFeedback({ type: 'error', text: 'Jumlah restock harus lebih dari 0!' });
      return;
    }

    try {
      setSavingRestock(true);
      setRestockFeedback(null);
      const res = await fetch('/api/pos/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: restockTargetItem.id,
          addQty: Number(restockQtyInput),
          notes: restockNotesInput || 'Restock berkala stok dapur',
          restockedBy: user?.name ? `${user.name} (${user.role})` : 'Kasir Shift'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setRestockFeedback({ type: 'success', text: data.message });
        loadInventory();
        loadAnalytics();
        setRestockQtyInput('');
        setRestockNotesInput('');
        setTimeout(() => {
          setShowRestockModal(false);
          setRestockFeedback(null);
        }, 1500);
      } else {
        setRestockFeedback({ type: 'error', text: data.error || 'Gagal melakukan restock' });
      }
    } catch (err) {
      setRestockFeedback({ type: 'error', text: 'Kesalahan jaringan: ' + err.message });
    } finally {
      setSavingRestock(false);
    }
  };

  // ── STATISTIK & ANALITIK KEUANGAN HANDLERS ──
  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch('/api/pos/analytics');
      const data = await res.json();
      if (res.ok) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.warn('Gagal memuat data analitik multi-dimensi:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleToggleItemReady = async (orderId, itemIndex, currentReady) => {
    try {
      if (!currentReady) {
        playChime(1046.5, 0.12); // High C chime
      } else {
        playChime(659.25, 0.08); // E
      }
    } catch (_) {}

    // Optimistic local state update for zero lag
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedItems = (order.items || []).map((it, idx) => {
        if (idx !== itemIndex) return it;
        return { ...it, isReady: !currentReady, readyAt: !currentReady ? new Date().toISOString() : null };
      });
      const allReady = updatedItems.length > 0 && updatedItems.every(it => it.isReady);
      return {
        ...order,
        items: updatedItems,
        allReady,
        readyItemsCount: updatedItems.filter(it => it.isReady).length
      };
    }));

    try {
      const res = await fetch(`/api/pos/orders/${orderId}/toggle-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIndex, isReady: !currentReady })
      });
      if (!res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling item:', err);
      fetchData();
    }
  };

  const handleSaveTripay = async (e) => {
    e.preventDefault();
    try {
      setSavingTripay(true);
      const res = await fetch('/api/pos/config/tripay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripayConfig)
      });
      if (res.ok) {
        setTripaySavedMsg('✅ Konfigurasi TriPay berhasil disimpan!');
        setTimeout(() => setTripaySavedMsg(''), 3000);
        fetchData();
      } else {
        alert('Gagal menyimpan konfigurasi TriPay');
      }
    } catch (err) {
      alert('Kesalahan jaringan: ' + err.message);
    } finally {
      setSavingTripay(false);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'PENDING_CONFIRMATION');
  const cookingOrders = orders.filter(o => o.status === 'PREPARING');
  const waitingPayOrders = orders.filter(o => o.status === 'WAITING_PAYMENT');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  // Keuangan Metrics
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const qrisRevenue = completedOrders
    .filter(o => String(o.paymentMethod || '').toUpperCase().includes('QRIS'))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cashRevenue = completedOrders
    .filter(o => {
      const pm = String(o.paymentMethod || '').toUpperCase();
      return pm.includes('TUNAI') || pm.includes('CASH');
    })
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Palette definitions matching KostKu Theme
  const bgPage = isLight ? '#f1f5f9' : '#0b0f19';
  const bgCard = isLight ? '#ffffff' : '#131b2e';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#475569' : '#94a3b8';
  const borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const borderLight = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)';

  const quickPillStyle = (color) => ({
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 11px',
    borderRadius: '999px',
    border: isLight ? `1px solid ${color}40` : `1px solid ${color}55`,
    background: isLight ? `${color}12` : `${color}20`,
    color: isLight ? color : '#ffffff',
    fontSize: '0.73rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  });

  const renderCartSummaryContent = () => {
    const posCartItems = Object.values(posCart);
    const posCartSubtotal = posCartItems.reduce((s, it) => s + (it.product.price * it.qty), 0);
    const posPromoDiscount = activeCartPromo ? calculatePromoDiscountForCart(activeCartPromo, posCart) : 0;
    const posFinalTotal = Math.max(0, posCartSubtotal - posPromoDiscount);
    const numCashReceived = Number(posCashReceived.replace(/\D/g, '')) || 0;
    const cashChange = Math.max(0, numCashReceived - posFinalTotal);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '4px' }}>
            Pilih Nomor Meja:
          </label>
          <select
            value={selectedTable}
            onChange={e => setSelectedTable(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              background: isLight ? '#f8fafc' : '#1e293b',
              color: textPrimary,
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            {tables.map(t => (
              <option key={t.id} value={t.number}>{t.number}</option>
            ))}
          </select>
        </div>

        {/* Items in Cart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
          {posCartItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: textSecondary, fontSize: '0.8rem', padding: '1.5rem 0', margin: 0 }}>
              Keranjang masih kosong. Ketuk menu di katalog untuk menambah pesanan.
            </p>
          ) : (
            posCartItems.map(it => (
              <div
                key={it.product.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  fontSize: '0.8rem',
                  padding: '8px 10px',
                  background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.25)',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ overflow: 'hidden', paddingRight: '6px', flex: 1 }}>
                    <div style={{ color: textPrimary, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.product.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: textSecondary, fontFamily: 'var(--font-mono)' }}>
                      @ Rp {it.product.price?.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* Stepper +/- (WCAG Compliant min touch target >= 30px) */}
                    <div style={{ display: 'flex', alignItems: 'center', background: isLight ? '#e2e8f0' : '#1e293b', borderRadius: '8px', padding: '2px', border: `1px solid ${borderColor}` }}>
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(it.product.id, -1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: 'none',
                          background: isLight ? '#ffffff' : '#334155',
                          color: textPrimary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                        }}
                        aria-label={`Kurangi ${it.product.name}`}
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', padding: '0 8px', color: '#2563eb', fontFamily: 'var(--font-mono)', minWidth: '24px', textAlign: 'center' }}>
                        {it.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(it.product.id, 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: 'none',
                          background: isLight ? '#ffffff' : '#334155',
                          color: textPrimary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                        }}
                        aria-label={`Tambah ${it.product.name}`}
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                    </div>

                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.84rem', minWidth: '65px', textAlign: 'right' }}>
                      Rp {(it.product.price * it.qty).toLocaleString('id-ID')}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setPosCart(prev => {
                          const copy = { ...prev };
                          delete copy[it.product.id];
                          return copy;
                        });
                      }}
                      style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
                      title="Hapus"
                      aria-label="Hapus item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* DEF-06: Custom Kitchen Notes per Item */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>📝</span>
                  <input
                    type="text"
                    placeholder="Catatan koki (misal: pedas lv 2, tanpa es, dibungkus)..."
                    value={it.notes || ''}
                    onChange={e => updateCartItemNotes(it.product.id, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      borderRadius: '6px',
                      border: `1px solid ${borderColor}`,
                      background: isLight ? '#ffffff' : '#0f172a',
                      color: textPrimary,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {posCartItems.length > 0 && (
          <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
            {/* Selector Promo Makanan */}
            <div style={{
              background: isLight ? '#fefce8' : 'rgba(245, 158, 11, 0.1)',
              border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              padding: '7px 9px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Tag size={13} color="#d97706" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: textPrimary }}>
                    {activeCartPromo ? activeCartPromo.title : 'Promo Makanan:'}
                  </span>
                </div>
                {activeCartPromo ? (
                  <button
                    type="button"
                    onClick={() => setActiveCartPromo(null)}
                    style={{ fontSize: '0.68rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
                  >
                    ✕ Lepas
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoManagerModal(true);
                      loadPromos();
                    }}
                    style={{ fontSize: '0.68rem', color: '#b45309', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, textDecoration: 'underline' }}
                  >
                    + Kelola Promo
                  </button>
                )}
              </div>
              {!activeCartPromo && promosList.filter(p => p.isAvailable).length > 0 && (
                <select
                  onChange={(e) => {
                    const p = promosList.find(pr => pr.id === e.target.value);
                    if (p) setActiveCartPromo(p);
                  }}
                  defaultValue=""
                  style={{
                    width: '100%',
                    marginTop: '5px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    border: `1px solid ${borderColor}`,
                    background: bgCard,
                    color: textPrimary
                  }}
                >
                  <option value="" disabled>-- Pilih Promo Makanan Aktif --</option>
                  {promosList.filter(p => p.isAvailable).map(pr => (
                    <option key={pr.id} value={pr.id}>
                      {pr.title} ({pr.discountType === 'PERCENT' ? `${pr.discountValue}%` : `Rp ${pr.discountValue.toLocaleString('id-ID')}`}) • {pr.limitType === 'QUOTA' ? `Sisa ${pr.remainingQuota} porsi` : pr.limitType === 'DATE' ? `s/d ${pr.expiryDate}` : `Sisa ${pr.remainingQuota} porsi (s/d ${pr.expiryDate})`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: textSecondary }}>
              <span>Subtotal:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                Rp {posCartSubtotal.toLocaleString('id-ID')}
              </span>
            </div>

            {posPromoDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontWeight: 700 }}>
                <span>Diskon ({activeCartPromo?.code}):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  -Rp {posPromoDiscount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* DEF-10: Rincian Biaya Transparan (Rp 40 flat + Rp 60 held escrow per nota) */}
            <div style={{
              background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.15)',
              padding: '6px 8px',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '3px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: textSecondary, fontSize: '0.72rem' }}>
                <span>Biaya Layanan POS & Cloud:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>Rp 40</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '0.72rem' }}>
                <span>Deposit Promo Poin (100% Refundable):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>Rp 60</span>
              </div>
              <div style={{ fontSize: '0.64rem', color: textSecondary, fontStyle: 'italic', textAlign: 'right' }}>
                *Dipotong 1 kuota nota toko. Refund Rp 60 otomatis kembali di jam 00:01 jika nota unclaimed.
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1rem',
              fontWeight: 800,
              color: textPrimary,
              borderTop: `1px solid ${borderColor}`,
              paddingTop: '6px',
              marginTop: '2px'
            }}>
              <span>Total Tagihan:</span>
              <span style={{ color: '#16a34a', fontFamily: 'var(--font-mono)', fontSize: '1.15rem' }}>
                Rp {posFinalTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* DEF-03: Multi-Channel Payment Selector */}
            <div style={{ marginTop: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                Pilih Metode Pembayaran:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { id: 'CASH', label: '💵 Tunai', sub: 'Laci Uang RJ11' },
                  { id: 'QRIS', label: '💳 QRIS', sub: 'Dinamis TriPay' },
                  { id: 'TRANSFER', label: '📱 Bank', sub: 'Transfer / VA' }
                ].map(m => {
                  const isSelected = posPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPosPaymentMethod(m.id)}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                        background: isSelected ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.2)') : (isLight ? '#ffffff' : '#1e293b'),
                        color: isSelected ? '#2563eb' : textSecondary,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.74rem' }}>{m.label}</div>
                      <div style={{ fontSize: '0.6rem', opacity: 0.85 }}>{m.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DEF-04: Kalkulator Nominal Bayar & Uang Kembalian (Khusus Tunai) */}
            {posPaymentMethod === 'CASH' && (
              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                marginTop: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary }}>
                    Nominal Uang Diterima:
                  </label>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: numCashReceived > 0 && numCashReceived < posFinalTotal ? '#ef4444' : '#10b981'
                  }}>
                    {numCashReceived > 0 && numCashReceived < posFinalTotal
                      ? `Kurang Rp ${(posFinalTotal - numCashReceived).toLocaleString('id-ID')}`
                      : `Kembalian: Rp ${cashChange.toLocaleString('id-ID')}`}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={`Contoh: Rp ${posFinalTotal.toLocaleString('id-ID')} (Uang Pas)`}
                  value={posCashReceived ? `Rp ${Number(posCashReceived.replace(/\D/g, '')).toLocaleString('id-ID')}` : ''}
                  onChange={e => setPosCashReceived(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${numCashReceived > 0 && numCashReceived < posFinalTotal ? '#ef4444' : borderColor}`,
                    background: isLight ? '#ffffff' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                {/* Quick Cash Chips */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Uang Pas', val: posFinalTotal },
                    { label: '20k', val: 20000 },
                    { label: '50k', val: 50000 },
                    { label: '100k', val: 100000 }
                  ].map(chip => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setPosCashReceived(String(chip.val))}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        borderRadius: '6px',
                        border: `1px solid ${borderColor}`,
                        background: isLight ? '#ffffff' : '#1e293b',
                        color: textPrimary,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {posPaymentMethod === 'QRIS' && (
              <div style={{
                background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.12)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                marginTop: '4px',
                fontSize: '0.74rem',
                color: textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>💳</span>
                <div>
                  <strong>QRIS Dinamis TriPay / Mitra</strong>
                  <div style={{ fontSize: '0.68rem', color: textSecondary }}>
                    Pelanggan scan QRIS senilai Rp {posFinalTotal.toLocaleString('id-ID')}. Struk terbit dengan tanda lunas QRIS.
                  </div>
                </div>
              </div>
            )}

            {posPaymentMethod === 'TRANSFER' && (
              <div style={{
                background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginTop: '4px',
                fontSize: '0.74rem',
                color: textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>📱</span>
                <div>
                  <strong>Transfer Bank / E-Wallet</strong>
                  <div style={{ fontSize: '0.68rem', color: textSecondary }}>
                    Kasir memastikan mutasi dana masuk ke rekening sebelum menyelesaikan struk.
                  </div>
                </div>
              </div>
            )}

            {/* Saldo Nota Notification */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: '8px',
              background: Number(storeInfo.saldoNota ?? 5000) < 100 
                ? 'rgba(239, 68, 68, 0.12)' 
                : (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)'),
              border: Number(storeInfo.saldoNota ?? 5000) < 100 
                ? '1px solid #ef4444' 
                : '1px solid rgba(16, 185, 129, 0.25)',
              marginTop: '4px',
              fontSize: '0.72rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>🪙</span>
                <span style={{ fontWeight: 700, color: Number(storeInfo.saldoNota ?? 5000) < 100 ? '#ef4444' : '#10b981' }}>
                  {Number(storeInfo.saldoNota ?? 5000) < 100
                    ? `Saldo Nota: Rp ${(storeInfo.saldoNota || 0).toLocaleString('id-ID')} (Habis!)`
                    : `Sisa Nota: ${storeInfo.kuotaNota ?? 50} lembar`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPosTopupModal(true)}
                style={{
                  padding: '2px 7px',
                  borderRadius: '5px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                + Top Up
              </button>
            </div>

            {/* Manual Cash Drawer Quick Kick Button */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleKickDrawerManual}
                disabled={drawerKicking}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: isLight ? '1px dashed #10b981' : '1px dashed rgba(16, 185, 129, 0.4)',
                  background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
                title="Buka laci uang kasir secara manual (pulsa RJ11)"
              >
                <span>🔓</span>
                <span>{drawerKicking ? 'Membuka Laci...' : 'Buka Laci Uang Kasir (RJ11)'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Kosongkan semua item di keranjang?')) {
                    setPosCart({});
                    setActiveCartPromo(null);
                    setPosCashReceived('');
                    if (showMobileCartDrawer) setShowMobileCartDrawer(false);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  color: textSecondary,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Kosongkan
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (Number(storeInfo.saldoNota ?? 5000) < 100) {
                    setShowPosTopupModal(true);
                    alert(`⚠️ Saldo nota toko tidak mencukupi untuk transaksi kasir (sisa Rp ${(storeInfo.saldoNota || 0).toLocaleString('id-ID')}, dibutuhkan Rp 100). Silakan top up saldo nota terlebih dahulu.`);
                    return;
                  }

                  if (posPaymentMethod === 'CASH' && numCashReceived > 0 && numCashReceived < posFinalTotal) {
                    alert(`⚠️ Uang tunai yang diterima kurang dari total tagihan (Kurang Rp ${(posFinalTotal - numCashReceived).toLocaleString('id-ID')}).`);
                    return;
                  }

                  const effectiveCashReceived = posPaymentMethod === 'CASH' ? (numCashReceived || posFinalTotal) : posFinalTotal;
                  const effectiveChange = posPaymentMethod === 'CASH' ? Math.max(0, effectiveCashReceived - posFinalTotal) : 0;

                  const items = Object.values(posCart).map(it => ({
                    productId: it.product.id,
                    qty: it.qty,
                    notes: it.notes || ''
                  }));
                  const tbl = tables.find(t => t.number === selectedTable) || tables[0];
                  const res = await fetch('/api/pos/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      tableToken: tbl?.qrToken,
                      customerName: 'Kasir Walk-in (' + selectedTable + ')',
                      items,
                      promoId: activeCartPromo?.id,
                      promoCode: activeCartPromo?.code,
                      paymentMethod: posPaymentMethod,
                      cashReceived: effectiveCashReceived,
                      cashChange: effectiveChange
                    })
                  });
                  if (res.ok) {
                    const newO = await res.json();
                    await fetch(`/api/pos/orders/${newO.id}/acc`, { method: 'POST' });
                    const payRes = await fetch(`/api/pos/orders/${newO.id}/pay`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        method: posPaymentMethod,
                        cashReceived: effectiveCashReceived,
                        cashChange: effectiveChange
                      })
                    });
                    const payData = await payRes.json();
                    if (!payRes.ok) {
                      if (payData.requiresTopupNota) setShowPosTopupModal(true);
                      alert(payData.error || 'Gagal memproses pembayaran');
                      return;
                    }
                    setPosCart({});
                    setActiveCartPromo(null);
                    setPosCashReceived('');
                    if (showMobileCartDrawer) setShowMobileCartDrawer(false);
                    fetchData();
                    loadPromos();

                    // Automatic Cash Drawer Kick & Sound Effect (khusus Tunai)
                    if (posPaymentMethod === 'CASH' && printerSettings.openDrawer !== false) {
                      try {
                        playCashRegisterSound();
                        kickCashDrawer({
                          connectionType: printerSettings.connectionType || 'bluetooth',
                          pin: printerSettings.drawerPin || 2
                        }).catch(console.warn);
                      } catch (_) {}
                    }

                    // Auto Print Thermal Receipt
                    const receiptData = {
                      id: newO.id,
                      invoice_number: newO.invoice || newO.invoice_number || newO.id,
                      totalAmount: posFinalTotal,
                      subtotal: posCartSubtotal,
                      paymentMethod: posPaymentMethod === 'CASH' ? 'TUNAI (CASH)' : posPaymentMethod === 'QRIS' ? 'QRIS DINAMIS' : 'TRANSFER BANK',
                      cashReceived: effectiveCashReceived,
                      cashChange: effectiveChange,
                      tableNumber: selectedTable,
                      claimToken: newO.claim_token || newO.claimToken,
                      qrClaimUrl: newO.qr_claim_url || newO.qrClaimUrl,
                      claimDeadline: newO.claim_deadline || newO.claimDeadline,
                      storeName: storeInfo.storeName || 'KostKu Cafe & Resto',
                      createdAt: new Date().toISOString(),
                      items: items.map(it => {
                        const p = Object.values(posCart).find(c => c.product.id === it.productId)?.product;
                        return {
                          name: p?.name || 'Menu',
                          qty: it.qty,
                          notes: it.notes || '',
                          subtotal: (p?.price || 0) * it.qty
                        };
                      })
                    };

                    try {
                      printReceipt(receiptData, { openDrawer: false }).catch(console.warn);
                    } catch (_) {}

                    setReceiptOrder(receiptData);
                    const methodLabel = posPaymentMethod === 'CASH' ? 'Tunai (Laci Uang Terbuka)' : posPaymentMethod === 'QRIS' ? 'QRIS Dinamis' : 'Transfer Bank';
                    alert(`✅ Transaksi ${methodLabel} Berhasil! Nota telah diproses & masuk antrean dapur.`);
                  } else {
                    const err = await res.json();
                    alert(err.error || 'Gagal membuat pesanan');
                  }
                }}
                style={{
                  flex: 2,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: Number(storeInfo.saldoNota ?? 5000) < 100
                    ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: Number(storeInfo.saldoNota ?? 5000) < 100 ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {Number(storeInfo.saldoNota ?? 5000) < 100 
                  ? '⚠️ Top Up Nota' 
                  : posPaymentMethod === 'CASH'
                    ? 'Bayar Tunai & Cetak Struk'
                    : posPaymentMethod === 'QRIS'
                      ? 'Verifikasi QRIS & Cetak Struk'
                      : 'Konfirmasi Transfer & Cetak Struk'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: bgPage,
      color: textPrimary,
      fontFamily: 'var(--font-main, "Plus Jakarta Sans", sans-serif)',
      paddingBottom: '5rem'
    }}>
      {/* ── TOP HEADER / NAVBAR (SLEEK, COMPACT & MODERN POS) ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${borderColor}`,
        padding: '0.55rem 1rem',
        boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {/* Left: Back Arrow + Logo + Store Name + Live Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <Link 
              to="/dashboard" 
              title="Kembali ke Dashboard KostKu" 
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isLight ? '#f1f5f9' : '#1e293b',
                border: `1px solid ${borderColor}`,
                color: textPrimary,
                flexShrink: 0
              }}
            >
              <ArrowLeft size={16} />
            </Link>

            <img 
              src="/logo.png" 
              alt="Logo KostKu" 
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0
              }} 
            />

            <div style={{ minWidth: 0, overflow: 'hidden', flex: 1, maxWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <h1 style={{
                  margin: 0,
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  color: textPrimary,
                  letterSpacing: '-0.3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {storeInfo.storeName || 'KostKu POS'}
                </h1>
                {storeInfo.isValidated ? (
                  <span style={{
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '999px',
                    background: '#16a34a',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    ✓
                  </span>
                ) : (
                  <span 
                    onClick={() => setShowStoreModal(true)}
                    style={{
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '999px',
                      background: '#d97706',
                      color: '#ffffff',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    ⚠️
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.64rem', color: textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span>{storeInfo.location || 'Kantin'}</span>
                <span> • </span>
                <span style={{ color: user?.role === 'mitra' ? '#ec4899' : '#10b981', fontWeight: 600 }}>
                  {user ? (user.name.split(' ')[0]) : 'Kasir'}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Sisa Nota + Kelola Modal + Desktop-Only Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            {/* Saldo Kuota Nota Chip */}
            <button
              type="button"
              onClick={() => setShowPosTopupModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '999px',
                background: Number(storeInfo.saldoNota ?? 5000) < 100 
                  ? (isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.25)') 
                  : (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)'),
                border: Number(storeInfo.saldoNota ?? 5000) < 100 ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.5)',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: Number(storeInfo.saldoNota ?? 5000) < 100 ? '#ef4444' : (isLight ? '#92400e' : '#fbbf24'),
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}
              title="Klik untuk Top Up Saldo Kuota Nota Kasir"
            >
              <span>🪙</span>
              <span>{storeInfo.kuotaNota ?? 50}</span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 900,
                background: Number(storeInfo.saldoNota ?? 5000) < 100 ? '#ef4444' : '#2563eb',
                color: '#ffffff',
                padding: '1px 5px',
                borderRadius: '999px',
                marginLeft: '1px'
              }}>+Top Up</span>
            </button>

            {/* Tombol Pusat Kelola Kasir (Semua Fitur) */}
            <button
              type="button"
              onClick={() => setShowToolsDrawer(true)}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 9px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                background: isLight ? '#f1f5f9' : '#1e293b',
                color: textPrimary,
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Buka Pusat Kelola Fitur Kasir & Toko"
            >
              <Sliders size={13} color="#2563eb" />
              <span>Kelola</span>
              {inventoryAlerts.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: '#ef4444'
                }} />
              )}
            </button>

            {/* Desktop-Only Secondary Controls: Theme, Sound, Refresh */}
            <div className="desktop-only-flex" style={{ alignItems: 'center', gap: '5px' }}>
              <button
                onClick={toggleTheme}
                style={{
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  padding: '5px 7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: textSecondary
                }}
                title="Ganti Tema Terang/Gelap"
              >
                {isLight ? <Moon size={14} /> : <Sun size={14} color="#f59e0b" />}
              </button>

              <button
                onClick={() => setAudioAlert(!audioAlert)}
                style={{
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  padding: '5px 7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: audioAlert ? '#10b981' : textSecondary
                }}
                title={audioAlert ? 'Suara Aktif' : 'Suara Mati'}
              >
                {audioAlert ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              <button
                onClick={fetchData}
                style={{
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  padding: '5px 7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: textSecondary
                }}
                title="Refresh Data"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── PERINGATAN KUOTA MENIPIS (THRESHOLD ALERT <= 15 NOTA) ── */}
      {(storeInfo.kuotaNota ?? 50) <= 15 && (
        <div style={{
          maxWidth: '1280px',
          margin: '0.5rem auto 0',
          padding: '0 1rem'
        }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: (storeInfo.kuotaNota ?? 50) <= 5 ? '#fef2f2' : '#fffbeb',
            border: (storeInfo.kuotaNota ?? 50) <= 5 ? '1px solid #fecaca' : '1px solid #fde68a',
            color: (storeInfo.kuotaNota ?? 50) <= 5 ? '#991b1b' : '#92400e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <div style={{ fontSize: '0.76rem', lineHeight: 1.35 }}>
                <strong>Kuota nota gratis Anda tersisa {storeInfo.kuotaNota ?? 0} transaksi.</strong><br />
                <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>Lakukan top up agar operasional kasir tetap lancar.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPosTopupModal(true)}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                borderRadius: '8px',
                background: (storeInfo.kuotaNota ?? 50) <= 5 ? '#dc2626' : '#d97706',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              Top Up
            </button>
          </div>
        </div>
      )}

      {/* ── HORIZONTAL QUICK TOOLBAR (1-BARIS PRAKTIS & RAMPING) ── */}
      <div style={{
        maxWidth: '1280px',
        width: '100%',
        boxSizing: 'border-box',
        margin: '0 auto',
        padding: '0.45rem 1rem 0',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Multi-Store Switcher jika ada toko lain */}
        {storeInfo.allOwnerStores && storeInfo.allOwnerStores.length > 1 && (
          <select
            value={storeInfo.merchantId}
            onChange={(e) => handleSwitchPosStore(e.target.value)}
            style={{
              flexShrink: 0,
              padding: '4px 8px',
              borderRadius: '999px',
              border: `1px solid ${borderColor}`,
              background: isLight ? '#ffffff' : '#1e293b',
              color: textPrimary,
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {storeInfo.allOwnerStores.map(s => (
              <option key={s.id} value={s.id}>
                🏪 {s.name} ({s.kuotaNota} nota)
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => { setShowPromoManagerModal(true); loadPromos(); }}
          style={quickPillStyle('#f59e0b')}
        >
          <Tag size={12} color="#f59e0b" />
          <span>Promo</span>
        </button>

        <button
          type="button"
          onClick={() => { setShowInventoryModal(true); setInventoryTab('stock'); loadInventory(); }}
          style={inventoryAlerts.length > 0 ? {
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 11px',
            borderRadius: '999px',
            border: '1px solid #ef4444',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '0.73rem',
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
          } : quickPillStyle('#ef4444')}
        >
          <Package size={12} color={inventoryAlerts.length > 0 ? '#ffffff' : '#ef4444'} />
          <span>Gudang</span>
          {inventoryAlerts.length > 0 && (
            <span style={{ background: '#ffffff', color: '#dc2626', fontSize: '0.62rem', fontWeight: 900, padding: '0 4px', borderRadius: '999px' }}>
              {inventoryAlerts.length}!
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setShowAnalyticsModal(true); loadAnalytics(); }}
          style={quickPillStyle('#6366f1')}
        >
          <BarChart3 size={12} color="#6366f1" />
          <span>Statistik</span>
        </button>

        <button
          type="button"
          onClick={() => setShowLoyaltyModal(true)}
          style={quickPillStyle('#3b82f6')}
        >
          <Award size={12} color="#3b82f6" />
          <span>Stamp</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHardwareModal(true)}
          style={quickPillStyle('#10b981')}
          title="Koneksikan Laci Kasir (RJ11) & Printer Thermal"
        >
          <Printer size={12} color="#10b981" />
          <span>Laci &amp; Print</span>
        </button>

        <button
          type="button"
          onClick={handleKickDrawerManual}
          disabled={drawerKicking}
          style={{
            ...quickPillStyle('#059669'),
            background: drawerKicking ? '#10b981' : (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.2)'),
            color: drawerKicking ? '#ffffff' : (isLight ? '#047857' : '#34d399')
          }}
          title="Buka Laci Uang Kasir (Pulsa RJ11)"
        >
          <span>🔓</span>
          <span>{drawerKicking ? 'Buka...' : 'Buka Laci'}</span>
        </button>

        <Link
          to="/karyawan"
          style={{ ...quickPillStyle('#8b5cf6'), textDecoration: 'none' }}
        >
          <Users size={12} color="#8b5cf6" />
          <span>Karyawan</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowStoreModal(true)}
          style={quickPillStyle('#14b8a6')}
        >
          <MapPin size={12} color="#14b8a6" />
          <span>Lokasi Toko</span>
        </button>
      </div>

      {/* ── BANNER PERINGATAN GUDANG RAMPING (HANYA MUNCUL JIKA ADA BAHAN MENIPIS) ── */}
      {inventoryAlerts.length > 0 && !isAlertDismissed && (
        <div style={{ maxWidth: '1280px', margin: '0.4rem auto 0', padding: '0 1rem' }}>
          <div style={{
            padding: '6px 12px',
            borderRadius: '10px',
            background: isLight ? '#fff1f2' : 'rgba(239, 68, 68, 0.16)',
            border: '1px solid #f87171',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              <ShieldAlert size={14} color="#ef4444" style={{ flexShrink: 0 }} />
              <strong style={{ color: isLight ? '#991b1b' : '#fca5a5', flexShrink: 0 }}>
                {inventoryAlerts.length} Bahan Menipis:
              </strong>
              <span style={{ color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {inventoryAlerts.slice(0, 3).map(a => `${a.name} (${a.currentStock} ${a.unit})`).join(' • ')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => {
                  setShowInventoryModal(true);
                  setInventoryTab('stock');
                  loadInventory();
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Restock
              </button>
              <button
                type="button"
                onClick={() => setIsAlertDismissed(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: textSecondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
                title="Tutup Peringatan"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODERN SEGMENTED TAB BAR (4 SEGMEN RAMPING PRESISI) ── */}
      <div style={{ maxWidth: '1280px', margin: '0.5rem auto 0', padding: '0 1rem' }}>
        <div style={{
          background: isLight ? '#e2e8f0' : '#1e293b',
          borderRadius: '12px',
          padding: '3px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px'
        }}>
          {[
            { id: 'pos', label: 'Kasir', icon: <ShoppingBag size={14} /> },
            { id: 'kds', label: 'Dapur', icon: <Flame size={14} />, badge: pendingOrders.length },
            { id: 'tables', label: 'Meja & QR', icon: <QrCode size={14} /> },
            { id: 'settings', label: 'Keuangan', icon: <DollarSign size={14} /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '8px 4px',
                  borderRadius: '9px',
                  border: 'none',
                  background: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : textSecondary,
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none'
                }}
              >
                {tab.icon}
                <span style={{ whiteSpace: 'nowrap' }}>{tab.label}</span>
                {tab.badge > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: '999px',
                    lineHeight: 1
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: DAPUR KITCHEN DISPLAY SYSTEM (KDS) ── */}
      {activeTab === 'kds' && (
        <main style={{ maxWidth: '1280px', margin: '1.25rem auto 0', padding: '0 1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 800,
                color: textPrimary,
                letterSpacing: '-0.3px'
              }}>
                Antrean Pesanan Masuk
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: textSecondary }}>
                Total antrean aktif saat ini: <strong>{pendingOrders.length + cookingOrders.length} pesanan</strong>
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* ── KOLOM 1: PERLU ACC DAPUR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '8px',
                borderBottom: '2px solid #f59e0b'
              }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: isLight ? '#b45309' : '#fbbf24',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                  1. Perlu ACC ({pendingOrders.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: textSecondary, fontWeight: 600 }}>Cek Stok</span>
              </div>

              {pendingOrders.length === 0 ? (
                <div style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  background: bgCard,
                  border: `1.5px dashed ${borderColor}`,
                  borderRadius: '16px',
                  color: textSecondary,
                  fontSize: '0.82rem'
                }}>
                  Tidak ada pesanan yang menunggu konfirmasi.
                </div>
              ) : (
                pendingOrders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      background: bgCard,
                      border: isLight ? '1.5px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '16px',
                      padding: '1.1rem',
                      boxShadow: isLight ? '0 4px 14px rgba(245, 158, 11, 0.08)' : '0 4px 14px rgba(0,0,0,0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: textPrimary,
                          display: 'block'
                        }}>
                          {order.tableNumber}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: textSecondary }}>
                          {order.customerName} • {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)',
                        color: isLight ? '#b45309' : '#fbbf24',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        Rp {order.totalAmount?.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Items List */}
                    <div style={{
                      background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '12px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      {order.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span style={{ color: textPrimary }}>
                            <strong style={{ color: '#2563eb' }}>{it.qty}x</strong> {it.name}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: textSecondary }}>
                            Rp {it.subtotal?.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div style={{
                        background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)',
                        border: '1.5px solid #fde68a',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        fontSize: '0.78rem',
                        color: isLight ? '#92400e' : '#fef08a',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <MessageSquare size={14} style={{ flexShrink: 0 }} />
                        <span><strong>Catatan Pembeli:</strong> "{order.notes}"</span>
                      </div>
                    )}

                    {/* Diskon Khusus Admin Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {order.adminDiscount ? (
                        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                          ✓ Diskon Admin: -Rp {order.adminDiscount.amount?.toLocaleString('id-ID')} ({order.adminDiscount.reason})
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: textSecondary }}>
                          Belum ada diskon admin
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderForDiscount(order);
                          setDiscountForm({ type: 'FIXED', value: '', reason: '' });
                          setShowDiscountModal(true);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)',
                          color: isLight ? '#b45309' : '#fbbf24',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Percent size={12} />
                        <span>{order.adminDiscount ? 'Ubah Diskon' : '+ Diskon Admin'}</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={() => handleRejectOrder(order.id)}
                        style={{
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: `1px solid ${borderColor}`,
                          background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                          color: isLight ? '#b91c1c' : '#f87171',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleAccOrder(order.id)}
                        style={{
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Check size={16} strokeWidth={3} /> ACC PESANAN
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── KOLOM 2: MENUNGGU BAYAR (INVOICE TRIPAY / KAMAR) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '8px',
                borderBottom: '2px solid #3b82f6'
              }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: isLight ? '#1d4ed8' : '#60a5fa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CreditCard size={15} />
                  2. Menunggu Bayar ({waitingPayOrders.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: textSecondary, fontWeight: 600 }}>Invoice Siap</span>
              </div>

              {waitingPayOrders.length === 0 ? (
                <div style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  background: bgCard,
                  border: `1.5px dashed ${borderColor}`,
                  borderRadius: '16px',
                  color: textSecondary,
                  fontSize: '0.82rem'
                }}>
                  Semua pesanan yang di-ACC sudah lunas.
                </div>
              ) : (
                waitingPayOrders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      background: bgCard,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '16px',
                      padding: '1.1rem',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: textPrimary, display: 'block' }}>
                          {order.tableNumber}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: textSecondary }}>
                          {order.customerName}
                        </span>
                      </div>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isLight ? '#e0e7ff' : 'rgba(59, 130, 246, 0.15)',
                        color: isLight ? '#3730a3' : '#93c5fd',
                        fontWeight: 700,
                        fontSize: '0.72rem'
                      }}>
                        Menunggu QRIS / Kamar
                      </span>
                    </div>

                    <div style={{
                      background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '10px',
                      padding: '8px 10px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {order.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: textSecondary }}>
                          <span>{it.qty}x {it.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>Rp {it.subtotal?.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 800,
                        color: textPrimary,
                        paddingTop: '4px',
                        marginTop: '4px',
                        borderTop: `1px solid ${borderColor}`
                      }}>
                        <span>Total Tagihan:</span>
                        <span style={{ color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                          Rp {order.totalAmount?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleConfirmPaid(order.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid #10b981',
                        background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
                        color: isLight ? '#065f46' : '#34d399',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={15} /> Konfirmasi Bayar Tunai (Kasir)
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* ── KOLOM 3: SEDANG DIMASAK DI DAPUR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '8px',
                borderBottom: '2px solid #10b981'
              }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: isLight ? '#047857' : '#34d399',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Flame size={15} />
                  3. Sedang Dimasak ({cookingOrders.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: textSecondary, fontWeight: 600 }}>Koki Aktif</span>
              </div>

              {cookingOrders.length === 0 ? (
                <div style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  background: bgCard,
                  border: `1.5px dashed ${borderColor}`,
                  borderRadius: '16px',
                  color: textSecondary,
                  fontSize: '0.82rem'
                }}>
                  Dapur sedang santai, tidak ada antrean masak.
                </div>
              ) : (
                cookingOrders.map(order => {
                  const readyCount = (order.items || []).filter(it => it.isReady).length;
                  const totalItems = (order.items || []).length;
                  const allItemsReady = totalItems > 0 && readyCount === totalItems;

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: bgCard,
                        border: allItemsReady
                          ? (isLight ? '2px solid #10b981' : '2px solid #059669')
                          : (isLight ? '1.5px solid #a7f3d0' : '1px solid rgba(16, 185, 129, 0.4)'),
                        borderRadius: '16px',
                        padding: '1.1rem',
                        boxShadow: allItemsReady
                          ? '0 6px 20px rgba(16, 185, 129, 0.15)'
                          : 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Ticket Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: textPrimary }}>
                              {order.tableNumber}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: isLight ? '#f1f5f9' : '#1e293b',
                              color: textSecondary
                            }}>
                              {order.customerName}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: String(order.paymentMethod || '').toUpperCase().includes('CASH') ? '#d97706' : '#16a34a',
                            display: 'block',
                            marginTop: '2px'
                          }}>
                            {String(order.paymentMethod || '').toUpperCase().includes('CASH') ? 'Tunai di Kasir' : 'Lunas QRIS TriPay'}
                          </span>
                        </div>

                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          background: allItemsReady ? '#dcfce7' : '#fef3c7',
                          color: allItemsReady ? '#15803d' : '#b45309',
                          border: allItemsReady ? '1px solid #86efac' : '1px solid #fde68a',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {allItemsReady ? '✨ Siap Diantar' : `🍳 Memasak (${readyCount}/${totalItems})`}
                        </span>
                      </div>

                      {/* Readiness Progress Bar & Instructions */}
                      <div style={{
                        background: allItemsReady
                          ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)')
                          : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)'),
                        border: `1px solid ${allItemsReady ? '#86efac' : borderColor}`,
                        borderRadius: '10px',
                        padding: '8px 10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: allItemsReady ? '#16a34a' : textSecondary
                          }}>
                            {allItemsReady ? '🎉 SEMUA MENU SIAP DI MEJA DAPUR' : '👉 Ketuk setiap menu jika sudah selesai dimasak:'}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: allItemsReady ? '#16a34a' : '#2563eb'
                          }}>
                            {readyCount}/{totalItems} Siap ({Math.round((readyCount / Math.max(1, totalItems)) * 100)}%)
                          </span>
                        </div>
                        {/* Progress Bar Track */}
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
                      </div>

                      {/* Interactive Menu Items Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {order.items.map((it, idx) => {
                          const isItemReady = Boolean(it.isReady);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleToggleItemReady(order.id, idx, isItemReady)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                border: isItemReady
                                  ? (isLight ? '1.5px solid #22c55e' : '1.5px solid #10b981')
                                  : (isLight ? `1.5px solid ${borderColor}` : '1.5px solid rgba(255, 255, 255, 0.12)'),
                                background: isItemReady
                                  ? (isLight ? '#f0fdf4' : 'rgba(34, 197, 94, 0.12)')
                                  : (isLight ? '#ffffff' : '#131b2e'),
                                boxShadow: isItemReady
                                  ? (isLight ? '0 2px 8px rgba(34, 197, 94, 0.15)' : 'none')
                                  : 'var(--shadow-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                transition: 'all 0.15s ease'
                              }}
                              title={isItemReady ? 'Klik untuk batal siap' : 'Klik jika menu ini sudah matang'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                {/* Checkbox Indicator */}
                                <div style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isItemReady
                                    ? '#16a34a'
                                    : (isLight ? '#f1f5f9' : '#1e293b'),
                                  color: isItemReady ? '#ffffff' : textSecondary,
                                  border: isItemReady ? 'none' : `1.5px solid ${borderColor}`,
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  flexShrink: 0
                                }}>
                                  {isItemReady ? <Check size={16} strokeWidth={3} /> : idx + 1}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <span style={{
                                    fontSize: '0.86rem',
                                    fontWeight: 800,
                                    color: isItemReady ? (isLight ? '#15803d' : '#86efac') : textPrimary,
                                    textDecoration: isItemReady ? 'line-through' : 'none',
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    <strong style={{ color: isItemReady ? '#16a34a' : '#2563eb' }}>{it.qty}x</strong> {it.name}
                                  </span>
                                  {it.notes && (
                                    <span style={{ fontSize: '0.7rem', color: textSecondary, fontStyle: 'italic', display: 'block' }}>
                                      Catatan: {it.notes}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Status Badge */}
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                background: isItemReady
                                  ? (isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.25)')
                                  : (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)'),
                                color: isItemReady
                                  ? (isLight ? '#15803d' : '#4ade80')
                                  : (isLight ? '#b45309' : '#fbbf24'),
                                border: isItemReady
                                  ? (isLight ? '1px solid #bbf7d0' : '1px solid rgba(34, 197, 94, 0.35)')
                                  : '1px solid rgba(245, 158, 11, 0.35)'
                              }}>
                                {isItemReady ? '✓ Siap' : '🍳 Masak'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Ticket Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          onClick={() => setReceiptOrder(order)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: `1px solid ${borderColor}`,
                            background: isLight ? '#f1f5f9' : '#1e293b',
                            color: textPrimary,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Cetak Struk Thermal"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: allItemsReady
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : (isLight ? '#f1f5f9' : '#1e293b'),
                            color: allItemsReady ? '#ffffff' : textSecondary,
                            border: allItemsReady ? 'none' : `1px solid ${borderColor}`,
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: allItemsReady ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <CheckCircle2 size={16} />
                          {allItemsReady
                            ? '🚀 Semua Siap — Antar ke Meja!'
                            : `Antar ke Meja (${readyCount}/${totalItems} Siap)`}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      )}

      {/* ── TAB 2: KASIR POS REGISTER (TOUCH POS) ── */}
      {activeTab === 'pos' && (
        <main style={{ maxWidth: '1280px', margin: '1.25rem auto 0', padding: '0 1rem' }}>
          <div className="pos-workspace-grid">
            {/* Left: Product Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0, width: '100%' }}>
              {/* Unified Search & Quick Actions Bar (Single Compact Row) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', minWidth: 0 }}>
                {/* Live Search Input Bar */}
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
                  <input
                    type="text"
                    placeholder="Cari menu makanan, minuman..."
                    value={posSearchQuery}
                    onChange={e => setPosSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '7px 28px 7px 30px',
                      borderRadius: '10px',
                      border: `1px solid ${borderColor}`,
                      background: isLight ? '#ffffff' : '#1e293b',
                      color: textPrimary,
                      fontSize: '0.78rem',
                      outline: 'none',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
                  {posSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPosSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: textSecondary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Grid / List Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  padding: '2px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  flexShrink: 0
                }}>
                  <button
                    type="button"
                    onClick={() => setPosViewMode('grid')}
                    title="Tampilan Grid"
                    style={{
                      padding: '5px 7px',
                      borderRadius: '6px',
                      border: 'none',
                      background: posViewMode === 'grid' ? '#2563eb' : 'transparent',
                      color: posViewMode === 'grid' ? '#ffffff' : textSecondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <LayoutGrid size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosViewMode('list')}
                    title="Tampilan List"
                    style={{
                      padding: '5px 7px',
                      borderRadius: '6px',
                      border: 'none',
                      background: posViewMode === 'list' ? '#2563eb' : 'transparent',
                      color: posViewMode === 'list' ? '#ffffff' : textSecondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <List size={13} />
                  </button>
                </div>

                {/* + Menu Baru (Compact Button) */}
                <button
                  type="button"
                  onClick={handleOpenAddMenu}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                  }}
                  title="Tambah Menu Baru"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Menu</span>
                </button>
              </div>

              {/* Category Filter Pills: HORIZONTAL SLEEK SCROLL (NO CLUTTER) */}
              <div style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: '2px',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box'
              }}>
                {posCategories.map(cat => {
                  const isActive = posCategory === cat;
                  const count = cat === 'Semua'
                    ? products.length
                    : products.filter(p => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPosCategory(cat)}
                      style={{
                        flexShrink: 0,
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: isActive ? '1.5px solid #2563eb' : `1px solid ${borderColor}`,
                        background: isActive
                          ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                          : (isLight ? '#ffffff' : '#1e293b'),
                        color: isActive ? '#ffffff' : textSecondary,
                        boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{getCategoryIcon(cat)}</span>
                      <span>{cat}</span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '999px',
                        background: isActive ? 'rgba(255, 255, 255, 0.25)' : (isLight ? '#f1f5f9' : '#0f172a'),
                        color: isActive ? '#ffffff' : textSecondary
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Product Cards: GRID OR LIST VIEW */}
              {(() => {
                const q = posSearchQuery.trim().toLowerCase();
                const filteredPosProducts = products.filter(p => {
                  const matchesCat = posCategory === 'Semua' || p.category === posCategory;
                  const matchesSearch = !q || 
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.description && p.description.toLowerCase().includes(q)) ||
                    (p.category && p.category.toLowerCase().includes(q));
                  return matchesCat && matchesSearch;
                });

                if (filteredPosProducts.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem 1rem',
                      background: bgCard,
                      borderRadius: '16px',
                      border: `1px solid ${borderColor}`,
                      color: textSecondary
                    }}>
                      <Utensils size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, color: textPrimary }}>
                        Menu Tidak Ditemukan
                      </p>
                      <p style={{ fontSize: '0.76rem', margin: '4px 0 12px' }}>
                        Tidak ada menu untuk pencarian "{posSearchQuery}" di kategori {posCategory}.
                      </p>
                      {posSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setPosSearchQuery('')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${borderColor}`,
                            background: isLight ? '#f1f5f9' : '#1e293b',
                            color: '#2563eb',
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            cursor: 'pointer'
                          }}
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </div>
                  );
                }

                return posViewMode === 'grid' ? (
                  <div className="pos-product-grid">
                    {filteredPosProducts.map(p => {
                      const inCart = posCart[p.id]?.qty || 0;
                      return (
                        <div
                          key={p.id}
                          style={{
                            background: bgCard,
                            border: inCart > 0 ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                            borderRadius: '14px',
                            padding: '8px',
                            boxShadow: inCart > 0 ? '0 4px 14px rgba(37, 99, 235, 0.15)' : 'var(--shadow-sm)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            minWidth: 0,
                            boxSizing: 'border-box'
                          }}
                        >
                          {/* Image & In-Cart Badge */}
                          <div 
                            onClick={() => {
                              setQuickQtyProduct(p);
                              setQuickQtyValue(inCart > 0 ? inCart : (cardSelectedQty[p.id] || 1));
                            }}
                            title="Klik untuk opsi berapa pcs"
                            style={{ position: 'relative', width: '100%', marginBottom: '6px', cursor: 'pointer' }}
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
                              }}
                            />
                            {/* Action Buttons Overlay: Edit */}
                            <div style={{ position: 'absolute', top: '5px', left: '5px', display: 'flex', gap: '3px' }}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenEditMenu(p); }}
                                title={`Edit ${p.name}`}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '999px',
                                  border: 'none',
                                  background: 'rgba(0, 0, 0, 0.65)',
                                  color: '#38bdf8',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backdropFilter: 'blur(4px)'
                                }}
                              >
                                <Edit3 size={12} />
                              </button>
                            </div>

                            {p.isAvailable === false && (
                              <span style={{
                                position: 'absolute',
                                bottom: '5px',
                                left: '5px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: '#ef4444',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.6rem'
                              }}>
                                HABIS
                              </span>
                            )}

                            {inCart > 0 && (
                              <span style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                background: '#2563eb',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}>
                                <Check size={10} strokeWidth={3} /> {inCart} pcs
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div
                              onClick={() => {
                                setQuickQtyProduct(p);
                                setQuickQtyValue(inCart > 0 ? inCart : (cardSelectedQty[p.id] || 1));
                              }}
                              style={{ cursor: 'pointer' }}
                              title="Klik untuk opsi berapa pcs"
                            >
                              <h4 style={{
                                margin: 0,
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                color: textPrimary,
                                lineHeight: 1.25,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {p.name}
                              </h4>
                              <div style={{
                                fontSize: '0.86rem',
                                fontWeight: 800,
                                color: '#2563eb',
                                fontFamily: 'var(--font-mono)',
                                margin: '3px 0 6px'
                              }}>
                                Rp {p.price?.toLocaleString('id-ID')}
                              </div>
                            </div>

                            {/* Stepper / Add button */}
                            <div style={{ marginTop: 'auto' }}>
                              {inCart > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {/* QTY DI ATAS TULISAN TAMBAH: Stepper Aktif di Keranjang dengan Opsi Berapa Pcs */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)',
                                    border: '1.5px solid #10b981',
                                    borderRadius: '8px',
                                    padding: '2px 5px',
                                    marginBottom: '2px'
                                  }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQuickQtyProduct(p);
                                        setQuickQtyValue(inCart);
                                      }}
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: isLight ? '#15803d' : '#86efac',
                                        fontWeight: 800,
                                        fontSize: '0.68rem',
                                        cursor: 'pointer',
                                        padding: '1px 2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px'
                                      }}
                                      title="Opsi Berapa Pcs (Buka Dial Presets)"
                                    >
                                      <span>Qty:</span>
                                      <span style={{ fontSize: '0.62rem' }}>⚙️</span>
                                    </button>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <button
                                        type="button"
                                        onClick={() => updateCartItemQty(p.id, -1)}
                                        style={{
                                          width: '22px',
                                          height: '22px',
                                          borderRadius: '6px',
                                          border: 'none',
                                          background: '#ef4444',
                                          color: '#ffffff',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                          padding: 0
                                        }}
                                        aria-label={`Kurangi ${p.name}`}
                                      >
                                        <Minus size={11} strokeWidth={3} />
                                      </button>

                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        background: isLight ? '#ffffff' : '#1e293b',
                                        border: '1px solid #10b981',
                                        borderRadius: '6px',
                                        padding: '1px 3px'
                                      }}>
                                        <input
                                          type="number"
                                          min="0"
                                          max="999"
                                          value={inCart}
                                          onChange={e => setCartItemExactQty(p.id, e.target.value)}
                                          onClick={e => e.stopPropagation()}
                                          style={{
                                            width: '26px',
                                            textAlign: 'center',
                                            fontWeight: 900,
                                            fontSize: '0.8rem',
                                            color: isLight ? '#15803d' : '#86efac',
                                            fontFamily: 'var(--font-mono)',
                                            border: 'none',
                                            background: 'transparent',
                                            outline: 'none',
                                            padding: 0
                                          }}
                                          aria-label={`Jumlah pcs ${p.name}`}
                                        />
                                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: isLight ? '#166534' : '#86efac' }}>pcs</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          updateCartItemQty(p.id, 1);
                                          try { playChime(880, 0.08); } catch (_) {}
                                          triggerCometArc({ startEl: e.currentTarget, targetEl: document.querySelector('[data-cart-target="pos-cart-summary"]'), color: '#38bdf8', duration: 450 });
                                        }}
                                        style={{
                                          width: '22px',
                                          height: '22px',
                                          borderRadius: '6px',
                                          border: 'none',
                                          background: '#10b981',
                                          color: '#ffffff',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                          padding: 0
                                        }}
                                        aria-label={`Tambah ${p.name}`}
                                      >
                                        <Plus size={11} strokeWidth={3} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* TULISAN TAMBAH: Tambah Lagi */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      updateCartItemQty(p.id, 1);
                                      try { playChime(880, 0.08); } catch (_) {}
                                      triggerCometArc({ startEl: e.currentTarget, targetEl: document.querySelector('[data-cart-target="pos-cart-summary"]'), color: '#38bdf8', duration: 450 });
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      borderRadius: '7px',
                                      border: '1px solid #10b981',
                                      background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)',
                                      color: isLight ? '#15803d' : '#86efac',
                                      fontWeight: 800,
                                      fontSize: '0.76rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Plus size={12} strokeWidth={2.5} />
                                    <span>Tambah Lagi (+1 pcs)</span>
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                                  {/* QTY DI ATAS TULISAN TAMBAH: Opsi Tambah Berapa Pcs */}
                                  {(() => {
                                    const itemQty = cardSelectedQty[p.id] || 1;
                                    return (
                                      <>
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                                          border: `1px solid ${borderColor}`,
                                          borderRadius: '8px',
                                          padding: '2px 5px',
                                          marginBottom: '2px'
                                        }}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setQuickQtyProduct(p);
                                              setQuickQtyValue(itemQty);
                                            }}
                                            style={{
                                              border: 'none',
                                              background: 'transparent',
                                              color: '#2563eb',
                                              fontWeight: 800,
                                              fontSize: '0.68rem',
                                              cursor: 'pointer',
                                              padding: '1px 2px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '2px'
                                            }}
                                            title="Opsi Berapa Pcs (Buka Dial Presets)"
                                          >
                                            <span>Qty:</span>
                                            <span style={{ fontSize: '0.62rem' }}>⚙️</span>
                                          </button>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <button
                                              type="button"
                                              disabled={itemQty <= 1}
                                              onClick={() => setCardSelectedQty(prev => ({ ...prev, [p.id]: Math.max(1, itemQty - 1) }))}
                                              style={{
                                                width: '22px',
                                                height: '22px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: itemQty <= 1 ? (isLight ? '#e2e8f0' : '#334155') : '#ef4444',
                                                color: itemQty <= 1 ? (isLight ? '#94a3b8' : '#64748b') : '#ffffff',
                                                cursor: itemQty <= 1 ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0
                                              }}
                                              aria-label="Kurangi pcs"
                                            >
                                              <Minus size={11} strokeWidth={3} />
                                            </button>

                                            <div style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '2px',
                                              background: isLight ? '#ffffff' : '#1e293b',
                                              border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                                              borderRadius: '6px',
                                              padding: '1px 3px'
                                            }}>
                                              <input
                                                type="number"
                                                min="1"
                                                max="999"
                                                value={itemQty}
                                                onChange={e => {
                                                  const val = parseInt(e.target.value, 10);
                                                  setCardSelectedQty(prev => ({ ...prev, [p.id]: isNaN(val) ? 1 : Math.max(1, Math.min(999, val)) }));
                                                }}
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                  width: '26px',
                                                  textAlign: 'center',
                                                  fontWeight: 900,
                                                  fontSize: '0.8rem',
                                                  color: textPrimary,
                                                  fontFamily: 'var(--font-mono)',
                                                  border: 'none',
                                                  background: 'transparent',
                                                  outline: 'none',
                                                  padding: 0
                                                }}
                                                aria-label={`Jumlah pcs ${p.name}`}
                                              />
                                              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: textSecondary }}>pcs</span>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => setCardSelectedQty(prev => ({ ...prev, [p.id]: itemQty + 1 }))}
                                              style={{
                                                width: '22px',
                                                height: '22px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: '#10b981',
                                                color: '#ffffff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0
                                              }}
                                              aria-label="Tambah pcs"
                                            >
                                              <Plus size={11} strokeWidth={3} />
                                            </button>
                                          </div>
                                        </div>

                                        {/* TULISAN TAMBAH: Tombol Tambah Utama */}
                                        <button
                                          type="button"
                                          disabled={p.isAvailable === false}
                                          onClick={(e) => {
                                            updateCartItemQty(p.id, itemQty);
                                            setCardSelectedQty(prev => ({ ...prev, [p.id]: 1 }));
                                            try { playChime(880, 0.08); } catch (_) {}
                                            triggerCometArc({ startEl: e.currentTarget, targetEl: document.querySelector('[data-cart-target="pos-cart-summary"]'), color: '#38bdf8', duration: 450 });
                                          }}
                                          style={{
                                            width: '100%',
                                            padding: '7px 8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: p.isAvailable === false ? (isLight ? '#cbd5e1' : '#334155') : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            fontSize: '0.78rem',
                                            cursor: p.isAvailable === false ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            boxShadow: p.isAvailable === false ? 'none' : '0 2px 6px rgba(37, 99, 235, 0.25)'
                                          }}
                                        >
                                          <Plus size={13} strokeWidth={2.5} />
                                          <span>Tambah ({itemQty} pcs)</span>
                                        </button>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* LIST VIEW MODE */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredPosProducts.map(p => {
                      const inCart = posCart[p.id]?.qty || 0;
                      return (
                        <div
                          key={p.id}
                          style={{
                            background: bgCard,
                            border: inCart > 0 ? '1.5px solid #2563eb' : `1px solid ${borderColor}`,
                            borderRadius: '12px',
                            padding: '8px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            boxShadow: inCart > 0 ? '0 4px 14px rgba(37, 99, 235, 0.1)' : 'var(--shadow-sm)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
                              }}
                            />
                            {inCart > 0 && (
                              <span style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '999px',
                                background: '#2563eb',
                                color: '#fff',
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {inCart}
                              </span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.name}
                              </h4>
                              {p.isAvailable === false && (
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#ef4444' }}>• HABIS</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                              Rp {p.price?.toLocaleString('id-ID')}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {inCart > 0 ? (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)',
                                border: '1.5px solid #10b981',
                                borderRadius: '8px',
                                padding: '2px'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => updateCartItemQty(p.id, -1)}
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                  }}
                                  aria-label={`Kurangi ${p.name}`}
                                >
                                  <Minus size={12} strokeWidth={3} />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max="999"
                                  value={inCart}
                                  onChange={e => setCartItemExactQty(p.id, e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    width: '34px',
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    color: textPrimary,
                                    fontFamily: 'var(--font-mono)',
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    padding: 0
                                  }}
                                  aria-label={`Jumlah pesanan ${p.name}`}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    updateCartItemQty(p.id, 1);
                                    try { playChime(880, 0.08); } catch (_) {}
                                    triggerCometArc({ startEl: e.currentTarget, targetEl: document.querySelector('[data-cart-target="pos-cart-summary"]'), color: '#38bdf8', duration: 450 });
                                  }}
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                  }}
                                  aria-label={`Tambah ${p.name}`}
                                >
                                  <Plus size={12} strokeWidth={3} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={p.isAvailable === false}
                                onClick={(e) => {
                                  updateCartItemQty(p.id, 1);
                                  try { playChime(880, 0.08); } catch (_) {}
                                  triggerCometArc({ startEl: e.currentTarget, targetEl: document.querySelector('[data-cart-target="pos-cart-summary"]'), color: '#38bdf8', duration: 450 });
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: p.isAvailable === false ? (isLight ? '#cbd5e1' : '#334155') : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                  fontSize: '0.76rem',
                                  cursor: p.isAvailable === false ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Plus size={13} strokeWidth={2.5} />
                                <span>Tambah</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Right: Cart Order Summary (Desktop Pinned) */}
            <div 
              className="desktop-only"
              data-cart-target="pos-cart-summary"
              style={{
                background: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-md)',
                height: 'fit-content',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'sticky',
                top: '70px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingBag size={18} color="#2563eb" />
                  <span>Order Kasir Walk-in</span>
                </h3>
                {Object.values(posCart).length > 0 && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#2563eb',
                    color: '#ffffff'
                  }}>
                    {Object.values(posCart).reduce((s, it) => s + it.qty, 0)} item
                  </span>
                )}
              </div>
              {renderCartSummaryContent()}
            </div>
          </div>
        </main>
      )}

      {/* ── MOBILE FLOATING CART BAR (WHEN CART HAS ITEMS) ── */}
      {activeTab === 'pos' && Object.values(posCart).length > 0 && !showMobileCartDrawer && (
        <div 
          className="mobile-only-flex"
          onClick={() => setShowMobileCartDrawer(true)}
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '12px',
            right: '12px',
            zIndex: 45,
            maxWidth: '560px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '10px 14px',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              position: 'relative',
              background: '#2563eb',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShoppingBag size={18} color="#ffffff" />
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 900,
                borderRadius: '999px',
                padding: '1px 5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {Object.values(posCart).reduce((s, it) => s + it.qty, 0)}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {selectedTable ? `Meja: ${selectedTable}` : 'Kasir Walk-in'}
              </div>
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                Rp {Math.max(0, Object.values(posCart).reduce((s, it) => s + (it.product.price * it.qty), 0) - (activeCartPromo ? calculatePromoDiscountForCart(activeCartPromo, posCart) : 0)).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileCartDrawer(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>Lihat Pesanan</span>
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── MOBILE SLIDE-UP CHECKOUT DRAWER ── */}
      {showMobileCartDrawer && (
        <div 
          onClick={() => setShowMobileCartDrawer(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: bgCard,
              borderTopLeftRadius: '22px',
              borderTopRightRadius: '22px',
              borderTop: `1px solid ${borderColor}`,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '0.75rem 1.25rem 2.5rem',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* DEF-07: Swipe Bar Handle Visual Affordance */}
            <div style={{
              width: '42px',
              height: '4px',
              borderRadius: '999px',
              background: isLight ? '#cbd5e1' : '#475569',
              margin: '0 auto 12px'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `1px solid ${borderColor}`, paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                  Pesanan Kasir ({Object.values(posCart).reduce((s, it) => s + it.qty, 0)} Item)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileCartDrawer(false)}
                style={{
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '999px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: textSecondary
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Render Cart Content */}
            {renderCartSummaryContent()}
          </div>
        </div>
      )}

      {/* ── MODAL PUSAT KELOLA KASIR & TOKO ── */}
      {showToolsDrawer && (
        <div 
          onClick={() => setShowToolsDrawer(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                  Pusat Kelola Kasir &amp; Toko
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowToolsDrawer(false)}
                style={{
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: 'none',
                  borderRadius: '999px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: textSecondary
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                {
                  title: 'Top Up Saldo Nota',
                  desc: `Sisa: ${storeInfo.kuotaNota ?? 50} lembar`,
                  icon: <Zap size={20} color="#eab308" />,
                  badge: Number(storeInfo.saldoNota ?? 5000) < 100 ? '⚠️ Habis' : '🪙 Beli Nota',
                  onClick: () => { setShowPosTopupModal(true); setShowToolsDrawer(false); }
                },
                {
                  title: 'Promo Makanan',
                  desc: 'Kuota & tgl diskon',
                  icon: <Tag size={20} color="#f59e0b" />,
                  badge: promosList.filter(p => p.isAvailable).length ? `${promosList.filter(p => p.isAvailable).length} aktif` : null,
                  onClick: () => { setShowPromoManagerModal(true); loadPromos(); setShowToolsDrawer(false); }
                },
                {
                  title: 'Gudang & Resep',
                  desc: inventoryAlerts.length > 0 ? `${inventoryAlerts.length} menipis!` : 'Stok bahan baku',
                  icon: <Package size={20} color="#ef4444" />,
                  alert: inventoryAlerts.length > 0,
                  badge: inventoryAlerts.length > 0 ? `${inventoryAlerts.length}!` : null,
                  onClick: () => { setShowInventoryModal(true); setInventoryTab('stock'); loadInventory(); setShowToolsDrawer(false); }
                },
                {
                  title: 'Statistik Keuangan',
                  desc: 'Menu, cabang & staf',
                  icon: <BarChart3 size={20} color="#6366f1" />,
                  onClick: () => { setShowAnalyticsModal(true); loadAnalytics(); setShowToolsDrawer(false); }
                },
                {
                  title: 'Stamp & Loyalty',
                  desc: 'Hadiah pelanggan',
                  icon: <Award size={20} color="#3b82f6" />,
                  onClick: () => { setShowLoyaltyModal(true); setShowToolsDrawer(false); }
                },
                {
                  title: 'Printer & Laci Kasir',
                  desc: 'Laci uang RJ11 & printer',
                  icon: <Printer size={20} color="#10b981" />,
                  onClick: () => { setShowHardwareModal(true); setShowToolsDrawer(false); }
                },
                {
                  title: 'Kelola Karyawan',
                  desc: 'Staf & role akses',
                  icon: <Users size={20} color="#8b5cf6" />,
                  link: '/karyawan'
                },
                {
                  title: 'Lokasi & Info Toko',
                  desc: storeInfo.storeName || 'Atur data toko',
                  icon: <Store size={20} color="#14b8a6" />,
                  badge: storeInfo.isValidated ? '✓ Resmi' : '⚠️ Validasi',
                  onClick: () => { setShowStoreModal(true); setShowToolsDrawer(false); }
                }
              ].map((item, idx) => (
                item.link ? (
                  <Link
                    key={idx}
                    to={item.link}
                    style={{
                      textDecoration: 'none',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '14px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {item.icon}
                      <ExternalLink size={13} color={textSecondary} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: textPrimary, marginTop: '4px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: textSecondary }}>
                      {item.desc}
                    </div>
                  </Link>
                ) : (
                  <div
                    key={idx}
                    onClick={item.onClick}
                    style={{
                      background: item.alert 
                        ? (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)') 
                        : (isLight ? '#f8fafc' : '#1e293b'),
                      border: item.alert ? '1.5px solid #ef4444' : `1px solid ${borderColor}`,
                      borderRadius: '14px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {item.icon}
                      {item.badge && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '999px',
                          background: item.alert ? '#ef4444' : (isLight ? '#2563eb' : '#3b82f6'),
                          color: '#ffffff'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: textPrimary, marginTop: '4px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: textSecondary }}>
                      {item.desc}
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Quick System Controls: Theme, Sound, Refresh, Dashboard */}
            <div style={{
              padding: '12px 1.25rem',
              borderTop: `1px solid ${borderColor}`,
              background: isLight ? '#f8fafc' : '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={toggleTheme}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    background: isLight ? '#ffffff' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  {isLight ? <Moon size={14} /> : <Sun size={14} color="#f59e0b" />}
                  <span>{isLight ? 'Dark Mode' : 'Light Mode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudioAlert(!audioAlert)}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    background: isLight ? '#ffffff' : '#1e293b',
                    color: audioAlert ? '#10b981' : textSecondary,
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  {audioAlert ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  <span>{audioAlert ? 'Suara ON' : 'Suara OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { fetchData(); setShowToolsDrawer(false); }}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    background: isLight ? '#ffffff' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <Link
                  to="/dashboard"
                  style={{
                    color: textSecondary,
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Dashboard KostKu</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowToolsDrawer(false)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: isLight ? '#ffffff' : '#1e293b',
                    color: textPrimary,
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MEJA & QR CODE (TENT CARDS) ── */}
      {activeTab === 'tables' && (
        <main style={{ maxWidth: '1280px', margin: '1.25rem auto 0', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: textPrimary }}>
                Kelola Meja & Cetak Barcode QR
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: textSecondary }}>
                Cetak barcode ini dan tempel di masing-masing meja agar pelanggan bisa pesan sendiri dari meja.
              </p>
            </div>
            <button
              onClick={async () => {
                const num = prompt('Nama/Nomor Meja Baru:', `Meja 0${tables.length + 1}`);
                if (!num) return;
                const res = await fetch('/api/pos/tables', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ number: num })
                });
                if (res.ok) fetchData();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Plus size={16} /> Tambah Meja
            </button>
          </div>

          {/* Table Cards: 50% : 50% di HP via .pos-tables-grid */}
          <div className="pos-tables-grid">
            {tables.map(tbl => (
              <div
                key={tbl.id}
                style={{
                  background: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '16px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: textPrimary, letterSpacing: '-0.01em' }}>
                    {tbl.number}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isLight ? '#dbeafe' : 'rgba(37,99,235,0.2)',
                    color: '#2563eb'
                  }}>
                    Scan untuk Pesan
                  </span>
                </div>

                <div style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px'
                }}>
                  {tbl.qrDataUrl ? (
                    <img
                      src={tbl.qrDataUrl}
                      alt={tbl.number}
                      style={{
                        width: '100%',
                        maxWidth: '125px',
                        aspectRatio: '1/1',
                        objectFit: 'contain',
                        background: '#ffffff',
                        padding: '6px',
                        borderRadius: '12px',
                        border: `1px solid ${borderColor}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isLight ? '#f1f5f9' : '#1e293b',
                      borderRadius: '12px',
                      gap: '4px',
                      color: textSecondary,
                      fontSize: '0.65rem'
                    }}>
                      <QrCode size={26} opacity={0.5} />
                      <span>Membuat QR...</span>
                    </div>
                  )}
                </div>

                {/* Direct Download Button */}
                <a
                  href={tbl.qrDataUrl}
                  download={`QR-${String(tbl.number).replace(/\s+/g, '-')}.png`}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                    boxSizing: 'border-box'
                  }}
                  title={`Download Barcode QR ${tbl.number}`}
                >
                  <Download size={12} strokeWidth={2.5} />
                  <span>Download QR</span>
                </a>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ── TAB 4: KEUANGAN & PEMBAYARAN KASIR ── */}
      {activeTab === 'settings' && (
        <main style={{ maxWidth: '840px', margin: '1.25rem auto 0', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Keuangan */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💰</span>
                <span>Laporan Keuangan & Kasir</span>
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: textSecondary }}>
                Pantau omset harian kantin, rincian pembayaran, dan konektivitas gateway pembayaran.
              </p>
            </div>
            <a
              href="/keuangan"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                background: isLight ? '#ffffff' : '#1e293b',
                color: '#2563eb',
                fontWeight: 700,
                fontSize: '0.78rem',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span>Buka Pembukuan KostKu</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Hero Card: Dompet Terpadu Kasir POS & Mitra UMKM (1 UID Shared) */}
          <div style={{
            background: isLight 
              ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)' 
              : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: isLight ? '1.5px solid rgba(37, 99, 235, 0.25)' : '1.5px solid rgba(139, 92, 246, 0.35)',
            borderRadius: '20px',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#a855f7',
                    border: '1px solid rgba(139, 92, 246, 0.35)'
                  }}>
                    💳 Dompet Terpadu (Kasir &amp; Mitra)
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981'
                  }}>
                    1 UID Terpadu: {storeInfo?.uid || walletData?.uid || 'MTR-KASIR-MASTER'}
                  </span>
                </div>
                <div style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  color: textPrimary,
                  marginTop: '6px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em'
                }}>
                  Rp {(walletData?.balance || 0).toLocaleString('id-ID')}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: textSecondary }}>
                  Saldo gabungan dari pembayaran QRIS Kasir POS (Order Meja &amp; Register) serta Pesanan Mitra Toko UMKM.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const currentBal = walletData?.balance || 0;
                    if (currentBal <= 0) {
                      alert('Saldo dompet terpadu Anda masih Rp 0.');
                      return;
                    }
                    if (window.confirm(`Tarik saldo Rp ${currentBal.toLocaleString('id-ID')} ke rekening bank terdaftar via Flip / BI-FAST?`)) {
                      apiMutateAccountWallet(storeInfo?.uid || walletData?.uid || 'pos', {
                        amount: currentBal,
                        type: 'payout',
                        description: 'Penarikan saldo dompet terpadu kasir & mitra'
                      }).then(res => {
                        alert('Permintaan penarikan dana berhasil diproses ke antrean transfer BI-FAST!');
                        if (res?.wallet) setWalletData(res.wallet);
                      }).catch(err => alert(err.message || 'Gagal memproses penarikan'));
                    }
                  }}
                  className="btn"
                  style={{
                    padding: '9px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CreditCard size={14} /> Tarik Saldo (Payout)
                </button>
              </div>
            </div>

            {/* Footer notice */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              paddingTop: '8px',
              borderTop: isLight ? '1px dashed rgba(37, 99, 235, 0.2)' : '1px dashed rgba(255, 255, 255, 0.08)',
              fontSize: '0.72rem',
              color: textSecondary
            }}>
              <span>✦ Terhubung ke TriPay Master KostKu (T53543) • Biaya admin flat Rp 100</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>● Sinkronisasi Real-Time Mitra &amp; Kasir Aktif</span>
            </div>
          </div>

          {/* Card: Saldo & Kuota Nota Kasir (Rp 100 / Transaksi Tunai) */}
          <div style={{
            background: isLight 
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)' 
              : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: Number(storeInfo.saldoNota ?? 5000) < 100 
              ? '1.5px solid #ef4444' 
              : (isLight ? '1.5px solid rgba(245, 158, 11, 0.3)' : '1.5px solid rgba(245, 158, 11, 0.35)'),
            borderRadius: '20px',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.35)'
                  }}>
                    🪙 Saldo Kuota Nota Kasir
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: Number(storeInfo.saldoNota ?? 5000) < 100 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: Number(storeInfo.saldoNota ?? 5000) < 100 ? '#ef4444' : '#10b981'
                  }}>
                    {Number(storeInfo.saldoNota ?? 5000) < 100 ? '⚠️ Kuota Habis (Top Up Diperlukan)' : `✓ Sisa: ${storeInfo.kuotaNota ?? 50} Transaksi Tunai`}
                  </span>
                </div>
                <div style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  color: Number(storeInfo.saldoNota ?? 5000) < 100 ? '#ef4444' : (isLight ? '#b45309' : '#fbbf24'),
                  marginTop: '6px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em'
                }}>
                  Rp {Number(storeInfo.saldoNota ?? 5000).toLocaleString('id-ID')}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: textSecondary }}>
                  Biaya platform transaksi tunai: <strong>Rp 100 / transaksi</strong>. Saldo nota dipotong otomatis saat kasir menerima pembayaran cash.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPosTopupModal(true)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                <Zap size={16} />
                <span>+ Top Up Kuota Nota</span>
              </button>
            </div>
          </div>

          {/* 4 Kartu Metrik Keuangan (Responsive Grid: 2 Kolom di HP, 4 Kolom di Monitor) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px'
          }}>
            {/* 1. Total Omset */}
            <div style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '16px',
              padding: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase' }}>
                  Total Omset
                </span>
                <span style={{ fontSize: '1.1rem' }}>💵</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
              <span style={{ fontSize: '0.68rem', color: textSecondary, marginTop: '2px', display: 'block' }}>
                {completedOrders.length} transaksi selesai
              </span>
            </div>

            {/* 2. QRIS TriPay */}
            <div style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '16px',
              padding: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase' }}>
                  QRIS TriPay
                </span>
                <span style={{ fontSize: '1.1rem' }}>📱</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-mono)' }}>
                Rp {qrisRevenue.toLocaleString('id-ID')}
              </div>
              <span style={{ fontSize: '0.68rem', color: textSecondary, marginTop: '2px', display: 'block' }}>
                Real-time Settlement
              </span>
            </div>

            {/* 3. Tunai / Kasir */}
            <div style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '16px',
              padding: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase' }}>
                  Tunai (Cash)
                </span>
                <span style={{ fontSize: '1.1rem' }}>🪙</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                Rp {cashRevenue.toLocaleString('id-ID')}
              </div>
              <span style={{ fontSize: '0.68rem', color: textSecondary, marginTop: '2px', display: 'block' }}>
                Kas fisik di laci
              </span>
            </div>

            {/* 4. Saldo & Kuota Nota Kasir */}
            <div style={{
              background: bgCard,
              border: Number(storeInfo.saldoNota ?? 5000) < 100 ? '1px solid #ef4444' : `1px solid ${borderColor}`,
              borderRadius: '16px',
              padding: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase' }}>
                  Saldo Kuota Nota
                </span>
                <span style={{ fontSize: '1.1rem' }}>🎟️</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: Number(storeInfo.saldoNota ?? 5000) < 100 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                {storeInfo.kuotaNota ?? 50} Nota
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.68rem', color: textSecondary }}>
                  Rp {(storeInfo.saldoNota ?? 5000).toLocaleString('id-ID')}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPosTopupModal(true)}
                    style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', border: 'none', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Top Up
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Rekapan Transaksi Kasir Lengkap */}
          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  color: '#2563eb',
                  textTransform: 'uppercase',
                  background: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  Buku Rekapan Kasir
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '1.05rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={18} />
                  <span>Rekap Transaksi & Penjualan Kasir</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: textSecondary }}>
                  Audit semua pesanan, diskon, catatan pembeli, dan cetak ulang struk thermal.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Filter Hari Ini vs Semua */}
                <div style={{
                  display: 'flex',
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  padding: '3px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`
                }}>
                  <button
                    type="button"
                    onClick={() => setRecapFilter('today')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: recapFilter === 'today' ? '#2563eb' : 'transparent',
                      color: recapFilter === 'today' ? '#ffffff' : textSecondary,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecapFilter('all')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: recapFilter === 'all' ? '#2563eb' : 'transparent',
                      color: recapFilter === 'all' ? '#ffffff' : textSecondary,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    Semua ({orders.length})
                  </button>
                </div>

                {/* Tombol Cetak Rekap */}
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toLocaleDateString('id-ID');
                    const filtered = orders.filter(o => {
                      if (recapFilter === 'today') {
                        const d = new Date().toISOString().slice(0, 10);
                        return o.createdAt && o.createdAt.startsWith(d);
                      }
                      return true;
                    });
                    const total = filtered.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
                    const recapSummaryOrder = {
                      id: `REKAP-${Date.now().toString().slice(-6)}`,
                      tableNumber: 'REKAP KASIR',
                      customerName: `Kasir (${recapFilter === 'today' ? todayStr : 'Semua Transaksi'})`,
                      createdAt: new Date().toISOString(),
                      notes: `Total ${filtered.length} Pesanan | Omset Rp ${total.toLocaleString('id-ID')}`,
                      items: filtered.slice(0, 15).map(o => ({
                        name: `#${o.id.slice(-5)} (Meja ${o.tableNumber})`,
                        qty: (o.items || []).length,
                        subtotal: o.totalAmount || 0
                      })),
                      subtotal: total,
                      discountAmount: 0,
                      totalAmount: total,
                      paymentMethod: 'REKAP LAPORAN'
                    };
                    handlePrintReceipt(recapSummaryOrder);
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Printer size={13} />
                  <span>Cetak Rekap</span>
                </button>

                {/* Tombol Export ke Excel (.xlsx) */}
                <button
                  type="button"
                  disabled={exportingExcel}
                  onClick={handleExportExcel}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    border: '1px solid #10b981',
                    background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
                    color: '#059669',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Unduh seluruh riwayat transaksi kasir ke Microsoft Excel (.xlsx)"
                >
                  <FileSpreadsheet size={15} color="#059669" />
                  <span>{exportingExcel ? 'Mengekspor...' : 'Export ke Excel'}</span>
                </button>
              </div>
            </div>

            {/* Orders List / Table */}
            {orders.filter(o => {
              if (recapFilter === 'today') {
                const d = new Date().toISOString().slice(0, 10);
                return o.createdAt && o.createdAt.startsWith(d);
              }
              return true;
            }).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: textSecondary, fontSize: '0.8rem' }}>
                Belum ada transaksi pada filter ini.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                {orders.filter(o => {
                  if (recapFilter === 'today') {
                    const d = new Date().toISOString().slice(0, 10);
                    return o.createdAt && o.createdAt.startsWith(d);
                  }
                  return true;
                }).map(o => (
                  <div
                    key={o.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: `1px solid ${borderColor}`,
                      background: isLight ? '#f8fafc' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
                          #{o.id}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          background: '#2563eb',
                          color: '#ffffff'
                        }}>
                          Meja {o.tableNumber}
                        </span>
                        <span style={{ fontWeight: 700, color: textPrimary }}>
                          {o.customerName}
                        </span>
                        {o.isLoggedIn ? (
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#16a34a', background: isLight ? '#dcfce7' : 'rgba(34,197,94,0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                            Member (+Poin)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', background: isLight ? '#f1f5f9' : '#1e293b', padding: '1px 5px', borderRadius: '4px' }}>
                            Tamu (0 Poin)
                          </span>
                        )}
                        <span style={{ fontSize: '0.68rem', color: textSecondary }}>
                          {new Date(o.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Items summary */}
                      <div style={{ margin: '3px 0 0', color: textSecondary, fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(o.items || []).map(it => `${it.qty}x ${it.name}`).join(', ')}
                      </div>

                      {/* Notes if any */}
                      {o.notes && (
                        <div style={{
                          marginTop: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)',
                          border: '1px dashed #f59e0b',
                          color: isLight ? '#92400e' : '#fde68a',
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}>
                          <MessageSquare size={11} />
                          <span>Catatan: "{o.notes}"</span>
                        </div>
                      )}
                    </div>

                    {/* Right side amount, status, & print */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>
                        Rp {o.totalAmount?.toLocaleString('id-ID')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase' }}>
                          {o.paymentMethod || 'TUNAI'}
                        </span>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: o.status === 'completed' ? '#dcfce7' : (o.status === 'cooking' ? '#fef3c7' : '#fee2e2'),
                          color: o.status === 'completed' ? '#166534' : (o.status === 'cooking' ? '#92400e' : '#991b1b')
                        }}>
                          {o.status}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(o)}
                        style={{
                          marginTop: '2px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${borderColor}`,
                          background: isLight ? '#ffffff' : '#1e293b',
                          color: '#2563eb',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Printer size={11} /> Cetak Struk
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Pengaturan Hardware Printer Thermal */}
          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                color: '#2563eb',
                textTransform: 'uppercase',
                background: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                Hardware & Periferal
              </span>
              <h3 style={{ margin: '6px 0 2px', fontSize: '1.05rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={18} />
                <span>Printer Thermal Bluetooth & USB (ESC/POS)</span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: textSecondary }}>
                Koneksikan printer struk thermal 58mm/80mm via Web Bluetooth, Web Serial/USB, atau dialog cetak OS.
              </p>
            </div>

            {printerFeedback && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: printerFeedback.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                color: printerFeedback.startsWith('✅') ? '#166534' : '#991b1b',
                border: `1px solid ${printerFeedback.startsWith('✅') ? '#86efac' : '#fca5a5'}`
              }}>
                {printerFeedback}
              </div>
            )}

            {/* Connection Type Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '6px' }}>
                Metode Koneksi Default:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'bluetooth', label: 'Bluetooth BLE', icon: <Bluetooth size={14} />, desc: 'HP / Tablet / Laptop' },
                  { id: 'usb', label: 'USB Serial', icon: <Usb size={14} />, desc: 'Kabel USB Desktop' },
                  { id: 'browser', label: 'Dialog Sistem', icon: <Printer size={14} />, desc: 'Fallback Browser' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      const next = { ...printerSettings, connectionType: m.id };
                      setPrinterSettings(next);
                      savePrinterSettings(next);
                    }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: (printerSettings.connectionType || 'browser') === m.id ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                      background: (printerSettings.connectionType || 'browser') === m.id ? (isLight ? '#eff6ff' : 'rgba(37,99,235,0.15)') : bgCard,
                      color: textPrimary,
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <div style={{ color: (printerSettings.connectionType || 'browser') === m.id ? '#2563eb' : textSecondary }}>{m.icon}</div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{m.label}</span>
                    <span style={{ fontSize: '0.65rem', color: textSecondary }}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Width & Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '4px' }}>
                  Lebar Kertas Struk:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['58mm', '80mm'].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        const next = { ...printerSettings, paperWidth: w };
                        setPrinterSettings(next);
                        savePrinterSettings(next);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '10px',
                        border: (printerSettings.paperWidth || '58mm') === w ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                        background: (printerSettings.paperWidth || '58mm') === w ? '#2563eb' : bgCard,
                        color: (printerSettings.paperWidth || '58mm') === w ? '#ffffff' : textPrimary,
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {w} ({w === '58mm' ? '32 Kolom' : '48 Kolom'})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '4px' }}>
                  Fitur Tambahan ESC/POS:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: textPrimary, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={printerSettings.autoCut !== false}
                      onChange={e => {
                        const next = { ...printerSettings, autoCut: e.target.checked };
                        setPrinterSettings(next);
                        savePrinterSettings(next);
                      }}
                    />
                    <span>Auto-Cut Kertas Otomatis</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: textPrimary, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={printerSettings.openDrawer === true}
                      onChange={e => {
                        const next = { ...printerSettings, openDrawer: e.target.checked };
                        setPrinterSettings(next);
                        savePrinterSettings(next);
                      }}
                    />
                    <span>Buka Laci Uang Kasir (Cash Drawer)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Pair & Test Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleConnectBluetooth}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#ffffff' : '#1e293b',
                  color: textPrimary,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Bluetooth size={14} color="#3b82f6" />
                <span>{printerSettings.pairedBluetoothDeviceName ? `BT: ${printerSettings.pairedBluetoothDeviceName}` : 'Pair Bluetooth'}</span>
              </button>

              <button
                type="button"
                onClick={handleConnectUsb}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#ffffff' : '#1e293b',
                  color: textPrimary,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Usb size={14} color="#10b981" />
                <span>{printerSettings.pairedUsbPortName ? `USB: ${printerSettings.pairedUsbPortName}` : 'Pair USB Serial'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestPrint()}
                disabled={isPrinting}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: isPrinting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                }}
              >
                <Printer size={14} />
                <span>{isPrinting ? 'Mencetak...' : 'Tes Cetak Struk'}</span>
              </button>
            </div>
          </div>

          {/* Section: Member Stamp & Loyalty Management */}
          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                color: '#d97706',
                textTransform: 'uppercase',
                background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                Loyalty & Reward System
              </span>
              <h3 style={{ margin: '6px 0 2px', fontSize: '1.05rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} color="#d97706" />
                <span>Manajemen Member Stamp & Poin Khusus</span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: textSecondary }}>
                Pelanggan terdaftar berhak mendapatkan stamp kartu digital dan poin transaksi. Berikan diskon khusus atau reward langsung dari kasir.
              </p>
            </div>

            {loyaltyFeedback && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: loyaltyFeedback.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                color: loyaltyFeedback.startsWith('✅') ? '#166534' : '#991b1b',
                border: `1px solid ${loyaltyFeedback.startsWith('✅') ? '#86efac' : '#fca5a5'}`
              }}>
                {loyaltyFeedback}
              </div>
            )}

            {/* Search Phone Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="tel"
                placeholder="Ketik WhatsApp Pelanggan (contoh: 08123456789)..."
                value={loyaltySearchPhone}
                onChange={e => setLoyaltySearchPhone(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchLoyalty(); }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${borderLight}`,
                  background: isLight ? '#f8fafc' : '#1e293b',
                  color: textPrimary,
                  fontSize: '0.82rem'
                }}
              />
              <button
                type="button"
                onClick={() => handleSearchLoyalty()}
                disabled={loyaltyLoading}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {loyaltyLoading ? 'Mencari...' : 'Cari Member'}
              </button>
            </div>

            {/* Customer Stamp Card & Points Display */}
            {loyaltyData && (
              <div style={{
                padding: '12px',
                borderRadius: '14px',
                background: isLight ? '#f8fafc' : '#0f172a',
                border: `1px solid ${borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: textPrimary }}>{loyaltyData.phone}</strong>
                    <span style={{ fontSize: '0.72rem', color: textSecondary, display: 'block' }}>
                      Total Poin: <strong style={{ color: '#16a34a' }}>{(loyaltyData.points || 0).toLocaleString('id-ID')} Poin</strong>
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: '#dbeafe',
                    color: '#1d4ed8'
                  }}>
                    {loyaltyData.stamps?.current || 0} / {loyaltyData.stamps?.target || 5} Stamp
                  </span>
                </div>

                {/* Visual Digital Stamp Card */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  padding: '10px',
                  background: isLight ? '#ffffff' : '#1e293b',
                  borderRadius: '12px',
                  border: `1px dashed ${borderColor}`
                }}>
                  {[0, 1, 2, 3, 4].map(idx => {
                    const isFilled = idx < (loyaltyData.stamps?.current || 0);
                    return (
                      <div
                        key={idx}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '50%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isFilled ? '2px solid #d97706' : `1.5px dashed ${borderColor}`,
                          background: isFilled ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'transparent',
                          color: isFilled ? '#b45309' : textSecondary
                        }}
                      >
                        <Award size={18} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 800 }}>{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions: Grant Stamp or Redeem */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleGrantStamp}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Beri 1 Stamp
                  </button>
                  <button
                    type="button"
                    onClick={handleRedeemStamp}
                    disabled={(loyaltyData.stamps?.current || 0) < (loyaltyData.stamps?.target || 5)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '10px',
                      border: 'none',
                      background: (loyaltyData.stamps?.current || 0) >= (loyaltyData.stamps?.target || 5) ? '#16a34a' : (isLight ? '#e2e8f0' : '#334155'),
                      color: (loyaltyData.stamps?.current || 0) >= (loyaltyData.stamps?.target || 5) ? '#ffffff' : textSecondary,
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: (loyaltyData.stamps?.current || 0) >= (loyaltyData.stamps?.target || 5) ? 'pointer' : 'not-allowed'
                    }}
                  >
                    🎁 Tukar Hadiah (Min. 5)
                  </button>
                </div>

                {/* Form: Beri Poin Khusus dari Owner/Admin */}
                <form onSubmit={handleGrantCustomPoints} style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px', borderTop: `1px solid ${borderColor}` }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: textPrimary }}>
                    Beri Poin Khusus Manual (Owner / Admin):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '6px' }}>
                    <input
                      type="number"
                      min="10"
                      step="10"
                      placeholder="Poin (cth: 500)"
                      value={customPointsInput}
                      onChange={e => setCustomPointsInput(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${borderLight}`,
                        background: isLight ? '#ffffff' : '#1e293b',
                        color: textPrimary,
                        fontSize: '0.78rem'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Alasan (cth: Hadiah Loyalitas)"
                      value={customPointsReason}
                      onChange={e => setCustomPointsReason(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${borderLight}`,
                        background: isLight ? '#ffffff' : '#1e293b',
                        color: textPrimary,
                        fontSize: '0.78rem'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Kirim
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Section: Pengaturan Gateway Pembayaran TriPay */}
          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                color: '#2563eb',
                textTransform: 'uppercase',
                background: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                Payment Gateway Integration
              </span>
              <h3 style={{ margin: '6px 0 2px', fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                Pengaturan Gateway Pembayaran TriPay
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: textSecondary }}>
                Koneksikan akun TriPay Anda untuk memproses transaksi QRIS & E-Wallet secara otomatis langsung ke rekening kasir.
              </p>
            </div>

            {/* Status Notice */}
            <div style={{
              background: tripayConfig.isConfigured
                ? (isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.15)')
                : (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)'),
              border: tripayConfig.isConfigured
                ? '1px solid #86efac'
                : '1px solid #fde68a',
              borderRadius: '12px',
              padding: '10px 12px',
              fontSize: '0.78rem',
              color: tripayConfig.isConfigured
                ? (isLight ? '#166534' : '#86efac')
                : (isLight ? '#92400e' : '#fde68a'),
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <Sparkles size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>
                  {tripayConfig.isConfigured ? 'TriPay Aktif Terhubung!' : 'Mode Simulator Aktif (Siap Pakai Kapan Saja)'}
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', opacity: 0.9 }}>
                  {tripayConfig.isConfigured
                    ? 'Transaksi QRIS kasir akan diteruskan langsung ke sistem live TriPay.'
                    : 'Anda dapat menguji transaksi kasir sekarang dengan simulator bawaan. Masukkan API Key resmi di bawah ini kapan saja setelah akun TriPay Anda aktif.'}
                </p>
              </div>
            </div>

            {tripaySavedMsg && (
              <div style={{
                background: '#dcfce7',
                border: '1px solid #86efac',
                color: '#166534',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                {tripaySavedMsg}
              </div>
            )}

            <form onSubmit={handleSaveTripay} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '3px' }}>
                  TriPay Merchant Code:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: T12345"
                  value={tripayConfig.merchantCode}
                  onChange={e => setTripayConfig({ ...tripayConfig, merchantCode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '3px' }}>
                  TriPay API Key:
                </label>
                <input
                  type="text"
                  placeholder="DEV-... atau PROD-..."
                  value={tripayConfig.apiKey}
                  onChange={e => setTripayConfig({ ...tripayConfig, apiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '3px' }}>
                  TriPay Private Key:
                </label>
                <input
                  type="password"
                  placeholder="Masukkan Private Key TriPay..."
                  value={tripayConfig.privateKey}
                  onChange={e => setTripayConfig({ ...tripayConfig, privateKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '10px',
                background: isLight ? '#f8fafc' : '#1e293b',
                border: `1px solid ${borderColor}`
              }}>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: textPrimary, display: 'block' }}>Mode Produksi (Live)</strong>
                  <span style={{ fontSize: '0.7rem', color: textSecondary }}>Aktifkan jika akun TriPay sudah disetujui untuk transaksi real</span>
                </div>
                <input
                  type="checkbox"
                  checked={tripayConfig.isProduction}
                  onChange={e => setTripayConfig({ ...tripayConfig, isProduction: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <button
                type="submit"
                disabled={savingTripay}
                style={{
                  marginTop: '4px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: savingTripay ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  opacity: savingTripay ? 0.7 : 1
                }}
              >
                {savingTripay ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Gateway'}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ── THERMAL RECEIPT MODAL WITH BLUETOOTH & USB DIRECT PRINTING ── */}
      {receiptOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#ffffff',
            color: '#0f172a',
            maxWidth: '380px',
            width: '100%',
            borderRadius: '18px',
            padding: '1.25rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.8rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Header Struk Toko & Lokasi */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                {storeInfo.storeName || 'KANTIN RIUPH POS'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                📍 {storeInfo.location || 'Lokasi Kasir Terverifikasi'}
              </p>
              {storeInfo.address && (
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>
                  {storeInfo.address}
                </p>
              )}
              {storeInfo.phone && (
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>
                  Telp: {storeInfo.phone}
                </p>
              )}
              <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                {new Date(receiptOrder.createdAt || Date.now()).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Order Meta Info */}
            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Order ID:</span>
                <span style={{ fontWeight: 700 }}>#{receiptOrder.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Nomor Meja:</span>
                <span style={{ fontWeight: 800, color: '#2563eb' }}>{receiptOrder.tableNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Atas Nama:</span>
                <span style={{ fontWeight: 700 }}>{receiptOrder.customerName || 'Pelanggan'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Status Member:</span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: receiptOrder.isLoggedIn ? '#16a34a' : '#64748b',
                  background: receiptOrder.isLoggedIn ? '#dcfce7' : '#f1f5f9',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  {receiptOrder.isLoggedIn ? '⭐ Member (+Poin)' : '👤 Tamu (0 Poin)'}
                </span>
              </div>
            </div>

            {/* Buyer Custom Notes */}
            {receiptOrder.notes && (
              <div style={{
                background: '#fef3c7',
                border: '1px dashed #d97706',
                borderRadius: '8px',
                padding: '6px 8px',
                fontSize: '0.72rem',
                color: '#92400e'
              }}>
                <strong>📝 Catatan Pembeli:</strong>
                <p style={{ margin: '2px 0 0', fontStyle: 'italic' }}>
                  "{receiptOrder.notes}"
                </p>
              </div>
            )}

            {/* Items Ordered */}
            <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(receiptOrder.items || []).map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>{it.qty}x {it.name}</span>
                  <span>Rp {it.subtotal?.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            {/* Totals & Discounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>Rp {receiptOrder.subtotal?.toLocaleString('id-ID')}</span>
              </div>
              {receiptOrder.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 700 }}>
                  <span>Diskon ({receiptOrder.discountReason || 'Admin'}):</span>
                  <span>-Rp {receiptOrder.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Biaya Layanan:</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Rp 0 (Ditanggung Penjual)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.9rem', paddingTop: '4px', borderTop: '1px solid #e2e8f0' }}>
                <span>TOTAL BAYAR:</span>
                <span style={{ color: '#16a34a' }}>Rp {receiptOrder.totalAmount?.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                <span>Metode Bayar:</span>
                <span style={{ fontWeight: 700 }}>{receiptOrder.paymentMethod || 'TUNAI'}</span>
              </div>
            </div>

            {/* Loyalty QR Code & Claim Section */}
            {(() => {
              const claimToken = receiptOrder.claimToken || receiptOrder.claim_token || receiptOrder.id;
              const claimUrl = receiptOrder.qrClaimUrl || receiptOrder.qr_claim_url || `https://kostku.riuph.me/claim?token=${claimToken}`;
              const claimDeadline = receiptOrder.claimDeadline || receiptOrder.claim_deadline;
              const deadlineStr = claimDeadline
                ? new Date(claimDeadline).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) + ' 23:59 WIB'
                : 'Besok 23:59 WIB';
              
              return (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#f8fafc',
                  border: '1px dashed #94a3b8',
                  borderRadius: '10px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#1e293b', letterSpacing: '0.5px' }}>
                    KLAIM DISKON MAKAN ANDA!
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                    [ QR CODE KLAIM POIN ]
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(claimUrl)}`}
                    alt="QR Code Klaim Poin"
                    style={{ width: '110px', height: '110px', borderRadius: '6px', background: '#fff', padding: '4px', border: '1px solid #e2e8f0' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.35 }}>
                    <strong>Scan QR ini & Putar Roda Hadiah!</strong><br />
                    Dapatkan Poin s/d 100 Poin Belanja.
                  </div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px' }}>
                    *Batas Waktu Klaim: {deadlineStr}
                  </div>
                  <a
                    href={claimUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.64rem', color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    {claimUrl}
                  </a>
                </div>
              );
            })()}

            {/* Printer Status Banner */}
            {printerFeedback && (
              <div style={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textAlign: 'center',
                background: printerFeedback.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                color: printerFeedback.startsWith('✅') ? '#166534' : '#991b1b',
                border: `1px solid ${printerFeedback.startsWith('✅') ? '#86efac' : '#fca5a5'}`
              }}>
                {printerFeedback}
              </div>
            )}

            {/* Mode & Paper Width Selection Controls */}
            <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Koneksi Printer:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'bluetooth', label: 'BT', icon: <Bluetooth size={11} /> },
                    { id: 'usb', label: 'USB', icon: <Usb size={11} /> },
                    { id: 'browser', label: 'OS', icon: <Printer size={11} /> }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        const next = { ...printerSettings, connectionType: m.id };
                        setPrinterSettings(next);
                        savePrinterSettings(next);
                      }}
                      style={{
                        padding: '3px 7px',
                        borderRadius: '6px',
                        border: 'none',
                        background: (printerSettings.connectionType || 'browser') === m.id ? '#2563eb' : '#e2e8f0',
                        color: (printerSettings.connectionType || 'browser') === m.id ? '#fff' : '#475569',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {m.icon}
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Lebar Kertas:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['58mm', '80mm'].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        const next = { ...printerSettings, paperWidth: w };
                        setPrinterSettings(next);
                        savePrinterSettings(next);
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: (printerSettings.paperWidth || '58mm') === w ? '#0f172a' : '#e2e8f0',
                        color: (printerSettings.paperWidth || '58mm') === w ? '#fff' : '#475569',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Print Action Buttons */}
            <button
              type="button"
              disabled={isPrinting}
              onClick={() => handlePrintReceipt(receiptOrder)}
              style={{
                marginTop: '4px',
                padding: '11px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: isPrinting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(37,99,235,0.35)'
              }}
            >
              <Printer size={16} />
              <span>{isPrinting ? 'Mencetak ke Thermal...' : `Cetak Thermal ESC/POS (${printerSettings.connectionType?.toUpperCase() || 'BROWSER'})`}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handlePrintReceipt(receiptOrder, 'browser');
              }}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Cetak Dialog Browser (Fallback PDF/OS)
            </button>

            <button
              type="button"
              onClick={() => setReceiptOrder(null)}
              style={{
                border: 'none',
                background: 'none',
                color: '#64748b',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '4px'
              }}
            >
              Tutup Struk
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: TAMBAH MENU & KATEGORI BARU (FOTO WAJIB / MUST HAVE) ── */}
      {showAddMenuModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          zIndex: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: bgCard,
            border: `1.5px solid ${borderColor}`,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{editingProduct ? '✏️' : '✨'}</span>
                  <span>{editingProduct ? `Edit Menu: ${editingProduct.name}` : 'Tambah Menu & Kategori'}</span>
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: textSecondary }}>
                  {editingProduct ? 'Perbarui informasi menu, harga, ketersediaan stok, dan foto produk.' : 'Lengkapi informasi menu, kategori, deskripsi, dan foto wajib produk.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddMenuModal(false);
                  setEditingProduct(null);
                  setAddMenuError('');
                }}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '999px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  color: textSecondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Banner */}
            {addMenuError && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '12px',
                background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid #ef4444',
                color: isLight ? '#b91c1c' : '#fca5a5',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{addMenuError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveNewMenu} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 1. Nama Menu */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                  Nama Menu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ayam Geprek Sambal Matah"
                  value={newMenuForm.name}
                  onChange={(e) => setNewMenuForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 2. Kategori Produk & Tambah Kategori Baru */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary }}>
                    Kategori Menu <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewMenuForm(prev => ({ ...prev, isCustomCategory: !prev.isCustomCategory }))}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#2563eb',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {newMenuForm.isCustomCategory ? '← Pilih dari Kategori Ada' : '+ Buat Kategori Baru'}
                  </button>
                </div>

                {!newMenuForm.isCustomCategory ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '6px'
                  }}>
                    {availableCategories.map(cat => {
                      const isSelected = newMenuForm.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewMenuForm(prev => ({ ...prev, category: cat }))}
                          style={{
                            padding: '7px 10px',
                            borderRadius: '10px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            border: isSelected ? '1.5px solid #2563eb' : `1px solid ${borderColor}`,
                            background: isSelected
                              ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                              : (isLight ? '#f8fafc' : '#1e293b'),
                            color: isSelected ? '#ffffff' : textSecondary,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{getCategoryIcon(cat)}</span>
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="text"
                      placeholder="Ketik nama kategori baru (contoh: Kopi, Dessert, Paket Hemat)..."
                      value={newMenuForm.customCategory}
                      onChange={(e) => setNewMenuForm(prev => ({ ...prev, customCategory: e.target.value }))}
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #2563eb',
                        background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
                        color: textPrimary,
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: textSecondary }}>
                      Kategori baru ini akan otomatis muncul di filter kategori kasir dan meja pemesan.
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Harga Menu (Rp) & Stok */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                    Harga (Rp) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="Contoh: 15000"
                    value={newMenuForm.price}
                    onChange={(e) => setNewMenuForm(prev => ({ ...prev, price: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${borderLight}`,
                      background: isLight ? '#f8fafc' : '#1e293b',
                      color: textPrimary,
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMenuForm.stock}
                    onChange={(e) => setNewMenuForm(prev => ({ ...prev, stock: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${borderLight}`,
                      background: isLight ? '#f8fafc' : '#1e293b',
                      color: textPrimary,
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* 4. Deskripsi Produk */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                  Deskripsi Produk <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan bumbu, cita rasa pedas/gurih, topping, atau catatan porsi menu..."
                  value={newMenuForm.description}
                  onChange={(e) => setNewMenuForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.82rem',
                    lineHeight: 1.4,
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* 5. Foto Produk (MUST HAVE) */}
              <div style={{
                padding: '10px',
                borderRadius: '14px',
                border: !newMenuForm.image ? '1.5px dashed #ef4444' : '1.5px solid #10b981',
                background: !newMenuForm.image
                  ? (isLight ? '#fff5f5' : 'rgba(239, 68, 68, 0.08)')
                  : (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)')
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Camera size={14} />
                    <span>Foto Produk</span>
                    <span style={{ color: '#ef4444' }}>* (MUST HAVE)</span>
                  </label>
                  {newMenuForm.image ? (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#16a34a',
                      background: isLight ? '#dcfce7' : 'rgba(22, 163, 74, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <Check size={11} strokeWidth={3} /> Foto Siap Digunakan
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#ef4444',
                      background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}>
                      Wajib Diunggah
                    </span>
                  )}
                </div>

                {/* Image Preview Box */}
                {newMenuForm.image ? (
                  <div style={{ position: 'relative', width: '100%', marginBottom: '8px' }}>
                    <img
                      src={newMenuForm.image}
                      alt="Preview Produk"
                      style={{
                        width: '100%',
                        height: '140px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: `1px solid ${borderColor}`,
                        display: 'block'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setNewMenuForm(prev => ({ ...prev, image: '' }))}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#f87171',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <Trash2 size={12} /> Hapus Foto
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}>
                    ❌ Belum ada foto produk. Pilih salah satu cara di bawah:
                  </div>
                )}

                {/* Upload Button */}
                <input
                  type="file"
                  ref={menuFileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => menuFileInputRef.current && menuFileInputRef.current.click()}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    background: isLight ? '#ffffff' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Upload size={14} />
                  <span>Unggah dari Galeri / Kamera HP (Max 5MB)</span>
                </button>

                {/* Preset Photo Grid */}
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                    Atau Pilih Foto HD Siap Pakai:
                  </span>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px'
                  }}>
                    {PHOTO_PRESETS.map((preset, idx) => {
                      const isChosen = newMenuForm.image === preset.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => setNewMenuForm(prev => ({ ...prev, image: preset.url, description: prev.description || `${preset.label} lezat dengan racikan bumbu khas pilihan.` }))}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '8px',
                            border: isChosen ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                            overflow: 'hidden',
                            position: 'relative',
                            height: '52px'
                          }}
                          title={preset.label}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.6)',
                            color: '#ffffff',
                            fontSize: '0.58rem',
                            fontWeight: 700,
                            padding: '1px 3px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {preset.label}
                          </div>
                          {isChosen && (
                            <div style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              width: '16px',
                              height: '16px',
                              borderRadius: '999px',
                              background: '#2563eb',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMenuModal(false);
                    setAddMenuError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`,
                    background: isLight ? '#f1f5f9' : '#1e293b',
                    color: textSecondary,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingMenu}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: savingMenu ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    opacity: savingMenu ? 0.7 : 1
                  }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>{savingMenu ? 'Menyimpan Menu...' : (editingProduct ? 'Simpan Perubahan' : 'Simpan Menu Sekarang')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LOKASI KASIR & VALIDASI TOKO ── */}
      {showStoreModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          zIndex: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: bgCard,
            border: `1.5px solid ${borderColor}`,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '460px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={18} color="#2563eb" />
                  <span>Lokasi Kasir & Validasi Toko</span>
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: textSecondary }}>
                  Nama toko dan lokasi kasir wajib diisi agar valid sebelum melayani pesanan meja & mencetak struk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStoreModal(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '999px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#f1f5f9' : '#1e293b',
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

            {storeSaveMsg && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                textAlign: 'center',
                background: storeSaveMsg.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                color: storeSaveMsg.startsWith('✅') ? '#166534' : '#991b1b',
                border: `1px solid ${storeSaveMsg.startsWith('✅') ? '#86efac' : '#fca5a5'}`
              }}>
                {storeSaveMsg}
              </div>
            )}

            <form onSubmit={handleSaveStore} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                  Nama Toko / Usaha Kasir <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kantin Riuph Kost Barokah"
                  value={storeInfo.storeName}
                  onChange={e => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                  Lokasi Stand / Posisi Kasir <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lantai 1 Dekat Tangga Utama / Stand Timur"
                  value={storeInfo.location}
                  onChange={e => setStoreInfo({ ...storeInfo, location: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                  Alamat Lengkap (Opsional untuk Struk)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Menoreh Tengah X No. 22"
                  value={storeInfo.address}
                  onChange={e => setStoreInfo({ ...storeInfo, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                    Kota
                  </label>
                  <input
                    type="text"
                    placeholder="Semarang"
                    value={storeInfo.city}
                    onChange={e => setStoreInfo({ ...storeInfo, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${borderLight}`,
                      background: isLight ? '#f8fafc' : '#1e293b',
                      color: textPrimary,
                      fontSize: '0.82rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                    No. Telp / WA Kasir
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={storeInfo.phone}
                    onChange={e => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${borderLight}`,
                      background: isLight ? '#f8fafc' : '#1e293b',
                      color: textPrimary,
                      fontSize: '0.82rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowStoreModal(false)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    background: isLight ? '#f1f5f9' : '#1e293b',
                    color: textSecondary,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStore}
                  style={{
                    flex: 2,
                    padding: '9px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: savingStore ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                  }}
                >
                  {savingStore ? 'Menyimpan Lokasi...' : 'Simpan & Validasi Toko'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DISKON KHUSUS OWNER / ADMIN ── */}
      {showDiscountModal && selectedOrderForDiscount && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          zIndex: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: bgCard,
            border: `1.5px solid ${borderColor}`,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '440px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Percent size={18} color="#d97706" />
                  <span>Beri Diskon Khusus (Owner / Kasir)</span>
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: textSecondary }}>
                  Order #{selectedOrderForDiscount.id} • Meja {selectedOrderForDiscount.tableNumber} ({selectedOrderForDiscount.customerName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDiscountModal(false);
                  setSelectedOrderForDiscount(null);
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '999px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#f1f5f9' : '#1e293b',
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

            {/* Current Subtotal */}
            <div style={{
              background: isLight ? '#f8fafc' : '#0f172a',
              border: `1px solid ${borderColor}`,
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem'
            }}>
              <span style={{ color: textSecondary }}>Subtotal Pesanan:</span>
              <strong style={{ color: textPrimary, fontFamily: 'var(--font-mono)' }}>
                Rp {selectedOrderForDiscount.subtotal?.toLocaleString('id-ID')}
              </strong>
            </div>

            <form onSubmit={handleApplyDiscount} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                  Tipe Diskon:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'FIXED', label: 'Nominal Rupiah (Rp)' },
                    { id: 'PERCENT', label: 'Persentase (%)' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDiscountForm({ ...discountForm, type: t.id })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '10px',
                        border: discountForm.type === t.id ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                        background: discountForm.type === t.id ? '#2563eb' : bgCard,
                        color: discountForm.type === t.id ? '#ffffff' : textPrimary,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                  Nilai Diskon ({discountForm.type === 'FIXED' ? 'Rp' : '%'}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={discountForm.type === 'PERCENT' ? 100 : selectedOrderForDiscount.subtotal}
                  placeholder={discountForm.type === 'FIXED' ? 'Contoh: 5000' : 'Contoh: 15'}
                  value={discountForm.value}
                  onChange={e => setDiscountForm({ ...discountForm, value: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                  Alasan Diskon (Muncul di Struk):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Diskon Sahabat Kost / Promo Sore"
                  value={discountForm.reason}
                  onChange={e => setDiscountForm({ ...discountForm, reason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${borderLight}`,
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: textPrimary,
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Dynamic Discount Result Preview */}
              {discountForm.value > 0 && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid #fca5a5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem'
                }}>
                  <span style={{ color: '#b91c1c', fontWeight: 700 }}>Total Baru Setelah Diskon:</span>
                  <strong style={{ color: '#b91c1c', fontFamily: 'var(--font-mono)' }}>
                    Rp {Math.max(0, selectedOrderForDiscount.subtotal - (discountForm.type === 'FIXED' ? Number(discountForm.value) : Math.round(selectedOrderForDiscount.subtotal * (Number(discountForm.value) / 100)))).toLocaleString('id-ID')}
                  </strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscountModal(false);
                    setSelectedOrderForDiscount(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    background: isLight ? '#f1f5f9' : '#1e293b',
                    color: textSecondary,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={applyingDiscount}
                  style={{
                    flex: 2,
                    padding: '9px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: applyingDiscount ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(217,119,6,0.3)'
                  }}
                >
                  {applyingDiscount ? 'Menerapkan...' : 'Terapkan Diskon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: MEMBER STAMP & LOYALTY CARD SHORTCUT ── */}
      {showLoyaltyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          zIndex: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: bgCard,
            border: `1.5px solid ${borderColor}`,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} color="#d97706" />
                  <span>Program Stamp & Poin Member</span>
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: textSecondary }}>
                  Cari member via nomor WhatsApp untuk melihat stamp atau memberikan poin loyalitas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLoyaltyModal(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '999px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#f1f5f9' : '#1e293b',
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

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="tel"
                placeholder="Nomor WA Pelanggan (cth: 08123456789)..."
                value={loyaltySearchPhone}
                onChange={e => setLoyaltySearchPhone(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchLoyalty(); }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${borderLight}`,
                  background: isLight ? '#f8fafc' : '#1e293b',
                  color: textPrimary,
                  fontSize: '0.82rem'
                }}
              />
              <button
                type="button"
                onClick={() => handleSearchLoyalty()}
                disabled={loyaltyLoading}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {loyaltyLoading ? 'Cari...' : 'Cari Member'}
              </button>
            </div>

            {loyaltyData && (
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: isLight ? '#f8fafc' : '#0f172a',
                border: `1px solid ${borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: textPrimary, fontSize: '0.85rem' }}>{loyaltyData.phone}</span>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.82rem' }}>{(loyaltyData.points || 0).toLocaleString('id-ID')} Poin</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '6px',
                  padding: '8px',
                  background: isLight ? '#fff' : '#1e293b',
                  borderRadius: '10px',
                  border: `1px dashed ${borderColor}`
                }}>
                  {[0, 1, 2, 3, 4].map(idx => {
                    const isFilled = idx < (loyaltyData.stamps?.current || 0);
                    return (
                      <div
                        key={idx}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '50%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isFilled ? '2px solid #d97706' : `1.5px dashed ${borderColor}`,
                          background: isFilled ? '#fef3c7' : 'transparent',
                          color: isFilled ? '#b45309' : textSecondary
                        }}
                      >
                        <Award size={14} />
                        <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleGrantStamp}
                    style={{
                      flex: 1,
                      padding: '7px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#f59e0b',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Beri 1 Stamp
                  </button>
                  <button
                    type="button"
                    onClick={handleRedeemStamp}
                    disabled={(loyaltyData.stamps?.current || 0) < 5}
                    style={{
                      flex: 1,
                      padding: '7px',
                      borderRadius: '8px',
                      border: 'none',
                      background: (loyaltyData.stamps?.current || 0) >= 5 ? '#16a34a' : '#94a3b8',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: (loyaltyData.stamps?.current || 0) >= 5 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    🎁 Tukar Hadiah (Min. 5)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL TOP UP SALDO KUOTA NOTA KASIR ── */}
      {showPosTopupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          padding: '1rem'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1.5px solid #bfdbfe' : '1.5px solid rgba(59, 130, 246, 0.45)',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {tripayTopupData ? (
                    <CreditCard size={22} color="#2563eb" />
                  ) : (
                    <Zap size={22} color="#3b82f6" />
                  )}
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: textPrimary }}>
                    {tripayTopupData ? 'Pembayaran TriPay Gateway' : 'Top Up Saldo Kuota Nota Kasir'}
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: textSecondary }}>
                  {tripayTopupData 
                    ? 'Pindai barcode QRIS resmi atau buka halaman checkout TriPay (T53543).'
                    : 'Harga flat: Rp 100 / Lembar Nota (Dibutuhkan untuk transaksi kasir tunai).'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPosTopupModal(false);
                  setTripayTopupData(null);
                }}
                style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {tripayTopupData ? (
              /* ── TRIPAY PAYMENT SCREEN (QRIS & CHECKOUT REDIRECT) ── */
              <div>
                <div style={{
                  background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
                  border: '1.5px solid #3b82f6',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                      🔒 TriPay Official Gateway (T53543)
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: textPrimary, marginTop: '2px' }}>
                      +{tripayTopupData.quota} Lembar Nota Kasir
                    </div>
                    <div style={{ fontSize: '0.68rem', color: textSecondary, fontFamily: 'monospace' }}>
                      Ref: {tripayTopupData.reference}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: textSecondary }}>Total Bayar:</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                      Rp {tripayTopupData.amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* QRIS BARCODE DISPLAY */}
                <div style={{
                  textAlign: 'center',
                  background: isLight ? '#f8fafc' : '#1e293b',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '16px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#2563eb',
                    marginBottom: '8px',
                    letterSpacing: '0.5px'
                  }}>
                    PINDAI QRIS TRIPAY REAL-TIME
                  </div>

                  {tripayTopupData.qrDataUrl ? (
                    <div style={{
                      display: 'inline-block',
                      background: '#ffffff',
                      padding: '10px',
                      borderRadius: '16px',
                      border: '2px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}>
                      <img
                        src={tripayTopupData.qrDataUrl}
                        alt="QRIS TriPay"
                        style={{ width: '190px', height: '190px', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', color: textSecondary, fontSize: '0.8rem' }}>
                      Memuat barcode QRIS TriPay...
                    </div>
                  )}

                  <div style={{ fontSize: '0.72rem', color: textSecondary, marginTop: '8px' }}>
                    Bisa discan via <strong>BCA, Mandiri Livin, BRImo, GoPay, OVO, Dana, ShopeePay</strong>
                  </div>
                </div>

                {/* ACTION 1: BUKA HALAMAN CHECKOUT TRIPAY (OFFICIAL REDIRECT) */}
                <button
                  type="button"
                  onClick={() => window.open(tripayTopupData.checkoutUrl, '_blank')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1.5px solid #2563eb',
                    background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
                    color: '#2563eb',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '8px'
                  }}
                >
                  <ExternalLink size={15} />
                  <span>Buka Halaman Checkout TriPay Resmi ↗</span>
                </button>

                {/* STATUS FEEDBACK DARI TRIPAY */}
                {tripayStatusFeedback && (
                  <div style={{
                    marginBottom: '10px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: tripayStatusFeedback.type === 'error' ? (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)') : '#f0fdf4',
                    border: tripayStatusFeedback.type === 'error' ? '1px solid #f87171' : '1px solid #86efac',
                    color: tripayStatusFeedback.type === 'error' ? '#b91c1c' : '#15803d',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    lineHeight: 1.35
                  }}>
                    {tripayStatusFeedback.message}
                  </div>
                )}

                {/* ACTION 2: CEK STATUS PEMBAYARAN KE TRIPAY */}
                <button
                  type="button"
                  disabled={tripayCheckingStatus}
                  onClick={() => handleConfirmTripayTopup(false)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: tripayCheckingStatus ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    marginBottom: '8px'
                  }}
                >
                  <RefreshCw size={16} />
                  <span>{tripayCheckingStatus ? 'Sedang Mengecek Status ke TriPay...' : '🔄 Cek Status Pembayaran ke TriPay'}</span>
                </button>

                {/* ACTION 3: KEMBALI / GANTI PAKET */}
                <button
                  type="button"
                  onClick={() => setTripayTopupData(null)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: textSecondary,
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '6px',
                    textAlign: 'center'
                  }}
                >
                  ← Kembali / Pilih Nominal Lain
                </button>
              </div>
            ) : (
              /* ── NORMAL PACKAGE SELECTOR (DENGAN TOMBOL BAYAR TRIPAY) ── */
              <div>
                {/* ── STATUS KUOTA KASIR (PROMO REFERRAL) CARD ── */}
                <div style={{
                  background: isLight ? '#f8fafc' : '#1e293b',
                  border: '1.5px solid #3b82f6',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.12)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.5px' }}>
                      STATUS KUOTA KASIR (PROMO REFERRAL)
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: Number(storeInfo.kuotaNota ?? 50) <= 15 ? '#ef4444' : '#16a34a',
                      background: Number(storeInfo.kuotaNota ?? 50) <= 15 ? '#fee2e2' : '#dcfce7',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: Number(storeInfo.kuotaNota ?? 50) <= 15 ? '1px solid #fca5a5' : '1px solid #86efac'
                    }}>
                      {Number(storeInfo.kuotaNota ?? 50) <= 15 ? '⚠️ Kuota Menipis' : '✓ 500 Kuota Aktif'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: textPrimary }}>
                      Sisa Kuota: <span style={{ color: Number(storeInfo.kuotaNota ?? 50) <= 15 ? '#ef4444' : '#10b981' }}>{storeInfo.kuotaNota ?? 50}</span> / 500 Nota
                    </div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: textSecondary }}>
                      {Math.min(100, Math.max(0, (((storeInfo.kuotaNota ?? 50) / 500) * 100))).toFixed(1)}% Tersedia
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: isLight ? '#e2e8f0' : '#334155',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(0, (((storeInfo.kuotaNota ?? 50) / 500) * 100)))}%`,
                      height: '100%',
                      background: Number(storeInfo.kuotaNota ?? 50) <= 15 
                        ? '#ef4444' 
                        : 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  <div style={{ fontSize: '0.72rem', color: textSecondary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Nilai Manfaat: <strong>Gratis Biaya Transaksi s/d Habis</strong></span>
                    <span>Saldo: <strong>Rp {(storeInfo.saldoNota || 0).toLocaleString('id-ID')}</strong></span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: textSecondary, marginBottom: '8px' }}>
                    Pilih Paket Top Up:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { amount: 5000, label: '50 Nota', sub: 'Rp 5.000' },
                      { amount: 10000, label: '100 Nota', sub: 'Rp 10.000' },
                      { amount: 25000, label: '250 Nota', sub: 'Rp 25.000' }
                    ].map(pkg => (
                      <button
                        key={pkg.amount}
                        type="button"
                        onClick={() => setPosTopupAmount(pkg.amount)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          border: posTopupAmount === pkg.amount ? '2px solid #3b82f6' : `1px solid ${borderColor}`,
                          background: posTopupAmount === pkg.amount ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.2)') : (isLight ? '#f8fafc' : '#1e293b'),
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: posTopupAmount === pkg.amount ? '#3b82f6' : textPrimary }}>
                          {pkg.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: textSecondary, marginTop: '2px' }}>
                          {pkg.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: Klaim Kode Redeem dari Owner */}
                <div style={{
                  background: isLight ? '#fdf2f8' : 'rgba(236, 72, 153, 0.1)',
                  border: isLight ? '1px dashed #f472b6' : '1px dashed rgba(236, 72, 153, 0.4)',
                  borderRadius: '14px',
                  padding: '12px',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Gift size={16} color="#ec4899" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: textPrimary }}>
                      Punya Kode Voucher / Promo Kasir?
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Contoh: KASIRBONUS50"
                      value={redeemCodeInput}
                      onChange={e => setRedeemCodeInput(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        boxSizing: 'border-box',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: isLight ? '1px solid #fbcfe8' : '1px solid rgba(236, 72, 153, 0.3)',
                        background: bgCard,
                        color: textPrimary,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}
                    />
                    <button
                      type="button"
                      disabled={redeemLoading || !redeemCodeInput.trim()}
                      onClick={() => handleClaimRedeemCode()}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(236, 72, 153, 0.3)'
                      }}
                    >
                      {redeemLoading ? 'Mengecek...' : 'Klaim'}
                    </button>
                  </div>

                  {redeemFeedback && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      background: redeemFeedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                      color: redeemFeedback.type === 'success' ? '#15803d' : '#b91c1c'
                    }}>
                      {redeemFeedback.message}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPosTopupModal(false);
                      setTripayTopupData(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '12px',
                      border: `1px solid ${borderColor}`,
                      background: 'transparent',
                      color: textSecondary,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={posTopupLoading}
                    onClick={() => handleInitiateTripayTopup(posTopupAmount)}
                    style={{
                      flex: 2,
                      padding: '11px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <CreditCard size={16} />
                    <span>{posTopupLoading ? 'Menghubungkan TriPay...' : `Bayar via TriPay (Rp ${posTopupAmount.toLocaleString('id-ID')})`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL MANAJEMEN PROMO MAKANAN (OWNER, MITRA, KASIR, ADMIN) ── */}
      {showPromoManagerModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          padding: '1rem'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1.5px solid #fde68a' : '1.5px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '24px',
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={20} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: textPrimary }}>
                    Manajemen Promo Makanan
                  </h3>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: textSecondary }}>
                  Owner, Mitra, Kasir, atau Admin dapat membuat promo makanan berbasis <strong>Batas Kuota</strong> atau <strong>Batas Tanggal</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPromoManagerModal(false);
                  setPromoSaveFeedback(null);
                }}
                style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Feedback Alert */}
              {promoSaveFeedback && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: promoSaveFeedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: promoSaveFeedback.type === 'success' ? '#15803d' : '#b91c1c'
                }}>
                  {promoSaveFeedback.message}
                </div>
              )}

              {/* Section 1: Daftar Promo Makanan Aktif */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: textPrimary, textTransform: 'uppercase' }}>
                    Daftar Promo Makanan ({promosList.length})
                  </span>
                  <button
                    type="button"
                    onClick={loadPromos}
                    disabled={loadingPromos}
                    style={{ fontSize: '0.72rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {loadingPromos ? 'Memuat...' : 'Muat Ulang ↻'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {promosList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: textSecondary, fontSize: '0.8rem' }}>
                      Belum ada promo makanan yang terdaftar. Buat promo baru di bawah!
                    </div>
                  ) : (
                    promosList.map(pr => {
                      const isExpired = pr.isDateExpired;
                      const isQuotaEmpty = pr.isQuotaEmpty;

                      return (
                        <div
                          key={pr.id}
                          style={{
                            background: isLight ? '#f8fafc' : '#1e293b',
                            border: `1px solid ${pr.isAvailable ? (isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.4)') : borderColor}`,
                            borderRadius: '14px',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 900,
                                  fontSize: '0.85rem',
                                  color: '#b45309',
                                  background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                                  padding: '2px 8px',
                                  borderRadius: '6px'
                                }}>
                                  {pr.code}
                                </span>
                                <strong style={{ fontSize: '0.88rem', color: textPrimary }}>
                                  {pr.title}
                                </strong>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: pr.createdByRole === 'owner' ? '#f3e8ff' : pr.createdByRole === 'mitra' ? '#dbeafe' : '#f1f5f9',
                                  color: pr.createdByRole === 'owner' ? '#7e22ce' : pr.createdByRole === 'mitra' ? '#1d4ed8' : '#475569',
                                  textTransform: 'uppercase'
                                }}>
                                  oleh {pr.createdByRole}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.74rem', color: textSecondary, marginTop: '4px' }}>
                                Potongan: <strong style={{ color: '#16a34a' }}>{pr.discountType === 'PERCENT' ? `${pr.discountValue}%` : `Rp ${Number(pr.discountValue).toLocaleString('id-ID')}`}</strong>
                                {pr.scope === 'SPECIFIC_ITEM' && <span> • Menu: <strong>{pr.targetProductName || 'Item Tertentu'}</strong></span>}
                                {pr.minOrder > 0 && <span> • Min. Belanja: Rp {Number(pr.minOrder).toLocaleString('id-ID')}</span>}
                              </div>
                            </div>

                            {/* Badge Limit Kuota / Tanggal */}
                            <div style={{ textAlign: 'right' }}>
                              {(pr.limitType === 'QUOTA' || pr.limitType === 'BOTH') && (
                                <div style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: isQuotaEmpty ? '#fee2e2' : '#dcfce7',
                                  color: isQuotaEmpty ? '#dc2626' : '#15803d',
                                  display: 'inline-block',
                                  marginBottom: '3px'
                                }}>
                                  {isQuotaEmpty ? 'Kuota Habis' : `Sisa ${pr.remainingQuota} / ${pr.maxQuota} Kuota`}
                                </div>
                              )}
                              {(pr.limitType === 'DATE' || pr.limitType === 'BOTH') && (
                                <div style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: isExpired ? '#fee2e2' : '#eff6ff',
                                  color: isExpired ? '#dc2626' : '#2563eb',
                                  display: 'inline-block'
                                }}>
                                  {isExpired ? 'Kadaluarsa' : `s/d ${pr.expiryDate}`}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
                            <span style={{ fontSize: '0.7rem', color: pr.isAvailable ? '#16a34a' : '#ef4444', fontWeight: 700 }}>
                              {pr.isAvailable ? '● Siap Digunakan di Kasir' : '○ Tidak Tersedia (Habis/Kadaluarsa)'}
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleTogglePromo(pr.id)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  border: `1px solid ${borderColor}`,
                                  background: 'transparent',
                                  color: textSecondary,
                                  cursor: 'pointer'
                                }}
                              >
                                {pr.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePromo(pr.id)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  border: 'none',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  cursor: 'pointer'
                                }}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Section 2: Form Buat Promo Makanan Baru */}
              <div style={{
                background: isLight ? '#f8fafc' : '#111827',
                border: `1px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Plus size={16} color="#f59e0b" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: textPrimary }}>
                    + Terbitkan Promo Makanan Baru
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.72rem', color: textSecondary }}>
                  Bisa diterbitkan oleh <strong>Owner</strong>, <strong>Mitra</strong>, <strong>Kasir</strong>, atau <strong>Admin</strong> dengan batasan kuota porsi atau batas tanggal kadaluarsa.
                </p>

                <form onSubmit={handleCreatePromo} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Row 1: Role Pembuat & Kode Promo */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                        Diterbitkan Oleh (Role):
                      </label>
                      <select
                        value={newPromoForm.createdByRole}
                        onChange={e => setNewPromoForm(prev => ({ ...prev, createdByRole: e.target.value }))}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '7px 8px',
                          borderRadius: '8px',
                          border: `1px solid ${borderLight}`,
                          background: bgCard,
                          color: textPrimary,
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                      >
                        <option value="owner">👑 Owner Kost / Toko</option>
                        <option value="mitra">🏬 Mitra Merchant</option>
                        <option value="kasir">👨‍🍳 Kasir POS</option>
                        <option value="admin">🛡️ Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                        Kode Promo (Singkat):
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: HEMAT10"
                        value={newPromoForm.code}
                        onChange={e => setNewPromoForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '7px 8px',
                          borderRadius: '8px',
                          border: `1px solid ${borderLight}`,
                          background: bgCard,
                          color: textPrimary,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Judul Promo */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                      Nama / Judul Promo Makanan:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Promo Makan Siang Hemat (Diskon Rp 5.000)"
                      value={newPromoForm.title}
                      onChange={e => setNewPromoForm(prev => ({ ...prev, title: e.target.value }))}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '7px 8px',
                        borderRadius: '8px',
                        border: `1px solid ${borderLight}`,
                        background: bgCard,
                        color: textPrimary,
                        fontSize: '0.78rem'
                      }}
                    />
                  </div>

                  {/* Row 3: Scope Produk (Semua Menu vs Menu Spesifik) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                        Target Menu:
                      </label>
                      <select
                        value={newPromoForm.scope}
                        onChange={e => setNewPromoForm(prev => ({ ...prev, scope: e.target.value }))}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '7px 8px',
                          borderRadius: '8px',
                          border: `1px solid ${borderLight}`,
                          background: bgCard,
                          color: textPrimary,
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                      >
                        <option value="ALL">Semua Menu (Diskon Pesanan)</option>
                        <option value="SPECIFIC_ITEM">Menu Makanan Spesifik</option>
                      </select>
                    </div>

                    {newPromoForm.scope === 'SPECIFIC_ITEM' ? (
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                          Pilih Menu:
                        </label>
                        <select
                          value={newPromoForm.targetProductId}
                          onChange={e => setNewPromoForm(prev => ({ ...prev, targetProductId: e.target.value }))}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            border: `1px solid ${borderLight}`,
                            background: bgCard,
                            color: textPrimary,
                            fontSize: '0.78rem'
                          }}
                        >
                          <option value="">-- Pilih Menu Makanan --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Rp {p.price.toLocaleString('id-ID')})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                          Minimal Belanja (Opsional):
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={newPromoForm.minOrder}
                          onChange={e => setNewPromoForm(prev => ({ ...prev, minOrder: e.target.value }))}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            border: `1px solid ${borderLight}`,
                            background: bgCard,
                            color: textPrimary,
                            fontSize: '0.78rem'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Row 4: Tipe Diskon & Nilai */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                        Tipe Potongan:
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                          { id: 'FIXED', label: 'Nominal (Rp)' },
                          { id: 'PERCENT', label: 'Persen (%)' }
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setNewPromoForm(prev => ({ ...prev, discountType: t.id }))}
                            style={{
                              flex: 1,
                              padding: '6px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: newPromoForm.discountType === t.id ? '2px solid #f59e0b' : `1px solid ${borderColor}`,
                              background: newPromoForm.discountType === t.id ? (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.25)') : 'transparent',
                              color: newPromoForm.discountType === t.id ? '#b45309' : textSecondary,
                              fontWeight: 700,
                              fontSize: '0.74rem'
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                        Besaran Diskon ({newPromoForm.discountType === 'PERCENT' ? '%' : 'Rp'}):
                      </label>
                      <input
                        type="number"
                        placeholder={newPromoForm.discountType === 'PERCENT' ? 'Contoh: 15' : 'Contoh: 5000'}
                        value={newPromoForm.discountValue}
                        onChange={e => setNewPromoForm(prev => ({ ...prev, discountValue: e.target.value }))}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '7px 8px',
                          borderRadius: '8px',
                          border: `1px solid ${borderLight}`,
                          background: bgCard,
                          color: textPrimary,
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 5: PILIHAN BATASAN PROMO (ANTARA KUOTA ATAU TANGGAL ATAU KEDUANYA) */}
                  <div style={{
                    background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    padding: '10px'
                  }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800, color: textPrimary, display: 'block', marginBottom: '6px' }}>
                      Pilih Batasan Berlaku Promo (Kuota atau Tanggal):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
                      {[
                        { id: 'QUOTA', label: 'Batas Kuota', sub: 'Maks. X porsi' },
                        { id: 'DATE', label: 'Batas Tanggal', sub: 's/d Tanggal' },
                        { id: 'BOTH', label: 'Keduanya', sub: 'Kuota & Tgl' }
                      ].map(lt => (
                        <button
                          key={lt.id}
                          type="button"
                          onClick={() => setNewPromoForm(prev => ({ ...prev, limitType: lt.id }))}
                          style={{
                            padding: '6px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: newPromoForm.limitType === lt.id ? '2px solid #3b82f6' : `1px solid ${borderColor}`,
                            background: newPromoForm.limitType === lt.id ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.25)') : bgCard,
                            color: newPromoForm.limitType === lt.id ? '#2563eb' : textSecondary,
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.74rem' }}>{lt.label}</div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{lt.sub}</div>
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: newPromoForm.limitType === 'BOTH' ? '1fr 1fr' : '1fr', gap: '8px' }}>
                      {(newPromoForm.limitType === 'QUOTA' || newPromoForm.limitType === 'BOTH') && (
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                            Batas Kuota Porsi/Pemakaian:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            placeholder="Contoh: 25"
                            value={newPromoForm.maxQuota}
                            onChange={e => setNewPromoForm(prev => ({ ...prev, maxQuota: e.target.value }))}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '7px 8px',
                              borderRadius: '8px',
                              border: `1px solid ${borderLight}`,
                              background: bgCard,
                              color: textPrimary,
                              fontSize: '0.78rem'
                            }}
                          />
                        </div>
                      )}

                      {(newPromoForm.limitType === 'DATE' || newPromoForm.limitType === 'BOTH') && (
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '2px' }}>
                            Berlaku Sampai Tanggal:
                          </label>
                          <input
                            type="date"
                            value={newPromoForm.expiryDate}
                            onChange={e => setNewPromoForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '7px 8px',
                              borderRadius: '8px',
                              border: `1px solid ${borderLight}`,
                              background: bgCard,
                              color: textPrimary,
                              fontSize: '0.78rem'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPromo}
                    style={{
                      marginTop: '4px',
                      padding: '9px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    {savingPromo ? 'Menerbitkan...' : '🏷️ Terbitkan Promo Makanan'}
                  </button>
                </form>
              </div>

            </div>

            {/* Footer Modal */}
            <div style={{
              padding: '10px 1.5rem',
              borderTop: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'flex-end',
              background: isLight ? '#f8fafc' : '#0f172a'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowPromoManagerModal(false);
                  setPromoSaveFeedback(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  background: 'transparent',
                  color: textSecondary,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PERIFERAL HARDWARE: LACI KASIR (CASH DRAWER) & PRINTER THERMAL ── */}
      {showHardwareModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          padding: '1rem'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1.5px solid #86efac' : '1.5px solid rgba(16, 185, 129, 0.45)',
            borderRadius: '24px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Printer size={20} color="#10b981" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: textPrimary }}>
                    Hardware POS: Laci Kasir &amp; Printer
                  </h3>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: textSecondary }}>
                  Konfigurasi laci uang otomatis (RJ11) dan printer struk thermal (Bluetooth / USB).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHardwareModal(false)}
                style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Hardware Feedback Alert if any */}
            {printerFeedback && (
              <div style={{
                margin: '1rem 1.5rem 0',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.76rem',
                fontWeight: 700,
                background: printerFeedback.startsWith('✅') ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)') : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'),
                color: printerFeedback.startsWith('✅') ? '#059669' : '#dc2626',
                border: `1px solid ${printerFeedback.startsWith('✅') ? '#10b981' : '#ef4444'}`
              }}>
                {printerFeedback}
              </div>
            )}

            {/* Segmented Tab Controls: Laci Kasir vs Printer Thermal */}
            <div style={{ padding: '0.75rem 1.5rem 0' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                background: isLight ? '#f1f5f9' : '#1e293b',
                padding: '4px',
                borderRadius: '14px'
              }}>
                <button
                  type="button"
                  onClick={() => setHardwareModalTab('drawer')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: hardwareModalTab === 'drawer' ? '#10b981' : 'transparent',
                    color: hardwareModalTab === 'drawer' ? '#ffffff' : textSecondary,
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>🗄️</span>
                  <span>Laci Uang (Cash Drawer)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHardwareModalTab('printer')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: hardwareModalTab === 'printer' ? '#2563eb' : 'transparent',
                    color: hardwareModalTab === 'printer' ? '#ffffff' : textSecondary,
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Printer size={15} />
                  <span>Printer Struk Thermal</span>
                </button>
              </div>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* ── TAB 1: LACI UANG KASIR (CASH DRAWER RJ11 / USB) ── */}
              {hardwareModalTab === 'drawer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Status Card & Diagram Visual */}
                  <div style={{
                    padding: '1rem',
                    borderRadius: '16px',
                    background: isLight ? '#f8fafc' : '#1e293b',
                    border: `1px solid ${borderColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ● Status Laci Kasir: Siap Konek
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: '#10b981',
                        color: '#ffffff'
                      }}>
                        Port RJ11 / RJ12
                      </span>
                    </div>

                    <div style={{
                      background: isLight ? '#ffffff' : '#0f172a',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      border: `1px solid ${borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: textPrimary
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>📱</div>
                        <span>Tablet / HP</span>
                      </div>
                      <div style={{ color: textSecondary, fontSize: '0.7rem' }}>──(BT/USB)──➔</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>🖨️</div>
                        <span>Printer Thermal</span>
                      </div>
                      <div style={{ color: textSecondary, fontSize: '0.7rem' }}>──(RJ11)──➔</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>🗄️</div>
                        <span style={{ color: '#10b981' }}>Laci Kasir</span>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.72rem', color: textSecondary, lineHeight: 1.4 }}>
                      Laci kasir terhubung via kabel RJ11 (kabel telepon) di port belakang printer thermal bertuliskan <strong>"DK" (Drawer Kick)</strong>. Saat transaksi tunai selesai, pulsa 12V/24V dikirim otomatis untuk melentingkan laci terbuka.
                    </p>
                  </div>

                  {/* Tombol Utama: Uji Coba Buka Laci Sekarang */}
                  <button
                    type="button"
                    onClick={handleKickDrawerManual}
                    disabled={drawerKicking}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: 'none',
                      background: drawerKicking 
                        ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: drawerKicking ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>🔓</span>
                    <span>{drawerKicking ? 'Mengirim Pulsa Listrik...' : 'TES BUKA LACI SEKARANG (KICK DRAWER)'}</span>
                  </button>

                  {/* Pengaturan Otomatisasi Laci */}
                  <div style={{
                    padding: '1rem',
                    borderRadius: '16px',
                    background: isLight ? '#f8fafc' : '#1e293b',
                    border: `1px solid ${borderColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: textPrimary }}>
                      Pengaturan Otomatisasi Laci
                    </h4>

                    {/* Toggle: Auto-kick on Cash */}
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: isLight ? '#ffffff' : '#0f172a',
                      border: `1px solid ${borderColor}`
                    }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: textPrimary }}>
                          Buka Laci Otomatis saat Bayar Tunai (Cash)
                        </div>
                        <div style={{ fontSize: '0.68rem', color: textSecondary }}>
                          Laci langsung melenting terbuka saat klik 'Bayar Tunai &amp; Cetak Struk'.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={printerSettings.openDrawer !== false}
                        onChange={e => {
                          const next = { ...printerSettings, openDrawer: e.target.checked };
                          setPrinterSettings(next);
                          savePrinterSettings(next);
                        }}
                        style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                      />
                    </label>

                    {/* Selection: Pin RJ11 Pulsa */}
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '5px' }}>
                        Pilihan Pin Pulsa Sinyal RJ11:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {[
                          { id: 2, label: 'Pin 2 (Standard ESC/POS)', desc: 'Panda, Epson, Iware, Eppos, Kassen' },
                          { id: 5, label: 'Pin 5 (Alternatif Brand)', desc: 'Sebagian printer mini POS tertentu' }
                        ].map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              const next = { ...printerSettings, drawerPin: p.id };
                              setPrinterSettings(next);
                              savePrinterSettings(next);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '10px',
                              border: (printerSettings.drawerPin || 2) === p.id ? '2px solid #10b981' : `1px solid ${borderColor}`,
                              background: (printerSettings.drawerPin || 2) === p.id ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)') : (isLight ? '#ffffff' : '#0f172a'),
                              color: textPrimary,
                              textAlign: 'left',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: '0.76rem', color: (printerSettings.drawerPin || 2) === p.id ? '#10b981' : textPrimary }}>
                              {p.label}
                            </div>
                            <div style={{ fontSize: '0.64rem', color: textSecondary }}>
                              {p.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Panduan 3 Langkah Sambungkan Laci */}
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontSize: '0.72rem',
                    color: isLight ? '#92400e' : '#fde68a'
                  }}>
                    <strong>💡 Langkah Menyambungkan Laci Kasir:</strong>
                    <ol style={{ margin: '4px 0 0', paddingLeft: '1.1rem', lineHeight: 1.5 }}>
                      <li>Ambil kabel RJ11 (seperti kabel telepon) dari belakang laci kasir.</li>
                      <li>Colokkan ke port <strong>DK (Drawer Kick)</strong> di belakang printer thermal Anda.</li>
                      <li>Pastikan printer thermal sudah tersambung via Bluetooth atau USB di tab <em>Printer Struk Thermal</em>.</li>
                      <li>Tekan tombol <strong>"Tes Buka Laci Sekarang"</strong> di atas.</li>
                    </ol>
                  </div>

                </div>
              )}

              {/* ── TAB 2: PRINTER STRUK THERMAL ── */}
              {hardwareModalTab === 'printer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Connection Type Selector */}
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '6px' }}>
                      Pilih Metode Koneksi Printer:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {[
                        { id: 'bluetooth', label: 'Bluetooth BLE', icon: <Bluetooth size={14} />, desc: 'HP / Tablet' },
                        { id: 'usb', label: 'USB Serial', icon: <Usb size={14} />, desc: 'Kabel USB OTG' },
                        { id: 'browser', label: 'Dialog Cetak', icon: <Printer size={14} />, desc: 'Driver OS' }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            const next = { ...printerSettings, connectionType: m.id };
                            setPrinterSettings(next);
                            savePrinterSettings(next);
                          }}
                          style={{
                            padding: '8px 6px',
                            borderRadius: '10px',
                            border: (printerSettings.connectionType || 'browser') === m.id ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                            background: (printerSettings.connectionType || 'browser') === m.id ? (isLight ? '#eff6ff' : 'rgba(37,99,235,0.18)') : (isLight ? '#ffffff' : '#1e293b'),
                            color: textPrimary,
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <div style={{ color: (printerSettings.connectionType || 'browser') === m.id ? '#2563eb' : textSecondary }}>{m.icon}</div>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800 }}>{m.label}</span>
                          <span style={{ fontSize: '0.62rem', color: textSecondary }}>{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pair Device Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleConnectBluetooth}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${borderColor}`,
                        background: isLight ? '#ffffff' : '#1e293b',
                        color: textPrimary,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Bluetooth size={14} color="#3b82f6" />
                      <span>{printerSettings.pairedBluetoothDeviceName ? `BT: ${printerSettings.pairedBluetoothDeviceName}` : 'Pair Printer Bluetooth'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConnectUsb}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${borderColor}`,
                        background: isLight ? '#ffffff' : '#1e293b',
                        color: textPrimary,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Usb size={14} color="#10b981" />
                      <span>{printerSettings.pairedUsbPortName ? `USB: ${printerSettings.pairedUsbPortName}` : 'Pair Kabel USB OTG'}</span>
                    </button>
                  </div>

                  {/* Paper Width & Auto Cut */}
                  <div style={{
                    padding: '1rem',
                    borderRadius: '16px',
                    background: isLight ? '#f8fafc' : '#1e293b',
                    border: `1px solid ${borderColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '4px' }}>
                        Lebar Kertas Struk:
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {['58mm', '80mm'].map(w => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => {
                              const next = { ...printerSettings, paperWidth: w };
                              setPrinterSettings(next);
                              savePrinterSettings(next);
                            }}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '8px',
                              border: (printerSettings.paperWidth || '58mm') === w ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                              background: (printerSettings.paperWidth || '58mm') === w ? '#2563eb' : (isLight ? '#ffffff' : '#0f172a'),
                              color: (printerSettings.paperWidth || '58mm') === w ? '#ffffff' : textPrimary,
                              fontWeight: 800,
                              fontSize: '0.76rem',
                              cursor: 'pointer'
                            }}
                          >
                            {w} ({w === '58mm' ? '32 Kolom' : '48 Kolom'})
                          </button>
                        ))}
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: textPrimary, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={printerSettings.autoCut !== false}
                        onChange={e => {
                          const next = { ...printerSettings, autoCut: e.target.checked };
                          setPrinterSettings(next);
                          savePrinterSettings(next);
                        }}
                      />
                      <span>Auto-Cut Kertas Otomatis (Pemotong Kertas)</span>
                    </label>
                  </div>

                  {/* Test Print Receipt Button */}
                  <button
                    type="button"
                    onClick={() => handleTestPrint()}
                    disabled={isPrinting}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: isPrinting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <Printer size={15} />
                    <span>{isPrinting ? 'Mencetak Struk...' : 'TES CETAK STRUK THERMAL'}</span>
                  </button>

                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div style={{
              padding: '10px 1.5rem',
              borderTop: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: isLight ? '#f8fafc' : '#0f172a',
              fontSize: '0.74rem',
              color: textSecondary
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔌 Mode:</span>
                <strong style={{ color: textPrimary }}>{printerSettings.connectionType || 'browser'}</strong>
                <span>• Laci:</span>
                <strong style={{ color: '#10b981' }}>{printerSettings.openDrawer !== false ? 'Auto-Kick ON' : 'Manual'}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHardwareModal(false);
                  setPrinterFeedback('');
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#ffffff' : '#1e293b',
                  color: textPrimary,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: ATUR BANYAKNYA MENU DITAMBAHKAN (QUICK QUANTITY SELECTOR) ── */}
      {quickQtyProduct && (
        <div 
          onClick={() => setQuickQtyProduct(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: bgCard,
              border: `1.5px solid ${borderColor}`,
              borderRadius: '20px',
              padding: '1.25rem',
              width: '100%',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔢</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: textPrimary }}>
                    Opsi Tambah Berapa Pcs
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: textSecondary }}>
                    Atur jumlah pcs menu yang ingin ditambahkan ke pesanan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickQtyProduct(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: textSecondary,
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Product Summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '12px',
              background: isLight ? '#f8fafc' : '#1e293b',
              border: `1px solid ${borderColor}`
            }}>
              <img 
                src={quickQtyProduct.image} 
                alt={quickQtyProduct.name}
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {quickQtyProduct.name}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-mono)' }}>
                  Rp {quickQtyProduct.price?.toLocaleString('id-ID')} / porsi
                </div>
              </div>
            </div>

            {/* Stepper with Huge Touch Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '10px',
              background: isLight ? '#f1f5f9' : '#0f172a',
              borderRadius: '14px'
            }}>
              <button
                type="button"
                onClick={() => setQuickQtyValue(v => Math.max(0, v - 1))}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
                }}
              >
                <Minus size={20} strokeWidth={3} />
              </button>

              <input
                type="number"
                min="0"
                max="999"
                value={quickQtyValue}
                onChange={e => setQuickQtyValue(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: '80px',
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: textPrimary,
                  fontFamily: 'var(--font-mono)',
                  border: `2px solid ${borderColor}`,
                  background: isLight ? '#ffffff' : '#1e293b',
                  borderRadius: '12px',
                  padding: '4px'
                }}
              />

              <button
                type="button"
                onClick={() => setQuickQtyValue(v => Math.min(999, v + 1))}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Quick Presets (Banyaknya Porsi Cepat) */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, marginBottom: '6px' }}>
                Pilih Banyaknya Pcs Cepat:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {[1, 2, 3, 5, 10, 15, 20, 25, 50, 100].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickQtyValue(amt)}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '8px',
                      border: quickQtyValue === amt ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                      background: quickQtyValue === amt ? (isLight ? '#eff6ff' : 'rgba(37,99,235,0.2)') : (isLight ? '#ffffff' : '#1e293b'),
                      color: quickQtyValue === amt ? '#2563eb' : textPrimary,
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtotal Calculation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: '10px',
              background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981'
            }}>
              <span style={{ fontSize: '0.78rem', color: isLight ? '#166534' : '#86efac', fontWeight: 700 }}>
                Total Subtotal:
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                Rp {(quickQtyValue * (quickQtyProduct.price || 0)).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={() => setQuickQtyProduct(null)}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#ffffff' : '#1e293b',
                  color: textSecondary,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartItemExactQty(quickQtyProduct.id, quickQtyValue);
                  try { playChime(880, 0.08); } catch (_) {}
                  setQuickQtyProduct(null);
                }}
                style={{
                  flex: 2,
                  padding: '9px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                Terapkan {quickQtyValue} Pcs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: STATISTIK & ANALITIK KEUANGAN MULTI-DIMENSI ── */}
      <KasirAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        isLight={isLight}
        analyticsData={analyticsData}
        loadingAnalytics={loadingAnalytics}
        onRefresh={loadAnalytics}
      />

      {/* ── MODAL 2: MANAJEMEN GUDANG, RESEP & ALERT STOK ── */}
      <KasirInventoryModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        isLight={isLight}
        inventoryList={inventoryList}
        inventoryAlerts={inventoryAlerts}
        recipesList={recipesList}
        loadingInventory={loadingInventory}
        loadingRecipes={loadingRecipes}
        onRefresh={() => {
          loadInventory();
          loadRecipes();
        }}
        onRestockSubmit={async ({ inventoryId, addQty, notes, restockedBy }) => {
          const res = await fetch('/api/pos/inventory/restock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inventoryId, addQty, notes, restockedBy })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal restock bahan baku');
          loadInventory();
          loadAnalytics();
          return data;
        }}
      />
    </div>
  );
}
