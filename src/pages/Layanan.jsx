import React, { useState, useEffect, useRef } from 'react';
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
import { apiGetMerchants, apiGetPartnerOrders, apiClaimFriendReferral } from '../services/api';
import MitraGridCard from '../components/MitraGridCard';
import PartnerOrderModal from '../components/PartnerOrderModal';

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
    return user || null;
  });

  const kostName = localStorage.getItem('kostName') || '';
  const targetKostUid = currentUser?.kostUid || user?.kostUid || '';
  const activeUserId = currentUser?.id || user?.id || '';

  // Data States
  const [merchants, setMerchants] = useState([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);

  // Search, Categories & Sorting
  const [partnerCategory, setPartnerCategory] = useState(() => {
    try {
      const qCat = new URLSearchParams(window.location.search).get('category');
      if (['all', 'beli_lagi', 'mandiri', 'makanan', 'galon', 'laundry', 'gas'].includes(qCat)) {
        return qCat;
      }
    } catch (_) {}
    return 'all';
  });
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

  // Clean neutral referral code generator that NEVER uses user name or room number
  const getCleanRefCode = (u) => {
    let existing = u?.referralCode;
    if (existing && !existing.includes('OSCAR') && !existing.includes('122') && !existing.includes('ANAKKOST') && existing.startsWith('KOSTKU-')) {
      return existing;
    }
    const uid = String(u?.id || 'usr-1');
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = ((hash << 5) - hash) + uid.charCodeAt(i);
      hash |= 0;
    }
    const codeNum = Math.abs(hash % 9000) + 1000;
    const cleanCode = `KOSTKU-${codeNum}`;
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('kostUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.referralCode !== cleanCode) {
            parsed.referralCode = cleanCode;
            localStorage.setItem('kostUser', JSON.stringify(parsed));
          }
        }
      }
    } catch (_) {}
    return cleanCode;
  };

  const userRefCode = getCleanRefCode(currentUser);

  // Account-level loyalty points: follows tenant across room changes
  const getAccountPoints = (u) => {
    const uid = u?.id || 'usr-1';
    let p1 = null;
    let p2 = null;
    try {
      p1 = localStorage.getItem(`kostku_user_loyalty_points_${uid}`);
      p2 = localStorage.getItem('kostku_user_loyalty_points');
    } catch (_) {}
    const candidateList = [
      p1 !== null && !isNaN(Number(p1)) ? Number(p1) : -1,
      p2 !== null && !isNaN(Number(p2)) ? Number(p2) : -1,
      u?.loyalty_points !== undefined && !isNaN(Number(u.loyalty_points)) ? Number(u.loyalty_points) : -1
    ];
    const maxPts = Math.max(...candidateList, 250);
    return maxPts;
  };

  const currentLoyaltyPoints = getAccountPoints(currentUser);

  const saveAccountPoints = (newTotal) => {
    const pts = Number(newTotal);
    const uid = currentUser?.id || 'usr-1';
    try {
      localStorage.setItem(`kostku_user_loyalty_points_${uid}`, String(pts));
      localStorage.setItem('kostku_user_loyalty_points', String(pts));
      const stored = localStorage.getItem('kostUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.loyalty_points = pts;
        parsed.referralCode = userRefCode;
        localStorage.setItem('kostUser', JSON.stringify(parsed));
      }
    } catch (_) {}
    const updated = {
      ...currentUser,
      loyalty_points: pts,
      referralCode: userRefCode
    };
    setCurrentUser(updated);
    window.dispatchEvent(new CustomEvent('kostku_user_updated', { detail: updated }));
    window.dispatchEvent(new Event('kostUser_updated'));
    return updated;
  };

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

  const handleClaimFriendCode = async () => {
    if (!friendReferralInput.trim()) return;
    const cleanInput = friendReferralInput.trim().toUpperCase();
    if (cleanInput === userRefCode.toUpperCase()) {
      setFriendReferralStatus({ type: 'error', message: 'Tidak bisa pakai kodemu sendiri!' });
      return;
    }
    const uid = user?.id || user?.uid;
    if (!uid) {
      setFriendReferralStatus({ type: 'error', message: 'Login dulu untuk mengklaim kode referral teman.' });
      return;
    }
    try {
      const res = await apiClaimFriendReferral({
        userId: uid,
        referralCode: cleanInput,
        phone: user?.phone || user?.whatsapp || '',
        email: user?.email || ''
      });
      const updatedTotal = res?.totalPoints !== undefined ? Number(res.totalPoints) : currentLoyaltyPoints + (res?.bonusPoints || 100);
      saveAccountPoints(updatedTotal);
      setFriendReferralInput('');
      setFriendReferralStatus({
        type: 'success',
        message: res?.message || `+${res?.bonusPoints || 100} Poin referral tersimpan otomatis!`
      });
      setTimeout(() => setFriendReferralStatus(null), 4000);
    } catch (err) {
      setFriendReferralStatus({
        type: 'error',
        message: err?.message || 'Kode referral tidak valid atau sudah pernah diklaim.'
      });
    }
  };

  // Base list of merchants without any mock demo data (kosong untuk persiapan mitra resmi)
  const isDemoMerchant = (m) => {
    if (!m) return true;
    if (m.isDemo) return true;
    if (m.ownerUserId && !m.isDemo) return false; // Authentic registered merchant from DB
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
  const baseMerged = realMerchants.filter(Boolean);
  const rawList = [...baseMerged, ...independentMerchants.filter(im => im && !baseMerged.some(bm => bm.id === im.id) && !isDemoMerchant(im))];

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

  // Sorting: Kasir Online di Web tampil di atas, diikuti offline di bawah
  list.sort((a, b) => {
    const onlineA = a.kasirOnline === true || a.isOnline === true ? 1 : 0;
    const onlineB = b.kasirOnline === true || b.isOnline === true ? 1 : 0;
    if (onlineB !== onlineA) return onlineB - onlineA;

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

  // Guaranteed Exploration Slot (hanya geser jika toko online agar offline tetap di bawah)
  if (partnerCategory !== 'beli_lagi' && list.length > 2) {
    const newcomerIdx = list.findIndex(m => Boolean(m.isNewcomer || m.isNew) && (m.kasirOnline === true || m.isOnline === true));
    if (newcomerIdx > 1) {
      const [newcomer] = list.splice(newcomerIdx, 1);
      list.splice(1, 0, newcomer);
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '1280px',
      margin: '0 auto',
      padding: isMobileScreen ? '0.75rem 0.75rem 5rem' : '1.25rem 1.5rem 3rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* Header Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{
          margin: 0,
          fontSize: isMobileScreen ? '1.2rem' : '1.45rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          color: 'var(--text-primary)'
        }}>
          <Sparkles size={22} color="#60a5fa" /> Layanan Toko & Mitra Sekitar Kost
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Kamar: <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.kamar || '122'}</strong> • {kostName}
        </span>
      </div>

      {/* Search Bar - Langsung Di Bawah Judul */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          color: '#94a3b8',
          pointerEvents: 'none'
        }}>
          <Search size={18} />
        </div>
        <input
          type="text"
          value={partnerSearch}
          onChange={e => setPartnerSearch(e.target.value)}
          placeholder="Cari toko, menu makanan, galon, laundry..."
          className="input-field"
          style={{
            width: '100%',
            paddingLeft: '38px',
            paddingRight: partnerSearch ? '36px' : '14px',
            paddingTop: '10px',
            paddingBottom: '10px',
            fontSize: '0.9rem',
            borderRadius: '10px',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
            color: isLight ? '#0f172a' : '#f8fafc',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
        />
        {partnerSearch && (
          <button
            type="button"
            onClick={() => setPartnerSearch('')}
            style={{
              position: 'absolute',
              right: '12px',
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
            <X size={16} />
          </button>
        )}
      </div>

      {/* Baris Di Bawah Search: Poin & Referral di Kiri, Nambah Mitra di Kanan */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        flexWrap: 'wrap',
        padding: isMobileScreen ? '12px' : '14px 18px',
        borderRadius: '12px',
        background: isLight ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.03)',
        border: isLight ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(245, 158, 11, 0.15)'
      }}>
        {/* SISI KIRI:
            1. Total Poin
            2. Kode Referral di bawah poin
            3. Form masukkan referral di bawahnya lagi
        */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flex: '1 1 360px',
          minWidth: 0
        }}>
          {/* Baris 1: Total Poin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Sparkles size={18} color="#f59e0b" />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#b45309' : '#fbbf24' }}>
              {currentLoyaltyPoints} Poin
            </span>
            <span style={{ fontSize: '0.85rem', color: isLight ? '#78350f' : '#fef3c7', fontWeight: 600 }}>
              (Rp {currentLoyaltyPoints.toLocaleString('id-ID')})
            </span>
          </div>

          {/* Baris 2: Masukkan Referral */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 600 }}>
              Masukkan Referral:
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                placeholder="Kode Teman"
                value={friendReferralInput}
                onChange={e => setFriendReferralInput(e.target.value)}
                style={{
                  width: '120px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.18)',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  textTransform: 'uppercase',
                  fontWeight: 700
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
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: friendReferralInput.trim() ? 'pointer' : 'default',
                  opacity: friendReferralInput.trim() ? 1 : 0.6,
                  transition: 'all 0.2s'
                }}
              >
                Save
              </button>
            </div>
          </div>

          {friendReferralStatus && (
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: friendReferralStatus.type === 'success' ? '#4ade80' : '#f87171',
              marginTop: '2px'
            }}>
              {friendReferralStatus.message}
            </div>
          )}
        </div>

        {/* SISI KANAN (Setara Poin di Kanan, di Bawah Search): Dialihkan ke Halaman Kasir */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          alignSelf: isMobileScreen ? 'stretch' : 'center'
        }}>
          <Link
            to="/kasir?tab=mitra"
            className="btn btn-primary"
            data-testid="layanan-open-kasir-btn"
            style={{
              padding: '9px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              cursor: 'pointer',
              flex: isMobileScreen ? '1 1 auto' : 'initial',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
          >
            <Store size={15} />
            <span>Buka Kasir POS &amp; Gabung Mitra</span>
          </Link>
          <Link
            to="/utilitas?tab=pln"
            style={{
              background: 'none',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              padding: '9px 12px',
              fontSize: '0.82rem',
              color: '#fbbf24',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
          >
            <Zap size={14} /> Token PLN
          </Link>
        </div>
      </div>

      {/* Main Content Area - Full Width Borderless */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>

        {/* Controls Bar: Category Tabs & Sort/Pin Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {/* Category Selector */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'beli_lagi', label: 'Beli Lagi' },
              { id: 'mandiri', label: 'Mandiri' },
              { id: 'makanan', label: 'Warung' },
              { id: 'galon', label: 'Galon' },
              { id: 'laundry', label: 'Laundry' },
              { id: 'gas', label: 'Gas' }
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
              Utama: {pinMainPartner ? 'ON' : 'OFF'}
            </button>

            <span style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b' }}>Urut:</span>
            {[
              { id: 'cheapest', label: 'Termurah' },
              { id: 'highest', label: 'Tertinggi' },
              { id: 'distance', label: 'Terdekat' }
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', color: '#38bdf8' }}><Store size={42} /></div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
              {rawList.length === 0 
                ? 'Mitra Belum Ada' 
                : partnerCategory === 'beli_lagi' 
                ? 'Belum Ada Riwayat Pesanan' 
                : 'Tidak Ditemukan Mitra yang Cocok'}
            </h3>
            <p style={{ margin: '0 auto 16px', fontSize: '0.86rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.6, maxWidth: '440px' }}>
              {rawList.length === 0
                ? 'Mitra belum ada. Ajak warung sekitar mendaftar memakai kode referral Anda — +500 Poin cair setelah warung resmi terdaftar.'
                : partnerCategory === 'beli_lagi'
                ? 'Belum ada toko yang pernah kamu beli. Pesan galon, laundry, atau makanan sekali untuk fitur re-order kilat!'
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
                  <span>Anti-Abuse Referral: 0 Poin instan, +500 Poin cair saat mitra baru resmi mendaftar</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    to="/kasir?tab=mitra"
                    className="btn btn-primary"
                    data-testid="layanan-empty-open-kasir-btn"
                    style={{ fontSize: '0.82rem', padding: '9px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', textDecoration: 'none' }}
                  >
                    <Plus size={16} /> Buka Kasir POS &amp; Gabung Mitra
                  </Link>
                  <Link
                    to="/kasir?tab=mitra&section=suggest"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', textDecoration: 'none' }}
                  >
                    <Store size={15} /> Usulkan Warung via Referral
                  </Link>
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

      {/* Partner Concierge Order Modal */}
      <PartnerOrderModal
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        service={selectedService}
        user={currentUser}
        kost={{ kostName: kostName || 'KostKu Residence', kostUid: targetKostUid }}
      />
    </div>
  );
}
