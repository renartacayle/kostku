import React, { useEffect, useState, useRef } from 'react';

const ScrollSequence = () => {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const totalFrames = 8;
  const frames = Array.from({ length: totalFrames }, (_, i) => `/sequence/frame-${i + 1}.png`);

  // Preload images
  useEffect(() => {
    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => setImagesLoaded((prev) => prev + 1);
    });
  }, []);

  // Track scroll progress
  useEffect(() => {
    let rafId;
    let currentProgress = 0;

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const { top, height } = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate how far we've scrolled through the container
      // top is 0 when container starts, - (height - viewportHeight) when it ends
      const scrollableDistance = height - viewportHeight;
      const scrolled = -top;
      
      let targetProgress = scrolled / scrollableDistance;
      targetProgress = Math.min(1, Math.max(0, targetProgress));

      // Smooth interpolation (GSAP scrub feel)
      const animate = () => {
        currentProgress = currentProgress + (targetProgress - currentProgress) * 0.1;
        if (Math.abs(currentProgress - targetProgress) > 0.001) {
          setProgress(currentProgress);
          rafId = requestAnimationFrame(animate);
        } else {
          setProgress(targetProgress);
        }
      };
      
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Calculate current stage (0 to 7)
  const stage = progress * (totalFrames - 1);

  // Ethereal white transition flash around Frame 3 (index 2)
  // Peaks at stage = 2.1
  const whiteOpacity = Math.max(0, 1 - Math.abs(stage - 2.1) * 1.5);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '800vh', 
        position: 'relative',
        background: '#000'
      }}
    >
      {imagesLoaded < totalFrames && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#000', color: 'white', zIndex: 100
        }}>
          <h2>Loading Cinematic Experience... {Math.round((imagesLoaded / totalFrames) * 100)}%</h2>
        </div>
      )}

      {/* Sticky Viewport Container */}
      <div style={{
        position: 'sticky',
        top: 0,
        width: '100%',
        height: '100vh',
        overflow: 'hidden'
      }}>
        
        {/* Render all frames stacked */}
        {frames.map((src, index) => {
          // Frame 1 (index 0) is always base (opacity 1)
          // Frame i fades in as `stage` goes from i-1 to i
          const opacity = index === 0 ? 1 : Math.min(1, Math.max(0, stage - (index - 1)));
          
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url(${src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: opacity,
                willChange: 'opacity',
                zIndex: index
              }}
            />
          );
        })}

        {/* Ethereal White Flash (Frame 3 Transition) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'white',
          opacity: whiteOpacity,
          pointerEvents: 'none',
          zIndex: 10,
          mixBlendMode: 'screen',
        }} />

        {/* Frame 6 HTML Overlay: Room Types Menu */}
        {/* Appears when stage is around 5 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70vw',
          maxWidth: '900px',
          height: '50vh',
          opacity: Math.max(0, 1 - Math.abs(stage - 5) * 1.5),
          pointerEvents: stage > 4.5 && stage < 5.5 ? 'auto' : 'none',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem', letterSpacing: '4px' }}>ROOM TYPES</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%' }}>
            {['Standard Room - Rp 1.5M', 'Deluxe Room - Rp 2.0M', 'Premium Suite - Rp 3.5M', 'VIP Penthouse - Rp 5.0M'].map((room, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
              >
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{room.split(' - ')[0]}</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>{room.split(' - ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Frame 8 HTML Overlay: Footer / Business Card CTA */}
        {/* Appears when stage is near 7 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          // Precise 3D transform to align with the perspective of the business card in the hand
          transform: 'translate(-55%, -40%) rotateZ(-4deg) rotateY(15deg) scale(0.95)',
          width: '380px',
          height: '220px',
          opacity: Math.max(0, 1 - Math.abs(stage - 7) * 2),
          pointerEvents: stage > 6.5 ? 'auto' : 'none',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#1a1a1a', // Dark text for white card
          fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
          perspective: '1000px'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>RUMAH SINGGAH</h3>
          <p style={{ margin: '4px 0 20px', fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>Nyaman • Aman • Bersih</p>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>📱 @rumahsinggah</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>✉️ hello@rumahsinggah.id</span>
          </div>

          <button style={{
            padding: '12px 30px',
            background: '#0a1628',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
          }}>
            BOOK NOW
          </button>
        </div>

      </div>
    </div>
  );
};

export default ScrollSequence;
