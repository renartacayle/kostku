import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Grid,
  Eye,
  EyeOff,
  RotateCw,
  RotateCcw,
  Columns,
  Maximize2,
  Camera,
  Move
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const BED_SPECS = {
  single: { wM: 1.0, lM: 2.0, label: 'SINGLE (100x200)', shortLabel: 'Single (100x200 cm)', defaultPillows: 1 },
  super_single: { wM: 1.2, lM: 2.0, label: 'SUPER SINGLE (120x200)', shortLabel: 'Super Single (120x200 cm)', defaultPillows: 1 },
  double: { wM: 1.4, lM: 2.0, label: 'DOUBLE (140x200)', shortLabel: 'Double (140x200 cm)', defaultPillows: 2 },
  queen: { wM: 1.6, lM: 2.0, label: 'QUEEN (160x200)', shortLabel: 'Queen Bed (160x200 cm)', defaultPillows: 2 },
  king: { wM: 1.8, lM: 2.0, label: 'KING (180x200)', shortLabel: 'King Bed (180x200 cm)', defaultPillows: 2 }
};

const ORIENTATION_CYCLE = ['vertical', 'horizontal_right', 'horizontal_top', 'horizontal_left'];

const ORIENTATION_LABELS = {
  vertical: 'TEGAK',
  horizontal_top: 'HORZ. ATAS',
  horizontal_left: 'HORZ. KIRI',
  horizontal_right: 'HORZ. KANAN'
};

/**
 * RoomFloorPlanViewer
 * Dynamic 1:50 architectural 2D CAD floor plan renderer with side-by-side photo comparison
 * and interactive drag-and-drop calibration when `editable` is enabled.
 */
