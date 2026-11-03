import os
import json
import time
from concurrent.futures import ThreadPoolExecutor

def render_luxury_cad_svg(spec):
    w_m = float(spec["width_m"])
    l_m = float(spec["length_m"])
    area_m2 = float(spec["area_m2"])
    furnitures = spec["furnitures"]
    bed_type = spec["bed_type"]
    bed_side = spec.get("bed_side") or spec.get("cv_features", {}).get("bed_side", "center")
    window_wall = spec.get("window_wall") or spec.get("cv_features", {}).get("window_wall", "top")
    room_number = spec["room_number"]
    pillows = int(spec["pillows"])
    blanket_hex = spec.get("blanket_hex") or spec.get("cv_features", {}).get("blanket_hex", "#f8fafc")
    blanket_accent = spec.get("blanket_accent") or spec.get("cv_features", {}).get("blanket_accent", "#3b82f6")
    floor_hex = spec.get("floor_hex") or spec.get("cv_features", {}).get("floor_hex", "#334155")
    floor_type = spec.get("floor_type") or spec.get("cv_features", {}).get("floor_type", "Parquet Wood")
    has_bm = bool(spec["has_bathroom"])
    unsure_zone = spec.get("unsure_zone")
    uid = spec["id"]
    
    has_wardrobe = "wardrobe" in furnitures
    has_desk = "desk" in furnitures
    has_ac = "ac" in furnitures
    has_fridge = "fridge" in furnitures

    # ── UNIFIED PHYSICAL ARCHITECTURAL SCALE: 1 meter = 70 pixels ──
    SCALE = 70.0
    
    # Physical room dimensions in pixels (proportional to actual real room)
    rw = round(w_m * SCALE)
    rh = round(l_m * SCALE)
    
    CANVAS_W = 680
    CANVAS_H = 480
    
    # Center room in drafting area
    DRAW_CX = 295
    DRAW_CY = 230
    
    rx = round(DRAW_CX - (rw / 2))
    ry = round(DRAW_CY - (rh / 2))
    
    # ── FURNITURE SCALED 1:1 PHYSICALLY TO ROOM ──
    bed_dim_map = {
        "single": {"w": round(1.00 * SCALE), "l": round(2.00 * SCALE), "label": "SINGLE BED (100x200)"},
        "super_single": {"w": round(1.20 * SCALE), "l": round(2.00 * SCALE), "label": "SUPER SINGLE (120x200)"},
        "double": {"w": round(1.40 * SCALE), "l": round(2.00 * SCALE), "label": "DOUBLE BED (140x200)"},
        "queen": {"w": round(1.60 * SCALE), "l": round(2.00 * SCALE), "label": "QUEEN BED (160x200)"},
        "king": {"w": round(1.80 * SCALE), "l": round(2.00 * SCALE), "label": "KING BED (180x200)"}
    }
    bcfg = bed_dim_map.get(bed_type, bed_dim_map["double"])
    bw = bcfg["w"]
    bl = bcfg["l"]
    
    # ── ENSUITE BATHROOM (KM DALAM) ──
    if has_bm:
        bm_w = min(round(1.50 * SCALE), round(rw * 0.40))
        bm_h = min(round(1.65 * SCALE), round(rh * 0.44))
        bm_x = rx
        bm_y = ry
    else:
        bm_x, bm_y, bm_w, bm_h = -999, -999, 0, 0

    # ── BED PLACEMENT (ARCHITECTURAL DRAFTING STANDARD) ──
    # Double, Queen, and King beds accommodate 2 persons and MUST be centered along the headboard wall
    # with bilateral clearance and dual bedside tables (nakas) on BOTH sides.
    is_double_or_larger = bed_type in ["double", "queen", "king"] or pillows >= 2
    
    if is_double_or_larger or bed_side == 'center':
        if has_bm:
            # Bed is centered within the usable sleeping wall span to the right of the bathroom
            usable_span = rw - bm_w
            bx = round(rx + bm_w + (usable_span - bw) / 2)
            by = ry + 8
            # Symmetrical bilateral clearance
            c_left = bx - (rx + bm_w)
            c_right = (rx + rw) - (bx + bw)
            nw = 22
            # Dual nakas centered in left and right clearances
            nx_left = round((rx + bm_w) + max(2, (c_left - nw) / 2))
            nx_right = round((bx + bw) + max(2, (c_right - nw) / 2))
            nakas_items = [(nx_left, by + 2), (nx_right, by + 2)]
        else:
            # Bed is centered along the entire headboard wall
            clearance = (rw - bw) / 2
            bx = round(rx + clearance)
            by = ry + 8
            # Dual nakas with generous outer walkway
            nx_left = max(rx + 6, bx - 26)
            nx_right = min(rx + rw - 28, bx + bw + 4)
            nakas_items = [(nx_left, by + 2), (nx_right, by + 2)]
    elif bed_side == 'left':
        # Single bed tucked into left wall (compact dorm style)
        bx = rx + 8
        by = ry + 8
        nakas_items = [(bx + bw + 4, by + 2)]
    else:  # right
        # Single bed tucked into right wall (compact dorm style)
        bx = rx + rw - bw - 8
        by = ry + 8
        nakas_items = [(bx - 26, by + 2)]
        
    rug_x = bx - 8
    rug_y = by + 25
    rug_w = bw + 16
    rug_h = bl + 10
    
    # ── WARDROBE (LEMARI) & WORK DESK ──
    ww = min(round(1.15 * SCALE), round(rw * 0.32))
    wh = round(0.55 * SCALE)
    dw = min(round(1.05 * SCALE), round(rw * 0.30))
    dh = round(0.55 * SCALE)
    
    if not has_bm:
        if window_wall == 'left':
            desk_x = rx + 8
            desk_y = ry + rh - dh - 8
            wardrobe_x = rx + rw - ww - 8
            wardrobe_y = ry + rh - wh - 8
        else:
            wardrobe_x = rx + 8
            wardrobe_y = ry + rh - wh - 8
            desk_x = rx + rw - dw - 8
            desk_y = ry + rh - dh - 8
    else:
        # With ensuite bathroom at top-left:
        if window_wall == 'left':
            desk_x = rx + 8
            desk_y = ry + rh - dh - 8
            wardrobe_x = rx + rw - ww - 8
            wardrobe_y = ry + rh - wh - 8
        else:
            wardrobe_x = rx + 8
            wardrobe_y = ry + rh - wh - 8
            desk_x = rx + rw - dw - 8
            desk_y = ry + rh - dh - 8
            
    # ── MINI FRIDGE ──
    fw = round(0.50 * SCALE)
    fh = round(0.50 * SCALE)
    if has_bm:
        fridge_x = rx + 8
        fridge_y = ry + bm_h + 10
    else:
        fridge_x = rx + 8 if desk_x > rx + 50 else rx + rw - fw - 8
        fridge_y = ry + round(rh / 2) - 10
    
    # ── MAIN DOORWAY ──
    door_w = round(0.85 * SCALE)
    door_x = round(rx + (rw / 2) - (door_w / 2))
    door_y = ry + rh
    
    # ── WINDOW ──
    win_w = min(round(1.10 * SCALE), round(rw * 0.35))
    win_h = min(round(1.10 * SCALE), round(rh * 0.35))
    
    # ── UNSURE ZONE (CAMERA BLIND SPOT) ──
    if unsure_zone:
        side = unsure_zone.get("side", "left_front")
        uz_w = min(round(1.10 * SCALE), round(rw * 0.35))
        uz_h = min(round(1.10 * SCALE), round(rh * 0.35))
        if side == "left_front":
            uz_x = rx + 6
            uz_y = ry + rh - uz_h - 6
        else:
            uz_x = rx + rw - uz_w - 6
            uz_y = ry + rh - uz_h - 6
    else:
        uz_x, uz_y, uz_w, uz_h = 0, 0, 0, 0
        
    km_label = "KM DALAM (ENSUITE)" if has_bm else "KM LUAR (SHARED)"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS_W} {CANVAS_H}" width="100%" height="100%" style="background:#090e17; border-radius:14px; font-family:'Inter',system-ui,-apple-system,sans-serif;">
  <defs>
    <!-- Architectural Fine Grid (16px) -->
    <pattern id="grid_cad_{uid}" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(148, 163, 184, 0.04)" stroke-width="0.75" />
    </pattern>
    <!-- Architectural Major Module Grid (80px) -->
    <pattern id="grid_major_{uid}" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(56, 189, 248, 0.07)" stroke-width="1" />
    </pattern>
    <!-- Luxury Parquet Wood Floor Pattern -->
    <pattern id="parquet_{uid}" width="40" height="20" patternUnits="userSpaceOnUse">
      <rect width="40" height="20" fill="{floor_hex}" fill-opacity="0.32" />
      <path d="M 0 10 L 40 10 M 20 0 L 20 10 M 0 20 L 40 20 M 40 10 L 40 20 M 0 0 L 0 10" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="0.6" />
    </pattern>
    <!-- Bathroom Ceramic Micro-Tile Pattern -->
    <pattern id="bm_tile_{uid}" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#0f2338" />
      <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(56, 189, 248, 0.22)" stroke-width="0.6" />
    </pattern>
    <!-- Frosted Glass Blur Filter for Camera Blind Spot -->
    <filter id="frost_blur_{uid}" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="4.5" result="blur" />
    </filter>
    <!-- Architectural 45-deg Hatch for Blind Spot -->
    <pattern id="blind_hatch_{uid}" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(244, 63, 94, 0.35)" stroke-width="1.2" stroke-dasharray="2 2" />
    </pattern>
    <!-- Reading Lamp Warm Radial Glow -->
    <radialGradient id="lamp_glow_{uid}">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#fef08a" stop-opacity="0" />
    </radialGradient>
    <!-- Drop Shadow Filter -->
    <filter id="drop_shadow_{uid}" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background CAD Drafting Paper -->
  <rect width="{CANVAS_W}" height="{CANVAS_H}" fill="#090e17" />
  <rect width="{CANVAS_W}" height="{CANVAS_H}" fill="url(#grid_cad_{uid})" />
  <rect width="{CANVAS_W}" height="{CANVAS_H}" fill="url(#grid_major_{uid})" />

  <!-- Sheet Crop Registration Marks (Architectural Standard) -->
  <g stroke="rgba(148, 163, 184, 0.35)" stroke-width="1">
    <path d="M 14 20 L 20 20 M 20 14 L 20 20" />
    <path d="M {CANVAS_W - 14} 20 L {CANVAS_W - 20} 20 M {CANVAS_W - 20} 14 L {CANVAS_W - 20} 20" />
    <path d="M 14 {CANVAS_H - 20} L 20 {CANVAS_H - 20} M 20 {CANVAS_H - 14} L 20 {CANVAS_H - 20}" />
    <path d="M {CANVAS_W - 14} {CANVAS_H - 20} L {CANVAS_W - 20} {CANVAS_H - 20} M {CANVAS_W - 20} {CANVAS_H - 14} L {CANVAS_W - 20} {CANVAS_H - 20}" />
  </g>

  <!-- ── DIMENSION LINES (PROPORTIONAL 45° ARCHITECTURAL TICKS) ── -->
  <!-- Top Horizontal Dimension (Width) -->
  <g stroke="#38bdf8" stroke-width="1.2">
    <line x1="{rx}" y1="{ry - 18}" x2="{rx + rw}" y2="{ry - 18}" opacity="0.85" />
    <line x1="{rx - 5}" y1="{ry - 13}" x2="{rx + 5}" y2="{ry - 23}" stroke-width="1.8" />
    <line x1="{rx + rw - 5}" y1="{ry - 13}" x2="{rx + rw + 5}" y2="{ry - 23}" stroke-width="1.8" />
    <line x1="{rx}" y1="{ry - 6}" x2="{rx}" y2="{ry - 26}" opacity="0.4" stroke-width="0.75" />
    <line x1="{rx + rw}" y1="{ry - 6}" x2="{rx + rw}" y2="{ry - 26}" opacity="0.4" stroke-width="0.75" />
    <rect x="{rx + rw/2 - 42}" y="{ry - 30}" width="84" height="20" rx="4" fill="#0c1527" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1" />
    <text x="{rx + rw/2}" y="{ry - 16}" fill="#38bdf8" font-size="9.5" font-weight="700" text-anchor="middle" letter-spacing="0.5">
      {w_m:.2f} m
    </text>
  </g>

  <!-- Left Vertical Dimension (Length) -->
  <g stroke="#38bdf8" stroke-width="1.2">
    <line x1="{rx - 18}" y1="{ry}" x2="{rx - 18}" y2="{ry + rh}" opacity="0.85" />
    <line x1="{rx - 23}" y1="{ry + 5}" x2="{rx - 13}" y2="{ry - 5}" stroke-width="1.8" />
    <line x1="{rx - 23}" y1="{ry + rh + 5}" x2="{rx - 13}" y2="{ry + rh - 5}" stroke-width="1.8" />
    <line x1="{rx - 6}" y1="{ry}" x2="{rx - 26}" y2="{ry}" opacity="0.4" stroke-width="0.75" />
    <line x1="{rx - 6}" y1="{ry + rh}" x2="{rx - 26}" y2="{ry + rh}" opacity="0.4" stroke-width="0.75" />
    <g transform="translate({rx - 18}, {ry + rh/2})">
      <rect x="-42" y="-10" width="84" height="20" rx="4" fill="#0c1527" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1" transform="rotate(-90)" />
      <text x="0" y="4" fill="#38bdf8" font-size="9.5" font-weight="700" text-anchor="middle" letter-spacing="0.5" transform="rotate(-90)">
        {l_m:.2f} m
      </text>
    </g>
  </g>

  <!-- ── DYNAMICALLY PROPORTIONAL ROOM FLOOR ── -->
  <rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="2" fill="url(#parquet_{uid})" />
  <rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" fill="none" stroke="rgba(0, 0, 0, 0.38)" stroke-width="5" />

  <!-- ── ARCHITECTURAL CAVITY WALLS (PROPORTIONAL DOUBLE LINE) ── -->
  <rect x="{rx - 5}" y="{ry - 5}" width="{rw + 10}" height="{rh + 10}" fill="none" stroke="#1e293b" stroke-width="8" rx="2" />
  <rect x="{rx - 9}" y="{ry - 9}" width="{rw + 18}" height="{rh + 18}" fill="none" stroke="#475569" stroke-width="1" rx="3" />
  <rect x="{rx - 1}" y="{ry - 1}" width="{rw + 2}" height="{rh + 2}" fill="none" stroke="#64748b" stroke-width="1" rx="1" />
