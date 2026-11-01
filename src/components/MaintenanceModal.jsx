import React from 'react';
import { ShieldAlert, PhoneCall, Lock } from 'lucide-react';

export default function MaintenanceModal() {
  // Modal cannot be closed - strictly locks the screen during maintenance
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.25s ease-out',
        userSelect: 'none'
      }}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1.75rem',
          maxWidth: '32rem',
          width: '100%',
          padding: '2.25rem 2rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px rgba(245, 158, 11, 0.15)',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Warning Icon Badge */}
        <div 
          style={{
            width: '5rem',
            height: '5rem',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            borderRadius: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.35)'
          }}
        >
          <ShieldAlert size={44} />
        </div>

        {/* Badge Status */}
        <div style={{ marginBottom: '0.75rem' }}>
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
              letterSpacing: '0.02em'
            }}
          >
            <Lock size={12} />
            SISTEM DIKUNCI SEMENTARA
          </span>
        </div>

        {/* Title */}
        <h2 
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '0.35rem',
            lineHeight: 1.25,
            letterSpacing: '-0.02em'
          }}
        >
          KostKu Ditutup Sementara
        </h2>
        <p 
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#d97706',
            marginBottom: '1.25rem'
          }}
        >
          Untuk Peningkatan Keamanan & Audit Sistem
        </p>

        {/* Description Box */}
        <div 
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: '1.25rem',
            padding: '1.2rem',
            fontSize: '0.85rem',
            color: '#334155',
            lineHeight: 1.6,
            textAlign: 'left',
            border: '1px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}
        >
          <p style={{ margin: '0 0 0.6rem 0' }}>
            Halo penghuni dan pengguna KostKu, seluruh layanan dan akses ke portal sistem saat ini 
            <strong> dinonaktifkan sementara</strong> sehubungan dengan adanya pemeliharaan dan peningkatan sistem keamanan tingkat lanjut.
          </p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
            Untuk bantuan darurat, pengisian listrik, air, atau informasi seputar kost, silakan hubungi Pengelola Kost langsung melalui WhatsApp.
          </p>
        </div>

        {/* Action Button: WhatsApp Only (No Close Button) */}
        <div>
          <a 
            href="https://wa.me/6281228263200?text=Halo%20Mbak%20Rena,%20saya%20mau%20tanya%20info%20kostku" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.9rem 1.5rem',
              borderRadius: '1rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
              transition: 'transform 0.15s, background 0.15s'
            }}
          >
            <PhoneCall size={18} />
            Hubungi Pengelola Kost (Mbak Rena - WhatsApp)
          </a>
          <p 
            style={{ 
              margin: '0.85rem 0 0 0', 
              fontSize: '0.72rem', 
              color: '#94a3b8', 
              fontWeight: 600 
            }}
          >
            🔒 Halaman ini terkunci otomatis hingga proses peningkatan keamanan selesai.
          </p>
        </div>

      </div>
    </div>
  );
}