export default function RoomFloorPlanViewer({
  floorPlan = null,
  roomPhoto = null,
  editable = false,
  onChangeFloorPlan = null,
  dimensions: propDimensions = '3.0m x 4.0m',
  bedType: propBedType = 'super_single',
  furnitures: propFurnitures = ['wardrobe', 'desk', 'bathroom', 'ac', 'window'],
  roomNumber = '101',
  kostName = 'KostKu Room'
}) {
  const { isLight } = useTheme();
  const uid = useId().replace(/:/g, '_');
  const svgRef = useRef(null);

  const [showGrid, setShowGrid] = useState(true);
  const [showCameraOverlay, setShowCameraOverlay] = useState(true);
  const [viewMode, setViewMode] = useState(roomPhoto ? 'split' : 'cad');
  const [isNarrow, setIsNarrow] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false));
  const [selectedItem, setSelectedItem] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [liveDragPos, setLiveDragPos] = useState(null);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const prevRoomPhotoRef = useRef(roomPhoto);
  useEffect(() => {
    if (!roomPhoto && viewMode !== 'cad') {
      setViewMode('cad');
    } else if (roomPhoto && roomPhoto !== prevRoomPhotoRef.current) {
      setViewMode('split');
    }
    prevRoomPhotoRef.current = roomPhoto;
  }, [roomPhoto, viewMode]);

  // Merge floorPlan schema with backward-compatible flat props
  const fp = floorPlan || {};
  const dimensionsStr = fp.dimensions || propDimensions || '3.5m x 4.0m';
  const match = String(dimensionsStr).match(/([\d.]+)\s*m?\s*[xX*]\s*([\d.]+)/);
  const widthM = clamp(match ? parseFloat(match[1]) : 3.5, 2.2, 7.5);
  const lengthM = clamp(match ? parseFloat(match[2]) : 4.0, 2.2, 8.5);
  const areaM2 = (widthM * lengthM).toFixed(1);

  const bedType = fp.bedType && BED_SPECS[fp.bedType] ? fp.bedType : (BED_SPECS[propBedType] ? propBedType : 'super_single');
  const bcfg = BED_SPECS[bedType];
  const pillows = Number(fp.pillows) || bcfg.defaultPillows;
  const bedSide = fp.bedSide || 'center';
  const bedOrientation = fp.bedOrientation || 'vertical';
  const nakasSide = fp.nakasSide || (bedType === 'single' ? 'none' : 'both');
  const windowWall = fp.windowWall || (Array.isArray(fp.furnitures || propFurnitures) && (fp.furnitures || propFurnitures).includes('window') ? 'right' : 'none');
  const doorPosition = fp.doorPosition || 'bottom_center';
  const blanketHex = fp.blanketHex || '#3b82f6';
  const blanketAccent = fp.blanketAccent || '#1e3a8a';
  const floorHex = fp.floorHex || '#334155';
  const floorType = fp.floorType || 'Parquet Wood';
  const furnitures = Array.isArray(fp.furnitures) ? fp.furnitures : (Array.isArray(propFurnitures) ? propFurnitures : []);
  const extraFurniture = Array.isArray(fp.extraFurniture) ? fp.extraFurniture : [];
  const customPositions = fp.customPositions || {};

  const hasBathroom = furnitures.includes('bathroom') && fp.bathroomCorner !== 'none';
  const bathroomCorner = hasBathroom ? (fp.bathroomCorner || 'top_left') : 'none';
  const hasWardrobe = furnitures.includes('wardrobe');
  const hasDesk = furnitures.includes('desk');
  const hasAc = furnitures.includes('ac') && fp.acWall !== 'none';
  const acWall = hasAc ? (fp.acWall || (windowWall === 'top' ? 'right' : 'top')) : 'none';
  const hasWindow = windowWall !== 'none' && furnitures.includes('window') !== false;
  const hasFridge = furnitures.includes('fridge');
  const unsureZone = fp.unsureZone === undefined ? { side: 'left_front', label: 'Area Foyer / Luar Sudut Kamera' } : fp.unsureZone;

  // Architectural drafting canvas: 680 x 480 with proportional clamped scale
  const CANVAS_W = 680;
  const CANVAS_H = 480;
  const SCALE = clamp(Math.min(70, 500 / widthM, 325 / lengthM), 42, 74);
  const rw = Math.round(widthM * SCALE);
  const rh = Math.round(lengthM * SCALE);
  const DRAW_CX = 300;
  const DRAW_CY = 228;
  const rx = Math.round(DRAW_CX - rw / 2);
  const ry = Math.round(DRAW_CY - rh / 2);

  // Physical furniture sizes scaled cleanly
  const bw = Math.round(bcfg.wM * SCALE);
  const bl = Math.round(bcfg.lM * SCALE);

  let bedSpanX = bw;
  let bedDepthY = bl;
  if (bedOrientation === 'horizontal_top' || bedOrientation === 'horizontal_left' || bedOrientation === 'horizontal_right') {
    bedSpanX = Math.min(bl, rw - 16);
    bedDepthY = Math.min(bw, rh - 16);
  } else {
    bedSpanX = Math.min(bw, rw - 16);
    bedDepthY = Math.min(bl, rh - 16);
  }

  // Bathroom box
  const bmW = hasBathroom ? Math.min(Math.round(1.45 * SCALE), Math.round(rw * 0.40)) : 0;
  const bmH = hasBathroom ? Math.min(Math.round(1.60 * SCALE), Math.round(rh * 0.43)) : 0;
  let bmX = -999;
  let bmY = -999;
  if (hasBathroom) {
    if (bathroomCorner === 'top_right') {
      bmX = rx + rw - bmW;
      bmY = ry;
    } else if (bathroomCorner === 'bottom_left') {
      bmX = rx;
      bmY = ry + rh - bmH;
    } else if (bathroomCorner === 'bottom_right') {
      bmX = rx + rw - bmW;
      bmY = ry + rh - bmH;
    } else {
      bmX = rx;
      bmY = ry;
    }
  }

  // Entrance doorway
  const doorW = Math.round(0.84 * SCALE);
  let doorX = Math.round(rx + rw / 2 - doorW / 2);
  if (doorPosition === 'bottom_left') {
    doorX = rx + 16;
  } else if (doorPosition === 'bottom_right') {
    doorX = rx + rw - doorW - 16;
  }
  // Keep doorway clear of bottom bathrooms
  if (hasBathroom && bathroomCorner === 'bottom_left' && doorX < bmX + bmW + 10) {
    doorX = clamp(bmX + bmW + 12, rx + 12, rx + rw - doorW - 12);
  }
  if (hasBathroom && bathroomCorner === 'bottom_right' && doorX + doorW > bmX - 10) {
    doorX = clamp(bmX - doorW - 12, rx + 12, rx + rw - doorW - 12);
  }
  const doorY = ry + rh;

  // Default bed placement
  const nw = 20;
  let defaultBedX = Math.round(rx + (rw - bedSpanX) / 2);
  let defaultBedY = ry + 8;

  if (bedOrientation === 'horizontal_right') {
    defaultBedX = rx + rw - bedSpanX - 8;
    const minY = hasBathroom && bathroomCorner === 'top_right' ? ry + bmH + 10 : ry + 8;
    const maxY = hasBathroom && bathroomCorner === 'bottom_right' ? ry + rh - bmH - bedDepthY - 10 : ry + rh - bedDepthY - 8;
    defaultBedY = clamp(Math.round(ry + (rh - bedDepthY) / 2), minY, Math.max(minY, maxY));
  } else if (bedOrientation === 'horizontal_left') {
    defaultBedX = rx + 8;
    const minY = hasBathroom && bathroomCorner === 'top_left' ? ry + bmH + 10 : ry + 8;
    const maxY = hasBathroom && bathroomCorner === 'bottom_left' ? ry + rh - bmH - bedDepthY - 10 : ry + rh - bedDepthY - 8;
    defaultBedY = clamp(Math.round(ry + (rh - bedDepthY) / 2), minY, Math.max(minY, maxY));
  } else if (bedOrientation === 'horizontal_top') {
    defaultBedY = ry + 8;
    const availStart = hasBathroom && bathroomCorner === 'top_left' ? rx + bmW + 8 : rx + 8;
    const availEnd = hasBathroom && bathroomCorner === 'top_right' ? rx + rw - bmW - 8 : rx + rw - 8;
    if (bedSide === 'left') defaultBedX = availStart;
    else if (bedSide === 'right') defaultBedX = availEnd - bedSpanX;
    else defaultBedX = Math.round(availStart + Math.max(0, (availEnd - availStart - bedSpanX) / 2));
  } else {
    // Vertical (headboard at top wall)
    defaultBedY = ry + 8;
    const availStart = hasBathroom && bathroomCorner === 'top_left' ? rx + bmW + 8 : rx + 8;
    const availEnd = hasBathroom && bathroomCorner === 'top_right' ? rx + rw - bmW - 8 : rx + rw - 8;
    const leftPad = nakasSide === 'left' || nakasSide === 'both' ? nw + 8 : 0;
    const rightPad = nakasSide === 'right' || nakasSide === 'both' ? nw + 8 : 0;
    if (bedSide === 'left') {
      defaultBedX = Math.max(availStart, Math.min(availStart + leftPad, availEnd - bedSpanX));
    } else if (bedSide === 'right') {
      defaultBedX = Math.max(availStart, availEnd - bedSpanX - rightPad);
    } else {
      defaultBedX = Math.round(availStart + Math.max(0, (availEnd - availStart - bedSpanX) / 2));
    }
  }

  const resolveItemPos = (key, defX, defY, itemW, itemH) => {
    if (liveDragPos && liveDragPos.key === key) {
      return {
        x: clamp(liveDragPos.x, rx + 4, rx + rw - itemW - 4),
        y: clamp(liveDragPos.y, ry + 4, ry + rh - itemH - 4)
      };
    }
    const saved = customPositions[key];
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      return {
        x: clamp(Math.round(rx + saved.x * rw), rx + 4, rx + rw - itemW - 4),
        y: clamp(Math.round(ry + saved.y * rh), ry + 4, ry + rh - itemH - 4)
      };
    }
    return {
      x: clamp(defX, rx + 4, rx + rw - itemW - 4),
      y: clamp(defY, ry + 4, ry + rh - itemH - 4)
    };
  };

  const bedPos = resolveItemPos('bed', defaultBedX, defaultBedY, bedSpanX, bedDepthY);
  const bx = bedPos.x;
  const by = bedPos.y;

  // Wardrobe default position
  const wardrobeW = Math.min(Math.round(1.10 * SCALE), Math.round(rw * 0.30));
  const wardrobeH = Math.round(0.52 * SCALE);
  const wardrobePref = fp.wardrobePos || (bedSide === 'left' || bathroomCorner === 'bottom_left' ? 'bottom_right' : 'bottom_left');
  let defWardrobeX = rx + 8;
  let defWardrobeY = ry + rh - wardrobeH - 8;
  if (wardrobePref === 'bottom_right') {
    defWardrobeX = rx + rw - wardrobeW - 8;
    defWardrobeY = ry + rh - wardrobeH - 8;
  } else if (wardrobePref === 'top_left') {
    defWardrobeX = hasBathroom && bathroomCorner === 'top_left' ? rx + bmW + 8 : rx + 8;
    defWardrobeY = ry + 8;
  } else if (wardrobePref === 'top_right') {
    defWardrobeX = hasBathroom && bathroomCorner === 'top_right' ? rx + rw - bmW - wardrobeW - 8 : rx + rw - wardrobeW - 8;
    defWardrobeY = ry + 8;
  }
  if (hasBathroom && bathroomCorner === 'bottom_left' && defWardrobeY + wardrobeH > ry + rh - bmH - 6 && defWardrobeX < rx + bmW + 8) {
    defWardrobeX = rx + rw - wardrobeW - 8;
  }
  const wardrobePos = resolveItemPos('wardrobe', defWardrobeX, defWardrobeY, wardrobeW, wardrobeH);

  // Desk default position
  const deskIsVertical = fp.deskPos === 'left_middle' || bedOrientation === 'horizontal_right';
  const deskW = deskIsVertical ? Math.round(0.54 * SCALE) : Math.min(Math.round(1.02 * SCALE), Math.round(rw * 0.28));
  const deskH = deskIsVertical ? Math.min(Math.round(1.02 * SCALE), Math.round(rh * 0.28)) : Math.round(0.52 * SCALE);
  const deskPref = fp.deskPos || (wardrobePref === 'bottom_right' ? 'bottom_left' : 'bottom_right');

  let defDeskX = rx + rw - deskW - 8;
  let defDeskY = ry + rh - deskH - 8;
  if (deskPref === 'bottom_left') {
    defDeskX = rx + 8;
    defDeskY = ry + rh - deskH - 8;
  } else if (deskPref === 'top_left') {
    defDeskX = rx + 8;
    defDeskY = hasBathroom && bathroomCorner === 'top_left' ? ry + bmH + 10 : ry + 8;
  } else if (deskPref === 'left_middle') {
    defDeskX = rx + 8;
    defDeskY = hasBathroom && bathroomCorner === 'top_left' ? ry + bmH + 12 : Math.round(ry + rh * 0.36);
  }
  if (bedOrientation === 'horizontal_right' && hasBathroom && bathroomCorner === 'top_left') {
    defDeskX = rx + 8;
    defDeskY = clamp(ry + bmH + 12, ry + 8, ry + rh - deskH - 8);
  }
  if (hasBathroom && bathroomCorner === 'bottom_left' && defDeskX < rx + bmW + 6 && defDeskY + deskH > ry + rh - bmH - 6) {
    defDeskX = rx + rw - deskW - 8;
  }
  if (hasBathroom && bathroomCorner === 'bottom_right' && defDeskX + deskW > rx + rw - bmW - 6 && defDeskY + deskH > ry + rh - bmH - 6) {
    defDeskX = rx + 8;
  }
  const deskPos = resolveItemPos('desk', defDeskX, defDeskY, deskW, deskH);

  // Anti Wall-Overflow Ergonomic Chair Calculation:
  // Always place the chair on the room-facing interior side of the desk and clamp inside walls!
  let chairCx = deskPos.x + Math.round(deskW / 2);
  let chairCy = deskPos.y - 12;
  let chairOrientation = 'top'; // direction of chair seat relative to desk
  const distLeft = deskPos.x - rx;
  const distRight = (rx + rw) - (deskPos.x + deskW);
  const distTop = deskPos.y - ry;
  const distBottom = (ry + rh) - (deskPos.y + deskH);
  const minDist = Math.min(distLeft, distRight, distTop, distBottom);

  if (minDist === distBottom) {
    chairOrientation = 'top';
    chairCx = deskPos.x + Math.round(deskW / 2);
    chairCy = deskPos.y - 12;
  } else if (minDist === distTop) {
    chairOrientation = 'bottom';
    chairCx = deskPos.x + Math.round(deskW / 2);
    chairCy = deskPos.y + deskH + 12;
  } else if (minDist === distLeft) {
    chairOrientation = 'right';
    chairCx = deskPos.x + deskW + 12;
    chairCy = deskPos.y + Math.round(deskH / 2);
  } else {
    chairOrientation = 'left';
    chairCx = deskPos.x - 12;
    chairCy = deskPos.y + Math.round(deskH / 2);
  }
  chairCx = clamp(chairCx, rx + 13, rx + rw - 13);
  chairCy = clamp(chairCy, ry + 13, ry + rh - 13);

  // Mini fridge position
  const fridgeW = Math.round(0.46 * SCALE);
  const fridgeH = Math.round(0.46 * SCALE);
  let defFridgeX = rx + 8;
  let defFridgeY = hasBathroom && bathroomCorner === 'top_left' ? ry + bmH + 10 : Math.round(ry + rh * 0.44);
  if (bedOrientation === 'horizontal_left') {
    defFridgeX = rx + rw - fridgeW - 8;
    defFridgeY = hasBathroom && bathroomCorner === 'top_right' ? ry + bmH + 10 : Math.round(ry + rh * 0.44);
  }
  const fridgePos = resolveItemPos('fridge', defFridgeX, defFridgeY, fridgeW, fridgeH);

  // Nakas calculation relative to live bed position
  const nakasItems = [];
  if (nakasSide !== 'none') {
    if (bedOrientation === 'horizontal_right') {
      if (nakasSide === 'left' || nakasSide === 'both') nakasItems.push({ x: bx + bedSpanX - nw, y: by - nw - 4 });
      if (nakasSide === 'right' || nakasSide === 'both') nakasItems.push({ x: bx + bedSpanX - nw, y: by + bedDepthY + 4 });
    } else if (bedOrientation === 'horizontal_left') {
      if (nakasSide === 'left' || nakasSide === 'both') nakasItems.push({ x: bx, y: by - nw - 4 });
      if (nakasSide === 'right' || nakasSide === 'both') nakasItems.push({ x: bx, y: by + bedDepthY + 4 });
    } else {
      if (nakasSide === 'left' || nakasSide === 'both') nakasItems.push({ x: bx - nw - 4, y: by + 2 });
      if (nakasSide === 'right' || nakasSide === 'both') nakasItems.push({ x: bx + bedSpanX + 4, y: by + 2 });
    }
  }
  const overlapsBathroom = (n) => {
    if (!hasBathroom) return false;
    return n.x < bmX + bmW + 2 && n.x + nw > bmX - 2 && n.y < bmY + bmH + 2 && n.y + nw > bmY - 2;
  };
  const validNakas = nakasItems.filter(
    (n) => n.x >= rx + 2 && n.x + nw <= rx + rw - 2 && n.y >= ry + 2 && n.y + nw <= ry + rh - 2 && !overlapsBathroom(n)
  );

  // Camera sightline ray & frustum cone
  const bedCx = bx + Math.round(bedSpanX / 2);
  const bedCy = by + Math.round(bedDepthY / 2);
  const camX = doorX + Math.round(doorW / 2);
  const camY = ry + rh + 14;
  const cdx = bedCx - camX;
  const cdy = bedCy - camY;
  const cdist = Math.hypot(cdx, cdy) || 1;
  const cdeg = (Math.atan2(cdy, cdx) * 180) / Math.PI;
  const tiltAngle = clamp(Math.round(Math.abs((Math.atan2(Math.abs(cdx), Math.abs(cdy)) * 180) / Math.PI)), 28, 48);
  const fovHalf = 25;
  const fovLen = Math.min(cdist + 48, Math.max(rw, rh) * 0.92);
  const angL = ((cdeg - fovHalf) * Math.PI) / 180;
  const angR = ((cdeg + fovHalf) * Math.PI) / 180;
  const xl = camX + fovLen * Math.cos(angL);
  const yl = camY + fovLen * Math.sin(angL);
  const xr = camX + fovLen * Math.cos(angR);
  const yr = camY + fovLen * Math.sin(angR);

  // Blind Spot zone mathematically clamped so it NEVER overlaps door swing arc or bottom-corner furniture
  let uzX = 0;
  let uzY = 0;
  let uzW = 0;
  let uzH = 0;
  if (unsureZone && showCameraOverlay) {
    const isLeftBlind = unsureZone.side !== 'right_front';
    const maxSpanH = Math.min(Math.round(0.95 * SCALE), Math.round(rh * 0.28));
    if (isLeftBlind) {
      const doorGuardX = doorX - 12;
      const availW = doorGuardX - (rx + 6);
      if (availW >= 42) {
        uzW = Math.min(Math.round(1.0 * SCALE), availW);
        uzH = maxSpanH;
        uzX = rx + 6;
        uzY = ry + rh - uzH - 8;
        // Shift upward if colliding with bottom-left furniture
        const bottomLeftTop = Math.min(
          hasWardrobe && wardrobePos.x < uzX + uzW ? wardrobePos.y : ry + rh,
          hasDesk && deskPos.x < uzX + uzW ? deskPos.y : ry + rh
        );
        if (uzY + uzH > bottomLeftTop - 6) {
          uzY = Math.max(hasBathroom && bathroomCorner === 'top_left' ? ry + bmH + 8 : ry + 10, bottomLeftTop - uzH - 12);
        }
      }
    } else {
      const doorGuardX = doorX + doorW + 12;
      const availW = rx + rw - 6 - doorGuardX;
      if (availW >= 42) {
        uzW = Math.min(Math.round(1.0 * SCALE), availW);
        uzH = maxSpanH;
        uzX = rx + rw - uzW - 6;
        uzY = ry + rh - uzH - 8;
        const bottomRightTop = Math.min(
          hasWardrobe && wardrobePos.x + wardrobeW > uzX ? wardrobePos.y : ry + rh,
          hasDesk && deskPos.x + deskW > uzX ? deskPos.y : ry + rh
        );
        if (uzY + uzH > bottomRightTop - 6) {
          uzY = Math.max(hasBathroom && bathroomCorner === 'top_right' ? ry + bmH + 8 : ry + 10, bottomRightTop - uzH - 12);
        }
      }
    }
  }

  // Interactive Pointer Drag handlers
  const getSvgCoords = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const inv = pt.matrixTransform(ctm.inverse());
    return { x: inv.x, y: inv.y };
  };

  const startDrag = (e, key, curX, curY, itemW, itemH) => {
    if (!editable) return;
    e.stopPropagation();
    setSelectedItem(key);
    const pt = getSvgCoords(e.clientX, e.clientY);
    setDragState({
      key,
      offsetX: pt.x - curX,
      offsetY: pt.y - curY,
      itemW,
      itemH
    });
    setLiveDragPos({ key, x: curX, y: curY });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!editable || !dragState) return;
    const pt = getSvgCoords(e.clientX, e.clientY);
    const nx = clamp(pt.x - dragState.offsetX, rx + 4, rx + rw - dragState.itemW - 4);
    const ny = clamp(pt.y - dragState.offsetY, ry + 4, ry + rh - dragState.itemH - 4);
    setLiveDragPos({ key: dragState.key, x: nx, y: ny });
  };

  const handlePointerUp = () => {
    if (!dragState) return;
    if (liveDragPos && onChangeFloorPlan) {
      const normX = Number(((liveDragPos.x - rx) / rw).toFixed(4));
      const normY = Number(((liveDragPos.y - ry) / rh).toFixed(4));
      onChangeFloorPlan({
        ...fp,
        dimensions: dimensionsStr,
        bedType,
        pillows,
        bedSide,
        bedOrientation,
        nakasSide,
        windowWall,
        acWall,
        bathroomCorner,
        doorPosition,
        furnitures,
        blanketHex,
        blanketAccent,
        floorHex,
        floorType,
        unsureZone,
        generated: true,
        customPositions: {
          ...customPositions,
          [dragState.key]: { x: normX, y: normY }
        }
      });
    }
    setDragState(null);
    setLiveDragPos(null);
  };

  const handleRotateBed = () => {
    if (!onChangeFloorPlan) return;
    const nextIdx = (ORIENTATION_CYCLE.indexOf(bedOrientation) + 1) % ORIENTATION_CYCLE.length;
    onChangeFloorPlan({
      ...fp,
      bedOrientation: ORIENTATION_CYCLE[nextIdx],
      generated: true
    });
  };

  const handleResetPositions = () => {
    if (!onChangeFloorPlan) return;
    const nextFp = { ...fp };
    delete nextFp.customPositions;
    onChangeFloorPlan(nextFp);
    setSelectedItem(null);
  };

  const hasCustomPositions = Object.keys(customPositions).length > 0;
  const kmLabel = hasBathroom ? 'KM DALAM (ENSUITE)' : 'KM LUAR (SHARED)';
  const orientLabel = ORIENTATION_LABELS[bedOrientation] || 'TEGAK';

  // Window geometry
  const winW = Math.min(Math.round(1.1 * SCALE), Math.round(rw * 0.34));
  const winH = Math.min(Math.round(1.1 * SCALE), Math.round(rh * 0.34));
  const topWinX = bedOrientation === 'vertical' && bedSide === 'left' ? rx + rw - winW - 14 : rx + 14;

  // AC placement (avoid window overlap)
  const acLen = 54;
  let acEl = null;
  if (hasAc) {
    if (acWall === 'left') {
      const acY = windowWall === 'left' ? ry + 14 : ry + Math.round(rh / 2) - Math.round(acLen / 2);
      acEl = (
        <g id="ac_unit">
          <rect x={rx + 1} y={acY} width="10" height={acLen} rx="2" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.2" />
          <line x1={rx + 8} y1={acY + 5} x2={rx + 8} y2={acY + acLen - 5} stroke="#cbd5e1" strokeWidth="1" />
          <circle cx={rx + 5} cy={acY + acLen - 6} r="1.2" fill="#22c55e" />
        </g>
      );
    } else if (acWall === 'right') {
      const acY = windowWall === 'right' ? ry + 14 : ry + Math.round(rh / 2) - Math.round(acLen / 2);
      acEl = (
        <g id="ac_unit">
          <rect x={rx + rw - 11} y={acY} width="10" height={acLen} rx="2" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.2" />
          <line x1={rx + rw - 8} y1={acY + 5} x2={rx + rw - 8} y2={acY + acLen - 5} stroke="#cbd5e1" strokeWidth="1" />
          <circle cx={rx + rw - 5} cy={acY + 6} r="1.2" fill="#22c55e" />
        </g>
      );
    } else {
      let acX = Math.round(bx + bedSpanX / 2 - acLen / 2);
      if (windowWall === 'top' && Math.abs(acX - topWinX) < acLen) {
        acX = topWinX > rx + rw / 2 ? rx + 16 : rx + rw - acLen - 16;
      }
      acX = clamp(acX, rx + 8, rx + rw - acLen - 8);
      acEl = (
        <g id="ac_unit">
          <rect x={acX} y={ry + 1} width={acLen} height="10" rx="2" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.2" />
          <line x1={acX + 5} y1={ry + 8} x2={acX + acLen - 5} y2={ry + 8} stroke="#cbd5e1" strokeWidth="1" />
          <circle cx={acX + acLen - 6} cy={ry + 5} r="1.2" fill="#22c55e" />
        </g>
      );
    }
  }

  // Cartouche bottom-right layout (width 276px so text never touches CAD VERIFIED box)
  const cartoucheX = CANVAS_W - 290;
  const cartoucheY = CANVAS_H - 52;

  return (
    <div style={{
      background: isLight ? '#ffffff' : 'linear-gradient(135deg, rgba(11, 19, 41, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
      borderRadius: '20px',
      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.3)',
      overflow: 'hidden',
      boxShadow: isLight ? '0 6px 24px rgba(15, 23, 42, 0.08)' : '0 12px 30px rgba(0, 0, 0, 0.38)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ── Top Bar Toolbar ── */}
      <div style={{
        padding: '0.8rem 1rem',
        borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        background: isLight ? '#f8fafc' : '#0f172a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '5px 12px',
            borderRadius: '9px',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Grid size={14} /> Denah 2D CAD 1:50
          </span>

          {fp.cvAnalyzed && (
            <span style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.14)',
              border: isLight ? '1px solid #86efac' : '1px solid rgba(16, 185, 129, 0.35)',
              color: isLight ? '#15803d' : '#34d399',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              CV Sync {fp.cvMeta?.confidencePct ? `${fp.cvMeta.confidencePct}%` : 'Aktif'}
            </span>
          )}
        </div>

        {/* View Mode Switcher & Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {roomPhoto && (
            <div style={{
              display: 'inline-flex',
              background: isLight ? '#e2e8f0' : '#0b1120',
              borderRadius: '9px',
              padding: '2px',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)'
            }}>
              {[
                { id: 'split', label: 'Berdampingan', icon: Columns },
                { id: 'cad', label: 'Fokus Denah', icon: Maximize2 },
                { id: 'photo', label: 'Foto Kamar', icon: Camera }
              ].map((m) => {
                const Icon = m.icon;
                const active = viewMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setViewMode(m.id)}
                    style={{
                      padding: '5px 9px',
                      borderRadius: '7px',
                      border: 'none',
                      background: active ? '#2563eb' : 'transparent',
                      color: active ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icon size={12} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {viewMode !== 'photo' && (
            <>
              <button
                type="button"
                onClick={() => setShowGrid((v) => !v)}
                style={{
                  background: showGrid ? (isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.2)') : (isLight ? '#ffffff' : '#1e293b'),
                  border: isLight ? '1px solid #93c5fd' : '1px solid rgba(59, 130, 246, 0.35)',
                  color: showGrid ? (isLight ? '#1d4ed8' : '#60a5fa') : (isLight ? '#475569' : '#cbd5e1'),
                  padding: '5px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.74rem',
                  fontWeight: 600
                }}
              >
                <Grid size={13} /> Grid
              </button>

              <button
                type="button"
                onClick={() => setShowCameraOverlay((v) => !v)}
                style={{
                  background: showCameraOverlay ? (isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.16)') : (isLight ? '#ffffff' : '#1e293b'),
                  border: isLight ? '1px solid #7dd3fc' : '1px solid rgba(56, 189, 248, 0.35)',
                  color: showCameraOverlay ? (isLight ? '#0369a1' : '#38bdf8') : (isLight ? '#475569' : '#cbd5e1'),
                  padding: '5px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.74rem',
                  fontWeight: 600
                }}
              >
                {showCameraOverlay ? <Eye size={13} /> : <EyeOff size={13} />} Blind Spot
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Interactive Editor Hint Bar ── */}
      {editable && viewMode !== 'photo' && (
        <div style={{
          padding: '6px 14px',
          background: 'rgba(37, 99, 235, 0.12)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Move size={13} /> Geser furnitur langsung di denah untuk menyamakan dengan foto
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {selectedItem === 'bed' && (
              <button
                type="button"
                onClick={handleRotateBed}
                style={{
                  padding: '4px 10px',
                  borderRadius: '7px',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  background: 'rgba(14, 165, 233, 0.2)',
                  color: '#38bdf8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCw size={12} /> Putar Orientasi Kasur
              </button>
            )}
            {hasCustomPositions && (
              <button
                type="button"
                onClick={handleResetPositions}
                style={{
                  padding: '4px 10px',
                  borderRadius: '7px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#e2e8f0',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={12} /> Reset Posisi
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main Content Stage (Split / CAD / Photo) ── */}
      <div style={{
        padding: '0.9rem',
        background: '#090e17',
        display: 'grid',
        gridTemplateColumns: roomPhoto && viewMode === 'split' && !isNarrow ? 'minmax(0, 1fr) minmax(0, 1.32fr)' : '1fr',
        gap: '12px',
        alignItems: 'stretch'
      }}>
        {/* Room Photograph Comparison Card */}
        {roomPhoto && (viewMode === 'split' || viewMode === 'photo') && (
          <div style={{
            position: 'relative',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: '#0f172a',
            minHeight: isNarrow ? '200px' : '260px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <img
              src={roomPhoto}
              alt={`Foto Kamar ${roomNumber}`}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: viewMode === 'photo' ? '440px' : '340px',
                objectFit: 'cover',
                display: 'block',
                flex: 1
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              right: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'none'
            }}>
              <span style={{
                background: 'rgba(9, 14, 23, 0.85)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(74, 222, 128, 0.4)',
                color: '#4ade80',
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Camera size={12} /> Foto Asli Unit {roomNumber}
              </span>
              <span style={{
                background: 'rgba(9, 14, 23, 0.85)',
                color: '#cbd5e1',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 600
              }}>
                {floorType}
              </span>
            </div>
          </div>
        )}

        {/* SVG 2D CAD Blueprint Canvas */}
        {viewMode !== 'photo' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#090e17',
            borderRadius: '14px',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            overflow: 'hidden',
            padding: '4px'
          }}>
            <svg
              ref={svgRef}
              width="100%"
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onClick={() => editable && setSelectedItem(null)}
              style={{
                maxWidth: viewMode === 'cad' ? '660px' : '100%',
                height: 'auto',
                aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                display: 'block',
                touchAction: editable ? 'none' : 'auto',
                userSelect: 'none'
              }}
            >
              <defs>
                <pattern id={`grid_cad_${uid}`} width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="0.75" />
                </pattern>
                <pattern id={`grid_major_${uid}`} width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(56, 189, 248, 0.09)" strokeWidth="1" />
                </pattern>
                <pattern id={`parquet_${uid}`} width="40" height="20" patternUnits="userSpaceOnUse">
                  <rect width="40" height="20" fill={floorHex} fillOpacity="0.34" />
                  <path d="M 0 10 L 40 10 M 20 0 L 20 10 M 0 20 L 40 20 M 40 10 L 40 20 M 0 0 L 0 10" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.6" />
                </pattern>
                <pattern id={`bm_tile_${uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
                  <rect width="12" height="12" fill="#0f2338" />
                  <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="0.6" />
                </pattern>
                <filter id={`frost_blur_${uid}`} x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="4.2" result="blur" />
                </filter>
                <pattern id={`blind_hatch_${uid}`} width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(244, 63, 94, 0.35)" strokeWidth="1.2" strokeDasharray="2 2" />
                </pattern>
                <radialGradient id={`lamp_glow_${uid}`}>
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`camera_frustum_${uid}`} cx="0%" cy="100%" r="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.30" />
                  <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.09" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </radialGradient>
              </defs>

              {/* Background Drafting Grid */}
              <rect width={CANVAS_W} height={CANVAS_H} fill="#090e17" />
              {showGrid && (
                <>
                  <rect width={CANVAS_W} height={CANVAS_H} fill={`url(#grid_cad_${uid})`} />
                  <rect width={CANVAS_W} height={CANVAS_H} fill={`url(#grid_major_${uid})`} />
                </>
              )}

              {/* Sheet Crop Registration Marks */}
              <g stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1">
                <path d="M 14 20 L 20 20 M 20 14 L 20 20" />
                <path d={`M ${CANVAS_W - 14} 20 L ${CANVAS_W - 20} 20 M ${CANVAS_W - 20} 14 L ${CANVAS_W - 20} 20`} />
                <path d={`M 14 ${CANVAS_H - 20} L 20 ${CANVAS_H - 20} M 20 ${CANVAS_H - 14} L 20 ${CANVAS_H - 20}`} />
                <path d={`M ${CANVAS_W - 14} ${CANVAS_H - 20} L ${CANVAS_W - 20} ${CANVAS_H - 20} M ${CANVAS_W - 20} ${CANVAS_H - 14} L ${CANVAS_W - 20} ${CANVAS_H - 20}`} />
              </g>

              {/* Top Width Dimension with 45-deg Ticks */}
              <g stroke="#38bdf8" strokeWidth="1.2">
                <line x1={rx} y1={ry - 18} x2={rx + rw} y2={ry - 18} opacity="0.85" />
                <line x1={rx - 5} y1={ry - 13} x2={rx + 5} y2={ry - 23} strokeWidth="1.8" />
                <line x1={rx + rw - 5} y1={ry - 13} x2={rx + rw + 5} y2={ry - 23} strokeWidth="1.8" />
                <line x1={rx} y1={ry - 6} x2={rx} y2={ry - 26} opacity="0.4" strokeWidth="0.75" />
                <line x1={rx + rw} y1={ry - 6} x2={rx + rw} y2={ry - 26} opacity="0.4" strokeWidth="0.75" />
                <rect x={rx + rw / 2 - 42} y={ry - 30} width="84" height="20" rx="4" fill="#0c1527" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
                <text x={rx + rw / 2} y={ry - 16} fill="#38bdf8" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.5" stroke="none">
                  {widthM.toFixed(2)} m
                </text>
              </g>

              {/* Left Length Dimension with 45-deg Ticks */}
              <g stroke="#38bdf8" strokeWidth="1.2">
                <line x1={rx - 18} y1={ry} x2={rx - 18} y2={ry + rh} opacity="0.85" />
                <line x1={rx - 23} y1={ry + 5} x2={rx - 13} y2={ry - 5} strokeWidth="1.8" />
                <line x1={rx - 23} y1={ry + rh + 5} x2={rx - 13} y2={ry + rh - 5} strokeWidth="1.8" />
                <line x1={rx - 6} y1={ry} x2={rx - 26} y2={ry} opacity="0.4" strokeWidth="0.75" />
                <line x1={rx - 6} y1={ry + rh} x2={rx - 26} y2={ry + rh} opacity="0.4" strokeWidth="0.75" />
                <g transform={`translate(${rx - 18}, ${ry + rh / 2})`}>
                  <rect x="-42" y="-10" width="84" height="20" rx="4" fill="#0c1527" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" transform="rotate(-90)" />
                  <text x="0" y="4" fill="#38bdf8" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.5" transform="rotate(-90)" stroke="none">
                    {lengthM.toFixed(2)} m
                  </text>
                </g>
              </g>

              {/* Dynamic Floor Fill & Cavity Walls */}
              <rect x={rx} y={ry} width={rw} height={rh} rx="2" fill={`url(#parquet_${uid})`} />
              <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke="rgba(0, 0, 0, 0.38)" strokeWidth="5" />
              <rect x={rx - 5} y={ry - 5} width={rw + 10} height={rh + 10} fill="none" stroke="#1e293b" strokeWidth="8" rx="2" />
              <rect x={rx - 9} y={ry - 9} width={rw + 18} height={rh + 18} fill="none" stroke="#475569" strokeWidth="1" rx="3" />
              <rect x={rx - 1} y={ry - 1} width={rw + 2} height={rh + 2} fill="none" stroke="#64748b" strokeWidth="1" rx="1" />

              {/* Camera Frustum Cone */}
              {showCameraOverlay && (
                <g opacity="0.85">
                  <polygon points={`${camX},${camY} ${xl.toFixed(1)},${yl.toFixed(1)} ${xr.toFixed(1)},${yr.toFixed(1)}`} fill={`url(#camera_frustum_${uid})`} />
                  <line x1={camX} y1={camY} x2={xl.toFixed(1)} y2={yl.toFixed(1)} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
                  <line x1={camX} y1={camY} x2={xr.toFixed(1)} y2={yr.toFixed(1)} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
                </g>
              )}

              {/* Ensuite Bathroom */}
              {hasBathroom && (
                <g id="ensuite_bathroom">
                  <rect x={bmX} y={bmY} width={bmW} height={bmH} fill={`url(#bm_tile_${uid})`} stroke="#334155" strokeWidth="4" />
                  <rect x={bmX} y={bmY} width={bmW} height={bmH} fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.5" />
                  {/* Shower Screen */}
                  <rect x={bmX + bmW - 44} y={bmY + 6} width="38" height="38" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" strokeWidth="1.2" />
                  <circle cx={bmX + bmW - 25} cy={bmY + 25} r="6.5" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
                  <circle cx={bmX + bmW - 25} cy={bmY + 25} r="2.2" fill="#38bdf8" />
                  {/* Toilet */}
                  <rect x={bmX + 6} y={bmY + 6} width="24" height="9" rx="2" fill="#e2e8f0" stroke="#475569" strokeWidth="0.8" />
                  <path d={`M ${bmX + 8} ${bmY + 15} C ${bmX + 8} ${bmY + 33} ${bmX + 28} ${bmY + 33} ${bmX + 28} ${bmY + 15} Z`} fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
                  {/* Vanity Basin */}
                  <rect x={bmX + 6} y={bmY + bmH - 30} width="32" height="24" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                  <rect x={bmX + 10} y={bmY + bmH - 26} width="24" height="16" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
                  <text x={bmX + bmW / 2} y={bmY + bmH / 2 + 2} fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle">KM</text>
                  {/* Inward Door Swing */}
                  {bathroomCorner.startsWith('bottom') ? (
                    <>
                      <rect x={bmX + bmW - 30} y={bmY - 2} width="26" height="4" fill="#090e17" />
                      <path d={`M ${bmX + bmW - 28} ${bmY} A 24 24 0 0 1 ${bmX + bmW - 4} ${bmY + 24}`} fill="none" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="2 2" opacity="0.75" />
                      <line x1={bmX + bmW - 28} y1={bmY} x2={bmX + bmW - 4} y2={bmY} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                    </>
                  ) : (
                    <>
                      <rect x={bmX + bmW - 30} y={bmY + bmH - 2} width="26" height="4" fill="#090e17" />
                      <path d={`M ${bmX + bmW - 28} ${bmY + bmH} A 24 24 0 0 0 ${bmX + bmW - 4} ${bmY + bmH - 24}`} fill="none" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="2 2" opacity="0.75" />
                      <line x1={bmX + bmW - 28} y1={bmY + bmH} x2={bmX + bmW - 4} y2={bmY + bmH} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                    </>
                  )}
                </g>
              )}

              {/* Camera Blind Spot (Frosted Gaussian Blur) */}
              {unsureZone && showCameraOverlay && uzW > 0 && (
                <g id="unsure_zone" opacity="0.95">
                  <rect x={uzX} y={uzY} width={uzW} height={uzH} rx="5" fill="rgba(15, 23, 42, 0.85)" filter={`url(#frost_blur_${uid})`} />
                  <rect x={uzX} y={uzY} width={uzW} height={uzH} rx="5" fill={`url(#blind_hatch_${uid})`} stroke="rgba(244, 63, 94, 0.45)" strokeWidth="1" strokeDasharray="3 2" />
                  <rect x={uzX + 4} y={uzY + Math.floor((uzH - 24) / 2)} width={uzW - 8} height="24" rx="4" fill="rgba(15, 23, 42, 0.94)" stroke="rgba(244, 63, 94, 0.5)" strokeWidth="0.8" />
                  <text x={uzX + uzW / 2} y={uzY + Math.floor((uzH - 24) / 2) + 10} fill="#fda4af" fontSize="6.8" fontWeight="700" textAnchor="middle">
                    BLIND SPOT
                  </text>
                  <text x={uzX + uzW / 2} y={uzY + Math.floor((uzH - 24) / 2) + 19} fill="#94a3b8" fontSize="5.4" fontWeight="500" textAnchor="middle">
                    Luar Sudut Kamera
                  </text>
                </g>
              )}

              {/* Area Rug */}
              <rect
                x={bx - 8}
                y={by + (bedOrientation === 'vertical' ? 20 : -6)}
                width={bedSpanX + 16}
                height={bedDepthY + (bedOrientation === 'vertical' ? 8 : 12)}
                rx="6"
                fill="rgba(255, 255, 255, 0.04)"
                stroke="rgba(148, 163, 184, 0.18)"
                strokeWidth="0.8"
                strokeDasharray="3 2"
              />

              {/* Bed Unit (4 Full Orientations + Pointer Drag) */}
              <g
                id="bed_unit"
                onPointerDown={(e) => startDrag(e, 'bed', bx, by, bedSpanX, bedDepthY)}
                style={{ cursor: editable ? 'grab' : 'default' }}
              >
                {editable && selectedItem === 'bed' && (
                  <rect x={bx - 5} y={by - 5} width={bedSpanX + 10} height={bedDepthY + 10} rx="7" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                )}

                {bedOrientation === 'horizontal_top' && (
                  <>
                    <rect x={bx - 5} y={by} width="7" height={bedDepthY} rx="2" fill="#3b271d" stroke="#78350f" strokeWidth="1" />
                    <circle cx={bx - 1} cy={by + Math.round(bedDepthY / 2)} r="9" fill={`url(#lamp_glow_${uid})`} />
                    <rect x={bx + 2} y={by} width={bedSpanX - 2} height={bedDepthY} rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x={bx + 32} y={by + 2} width={Math.max(20, bedSpanX - 34)} height={bedDepthY - 4} rx="3" fill={blanketHex} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
                    <path d={`M ${bx + 32} ${by + 2} Q ${bx + 38} ${by + Math.round(bedDepthY / 2)} ${bx + 32} ${by + bedDepthY - 2}`} fill="none" stroke="#ffffff" strokeWidth="2" />
                    <rect x={bx + bedSpanX - 22} y={by + 2} width="20" height={bedDepthY - 4} fill={blanketAccent} opacity="0.88" />
                    <rect x={bx + 6} y={by + Math.round((bedDepthY - 32) / 2)} width="20" height="32" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                  </>
                )}

                {bedOrientation === 'horizontal_left' && (
                  <>
                    <rect x={bx - 5} y={by} width="7" height={bedDepthY} rx="2" fill="#3b271d" stroke="#78350f" strokeWidth="1" />
                    <circle cx={bx - 1} cy={by + 16} r="10" fill={`url(#lamp_glow_${uid})`} />
                    <circle cx={bx - 1} cy={by + bedDepthY - 16} r="10" fill={`url(#lamp_glow_${uid})`} />
                    <rect x={bx + 2} y={by + 1} width={bedSpanX - 2} height={bedDepthY - 2} rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x={bx + 38} y={by + 3} width={Math.max(20, bedSpanX - 42)} height={bedDepthY - 6} rx="3" fill={blanketHex} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
                    <path d={`M ${bx + 38} ${by + 3} Q ${bx + 44} ${by + Math.round(bedDepthY / 2)} ${bx + 38} ${by + bedDepthY - 3}`} fill="none" stroke="#ffffff" strokeWidth="2" />
                    <rect x={bx + bedSpanX - 26} y={by + 3} width="20" height={bedDepthY - 6} fill={blanketAccent} opacity="0.88" />
                    {pillows === 1 ? (
                      <rect x={bx + 8} y={by + Math.round((bedDepthY - 36) / 2)} width="22" height="36" rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                    ) : (
                      <>
                        <rect x={bx + 8} y={by + 9} width="22" height={Math.min(38, Math.floor((bedDepthY - 24) / 2))} rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                        <rect x={bx + 8} y={by + bedDepthY - 9 - Math.min(38, Math.floor((bedDepthY - 24) / 2))} width="22" height={Math.min(38, Math.floor((bedDepthY - 24) / 2))} rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                      </>
                    )}
                  </>
                )}

                {bedOrientation === 'horizontal_right' && (
                  <>
                    <rect x={bx + bedSpanX - 2} y={by} width="7" height={bedDepthY} rx="2" fill="#3b271d" stroke="#78350f" strokeWidth="1" />
                    <circle cx={bx + bedSpanX + 1} cy={by + 16} r="10" fill={`url(#lamp_glow_${uid})`} />
                    <circle cx={bx + bedSpanX + 1} cy={by + bedDepthY - 16} r="10" fill={`url(#lamp_glow_${uid})`} />
                    <rect x={bx} y={by + 1} width={bedSpanX - 2} height={bedDepthY - 2} rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x={bx + 3} y={by + 3} width={Math.max(20, bedSpanX - 42)} height={bedDepthY - 6} rx="3" fill={blanketHex} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
                    <path d={`M ${bx + bedSpanX - 39} ${by + 3} Q ${bx + bedSpanX - 45} ${by + Math.round(bedDepthY / 2)} ${bx + bedSpanX - 39} ${by + bedDepthY - 3}`} fill="none" stroke="#ffffff" strokeWidth="2" />
                    <rect x={bx + 6} y={by + 3} width="20" height={bedDepthY - 6} fill={blanketAccent} opacity="0.88" />
                    {pillows === 1 ? (
                      <rect x={bx + bedSpanX - 30} y={by + Math.round((bedDepthY - 36) / 2)} width="22" height="36" rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                    ) : (
                      <>
                        <rect x={bx + bedSpanX - 30} y={by + 9} width="22" height={Math.min(38, Math.floor((bedDepthY - 24) / 2))} rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                        <rect x={bx + bedSpanX - 30} y={by + bedDepthY - 9 - Math.min(38, Math.floor((bedDepthY - 24) / 2))} width="22" height={Math.min(38, Math.floor((bedDepthY - 24) / 2))} rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                      </>
                    )}
                  </>
                )}

                {bedOrientation === 'vertical' && (
                  <>
                    <rect x={bx} y={by - 5} width={bedSpanX} height="7" rx="2" fill="#3b271d" stroke="#78350f" strokeWidth="1" />
                    <circle cx={bx + 12} cy={by - 1} r="10" fill={`url(#lamp_glow_${uid})`} />
                    <circle cx={bx + bedSpanX - 12} cy={by - 1} r="10" fill={`url(#lamp_glow_${uid})`} />
                    <rect x={bx + 2} y={by} width={bedSpanX - 4} height={bedDepthY} rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x={bx + 2} y={by + 38} width={bedSpanX - 4} height={Math.max(20, bedDepthY - 40)} rx="3" fill={blanketHex} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
                    <path d={`M ${bx + 2} ${by + 38} Q ${bx + bedSpanX / 2} ${by + 44} ${bx + bedSpanX - 2} ${by + 38}`} fill="none" stroke="#ffffff" strokeWidth="2" />
                    <rect x={bx + 2} y={by + bedDepthY - 28} width={bedSpanX - 4} height="20" fill={blanketAccent} opacity="0.88" />
                    {pillows === 1 ? (
                      <rect x={bx + Math.floor(bedSpanX / 2) - 20} y={by + 6} width="40" height="22" rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                    ) : (
                      <>
                        {(() => {
                          const pw = Math.min(38, Math.floor((bedSpanX - 16) / 2));
                          return (
                            <>
                              <rect x={bx + 6} y={by + 6} width={pw} height="22" rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                              <rect x={bx + bedSpanX - 6 - pw} y={by + 6} width={pw} height="22" rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                            </>
                          );
                        })()}
                      </>
                    )}
                  </>
                )}
              </g>

              {/* Nakas */}
              {validNakas.map((n, i) => (
                <g key={i}>
                  <rect x={n.x} y={n.y} width={nw} height={nw} rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <circle cx={n.x + nw / 2} cy={n.y + nw / 2} r="4" fill="#fef08a" stroke="#d97706" strokeWidth="0.8" opacity="0.85" />
                </g>
              ))}

              {/* Foot Bench Extra */}
              {extraFurniture.includes('foot_bench') && bedOrientation === 'vertical' && (
                <rect x={bx + 10} y={by + bedDepthY + 4} width={bedSpanX - 20} height="13" rx="3" fill="#1e3a8a" stroke="#d97706" strokeWidth="1" />
              )}
              {extraFurniture.includes('sofa_center') && (
                <g>
                  <rect x={Math.round(rx + rw / 2 - 36)} y={Math.round(ry + rh * 0.60)} width="72" height="26" rx="5" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                  <rect x={Math.round(rx + rw / 2 - 32)} y={Math.round(ry + rh * 0.60) + 18} width="64" height="6" rx="2" fill="#475569" />
                </g>
              )}

              {/* Wardrobe (Draggable) */}
              {hasWardrobe && (
                <g
                  id="wardrobe"
                  onPointerDown={(e) => startDrag(e, 'wardrobe', wardrobePos.x, wardrobePos.y, wardrobeW, wardrobeH)}
                  style={{ cursor: editable ? 'grab' : 'default' }}
                >
                  {editable && selectedItem === 'wardrobe' && (
                    <rect x={wardrobePos.x - 4} y={wardrobePos.y - 4} width={wardrobeW + 8} height={wardrobeH + 8} rx="5" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="4 2" />
                  )}
                  <rect x={wardrobePos.x} y={wardrobePos.y} width={wardrobeW} height={wardrobeH} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
                  <line x1={wardrobePos.x + 6} y1={wardrobePos.y + wardrobeH / 2} x2={wardrobePos.x + wardrobeW - 6} y2={wardrobePos.y + wardrobeH / 2} stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1={wardrobePos.x + wardrobeW / 2} y1={wardrobePos.y} x2={wardrobePos.x + wardrobeW / 2} y2={wardrobePos.y + wardrobeH} stroke="#38bdf8" strokeWidth="1.2" />
                </g>
              )}

              {/* Work Desk & Interior-Facing Clamped Chair (Draggable) */}
              {hasDesk && (
                <g
                  id="desk_setup"
                  onPointerDown={(e) => startDrag(e, 'desk', deskPos.x, deskPos.y, deskW, deskH)}
                  style={{ cursor: editable ? 'grab' : 'default' }}
                >
                  {editable && selectedItem === 'desk' && (
                    <rect x={deskPos.x - 4} y={deskPos.y - 4} width={deskW + 8} height={deskH + 8} rx="5" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="4 2" />
                  )}
                  <rect x={deskPos.x} y={deskPos.y} width={deskW} height={deskH} rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
                  <rect x={deskPos.x + deskW / 2 - 11} y={deskPos.y + Math.round(deskH / 2 - 7)} width="22" height="14" rx="1.5" fill="#0f172a" stroke="#60a5fa" strokeWidth="0.8" />
                  <rect x={deskPos.x + deskW / 2 - 9} y={deskPos.y + Math.round(deskH / 2 - 5)} width="18" height="9" rx="1" fill="#38bdf8" opacity="0.65" />

                  {/* Interior-Clamped Chair */}
                  <ellipse
                    cx={chairCx}
                    cy={chairCy}
                    rx={chairOrientation === 'left' || chairOrientation === 'right' ? 8 : 11}
                    ry={chairOrientation === 'left' || chairOrientation === 'right' ? 11 : 8}
                    fill="#334155"
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  {chairOrientation === 'top' && (
                    <path d={`M ${chairCx - 9} ${chairCy - 4} Q ${chairCx} ${chairCy - 7} ${chairCx + 9} ${chairCy - 4}`} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  )}
                  {chairOrientation === 'bottom' && (
                    <path d={`M ${chairCx - 9} ${chairCy + 4} Q ${chairCx} ${chairCy + 7} ${chairCx + 9} ${chairCy + 4}`} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  )}
                  {chairOrientation === 'right' && (
                    <path d={`M ${chairCx + 4} ${chairCy - 9} Q ${chairCx + 7} ${chairCy} ${chairCx + 4} ${chairCy + 9}`} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  )}
                  {chairOrientation === 'left' && (
                    <path d={`M ${chairCx - 4} ${chairCy - 9} Q ${chairCx - 7} ${chairCy} ${chairCx - 4} ${chairCy + 9}`} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  )}
                </g>
              )}

              {/* Mini Fridge (Draggable) */}
              {hasFridge && (
                <g
                  id="fridge"
                  onPointerDown={(e) => startDrag(e, 'fridge', fridgePos.x, fridgePos.y, fridgeW, fridgeH)}
                  style={{ cursor: editable ? 'grab' : 'default' }}
                >
                  {editable && selectedItem === 'fridge' && (
                    <rect x={fridgePos.x - 4} y={fridgePos.y - 4} width={fridgeW + 8} height={fridgeH + 8} rx="4" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="4 2" />
                  )}
                  <rect x={fridgePos.x} y={fridgePos.y} width={fridgeW} height={fridgeH} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
                  <line x1={fridgePos.x + fridgeW - 4} y1={fridgePos.y + 5} x2={fridgePos.x + fridgeW - 4} y2={fridgePos.y + fridgeH - 5} stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              )}

              {/* AC Unit */}
              {acEl}

              {/* Window */}
              {hasWindow && windowWall === 'left' && (
                <g id="window_left">
                  <rect x={rx - 7} y={ry + Math.round(rh / 2) - Math.floor(winH / 2)} width="6" height={winH} fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <line x1={rx - 4} y1={ry + Math.round(rh / 2) - Math.floor(winH / 2)} x2={rx - 4} y2={ry + Math.round(rh / 2) + Math.floor(winH / 2)} stroke="#ffffff" strokeWidth="1.2" />
                </g>
              )}
              {hasWindow && windowWall === 'right' && (
                <g id="window_right">
                  <rect x={rx + rw + 1} y={ry + Math.round(rh / 2) - Math.floor(winH / 2)} width="6" height={winH} fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <line x1={rx + rw + 4} y1={ry + Math.round(rh / 2) - Math.floor(winH / 2)} x2={rx + rw + 4} y2={ry + Math.round(rh / 2) + Math.floor(winH / 2)} stroke="#ffffff" strokeWidth="1.2" />
                </g>
              )}
              {hasWindow && windowWall === 'top' && (
                <g id="window_top">
                  <rect x={topWinX} y={ry - 7} width={winW} height="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <line x1={topWinX} y1={ry - 4} x2={topWinX + winW} y2={ry - 4} stroke="#ffffff" strokeWidth="1.2" />
                </g>
              )}

              {/* Main Entrance Doorway */}
              <g id="main_door">
                <rect x={doorX} y={doorY - 4} width={doorW} height="8" fill="#090e17" />
                <path d={`M ${doorX} ${doorY} A ${doorW - 8} ${doorW - 8} 0 0 1 ${doorX + doorW - 8} ${doorY - (doorW - 8)}`} fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2.5 2" opacity="0.75" />
                <line x1={doorX} y1={doorY} x2={doorX} y2={doorY - (doorW - 8)} stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx={doorX + 5} cy={doorY - (doorW - 15)} r="1.5" fill="#38bdf8" />
              </g>

              {/* Camera Sightline Ray & Vector Camera Icon Badge */}
              {showCameraOverlay && (
                <g id="camera_marker_overlay">
                  <line x1={camX} y1={camY} x2={bedCx} y2={bedCy} stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.85" />
                  <circle cx={bedCx} cy={bedCy} r="3" fill="#38bdf8" opacity="0.85" />
                  <circle cx={bedCx} cy={bedCy} r="6.5" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />

                  <g transform={`translate(${camX}, ${camY}) rotate(${cdeg + 90})`}>
                    <rect x="-9" y="-6" width="18" height="12" rx="2.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                    <path d="M -3 -6 L -1.5 -8.5 L 1.5 -8.5 L 3 -6 Z" fill="#38bdf8" />
                    <circle cx="0" cy="0" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="0.9" />
                    <circle cx="0" cy="0" r="1.8" fill="#38bdf8" />
                    <polygon points="0,-10 -2.5,-7 2.5,-7" fill="#38bdf8" />
                  </g>

                  <g transform={`translate(${Math.max(18, camX - 118)}, ${camY - 9})`}>
                    <rect width="104" height="18" rx="4" fill="rgba(12, 21, 39, 0.94)" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="0.8" />
                    <rect x="6" y="5" width="9" height="7" rx="1.5" fill="none" stroke="#38bdf8" strokeWidth="1" />
                    <circle cx="10.5" cy="8.5" r="1.8" fill="#38bdf8" />
                    <text x="60" y="12" fill="#38bdf8" fontSize="6.8" fontWeight="700" textAnchor="middle" letterSpacing="0.2">
                      SUDUT KAMERA {tiltAngle}°
                    </text>
                  </g>
                </g>
              )}

              {/* Swiss Architectural Title Block (Zero Text Overlap) */}
              <g id="title_block" transform={`translate(${cartoucheX}, ${cartoucheY})`}>
                <rect x="0" y="0" width="276" height="40" rx="6" fill="rgba(12, 21, 39, 0.96)" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" />
                <text x="10" y="14" fill="#f8fafc" fontSize="8.8" fontWeight="800" letterSpacing="0.4">
                  UNIT {roomNumber} • {areaM2} m²
                </text>
                <text x="10" y="25" fill="#38bdf8" fontSize="7.2" fontWeight="700">
                  {bcfg.label} • {orientLabel}
                </text>
                <text x="10" y="34" fill="#94a3b8" fontSize="6.3" fontWeight="500">
                  {kmLabel} • SKALA 1:50
                </text>
                <rect x="226" y="7" width="42" height="26" rx="4" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" />
                <text x="247" y="18" fill="#38bdf8" fontSize="6.5" fontWeight="800" textAnchor="middle">CAD</text>
                <text x="247" y="27" fill="#4ade80" fontSize="5.6" fontWeight="700" textAnchor="middle">VERIFIED</text>
              </g>

              {/* North Compass */}
              <g id="north_compass" transform={`translate(${CANVAS_W - 55}, 30)`}>
                <circle cx="15" cy="15" r="13" fill="rgba(12, 21, 39, 0.9)" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1" />
                <line x1="15" y1="4" x2="15" y2="26" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.75" />
                <line x1="4" y1="15" x2="26" y2="15" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.75" />
                <polygon points="15,6 18,15 15,13 12,15" fill="#38bdf8" />
                <polygon points="15,24 18,15 15,17 12,15" fill="#475569" />
                <text x="15" y="2" fill="#38bdf8" fontSize="7" fontWeight="900" textAnchor="middle">U</text>
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* ── Bottom Specs & Furniture Legend ── */}
      <div style={{
        padding: '0.85rem 1.15rem',
        borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
        background: isLight ? '#f8fafc' : '#0b1120',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f1f5f9' }}>
              Spesifikasi Kamar {roomNumber}
            </span>
            <span style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '6px',
              background: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.25)',
              color: isLight ? '#1e40af' : '#93c5fd',
              fontWeight: 700
            }}>
              {bcfg.shortLabel}
            </span>
            <span style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '6px',
              background: hasBathroom ? (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.16)') : (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.16)'),
              color: hasBathroom ? (isLight ? '#15803d' : '#34d399') : (isLight ? '#b45309' : '#fbbf24'),
              fontWeight: 700
            }}>
              {hasBathroom ? 'KM Dalam' : 'KM Luar'}
            </span>
          </div>
          <span style={{ fontSize: '0.77rem', color: isLight ? '#475569' : '#94a3b8' }}>
            Dimensi: <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>{widthM}m x {lengthM}m</strong> ({areaM2} m²) • {kostName}
          </span>
        </div>

        {/* Palette + Feature Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span title="Warna Sprei & Lantai dari Foto" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.16)',
            padding: '3px 7px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            color: isLight ? '#334155' : '#e2e8f0',
            fontWeight: 600
          }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: blanketHex, border: '1px solid #94a3b8' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: floorHex, border: '1px solid #64748b' }} />
            <span>Palet Foto</span>
          </span>
          {hasAc && (
            <span style={{ fontSize: '0.72rem', background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)', color: isLight ? '#1d4ed8' : '#60a5fa', padding: '3px 8px', borderRadius: '6px', border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 600 }}>
              AC ({acWall})
            </span>
          )}
          {hasWindow && (
            <span style={{ fontSize: '0.72rem', background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)', color: isLight ? '#047857' : '#34d399', padding: '3px 8px', borderRadius: '6px', border: isLight ? '1px solid #a7f3d0' : '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
              Jendela ({windowWall})
            </span>
          )}
          {hasDesk && (
            <span style={{ fontSize: '0.72rem', background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)', color: isLight ? '#b45309' : '#fbbf24', padding: '3px 8px', borderRadius: '6px', border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600 }}>
              Meja Kerja
            </span>
          )}
          {hasWardrobe && (
            <span style={{ fontSize: '0.72rem', background: isLight ? '#f5f3ff' : 'rgba(139, 92, 246, 0.15)', color: isLight ? '#6d28d9' : '#a78bfa', padding: '3px 8px', borderRadius: '6px', border: isLight ? '1px solid #ddd6fe' : '1px solid rgba(139, 92, 246, 0.3)', fontWeight: 600 }}>
              Lemari
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