"""

    # ── ENSUITE BATHROOM (KM DALAM) ──
    if has_bm:
        svg += f"""
  <!-- 🚿 ENSUITE BATHROOM COMPARTMENT -->
  <g id="ensuite_bathroom" filter="url(#drop_shadow_{uid})">
    <rect x="{bm_x}" y="{bm_y}" width="{bm_w}" height="{bm_h}" fill="url(#bm_tile_{uid})" stroke="#334155" stroke-width="4" />
    <rect x="{bm_x}" y="{bm_y}" width="{bm_w}" height="{bm_h}" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.5" />
    
    <!-- Walk-in Shower Screen -->
    <rect x="{bm_x + bm_w - 48}" y="{bm_y + 6}" width="42" height="42" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="1.2" />
    <circle cx="{bm_x + bm_w - 27}" cy="{bm_y + 27}" r="7" fill="none" stroke="#94a3b8" stroke-width="1.2" />
    <circle cx="{bm_x + bm_w - 27}" cy="{bm_y + 27}" r="2.5" fill="#38bdf8" />

    <!-- Toilet (WC) -->
    <rect x="{bm_x + 6}" y="{bm_y + 6}" width="26" height="10" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="0.8" />
    <path d="M {bm_x + 8} {bm_y + 16} C {bm_x + 8} {bm_y + 36} {bm_x + 30} {bm_y + 36} {bm_x + 30} {bm_y + 16} Z" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />

    <!-- Floating Vanity Basin -->
    <rect x="{bm_x + 6}" y="{bm_y + bm_h - 32}" width="36" height="26" rx="2" fill="#1e293b" stroke="#64748b" stroke-width="1" />
    <rect x="{bm_x + 11}" y="{bm_y + bm_h - 28}" width="26" height="18" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8" />
    <circle cx="{bm_x + 14}" cy="{bm_y + bm_h - 19}" r="2" fill="#38bdf8" />

    <!-- Bathroom Door Swing -->
    <rect x="{bm_x + bm_w - 32}" y="{bm_y + bm_h - 2}" width="30" height="4" fill="#090e17" />
    <path d="M {bm_x + bm_w - 30} {bm_y + bm_h} A 26 26 0 0 0 {bm_x + bm_w - 4} {bm_y + bm_h - 26}" fill="none" stroke="#38bdf8" stroke-width="0.9" stroke-dasharray="2 2" opacity="0.75" />
    <line x1="{bm_x + bm_w - 30}" y1="{bm_y + bm_h}" x2="{bm_x + bm_w - 4}" y2="{bm_y + bm_h}" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round" />
  </g>
