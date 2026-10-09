import React from 'react';
import { X, Ruler, Sparkles, Bed, Info } from 'lucide-react';
import RoomFloorPlanViewer from './RoomFloorPlanViewer';

/**
 * FloorPlanModal
 * Modal pratinjau arsitektur denah 2D dan potongan isometrik 3D kamar kost.
 */
export default function FloorPlanModal({ isOpen, onClose, kost }) {
  if (!isOpen || !kost) return null;

  const room = kost.rooms?.[0] || {};
  const dimensions = room.dimension || '3.5m x 4.0m';
  const bedType = room.bedType || 'super_single';
  
  // Extract furniture list from facilities
  const facilities = (kost.facilities || []).map(f => f.toLowerCase());
  const furnitures = ['wardrobe', 'desk', 'window'];
  if (facilities.some(f => f.includes('ac'))) furnitures.push('ac');
  if (facilities.some(f => f.includes('mandi') || f.includes('km'))) furnitures.push('bathroom');
  if (facilities.some(f => f.includes('kulkas'))) furnitures.push('fridge');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#0F172A',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '24px',
        maxWidth: '860px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(37, 99, 235, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(30, 41, 59, 0.6)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(37, 99, 235, 0.2)',
                color: '#60A5FA',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                📐 BluePrint 2D & 3D
              </span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                {kost.kostName}
              </h3>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
              Dimensi Standar: <strong>{dimensions}</strong> • Kamar No. {room.number || '101'}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto' }}>
          <RoomFloorPlanViewer
            dimensions={dimensions}
            bedType={bedType}
            furnitures={furnitures}
            roomNumber={room.number || '101'}
            kostName={kost.kostName}
            initialView="2d"
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(30, 41, 59, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: '#94A3B8'
        }}>
          <span>
            💡 Denah memvisualisasikan sirkulasi udara, posisi stopkontak, dan pintu kamar mandi.
          </span>
          <button
            onClick={onClose}
            type="button"
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              background: '#2563EB',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
}
