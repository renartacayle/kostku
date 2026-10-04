import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  Wifi, 
  BedDouble, 
  ChevronDown, 
  Search, 
  CheckCircle2,
  Lock,
  ArrowDown,
  Star
} from 'lucide-react';

const TOTAL_FRAMES = 60;

// Helper to calculate smooth opacity curve between min and max progress with enter/exit ramps
const getChapterOpacity = (p, start, enter, exit, end) => {
  if (p < start || p > end) return 0;
  if (p < enter) return (p - start) / (enter - start);
  if (p <= exit) return 1;
  return 1 - (p - exit) / (end - exit);
};

export default function VideoScroll() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const displayedFrameRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const lastTimeRef = useRef(0);

  // Direct DOM references to eliminate React re-render thrashing on scroll
  const ch1Ref = useRef(null);
  const ch2Ref = useRef(null);
  const ch3Ref = useRef(null);
  const ch4Ref = useRef(null);
  const dimRef = useRef(null);
  const scrollIndicatorRef = useRef(null);

  const [isLoaded, setIsLoaded] = useState(false);

  // Smooth scroll to listing helper
  const scrollToListing = () => {
    const el = document.getElementById('listing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Direct DOM style updates for chapters (0% React re-render during scroll)
  const updateChapters = (p) => {
    const o1 = getChapterOpacity(p, 0.0, 0.0, 0.20, 0.27);
    const o2 = getChapterOpacity(p, 0.27, 0.33, 0.49, 0.55);
    const o3 = getChapterOpacity(p, 0.55, 0.61, 0.76, 0.82);
    const o4 = p >= 0.82 ? Math.min(1, (p - 0.82) / 0.08) : 0;
    const dim = p > 0.70 ? Math.min(0.92, (p - 0.70) / 0.28) : 0;

    if (ch1Ref.current) {
      ch1Ref.current.style.opacity = o1;
      ch1Ref.current.style.transform = `translate3d(0, ${(1 - o1) * 20}px, 0)`;
      ch1Ref.current.style.pointerEvents = o1 > 0.4 ? 'auto' : 'none';
      ch1Ref.current.setAttribute('aria-hidden', o1 < 0.1);
    }
    if (ch2Ref.current) {
      ch2Ref.current.style.opacity = o2;
      ch2Ref.current.style.transform = `translate3d(0, ${(1 - o2) * 20}px, 0)`;
      ch2Ref.current.style.pointerEvents = o2 > 0.4 ? 'auto' : 'none';
      ch2Ref.current.setAttribute('aria-hidden', o2 < 0.1);
    }
    if (ch3Ref.current) {
      ch3Ref.current.style.opacity = o3;
      ch3Ref.current.style.transform = `translate3d(0, ${(1 - o3) * 20}px, 0)`;
      ch3Ref.current.style.pointerEvents = o3 > 0.4 ? 'auto' : 'none';
      ch3Ref.current.setAttribute('aria-hidden', o3 < 0.1);
    }
    if (ch4Ref.current) {
      ch4Ref.current.style.opacity = o4;
      ch4Ref.current.style.transform = `translate3d(0, ${(1 - o4) * 20}px, 0)`;
      ch4Ref.current.style.pointerEvents = o4 > 0.4 ? 'auto' : 'none';
      ch4Ref.current.setAttribute('aria-hidden', o4 < 0.1);
    }
    if (dimRef.current) {
      dimRef.current.style.opacity = dim;
    }
    if (scrollIndicatorRef.current) {
      scrollIndicatorRef.current.style.opacity = p < 0.15 ? Math.max(0, 1 - p * 7) : 0;
    }
  };

  // Draw a frame onto the canvas (with fallback to nearest loaded frame)
  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let img = framesRef.current[index];
    if (!img || !img.complete) {
      // Find closest cached frame
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const left = framesRef.current[index - offset];
        if (left && left.complete) {
          img = left;
          break;
        }
        const right = framesRef.current[index + offset];
        if (right && right.complete) {
          img = right;
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    displayedFrameRef.current = index;
    ctx.imageSmoothingEnabled = true;

    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    ctx.drawImage(img, x, y, w, h);
  }, []);

  // Update canvas sizing based on window DPR
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    drawFrame(displayedFrameRef.current);
  }, [drawFrame]);

  // Preload all 60 frames with async decode and cleanup listener on unmount
  useEffect(() => {
    resizeCanvas();
    const images = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames_hd/f${String(i).padStart(3, '0')}.webp`;

      img.onload = () => {
        if (img.decode) {
          img.decode().catch(() => {});
        }
        if (i === 0) {
          setIsLoaded(true);
          drawFrame(0);
          updateChapters(0);
        }
        if (displayedFrameRef.current === i) {
          drawFrame(i);
        }
      };
      img.onerror = () => {};
      images.push(img);
    }
    framesRef.current = images;

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      // Clean up event listeners on image objects to prevent memory leak in WebView
      images.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [drawFrame, resizeCanvas]);

  // High-performance scroll tracking with rAF Idle Sleep & Delta-Time normalization
  useEffect(() => {
    let animId = null;

    const isMobile = window.innerWidth <= 768;
    const baseLerpFactor = isMobile ? 0.22 : 0.14; // Snappier touch response on mobile

    const tick = (now) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 16.67, 2.5); // Normalize to 60fps delta
      lastTimeRef.current = now;

      const diff = targetProgressRef.current - smoothProgressRef.current;

      if (Math.abs(diff) > 0.0003) {
        smoothProgressRef.current += diff * baseLerpFactor * dt;
        const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.floor(smoothProgressRef.current * (TOTAL_FRAMES - 1)));
        drawFrame(frameIdx);
        updateChapters(smoothProgressRef.current);
        animId = requestAnimationFrame(tick);
      } else {
        // Sleep when target reached to save CPU/GPU cycles and battery
        smoothProgressRef.current = targetProgressRef.current;
        const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.floor(smoothProgressRef.current * (TOTAL_FRAMES - 1)));
        drawFrame(frameIdx);
        updateChapters(smoothProgressRef.current);
        isAnimatingRef.current = false;
        animId = null;
      }
    };

    const wakeAnimation = () => {
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
        lastTimeRef.current = performance.now();
        animId = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const scrolled = -rect.top;
      targetProgressRef.current = Math.min(1, Math.max(0, scrolled / scrollable));
      wakeAnimation();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (animId) cancelAnimationFrame(animId);
      isAnimatingRef.current = false;
    };
  }, [drawFrame]);

  return (
    <div 
      ref={containerRef} 
      className="video-scroll-container"
      style={{
        position: 'relative',
        background: '#080612'
      }}
    >
      {/* Sticky Viewport Container */}
      <div 
        className="video-scroll-sticky"
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          overflow: 'hidden',
          background: '#080612'
        }}
      >
        {/* Instant Fallback Poster (Zero Black Screen Delay) */}
        <img 
          src="/frames_hd/f000.webp" 
          alt="KostKu Cinematic" 
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.5s ease',
            pointerEvents: 'none'
          }} 
        />

        {/* 60fps Scrubber Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />

        {/* Cinematic Lighting Vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(8,6,18,0.1) 0%, rgba(8,6,18,0.7) 100%), linear-gradient(to bottom, rgba(8,6,18,0.7) 0%, transparent 22%, transparent 70%, rgba(8,6,18,0.98) 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }} />

        {/* Dynamic Dark Gradient Transition to Section 2 */}
        <div 
          ref={dimRef}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0e0c1e',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: 3
          }} 
        />

        {/* Ergonomic Floating Skip Button (High contrast, 44px min target) */}
        <button
          onClick={scrollToListing}
          aria-label="Lewati animasi dan lihat katalog kost"
          style={{
            position: 'absolute',
            top: 'max(env(safe-area-inset-top, 0px) + 72px, 72px)',
            right: '16px',
            zIndex: 20,
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '8px 16px',
            minHeight: '40px',
            borderRadius: '24px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            transition: 'transform 0.15s ease'
          }}
        >
          <span>Lewati Animasi</span>
          <ArrowDown size={14} color="#38bdf8" />
        </button>

        {/* ══════════════════════════════════════════════════
            SYNCHRONIZED CHAPTER OVERLAYS (DIRECT DOM)
            ══════════════════════════════════════════════════ */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          pointerEvents: 'none'
        }}>
          
          {/* CHAPTER 1: Exterior / Intro */}
          <div 
            ref={ch1Ref}
            style={{
              position: 'absolute',
              textAlign: 'center',
              maxWidth: '680px',
              width: '100%',
              opacity: 1,
              transform: 'translate3d(0, 0px, 0)',
              pointerEvents: 'auto',
              willChange: 'opacity, transform'
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '24px',
              background: 'rgba(30, 58, 138, 0.85)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#93c5fd',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <Sparkles size={13} /> KOSTKU CO-LIVING & RESIDENCE
            </div>

            <h1 style={{
              fontSize: 'clamp(2.3rem, 6vw, 4.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              margin: '0 0 1rem 0',
              letterSpacing: '-0.03em',
              color: '#ffffff',
              textShadow: '0 10px 40px rgba(0,0,0,0.8)'
            }}>
              RUMAH SINGGAH MODERN
            </h1>

            <p style={{
              fontSize: 'clamp(0.92rem, 2vw, 1.15rem)',
              color: 'rgba(241, 245, 249, 0.9)',
              margin: '0 auto 2rem',
              maxWidth: '540px',
              lineHeight: 1.6,
              textShadow: '0 2px 10px rgba(0,0,0,0.7)'
            }}>
              Temukan hunian kost idaman dengan foto asli terverifikasi, tata letak denah 2D akurat, dan lokasi strategis.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/search"
                style={{
                  padding: '12px 28px',
                  borderRadius: '30px',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 25px rgba(37, 99, 235, 0.5)'
                }}
              >
                <Search size={16} /> Cari Kost Sekarang
              </Link>

              <button
                onClick={scrollToListing}
                style={{
                  padding: '12px 24px',
                  borderRadius: '30px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Jelajahi Demo</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* CHAPTER 2: Smart Access & Entrance */}
          <div 
            ref={ch2Ref}
            style={{
              position: 'absolute',
              textAlign: 'center',
              maxWidth: '680px',
              width: '100%',
              opacity: 0,
              transform: 'translate3d(0, 20px, 0)',
              pointerEvents: 'none',
              willChange: 'opacity, transform'
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '24px',
              background: 'rgba(6, 78, 59, 0.88)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <ShieldCheck size={14} /> KEAMANAN & AKSES PINTAR
            </div>

            <h2 style={{
              fontSize: 'clamp(1.9rem, 5vw, 3.6rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              margin: '0 0 1rem 0',
              color: 'white',
              letterSpacing: '-0.02em',
              textShadow: '0 8px 30px rgba(0,0,0,0.8)'
            }}>
              Aman & Nyaman Terlindungi 24/7
            </h2>

            <p style={{
              fontSize: 'clamp(0.88rem, 2vw, 1.05rem)',
              color: '#e2e8f0',
              margin: '0 auto 1.8rem',
              maxWidth: '520px',
              lineHeight: 1.6,
              textShadow: '0 2px 10px rgba(0,0,0,0.7)'
            }}>
              Akses pintu smart lock, pantauan CCTV menyeluruh, dan lingkungan tenang yang mendukung produktivitas dan istirahat Anda.
            </p>

            {/* Feature Badges */}
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              maxWidth: '560px',
              margin: '0 auto'
            }}>
              {[
                { icon: <ShieldCheck size={14} />, text: 'CCTV 24 Jam' },
                { icon: <Lock size={14} />, text: 'Smart Key Access' },
                { icon: <Wifi size={14} />, text: 'WiFi Gigabit Cepat' },
                { icon: <CheckCircle2 size={14} />, text: 'Parkir Motor/Mobil' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  <span style={{ color: '#38bdf8' }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CHAPTER 3: Interior Suite & Furniture */}
          <div 
            ref={ch3Ref}
            style={{
              position: 'absolute',
              textAlign: 'center',
              maxWidth: '680px',
              width: '100%',
              opacity: 0,
              transform: 'translate3d(0, 20px, 0)',
              pointerEvents: 'none',
              willChange: 'opacity, transform'
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '24px',
              background: 'rgba(12, 74, 110, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <BedDouble size={14} /> FULL FURNISHED INTERIOR
            </div>

            <h2 style={{
              fontSize: 'clamp(1.9rem, 5vw, 3.6rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              margin: '0 0 1rem 0',
              color: 'white',
              letterSpacing: '-0.02em',
              textShadow: '0 8px 30px rgba(0,0,0,0.8)'
            }}>
              Kamar Nyaman Siap Huni
            </h2>

            <p style={{
              fontSize: 'clamp(0.88rem, 2vw, 1.05rem)',
              color: '#e2e8f0',
              margin: '0 auto 1.8rem',
              maxWidth: '520px',
              lineHeight: 1.6,
              textShadow: '0 2px 10px rgba(0,0,0,0.7)'
            }}>
              Dilengkapi springbed empuk, meja kerja ergonomis, AC dingin, dan tata ruang yang telah diverifikasi denah arsitekturnya.
            </p>

            {/* Room Features */}
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              maxWidth: '560px',
              margin: '0 auto'
            }}>
              {[
                'Springbed 160x200',
                'AC Dingin Hemat Daya',
                'Kamar Mandi Dalam',
                'Meja Belajar & Lemari'
              ].map((text, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#e2e8f0',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  <span style={{ color: '#4ade80' }}>✓</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CHAPTER 4: Evening Warmth & Marketplace CTA */}
          <div 
            ref={ch4Ref}
            style={{
              position: 'absolute',
              textAlign: 'center',
              maxWidth: '680px',
              width: '100%',
              opacity: 0,
              transform: 'translate3d(0, 20px, 0)',
              pointerEvents: 'none',
              willChange: 'opacity, transform'
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '24px',
              background: 'rgba(113, 63, 18, 0.88)',
              border: '1px solid rgba(250, 204, 21, 0.4)',
              color: '#facc15',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <Star size={13} fill="#facc15" /> 10 PILIHAN DEMO KOST TERVERIFIKASI
            </div>

            <h2 style={{
              fontSize: 'clamp(1.9rem, 5vw, 3.6rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              margin: '0 0 1rem 0',
              color: 'white',
              letterSpacing: '-0.02em',
              textShadow: '0 8px 30px rgba(0,0,0,0.8)'
            }}>
              Pilih Kost Impianmu Sekarang
            </h2>

            <p style={{
              fontSize: 'clamp(0.88rem, 2vw, 1.05rem)',
              color: '#e2e8f0',
              margin: '0 auto 2rem',
              maxWidth: '520px',
              lineHeight: 1.6,
              textShadow: '0 2px 10px rgba(0,0,0,0.7)'
            }}>
              Jelajahi 10 unit kost di Jakarta, Bandung, BSD, Surabaya, dan Bali lengkap dengan foto kamar dan denah tata letak.
            </p>

            <button
              onClick={scrollToListing}
              style={{
                padding: '14px 36px',
                borderRadius: '30px',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 10px 30px rgba(37, 99, 235, 0.5)'
              }}
            >
              <span>Lihat 10 Kost Pilihan di Bawah</span>
              <ArrowDown size={18} />
            </button>
          </div>

        </div>

        {/* Adaptive Scroll Indicator (Active during Chapter 1) */}
        <div 
          ref={scrollIndicatorRef}
          style={{
            position: 'absolute',
            bottom: 'max(env(safe-area-inset-bottom, 0px) + 20px, 20px)',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            zIndex: 12,
            opacity: 1,
            pointerEvents: 'none',
            willChange: 'opacity'
          }}
        >
          {/* Desktop Mouse Cue / Mobile Swipe Cue */}
          <div className="desktop-only" style={{
            width: '24px',
            height: '38px',
            borderRadius: '16px',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '6px'
          }}>
            <div style={{
              width: '4px',
              height: '8px',
              borderRadius: '2px',
              background: '#38bdf8',
              animation: 'mouseScroll 1.6s infinite ease-in-out'
            }} />
          </div>

          <div className="mobile-only" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'swipeBounce 1.6s infinite ease-in-out'
          }}>
            <ChevronDown size={20} color="#38bdf8" />
          </div>

          <span style={{ 
            fontSize: '0.72rem', 
            letterSpacing: '0.08em', 
            textTransform: 'uppercase', 
            color: 'rgba(255,255,255,0.7)', 
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}>
            Gulir untuk Jelajahi
          </span>
        </div>

      </div>

      <style>{`
        .video-scroll-container {
          height: 230vh;
        }
        .video-scroll-sticky {
          height: 100vh;
          height: 100dvh;
        }
        @media (max-width: 768px) {
          .video-scroll-container {
            height: 150vh;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .video-scroll-container {
            height: 100vh;
          }
        }
        @keyframes mouseScroll {
          0% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(8px); opacity: 0.4; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes swipeBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
      `}</style>
    </div>
  );
}