"""

    # ── CAMERA BLIND SPOT / UNSURE ZONE (FROSTED BLUR) ──
    if unsure_zone:
        svg += f"""
  <!-- 🌫️ CAMERA BLIND SPOT (FROSTED ARCHITECTURAL BLUR) -->
  <g id="unsure_zone" opacity="0.95">
    <rect x="{uz_x}" y="{uz_y}" width="{uz_w}" height="{uz_h}" rx="5" fill="rgba(15, 23, 42, 0.85)" filter="url(#frost_blur_{uid})" />
    <rect x="{uz_x}" y="{uz_y}" width="{uz_w}" height="{uz_h}" rx="5" fill="url(#blind_hatch_{uid})" stroke="rgba(244, 63, 94, 0.45)" stroke-width="1" stroke-dasharray="3 2" />
    
    <rect x="{uz_x + 6}" y="{uz_y + (uz_h - 26)//2}" width="{uz_w - 12}" height="26" rx="4" fill="rgba(15, 23, 42, 0.94)" stroke="rgba(244, 63, 94, 0.5)" stroke-width="0.8" />
    <text x="{uz_x + uz_w/2}" y="{uz_y + (uz_h - 26)//2 + 11}" fill="#fda4af" font-size="7.5" font-weight="700" text-anchor="middle" letter-spacing="0.3">
      ⚲ BLIND SPOT
    </text>
    <text x="{uz_x + uz_w/2}" y="{uz_y + (uz_h - 26)//2 + 20}" fill="#94a3b8" font-size="6" font-weight="500" text-anchor="middle">
      Sudut Terbatas Kamera
    </text>
  </g>
