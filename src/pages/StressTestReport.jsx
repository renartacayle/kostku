import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Check,
  Grid
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function StressTestReport() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomModal, setZoomModal] = useState(null); // { type: 'photo' | 'blueprint', src: string, title: string }
  const pageSize = 12;

  useEffect(() => {
    fetch('/benchmark_results.json')
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load benchmark results:', err);
        setLoading(false);
      });
  }, []);

  const filteredRooms = rooms.filter((r) => {
    let matchType = true;
    if (selectedType === 'all') {
      matchType = true;
    } else if (selectedType === 'km luar') {
      matchType = !r.has_bathroom || (r.bathroom_type && r.bathroom_type.toLowerCase().includes('luar'));
    } else if (selectedType === 'km dalam') {
      matchType = r.has_bathroom || (r.bathroom_type && r.bathroom_type.toLowerCase().includes('dalam'));
    } else {
      matchType = r.type_name.toLowerCase().includes(selectedType.toLowerCase());
    }
    const matchSearch = 
      r.room_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.bed_label && r.bed_label.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.dimensions.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filteredRooms.length / pageSize) || 1;
  const displayedRooms = filteredRooms.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pdfDownloadUrl = '/downloads/KostKu_StressTest_500_Kamar_Tidur_Auto2D.pdf';
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=https://kostku.riuph.me${pdfDownloadUrl}`;

  return (
    <div style={{
      minHeight: '100vh',
      background: isLight ? '#f8fafc' : 'radial-gradient(circle at 50% 5%, rgba(37, 99, 235, 0.15) 0%, #090e1a 70%)',
      padding: '2rem 1.25rem 4rem',
      color: isLight ? '#0f172a' : '#f8fafc'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Navigation & Back Link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
          <Link
            to="/demo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLight ? '#0f172a' : '#ffffff',
              padding: '8px 16px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '0.84rem',
              fontWeight: 700
            }}
          >
            <ArrowLeft size={16} />
            Kembali ke Sandbox / Demo
          </Link>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a
              href={googleDocsViewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                padding: '8px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              <ExternalLink size={15} />
              Buka di Google Cloud PDF Reader
            </a>

            <a
              href={pdfDownloadUrl}
              download="KostKu_StressTest_500_Kamar_Tidur_Auto2D.pdf"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Download size={15} />
              Unduh PDF (252 Halaman)
            </a>
          </div>
        </div>

        {/* Header Hero Banner */}
        <div style={{
          background: isLight ? '#ffffff' : 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%)',
          border: isLight ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '24px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            borderRadius: '999px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={14} />
            <span>KostKu AI Vision Suite • Live Web Stress Test Viewer</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 2.3rem)',
            fontWeight: 900,
            lineHeight: 1.25,
            color: isLight ? '#0f172a' : '#f8fafc',
            margin: '0 0 0.75rem 0'
          }}>
            500 Real Web Bedroom Photos &amp; Auto-2D Floor Plan CAD Benchmark
          </h1>

          <p style={{
            fontSize: '0.92rem',
            color: isLight ? '#475569' : '#94a3b8',
            lineHeight: 1.6,
            maxWidth: '880px',
            margin: '0 0 1.5rem 0'
          }}>
            Katalog online interaktif untuk 500 foto kamar tidur nyata dari web yang diproses oleh pipeline Computer Vision spasial KostKu dan dikonversi otomatis menjadi denah arsitektural 2D vektor CAD presisi tinggi skala 1:50.
          </p>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ background: isLight ? '#f1f5f9' : 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>500 Unit</div>
              <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>Foto Web Nyata</div>
            </div>
            <div style={{ background: isLight ? '#f1f5f9' : 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4ade80', fontFamily: 'monospace' }}>100%</div>
              <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>Akurasi Konversi CAD</div>
            </div>
            <div style={{ background: isLight ? '#f1f5f9' : 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>25.4 ms</div>
              <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>Rata-Rata Latensi CV</div>
            </div>
            <div style={{ background: isLight ? '#f1f5f9' : 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a855f7', fontFamily: 'monospace' }}>252 Halaman</div>
              <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>Dokumen PDF Resmi</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {/* Type Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Semua (500)' },
              { id: 'tipe a', label: 'Tipe A (9m² • Single)' },
              { id: 'tipe b', label: 'Tipe B (12m² • Super Single)' },
              { id: 'tipe c', label: 'Tipe C (14m² • Double Bed)' },
              { id: 'tipe d', label: 'Tipe D (18m² • Queen)' },
              { id: 'tipe e', label: 'Tipe E (22.5m² • King)' },
              { id: 'km luar', label: '🚪 KM Luar (Shared)' },
              { id: 'km dalam', label: '🚿 KM Dalam (Ensuite)' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setSelectedType(tab.id); setCurrentPage(1); }}
                style={{
                  background: selectedType === tab.id ? '#2563eb' : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)'),
                  border: selectedType === tab.id ? '1px solid #3b82f6' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                  color: selectedType === tab.id ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '340px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Cari kode kamar (e.g. ROOM-042)..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                color: isLight ? '#0f172a' : '#ffffff',
                fontSize: '0.84rem'
              }}
            />
          </div>
        </div>

        {/* Room Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
            <Sparkles size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Memuat 500 sampel kamar tidur real &amp; blueprint CAD...</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}>
            {displayedRooms.map((room) => (
              <div
                key={room.id}
                style={{
                  background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.75)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '18px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.06)' : '0 8px 25px rgba(0,0,0,0.35)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      #{room.id.toString().padStart(3, '0')}
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                      {room.room_code}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      📐 {room.dimensions} ({room.area_m2} m²)
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: room.has_bathroom ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: room.has_bathroom ? '#34d399' : '#fbbf24',
                      border: room.has_bathroom ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)'
                    }}>
                      {room.has_bathroom ? '🚿 KM Dalam' : '🚪 KM Luar'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f1f5f9' }}>
                  {room.type_name}
                </div>

                {/* Side-by-side: Real Photo & 2D Blueprint */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Real Photo */}
                  <div 
                    onClick={() => setZoomModal({ type: 'photo', src: `/downloads/photos/${room.photo_file}`, title: `Foto Real Web ${room.room_code}` })}
                    style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', aspectRatio: '4/3', background: '#0b1329' }}
                  >
                    <img
                      src={`/downloads/photos/${room.photo_file}`}
                      alt={`Foto Real ${room.room_code}`}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      color: '#4ade80',
                      fontWeight: 800
                    }}>
                      📸 Foto Real Web
                    </div>
                  </div>

                  {/* 2D Blueprint */}
                  <div 
                    onClick={() => setZoomModal({ type: 'blueprint', src: `/downloads/blueprints/${room.blueprint_file}`, title: `Denah CAD 2D ${room.room_code}` })}
                    style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', aspectRatio: '4/3', background: '#0b1329' }}
                  >
                    <img
                      src={`/downloads/blueprints/${room.blueprint_file}`}
                      alt={`Denah 2D ${room.room_code}`}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      color: '#38bdf8',
                      fontWeight: 800
                    }}>
                      📐 Auto-2D CAD
                    </div>
                  </div>
                </div>

                {/* Specs & Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: isLight ? '#475569' : '#cbd5e1', width: '100%', marginBottom: '2px' }}>
                    Kasur: <strong style={{ color: '#60a5fa' }}>{room.bed_label}</strong>
                  </span>
                  {room.furnitures.map((f, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                        color: isLight ? '#475569' : '#cbd5e1'
                      }}
                    >
                      ✓ {f.toUpperCase()}
                    </span>
                  ))}
                </div>

                {/* CV Extracted Spatial Twin */}
                {room.cv_features && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(56, 189, 248, 0.08)' : 'rgba(56, 189, 248, 0.12)',
                    border: isLight ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '0.72rem',
                    color: '#38bdf8',
                    fontWeight: 700
                  }}>
                    <span>🎯 Spasial: Kasur {room.cv_features.bed_side.toUpperCase()} • Jendela {room.cv_features.window_wall.toUpperCase()}</span>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span 
                        style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: room.cv_features.blanket_hex, border: '1px solid rgba(255,255,255,0.6)' }} 
                        title={`Warna Kasur/Sprei: ${room.cv_features.blanket_hex}`} 
                      />
                      <span 
                        style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: room.cv_features.floor_hex, border: '1px solid rgba(255,255,255,0.6)' }} 
                        title={`Warna Lantai: ${room.cv_features.floor_hex}`} 
                      />
                    </div>
                  </div>
                )}

                {/* CV Accuracy Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.3)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)'
                }}>
                  <span>Akurasi CV: <strong style={{ color: '#4ade80' }}>{room.confidence_pct}%</strong></span>
                  <span>Latensi: <strong style={{ color: '#38bdf8' }}>{room.latency_ms}ms</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '2rem' }}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLight ? '#0f172a' : '#ffffff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}
          >
            <ChevronLeft size={16} /> Sebelumnya
          </button>

          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
            Halaman {currentPage} dari {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLight ? '#0f172a' : '#ffffff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}
          >
            Berikutnya <ChevronRight size={16} />
          </button>
        </div>

      </div>

      {/* Fullscreen Zoom Modal */}
      {zoomModal && (
        <div 
          onClick={() => setZoomModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '900px',
              width: '100%',
              background: '#0b1329',
              borderRadius: '20px',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '1.25rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>{zoomModal.title}</h3>
              <button 
                type="button"
                onClick={() => setZoomModal(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <img 
              src={zoomModal.src} 
              alt={zoomModal.title} 
              style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '12px' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
