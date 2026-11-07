import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  X,
  Store,
  ArrowLeft,
  ArrowRight,
  Zap,
  RefreshCw,
  Plus,
  Check,
  Copy,
  ShoppingBag,
  SlidersHorizontal,
  ThumbsUp,
  MapPin,
  Tag,
  Building,
  Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiGetMerchants, apiGetPartnerOrders, apiCreateMerchant, apiSuggestMerchant } from '../services/api';
import MitraGridCard from '../components/MitraGridCard';
import PartnerOrderModal from '../components/PartnerOrderModal';
import SmartLockAndTokenModal from '../components/SmartLockAndTokenModal';

export default function Layanan({ user }) {
  const { isLight } = useTheme();

  // Responsive mobile detector
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 768;
    return false;
  });

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // User State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('kostUser');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return user || { id: 'usr-1', name: 'Penghuni Kost', kamar: '122', kostUid: 'KOST-OJN64X', loyalty_points: 250 };
  });

  const kostName = localStorage.getItem('kostName') || 'KostKu Residence';
  const targetKostUid = currentUser?.kostUid || user?.kostUid || 'KOST-OJN64X';
  const activeUserId = currentUser?.id || user?.id || 'usr-1';

  // Data States
  const [merchants, setMerchants] = useState([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);

  // Search, Categories & Sorting
  const [partnerCategory, setPartnerCategory] = useState('all');
  const [partnerBrand, setPartnerBrand] = useState('all');
  const [partnerSort, setPartnerSort] = useState('cheapest'); // 'cheapest', 'highest', 'distance'
  const [pinMainPartner, setPinMainPartner] = useState(true);
  const [partnerSearch, setPartnerSearch] = useState('');

  // Referral & Loyalty States
  const [referralCopied, setReferralCopied] = useState(false);
  const [friendReferralInput, setFriendReferralInput] = useState('');
  const [friendReferralStatus, setFriendReferralStatus] = useState(null);

  // Modal States
  const [selectedService, setSelectedService] = useState(null);
  const [showSmartLockModal, setShowSmartLockModal] = useState(false);
  const [showSuggestMerchantModal, setShowSuggestMerchantModal] = useState(false);
  const [showRegisterIndependentModal, setShowRegisterIndependentModal] = useState(false);

  // Repeat Orders ("Beli Lagi")
  const [orderedMerchantIds, setOrderedMerchantIds] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('kostku_ordered_merchants');
        const parsed = stored ? JSON.parse(stored) : [];
        return new Set(parsed);
      }
    } catch (e) {}
    return new Set();
  });

  // Independent Stores
  const [independentMerchants, setIndependentMerchants] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('kostku_independent_merchants');
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {}
    return [];
  });

  // Suggest Merchant Form
  const [suggestForm, setSuggestForm] = useState({ name: '', category: 'makanan', phone: '', note: '', referralCode: '' });
  const [suggestNotice, setSuggestNotice] = useState(null);

  // Independent Merchant Form
  const [independentForm, setIndependentForm] = useState({
    name: '',
    category: 'makanan',
    phone: '',
    address: '',
    referralCode: '',
    firstProductName: '',
    firstProductPrice: 15000
  });
  const [independentNotice, setIndependentNotice] = useState(null);

  // Fetch merchants & previous orders
  const fetchMerchantsData = async () => {
    setLoadingMerchants(true);
    try {
      const res = await apiGetMerchants(targetKostUid);
      if (Array.isArray(res)) setMerchants(res);
      else if (res?.merchants) setMerchants(res.merchants);

      const pOrders = await apiGetPartnerOrders(targetKostUid, activeUserId).catch(() => []);
      if (Array.isArray(pOrders) && pOrders.length > 0) {
        setOrderedMerchantIds(prev => {
          const next = new Set(prev);
          pOrders.forEach(o => {
            if (o.merchantId) next.add(o.merchantId);
          });
          return next;
        });
      }
    } catch (err) {
      console.warn('Gagal memuat katalog mitra:', err);
    } finally {
      setLoadingMerchants(false);
    }
  };

  useEffect(() => {
    fetchMerchantsData();
  }, [targetKostUid, activeUserId]);

  // Clean up any legacy demo data from localStorage
  useEffect(() => {
    try {
      const storedIndep = localStorage.getItem('kostku_independent_merchants');
      if (storedIndep) {
        const parsed = JSON.parse(storedIndep);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(m => !isDemoMerchant(m));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('kostku_independent_merchants', JSON.stringify(cleaned));
            setIndependentMerchants(cleaned);
          }
        }
      }
      const storedOrdered = localStorage.getItem('kostku_ordered_merchants');
      if (storedOrdered) {
        const parsedO = JSON.parse(storedOrdered);
        if (Array.isArray(parsedO)) {
          const cleanedO = parsedO.filter(id => !isDemoMerchant({ id, name: id }));
          if (cleanedO.length !== parsedO.length) {
            localStorage.setItem('kostku_ordered_merchants', JSON.stringify(cleanedO));
            setOrderedMerchantIds(new Set(cleanedO));
          }
        }
      }
    } catch (_) {}
  }, []);

  // Sync user updates (e.g. loyalty points)
  useEffect(() => {
    const handleUserUpdated = (e) => {
      if (e.detail) setCurrentUser(e.detail);
    };
    window.addEventListener('kostku_user_updated', handleUserUpdated);
    window.addEventListener('kostUser_updated', handleUserUpdated);
    return () => {
      window.removeEventListener('kostku_user_updated', handleUserUpdated);
      window.removeEventListener('kostUser_updated', handleUserUpdated);
    };
  }, []);

  // Listen for newly created orders
  useEffect(() => {
    const handleOrderCreated = () => {
      fetchMerchantsData();
    };
    window.addEventListener('kostku_partner_order_created', handleOrderCreated);
    return () => window.removeEventListener('kostku_partner_order_created', handleOrderCreated);
  }, []);

  // Handle Referral Copy
  const currentLoyaltyPoints = Number(currentUser?.loyalty_points ?? 250);
  const userRefCode = currentUser?.referralCode || `KOST-${(currentUser?.kamar || '101').replace(/\s+/g, '')}-${(currentUser?.name || 'ANAKKOST').split(' ')[0].toUpperCase()}`;

  const handleCopyCode = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(userRefCode);
      }
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    } catch (e) {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    }
  };

  const handleClaimFriendCode = () => {
    if (!friendReferralInput.trim()) return;
    const cleanInput = friendReferralInput.trim().toUpperCase();
    if (cleanInput === userRefCode.toUpperCase()) {
      setFriendReferralStatus({ type: 'error', message: 'Tidak bisa pakai kodemu sendiri!' });
      return;
    }
    const newTotal = currentLoyaltyPoints + 100;
    const updated = {
      ...currentUser,
      loyalty_points: newTotal,
      claimedFriendReferral: cleanInput,
      lastUsedReferral: cleanInput
    };
    setCurrentUser(updated);
    localStorage.setItem('kostUser', JSON.stringify(updated));
    localStorage.setItem('kostku_last_referral_code', cleanInput);
    window.dispatchEvent(new CustomEvent('kostku_user_updated', { detail: updated }));
    setFriendReferralInput('');
    setFriendReferralStatus({ type: 'success', message: '🎉 +100 Poin referral tersimpan otomatis!' });
    setTimeout(() => setFriendReferralStatus(null), 3000);
  };

  // Open modals with prefilled referral code
  const handleOpenRegisterIndependent = () => {
    setIndependentNotice(null);
    setIndependentForm(prev => ({
      ...prev,
      referralCode: prev.referralCode || userRefCode
    }));
    setShowRegisterIndependentModal(true);
  };

  const handleOpenSuggestMerchant = () => {
    setSuggestNotice(null);
    setSuggestForm(prev => ({
      ...prev,
      referralCode: prev.referralCode || userRefCode
    }));
    setShowSuggestMerchantModal(true);
  };

  // Submit Warung Suggestion
  const handleSuggestMerchantSubmit = async (e) => {
    e.preventDefault();
    if (!suggestForm.name.trim()) return;

    try {
      const payload = {
        name: suggestForm.name.trim(),
        category: suggestForm.category,
        phone: suggestForm.phone?.trim() || '',
        note: suggestForm.note?.trim() || '',
        referralCode: suggestForm.referralCode?.trim() || null,
        userId: activeUserId,
        kostUid: targetKostUid
      };

      const res = await apiSuggestMerchant(payload);

      if (res?.bonusAwarded) {
        const stored = localStorage.getItem('kostUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          const currentPts = Number(parsed.loyalty_points ?? 250);
          parsed.loyalty_points = currentPts + (res.bonusPoints || 500);
          localStorage.setItem('kostUser', JSON.stringify(parsed));
          setCurrentUser(parsed);
          window.dispatchEvent(new CustomEvent('kostku_user_updated', { detail: parsed }));
          window.dispatchEvent(new Event('kostUser_updated'));
        }
        setSuggestNotice({
          type: 'success',
          message: res.message || `🎉 Usulan warung "${suggestForm.name}" berhasil dikirim! +500 Poin loyalty telah ditambahkan ke akun Anda.`
        });
      } else if (res?.isAlreadyRegistered) {
        setSuggestNotice({
          type: 'info',
          message: `⚠️ Usulan warung "${suggestForm.name}" berhasil dikirim. Namun warung ini sudah pernah diusulkan/didaftarkan sebelumnya, sehingga bonus poin referral tidak dapat diklaim lagi.`
        });
      } else {
        setSuggestNotice({
          type: 'info',
          message: res?.message || `Usulan warung "${suggestForm.name}" berhasil dikirim. Gunakan kode referral untuk mengaktifkan bonus poin.`
        });
      }
    } catch (err) {
      console.warn('Gagal mengirim usulan warung:', err);
      setSuggestNotice({
        type: 'info',
        message: `Usulan warung "${suggestForm.name}" berhasil dicatat!`
      });
    }
  };

  // Register Independent Merchant
  const handleRegisterIndependentSubmit = async (e) => {
    e.preventDefault();
    if (!independentForm.name.trim() || !independentForm.firstProductName.trim()) return;

    const newMerchantId = `PTR-INDEP-${Date.now()}`;
    const categoryLabel = independentForm.category === 'makanan' ? 'Warung & Kuliner'
      : independentForm.category === 'laundry' ? 'Laundry Express'
      : independentForm.category === 'galon' ? 'Air & Gas'
      : 'Jasa & Servis';

    const defaultIcon = independentForm.category === 'makanan' ? '🍲'
      : independentForm.category === 'laundry' ? '🧺'
      : independentForm.category === 'galon' ? '💧'
      : '🛠️';

    const defaultPhoto = independentForm.category === 'makanan'
      ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
      : null;

    const newMerchantPayload = {
      name: independentForm.name.trim(),
      category: categoryLabel,
      icon: defaultIcon,
      phone: independentForm.phone.trim() || '',
      address: independentForm.address.trim() || 'Sekitar Kost',
      distanceKm: 0.3,
      isIndependent: true,
      referralCode: independentForm.referralCode?.trim() || null,
      userId: activeUserId,
      kostUid: targetKostUid,
      products: [
        {
          id: `PROD-${Date.now()}-1`,
          name: independentForm.firstProductName.trim(),
          price: Number(independentForm.firstProductPrice) || 15000,
          image: defaultPhoto,
          isBestSeller: true,
          totalSold: 1,
          isCameraVerified: true
        }
      ]
    };

    try {
      const res = await apiCreateMerchant(newMerchantPayload);

      const createdMerchant = res?.merchant || {
        ...newMerchantPayload,
        id: newMerchantId,
        rating: 5.0,
        soldCount: 0,
        deliveryEstimate: '15-25 mnt',
        deliveryFee: 2000,
        distance: '300m',
        partnershipType: 'independent',
        isNewcomer: true,
        isNew: true,
        createdAt: new Date().toISOString()
      };

      setMerchants(prev => [createdMerchant, ...prev]);

      try {
        const stored = localStorage.getItem('kostku_independent_merchants');
        const parsed = stored ? JSON.parse(stored) : [];
        const updated = [createdMerchant, ...parsed];
        localStorage.setItem('kostku_independent_merchants', JSON.stringify(updated));
        setIndependentMerchants(updated);
      } catch (_) {}

      if (res?.bonusAwarded) {
        const stored = localStorage.getItem('kostUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          const currentPts = Number(parsed.loyalty_points ?? 250);
          parsed.loyalty_points = currentPts + (res.bonusPoints || 500);
          localStorage.setItem('kostUser', JSON.stringify(parsed));
          setCurrentUser(parsed);
          window.dispatchEvent(new CustomEvent('kostku_user_updated', { detail: parsed }));
          window.dispatchEvent(new Event('kostUser_updated'));
        }
        setIndependentNotice({
          type: 'success',
          message: `🏪 Selamat! Toko "${createdMerchant.name}" berhasil terpasang dan bonus referral +500 Poin berhasil diklaim!`
        });
      } else if (res?.isAlreadyRegistered) {
        setIndependentNotice({
          type: 'info',
          message: `⚠️ Toko "${createdMerchant.name}" berhasil terpasang. Namun toko/nomor ini sudah pernah didaftarkan sebelumnya, sehingga bonus poin referral tidak dapat diklaim ulang.`
        });
      } else {
        setIndependentNotice({
          type: 'success',
          message: `🏪 Selamat! Toko "${createdMerchant.name}" berhasil terpasang. Gunakan kode referral untuk mendapatkan bonus poin.`
        });
      }
    } catch (err) {
      console.warn('Gagal menyimpan toko mandiri:', err);
      setIndependentNotice({
        type: 'info',
        message: `Toko "${independentForm.name}" berhasil dicatat!`
      });
    }
  };

  // Base list of merchants without any mock demo data (kosong untuk persiapan mitra resmi)
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

  const realMerchants = (merchants || []).filter(m => !isDemoMerchant(m));
  const baseMerged = realMerchants;
  const rawList = [...baseMerged, ...independentMerchants.filter(im => !baseMerged.some(bm => bm.id === im.id) && !isDemoMerchant(im))];

  // Filter list
  let list = rawList.filter(m => {
    if (partnerCategory === 'all') return true;
    if (partnerCategory === 'beli_lagi') {
      return orderedMerchantIds.has(m.id) ||
             Array.from(orderedMerchantIds).some(oid => String(m.id).includes(String(oid)) || String(oid).includes(String(m.id)));
    }
    if (partnerCategory === 'mandiri') {
      return Boolean(m.isIndependent || m.partnershipType === 'independent');
    }
    if (partnerCategory === 'galon') return m.category === 'galon' || (m.products || []).some(p => p.name.toLowerCase().includes('galon'));
    if (partnerCategory === 'laundry') return m.category === 'laundry' || (m.products || []).some(p => p.name.toLowerCase().includes('laundry') || p.name.toLowerCase().includes('cuci'));
    if (partnerCategory === 'gas') return m.category === 'gas' || (m.products || []).some(p => p.name.toLowerCase().includes('gas') || p.name.toLowerCase().includes('lpg'));
    if (partnerCategory === 'makanan') return m.category === 'makanan' || m.category === 'Warung & Kuliner' || (m.products || []).some(p => p.name.toLowerCase().includes('nasi') || p.name.toLowerCase().includes('roti') || p.name.toLowerCase().includes('martabak') || p.name.toLowerCase().includes('bento'));
    if (partnerCategory === 'service') return m.category === 'service';
    return m.category === partnerCategory;
  });

  if (partnerBrand !== 'all') {
    list = list.filter(m => {
      return (m.products || []).some(p => 
        (p.brand || '').toLowerCase() === partnerBrand.toLowerCase() ||
        p.name.toLowerCase().includes(partnerBrand.toLowerCase())
      );
    });
  }

  if (partnerSearch.trim()) {
    const q = partnerSearch.toLowerCase();
    list = list.filter(m => {
      const matchName = m.name?.toLowerCase().includes(q);
      const matchProd = (m.products || []).some(p => 
        p.name?.toLowerCase().includes(q) || 
        p.desc?.toLowerCase().includes(q) || 
        p.brand?.toLowerCase().includes(q)
      );
      return matchName || matchProd;
    });
  }

  // Sorting
  list.sort((a, b) => {
    if (pinMainPartner) {
      const isMainA = Boolean(a.isMainPartner || a.partnershipType === 'main');
      const isMainB = Boolean(b.isMainPartner || b.partnershipType === 'main');
      if (isMainA && !isMainB) return -1;
      if (!isMainA && isMainB) return 1;
    }

    if (partnerSort === 'cheapest') {
      const minA = Math.min(...(a.products || [{ price: 999999 }]).map(p => Number(p.price) || 999999));
      const minB = Math.min(...(b.products || [{ price: 999999 }]).map(p => Number(p.price) || 999999));
      return minA - minB;
    } else if (partnerSort === 'highest') {
      const maxA = Math.max(...(a.products || [{ price: 0 }]).map(p => Number(p.price) || 0));
      const maxB = Math.max(...(b.products || [{ price: 0 }]).map(p => Number(p.price) || 0));
      return maxB - maxA;
    } else if (partnerSort === 'distance') {
      return (Number(a.distanceKm) || 0) - (Number(b.distanceKm) || 0);
    }
    return 0;
  });

  // Guaranteed Exploration Slot
  if (partnerCategory !== 'beli_lagi' && list.length > 2) {
    const newcomerIdx = list.findIndex(m => Boolean(m.isNewcomer || m.isNew));
    if (newcomerIdx > 1) {
      const [newcomer] = list.splice(newcomerIdx, 1);
      list.splice(1, 0, newcomer);
    }
  }

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: isMobileScreen ? '1rem 0.75rem 5rem' : '2rem 1.5rem 3rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Top Breadcrumb & Return to Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontWeight: 700
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Kost Saya
        </Link>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Kamar: <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.kamar || '122'}</strong> • {kostName}
        </span>
      </div>

      {/* Main Container Card */}
      <div className="card glass-panel" style={{
        border: '1px solid rgba(59, 130, 246, 0.25)',
        padding: isMobileScreen ? '12px 14px' : '20px 24px',
        borderRadius: '20px'
      }}>
        {/* Header Title & Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: isMobileScreen ? '1.15rem' : '1.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-display)',
              fontWeight: 800
            }}>
              <Sparkles size={20} color="#60a5fa" /> Layanan Toko & Mitra Sekitar Kost
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Bebas pilih toko langganan & bandingkan harga • Antar langsung ke pintu kamar
              </span>
              <div style={{ display: 'inline-flex', gap: '6px' }}>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#4ade80',
                  fontWeight: 700,
                  border: '1px solid rgba(34, 197, 94, 0.25)'
                }}>
                  💳 Non-Tunai / Tagihan
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#93c5fd',
                  fontWeight: 700,
                  border: '1px solid rgba(59, 130, 246, 0.25)'
                }}>
                  🏷️ Fee Max Rp 500
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenRegisterIndependent}
              className="btn btn-primary"
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Plus size={16} />
              <span>+ Daftarkan Mitra Baru</span>
            </button>
            <button
              type="button"
              onClick={handleOpenSuggestMerchant}
              className="btn btn-secondary"
              style={{
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px'
              }}
            >
              <span>🍜</span>
              <span>Usulkan Warung</span>
            </button>
          </div>
        </div>

        {/* PROGRAM REFERRAL & POIN ANAK KOST */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: isLight ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem' }}>🪙</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isLight ? '#b45309' : '#fbbf24' }}>
              {currentLoyaltyPoints} Poin
            </span>
            <span style={{ fontSize: '0.68rem', color: isLight ? '#78350f' : '#fef3c7' }}>
              (Rp {currentLoyaltyPoints.toLocaleString('id-ID')})
            </span>
            <span style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b' }}>•</span>
            <span style={{ fontSize: '0.68rem', color: isLight ? '#475569' : '#cbd5e1' }}>
              Referral: Teman <strong style={{ color: '#4ade80' }}>+100</strong>, Mitra <strong style={{ color: '#f59e0b' }}>+500</strong>, Owner Kost Baru <strong style={{ color: '#38bdf8' }}>+1.000 Poin</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Referral Code Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '0.68rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: isLight ? '#0f172a' : '#f8fafc'
            }}>
              <span>{userRefCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{
                  background: referralCopied ? '#22c55e' : (isLight ? '#f59e0b' : '#d97706'),
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {referralCopied ? 'Tersalin!' : 'Salin'}
              </button>
            </div>

            {/* Friend Code Input */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <input
                type="text"
                placeholder="Kode teman?"
                value={friendReferralInput}
                onChange={e => setFriendReferralInput(e.target.value)}
                style={{
                  width: '90px',
                  padding: '2px 6px',
                  fontSize: '0.68rem',
                  borderRadius: '6px',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  textTransform: 'uppercase'
                }}
              />
              <button
                type="button"
                onClick={handleClaimFriendCode}
                disabled={!friendReferralInput.trim()}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '2px 7px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  cursor: friendReferralInput.trim() ? 'pointer' : 'default',
                  opacity: friendReferralInput.trim() ? 1 : 0.6
                }}
              >
                +100
              </button>
            </div>

            {/* Quick Token PLN Button */}
            <button
              type="button"
              onClick={() => setShowSmartLockModal(true)}
              style={{
                background: 'none',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '0.68rem',
                color: '#fbbf24',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Zap size={12} /> Token PLN
            </button>
          </div>

          {friendReferralStatus && (
            <div style={{ fontSize: '0.65rem', color: friendReferralStatus.type === 'success' ? '#4ade80' : '#f87171', width: '100%', marginTop: '2px' }}>
              {friendReferralStatus.message}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <div style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            color: '#94a3b8',
            pointerEvents: 'none'
          }}>
            <Search size={16} />
          </div>
          <input
            type="text"
            value={partnerSearch}
            onChange={e => setPartnerSearch(e.target.value)}
            placeholder="Cari toko, menu makanan, galon, laundry..."
            className="input-field"
            style={{
              width: '100%',
              paddingLeft: '34px',
              paddingRight: partnerSearch ? '32px' : '12px',
              paddingTop: '9px',
              paddingBottom: '9px',
              fontSize: '0.85rem',
              borderRadius: '8px',
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isLight ? '#0f172a' : '#f8fafc'
            }}
          />
          {partnerSearch && (
            <button
              type="button"
              onClick={() => setPartnerSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* UMKM BANNER: Usulkan Warung & Pasang Toko Mandiri */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          background: isLight ? 'rgba(2, 132, 199, 0.06)' : 'rgba(56, 189, 248, 0.04)',
          border: isLight ? '1px solid rgba(2, 132, 199, 0.2)' : '1px solid rgba(56, 189, 248, 0.15)',
          borderRadius: '8px',
          padding: '6px 10px',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem' }}>💡</span>
            <div style={{ fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', lineHeight: 1.25 }}>
              <strong style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>Punya usaha atau warung langganan?</strong> UMKM sekitar bebas jualan tanpa wajib kontrak kost!
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleOpenSuggestMerchant}
              style={{
                background: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(56, 189, 248, 0.15)',
                border: isLight ? '1px solid #0284c7' : '1px solid #38bdf8',
                color: isLight ? '#0284c7' : '#38bdf8',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.70rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              + Usulkan Warung (+500 Pts)
            </button>
            <button
              type="button"
              onClick={handleOpenRegisterIndependent}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.70rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(14, 165, 233, 0.3)'
              }}
            >
              🏪 Pasang Toko Mandiri
            </button>
          </div>
        </div>

        {/* Controls Bar: Category Tabs & Sort/Pin Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {/* Category Selector */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'beli_lagi', label: '⚡ Beli Lagi' },
              { id: 'mandiri', label: '🏪 Mandiri' },
              { id: 'makanan', label: '🍱 Warung' },
              { id: 'galon', label: '💧 Galon' },
              { id: 'laundry', label: '🧺 Laundry' },
              { id: 'gas', label: '🔥 Gas' }
            ].map(cat => {
              const isSelected = partnerCategory === cat.id;
              const isBeliLagi = cat.id === 'beli_lagi';
              const isMandiri = cat.id === 'mandiri';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setPartnerCategory(cat.id); setPartnerBrand('all'); }}
                  style={{
                    background: isSelected
                      ? (isBeliLagi ? 'linear-gradient(135deg, #7e22ce, #9333ea)' : isMandiri ? 'linear-gradient(135deg, #0891b2, #0284c7)' : '#2563eb')
                      : (isBeliLagi 
                          ? (isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.12)') 
                          : isMandiri 
                          ? (isLight ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.12)') 
                          : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)')),
                    border: isSelected
                      ? (isBeliLagi ? '1px solid #c084fc' : isMandiri ? '1px solid #38bdf8' : '1px solid #3b82f6')
                      : (isBeliLagi 
                          ? '1px solid rgba(168, 85, 247, 0.35)' 
                          : isMandiri 
                          ? '1px solid rgba(6, 182, 212, 0.35)' 
                          : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)')),
                    color: isSelected ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
                    padding: '4px 10px',
                    borderRadius: '7px',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Right: Toggle Mitra Utama & Sort Criteria */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setPinMainPartner(prev => !prev)}
              style={{
                background: pinMainPartner 
                  ? (isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.20)') 
                  : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'),
                border: pinMainPartner ? '1px solid #f59e0b' : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)'),
                color: pinMainPartner ? (isLight ? '#b45309' : '#fbbf24') : (isLight ? '#64748b' : '#94a3b8'),
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="Prioritaskan toko mitra utama kost di urutan pertama"
            >
              👑 Utama: {pinMainPartner ? 'ON' : 'OFF'}
            </button>

            <span style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b' }}>Urut:</span>
            {[
              { id: 'cheapest', label: '🏷️ Termurah' },
              { id: 'highest', label: '💎 Tertinggi' },
              { id: 'distance', label: '📍 Terdekat' }
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPartnerSort(s.id)}
                style={{
                  background: partnerSort === s.id 
                    ? (isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.2)') 
                    : 'transparent',
                  border: partnerSort === s.id 
                    ? '1px solid #38bdf8' 
                    : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
                  color: partnerSort === s.id 
                    ? (isLight ? '#0284c7' : '#38bdf8') 
                    : (isLight ? '#64748b' : '#94a3b8'),
                  padding: '3px 7px',
                  borderRadius: '6px',
                  fontSize: '0.68rem',
                  fontWeight: partnerSort === s.id ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Merchant Cards Grid */}
        {list.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
            border: isLight ? '2px dashed #cbd5e1' : '2px dashed rgba(255, 255, 255, 0.12)',
            maxWidth: '560px',
            margin: '2rem auto'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏪</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
              {rawList.length === 0 
                ? 'Mitra Belum Ada' 
                : partnerCategory === 'beli_lagi' 
                ? 'Belum Ada Riwayat Pesanan' 
                : 'Tidak Ditemukan Mitra yang Cocok'}
            </h3>
            <p style={{ margin: '0 auto 16px', fontSize: '0.86rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.6, maxWidth: '440px' }}>
              {rawList.length === 0
                ? 'Mitra belum ada, tambahkan mitra untuk mendapat bonus poin! Masukkan kode referral saat mengusulkan atau mendaftarkan toko mitra untuk mengaktifkan extra bonus poin.'
                : partnerCategory === 'beli_lagi'
                ? '⚡ Belum ada toko yang pernah kamu beli. Pesan galon, laundry, atau makanan sekali untuk fitur re-order kilat!'
                : 'Coba ubah kata kunci atau kategori filter untuk menemukan toko lainnya.'}
            </p>
            {rawList.length === 0 ? (
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.18)',
                  color: isLight ? '#b45309' : '#fbbf24',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  marginBottom: '18px'
                }}>
                  <Sparkles size={14} color="#f59e0b" />
                  <span>Extra Poin: Wajib pakai kode referral (1x klaim per mitra baru)</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleOpenRegisterIndependent}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '9px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
                  >
                    <Plus size={16} /> Pasang Toko Mandiri (+ Bonus Poin)
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSuggestMerchant}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
                  >
                    <span>🍜</span> Usulkan Warung (+ Bonus Poin)
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setPartnerCategory('all'); setPartnerBrand('all'); setPartnerSearch(''); }}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '10px', fontSize: '0.75rem' }}
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobileScreen ? 'repeat(2, 1fr)' : 'repeat(4, minmax(0, 1fr))',
            gap: isMobileScreen ? '8px' : '14px'
          }}>
            {list.map((item, idx) => (
              <MitraGridCard
                key={item.id || idx}
                item={item}
                idx={idx}
                isMobileScreen={isMobileScreen}
                onSelect={setSelectedService}
                hasOrderedBefore={
                  orderedMerchantIds.has(item.id) ||
                  Array.from(orderedMerchantIds).some(oid => String(item.id).includes(String(oid)) || String(oid).includes(String(item.id)))
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL USULKAN WARUNG SEKITAR */}
      {showSuggestMerchantModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.5)' : 'rgba(5, 10, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '1.25rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: isLight ? '#0f172a' : '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🍜</span> Usulkan Warung Langganan
                </h3>
                <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  Dapatkan <strong style={{ color: '#f59e0b' }}>+500 Poin loyalty</strong> saat warung kamu daftarkan!
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setShowSuggestMerchantModal(false); setSuggestNotice(null); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {suggestNotice && (
              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                marginBottom: '10px',
                background: suggestNotice.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: suggestNotice.type === 'success' ? '#4ade80' : '#f87171',
                border: `1px solid ${suggestNotice.type === 'success' ? '#22c55e' : '#ef4444'}`
              }}>
                {suggestNotice.message}
              </div>
            )}

            <form onSubmit={handleSuggestMerchantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '3px', fontWeight: 600 }}>
                  Nama Warung / Usaha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Warung Nasi Padang Sabana"
                  value={suggestForm.name}
                  onChange={e => setSuggestForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '3px', fontWeight: 600 }}>
                  Kategori Usaha
                </label>
                <select
                  value={suggestForm.category}
                  onChange={e => setSuggestForm(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="makanan">🍲 Warung Makan & Jajanan</option>
                  <option value="laundry">🧺 Laundry Kiloan</option>
                  <option value="galon">💧 Air Galon & Gas LPG</option>
                  <option value="jasa">🛠️ Jasa / Fotokopi / Servis</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '3px', fontWeight: 600 }}>
                  Kontak / WhatsApp Warung (Jika ada)
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={suggestForm.phone}
                  onChange={e => setSuggestForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '3px', fontWeight: 600 }}>
                  Menu Rekomendasi / Catatan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Ayam bakar bumbu rujaknya enak banget dan murah!"
                  value={suggestForm.note}
                  onChange={e => setSuggestForm(prev => ({ ...prev, note: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: isLight ? '#166534' : '#86efac', marginBottom: '3px', fontWeight: 700 }}>
                  <Sparkles size={12} color="#22c55e" />
                  Kode Referral (Klaim Extra Poin Bonus)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: KOST-122-OSCAR"
                  value={suggestForm.referralCode || ''}
                  onChange={e => setSuggestForm(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f0fdf4' : 'rgba(34, 197, 94, 0.08)',
                    border: isLight ? '1px solid #86efac' : '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: isLight ? '#14532d' : '#86efac',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                />
                <span style={{ fontSize: '0.66rem', color: isLight ? '#15803d' : '#86efac', marginTop: '2px', display: 'block' }}>
                  💡 Masukkan kode referral untuk klaim bonus +500 Poin. <em>(Hanya berlaku 1x per warung baru).</em>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => { setShowSuggestMerchantModal(false); setSuggestNotice(null); }}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '6px 16px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  Kirim Usulan (+500 Poin)
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PASANG TOKO MANDIRI (UMKM INDEPENDENT) */}
      {showRegisterIndependentModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.5)' : 'rgba(5, 10, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '1.25rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: isLight ? '#0f172a' : '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏪</span> Pasang Toko Mandiri (UMKM Sekitar Kost)
                </h3>
                <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  Langsung tayang di aplikasi penghuni tanpa perlu kontrak khusus pemilik kost
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setShowRegisterIndependentModal(false); setIndependentNotice(null); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {independentNotice && (
              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                marginBottom: '10px',
                background: independentNotice.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: independentNotice.type === 'success' ? '#4ade80' : '#f87171',
                border: `1px solid ${independentNotice.type === 'success' ? '#22c55e' : '#ef4444'}`
              }}>
                {independentNotice.message}
              </div>
            )}

            <form onSubmit={handleRegisterIndependentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '3px', fontWeight: 600 }}>
                  Nama Toko / Usaha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Juice Bar & Snack Segar"
                  value={independentForm.name}
                  onChange={e => setIndependentForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '3px', fontWeight: 600 }}>
                    Kategori Usaha
                  </label>
                  <select
                    value={independentForm.category}
                    onChange={e => setIndependentForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%',
                      background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '0.8rem'
                    }}
                  >
                    <option value="makanan">🍲 Warung & Kuliner</option>
                    <option value="laundry">🧺 Laundry Kiloan</option>
                    <option value="galon">💧 Air & Gas Elpiji</option>
                    <option value="jasa">🛠️ Jasa & Servis</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '3px', fontWeight: 600 }}>
                    WhatsApp Toko *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081298765432"
                    value={independentForm.phone}
                    onChange={e => setIndependentForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '3px', fontWeight: 600 }}>
                  Alamat / Patokan Toko
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Menoreh Tengah No. 12 (150m dari kost)"
                  value={independentForm.address}
                  onChange={e => setIndependentForm(prev => ({ ...prev, address: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                border: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '10px 12px'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#0284c7' : '#38bdf8', display: 'block', marginBottom: '6px' }}>
                  📦 Produk / Menu Utama Pertama:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '3px' }}>
                      Nama Menu / Jasa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Jus Alpukat Kocok"
                      value={independentForm.firstProductName}
                      onChange={e => setIndependentForm(prev => ({ ...prev, firstProductName: e.target.value }))}
                      style={{
                        width: '100%',
                        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        fontSize: '0.76rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '3px' }}>
                      Harga (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="500"
                      placeholder="15000"
                      value={independentForm.firstProductPrice}
                      onChange={e => setIndependentForm(prev => ({ ...prev, firstProductPrice: e.target.value }))}
                      style={{
                        width: '100%',
                        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        fontSize: '0.76rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: isLight ? '#166534' : '#86efac', marginBottom: '3px', fontWeight: 700 }}>
                  <Sparkles size={12} color="#22c55e" />
                  Kode Referral (Klaim Extra Poin Bonus)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: KOST-122-OSCAR"
                  value={independentForm.referralCode || ''}
                  onChange={e => setIndependentForm(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f0fdf4' : 'rgba(34, 197, 94, 0.08)',
                    border: isLight ? '1px solid #86efac' : '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: isLight ? '#14532d' : '#86efac',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                />
                <span style={{ fontSize: '0.66rem', color: isLight ? '#15803d' : '#86efac', marginTop: '2px', display: 'block' }}>
                  🎁 Masukkan kode referral untuk klaim bonus +500 Poin. <em>(Hanya berlaku 1x per toko baru).</em>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => { setShowRegisterIndependentModal(false); setIndependentNotice(null); }}
                  className="btn btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '0.75rem' }}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 18px',
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)'
                  }}
                >
                  🚀 Pasang Sekarang & Aktifkan Toko
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Partner Concierge Order Modal */}
      <PartnerOrderModal
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        service={selectedService}
        user={currentUser}
        kost={{ kostName: kostName || 'KostKu Residence', kostUid: targetKostUid }}
      />

      {/* Smart Lock & Token Modal for PLN Token purchases */}
      <SmartLockAndTokenModal
        isOpen={showSmartLockModal}
        onClose={() => setShowSmartLockModal(false)}
        user={currentUser}
        roomNumber={currentUser?.kamar || '122'}
      />
    </div>
  );
}