"""

    # ── DESIGNER AREA RUG ──
    svg += f"""
  <!-- Area Rug -->
  <rect x="{rug_x}" y="{rug_y}" width="{rug_w}" height="{rug_h}" rx="6" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(148, 163, 184, 0.18)" stroke-width="0.8" stroke-dasharray="3 2" />
"""

    # ── BED CAD UNIT (PHYSICALLY PROPORTIONAL) ──
    svg += f"""
  <!-- 🛏️ BED CAD BLOCK (True Scale to Room) -->
  <g id="bed_unit" filter="url(#drop_shadow_{uid})">
    <!-- Solid Wood Headboard -->
    <rect x="{bx}" y="{by - 6}" width="{bw}" height="8" rx="2" fill="#3b271d" stroke="#78350f" stroke-width="1" />
    
    <!-- Reading Lamp Spots -->
    <circle cx="{bx + 12}" cy="{by - 2}" r="12" fill="url(#lamp_glow_{uid})" />
    <circle cx="{bx + bw - 12}" cy="{by - 2}" r="12" fill="url(#lamp_glow_{uid})" />
    <circle cx="{bx + 12}" cy="{by - 2}" r="2.5" fill="#fef08a" stroke="#d97706" stroke-width="0.8" />
    <circle cx="{bx + bw - 12}" cy="{by - 2}" r="2.5" fill="#fef08a" stroke="#d97706" stroke-width="0.8" />

    <!-- White Mattress Sheet Base -->
    <rect x="{bx + 2}" y="{by}" width="{bw - 4}" height="{bl}" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />

    <!-- Duvet with Exact Photo Blanket Hex -->
    <rect x="{bx + 2}" y="{by + 44}" width="{bw - 4}" height="{bl - 46}" rx="3" fill="{blanket_hex}" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
    
    <!-- Turnback Line -->
    <path d="M {bx + 2} {by + 44} Q {bx + (bw/2)} {by + 50} {bx + bw - 2} {by + 44}" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
    
    <!-- Accent Bed Runner -->
    <rect x="{bx + 2}" y="{by + bl - 32}" width="{bw - 4}" height="24" fill="{blanket_accent}" opacity="0.88" />
    <line x1="{bx + 2}" y1="{by + bl - 32}" x2="{bx + bw - 2}" y2="{by + bl - 32}" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
