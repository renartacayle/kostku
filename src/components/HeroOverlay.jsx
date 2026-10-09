import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * HeroOverlay Component
 * Renders the HTML UI layer on top of the 3D WebGL canvas.
 * Implements scroll-driven animations based on the `scrollProgress` prop.
 *
 * @param {Object} props
 * @param {number} props.scrollProgress - Current scroll progress (0.0 to 1.0)
 */
const HeroOverlay = ({ scrollProgress = 0 }) => {
  // Calculate specific opacities based on scrollProgress
  
  // Badge fades in around 0.1
  const badgeOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.05) * 20));
  // Headline fades in around 0.25
  const headlineOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.15) * 10));
  // Subtitle fades in around 0.35
  const subtitleOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.25) * 10));
  // Button fades in around 0.45
  const buttonOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.35) * 10));
  
  // Scroll indicator fades out after 0.15
  const scrollIndicatorOpacity = Math.max(0, 1 - scrollProgress * 6.66);
  
  // Stats bar fades in after 0.3
  const statsOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.3) * 10));
  
  // Gradient dim overlay increases from 0 to 0.7 as scroll goes from 0.6 to 1.0
  const dimOpacity = Math.min(0.7, Math.max(0, (scrollProgress - 0.6) * 1.75));

  // Base styles applied to the container
  const containerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none', // Let clicks pass through to canvas where UI is not present
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  // Glassmorphism navigation bar
  const navStyle = {
    pointerEvents: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    background: 'rgba(8, 13, 26, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 10,
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    color: 'white',
    fontWeight: '800',
    fontSize: '1.5rem',
    letterSpacing: '-0.02em',
  };

  const logoIconStyle = {
    width: '24px',
    height: '24px',
    background: '#2563eb',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
  };

  const linkStyle = {
    textDecoration: 'none',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'color 0.2s ease',
  };

  const registerBtnStyle = {
    ...linkStyle,
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  // Center content container
  const centerContentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '0 2rem',
    zIndex: 5,
  };

  const badgeStyle = {
    opacity: badgeOpacity,
    transform: `translateY(${(1 - badgeOpacity) * 20}px)`,
    transition: 'opacity 0.1s linear, transform 0.1s linear',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    padding: '0.5rem 1rem',
    borderRadius: '30px',
    color: '#a78bfa',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '1.5rem',
    backdropFilter: 'blur(4px)',
  };

  const headlineStyle = {
    opacity: headlineOpacity,
    transform: `translateY(${(1 - headlineOpacity) * 30}px)`,
    transition: 'opacity 0.1s linear, transform 0.1s linear',
    color: 'white',
    fontSize: 'clamp(3rem, 8vw, 6rem)',
    fontWeight: '900',
    letterSpacing: '-0.04em',
    lineHeight: '1.1',
    margin: '0 0 1.5rem 0',
    whiteSpace: 'pre-line',
    textShadow: '0 10px 30px rgba(0,0,0,0.5)',
  };

  const subtitleStyle = {
    opacity: subtitleOpacity,
    transform: `translateY(${(1 - subtitleOpacity) * 20}px)`,
    transition: 'opacity 0.1s linear, transform 0.1s linear',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '1.125rem',
    maxWidth: '500px',
    margin: '0 0 2.5rem 0',
    lineHeight: '1.6',
  };

  const ctaBtnStyle = {
    pointerEvents: 'auto',
    opacity: buttonOpacity,
    transform: `translateY(${(1 - buttonOpacity) * 20}px)`,
    transition: 'opacity 0.1s linear, transform 0.1s linear, filter 0.15s',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '1rem 2.5rem',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  // Stats bar styling
  const statsContainerStyle = {
    opacity: statsOpacity,
    transform: `translateY(${(1 - statsOpacity) * 30}px)`,
    transition: 'opacity 0.1s linear, transform 0.1s linear',
    display: 'flex',
    gap: '1.5rem',
    marginTop: '4rem',
    pointerEvents: 'auto',
  };

  const statCardStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1rem 1.5rem',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '120px',
  };

  const statValueStyle = {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: '800',
    marginBottom: '0.25rem',
    fontFamily: '"JetBrains Mono", monospace',
    fontVariantNumeric: 'tabular-nums',
  };

  const statLabelStyle = {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  // Scroll Indicator
  const scrollIndicatorContainerStyle = {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    opacity: scrollIndicatorOpacity,
    transition: 'opacity 0.1s linear',
    zIndex: 10,
  };

  const scrollMouseStyle = {
    width: '24px',
    height: '36px',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '12px',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
  };

  const scrollWheelStyle = {
    width: '4px',
    height: '6px',
    background: 'white',
    borderRadius: '2px',
    marginTop: '6px',
    animation: 'scroll-wheel-anim 1.5s infinite',
  };

  const scrollTextStyle = {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  };

  // Dim overlay for transition to next section
  const dimOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(to bottom, transparent, rgba(0,0,0,${dimOpacity}))`,
    pointerEvents: 'none',
    zIndex: 1,
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          
          @keyframes scroll-wheel-anim {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(12px); opacity: 0; }
          }
          
          .nav-link:hover {
            color: white !important;
          }
          
          .cta-btn:hover {
            filter: brightness(1.1);
            transform: translateY(-2px) !important;
          }
        `}
      </style>
      
      <div style={containerStyle}>
        {/* Dim Overlay */}
        <div style={dimOverlayStyle} />

        {/* Top Navigation */}
        <nav style={navStyle}>
          <Link to="/" style={logoStyle}>
            <div style={logoIconStyle} />
            KostKu
          </Link>
          <div style={navLinksStyle}>
            <Link to="/cari" className="nav-link" style={linkStyle}>Cari Kost</Link>
            <Link to="/login" className="nav-link" style={linkStyle}>Login</Link>
            <Link to="/daftar" className="nav-link" style={registerBtnStyle}>Daftar Kost</Link>
          </div>
        </nav>

        {/* Center Content */}
        <div style={centerContentStyle}>
          <div style={badgeStyle}>
            TAMAN SUKUN CO-LIVING
          </div>
          
          <h1 style={headlineStyle}>
            FIND YOUR<br />PERFECT KOST
          </h1>
          
          <p style={subtitleStyle}>
            Platform pencarian kost terverifikasi dengan lokasi GPS dan foto asli.
          </p>
          
          <Link to="/cari" className="cta-btn" style={ctaBtnStyle}>
            Cari Kost Sekarang &rarr;
          </Link>

          {/* Stats Bar */}
          <div style={statsContainerStyle}>
            <div style={statCardStyle}>
              <span style={statValueStyle}>500+</span>
              <span style={statLabelStyle}>Kost</span>
            </div>
            <div style={statCardStyle}>
              <span style={statValueStyle}>10K+</span>
              <span style={statLabelStyle}>Penghuni</span>
            </div>
            <div style={statCardStyle}>
              <span style={statValueStyle}>50+</span>
              <span style={statLabelStyle}>Kota</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div style={scrollIndicatorContainerStyle}>
          <div style={scrollMouseStyle}>
            <div style={scrollWheelStyle} />
          </div>
          <span style={scrollTextStyle}>Scroll to Explore</span>
        </div>
      </div>
    </>
  );
};

export default HeroOverlay;
