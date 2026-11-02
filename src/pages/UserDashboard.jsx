import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Send, 
  Wrench, 
  DollarSign, 
  Bed, 
  Receipt, 
  FileText, 
  CreditCard, 
  Sparkles, 
  Key, 
  PenTool, 
  Package, 
  Zap, 
  Droplets,
  ShieldCheck,
  Search,
  Home,
  RefreshCw,
  Building2,
  ArrowRight,
  Star,
  MessageCircle,
  Camera,
  X,
  Eye,
  Megaphone,
  ShoppingBag,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  apiGetComplaints, 
  apiCreateComplaint, 
  apiGetInvoices, 
  apiGetContract,
  apiGetUserProfile,
  apiGetMerchants,
  apiGetPartnerOrders,
  apiSubmitComplaintRating
} from '../services/api';
import { useTheme } from '../context/ThemeContext';

import PaymentGatewayModal from '../components/PaymentGatewayModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import SignaturePadModal from '../components/SignaturePadModal';
import SmartLockAndTokenModal from '../components/SmartLockAndTokenModal';
import PdamPaymentModal from '../components/PdamPaymentModal';
import PackageLockerCard from '../components/PackageLockerCard';
import InAppChatModal from '../components/InAppChatModal';
import PartnerOrderModal from '../components/PartnerOrderModal';
import CommunityBulletinBoard from '../components/CommunityBulletinBoard';
import PrelovedMarketplace from '../components/PrelovedMarketplace';
import GuestRegistrationModal from '../components/GuestRegistrationModal';
import SmartLockAndApplianceCard from '../components/SmartLockAndApplianceCard';