"""

    # Pillows
    if pillows == 1:
        svg += f"""
    <!-- Single Pillow -->
    <rect x="{bx + (bw//2) - 22}" y="{by + 6}" width="44" height="24" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
    <path d="M {bx + (bw//2) - 15} {by + 18} Q {bx + (bw//2)} {by + 21} {bx + (bw//2) + 15} {by + 18}" fill="none" stroke="#cbd5e1" stroke-width="0.8" />
"""
    else:
        pw = min(42, (bw - 18) // 2)
        svg += f"""
    <!-- Dual Hotel Pillows -->
    <rect x="{bx + 6}" y="{by + 6}" width="{pw}" height="24" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
    <path d="M {bx + 12} {by + 18} Q {bx + 6 + pw/2} {by + 21} {bx + pw} {by + 18}" fill="none" stroke="#cbd5e1" stroke-width="0.8" />
    
    <rect x="{bx + bw - 6 - pw}" y="{by + 6}" width="{pw}" height="24" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
    <path d="M {bx + bw - pw} {by + 18} Q {bx + bw - 6 - pw/2} {by + 21} {bx + bw - 12} {by + 18}" fill="none" stroke="#cbd5e1" stroke-width="0.8" />
"""

    svg += "  </g>\n"

    # Bedside Tables (Nakas)
    for nx, ny in nakas_items:
        svg += f"""
  <!-- Bedside Nakas -->
  <g filter="url(#drop_shadow_{uid})">
    <rect x="{nx}" y="{ny}" width="22" height="22" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" />
    <circle cx="{nx + 11}" cy="{ny + 11}" r="4.5" fill="#fef08a" stroke="#d97706" stroke-width="0.8" opacity="0.85" />
    <circle cx="{nx + 11}" cy="{ny + 11}" r="1.5" fill="#d97706" />
  </g>
