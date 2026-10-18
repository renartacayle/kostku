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
 * Renders high-precision architectural 2D Blueprint.
 * Props:
 * - dimensions: string (e.g. '3.0m x 4.0m')
 * - bedType: 'single' | 'super_single' | 'queen' | 'king'
 * - furnitures: array of string ids ('wardrobe', 'desk', 'bathroom', 'ac', 'window', 'fridge')
 * - roomNumber: string (e.g. '101')
 * - kostName: string
 * - initialView: '2d'
 */
export default function RoomFloorPlanViewer({
  dimensions = '3.0m x 4.0m',
  bedType = 'super_single',
  furnitures = ['wardrobe', 'desk', 'bathroom', 'ac', 'window'],
  roomNumber = '101',
  kostName = 'KostKu Room'
}) {
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
        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '6px 14px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Grid size={15} /> 📐 Denah 2D Arsitektural
          </span>
        </div>

        {/* 2D Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        background: '#0b1329'
      }}>
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
