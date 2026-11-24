import React from 'react';
import { X } from 'lucide-react';
import RoomFloorPlanViewer from './RoomFloorPlanViewer';

/**
 * FloorPlanModal
 * Modal pratinjau arsitektur denah 2D presisi kamar kost beserta foto pembanding.
 */
export default function FloorPlanModal({
  isOpen,
  onClose,
  kost,
  selectedRoomNumber = null,
  resolvedFloorPlan = null,
  activeRoomPhoto = null
}) {
  if (!isOpen || !kost) return null;

  const room = (selectedRoomNumber && kost.rooms?.find(r => r.number === selectedRoomNumber)) || kost.rooms?.[0] || {};
  const rawSize = room.size || room.dimension || '3.5m x 4.0m';
  const dimensions = rawSize.includes('x') && !rawSize.includes('m') ? rawSize.replace('x', 'm x ') + 'm' : rawSize;
  const bedType = resolvedFloorPlan?.bedType || room.floorPlan?.bedType || room.bedType || 'super_single';

  const rawFacilities = [
    ...(kost.facilities || []),
    ...(kost.features || []),
    ...(room.facilities || [])
  ].map(f => String(f).toLowerCase());

  const hasOutsideBm = rawFacilities.some(f =>
    f.includes('km luar') || f.includes('kamar mandi luar') || f.includes('mandi luar') || f.includes('shared bath') || f.includes('kamar mandi bersama') || f.includes('km bersama')
  );
  const hasEnsuiteBm = !hasOutsideBm && rawFacilities.some(f =>
    f.includes('km dalam') || f.includes('kamar mandi dalam') || f.includes('ensuite') || f.includes('water heater') || f.includes('bathtub')
  );

  const defaultFurnitures = ['wardrobe', 'desk', 'window'];
  if (rawFacilities.some(f => f.includes('ac'))) defaultFurnitures.push('ac');
  if (hasEnsuiteBm) defaultFurnitures.push('bathroom');
  if (rawFacilities.some(f => f.includes('kulkas') || f.includes('fridge'))) defaultFurnitures.push('fridge');

  const floorPlanProp = resolvedFloorPlan || room.floorPlan || kost.floorPlan || {
    dimensions,
    bedType,
    furnitures: defaultFurnitures,
    bathroomCorner: hasEnsuiteBm ? 'top_left' : 'none'
  };

  const photoProp = activeRoomPhoto || room.roomPhoto || room.photo || kost.roomPhoto || kost.images?.[1] || kost.images?.[0] || null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 10000,
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
        maxWidth: '940px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(37, 99, 235, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(30, 41, 59, 0.6)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(37, 99, 235, 0.2)',
                color: '#60A5FA',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                Denah Kamar 2D CAD
              </span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                {kost.kostName}
              </h3>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
              Dimensi: <strong>{floorPlanProp.dimensions || dimensions}</strong> • Kamar No. {room.number || selectedRoomNumber || '101'}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Tutup pratinjau denah"
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
        <div style={{ padding: '1rem', overflowY: 'auto' }}>
          <RoomFloorPlanViewer
            floorPlan={floorPlanProp}
            roomPhoto={photoProp}
            dimensions={floorPlanProp.dimensions || dimensions}
            bedType={bedType}
            furnitures={floorPlanProp.furnitures || defaultFurnitures}
            roomNumber={room.number || selectedRoomNumber || '101'}
            kostName={kost.kostName}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.9rem 1.4rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(30, 41, 59, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '0.78rem',
          color: '#94A3B8'
        }}>
          <span>
            Denah 2D memvisualisasikan orientasi kasur, pencahayaan jendela, status kamar mandi, dan sudut kamera.
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