"""

    # ── WARDROBE (LEMARI) ──
    if has_wardrobe:
        svg += f"""
  <!-- 🚪 WARDROBE (Scaled) -->
  <g id="wardrobe" filter="url(#drop_shadow_{uid})">
    <rect x="{wardrobe_x}" y="{wardrobe_y}" width="{ww}" height="{wh}" rx="2" fill="#1e293b" stroke="#475569" stroke-width="1.2" />
    <line x1="{wardrobe_x + 6}" y1="{wardrobe_y + wh/2}" x2="{wardrobe_x + ww - 6}" y2="{wardrobe_y + wh/2}" stroke="#64748b" stroke-width="1" stroke-dasharray="2 2" />
    <line x1="{wardrobe_x + ww/2}" y1="{wardrobe_y}" x2="{wardrobe_x + ww/2}" y2="{wardrobe_y + wh}" stroke="#38bdf8" stroke-width="1.2" />
  </g>
"""

    # ── WORK DESK & CHAIR ──
    if has_desk:
        svg += f"""
  <!-- 🖥️ WORK DESK & ERGONOMIC CHAIR (Scaled) -->
  <g id="desk_setup" filter="url(#drop_shadow_{uid})">
    <rect x="{desk_x}" y="{desk_y}" width="{dw}" height="{dh}" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1.2" />
    <!-- Laptop -->
    <rect x="{desk_x + dw/2 - 12}" y="{desk_y + 6}" width="24" height="15" rx="1.5" fill="#0f172a" stroke="#60a5fa" stroke-width="0.8" />
    <rect x="{desk_x + dw/2 - 10}" y="{desk_y + 8}" width="20" height="10" rx="1" fill="#38bdf8" opacity="0.65" />
    <!-- Ergonomic Chair -->
    <ellipse cx="{desk_x + dw/2}" cy="{desk_y + dh + 10}" rx="11" ry="8" fill="#334155" stroke="#94a3b8" stroke-width="1" />
    <path d="M {desk_x + dw/2 - 10} {desk_y + dh + 14} Q {desk_x + dw/2} {desk_y + dh + 17} {desk_x + dw/2 + 10} {desk_y + dh + 14}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
  </g>
