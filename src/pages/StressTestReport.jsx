import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Grid,
  FileText,
  Compass,
  Layers,
  Eye,
  CheckCircle2,
  Bed,
  Bath,
  Wind,
  Maximize,
  X
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'document'
  const [mediaDisplay, setMediaDisplay] = useState('split'); // 'split' | 'cad' | 'photo'
  const [selectedRoomModal, setSelectedRoomModal] = useState(null);
  const [modalTab, setModalTab] = useState('cad'); // 'cad' | 'photo' | 'split'
  const [showHeroDetails, setShowHeroDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const pageSize = 12;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Keyboard escape listener for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedRoomModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredRooms = rooms.filter((r) => {
    let matchType = true;
    if (selectedType === 'all') {
      matchType = true;
    } else if (selectedType === 'km luar') {
      matchType = !r.has_bathroom || (r.bathroom_type && r.bathroom_type.toLowerCase().includes('luar'));
    } else if (selectedType === 'km dalam') {
      matchType = r.has_bathroom || (r.bathroom_type && r.bathroom_type.toLowerCase().includes('dalam'));
    } else if (selectedType === 'blur unsure') {
      matchType = !!r.unsure_zone;
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
  const showcasePdfUrl = '/downloads/KostKu_StressTest_Showcase_Auto2D.pdf';
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=https://kostku.riuph.me${showcasePdfUrl}`;
  const htmlDocumentUrl = '/stress-test-document.html';

  return (
    <div style={{
      minHeight: '100vh',
      background: isLight 
        ? '#f8fafc' 
        : 'radial-gradient(circle at 50% 0%, rgba(30, 58, 138, 0.22) 0%, #060b14 65%)',
      padding: isMobile ? '0.75rem 0.65rem 4rem' : '1.5rem 1rem 7.5rem',
      color: isLight ? '#0f172a' : '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Top Breadcrumb & Action Links */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: isMobile ? '0.75rem' : '1.5rem', 
          gap: '8px' 
        }}>
          <Link
            to="/demo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isLight ? '#0f172a' : '#f8fafc',
              padding: isMobile ? '6px 10px' : '7px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: isMobile ? '0.74rem' : '0.8rem',
              fontWeight: 700,
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={14} />
            {isMobile ? 'Demo' : 'Demo Sandbox'}
          </Link>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto' }}>
            <a
              href={htmlDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                padding: isMobile ? '6px 10px' : '7px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              <ExternalLink size={13} />
              {isMobile ? 'A4 Web' : 'Dokumen A4 (252 Hal)'}
            </a>

            {!isMobile && (
              <a
                href={googleDocsViewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <ExternalLink size={14} />
                Cloud PDF Reader
              </a>
            )}

            <a
              href={pdfDownloadUrl}
              download="KostKu_StressTest_500_Kamar_Tidur_Auto2D.pdf"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                padding: isMobile ? '6px 10px' : '7px 15px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                flexShrink: 0
              }}
            >
              <Download size={13} />
              {isMobile ? 'PDF (58M)' : 'Unduh PDF (58 MB)'}
            </a>
          </div>
        </div>

        {/* Hero Architectural Banner */}
        <div style={{
          background: isLight 
            ? '#ffffff' 
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
          backdropFilter: 'blur(20px)',
          border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: isMobile ? '16px' : '24px',
          padding: isMobile ? '1rem' : '2.25rem',
          marginBottom: isMobile ? '1rem' : '2rem',
          boxShadow: isLight 
            ? '0 10px 25px rgba(0, 0, 0, 0.05)' 
            : '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            fontSize: isMobile ? '0.7rem' : '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            marginBottom: isMobile ? '0.5rem' : '0.85rem'
          }}>
            <Sparkles size={12} />
            <span>{isMobile ? 'Spatial Vision CAD • 500 Unit' : 'KostKu Spatial Vision Suite • Architectural CAD Benchmark'}</span>
          </div>

          <h1 style={{
            fontSize: isMobile ? '1.25rem' : 'clamp(1.75rem, 3.8vw, 2.5rem)',
            fontWeight: 900,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            color: isLight ? '#0f172a' : '#f8fafc',
            margin: '0 0 0.5rem 0'
          }}>
            {isMobile ? '500 Kamar Real & Auto-2D Floor Plan CAD' : '500 Real Web Bedroom Photos & Auto-2D Floor Plan CAD Benchmark'}
          </h1>

          {isMobile ? (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{
                fontSize: '0.8rem',
                color: isLight ? '#475569' : '#94a3b8',
                lineHeight: 1.45,
                margin: '0 0 4px 0'
              }}>
                Katalog arsitektural CV KostKu: 500 foto real diekstrak ke denah CAD 1:50.
              </p>
              {showHeroDetails && (
                <p style={{
                  fontSize: '0.75rem',
                  color: isLight ? '#64748b' : '#94a3b8',
                  lineHeight: 1.5,
                  margin: '6px 0 0',
                  padding: '8px',
                  borderRadius: '8px',
                  background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.25)'
                }}>
                  Katalog arsitektural interaktif yang mendemonstrasikan kemampuan Computer Vision KostKu mengekstrak foto kamar tidur nyata dari web dan secara instan merender denah lantai 2D CAD vektor berstandar drafting Swiss skala 1:50 dengan akurasi 100%.
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowHeroDetails(!showHeroDetails)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  color: '#38bdf8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                {showHeroDetails ? 'Sembunyikan ▴' : 'Baca Selengkapnya ▾'}
              </button>
            </div>
          ) : (
            <p style={{
              fontSize: '0.98rem',
              color: isLight ? '#475569' : '#94a3b8',
              lineHeight: 1.65,
              maxWidth: '920px',
              margin: '0 0 1.75rem 0'
            }}>
              Katalog arsitektural interaktif yang mendemonstrasikan kemampuan Computer Vision KostKu mengekstrak foto kamar tidur nyata dari web dan secara instan merender denah lantai 2D CAD vektor berstandar drafting Swiss skala 1:50 dengan akurasi 100%.
            </p>
          )}

          {/* Quick Metrics Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '8px' : '14px'
          }}>
            <div style={{ 
              background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.35)', 
              padding: isMobile ? '8px 12px' : '14px 18px', 
              borderRadius: isMobile ? '12px' : '16px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>500 Unit</div>
              <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>Foto Kamar Web Nyata</div>
            </div>
            <div style={{ 
              background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.35)', 
              padding: isMobile ? '8px 12px' : '14px 18px', 
              borderRadius: isMobile ? '12px' : '16px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 900, color: '#4ade80', fontFamily: 'monospace' }}>100%</div>
              <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>Akurasi Rekonstruksi</div>
            </div>
            <div style={{ 
              background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.35)', 
              padding: isMobile ? '8px 12px' : '14px 18px', 
              borderRadius: isMobile ? '12px' : '16px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>25.4 ms</div>
              <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>Rata Latensi Inferensi</div>
            </div>
            <div style={{ 
              background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.35)', 
              padding: isMobile ? '8px 12px' : '14px 18px', 
              borderRadius: isMobile ? '12px' : '16px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 900, color: '#a855f7', fontFamily: 'monospace' }}>252 Hal</div>
              <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>Dokumen Vektor A4</div>
            </div>
          </div>
        </div>

        {/* Global Controls & View Segmented Switcher */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? '8px' : '14px',
          marginBottom: isMobile ? '1rem' : '1.75rem'
        }}>
          {/* Main View Mode (Grid vs Document Reader) */}
          <div style={{
            display: 'inline-flex',
            padding: '3px',
            borderRadius: '12px',
            background: isLight ? '#e2e8f0' : 'rgba(15, 23, 42, 0.85)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
            gap: '3px',
            width: isMobile ? '100%' : 'auto'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                flex: isMobile ? 1 : 'initial',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: isMobile ? '7px 10px' : '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: viewMode === 'grid' ? '#2563eb' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                fontWeight: 700,
                fontSize: isMobile ? '0.76rem' : '0.85rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Grid size={isMobile ? 14 : 16} />
              {isMobile ? 'Galeri Grid (500)' : 'Galeri Grid Interaktif (500 Kamar)'}
            </button>

            <button
              type="button"
              onClick={() => setViewMode('document')}
              style={{
                flex: isMobile ? 1 : 'initial',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: isMobile ? '7px 10px' : '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: viewMode === 'document' ? '#2563eb' : 'transparent',
                color: viewMode === 'document' ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                fontWeight: 700,
                fontSize: isMobile ? '0.76rem' : '0.85rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'document' ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <FileText size={isMobile ? 14 : 16} />
              {isMobile ? 'Dokumen A4 (252p)' : 'Dokumen PDF Resmi (252 Halaman)'}
            </button>
          </div>

          {/* Media Display Mode Switcher (When in Grid Mode) */}
          {viewMode === 'grid' && (
            <div style={{
              display: 'inline-flex',
              padding: '3px',
              borderRadius: '11px',
              background: isLight ? '#e2e8f0' : 'rgba(15, 23, 42, 0.65)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
              gap: '3px',
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'space-between' : 'flex-start'
            }}>
              <button
                type="button"
                onClick={() => setMediaDisplay('split')}
                style={{
                  flex: isMobile ? 1 : 'initial',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: isMobile ? '6px 8px' : '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mediaDisplay === 'split' ? (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.15)') : 'transparent',
                  color: mediaDisplay === 'split' ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#64748b' : '#94a3b8'),
                  fontSize: isMobile ? '0.72rem' : '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Layers size={13} />
                {isMobile ? 'Split' : 'Berdampingan (Foto + CAD)'}
              </button>

              <button
                type="button"
                onClick={() => setMediaDisplay('cad')}
                style={{
                  flex: isMobile ? 1 : 'initial',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: isMobile ? '6px 8px' : '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mediaDisplay === 'cad' ? (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.15)') : 'transparent',
                  color: mediaDisplay === 'cad' ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#64748b' : '#94a3b8'),
                  fontSize: isMobile ? '0.72rem' : '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Compass size={13} />
                {isMobile ? 'CAD Saja' : 'Fokus CAD Blueprint'}
              </button>

              <button
                type="button"
                onClick={() => setMediaDisplay('photo')}
                style={{
                  flex: isMobile ? 1 : 'initial',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: isMobile ? '6px 8px' : '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mediaDisplay === 'photo' ? (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.15)') : 'transparent',
                  color: mediaDisplay === 'photo' ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#64748b' : '#94a3b8'),
                  fontSize: isMobile ? '0.72rem' : '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Eye size={13} />
                {isMobile ? 'Foto Saja' : 'Fokus Foto Web'}
              </button>
            </div>
          )}
        </div>

        {/* View Mode: Document Reader */}
        {viewMode === 'document' ? (
          <div style={{
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: isMobile ? '16px' : '24px',
            padding: isMobile ? '12px' : '1.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '10px' : '14px',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              paddingBottom: '12px',
              borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div>
                <h2 style={{ fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: isLight ? '#0f172a' : '#ffffff' }}>
                  📑 Pembaca Dokumen CAD 252 Halaman (A4 Vektor)
                </h2>
                <p style={{ margin: 0, fontSize: isMobile ? '0.76rem' : '0.84rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  Dibaca langsung di browser tanpa perlu download file 58 MB. Teks &amp; linework 100% SVG tajam.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href={htmlDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    padding: isMobile ? '6px 12px' : '8px 16px',
                    borderRadius: '10px',
                    fontSize: isMobile ? '0.74rem' : '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={13} />
                  Tab Baru (Fullscreen)
                </a>
              </div>
            </div>

            <div style={{
              position: 'relative',
              width: '100%',
              height: isMobile ? '70vh' : '840px',
              borderRadius: isMobile ? '12px' : '16px',
              overflow: 'hidden',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
              background: '#090e17'
            }}>
              <iframe
                src={`${htmlDocumentUrl}#rooms-start`}
                title="KostKu Architectural CAD Benchmark"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block'
                }}
              />
            </div>
          </div>
        ) : (
          /* View Mode: Interactive Gallery Grid */
          <div>
            {/* Filter Pills & Search Input */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: isMobile ? '10px' : '14px',
              marginBottom: isMobile ? '1rem' : '1.75rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              {/* Type Filter Pills - Horizontal Scroll on Mobile */}
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                width: isMobile ? '100%' : 'auto',
                paddingBottom: isMobile ? '2px' : '0'
              }}>
                {[
                  { id: 'all', label: 'Semua (500)' },
                  { id: 'tipe a', label: 'Tipe A (9m²)' },
                  { id: 'tipe b', label: 'Tipe B (12m²)' },
                  { id: 'tipe c', label: 'Tipe C (14m²)' },
                  { id: 'tipe d', label: 'Tipe D (18m²)' },
                  { id: 'tipe e', label: 'Tipe E (22.5m²)' },
                  { id: 'km dalam', label: '🚿 KM Dalam' },
                  { id: 'km luar', label: '🚪 KM Luar' },
                  { id: 'blur unsure', label: '🌫️ Sudut Blur' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setSelectedType(tab.id); setCurrentPage(1); }}
                    style={{
                      flexShrink: 0,
                      background: selectedType === tab.id 
                        ? '#2563eb' 
                        : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)'),
                      border: selectedType === tab.id 
                        ? '1px solid #3b82f6' 
                        : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)'),
                      color: selectedType === tab.id 
                        ? '#ffffff' 
                        : (isLight ? '#334155' : '#cbd5e1'),
                      padding: isMobile ? '6px 12px' : '7px 15px',
                      borderRadius: '10px',
                      fontSize: isMobile ? '0.74rem' : '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div style={{ 
                position: 'relative', 
                width: isMobile ? '100%' : 'auto', 
                minWidth: isMobile ? '100%' : '260px', 
                maxWidth: isMobile ? '100%' : '360px' 
              }}>
                <Search size={15} style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: isLight ? '#94a3b8' : '#64748b' 
                }} />
                <input
                  type="text"
                  placeholder="Cari kamar (e.g. ROOM-042)..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: isMobile ? '8px 12px 8px 36px' : '9px 12px 9px 38px',
                    borderRadius: '12px',
                    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none'
                  }}
                />
              </div>
            </div>

            {/* Room Card Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem 0', color: '#64748b' }}>
                <Sparkles size={32} className="animate-spin" style={{ margin: '0 auto 14px' }} />
                <p style={{ fontSize: '0.95rem' }}>Memuat 500 sampel kamar tidur real &amp; blueprint CAD...</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: isMobile ? '1rem' : '1.5rem',
                marginBottom: isMobile ? '1.75rem' : '2.5rem',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {displayedRooms.map((room, idx) => (
                  <div
                    key={room.id}
                    style={{
                      background: isLight 
                        ? '#ffffff' 
                        : 'linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
                      backdropFilter: 'blur(16px)',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: isMobile ? '16px' : '20px',
                      padding: isMobile ? '12px' : '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isMobile ? '10px' : '14px',
                      boxShadow: isLight 
                        ? '0 4px 16px rgba(0,0,0,0.04)' 
                        : '0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                      boxSizing: 'border-box',
                      width: '100%',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Card Header (Clean Visual Hierarchy) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: isMobile ? '1.05rem' : '1.15rem',
                            fontWeight: 900,
                            letterSpacing: '-0.01em',
                            color: isLight ? '#0f172a' : '#f8fafc'
                          }}>
                            Unit {room.room_number}
                          </span>
                          <span style={{
                            background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                            color: isLight ? '#64748b' : '#94a3b8',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontFamily: 'monospace'
                          }}>
                            {room.room_code}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '0.76rem' : '0.8rem', 
                          color: isLight ? '#64748b' : '#94a3b8', 
                          marginTop: '2px',
                          fontWeight: 500
                        }}>
                          {room.type_name.split('-')[1]?.trim() || room.type_name} • <strong style={{ color: '#38bdf8' }}>{room.dimensions} ({room.area_m2} m²)</strong>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: room.has_bathroom ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                          color: room.has_bathroom ? '#34d399' : (isLight ? '#475569' : '#cbd5e1'),
                          border: room.has_bathroom ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(148, 163, 184, 0.25)'
                        }}>
                          {room.has_bathroom ? '🚿 KM Dlm' : '🚪 KM Luar'}
                        </span>
                        
                        {room.unsure_zone && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(244, 63, 94, 0.12)',
                            color: '#fb7185',
                            border: '1px solid rgba(244, 63, 94, 0.3)'
                          }}>
                            🌫️ Blur
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Media Showcase Frame */}
                    {mediaDisplay === 'split' ? (
                      /* Side-by-Side: Real Web Photo & 2D CAD Blueprint */
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: isMobile ? '6px' : '10px' 
                      }}>
                        {/* Real Photo */}
                        <div 
                          onClick={() => { setSelectedRoomModal(room); setModalTab('photo'); }}
                          style={{ 
                            position: 'relative', 
                            borderRadius: isMobile ? '10px' : '12px', 
                            overflow: 'hidden', 
                            cursor: 'pointer', 
                            aspectRatio: isMobile ? '1/1' : '16/11', 
                            background: '#090e17',
                            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <img
                            src={`/downloads/photos/${room.photo_file}`}
                            alt={`Foto Real ${room.room_code}`}
                            loading={idx < 4 ? 'eager' : 'lazy'}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover', 
                              display: 'block' 
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: '5px',
                            left: '5px',
                            background: 'rgba(0, 0, 0, 0.82)',
                            backdropFilter: 'blur(4px)',
                            padding: isMobile ? '2px 6px' : '3px 8px',
                            borderRadius: '5px',
                            fontSize: isMobile ? '0.62rem' : '0.68rem',
                            color: '#4ade80',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            📸 {isMobile ? 'Real Web' : 'Foto Web Nyata'}
                          </div>
                        </div>

                        {/* 2D Architectural CAD Blueprint */}
                        <div 
                          onClick={() => { setSelectedRoomModal(room); setModalTab('cad'); }}
                          style={{ 
                            position: 'relative', 
                            borderRadius: isMobile ? '10px' : '12px', 
                            overflow: 'hidden', 
                            cursor: 'pointer', 
                            aspectRatio: isMobile ? '1/1' : '16/11', 
                            background: '#090e17',
                            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(56, 189, 248, 0.25)'
                          }}
                        >
                          <img
                            src={`/downloads/blueprints/${room.blueprint_file}`}
                            alt={`Denah 2D ${room.room_code}`}
                            loading={idx < 4 ? 'eager' : 'lazy'}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain', 
                              display: 'block' 
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: '5px',
                            left: '5px',
                            background: 'rgba(9, 14, 23, 0.88)',
                            backdropFilter: 'blur(4px)',
                            padding: isMobile ? '2px 6px' : '3px 8px',
                            borderRadius: '5px',
                            fontSize: isMobile ? '0.62rem' : '0.68rem',
                            color: '#38bdf8',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            border: '1px solid rgba(56, 189, 248, 0.3)'
                          }}>
                            📐 {isMobile ? 'CAD 1:50' : 'CAD Skala 1:50'}
                          </div>
                        </div>
                      </div>
                    ) : mediaDisplay === 'cad' ? (
                      /* Full CAD Frame */
                      <div 
                        onClick={() => { setSelectedRoomModal(room); setModalTab('cad'); }}
                        style={{ 
                          position: 'relative', 
                          borderRadius: isMobile ? '12px' : '14px', 
                          overflow: 'hidden', 
                          cursor: 'pointer', 
                          aspectRatio: isMobile ? '4/3' : '16/10', 
                          background: '#090e17',
                          border: '1px solid rgba(56, 189, 248, 0.35)'
                        }}
                      >
                        <img
                          src={`/downloads/blueprints/${room.blueprint_file}`}
                          alt={`Denah 2D ${room.room_code}`}
                          loading={idx < 4 ? 'eager' : 'lazy'}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          background: 'rgba(9, 14, 23, 0.88)',
                          backdropFilter: 'blur(4px)',
                          padding: isMobile ? '3px 8px' : '4px 10px',
                          borderRadius: '6px',
                          fontSize: isMobile ? '0.68rem' : '0.72rem',
                          color: '#38bdf8',
                          fontWeight: 800,
                          border: '1px solid rgba(56, 189, 248, 0.3)'
                        }}>
                          📐 CAD 1:50 • Tap Layar Penuh
                        </div>
                      </div>
                    ) : (
                      /* Full Photo Frame */
                      <div 
                        onClick={() => { setSelectedRoomModal(room); setModalTab('photo'); }}
                        style={{ 
                          position: 'relative', 
                          borderRadius: isMobile ? '12px' : '14px', 
                          overflow: 'hidden', 
                          cursor: 'pointer', 
                          aspectRatio: isMobile ? '4/3' : '16/10', 
                          background: '#090e17',
                          border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <img
                          src={`/downloads/photos/${room.photo_file}`}
                          alt={`Foto Real ${room.room_code}`}
                          loading={idx < 4 ? 'eager' : 'lazy'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          background: 'rgba(0, 0, 0, 0.82)',
                          backdropFilter: 'blur(4px)',
                          padding: isMobile ? '3px 8px' : '4px 10px',
                          borderRadius: '6px',
                          fontSize: isMobile ? '0.68rem' : '0.72rem',
                          color: '#4ade80',
                          fontWeight: 800
                        }}>
                          📸 Foto Web Real • Tap Layar Penuh
                        </div>
                      </div>
                    )}

                    {/* Architectural Specifications Strip */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
                      padding: isMobile ? '8px 10px' : '10px 12px',
                      borderRadius: '12px',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: isMobile ? '0.74rem' : '0.78rem', color: isLight ? '#475569' : '#cbd5e1' }}>
                          Kasur: <strong style={{ color: '#38bdf8' }}>{room.bed_label}</strong>
                          {room.bed_orientation && (
                            <span style={{
                              marginLeft: '6px',
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: room.bed_orientation.startsWith('horizontal') ? 'rgba(234, 179, 8, 0.18)' : 'rgba(56, 189, 248, 0.12)',
                              color: room.bed_orientation.startsWith('horizontal') ? '#facc15' : '#38bdf8',
                              border: room.bed_orientation.startsWith('horizontal') ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(56, 189, 248, 0.25)'
                            }}>
                              {room.bed_orientation.startsWith('horizontal') ? '↔ HORIZONTAL' : '↕ TEGAK'}
                            </span>
                          )}
                        </span>
                        
                        {/* Extracted Color Palette Dots */}
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: isLight ? '#64748b' : '#94a3b8' }}>Palet:</span>
                          <span 
                            style={{ 
                              display: 'inline-block', 
                              width: '12px', 
                              height: '12px', 
                              borderRadius: '3px', 
                              background: room.cv_features?.blanket_hex || '#cbd5e1', 
                              border: '1px solid rgba(255,255,255,0.4)'
                            }} 
                            title={`Warna Sprei: ${room.cv_features?.blanket_hex}`} 
                          />
                          <span 
                            style={{ 
                              display: 'inline-block', 
                              width: '12px', 
                              height: '12px', 
                              borderRadius: '3px', 
                              background: room.cv_features?.floor_hex || '#64748b', 
                              border: '1px solid rgba(255,255,255,0.4)'
                            }} 
                            title={`Warna Lantai: ${room.cv_features?.floor_hex}`} 
                          />
                        </div>
                      </div>

                      {/* Amenity Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {room.furnitures.map((f, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: isMobile ? '0.65rem' : '0.7rem',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
                              color: isLight ? '#475569' : '#cbd5e1',
                              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                              fontWeight: 600
                            }}
                          >
                            ✓ {f.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Action & Inspection Button */}
                    <button
                      type="button"
                      onClick={() => { setSelectedRoomModal(room); setModalTab('cad'); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: isMobile ? '8px 12px' : '10px 16px',
                        borderRadius: '11px',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        background: isLight ? '#f0f9ff' : 'rgba(56, 189, 248, 0.08)',
                        color: '#38bdf8',
                        fontSize: isMobile ? '0.78rem' : '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Maximize size={14} />
                      {isMobile ? 'Inspeksi CAD & Foto HD' : 'Inspeksi CAD Presisi Tinggi & Komparasi HD'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: isMobile ? '8px' : '14px', 
              marginTop: isMobile ? '1.5rem' : '2.5rem',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: isMobile ? '7px 12px' : '9px 18px',
                  borderRadius: '10px',
                  background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
                  fontSize: isMobile ? '0.76rem' : '0.84rem'
                }}
              >
                <ChevronLeft size={isMobile ? 14 : 16} /> Sebelumnya
              </button>

              <span style={{ 
                fontSize: isMobile ? '0.76rem' : '0.88rem', 
                fontWeight: 800, 
                color: '#38bdf8', 
                fontFamily: 'monospace',
                padding: isMobile ? '5px 10px' : '6px 14px',
                borderRadius: '8px',
                background: isLight ? '#f1f5f9' : 'rgba(0, 0, 0, 0.4)'
              }}>
                Hal {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: isMobile ? '7px 12px' : '9px 18px',
                  borderRadius: '10px',
                  background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
                  fontSize: isMobile ? '0.76rem' : '0.84rem'
                }}
              >
                Berikutnya <ChevronRight size={isMobile ? 14 : 16} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Luxury Architectural CAD Inspection Modal */}
      {selectedRoomModal && (
        <div 
          onClick={() => setSelectedRoomModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.88)',
            backdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '10px' : '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '1080px',
              width: '100%',
              background: '#090e17',
              borderRadius: isMobile ? '16px' : '24px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: isMobile ? '1rem' : '1.75rem',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              maxHeight: '94vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '8px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: '#ffffff' }}>
                    Unit {selectedRoomModal.room_number} • {selectedRoomModal.room_code}
                  </h3>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    CAD 1:50
                  </span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: isMobile ? '0.76rem' : '0.85rem', color: '#94a3b8' }}>
                  {selectedRoomModal.type_name} • <strong>{selectedRoomModal.dimensions} ({selectedRoomModal.area_m2} m²)</strong> • {selectedRoomModal.bathroom_type}
                  {selectedRoomModal.bed_orientation && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: selectedRoomModal.bed_orientation.startsWith('horizontal') ? 'rgba(234, 179, 8, 0.18)' : 'rgba(56, 189, 248, 0.15)',
                      color: selectedRoomModal.bed_orientation.startsWith('horizontal') ? '#facc15' : '#38bdf8',
                      border: selectedRoomModal.bed_orientation.startsWith('horizontal') ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      {selectedRoomModal.bed_orientation.startsWith('horizontal') ? '↔ KASUR HORIZONTAL' : '↕ KASUR TEGAK'}
                    </span>
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <a
                  href={`/downloads/blueprints/${selectedRoomModal.blueprint_file}`}
                  download={selectedRoomModal.blueprint_file}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    padding: isMobile ? '6px 10px' : '8px 14px',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.72rem' : '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Download size={13} />
                  {isMobile ? 'SVG' : 'Unduh CAD SVG'}
                </a>

                <button 
                  type="button"
                  onClick={() => setSelectedRoomModal(null)}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.08)', 
                    border: '1px solid rgba(255, 255, 255, 0.12)', 
                    color: '#94a3b8', 
                    borderRadius: '8px', 
                    padding: isMobile ? '6px' : '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer' 
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Tab Switcher on Mobile */}
            {isMobile && (
              <div style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '3px',
                gap: '3px',
                marginBottom: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setModalTab('cad')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: 'none',
                    background: modalTab === 'cad' ? '#2563eb' : 'transparent',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📐 CAD 2D
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('photo')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: 'none',
                    background: modalTab === 'photo' ? '#2563eb' : 'transparent',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📸 Foto Real
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('split')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: 'none',
                    background: modalTab === 'split' ? '#2563eb' : 'transparent',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⚖️ Keduanya
                </button>
              </div>
            )}

            {/* Modal Image View */}
            {(!isMobile || modalTab === 'split') ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '10px' : '16px',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#4ade80', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    📸 Foto Real Web Kamar Tidur
                  </div>
                  <div style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#040711',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    aspectRatio: isMobile ? '4/3' : '16/11'
                  }}>
                    <img 
                      src={`/downloads/photos/${selectedRoomModal.photo_file}`} 
                      alt="Foto Real" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    📐 Denah Vektor CAD Arsitektural (Skala 1:50)
                  </div>
                  <div style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#090e17',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    aspectRatio: isMobile ? '4/3' : '16/11'
                  }}>
                    <img 
                      src={`/downloads/blueprints/${selectedRoomModal.blueprint_file}`} 
                      alt="Denah CAD" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                </div>
              </div>
            ) : modalTab === 'cad' ? (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                  📐 Denah Vektor CAD Arsitektural (Skala 1:50)
                </div>
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#090e17',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  aspectRatio: '4/3',
                  maxHeight: '55vh'
                }}>
                  <img 
                    src={`/downloads/blueprints/${selectedRoomModal.blueprint_file}`} 
                    alt="Denah CAD" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#4ade80', marginBottom: '6px' }}>
                  📸 Foto Real Web Kamar Tidur
                </div>
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#040711',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  aspectRatio: '4/3',
                  maxHeight: '55vh'
                }}>
                  <img 
                    src={`/downloads/photos/${selectedRoomModal.photo_file}`} 
                    alt="Foto Real" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </div>
            )}

            {/* Precision Ground Truth & Computer Vision Audit Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile ? '8px' : '12px',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: isMobile ? '10px 12px' : '14px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Konfigurasi Kasur</div>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  {selectedRoomModal.bed_label}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Kamar Mandi</div>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: 800, color: selectedRoomModal.has_bathroom ? '#34d399' : '#fbbf24', marginTop: '2px' }}>
                  {selectedRoomModal.bathroom_type}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Sudut Unsure</div>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: 800, color: selectedRoomModal.unsure_zone ? '#fb7185' : '#38bdf8', marginTop: '2px' }}>
                  {selectedRoomModal.unsure_zone ? '🌫️ Dibuat Blur' : '✓ 100% Terlihat'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Akurasi &amp; Latensi</div>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: 800, color: '#4ade80', marginTop: '2px' }}>
                  {selectedRoomModal.confidence_pct}% • {selectedRoomModal.latency_ms}ms
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
