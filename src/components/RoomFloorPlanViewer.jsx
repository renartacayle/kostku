import React, { useState } from 'react';
import { 
  Maximize2, 
  Layers, 
  Sun, 
  Moon, 
  RotateCw, 
  Compass, 
  Bed, 
  Sparkles, 
  Check, 
  Grid,
  Info
} from 'lucide-react';

/**
 * RoomFloorPlanViewer
 * Renders high-precision architectural 2D Blueprint and Isometric 3D Room Cutaway.
 * Props:
 * - dimensions: string (e.g. '3.0m x 4.0m')
 * - bedType: 'single' | 'super_single' | 'queen' | 'king'
 * - furnitures: array of string ids ('wardrobe', 'desk', 'bathroom', 'ac', 'window', 'fridge')
 * - roomNumber: string (e.g. '101')
 * - kostName: string
 * - initialView: '2d' | '3d'
 */
export default function RoomFloorPlanViewer({
  dimensions = '3.0m x 4.0m',
  bedType = 'super_single',
  furnitures = ['wardrobe', 'desk', 'bathroom', 'ac', 'window'],
  roomNumber = '101',
  kostName = 'KostKu Room',
  initialView = '2d'
}) {
  const [viewMode, setViewMode] = useState(initialView); // '2d' or '3d'
  const [perspective, setPerspective] = useState('isometric_right'); // 'isometric_right', 'isometric_left', 'top_down', 'front'
  const [lighting, setLighting] = useState('day'); // 'day' or 'night'
  const [showGrid, setShowGrid] = useState(true);

  // Parse dimension numbers
  const match = dimensions.match(/([\d.]+)\s*m?\s*[xX*]\s*([\d.]+)/);
  const widthM = match ? parseFloat(match[1]) : 3.0;
  const lengthM = match ? parseFloat(match[2]) : 4.0;
  const areaM2 = (widthM * lengthM).toFixed(1);

  const hasBathroom = furnitures.includes('bathroom');
  const hasWardrobe = furnitures.includes('wardrobe');
  const hasDesk = furnitures.includes('desk');
  const hasAc = furnitures.includes('ac');
  const hasWindow = furnitures.includes('window');
  const hasFridge = furnitures.includes('fridge');

  // Bed configuration mapping
  const bedConfig = {
    single: { width: 90, label: 'Single (90x200 cm)', pillows: 1, bolsters: 1, svgW: 75, svgL: 140 },
    super_single: { width: 120, label: 'Super Single (120x200 cm)', pillows: 1, bolsters: 1, svgW: 95, svgL: 140 },
    queen: { width: 160, label: 'Queen Bed (160x200 cm)', pillows: 2, bolsters: 2, svgW: 125, svgL: 140 },
    king: { width: 180, label: 'King Bed (180x200 cm)', pillows: 2, bolsters: 2, svgW: 145, svgL: 140 }
  }[bedType] || { width: 120, label: 'Super Single (120x200 cm)', pillows: 1, bolsters: 1, svgW: 95, svgL: 140 };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      overflow: 'hidden',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ── Top Bar Toolbar ─────────────────────────────────────────── */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        {/* View Mode Toggle: 2D vs 3D */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '12px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              border: 'none',
              background: viewMode === '2d' ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'transparent',
              color: viewMode === '2d' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Grid size={15} /> 📐 Denah 2D Arsitektural
          </button>

          <button
            type="button"
            onClick={() => setViewMode('3d')}
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              border: 'none',
              background: viewMode === '3d' ? '#2563eb' : 'transparent',
              boxShadow: viewMode === '3d' ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none',
              color: viewMode === '3d' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={15} /> 🏠 Denah 3D Isometrik
          </button>
        </div>

        {/* View-Specific Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {viewMode === '3d' ? (
            <>
              {/* Lighting Mode: Day / Night */}
              <button
                type="button"
                onClick={() => setLighting(lighting === 'day' ? 'night' : 'day')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: lighting === 'day' ? '#fbbf24' : '#818cf8',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
                title="Ganti Mode Pencahayaan Ruangan"
              >
                {lighting === 'day' ? <Sun size={14} /> : <Moon size={14} />}
                {lighting === 'day' ? 'Siang' : 'Malam Cozy'}
              </button>

              {/* Angle Switcher */}
              <select
                value={perspective}
                onChange={e => setPerspective(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="isometric_right">Sudut Isometrik Kanan</option>
                <option value="isometric_left">Sudut Isometrik Kiri</option>
                <option value="top_down">Tampak Atas 45°</option>
                <option value="front">Tampak Depan</option>
              </select>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              style={{
                background: showGrid ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: showGrid ? '#60a5fa' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              <Grid size={14} /> Grid Arsitek {showGrid ? 'Aktif' : 'Off'}
            </button>
          )}
        </div>
      </div>

      {/* ── Main Canvas Area ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        minHeight: '380px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: viewMode === '2d' 
          ? '#0b1329' 
          : lighting === 'day' 
            ? 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0a0f1d 100%)' 
            : 'radial-gradient(circle at 50% 30%, #13192e 0%, #060913 100%)'
      }}>
        {viewMode === '2d' ? (
          /* ═══════════════════════════════════════════════════════════════════
             2D ARCHITECTURAL BLUEPRINT (SVG HIGH PRECISION)
             ═══════════════════════════════════════════════════════════════════ */
          <svg 
            width="100%" 
            height="auto" 
            viewBox="0 0 620 400" 
            style={{ 
              maxWidth: '580px', 
              aspectRatio: '620 / 400',
              filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))' 
            }}
          >
            <defs>
              {/* Architectural Grid Pattern */}
              <pattern id="archGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.07)" strokeWidth="0.8" />
              </pattern>
              <pattern id="archGridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(56, 189, 248, 0.16)" strokeWidth="1.2" />
              </pattern>

              {/* Bathroom Tile Pattern */}
              <pattern id="tilePattern" width="12" height="12" patternUnits="userSpaceOnUse">
                <rect width="12" height="12" fill="rgba(14, 165, 233, 0.12)" />
                <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="0.7" />
              </pattern>
            </defs>

            {/* Background Grid */}
            {showGrid && (
              <>
                <rect width="620" height="400" fill="url(#archGrid)" />
                <rect width="620" height="400" fill="url(#archGridMajor)" />
              </>
            )}

            {/* ── Room Outer Boundary Dimensions ──────────────────── */}
            {/* Main Bedroom Box: x=80, y=50, w=460, h=300 */}
            
            {/* Dimension Lines (Top width) */}
            <g stroke="#38bdf8" strokeWidth="1" opacity="0.85">
              <line x1="80" y1="28" x2="540" y2="28" />
              <line x1="80" y1="22" x2="80" y2="34" />
              <line x1="540" y1="22" x2="540" y2="34" />
              <text x="310" y="22" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                LEBAR: {widthM.toFixed(2)} m
              </text>
            </g>

            {/* Dimension Lines (Left length) */}
            <g stroke="#38bdf8" strokeWidth="1" opacity="0.85">
              <line x1="56" y1="50" x2="56" y2="350" />
              <line x1="50" y1="50" x2="62" y2="50" />
              <line x1="50" y1="350" x2="62" y2="350" />
              <text x="46" y="205" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="monospace" transform="rotate(-90 46 205)">
                PANJANG: {lengthM.toFixed(2)} m
              </text>
            </g>

            {/* ── Outer Concrete Walls (14px thickness) ─────────────── */}
            <rect x="80" y="50" width="460" height="300" fill="#0f1d38" stroke="#38bdf8" strokeWidth="8" rx="2" />

            {/* ── Floor Parquet / Space Area ────────────────────────── */}
            <rect x="86" y="56" width="448" height="288" fill="rgba(15, 23, 42, 0.85)" />

            {/* ── Ensuite Bathroom (Kamar Mandi Dalam) ──────────────── */}
            {hasBathroom ? (
              <g>
                {/* Bathroom Walls: Top Left Corner */}
                <rect x="86" y="56" width="140" height="130" fill="url(#tilePattern)" stroke="#0284c7" strokeWidth="5" />
                <text x="156" y="90" fill="#38bdf8" fontSize="11" fontWeight="800" textAnchor="middle">
                  KM / WC
                </text>
                <text x="156" y="104" fill="#94a3b8" fontSize="8.5" textAnchor="middle">
                  (1.5m x 1.4m)
                </text>

                {/* Toilet Bowl & Tank */}
                <rect x="94" y="66" width="30" height="16" rx="3" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
                <ellipse cx="109" cy="94" rx="13" ry="15" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.5" />

                {/* Shower Area */}
                <rect x="160" y="66" width="56" height="56" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="188" cy="94" r="8" fill="#38bdf8" opacity="0.3" />
                <circle cx="188" cy="94" r="3" fill="#0284c7" />

                {/* Bathroom Door with Swing Arc */}
                <path d="M 180 186 A 35 35 0 0 1 215 151" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="180" y1="186" x2="215" y2="186" stroke="#e0f2fe" strokeWidth="3" />
              </g>
            ) : null}

            {/* ── Kasur Sesuai Ukuran (Bed Position: Top Right) ─────── */}
            <g>
              {/* Bed Outer Frame (Springbed Divan) */}
              <rect 
                x={540 - bedConfig.svgW - 20} 
                y="60" 
                width={bedConfig.svgW} 
                height={bedConfig.svgL} 
                rx="6" 
                fill="#1e293b" 
                stroke="#60a5fa" 
                strokeWidth="2.5" 
              />

              {/* Wooden Headboard */}
              <rect 
                x={540 - bedConfig.svgW - 20} 
                y="54" 
                width={bedConfig.svgW} 
                height="10" 
                rx="2" 
                fill="#935a26" 
                stroke="#d97706" 
                strokeWidth="1.5" 
              />

              {/* Mattress Surface */}
              <rect 
                x={540 - bedConfig.svgW - 16} 
                y="66" 
                width={bedConfig.svgW - 8} 
                height={bedConfig.svgL - 14} 
                rx="4" 
                fill="#f8fafc" 
                stroke="#cbd5e1" 
                strokeWidth="1" 
              />

              {/* Blanket / Quilt Drape */}
              <rect 
                x={540 - bedConfig.svgW - 16} 
                y="115" 
                width={bedConfig.svgW - 8} 
                height={bedConfig.svgL - 63} 
                rx="3" 
                fill="#3b82f6" 
                opacity="0.8" 
              />
              <path 
                d={`M ${540 - bedConfig.svgW - 16} 115 Q ${540 - (bedConfig.svgW/2) - 20} 123 ${540 - 24} 115`} 
                fill="none" 
                stroke="#1d4ed8" 
                strokeWidth="2" 
              />

              {/* Pillows */}
              {bedConfig.pillows === 1 ? (
                <rect 
                  x={540 - (bedConfig.svgW/2) - 34} 
                  y="72" 
                  width="48" 
                  height="26" 
                  rx="6" 
                  fill="#ffffff" 
                  stroke="#94a3b8" 
                  strokeWidth="1.5" 
                />
              ) : (
                <>
                  <rect 
                    x={540 - bedConfig.svgW - 12} 
                    y="72" 
                    width={(bedConfig.svgW/2) - 10} 
                    height="26" 
                    rx="5" 
                    fill="#ffffff" 
                    stroke="#94a3b8" 
                    strokeWidth="1.5" 
                  />
                  <rect 
                    x={540 - (bedConfig.svgW/2) + 2} 
                    y="72" 
                    width={(bedConfig.svgW/2) - 10} 
                    height="26" 
                    rx="5" 
                    fill="#ffffff" 
                    stroke="#94a3b8" 
                    strokeWidth="1.5" 
                  />
                </>
              )}

              {/* Bolsters (Guling) */}
              <ellipse 
                cx={540 - (bedConfig.svgW/2) - 20} 
                cy="115" 
                rx="8" 
                ry="22" 
                fill="#f1f5f9" 
                stroke="#94a3b8" 
                strokeWidth="1" 
              />

              {/* Bed Label */}
              <text 
                x={540 - (bedConfig.svgW/2) - 20} 
                y="160" 
                fill="#ffffff" 
                fontSize="9" 
                fontWeight="800" 
                textAnchor="middle"
              >
                {bedConfig.label.split(' ')[0].toUpperCase()}
              </text>
            </g>

            {/* Bedside Table (Nakas) */}
            <rect x={540 - bedConfig.svgW - 55} y="62" width="28" height="30" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <circle cx={540 - bedConfig.svgW - 41} cy="77" r="6" fill="#f59e0b" opacity="0.6" />

            {/* ── Lemari Pakaian (Wardrobe: Bottom Right) ───────────── */}
            {hasWardrobe && (
              <g>
                <rect x="420" y="275" width="114" height="48" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <line x1="477" y1="275" x2="477" y2="323" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Door Handles */}
                <circle cx="473" cy="299" r="2" fill="#38bdf8" />
                <circle cx="481" cy="299" r="2" fill="#38bdf8" />
                <text x="477" y="316" fill="#94a3b8" fontSize="8" fontWeight="700" textAnchor="middle">
                  LEMARI 2 PINTU
                </text>
              </g>
            )}

            {/* ── Meja Kerja & Kursi Ergonomis (Study Desk: Bottom Left) */}
            {hasDesk && (
              <g>
                {/* Desk Surface */}
                <rect x="96" y="275" width="105" height="50" rx="4" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
                {/* Laptop on desk */}
                <rect x="133" y="282" width="28" height="18" rx="2" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
                <rect x="136" y="285" width="22" height="12" fill="#38bdf8" opacity="0.7" />
                {/* Desk Lamp */}
                <circle cx="112" cy="289" r="5" fill="#fbbf24" opacity="0.8" />
                {/* Ergonomic Chair */}
                <ellipse cx="147" cy="336" rx="14" ry="11" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
                <path d="M 137 342 C 147 345 157 342 157 342" stroke="#60a5fa" strokeWidth="2" fill="none" />
                <text x="147" y="316" fill="#cbd5e1" fontSize="8" fontWeight="700" textAnchor="middle">
                  MEJA KERJA
                </text>
              </g>
            )}

            {/* ── AC Dinding (Wall Air Conditioner) ─────────────────── */}
            {hasAc && (
              <g>
                <rect x="290" y="52" width="70" height="14" rx="2" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />
                {/* Cool air flow dashed lines */}
                <path d="M 298 66 L 294 76" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
                <path d="M 325 66 L 325 78" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
                <path d="M 352 66 L 356 76" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
                <text x="325" y="62" fill="#0284c7" fontSize="7.5" fontWeight="800" textAnchor="middle">
                  AC 1 PK
                </text>
              </g>
            )}

            {/* ── Kulkas Mini (Fridge: Optional) ────────────────────── */}
            {hasFridge && (
              <g>
                <rect x="220" y="285" width="36" height="38" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="226" cy="304" r="2" fill="#38bdf8" />
                <text x="238" y="318" fill="#94a3b8" fontSize="7" fontWeight="700" textAnchor="middle">KULKAS</text>
              </g>
            )}

            {/* ── Jendela Luar (Window: Top Center/Right) ─────────────── */}
            {hasWindow && (
              <g>
                <rect x="385" y="46" width="60" height="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <line x1="385" y1="50" x2="445" y2="50" stroke="#ffffff" strokeWidth="1.5" />
                <text x="415" y="42" fill="#38bdf8" fontSize="8" fontWeight="700" textAnchor="middle">
                  JENDELA
                </text>
              </g>
            )}

            {/* ── Pintu Utama Kamar (Main Door: Bottom Center) ──────── */}
            <g>
              {/* Door Opening Gap */}
              <rect x="280" y="342" width="55" height="16" fill="#0f1d38" />
              {/* Door Swing Arc (90 degrees) */}
              <path d="M 280 346 A 48 48 0 0 1 328 298" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Door Leaf */}
              <line x1="280" y1="346" x2="280" y2="298" stroke="#f8fafc" strokeWidth="3.5" strokeLinecap="round" />
              <text x="312" y="365" fill="#38bdf8" fontSize="8.5" fontWeight="800" textAnchor="middle">
                PINTU MASUK
              </text>
            </g>

            {/* ── Room Center Label & Compass ───────────────────────── */}
            <g>
              <rect x="270" y="180" width="120" height="42" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
              <text x="330" y="198" fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle">
                KAMAR {roomNumber}
              </text>
              <text x="330" y="213" fill="#38bdf8" fontSize="9.5" fontWeight="600" textAnchor="middle">
                LUAS: {areaM2} m² ({widthM} x {lengthM}m)
              </text>
            </g>

            {/* North Compass Arrow */}
            <g transform="translate(560, 310)">
              <circle cx="16" cy="16" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <path d="M 16 6 L 21 16 L 16 13 L 11 16 Z" fill="#ef4444" />
              <path d="M 16 26 L 21 16 L 16 19 L 11 16 Z" fill="#94a3b8" />
              <text x="16" y="5" fill="#ef4444" fontSize="8" fontWeight="800" textAnchor="middle">U</text>
            </g>
          </svg>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             3D ISOMETRIC ROOM CUTAWAY (PERSPECTIVE 3D VISUALIZATION)
             ═══════════════════════════════════════════════════════════════════ */
          <div style={{
            width: '100%',
            maxWidth: '560px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* 3D Isometric SVG Model */}
            <svg 
              width="100%" 
              height="auto" 
              viewBox="0 0 600 420" 
              style={{ 
                maxWidth: '560px', 
                aspectRatio: '600 / 420',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))'
              }}
            >
              <defs>
                {/* 3D Parquet Floor Texture */}
                <pattern id="parquet3D" width="40" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                  <rect width="40" height="20" fill={lighting === 'day' ? '#b45309' : '#78350f'} />
                  <line x1="0" y1="10" x2="40" y2="10" stroke={lighting === 'day' ? '#92400e' : '#451a03'} strokeWidth="1" />
                  <line x1="20" y1="0" x2="20" y2="10" stroke={lighting === 'day' ? '#92400e' : '#451a03'} strokeWidth="1" />
                  <line x1="0" y1="10" x2="0" y2="20" stroke={lighting === 'day' ? '#92400e' : '#451a03'} strokeWidth="1" />
                </pattern>

                {/* Warm Lighting Gradient for Lamp */}
                <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>

                {/* Window Sunlight Cast */}
                <linearGradient id="sunbeam" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* ── 3D Isometric Floor Slab ─────────────────────────── */}
              {/* Floor Rhombus: Center (300, 280), Top(300, 160), Right(520, 260), Bottom(300, 360), Left(80, 260) */}
              
              {/* Floor Slab Thickness */}
              <path d="M 80 260 L 300 360 L 300 375 L 80 275 Z" fill="#1e293b" />
              <path d="M 300 360 L 520 260 L 520 275 L 300 375 Z" fill="#0f172a" />

              {/* Parquet Floor Base */}
              <polygon points="300,160 520,260 300,360 80,260" fill="url(#parquet3D)" stroke="#92400e" strokeWidth="1" />

              {/* Sunlight Beam Streaming from Window */}
              {hasWindow && lighting === 'day' && (
                <polygon points="410,140 500,180 430,300 320,250" fill="url(#sunbeam)" />
              )}

              {/* ── 3D Back Left Wall (Tall Architectural Cutaway) ──── */}
              <polygon points="80,260 300,160 300,40 80,140" fill={lighting === 'day' ? '#334155' : '#1e293b'} stroke="#475569" strokeWidth="1.5" />
              
              {/* ── 3D Back Right Wall ──────────────────────────────── */}
              <polygon points="300,160 520,260 520,140 300,40" fill={lighting === 'day' ? '#1e293b' : '#0f172a'} stroke="#334155" strokeWidth="1.5" />

              {/* Wall Baseboards */}
              <path d="M 80 260 L 300 160 L 520 260" fill="none" stroke="#64748b" strokeWidth="3" />

              {/* ── 3D Window on Back Right Wall ────────────────────── */}
              {hasWindow && (
                <g>
                  {/* Window Cutout on Right Wall */}
                  <polygon points="380,105 470,145 470,195 380,155" fill="#38bdf8" opacity={lighting === 'day' ? 0.85 : 0.25} stroke="#e2e8f0" strokeWidth="2" />
                  <line x1="425" y1="125" x2="425" y2="175" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="380" y1="130" x2="470" y2="170" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              )}

              {/* ── 3D Wall AC Unit ─────────────────────────────────── */}
              {hasAc && (
                <g>
                  <polygon points="200,95 270,63 270,78 200,110" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <polygon points="270,63 285,70 285,85 270,78" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                  {/* Status LED */}
                  <circle cx="210" cy="103" r="2" fill="#38bdf8" />
                </g>
              )}

              {/* ── 3D Ensuite Bathroom (Glass Partition in Corner) ─── */}
              {hasBathroom && (
                <g>
                  {/* Glass Wall Partition Left */}
                  <polygon points="170,220 220,195 220,110 170,135" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Modern Toilet 3D */}
                  <ellipse cx="140" cy="210" rx="12" ry="7" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="130" y="195" width="20" height="12" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                  {/* Shower Head 3D */}
                  <path d="M 180 140 L 195 147 L 195 155" fill="none" stroke="#38bdf8" strokeWidth="2" />
                  <circle cx="195" cy="155" r="4" fill="#0284c7" />
                </g>
              )}

              {/* ── 3D Bed Model (Positioned on the Right) ───────────── */}
              <g>
                {/* 3D Bed Frame / Divan */}
                <polygon points="330,175 435,222 360,265 255,218" fill="#5c3818" stroke="#78350f" strokeWidth="1.5" />
                
                {/* 3D Headboard */}
                <polygon points="325,172 430,220 430,175 325,127" fill="#78350f" stroke="#92400e" strokeWidth="1" />

                {/* 3D Mattress */}
                <polygon points="328,168 430,215 355,258 253,211" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                <polygon points="253,211 355,258 355,268 253,221" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                <polygon points="355,258 430,215 430,225 355,268" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

                {/* 3D Blanket / Duvet */}
                <polygon points="295,215 397,262 355,258 253,211" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
                <polygon points="253,211 355,258 355,268 253,221" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1" />

                {/* 3D Pillows */}
                <polygon points="340,165 385,185 365,195 320,175" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                {bedConfig.pillows > 1 && (
                  <polygon points="380,183 425,203 405,213 360,193" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                )}

                {/* 3D Bedside Nightstand & Lamp */}
                <polygon points="225,205 255,190 255,165 225,180" fill="#451a03" stroke="#78350f" strokeWidth="1" />
                {/* Lamp on Nightstand */}
                <circle cx="240" cy="170" r="14" fill="url(#lampGlow)" />
                <cylinder cx="240" cy="170" r="4" fill="#fbbf24" />
              </g>

              {/* ── 3D Study Desk & Ergonomic Chair ─────────────────── */}
              {hasDesk && (
                <g>
                  {/* Desk Tabletop */}
                  <polygon points="120,240 180,210 200,220 140,250" fill="#78350f" stroke="#92400e" strokeWidth="1" />
                  {/* Desk Legs */}
                  <line x1="120" y1="240" x2="120" y2="265" stroke="#1e293b" strokeWidth="2.5" />
                  <line x1="140" y1="250" x2="140" y2="275" stroke="#1e293b" strokeWidth="2.5" />
                  <line x1="200" y1="220" x2="200" y2="245" stroke="#1e293b" strokeWidth="2.5" />
                  {/* 3D Laptop with Glowing Screen */}
                  <polygon points="150,225 170,215 170,205 150,215" fill="#38bdf8" opacity="0.9" stroke="#0284c7" strokeWidth="1" />
                  <polygon points="148,226 168,216 175,220 155,230" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                  {/* 3D Swivel Chair */}
                  <ellipse cx="170" cy="255" rx="10" ry="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                </g>
              )}

              {/* ── 3D Wardrobe (Lemari Pakaian) ────────────────────── */}
              {hasWardrobe && (
                <g>
                  {/* Wardrobe Body: Back Corner */}
                  <polygon points="460,230 500,210 500,120 460,140" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <polygon points="460,140 500,120 480,110 440,130" fill="#334155" stroke="#475569" strokeWidth="1" />
                  <polygon points="440,130 460,140 460,230 440,220" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  {/* Handles */}
                  <circle cx="452" cy="175" r="1.5" fill="#38bdf8" />
                  <circle cx="456" cy="173" r="1.5" fill="#38bdf8" />
                </g>
              )}

              {/* ── Floor Marker & Spec Badge ───────────────────────── */}
              <g transform="translate(300, 310)">
                <ellipse cx="0" cy="0" rx="45" ry="16" fill="rgba(15, 23, 42, 0.7)" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
                <text x="0" y="4" fill="#38bdf8" fontSize="10" fontWeight="800" textAnchor="middle">
                  3D ISOMETRIK
                </text>
              </g>
            </svg>

            {/* Quick Interactive Angle Controls */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginTop: '10px',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '4px',
              borderRadius: '12px'
            }}>
              {[
                { id: 'isometric_right', label: 'Sudut Kanan' },
                { id: 'isometric_left', label: 'Sudut Kiri' },
                { id: 'top_down', label: 'Atas 45°' },
                { id: 'front', label: 'Depan' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPerspective(item.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: perspective === item.id ? '#3b82f6' : 'transparent',
                    color: perspective === item.id ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Specs & Furniture Legend ──────────────────────────── */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
              Spesifikasi Kamar {roomNumber}
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
              {bedConfig.label}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Dimensi: <strong style={{ color: '#e2e8f0' }}>{widthM}m x {lengthM}m</strong> ({areaM2} m²) • {kostName}
          </span>
        </div>

        {/* Feature Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {hasBathroom && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
              🚿 KM Dalam
            </span>
          )}
          {hasAc && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              ❄️ AC
            </span>
          )}
          {hasDesk && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              💻 Meja Kerja
            </span>
          )}
          {hasWardrobe && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              🚪 Lemari
            </span>
          )}
          {hasWindow && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              🪟 Jendela
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