"""

    # ── AC UNIT ──
    if has_ac:
        ac_w = 58
        ac_x = bx + round(bw / 2) - 29
        svg += f"""
  <!-- ❄️ AC UNIT -->
  <g id="ac_unit">
    <rect x="{ac_x}" y="{ry + 1}" width="{ac_w}" height="10" rx="2" fill="#f8fafc" stroke="#0284c7" stroke-width="1.2" />
    <line x1="{ac_x + 5}" y1="{ry + 8}" x2="{ac_x + ac_w - 5}" y2="{ry + 8}" stroke="#cbd5e1" stroke-width="1" />
    <circle cx="{ac_x + ac_w - 6}" cy="{ry + 5}" r="1" fill="#22c55e" />
  </g>
"""

    # ── MINI FRIDGE ──
    if has_fridge:
        svg += f"""
  <!-- 🧊 MINI FRIDGE -->
  <g id="fridge" filter="url(#drop_shadow_{uid})">
    <rect x="{fridge_x}" y="{fridge_y}" width="{fw}" height="{fh}" rx="2" fill="#1e293b" stroke="#475569" stroke-width="1.2" />
    <line x1="{fridge_x + fw - 4}" y1="{fridge_y + 6}" x2="{fridge_x + fw - 4}" y2="{fridge_y + fh - 6}" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" />
  </g>
"""

    # ── WINDOW ──
    if window_wall == 'left':
        svg += f"""
  <!-- 🪟 WINDOW (LEFT WALL) -->
  <g id="window_left">
    <rect x="{rx - 7}" y="{ry + round(rh/2) - win_h//2}" width="6" height="{win_h}" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
    <line x1="{rx - 4}" y1="{ry + round(rh/2) - win_h//2}" x2="{rx - 4}" y2="{ry + round(rh/2) + win_h//2}" stroke="#ffffff" stroke-width="1.2" />
  </g>
"""
    elif window_wall == 'right':
        svg += f"""
  <!-- 🪟 WINDOW (RIGHT WALL) -->
  <g id="window_right">
    <rect x="{rx + rw + 1}" y="{ry + round(rh/2) - win_h//2}" width="6" height="{win_h}" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
    <line x1="{rx + rw + 4}" y1="{ry + round(rh/2) - win_h//2}" x2="{rx + rw + 4}" y2="{ry + round(rh/2) + win_h//2}" stroke="#ffffff" stroke-width="1.2" />
  </g>
"""
    else:  # Top window
        top_win_x = rx + 14 if bed_side != 'left' else rx + rw - win_w - 14
        svg += f"""
  <!-- 🪟 WINDOW (TOP WALL) -->
  <g id="window_top">
    <rect x="{top_win_x}" y="{ry - 7}" width="{win_w}" height="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
    <line x1="{top_win_x}" y1="{ry - 4}" x2="{top_win_x + win_w}" y2="{ry - 4}" stroke="#ffffff" stroke-width="1.2" />
  </g>
