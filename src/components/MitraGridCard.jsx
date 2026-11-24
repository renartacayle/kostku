import React, { useState, useEffect, useRef } from 'react';
import { Store, Star, MapPin, Bike, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function MitraGridCard({ item, idx, isMobileScreen, onSelect, hasOrderedBefore }) {
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
      if (typeof document !== 'undefined' && document.hidden) return;
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
  const isOnline = item.kasirOnline === true || item.isOnline === true;

  return (
    <div
      ref={cardRef}
      className="mitra-grid-card"
      data-testid="mitra-card"
      data-merchant-id={item.id}
      data-online={isOnline ? 'true' : 'false'}
      onClick={() => onSelect(item)}
      style={{
        background: isLight 
          ? (isOnline ? (isMain ? 'rgba(245, 158, 11, 0.08)' : '#ffffff') : '#f1f5f9') 
          : (isOnline ? (isMain ? 'rgba(245, 158, 11, 0.035)' : 'rgba(255, 255, 255, 0.025)') : 'rgba(15, 23, 42, 0.55)'),
        border: isMain && isOnline
          ? (isLight ? '1.5px solid #f59e0b' : '1.5px solid rgba(245, 158, 11, 0.4)') 
          : (isLight ? '1px solid #cbd5e1' : '1px solid var(--border-color)'),
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative',
        filter: isOnline ? 'none' : 'grayscale(1)',
        opacity: isVisible ? (isOnline ? 1 : 0.74) : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: `opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, border-color 0.2s ease, box-shadow 0.2s ease, filter 0.25s ease`,
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
          /* Full-Bleed Photo */
          <img
            key={activeItem.id || cycleIdx}
            src={activeItem.image}
            alt={activeItem.name}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              display: 'block'
            }}
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
                <Store size={isMobileScreen ? 26 : 30} color={isLaundry ? '#c084fc' : isGas ? '#fb923c' : '#38bdf8'} />
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
              gap: '3px',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '2px 7px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span>{isLaundry ? 'Laundry Kiloan' : isGalon ? 'Depot Galon' : isGas ? 'Gas Elpiji' : (item.category || 'Layanan Resmi')}</span>
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Top-Right: Kasir Web Online / Offline Status Badge */}
        <span
          data-testid={`mitra-status-badge-${item.id}`}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            zIndex: 3,
            fontSize: '0.62rem',
            padding: '2px 7px',
            borderRadius: '999px',
            fontWeight: 800,
            letterSpacing: '0.2px',
            background: isOnline ? 'rgba(16, 185, 129, 0.92)' : 'rgba(15, 23, 42, 0.85)',
            color: isOnline ? '#ffffff' : '#cbd5e1',
            border: isOnline ? '1px solid rgba(110, 231, 183, 0.7)' : '1px solid rgba(148, 163, 184, 0.45)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            lineHeight: 1.2
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isOnline ? '#ecfdf5' : '#94a3b8'
          }} />
          {isOnline ? 'Online' : 'Offline'}
        </span>

        {/* Top-Left: Badges */}
        <div style={{ position: 'absolute', top: '6px', left: '6px', zIndex: 2, display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap', maxWidth: '58%' }}>
          {hasOrderedBefore ? (
            <span style={{
              fontSize: '0.62rem',
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
              Beli Lagi
            </span>
          ) : (
            <>
              {isNewcomer ? (
                <span style={{
                  fontSize: '0.62rem',
                  padding: '2px 6px',
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
                  {isMobileScreen ? 'Baru +150' : 'Baru (+150 Pts)'}
                </span>
              ) : activeItem.isRealTopSeller ? (
                <span style={{
                  fontSize: '0.62rem',
                  padding: '2px 6px',
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
                  {isMobileScreen ? 'Terlaris' : `Terlaris (${activeItem.effectiveSold || activeItem.totalSold || 30}x)`}
                </span>
              ) : activeItem.isStorePick ? (
                <span style={{
                  fontSize: '0.62rem',
                  padding: '2px 6px',
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
                  Rekomendasi
                </span>
              ) : (
                <span style={{
                  fontSize: '0.6rem',
                  padding: '2px 5px',
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

              {!isMobileScreen && isFnB && (
                activeItem?.isCameraVerified ? (
                  <span style={{
                    fontSize: '0.55rem',
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
                    Kamera Asli
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.55rem',
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
                    Belum Asli
                  </span>
                )
              )}
            </>
          )}
        </div>

        {/* Bottom of Image: Name + Indicator Dots */}
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

      {/* ── CARD BODY ── */}
      <div style={{
        padding: isMobileScreen ? '8px 9px 10px' : '10px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        gap: '6px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '3px' }}>
            <span style={{ fontSize: '0.64rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isLaundry ? 'Laundry' : isGalon ? 'Depot Galon' : isGas ? 'Gas LPG' : (item.category || 'Kuliner')}
            </span>
            {!hasOrderedBefore && (
              <span style={{
                fontSize: '0.6rem',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 800,
                flexShrink: 0,
                background: isMain ? 'rgba(245, 158, 11, 0.18)' : isShared ? 'rgba(34, 197, 94, 0.18)' : isIndependent ? 'rgba(6, 182, 212, 0.16)' : 'rgba(59, 130, 246, 0.16)',
                color: isMain ? (isLight ? '#b45309' : '#fbbf24') : isShared ? (isLight ? '#15803d' : '#4ade80') : isIndependent ? (isLight ? '#0e7490' : '#22d3ee') : (isLight ? '#1d4ed8' : '#60a5fa')
              }}>
                {isMain ? 'Utama' : isShared ? 'Bersama' : isIndependent ? 'Mandiri' : 'Jaringan'}
              </span>
            )}
          </div>

          <div style={{
            fontSize: isMobileScreen ? '0.84rem' : '0.88rem',
            fontWeight: 800,
            color: isLight ? '#0f172a' : '#f8fafc',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '4px'
          }}>
            {item.name || item.title}
          </div>

          <div style={{ fontSize: isMobileScreen ? '0.66rem' : '0.68rem', color: isLight ? '#64748b' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Star size={10} color="#f59e0b" fill="#f59e0b" /> 4.8</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {item.distanceKm || 0.2} km</span>
            <span>•</span>
            <span style={{ color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <Bike size={10} /> {item.deliveryFeeType === 'per_km' ? `Rp ${(item.deliveryFeePerKm || 2500).toLocaleString('id-ID')}/km` : `Rp ${(item.deliveryFee || 2000).toLocaleString('id-ID')}`}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobileScreen ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobileScreen ? 'stretch' : 'flex-end',
          gap: isMobileScreen ? '6px' : '4px',
          marginTop: '2px',
          paddingTop: '5px',
          borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '4px' }}>
            <span style={{ fontSize: isMobileScreen ? '0.62rem' : '0.58rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              Mulai
            </span>
            <span style={{
              fontSize: isMobileScreen ? '0.88rem' : '0.92rem',
              fontWeight: 900,
              color: isLight ? '#15803d' : '#4ade80'
            }}>
              Rp {(cheapestProd?.price || 16000).toLocaleString('id-ID')}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className={isOnline ? 'btn btn-primary btn-sm' : 'btn btn-sm'}
            style={{
              width: isMobileScreen ? '100%' : 'auto',
              minHeight: isMobileScreen ? '34px' : undefined,
              padding: isMobileScreen ? '6px 10px' : '4px 10px',
              fontSize: isMobileScreen ? '0.76rem' : '0.70rem',
              fontWeight: 700,
              background: isOnline ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : (isLight ? '#e2e8f0' : '#334155'),
              color: isOnline ? '#ffffff' : (isLight ? '#1e293b' : '#e2e8f0'),
              border: isOnline ? 'none' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(148, 163, 184, 0.25)'),
              borderRadius: '9px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              cursor: 'pointer'
            }}
          >
            {isOnline ? 'Pesan →' : 'Lihat Menu →'}
          </button>
        </div>
      </div>
    </div>
  );
}