// ── MITRA GRID CARD (2-KOLOM MOBILE DENGAN CYCLING FOTO / LOGO NON-FNB) ──────────
const MitraGridCard = ({ item, idx, isMobileScreen, onSelect, hasOrderedBefore }) => {
  const { isLight } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -25px 0px'
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [item.id]);

  const cols = isMobileScreen ? 2 : 4;
  const colIndex = idx % cols;
  const delayMs = colIndex * 70;

  const isFnB = (item.category || '').toLowerCase().includes('makan') || 
                (item.category || '').toLowerCase().includes('kuliner') || 
                (item.category || '').toLowerCase().includes('warung') || 
                (item.name || '').toLowerCase().includes('warung') || 
                (item.name || '').toLowerCase().includes('makan') ||
                (item.name || '').toLowerCase().includes('bento') ||
                (item.name || '').toLowerCase().includes('roti') ||
                (item.name || '').toLowerCase().includes('martabak');

  const rawProds = item.products || [];

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

  const maxSoldAcross = Math.max(
    ...rawProds.map((p, pIdx) => getBaseSold(p, pIdx) + Number(dynamicSalesMap[p.id] || dynamicSalesMap[p.name] || 0)),
    0
  );

  const processedProds = rawProds.map((p, pIdx) => {
    const effectiveSold = getBaseSold(p, pIdx) + Number(dynamicSalesMap[p.id] || dynamicSalesMap[p.name] || 0);
    const isRealTopSeller = maxSoldAcross > 0 && effectiveSold === maxSoldAcross;
    const isStorePick = Boolean(p.isBestSeller) && !isRealTopSeller;
    return {
      ...p,
      effectiveSold,
      isRealTopSeller,
      isStorePick,
      isBestSeller: isRealTopSeller || Boolean(p.isBestSeller),
      bestSellerBadge: isRealTopSeller ? `Terlaris (${effectiveSold}x)` : isStorePick ? 'Rekomendasi Toko' : null
    };
  });

  // Urutkan: Terlaris riil paling depan, disusul rekomendasi toko, lalu harga termurah
  const sortedProds = [...processedProds].sort((a, b) => {
    if (a.isRealTopSeller && !b.isRealTopSeller) return -1;
    if (!a.isRealTopSeller && b.isRealTopSeller) return 1;
    if (a.isStorePick && !b.isStorePick) return -1;
    if (!a.isStorePick && b.isStorePick) return 1;
    return (a.price || 0) - (b.price || 0);
  });

  const cheapestProd = [...rawProds].sort((a, b) => (a.price || 0) - (b.price || 0))[0] || sortedProds[0];
  const bestSellerItem = sortedProds.find(p => p.isRealTopSeller) || sortedProds.find(p => p.isStorePick) || sortedProds[0];

  // Cycling foto melalui menu terlaris / best seller
  const cycleItems = sortedProds.filter(p => p.image).length > 0
    ? sortedProds.filter(p => p.image)
    : sortedProds;

  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    if (cycleItems.length <= 1) return;
    const interval = setInterval(() => {
      setCycleIdx(prev => (prev + 1) % cycleItems.length);
    }, 3200 + (idx % 3) * 600);
    return () => clearInterval(interval);
  }, [cycleItems.length, idx]);

  const activeItem = cycleItems[cycleIdx] || bestSellerItem || { name: item.name, price: cheapestProd?.price || 15000 };

  const isLaundry = (item.category || '').toLowerCase().includes('laundry') || 
                    (item.name || '').toLowerCase().includes('laundry') ||
                    (item.name || '').toLowerCase().includes('clean');

  const isGalon = (item.category || '').toLowerCase().includes('galon') || 
                  (item.name || '').toLowerCase().includes('galon') ||
                  (item.name || '').toLowerCase().includes('air') ||
                  (item.name || '').toLowerCase().includes('depot');

  const isGas = (item.category || '').toLowerCase().includes('gas') || 
                (item.name || '').toLowerCase().includes('gas') ||
                (item.name || '').toLowerCase().includes('lpg');

  const isMain = Boolean(item.isMainPartner || item.partnershipType === 'main');
  const isShared = Boolean(item.isShared || item.partnershipType === 'shared');
  const isIndependent = Boolean(item.isIndependent || item.partnershipType === 'independent');
  const isNewcomer = Boolean(item.isNewcomer || item.isNew || (item.createdAt && (Date.now() - new Date(item.createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000));

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(item)}
      style={{
        background: isLight 
          ? (isMain ? 'rgba(245, 158, 11, 0.08)' : '#ffffff') 
          : (isMain ? 'rgba(245, 158, 11, 0.035)' : 'rgba(255, 255, 255, 0.025)'),
        border: isMain 
          ? (isLight ? '1.5px solid #f59e0b' : '1.5px solid rgba(245, 158, 11, 0.4)') 
          : (isLight ? '1px solid #e2e8f0' : '1px solid var(--border-color)'),
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: `opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, border-color 0.2s ease, box-shadow 0.2s ease`,
        willChange: 'opacity, transform',
        boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = isMain ? '#f59e0b' : '#3b82f6';
        if (isVisible) e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = isLight 
          ? (isMain ? '0 10px 20px rgba(245, 158, 11, 0.18)' : '0 10px 20px rgba(0, 0, 0, 0.08)') 
          : (isMain ? '0 6px 16px rgba(245, 158, 11, 0.15)' : '0 6px 16px rgba(59, 130, 246, 0.12)');
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isMain 
          ? (isLight ? '#f59e0b' : 'rgba(245, 158, 11, 0.4)') 
          : (isLight ? '#e2e8f0' : 'var(--border-color)');
        if (isVisible) e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isLight ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none';
      }}
    >
      {/* ── PHOTO CONTAINER (FULL BLEED COVER / BRAND LOGO EMBLEM) ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: isMobileScreen ? '112px' : '140px',
        background: 'rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {activeItem?.image ? (
          /* Full-Bleed Photo (untuk FnB maupun Non-FnB jika ada foto produk/layanan) */
          <img
            key={activeItem.id || cycleIdx}
            src={activeItem.image}
            alt={activeItem.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              display: 'block'
            }}
            loading="lazy"
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = isFnB
                ? 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=300&auto=format&fit=crop&q=80';
            }}
          />
        ) : (
          /* Branded Cover jika mitra tidak menyediakan foto (hanya logo/ikon) */
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            background: isLaundry
              ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #0f172a 100%)'
              : isGalon
              ? 'linear-gradient(135deg, #082f49 0%, #0369a1 60%, #0c4a6e 100%)'
              : isGas
              ? 'linear-gradient(135deg, #451a03 0%, #7c2d12 60%, #1e1b4b 100%)'
              : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            position: 'relative'
          }}>
            <div style={{
              width: isMobileScreen ? '48px' : '54px',
              height: isMobileScreen ? '48px' : '54px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            }}>
              {item.logo ? (
                <img
                  src={item.logo}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: isMobileScreen ? '1.8rem' : '2.2rem', lineHeight: 1 }}>
                  {item.icon || (isLaundry ? '🧺' : isGalon ? '💧' : isGas ? '🔥' : '🏪')}
                </span>
              )}
            </div>

            <div style={{
              marginTop: '5px',
              fontSize: isMobileScreen ? '0.56rem' : '0.62rem',
              fontWeight: 700,
              color: isLaundry ? '#c084fc' : isGalon ? '#38bdf8' : isGas ? '#fb923c' : '#38bdf8',
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '1px 6px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span>{item.icon || (isLaundry ? '🧺' : isGalon ? '💧' : '🏪')}</span>
              <span>{isLaundry ? 'Laundry Kiloan' : isGalon ? 'Depot Galon' : isGas ? 'Gas Elpiji' : (item.category || 'Layanan Resmi')}</span>
            </div>
          </div>
        )}

        {/* Gradient overlay agar badge & teks kontras terbaca */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Top-Left: Badge Beli Lagi vs Terlaris & Rekomendasi */}
        <div style={{ position: 'absolute', top: '6px', left: '6px', zIndex: 2, display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap', maxWidth: '80%' }}>
          {hasOrderedBefore ? (
            /* Khusus kartu Beli Lagi: Langsung tampilkan ⚡ Beli Lagi saja */
            <span style={{
              fontSize: isMobileScreen ? '0.50rem' : '0.58rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)',
              color: '#ffffff',
              fontWeight: 800,
              boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
              lineHeight: 1.1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }} title="Kamu pernah memesan di mitra ini (Beli Lagi)">
              ⚡ Beli Lagi
            </span>
          ) : (
            /* Kartu Normal: Newcomer / Best Seller / Terlaris & Status Kamera Asli (hanya FnB) */
            <>
              {isNewcomer ? (
                <span style={{
                  fontSize: isMobileScreen ? '0.50rem' : '0.58rem',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  boxShadow: '0 2px 4px rgba(6, 182, 212, 0.4)',
                  lineHeight: 1.1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }} title="UMKM Baru di KostKu: Dapatkan bonus +150 Poin pada pesanan pertamamu!">
                  🆕 Baru (+150 Pts)
                </span>
              ) : activeItem.isRealTopSeller ? (
                <span style={{
                  fontSize: isMobileScreen ? '0.50rem' : '0.58rem',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                  lineHeight: 1.1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }} title={`Beneran Terlaris: Akumulasi ${activeItem.effectiveSold || activeItem.totalSold || 30}+ pesanan nyata`}>
                  🔥 Terlaris ({activeItem.effectiveSold || activeItem.totalSold || 30}x)
                </span>
              ) : activeItem.isStorePick ? (
                <span style={{
                  fontSize: isMobileScreen ? '0.50rem' : '0.58rem',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.90)',
                  color: '#0f172a',
                  fontWeight: 800,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  lineHeight: 1.1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }} title="Rekomendasi Toko: Dipilih langsung oleh pemilik toko/mitra">
                  ⭐ Rekomendasi
                </span>
              ) : (
                <span style={{
                  fontSize: isMobileScreen ? '0.48rem' : '0.56rem',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  color: '#f8fafc',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  lineHeight: 1.1
                }}>
                  {isFnB ? 'Menu Pilihan' : 'Layanan Resmi'}
                </span>
              )}

              {/* Sensor kamera HANYA untuk FnB (makanan), Non-FnB bebas dari warning */}
              {isFnB && (
                activeItem?.isCameraVerified ? (
                  <span style={{
                    fontSize: isMobileScreen ? '0.48rem' : '0.55rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    background: 'rgba(6, 78, 59, 0.90)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    fontWeight: 700,
                    backdropFilter: 'blur(4px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    lineHeight: 1.1
                  }} title="Foto Asli Kamera (Sensor Fingerprint Terverifikasi Bebas AI)">
                    📷 Kamera Asli
                  </span>
                ) : (
                  <span style={{
                    fontSize: isMobileScreen ? '0.48rem' : '0.55rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.25)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    fontWeight: 700,
                    backdropFilter: 'blur(4px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    lineHeight: 1.1
                  }} title="Foto Stock Internet / Olahan Digital (Belum Verifikasi Sensor Kamera Asli)">
                    ⚠️ Belum Asli
                  </span>
                )
              )}
            </>
          )}
        </div>

        {/* Top-Right: Partnership Badge (Utama / Bersama / Mandiri / Jaringan) */}
        {/* Khusus Beli Lagi: Jaringan dinonaktifkan sepenuhnya agar tidak memenuhi kartu */}
        {!hasOrderedBefore && (
          <div style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 2 }}>
            {isMain ? (
              <span style={{
                fontSize: isMobileScreen ? '0.48rem' : '0.56rem',
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.95)',
                color: '#0f172a',
                fontWeight: 900,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                lineHeight: 1
              }}>
                👑 Utama
              </span>
            ) : isShared ? (
              <span style={{
                fontSize: isMobileScreen ? '0.48rem' : '0.56rem',
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'rgba(34, 197, 94, 0.95)',
                color: '#0f172a',
                fontWeight: 900,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                lineHeight: 1
              }}>
                🤝 Bersama
              </span>
            ) : isIndependent ? (
              <span style={{
                fontSize: isMobileScreen ? '0.48rem' : '0.56rem',
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(14, 165, 233, 0.95) 100%)',
                color: '#ffffff',
                fontWeight: 900,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                lineHeight: 1
              }} title="UMKM Mandiri Sekitar Kost (Terbuka tanpa kontrak khusus pemilik kost)">
                🏪 Mandiri
              </span>
            ) : (
              <span style={{
                fontSize: isMobileScreen ? '0.48rem' : '0.56rem',
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.95)',
                color: '#0f172a',
                fontWeight: 900,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                lineHeight: 1
              }}>
                🌐 Jaringan
              </span>
            )}
          </div>
        )}

        {/* Bottom of Image: Nama Menu / Layanan yang Sedang Cycle + Dots Indicator (Hanya jika ada foto) */}
        {activeItem?.image && (
          <div style={{
            position: 'absolute',
            bottom: '5px',
            left: '6px',
            right: '6px',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '4px'
          }}>
            <div style={{
              fontSize: isMobileScreen ? '0.56rem' : '0.64rem',
              fontWeight: 700,
              color: '#ffffff',
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {activeItem.name}
            </div>

            {/* Cycling Indicator Dots */}
            {cycleItems.length > 1 && (
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                {cycleItems.slice(0, 4).map((_, dotIdx) => (
                  <div
                    key={dotIdx}
                    style={{
                      width: dotIdx === cycleIdx ? '8px' : '3px',
                      height: '3px',
                      borderRadius: '2px',
                      background: dotIdx === cycleIdx ? '#f59e0b' : 'rgba(255, 255, 255, 0.45)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CARD BODY (NAMA RESTO & HARGA MULAI DARI) ── */}
      <div style={{
        padding: isMobileScreen ? '7px 8px 9px' : '10px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        gap: '4px'
      }}>
        {/* Resto Header (Icon/Logo + Nama Resto) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
            <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{item.icon || '🏪'}</span>
            <div style={{
              fontSize: isMobileScreen ? '0.78rem' : '0.86rem',
              fontWeight: 800,
              color: isLight ? '#0f172a' : '#f8fafc',
              lineHeight: 1.15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {item.name || item.title}
            </div>
          </div>

          {/* Rating & Jarak */}
          <div style={{ fontSize: isMobileScreen ? '0.58rem' : '0.64rem', color: isLight ? '#64748b' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>⭐ 4.8</span>
            <span>•</span>
            <span>📍 {item.distanceKm || 0.2} km</span>
          </div>
        </div>

        {/* Harga Mulai Dari & Desktop Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '3px',
          paddingTop: '3px',
          borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div>
            <div style={{ fontSize: isMobileScreen ? '0.52rem' : '0.58rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1 }}>
              Mulai dari:
            </div>
            <div style={{
              fontSize: isMobileScreen ? '0.82rem' : '0.92rem',
              fontWeight: 900,
              color: isLight ? '#15803d' : '#4ade80',
              marginTop: '1px'
            }}>
              Rp {(cheapestProd?.price || 16000).toLocaleString('id-ID')}
            </div>
          </div>

          {/* Tombol Mulai Pilih: HANYA DI DESKTOP! (Kalo mobile tinggal klik kartu) */}
          {!isMobileScreen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item);
              }}
              className="btn btn-primary btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: '0.70rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              Mulai Pilih &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const UserDashboard = ({ user }) => {
  const { theme, isLight } = useTheme();
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener('kostku_user_updated', handleUserUpdate);
    return () => window.removeEventListener('kostku_user_updated', handleUserUpdate);
  }, []);
  const [activeApplication, setActiveApplication] = useState(null);
  const [kostName, setKostName] = useState('');
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [communitySectionTab, setCommunitySectionTab] = useState('bulletin'); // 'bulletin' | 'preloved'
  const [newComplaint, setNewComplaint] = useState('');
  const [complaintPhoto, setComplaintPhoto] = useState(null);
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const [selectedComplaintPhoto, setSelectedComplaintPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTransferInfo, setShowTransferInfo] = useState(false);
  const [contract, setContract] = useState(null);

  // Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSmartLockModal, setShowSmartLockModal] = useState(false);
  const [showPdamModal, setShowPdamModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showOwnerChat, setShowOwnerChat] = useState(false);
  const [merchants, setMerchants] = useState([]);
  const [partnerCategory, setPartnerCategory] = useState('all');
  const [partnerSort, setPartnerSort] = useState('cheapest'); // 'cheapest' (terendah), 'highest' (tertinggi), 'distance' (terdekat)
  const [pinMainPartner, setPinMainPartner] = useState(true); // Toggle ON/OFF Mitra Utama Selalu di Atas
  const [partnerBrand, setPartnerBrand] = useState('all');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [friendReferralInput, setFriendReferralInput] = useState('');
  const [friendReferralStatus, setFriendReferralStatus] = useState(null);

  // Crowdsourcing ("Usulkan Warung Langganan") & Open Independent Merchant Registration
  const [showSuggestMerchantModal, setShowSuggestMerchantModal] = useState(false);
  const [showRegisterIndependentModal, setShowRegisterIndependentModal] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ name: '', phone: '', address: '' });
  const [suggestNotice, setSuggestNotice] = useState(null);
  const [independentForm, setIndependentForm] = useState({
    name: '',
    category: 'makanan',
    phone: '',
    address: '',
    firstProductName: '',
    firstProductPrice: 15000
  });
  const [independentNotice, setIndependentNotice] = useState(null);
  const [independentMerchants, setIndependentMerchants] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('kostku_independent_merchants');
        return stored ? JSON.parse(stored) : [];
      }
    } catch (e) {}
    return [];
  });

  const handleSuggestSubmit = (e) => {
    e.preventDefault();
    if (!suggestForm.name.trim() || !suggestForm.phone.trim()) return;

    // Tambah 500 Poin Loyalty Reward ke akun penghuni
    try {
      const stored = localStorage.getItem('kostUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        const currentPts = Number(parsed.loyalty_points ?? 250);
        parsed.loyalty_points = currentPts + 500;
        localStorage.setItem('kostUser', JSON.stringify(parsed));
        setCurrentUser(parsed);
        window.dispatchEvent(new Event('kostUser_updated'));
      }
    } catch (err) {
      console.warn('Gagal menambah poin usulan warung:', err);
    }

    setSuggestNotice({
      type: 'success',
      message: `🎉 Usulan warung "${suggestForm.name}" berhasil dikirim! +500 Poin loyalty telah ditambahkan ke akun Anda.`
    });
  };

  const handleRegisterIndependentSubmit = (e) => {
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

    const newMerchant = {
      id: newMerchantId,
      name: independentForm.name.trim(),
      category: categoryLabel,
      icon: defaultIcon,
      rating: 5.0,
      soldCount: 0,
      deliveryEstimate: '15-25 mnt',
      deliveryFee: 2000,
      distance: '300m',
      phone: independentForm.phone.trim() || '6281234567890',
      address: independentForm.address.trim() || 'Sekitar Kost',
      isIndependent: true,
      partnershipType: 'independent',
      isNewcomer: true,
      isNew: true,
      createdAt: new Date().toISOString(),
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
      const stored = localStorage.getItem('kostku_independent_merchants');
      const parsed = stored ? JSON.parse(stored) : [];
      const updated = [newMerchant, ...parsed];
      localStorage.setItem('kostku_independent_merchants', JSON.stringify(updated));
      setIndependentMerchants(updated);
    } catch (err) {
      console.warn('Gagal menyimpan toko mandiri:', err);
    }

    setIndependentNotice({
      type: 'success',
      message: `🏪 Selamat! Toko "${newMerchant.name}" berhasil terpasang dan langsung aktif di katalog KostKu (Masa Inkubasi Baru).`
    });
  };

  // Repeat Orders ("Beli Lagi") State for Quick-Time Re-ordering
  const [orderedMerchantIds, setOrderedMerchantIds] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('kostku_ordered_merchants');
        const parsed = stored ? JSON.parse(stored) : [];
        // Default repeat order demo: Depot Barokah (PTR-DEF-01) & Warung Bu Siti (PTR-DEF-03)
        return new Set(['PTR-DEF-01', 'PTR-DEF-03', ...parsed]);
      }
    } catch (e) {}
    return new Set(['PTR-DEF-01', 'PTR-DEF-03']);
  });

  useEffect(() => {
    const handleOrderCreated = () => {
      try {
        const stored = localStorage.getItem('kostku_ordered_merchants');
        const parsed = stored ? JSON.parse(stored) : [];
        setOrderedMerchantIds(new Set(['PTR-DEF-01', 'PTR-DEF-03', ...parsed]));
      } catch (err) {
        console.error(err);
      }
    };
    window.addEventListener('kostku_partner_order_created', handleOrderCreated);
    return () => window.removeEventListener('kostku_partner_order_created', handleOrderCreated);
  }, []);

  useEffect(() => {
    const handleOpenPayment = () => setShowPaymentModal(true);
    window.addEventListener('kostku:open-payment', handleOpenPayment);
    return () => window.removeEventListener('kostku:open-payment', handleOpenPayment);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleUserUpdate = () => {
      try {
        const stored = localStorage.getItem('kostUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
        }
      } catch (e) {}
    };
    window.addEventListener('kostUser_updated', handleUserUpdate);
    return () => window.removeEventListener('kostUser_updated', handleUserUpdate);
  }, []);

  // Rating & Tip Modal States for Staff
  const [ratingModalComplaint, setRatingModalComplaint] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingBadges, setRatingBadges] = useState(['⚡ Sangat Cepat & Tanggap', '✨ Pengerjaan Rapi & Bersih']);
  const [ratingReview, setRatingReview] = useState('');
  const [tipAmount, setTipAmount] = useState(10000);
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    setSyncingProfile(true);
    try {
      let activeKostUid = currentUser?.kostUid || user?.kostUid;
      const activeUserId = user.id;

      // 1. Sync latest user profile and pending application from server
      try {
        const profileRes = await apiGetUserProfile(user.id);
        if (profileRes?.user) {
          const merged = { ...user, ...currentUser, ...profileRes.user };
          // If application is approved, auto-activate tenant dashboard immediately
          if (profileRes.activeApplication?.status === 'approved' && profileRes.activeApplication?.kamar) {
            merged.kostUid = profileRes.activeApplication.kostUid;
            merged.kamar = profileRes.activeApplication.kamar;
          }
          setCurrentUser(merged);
          activeKostUid = merged.kostUid;
          localStorage.setItem('kostUser', JSON.stringify(merged));
        }
        if (profileRes?.activeApplication) {
          setActiveApplication(profileRes.activeApplication);
        }
        if (profileRes?.kostName) {
          setKostName(profileRes.kostName);
        }
      } catch (err) {
        console.warn('apiGetUserProfile sync failed:', err);
      }

      // 2. Fetch tenant dashboard data if assigned to a kost
      if (activeKostUid) {
        const [comps, invs, ctc, merchList] = await Promise.all([
          apiGetComplaints(activeKostUid, activeUserId).catch(() => []),
          apiGetInvoices(activeKostUid, activeUserId).catch(() => []),
          apiGetContract(activeUserId).catch(() => ({ contract: null })),
          apiGetMerchants(activeKostUid).catch(() => [])
        ]);
        setComplaints(Array.isArray(comps) ? comps : []);
        setInvoices(Array.isArray(invs) ? invs : []);
        setContract(ctc?.contract || null);
        if (Array.isArray(merchList) && merchList.length > 0) {
          setMerchants(merchList);
        }
      } else {
        const merchList = await apiGetMerchants(currentUser?.kostUid || 'KOST-OJN64X').catch(() => []);
        if (Array.isArray(merchList) && merchList.length > 0) {
          setMerchants(merchList);
        }
      }

      // Sync user previous partner orders for "Beli Lagi" filter
      try {
        const pOrders = await apiGetPartnerOrders(activeUserId).catch(() => []);
        if (Array.isArray(pOrders) && pOrders.length > 0) {
          const serverMerchantIds = pOrders.map(o => o.merchantId || o.serviceId).filter(Boolean);
          if (serverMerchantIds.length > 0) {
            setOrderedMerchantIds(prev => new Set([...prev, ...serverMerchantIds]));
          }
        }
      } catch (e) {}
    } catch (err) {
      console.error('Failed to fetch tenant data', err);
    } finally {
      setSyncingProfile(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleComplaintPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCompressingPhoto(true);
      const compressed = await compressImage(file, 1200, 1200, 0.8);
      setComplaintPhoto(compressed);
    } catch (err) {
      alert('Gagal memproses foto: ' + (err.message || ''));
    } finally {
      setCompressingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComplaint.trim()) return;

    setLoading(true);
    try {
      await apiCreateComplaint({
        kostUid: currentUser.kostUid,
        userId: currentUser.id,
        userName: currentUser.name,
        kamar: currentUser.kamar,
        text: newComplaint,
        photo: complaintPhoto
      });
      setNewComplaint('');
      setComplaintPhoto(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal mengirim komplain');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(number || 0);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="badge badge-warning"><Clock size={12}/> Menunggu</span>;
      case 'diproses': return <span className="badge badge-primary"><Wrench size={12}/> Diproses</span>;
      case 'selesai': return <span className="badge badge-success"><CheckCircle size={12}/> Selesai</span>;
      default: return null;
    }
  };

  // Latest invoice
  const latestInvoice = invoices.length > 0 ? invoices[0] : null;
  const isInvoicePaid = latestInvoice?.status === 'lunas';

  const isAssigned = Boolean(currentUser?.kostUid && currentUser?.kamar);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* State A: Belum Punya Kamar & Ada Pengajuan Menunggu Persetujuan */}
      {!isAssigned && activeApplication && activeApplication.status === 'pending' && (
        <div className="card glass-panel" style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: '#eab308',
                color: '#000',
                padding: '0.85rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)'
              }}>
                <Clock size={28} />
              </div>
              <div>
                <span className="badge badge-warning" style={{ marginBottom: '0.35rem' }}>Status: Menunggu Persetujuan Pemilik</span>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Pengajuan Sewa Kamar Sedang Ditinjau</h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Halo <strong>{currentUser.name}</strong>, Anda telah memilih kamar dari fitur Cari Kost. Menunggu pemilik kost menyetujui pengajuan Anda.
                </p>
              </div>
            </div>

            <button 
              onClick={fetchData} 
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={syncingProfile ? 'animate-spin' : ''} /> Cek Status Terbaru
            </button>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kost Tujuan</span>
              <h4 style={{ margin: '0.2rem 0 0', color: 'var(--text-main)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} color="#38bdf8" /> {activeApplication.kostName || kostName || 'Kost Pilihan'}
              </h4>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kamar Pilihan</span>
              <h4 style={{ margin: '0.2rem 0 0', color: '#60a5fa', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bed size={16} color="#60a5fa" /> Kamar {activeApplication.kamar}
              </h4>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Durasi Sewa</span>
              <h4 style={{ margin: '0.2rem 0 0', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                {activeApplication.duration || 1} Bulan
              </h4>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tanggal Pengajuan</span>
              <h4 style={{ margin: '0.2rem 0 0', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                {new Date(activeApplication.date || Date.now()).toLocaleDateString('id-ID')}
              </h4>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(234, 179, 8, 0.08)', 
            border: '1px dashed rgba(234, 179, 8, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} color="#eab308" />
            <span>
              <strong>Otomatisasi:</strong> Saat pemilik kost menekan tombol "Terima", kamar akan langsung di-assign ke akun Anda, dan Anda dapat langsung membayar tagihan via QRIS/Transfer serta menandatangani kontrak secara digital.
            </span>
          </div>
        </div>
      )}

      {/* State B: Belum Punya Kamar & Belum Mengajukan (Atau Ditolak) */}
      {!isAssigned && (!activeApplication || activeApplication.status === 'rejected') && (
        <div className="card glass-panel" style={{
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa'
          }}>
            <Home size={36} />
          </div>

          <div style={{ maxWidth: '540px' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: 800 }}>Belum Memilih Kamar Kost</h2>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Halo <strong>{currentUser.name}</strong>! Anda belum terdaftar di kamar kost manapun. Silakan cari kost impian Anda di marketplace Cari Kost, pilih kamar yang tersedia, lalu ajukan sewa. Setelah pemilik menyetujui, akun Anda otomatis terhubung ke kamar kost tersebut.
            </p>
          </div>

          {activeApplication?.status === 'rejected' && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.25rem',
              color: '#f87171',
              fontSize: '0.85rem'
            }}>
              Pengajuan sewa kamar sebelumnya tidak dapat diterima atau telah ditolak oleh pemilik kost. Anda dapat memilih kost atau kamar lainnya.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link 
              to="/search" 
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <Search size={18} /> Cari & Pilih Kost Sekarang
            </Link>
            <button 
              onClick={fetchData} 
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} className={syncingProfile ? 'animate-spin' : ''} /> Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* State C: Penghuni Aktif (Sudah Di-Assign Kost & Kamar) */}
      {isAssigned && (
        <>
          {/* Welcome Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link 
                to="/pengaturan" 
                title="Buka Pengaturan & Ubah Foto Profil"
                style={{
                  display: 'block',
                  flexShrink: 0,
                  textDecoration: 'none'
                }}
              >
                {currentUser?.picture ? (
                  <img 
                    src={currentUser.picture} 
                    alt={currentUser.name} 
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2.5px solid var(--accent-primary)',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                  }}>
                    {(currentUser?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Halo, {currentUser.name} 👋</h1>
                  <span className="badge badge-primary">Penghuni Aktif</span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {kostName && <><strong style={{ color: 'var(--accent-primary)' }}>{kostName}</strong> • </>}Kamar: <strong style={{ color: 'var(--text-primary)' }}>{currentUser.kamar}</strong> • Cuci Sprei: <strong style={{ color: 'var(--accent-success)' }}>{currentUser.bedsheets || 0}x</strong> • Poin: <strong style={{ color: 'var(--accent-warning)' }}>{currentUser?.loyalty_points || 250} Poin</strong>
                </p>
              </div>
            </div>

            {/* Quick Service Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowSmartLockModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 12px', gap: '6px' }}
              >
                <Zap size={14} color="#fbbf24" /> Token Listrik PLN
              </button>

              <button
                onClick={() => setShowPdamModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 12px', gap: '6px' }}
              >
                <Droplets size={14} color="#38bdf8" /> Tagihan Air PDAM
              </button>

              <button
                onClick={() => setShowSignatureModal(true)}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 12px',
                  gap: '6px',
                  borderColor: contract?.signedAt ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'
                }}
              >
                <PenTool size={14} color={contract?.signedAt ? '#4ade80' : '#fbbf24'} />
                {contract?.signedAt ? '✓ Kontrak Tertandatangani' : '✍️ TTD Kontrak'}
              </button>

              {currentUser?.kostUid && (
                <Link
                  to={`/kost/${currentUser.kostUid}`}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 12px',
                    gap: '6px',
                    textDecoration: 'none',
                    borderColor: 'rgba(250, 204, 21, 0.4)'
                  }}
                  title="Beri rating dan ulasan untuk kost Anda"
                >
                  <Star size={14} color="#facc15" fill="#facc15" />
                  <span>Beri Rating Kost</span>
                </Link>
              )}

              <button
                onClick={() => setShowGuestModal(true)}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 12px',
                  gap: '6px',
                  borderColor: 'rgba(56, 189, 248, 0.45)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8'
                }}
                title="Daftarkan tamu menginap berizin (Overnight Pass)"
              >
                <Users size={14} />
                <span>👥 Izin Tamu Inap</span>
              </button>

              <button
                onClick={() => setShowOwnerChat(true)}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 12px',
                  gap: '6px',
                  borderColor: 'rgba(59, 130, 246, 0.45)',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#60a5fa'
                }}
                title="Chat langsung dengan pemilik kost tanpa keluar aplikasi"
              >
                <MessageCircle size={14} />
                <span>💬 Chat Pemilik</span>
              </button>
            </div>
          </div>

          {/* Approved Application Alert Banner if applicable */}
          {activeApplication?.status === 'approved' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <CheckCircle size={22} color="#4ade80" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#4ade80' }}>
                  Pengajuan Sewa Kamar Telah Disetujui!
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  Selamat, kamar <strong>{currentUser.kamar}</strong> di <strong>{kostName || 'KostKu'}</strong> telah berhasil dialokasikan untuk Anda. Tagihan sewa pertama sudah tersedia di bawah ini.
                </p>
              </div>
            </div>
          )}

          {/* Main Grid: Tagihan (Left) & Form Komplain (Right) */}
          <div className="grid-responsive-equal">
            
            {/* Tagihan Card */}
            <div className="card glass-panel" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderLeft: `4px solid ${isInvoicePaid ? 'var(--accent-success)' : 'var(--accent-warning)'}`
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Tagihan Sewa Kamar</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {latestInvoice ? `Tanggal: ${new Date(latestInvoice.date).toLocaleDateString('id-ID')}` : 'Belum ada tagihan'}
                    </span>
                  </div>
                  <span className={`badge ${isInvoicePaid ? 'badge-success' : 'badge-warning'}`}>
                    {isInvoicePaid ? 'LUNAS' : 'BELUM LUNAS'}
                  </span>
                </div>

                {latestInvoice ? (
                  <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Sewa Kamar ({latestInvoice.kamar})</span>
                      <span>{formatRupiah(latestInvoice.basePrice)}</span>
                    </div>
                    {Number(latestInvoice.deposit) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Deposit Kamar</span>
                        <span>{formatRupiah(latestInvoice.deposit)}</span>
                      </div>
                    )}
                    {Number(latestInvoice.waterCost) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Biaya Air</span>
                        <span>{formatRupiah(latestInvoice.waterCost)}</span>
                      </div>
                    )}
                    {Number(latestInvoice.lateFee) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#f87171' }}>
                        <span>Denda Keterlambatan ({latestInvoice.lateDays || 0} hari)</span>
                        <span style={{ fontWeight: 700 }}>+{formatRupiah(latestInvoice.lateFee)}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-color)',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      color: isInvoicePaid ? 'var(--accent-success)' : 'white'
                    }}>
                      <span>Total Tagihan</span>
                      <span>{formatRupiah(latestInvoice.total)}</span>
                    </div>

                    {latestInvoice.splitTerms && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 12px',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '10px',
                        fontSize: '0.78rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ color: '#38bdf8', fontWeight: 700 }}>⚡ Cicilan 2x (Split Payment Aktif):</span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            Termin {latestInvoice.splitTerms.term1.status === 'lunas' ? '2/2' : '1/2'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                          <span>Termin 1 (50%): {formatRupiah(latestInvoice.splitTerms.term1.amount)}</span>
                          <span style={{ color: latestInvoice.splitTerms.term1.status === 'lunas' ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                            {latestInvoice.splitTerms.term1.status === 'lunas' ? '✓ Lunas' : 'Belum Lunas'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginTop: '2px' }}>
                          <span>Termin 2 (50%): {formatRupiah(latestInvoice.splitTerms.term2.amount)}</span>
                          <span style={{ color: latestInvoice.splitTerms.term2.status === 'lunas' ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                            {latestInvoice.splitTerms.term2.status === 'lunas' ? '✓ Lunas' : `Jatuh Tempo: ${latestInvoice.splitTerms.term2.dueDate || '-'}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '1rem 0' }}>
                    Tidak ada tagihan tertunda untuk kamar Anda.
                  </p>
                )}
              </div>

              <div>
                {!isInvoicePaid && latestInvoice ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Instant Payment Gateway Button */}
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="btn btn-primary" 
                      style={{
                        width: '100%',
                        gap: '8px',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                        fontWeight: 800,
                        boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                      }}
                    >
                      <CreditCard size={16} /> Bayar Sekarang (QRIS & Virtual Account)
                    </button>

                    <button 
                      onClick={() => setShowTransferInfo(!showTransferInfo)}
                      className="btn btn-secondary" 
                      style={{ width: '100%', gap: '8px', justifyContent: 'center', fontSize: '0.8rem' }}
                    >
                      {showTransferInfo ? 'Sembunyikan Info Rekening' : 'Info Rekening Manual'}
                    </button>

                    {showTransferInfo && (
                      <div style={{
                        padding: '0.85rem',
                        background: 'rgba(15, 23, 42, 0.8)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.82rem'
                      }}>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#93c5fd' }}>Transfer ke Rekening Pemilik:</p>
                        <p style={{ margin: '0 0 2px 0' }}>• BCA: <strong>1234-5678-90</strong> (A.N Pemilik)</p>
                        <p style={{ margin: 0 }}>• Mandiri: <strong>987-654-321</strong></p>
                      </div>
                    )}
                  </div>
                ) : latestInvoice ? (
                  /* Receipt Button for paid invoice */
                  <button
                    onClick={() => {
                      setSelectedReceiptId(latestInvoice.id);
                      setShowReceiptModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      gap: '8px',
                      justifyContent: 'center',
                      background: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'rgba(34, 197, 94, 0.3)',
                      color: '#4ade80',
                      fontWeight: 700
                    }}
                  >
                    <Receipt size={16} /> Unduh / Lihat Kuitansi Resmi
                  </button>
                ) : null}
              </div>
            </div>

            {/* Buat Komplain Card */}
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Punya Keluhan atau Kerusakan?</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Laporkan masalah fasilitas kamar atau gangguan langsung ke pengelola kost beserta bukti foto.
                  </p>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.68rem', gap: '4px' }}>
                  <Camera size={11} /> Foto Bukti
                </span>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                <textarea 
                  value={newComplaint}
                  onChange={e => setNewComplaint(e.target.value)}
                  placeholder="Jelaskan kendala Anda... (Contoh: Lampu kamar mandi mati, kran wastafel bocor, AC kurang dingin)" 
                  className="input-field"
                  style={{ flex: 1, minHeight: '85px', resize: 'vertical' }}
                  required
                />

                {/* Photo Attachment / Camera Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {complaintPhoto ? (
                    <div style={{
                      position: 'relative',
                      display: 'inline-block',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid rgba(56, 189, 248, 0.5)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      background: '#0f172a'
                    }}>
                      <img 
                        src={complaintPhoto} 
                        alt="Foto Bukti Komplain" 
                        style={{ height: '75px', width: 'auto', display: 'block', objectFit: 'cover' }} 
                      />
                      <button
                        type="button"
                        onClick={() => setComplaintPhoto(null)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Hapus Foto"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: '1px dashed rgba(56, 189, 248, 0.4)',
                      background: 'rgba(56, 189, 248, 0.05)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#93c5fd',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}>
                      <Camera size={15} color="#38bdf8" />
                      <span>{compressingPhoto ? 'Mengompresi Gambar...' : '📸 Ambil Foto / Unggah Bukti Kerusakan'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleComplaintPhotoChange}
                        style={{ display: 'none' }}
                        disabled={compressingPhoto}
                      />
                    </label>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || compressingPhoto} 
                  className="btn btn-primary"
                  style={{ gap: '8px', marginTop: '4px' }}
                >
                  <Send size={15} /> {loading ? 'Mengirim...' : 'Kirim Laporan Keluhan'}
                </button>
              </form>
            </div>

          </div>

          {/* Titipan Paket Digital Locker Card */}
          <PackageLockerCard user={currentUser} isStaff={false} />

          {/* Smart Lock & Beban Alat Elektronik Kamar */}
          <SmartLockAndApplianceCard 
            user={currentUser} 
            kostUid={currentUser.kostUid} 
            roomNumber={currentUser.kamar} 
          />

          {/* Community & Living Hub: Mading Digital & Pasar Preloved */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '12px',
              width: 'fit-content',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setCommunitySectionTab('bulletin')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: communitySectionTab === 'bulletin' ? '#0284c7' : 'transparent',
                  color: communitySectionTab === 'bulletin' ? 'white' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <Megaphone size={16} /> Mading Digital Kost
              </button>
              <button
                type="button"
                onClick={() => setCommunitySectionTab('preloved')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: communitySectionTab === 'preloved' ? '#059669' : 'transparent',
                  color: communitySectionTab === 'preloved' ? 'white' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <ShoppingBag size={16} /> Pasar Preloved Anak Kost
              </button>
            </div>

            {communitySectionTab === 'bulletin' && (
              <CommunityBulletinBoard user={currentUser} kostUid={currentUser.kostUid} />
            )}

            {communitySectionTab === 'preloved' && (
              <PrelovedMarketplace user={currentUser} kostUid={currentUser.kostUid} />
            )}
          </div>

          {/* Riwayat Komplain Saya */}
          <div className="card glass-panel">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem' }}>Riwayat Keluhan Anda</h3>

            {complaints.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                Belum ada keluhan yang dilaporkan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {complaints.map(c => (
                  <div 
                    key={c.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1.15rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      gap: '10px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
                        {/* Before & After Photo Thumbnails */}
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {c.photo && (
                            <button
                              type="button"
                              onClick={() => setSelectedComplaintPhoto(c.photo)}
                              style={{
                                background: 'none',
                                border: '1.5px solid rgba(245, 158, 11, 0.4)',
                                borderRadius: '8px',
                                padding: 0,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                width: '48px',
                                height: '48px',
                                position: 'relative'
                              }}
                              title="Foto Keluhan (Before)"
                            >
                              <img src={c.photo} alt="Bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', fontSize: '0.55rem', color: '#fbbf24', textAlign: 'center', fontWeight: 700 }}>
                                BEFORE
                              </div>
                            </button>
                          )}

                          {c.resolvedPhoto && (
                            <button
                              type="button"
                              onClick={() => setSelectedComplaintPhoto(c.resolvedPhoto)}
                              style={{
                                background: 'none',
                                border: '1.5px solid rgba(16, 185, 129, 0.6)',
                                borderRadius: '8px',
                                padding: 0,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                width: '48px',
                                height: '48px',
                                position: 'relative'
                              }}
                              title="Foto Hasil Perbaikan (After)"
                            >
                              <img src={c.resolvedPhoto} alt="Hasil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(16, 185, 129, 0.85)', fontSize: '0.55rem', color: 'white', textAlign: 'center', fontWeight: 800 }}>
                                AFTER ✓
                              </div>
                            </button>
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{c.text}</h4>
                            {c.assignedStaffName && (
                              <span style={{
                                fontSize: '0.7rem',
                                color: '#93c5fd',
                                background: 'rgba(59, 130, 246, 0.15)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <Wrench size={10} color="#60a5fa" />
                                Teknisi: {c.assignedStaffName}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            Dilaporkan: {new Date(c.date).toLocaleDateString('id-ID')}
                            {c.resolvedAt && ` • Selesai: ${new Date(c.resolvedAt).toLocaleDateString('id-ID')}`}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getStatusBadge(c.status)}

                        {/* Tombol Beri Rating untuk Teknisi */}
                        {c.status === 'selesai' && !c.ratingData && (
                          <button
                            type="button"
                            onClick={() => {
                              setRatingModalComplaint(c);
                              setRatingStars(5);
                              setRatingBadges(['⚡ Sangat Cepat & Tanggap', '✨ Pengerjaan Rapi & Bersih']);
                              setRatingReview('');
                              setTipAmount(10000);
                            }}
                            className="btn btn-warning btn-sm"
                            style={{
                              gap: '4px',
                              fontSize: '0.74rem',
                              padding: '4px 10px',
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: 'black',
                              fontWeight: 700,
                              border: 'none',
                              borderRadius: '8px'
                            }}
                          >
                            <Star size={12} fill="black" /> Beri Rating & Tip
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ulasan & Rating yang sudah diberikan */}
                    {c.ratingData && (
                      <div style={{
                        marginTop: '4px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700 }}>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[1, 2, 3, 4, 5].map(st => (
                                <Star key={st} size={12} fill={st <= (c.ratingData.rating || 5) ? '#fbbf24' : 'none'} color="#fbbf24" />
                              ))}
                            </div>
                            <span>{c.ratingData.rating}.0 • Ulasan Anda</span>
                          </div>
                          {c.ratingData.tipAmount > 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              💸 Tip Diberikan: Rp {Number(c.ratingData.tipAmount).toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                        {c.ratingData.badges?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {c.ratingData.badges.map((b, i) => (
                              <span key={i} style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#f8fafc' }}>
                                {b}
                              </span>
                            ))}
                          </div>
                        )}
                        {c.ratingData.review && (
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                            "{c.ratingData.review}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lightbox Modal for Complaint Photo */}
          {selectedComplaintPhoto && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.9)',
              backdropFilter: 'blur(8px)',
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}>
              <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                <button
                  type="button"
                  onClick={() => setSelectedComplaintPhoto(null)}
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: 0,
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
                <img 
                  src={selectedComplaintPhoto} 
                  alt="Bukti Kerusakan Penuh" 
                  style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }} 
                />
              </div>
            </div>
          )}

          {/* Direktori Layanan Sekitar Kost (Sleek High-Density Layout) */}
          <div id="partner-services-section" className="card glass-panel" style={{ border: '1px solid rgba(59, 130, 246, 0.25)', padding: isMobileScreen ? '10px 12px' : '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: isMobileScreen ? '0.95rem' : '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#60a5fa" /> Layanan Toko & Mitra Sekitar Kost
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Bebas pilih toko langganan & bandingkan harga • Antar langsung ke pintu kamar
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '999px', background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                  💳 Non-Tunai / Tagihan
                </span>
                <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.12)', color: '#93c5fd', fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  🏷️ Fee Max Rp 500
                </span>
              </div>
            </div>

            {/* PROGRAM REFERRAL & POIN ANAK KOST (SLIM & HIGH-DENSITY - SESUAI ARAHAN MBAK RENA) */}
            {(() => {
              const currentLoyaltyPoints = Number(currentUser?.loyalty_points ?? 250);
              const userRefCode = currentUser?.referralCode || `KOST-${(currentUser?.kamar || '101').replace(/\s+/g, '')}-${(currentUser?.name || 'ANAKKOST').split(' ')[0].toUpperCase()}`;
              const activeFriendCode = currentUser?.claimedFriendReferral || currentUser?.lastUsedReferral || (typeof window !== 'undefined' ? localStorage.getItem('kostku_last_referral_code') : null);

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
                setFriendReferralInput('');
                setFriendReferralStatus({ type: 'success', message: '🎉 +100 Poin referral tersimpan otomatis!' });
                setTimeout(() => setFriendReferralStatus(null), 3000);
              };

              return (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '10px',
                  padding: '7px 10px',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: isMobileScreen ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: isMobileScreen ? 'stretch' : 'center',
                  gap: '6px'
                }}>
                  {/* Left: Saldo Poin & Info Otomatis */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '0.95rem' }}>🪙</span>
                      <div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24' }}>
                          {currentLoyaltyPoints.toLocaleString('id-ID')} Poin
                        </span>
                        <span style={{ fontSize: '0.64rem', color: '#94a3b8', marginLeft: '3px' }}>
                          (Rp {currentLoyaltyPoints.toLocaleString('id-ID')})
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
                      • Referral: Teman <strong style={{ color: '#4ade80' }}>+100</strong>, Kamu <strong style={{ color: '#38bdf8' }}>+100</strong>
                    </div>

                    {activeFriendCode && (
                      <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', fontWeight: 700 }}>
                        ✓ Kode Terhubung: {activeFriendCode} (Otomatis Aktif)
                      </span>
                    )}
                  </div>

                  {/* Right: Salin Kode Kamu, Input Kode Teman, & Tukar Token */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px dashed rgba(245, 158, 11, 0.4)',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: '#f8fafc'
                    }}>
                      <span style={{ marginRight: '5px' }}>{userRefCode}</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        style={{
                          background: referralCopied ? '#10b981' : '#f59e0b',
                          color: '#0f172a',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {referralCopied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>

                    {!activeFriendCode && (
                      <div style={{ display: 'inline-flex', gap: '3px' }}>
                        <input
                          type="text"
                          value={friendReferralInput}
                          onChange={e => setFriendReferralInput(e.target.value)}
                          placeholder="Kode teman?"
                          style={{
                            width: '80px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            fontSize: '0.64rem',
                            color: '#fff'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleClaimFriendCode}
                          disabled={!friendReferralInput.trim()}
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          +100
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowSmartLockModal(true)}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '6px',
                        padding: '2px 7px',
                        fontSize: '0.64rem',
                        color: '#fbbf24',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Token PLN
                    </button>
                  </div>

                  {friendReferralStatus && (
                    <div style={{ fontSize: '0.62rem', color: friendReferralStatus.type === 'success' ? '#4ade80' : '#f87171', width: '100%', marginTop: '1px' }}>
                      {friendReferralStatus.message}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Filter Kategori, Sortir & Pencarian */}
            {(() => {
              const defaultUserMerchants = [
                {
                  id: 'PTR-BDG-01-DEF',
                  icon: '🍱',
                  logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop&q=80',
                  name: 'Warung Makan Bu Siti Dago',
                  category: 'makanan',
                  distanceKm: 0.08,
                  isMainPartner: true,
                  partnershipType: 'main',
                  originKostName: 'Kost Anda',
                  commissionOwner: 1000,
                  products: [
                    { id: 'p1', name: 'Es Teh Manis Jumbo Segar', brand: 'Minuman', price: 5000, desc: 'Penyegar tenggorokan hemat', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&auto=format&fit=crop&q=80', totalSold: 54 },
                    { id: 'p2', name: 'Nasi Goreng Spesial Telur Ceplok', brand: 'Makanan', price: 16000, desc: 'Porsi kenyang + telur mata sapi & kerupuk', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&auto=format&fit=crop&q=80', totalSold: 78 },
                    { id: 'p3', name: 'Paket Ayam Geprek Sambal Korek + Nasi', brand: 'Makanan', price: 20000, desc: 'Ayam renyah krispi pedas level 1-5', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&auto=format&fit=crop&q=80', totalSold: 136, isBestSeller: true }
                  ]
                },
                {
                  id: 'PTR-SHARED-03-DEF',
                  icon: '🥞',
                  logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&auto=format&fit=crop&q=80',
                  name: 'Martabak & Roti Bakar Bangka 99',
                  category: 'makanan',
                  distanceKm: 0.45,
                  isShared: true,
                  partnershipType: 'shared',
                  originKostName: 'Jaringan Bersama Multi-Kost',
                  commissionOwner: 1000,
                  products: [
                    { id: 'm1', name: 'Roti Bakar Coklat Susu Crispy', brand: 'Roti Bakar', price: 14000, desc: 'Roti bakar empuk selai coklat lumer', image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&auto=format&fit=crop&q=80', totalSold: 42 },
                    { id: 'm2', name: 'Martabak Telur Daging Sapi Gurih', brand: 'Martabak', price: 32000, desc: 'Isi daging sapi cincang gurih', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=300&auto=format&fit=crop&q=80', totalSold: 89 },
                    { id: 'm3', name: 'Martabak Manis Spesial Keju Wisman', brand: 'Martabak', price: 38000, desc: 'Mentega wisman wangi legit keju tebal', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80', totalSold: 154, isBestSeller: true }
                  ]
                },
                {
                  id: 'PTR-DEF-01',
                  icon: '💧',
                  logo: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100&auto=format&fit=crop&q=80',
                  name: 'Depot Air & Gas Barokah',
                  category: 'galon',
                  distanceKm: 0.15,
                  isMainPartner: true,
                  partnershipType: 'main',
                  originKostName: 'Kost Anda',
                  commissionOwner: 1000,
                  products: [
                    { id: 'P-GLN-03', name: 'Air Galon Vit 19L', brand: 'Vit', price: 16000, desc: 'Paling hemat & higienis', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80', totalSold: 98 },
                    { id: 'P-GLN-01', name: 'Air Galon Aqua 19L', brand: 'Aqua', price: 19000, desc: 'Air mineral alami pegunungan', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&auto=format&fit=crop&q=80', totalSold: 218, isBestSeller: true },
                    { id: 'P-GLN-02', name: 'Air Galon Le Minerale 19L', brand: 'Le Minerale', price: 21000, desc: 'Galon sekali pakai higienis', image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=300&auto=format&fit=crop&q=80', totalSold: 114 },
                    { id: 'P-GAS-01', name: 'Gas LPG 3kg Melon', brand: 'Pertamina', price: 23000, desc: 'Tabung gas segel resmi SNI', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300&auto=format&fit=crop&q=80', totalSold: 76 }
                  ]
                },
                {
                  id: 'PTR-DEF-02',
                  icon: '🧺',
                  logo: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=100&auto=format&fit=crop&q=80',
                  name: 'Melati Express Laundry Kiloan',
                  category: 'laundry',
                  distanceKm: 0.35,
                  isMainPartner: true,
                  partnershipType: 'main',
                  originKostName: 'Kost Anda',
                  commissionOwner: 1000,
                  products: [
                    { id: 'P-LND-01', name: 'Cuci + Setrika Reguler (2 Hari)', brand: 'Reguler', price: 8000, desc: 'Harga per kg, wangi rapi', image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=300&auto=format&fit=crop&q=80', totalSold: 85 },
                    { id: 'P-LND-02', name: 'Cuci Komplit Kilat Express (1 Hari)', brand: 'Express', price: 15000, desc: 'Harga per kg, selesai 24 jam', image: 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?w=300&auto=format&fit=crop&q=80', totalSold: 192, isBestSeller: true },
                    { id: 'P-LND-03', name: 'Cuci Sprei & Selimut Tebal', brand: 'Bedding', price: 25000, desc: 'Per set sprei + sarung bantal', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300&auto=format&fit=crop&q=80', totalSold: 38 }
                  ]
                },
                {
                  id: 'PTR-EXT-05-DEF',
                  icon: '🍱',
                  logo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&auto=format&fit=crop&q=80',
                  name: 'Katering Sehat Bento Kampus Bu Dian',
                  category: 'makanan',
                  distanceKm: 1.10,
                  isMainPartner: false,
                  partnershipType: 'network',
                  originKostName: 'Binaan Kost Sekitar (Kost B)',
                  commissionOwner: 1000,
                  products: [
                    { id: 'b1', name: 'Bento Box Chicken Teriyaki + Salad', brand: 'Bento', price: 22000, desc: 'Ayam teriyaki gurih manis + nasi jepang', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&auto=format&fit=crop&q=80', totalSold: 112, isBestSeller: true },
                    { id: 'b2', name: 'Paket Nasi Rawon Daging Komplit Telur Asin', brand: 'Tradisional', price: 28000, desc: 'Kuah kluwek gurih daging empuk', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80', totalSold: 64 },
                    { id: 'b3', name: 'Paket Premium Sirloin Steak Rice Bowl', brand: 'Premium', price: 42000, desc: 'Daging sapi sirloin empuk saus lada hitam', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80', totalSold: 46 }
                  ]
                },
                {
                  id: 'PTR-INDEP-01',
                  icon: '🧃',
                  logo: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=100&auto=format&fit=crop&q=80',
                  name: 'Juice Bar & Camilan Mas Dimas',
                  category: 'makanan',
                  distanceKm: 0.12,
                  isIndependent: true,
                  isNewcomer: true,
                  partnershipType: 'independent',
                  originKostName: 'UMKM Mandiri Sekitar Kost',
                  commissionOwner: 0,
                  products: [
                    { id: 'j1', name: 'Jus Alpukat Kocok Gula Aren', brand: 'Minuman', price: 12000, desc: 'Alpukat mentega kental + susu coklat', image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300&auto=format&fit=crop&q=80', totalSold: 18, isBestSeller: true },
                    { id: 'j2', name: 'Pisang Crispy Keju Coklat Lumer', brand: 'Camilan', price: 10000, desc: 'Porsi ngemil kenyang hemat', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300&auto=format&fit=crop&q=80', totalSold: 12 }
                  ]
                }
              ];

              const baseMerged = merchants.length > 0
                ? [...merchants, ...defaultUserMerchants.filter(d => d.isIndependent && !merchants.some(m => m.id === d.id))]
                : defaultUserMerchants;
              const rawList = [...baseMerged, ...independentMerchants.filter(im => !baseMerged.some(bm => bm.id === im.id))];

              // Filter by category
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

              // Filter by brand
              if (partnerBrand !== 'all') {
                list = list.filter(m => {
                  return (m.products || []).some(p => 
                    (p.brand || '').toLowerCase() === partnerBrand.toLowerCase() ||
                    p.name.toLowerCase().includes(partnerBrand.toLowerCase())
                  );
                });
              }

              // Filter by search query
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

              // Sort list: Prioritaskan Mitra Utama di Atas (bisa di-toggle on/off) + Kriteria (Termurah / Tertinggi / Terdekat)
              list.sort((a, b) => {
                // 1. Jika pinMainPartner AKTIF (ON), Mitra Utama Kost selalu diprioritaskan di atas
                if (pinMainPartner) {
                  const isMainA = Boolean(a.isMainPartner || a.partnershipType === 'main');
                  const isMainB = Boolean(b.isMainPartner || b.partnershipType === 'main');
                  if (isMainA && !isMainB) return -1;
                  if (!isMainA && isMainB) return 1;
                }

                // 2. Kriteria Sorting: Uang Terendah / Uang Tertinggi / Terdekat
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

              // 3. Guaranteed Exploration Slot: Selipkan UMKM Baru di slot 2 (baris teratas) agar mendapat impresi adil
              if (partnerCategory !== 'beli_lagi' && list.length > 2) {
                const newcomerIdx = list.findIndex(m => Boolean(m.isNewcomer || m.isNew));
                if (newcomerIdx > 1) {
                  const [newcomer] = list.splice(newcomerIdx, 1);
                  list.splice(1, 0, newcomer); // Selipkan di slot 2 (baris pertama)
                }
              }

              return (
                <div>
                  {/* Search Bar: Kolom Pencarian Toko & Menu */}
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
                      <Search size={15} />
                    </div>
                    <input
                      type="text"
                      value={partnerSearch}
                      onChange={e => setPartnerSearch(e.target.value)}
                      placeholder="Cari toko, menu makanan, galon, laundry..."
                      className="input-field"
                      style={{
                        width: '100%',
                        paddingLeft: '32px',
                        paddingRight: partnerSearch ? '30px' : '10px',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                        fontSize: '0.82rem',
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
                          right: '8px',
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
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Banner Crowdsourcing Warung Langganan & Open Registration Toko Mandiri */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isLight 
                      ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' 
                      : 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)',
                    border: isLight ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: isMobileScreen ? '7px 9px' : '8px 12px',
                    marginBottom: '10px',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
                      <span style={{ fontSize: '1.05rem' }}>💡</span>
                      <div style={{ fontSize: '0.67rem', color: isLight ? '#334155' : '#cbd5e1', lineHeight: 1.25 }}>
                        <strong style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>Punya usaha atau warung langganan?</strong> UMKM sekitar bebas jualan tanpa wajib kontrak kost!
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        type="button"
                        onClick={() => { setShowSuggestMerchantModal(true); setSuggestNotice(null); }}
                        style={{
                          background: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(56, 189, 248, 0.15)',
                          border: isLight ? '1px solid #0284c7' : '1px solid #38bdf8',
                          color: isLight ? '#0284c7' : '#38bdf8',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        + Usulkan Warung (+500 Pts)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowRegisterIndependentModal(true); setIndependentNotice(null); }}
                        style={{
                          background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          boxShadow: '0 2px 4px rgba(14, 165, 233, 0.3)'
                        }}
                      >
                        🏪 Pasang Toko Mandiri
                      </button>
                    </div>
                  </div>

                  {/* Controls Bar: Category Tabs & Sort/Pin Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
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
                                    ? '1px solid rgba(56, 189, 248, 0.35)' 
                                    : (isLight ? '1px solid #cbd5e1' : '1px solid var(--border-color)')),
                              color: isSelected ? '#ffffff' : (isBeliLagi ? (isLight ? '#7e22ce' : '#d8b4fe') : isMandiri ? (isLight ? '#0284c7' : '#7dd3fc') : (isLight ? '#334155' : '#cbd5e1')),
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Filter Controls: Toggle Pin Mitra Utama & Sortir Uang Terendah / Tertinggi / Terdekat */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {/* Toggle Switch On/Off: Mitra Utama di Atas */}
                      <button
                        type="button"
                        onClick={() => setPinMainPartner(prev => !prev)}
                        title="Klik untuk menyalakan/mematikan prioritas mitra utama di posisi teratas"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: pinMainPartner 
                            ? (isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.18)') 
                            : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)'),
                          border: pinMainPartner ? '1.5px solid #f59e0b' : (isLight ? '1px solid #cbd5e1' : '1px solid var(--border-color)'),
                          color: pinMainPartner ? (isLight ? '#b45309' : '#fbbf24') : (isLight ? '#64748b' : '#94a3b8'),
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>👑 Utama:</span>
                        <span style={{
                          fontSize: '0.6rem',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: pinMainPartner ? '#f59e0b' : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'),
                          color: pinMainPartner ? '#000' : (isLight ? '#475569' : '#94a3b8'),
                          fontWeight: 900
                        }}>
                          {pinMainPartner ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      {/* Sorting Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', padding: '2px 5px', borderRadius: '6px', border: isLight ? '1px solid #cbd5e1' : '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.64rem', color: isLight ? '#64748b' : '#94a3b8', marginRight: '2px' }}>Urut:</span>
                        <button
                          type="button"
                          onClick={() => setPartnerSort('cheapest')}
                          style={{
                            background: partnerSort === 'cheapest' ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                            color: partnerSort === 'cheapest' ? (isLight ? '#15803d' : '#4ade80') : (isLight ? '#64748b' : '#94a3b8'),
                            border: partnerSort === 'cheapest' ? '1px solid #22c55e' : 'none',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🏷️ Termurah
                        </button>
                        <button
                          type="button"
                          onClick={() => setPartnerSort('highest')}
                          style={{
                            background: partnerSort === 'highest' ? 'rgba(236, 72, 153, 0.25)' : 'transparent',
                            color: partnerSort === 'highest' ? (isLight ? '#be185d' : '#f472b6') : (isLight ? '#64748b' : '#94a3b8'),
                            border: partnerSort === 'highest' ? '1px solid #ec4899' : 'none',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          💎 Tertinggi
                        </button>
                        <button
                          type="button"
                          onClick={() => setPartnerSort('distance')}
                          style={{
                            background: partnerSort === 'distance' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                            color: partnerSort === 'distance' ? (isLight ? '#1d4ed8' : '#60a5fa') : (isLight ? '#64748b' : '#94a3b8'),
                            border: partnerSort === 'distance' ? '1px solid #3b82f6' : 'none',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          📍 Terdekat
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Brand Selector Pills (Khusus Galon jika kategori galon aktif) */}
                  {partnerCategory === 'galon' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.66rem', color: isLight ? '#475569' : '#94a3b8', fontWeight: 600 }}>Merek Galon:</span>
                      {[
                        { id: 'all', label: 'Semua Merek' },
                        { id: 'Vit', label: 'Vit (Rp 16rb - Hemat)' },
                        { id: 'Aqua', label: 'Aqua (Rp 19rb)' },
                        { id: 'Le Minerale', label: 'Le Minerale (Rp 21rb)' }
                      ].map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setPartnerBrand(b.id)}
                          style={{
                            background: partnerBrand === b.id 
                              ? (isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.2)') 
                              : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)'),
                            border: partnerBrand === b.id 
                              ? (isLight ? '1px solid #0284c7' : '1px solid #38bdf8') 
                              : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.07)'),
                            color: partnerBrand === b.id ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#64748b' : '#94a3b8'),
                            borderRadius: '999px',
                            padding: '1px 7px',
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Grid Cards */}
                  {list.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.25rem', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)', borderRadius: '12px', border: isLight ? '1px dashed #cbd5e1' : '1px dashed var(--border-color)' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                        {partnerCategory === 'beli_lagi'
                          ? '⚡ Belum ada toko yang pernah kamu beli. Pesan galon, laundry, atau makanan sekali untuk fitur re-order kilat (quick-time click)!'
                          : 'Tidak ditemukan mitra atau affiliate yang cocok dengan filter ini.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => { setPartnerCategory('all'); setPartnerBrand('all'); setPartnerSearch(''); }}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '6px', fontSize: '0.7rem' }}
                      >
                        Reset Filter
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobileScreen ? 'repeat(2, 1fr)' : 'repeat(4, minmax(0, 1fr))',
                      gap: isMobileScreen ? '8px' : '12px'
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
              );
            })()}
          </div>
        </>
      )}

      {/* Modals */}
      {latestInvoice && (
        <PaymentGatewayModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          invoice={latestInvoice}
          user={currentUser}
          onPaymentSuccess={() => {
            fetchData();
          }}
          onOpenReceipt={(invId) => {
            setSelectedReceiptId(invId);
            setShowReceiptModal(true);
          }}
        />
      )}

      {selectedReceiptId && (
        <DigitalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          invoiceId={selectedReceiptId}
        />
      )}

      <SignaturePadModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        user={currentUser}
        existingContract={contract}
        onSignedSuccess={(c) => {
          setContract(c);
          fetchData();
        }}
      />

      <SmartLockAndTokenModal
        isOpen={showSmartLockModal}
        onClose={() => setShowSmartLockModal(false)}
        user={currentUser}
        roomNumber={currentUser?.kamar || '122'}
      />

      <PdamPaymentModal
        isOpen={showPdamModal}
        onClose={() => setShowPdamModal(false)}
        user={currentUser}
        roomNumber={currentUser?.kamar || '122'}
      />

      {/* IN-APP DIRECT CHAT WITH OWNER (0% FAKE WA SPAM) */}
      <InAppChatModal
        isOpen={showOwnerChat}
        onClose={() => setShowOwnerChat(false)}
        kost={{ uid: currentUser?.kostUid || user?.kostUid, kostName: kostName || 'Pengelola Kost' }}
        roomNumber={currentUser?.kamar || user?.kamar}
        user={currentUser || user}
      />

      {/* MODAL BERI RATING & TIPS SUKARELA UNTUK STAF TEKNISI */}
      {ratingModalComplaint && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(5, 10, 20, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : '#090e1a',
            border: isLight ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '20px',
            padding: '1.5rem',
            maxWidth: '480px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: isLight ? '0 25px 50px -12px rgba(15, 23, 42, 0.25)' : '0 25px 60px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={18} fill="#fbbf24" color="#fbbf24" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: isLight ? '#0f172a' : 'white' }}>Nilai Layanan Teknisi</h3>
                </div>
                <span style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : 'var(--text-secondary)' }}>
                  {ratingModalComplaint.assignedStaffName || 'Teknisi Lapangan'} • Kamar {ratingModalComplaint.kamar}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setRatingModalComplaint(null)}
                style={{ background: 'none', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!ratingModalComplaint) return;
              setSubmittingRating(true);
              try {
                await apiSubmitComplaintRating(ratingModalComplaint.id, {
                  rating: ratingStars,
                  badges: ratingBadges,
                  review: ratingReview,
                  tipAmount,
                  tipPaymentMethod: tipAmount > 0 ? 'QRIS / Saldo Dompet' : 'Tanpa Tip',
                  tenantName: currentUser.name || user.name || 'Anak Kost',
                  tenantId: currentUser.id || user.id,
                  staffId: ratingModalComplaint.assignedStaffId || ratingModalComplaint.resolvedByStaffId
                });
                setRatingModalComplaint(null);
                fetchData();
                alert('⭐ Terima kasih! Penilaian dan apresiasi Anda berhasil dikirim ke staf.');
              } catch (err) {
                alert(err.message || 'Gagal mengirim rating');
              } finally {
                setSubmittingRating(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Star Rating Selector */}
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <span style={{ display: 'block', fontSize: '0.82rem', color: isLight ? '#64748b' : 'var(--text-secondary)', marginBottom: '8px' }}>
                  Berapa bintang kepuasan Anda terhadap hasil perbaikan?
                </span>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transform: star <= ratingStars ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <Star
                        size={32}
                        fill={star <= ratingStars ? '#fbbf24' : 'none'}
                        color={star <= ratingStars ? '#fbbf24' : (isLight ? '#cbd5e1' : '#64748b')}
                      />
                    </button>
                  ))}
                </div>
                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.9rem', fontWeight: 800, color: isLight ? '#d97706' : '#fbbf24' }}>
                  {ratingStars === 5 ? '⭐⭐⭐⭐⭐ Luar Biasa & Sangat Memuaskan!' :
                   ratingStars === 4 ? '⭐⭐⭐⭐ Sangat Bagus' :
                   ratingStars === 3 ? '⭐⭐⭐ Cukup Baik' :
                   ratingStars === 2 ? '⭐⭐ Kurang Memuaskan' : '⭐ Perlu Ditingkatkan'}
                </span>
              </div>

              {/* Praise Badges */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isLight ? '#0f172a' : '#e2e8f0', marginBottom: '8px' }}>
                  Pilih Lencana Pujian untuk Staf:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    '⚡ Sangat Cepat & Tanggap',
                    '✨ Pengerjaan Rapi & Bersih',
                    '🤝 Ramah, Sopan & Santun',
                    '🔧 Ahli, Teliti & Tuntas'
                  ].map((badge) => {
                    const isSelected = ratingBadges.includes(badge);
                    return (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => {
                          setRatingBadges(prev => 
                            isSelected ? prev.filter(b => b !== badge) : [...prev, badge]
                          );
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #f59e0b' : (isLight ? '1px solid #cbd5e1' : '1px solid var(--border-color)'),
                          background: isSelected 
                            ? (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)') 
                            : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'),
                          color: isSelected ? (isLight ? '#92400e' : '#fde68a') : (isLight ? '#475569' : 'var(--text-secondary)'),
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s'
                        }}
                      >
                        {badge}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isLight ? '#0f172a' : '#e2e8f0', marginBottom: '6px' }}>
                  Tulis Ulasan / Testimoni Singkat:
                </label>
                <textarea
                  rows="3"
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                  placeholder="Contoh: Pak Joko datang cepat, perbaikan keran tidak sampai 15 menit dan area dipel bersih. Mantap!"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                />
              </div>

              {/* Tip Sukarela (Apresiasi Finansial untuk Staf) */}
              <div style={{
                background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.05)',
                border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#15803d' : '#6ee7b7' }}>
                    💸 Tip Sukarela untuk Teknisi (Opsional):
                  </label>
                  <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8' }}>100% diterima staf</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {[
                    { label: 'Tanpa Tip', val: 0 },
                    { label: 'Rp 5.000', val: 5000 },
                    { label: 'Rp 10.000', val: 10000 },
                    { label: 'Rp 20.000', val: 20000 },
                    { label: 'Rp 50.000', val: 50000 }
                  ].map(tp => (
                    <button
                      key={tp.val}
                      type="button"
                      onClick={() => setTipAmount(tp.val)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: tipAmount === tp.val ? '1.5px solid #10b981' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
                        background: tipAmount === tp.val 
                          ? (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.25)') 
                          : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)'),
                        color: tipAmount === tp.val ? (isLight ? '#15803d' : '#34d399') : (isLight ? '#475569' : 'var(--text-secondary)'),
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {tp.label}
                    </button>
                  ))}
                </div>

                {tipAmount > 0 && (
                  <div style={{
                    background: isLight ? '#ffffff' : 'rgba(0,0,0,0.3)',
                    border: isLight ? '1px dashed #86efac' : '1px dashed rgba(16, 185, 129, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.74rem', color: isLight ? '#475569' : '#e2e8f0' }}>Metode Pembayaran Tip:</span>
                    <strong style={{ fontSize: '0.78rem', color: isLight ? '#15803d' : '#34d399' }}>QRIS / Dompet Digital</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setRatingModalComplaint(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="btn btn-warning"
                  style={{
                    padding: '8px 20px',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'black',
                    fontWeight: 700,
                    border: 'none'
                  }}
                >
                  {submittingRating ? <RefreshCw size={14} className="animate-spin" /> : <Star size={14} fill="black" />}
                  {submittingRating ? 'Mengirim...' : 'Kirim Penilaian & Apresiasi'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: USULKAN WARUNG LANGGANAN (CROWDSOURCING +500 PTS) ── */}
      {showSuggestMerchantModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
            border: isLight ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '20px',
            boxShadow: isLight ? '0 20px 40px rgba(15, 23, 42, 0.15)' : '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.1)',
            position: 'relative'
          }}>
            <button
              onClick={() => { setShowSuggestMerchantModal(false); setSuggestNotice(null); }}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                border: 'none',
                color: isLight ? '#475569' : '#94a3b8',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                🍜
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Usulkan Warung Langganan
                </h3>
                <span style={{ fontSize: '0.72rem', color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 700 }}>
                  Dapatkan Bonus +500 Loyalty Points
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.45, marginBottom: '14px' }}>
              Punya warung makan, laundry, atau langganan favorit di sekitar kost? Beritahu kami agar bisa dihubungi dan dimasukkan ke katalog KostKu!
            </p>

            {suggestNotice && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '14px',
                fontSize: '0.75rem',
                color: isLight ? '#15803d' : '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✨</span>
                <div>{suggestNotice.message}</div>
              </div>
            )}

            <form onSubmit={handleSuggestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Warung / Usaha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Nasi Goreng Mas Budi"
                  value={suggestForm.name}
                  onChange={e => setSuggestForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Nomor WhatsApp Pemilik / Kontak Warung *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={suggestForm.phone}
                  onChange={e => setSuggestForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Patokan Lokasi / Alamat (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Depan gapura gang 2, 100m dari kost"
                  value={suggestForm.address}
                  onChange={e => setSuggestForm(prev => ({ ...prev, address: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setShowSuggestMerchantModal(false); setSuggestNotice(null); }}
                  className="btn btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '0.75rem' }}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 16px',
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.35)'
                  }}
                >
                  🎁 Kirim Usulan & Klaim +500 Poin
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: PASANG TOKO MANDIRI TANPA KONTRAK KOST ── */}
      {showRegisterIndependentModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
            border: isLight ? '1px solid rgba(14, 165, 233, 0.35)' : '1px solid rgba(14, 165, 233, 0.35)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '20px',
            boxShadow: isLight ? '0 20px 40px rgba(15, 23, 42, 0.15)' : '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(14, 165, 233, 0.15)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => { setShowRegisterIndependentModal(false); setIndependentNotice(null); }}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                border: 'none',
                color: isLight ? '#475569' : '#94a3b8',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                🏪
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Pasang Toko Mandiri (Bebas Kontrak)
                </h3>
                <span style={{ fontSize: '0.72rem', color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 700 }}>
                  Terbuka untuk UMKM Sekitar & Penghuni Kost
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.45, marginBottom: '14px' }}>
              UMKM sekitar bebas jualan langsung ke ribuan penghuni tanpa harus terikat kontrak kemitraan resmi pemilik kost. Toko baru otomatis mendapat <strong>Slot Inkubasi Khusus</strong> agar langsung terlihat pembeli!
            </p>

            {independentNotice && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '14px',
                fontSize: '0.75rem',
                color: isLight ? '#15803d' : '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✅</span>
                <div>{independentNotice.message}</div>
              </div>
            )}

            <form onSubmit={handleRegisterIndependentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Toko / Usaha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Juice Bar Bu Dewi"
                  value={independentForm.name}
                  onChange={e => setIndependentForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
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
                      padding: '8px 12px',
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
                  <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
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
                      padding: '8px 12px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
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
                    padding: '8px 12px',
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

      {/* Guest Registration Modal */}
      <GuestRegistrationModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        user={currentUser}
        kostUid={currentUser?.kostUid}
      />

      {/* Partner Concierge Order Modal */}
      <PartnerOrderModal
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        service={selectedService}
        user={currentUser}
        kost={{ kostName: kostName || 'KostKu Residence', kostUid: currentUser?.kostUid }}
      />

    </div>
  );
};

export default UserDashboard;