"""

    # ── MAIN ENTRANCE DOORWAY (Bottom Wall) ──
    svg += f"""
  <!-- 🚪 MAIN ENTRANCE DOORWAY -->
  <g id="main_door">
    <rect x="{door_x}" y="{door_y - 4}" width="{door_w}" height="8" fill="#090e17" />
    <path d="M {door_x} {door_y} A {door_w - 8} {door_w - 8} 0 0 1 {door_x + door_w - 8} {door_y - (door_w - 8)}" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2.5 2" opacity="0.75" />
    <line x1="{door_x}" y1="{door_y}" x2="{door_x}" y2="{door_y - (door_w - 8)}" stroke="#f8fafc" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="{door_x + 5}" cy="{door_y - (door_w - 16)}" r="1.5" fill="#38bdf8" />
  </g>

  <!-- ── SWISS ARCHITECTURAL TITLE BLOCK (CARTOUCHE) ── -->
  <g id="title_block" transform="translate({CANVAS_W - 245}, {CANVAS_H - 52})">
    <rect x="0" y="0" width="230" height="40" rx="6" fill="rgba(12, 21, 39, 0.96)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1" />
    <text x="10" y="14" fill="#f8fafc" font-size="9" font-weight="800" letter-spacing="0.5">
      UNIT {room_number} • {area_m2:.1f} m²
    </text>
    <text x="10" y="25" fill="#38bdf8" font-size="7.5" font-weight="700">
      {bcfg['label']}
    </text>
    <text x="10" y="34" fill="#94a3b8" font-size="6.5" font-weight="500">
      {km_label} • SKALA 1:50
    </text>
    <!-- Micro CAD Version Seal -->
    <rect x="180" y="7" width="40" height="26" rx="4" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="0.8" />
    <text x="200" y="18" fill="#38bdf8" font-size="6.5" font-weight="800" text-anchor="middle">CAD</text>
    <text x="200" y="27" fill="#4ade80" font-size="5.8" font-weight="700" text-anchor="middle">VERIFIED</text>
  </g>

  <!-- ── MINIMALIST ARCHITECTURAL COMPASS (NORTH) ── -->
  <g id="north_compass" transform="translate({CANVAS_W - 55}, 35)">
    <circle cx="15" cy="15" r="13" fill="rgba(12, 21, 39, 0.9)" stroke="rgba(148, 163, 184, 0.4)" stroke-width="1" />
    <line x1="15" y1="4" x2="15" y2="26" stroke="rgba(148, 163, 184, 0.3)" stroke-width="0.75" />
    <line x1="4" y1="15" x2="26" y2="15" stroke="rgba(148, 163, 184, 0.3)" stroke-width="0.75" />
    <polygon points="15,6 18,15 15,13 12,15" fill="#38bdf8" />
    <polygon points="15,24 18,15 15,17 12,15" fill="#475569" />
    <text x="15" y="2" fill="#38bdf8" font-size="7" font-weight="900" text-anchor="middle">U</text>
  </g>
</svg>"""

    return svg

def worker(r):
    svg = render_luxury_cad_svg(r)
    filename = r.get("blueprint_file") or f"plan_{r['id']:03d}.svg"
    
    # Save to public/downloads/blueprints/
    p1 = os.path.join("public", "downloads", "blueprints", filename)
    with open(p1, "w", encoding="utf-8") as f:
        f.write(svg)
        
    # Save to stress_test_500/blueprints/ if directory exists
    p2 = os.path.join("stress_test_500", "blueprints", filename)
    if os.path.exists("stress_test_500/blueprints"):
        with open(p2, "w", encoding="utf-8") as f:
            f.write(svg)

def main():
    start = time.time()
    with open("public/benchmark_results.json", "r", encoding="utf-8") as f:
        rooms = json.load(f)
        
    print(f"Regenerating 500 physically proportional architectural CAD blueprints...")
    with ThreadPoolExecutor(max_workers=16) as pool:
        list(pool.map(worker, rooms))
        
    elapsed = round(time.time() - start, 2)
    print(f"✓ Successfully regenerated all {len(rooms)} blueprint SVGs in {elapsed}s!")

if __name__ == "__main__":
    main()
