import os
import json
import time
from concurrent.futures import ThreadPoolExecutor

def render_luxury_cad_svg(spec):
    w_m = spec["width_m"]
    l_m = spec["length_m"]
    area_m2 = spec["area_m2"]
    furnitures = spec["furnitures"]
    bed_type = spec["bed_type"]
    bed_side = spec.get("bed_side") or spec.get("cv_features", {}).get("bed_side", "center")
    window_wall = spec.get("window_wall") or spec.get("cv_features", {}).get("window_wall", "top")
    room_number = spec["room_number"]
    pillows = spec["pillows"]
    blanket_hex = spec.get("blanket_hex") or spec.get("cv_features", {}).get("blanket_hex", "#f8fafc")
    blanket_accent = spec.get("blanket_accent") or spec.get("cv_features", {}).get("blanket_accent", "#3b82f6")
    floor_hex = spec.get("floor_hex") or spec.get("cv_features", {}).get("floor_hex", "#334155")
    floor_type = spec.get("floor_type") or spec.get("cv_features", {}).get("floor_type", "Parquet Wood")
    has_bm = spec["has_bathroom"]
    unsure_zone = spec.get("unsure_zone")
    uid = spec["id"]
    
    has_wardrobe = "wardrobe" in furnitures
    has_desk = "desk" in furnitures
    has_ac = "ac" in furnitures
    has_fridge = "fridge" in furnitures
    
    # Bed dimensions in CAD pixels
    bed_dim_map = {
        "single": {"w": 84, "l": 150, "label": "SINGLE BED (100x200)"},
        "super_single": {"w": 96, "l": 150, "label": "SUPER SINGLE (120x200)"},
        "double": {"w": 116, "l": 150, "label": "DOUBLE BED (140x200)"},
        "queen": {"w": 130, "l": 150, "label": "QUEEN BED (160x200)"},
        "king": {"w": 150, "l": 150, "label": "KING BED (180x200)"}
    }
    bcfg = bed_dim_map.get(bed_type, bed_dim_map["double"])
    km_label = "KM DALAM (ENSUITE)" if has_bm else "KM LUAR (SHARED)"
    
    # Coordinates inside room bounds: x: 96 to 576 (width 480), y: 56 to 376 (height 320)
    if not has_bm:
        # KM Luar: No bathroom inside room
        bm_x, bm_y = -999, -999
        if bed_side == 'left':
            bed_x = 106
            bed_y = 66
            nakas_items = [(bed_x + bcfg['w'] + 8, 68)]
            desk_x, desk_y = 445, 75
            wardrobe_x, wardrobe_y = 445, 240
            ac_x = 310
            fridge_x, fridge_y = 106, 290
        elif bed_side == 'center':
            bed_x = 335 - (bcfg['w'] // 2)
            bed_y = 66
            nakas_items = [(bed_x - 34, 68), (bed_x + bcfg['w'] + 6, 68)]
            wardrobe_x, wardrobe_y = 106, 210
            desk_x, desk_y = 445, 210
            ac_x = 335 - 38
            fridge_x, fridge_y = 106, 295
        else: # right
            bed_x = 564 - bcfg['w'] - 8
            bed_y = 66
            nakas_items = [(bed_x - 34, 68)]
            desk_x, desk_y = 106, 75
            wardrobe_x, wardrobe_y = 106, 240
            ac_x = 240
            fridge_x, fridge_y = 445, 290
    else:
        # KM Dalam: Ensuite bathroom present
        if bed_side == 'left':
            bed_x = 106
            bed_y = 66
            nakas_items = [(bed_x + bcfg['w'] + 8, 68)]
            bm_x, bm_y = 420, 62
            desk_x, desk_y = 445, 260
            wardrobe_x, wardrobe_y = 106, 280
            ac_x = 280
            fridge_x, fridge_y = 230, 290
        elif bed_side == 'center':
            bed_x = 345 - (bcfg['w'] // 2)
            bed_y = 66
            nakas_items = [(bed_x - 34, 68), (bed_x + bcfg['w'] + 6, 68)]
            bm_x, bm_y = 102, 62
            wardrobe_x, wardrobe_y = 106, 280
            desk_x, desk_y = 445, 280
            ac_x = bed_x + (bcfg['w'] // 2) - 38
            fridge_x, fridge_y = 235, 290
        else: # right
            bed_x = 564 - bcfg['w'] - 8
            bed_y = 66
            nakas_items = [(bed_x - 34, 68)]
            bm_x, bm_y = 102, 62
            desk_x, desk_y = 106, 265
            wardrobe_x, wardrobe_y = 445, 280
            ac_x = 310
            fridge_x, fridge_y = 235, 290

    # Area rug under bed
    rug_x = bed_x - 12
    rug_y = bed_y + 30
    rug_w = bcfg['w'] + 24
    rug_h = bcfg['l'] + 16

    # Unsure zone coordinates
    if unsure_zone:
        side = unsure_zone.get("side", "left_front")
        if side == "left_front":
            uz_x, uz_y, uz_w, uz_h = 104, 235, 140, 130
        elif side == "right_front":
            uz_x, uz_y, uz_w, uz_h = 424, 235, 140, 130
        else:
            uz_x, uz_y, uz_w, uz_h = 104, 235, 140, 130
    else:
        uz_x, uz_y, uz_w, uz_h = 0, 0, 0, 0

    # Main door position: centered along bottom wall
    door_x = 295
    door_y = 372

    # Window configuration
    has_win_left = window_wall == 'left'
    has_win_right = window_wall == 'right'
    has_win_top = window_wall not in ['left', 'right']

    # Adjust top window & AC to ensure zero overlap
    if has_win_top:
        if bed_side == 'left':
            win_top_x = 240
            ac_x = 345 if not has_bm else 115
        elif bed_side == 'center':
            win_top_x = 445
            ac_x = 345 - 38
        else: # right
            win_top_x = 240
            ac_x = 345

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 440" width="100%" height="100%" style="background:#090e17; border-radius:14px; font-family:'Inter',system-ui,-apple-system,sans-serif;">
  <defs>
    <!-- Architectural Fine Grid (16px) -->
    <pattern id="grid_cad_{uid}" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(148, 163, 184, 0.04)" stroke-width="0.75" />
    </pattern>
    <!-- Architectural Major Module Grid (80px) -->
    <pattern id="grid_major_{uid}" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(56, 189, 248, 0.08)" stroke-width="1" />
    </pattern>
    <!-- Luxury Parquet Wood Floor Pattern -->
    <pattern id="parquet_{uid}" width="48" height="24" patternUnits="userSpaceOnUse">
      <rect width="48" height="24" fill="{floor_hex}" fill-opacity="0.32" />
      <path d="M 0 12 L 48 12 M 24 0 L 24 12 M 0 24 L 48 24 M 48 12 L 48 24 M 0 0 L 0 12" fill="none" stroke="rgba(255, 255, 255, 0.07)" stroke-width="0.6" />
    </pattern>
    <!-- Bathroom Ceramic Micro-Tile Pattern -->
    <pattern id="bm_tile_{uid}" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#0f2338" />
      <path d="M 14 0 L 0 0 0 14" fill="none" stroke="rgba(56, 189, 248, 0.22)" stroke-width="0.6" />
    </pattern>
    <!-- Frosted Glass Blur Filter for Camera Blind Spot -->
    <filter id="frost_blur_{uid}" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
    </filter>
    <!-- Architectural 45-deg Hatch for Blind Spot -->
    <pattern id="blind_hatch_{uid}" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(244, 63, 94, 0.35)" stroke-width="1.2" stroke-dasharray="2 2" />
    </pattern>
    <!-- Window Light Ray Gradient -->
    <linearGradient id="win_light_{uid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
    </linearGradient>
    <!-- Reading Lamp Warm Radial Glow -->
    <radialGradient id="lamp_glow_{uid}">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#fef08a" stop-opacity="0" />
    </radialGradient>
    <!-- Bed Shadow Filter -->
    <filter id="drop_shadow_{uid}" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background CAD Drafting Paper -->
  <rect width="680" height="440" fill="#090e17" />
  <rect width="680" height="440" fill="url(#grid_cad_{uid})" />
  <rect width="680" height="440" fill="url(#grid_major_{uid})" />

  <!-- Sheet Crop Registration Marks (Architectural Standard) -->
  <g stroke="rgba(148, 163, 184, 0.4)" stroke-width="1">
    <path d="M 12 18 L 18 18 M 18 12 L 18 18" />
    <path d="M 668 18 L 662 18 M 662 12 L 662 18" />
    <path d="M 12 422 L 18 422 M 18 428 L 18 422" />
    <path d="M 668 422 L 662 422 M 662 428 L 662 422" />
  </g>

  <!-- ── DIMENSION LINES (Architectural 45° Tick Standard) ── -->
  <!-- Top Horizontal Dimension -->
  <g stroke="#38bdf8" stroke-width="1.2">
    <line x1="96" y1="28" x2="574" y2="28" opacity="0.85" />
    <!-- 45-deg Architectural Slash Ticks -->
    <line x1="91" y1="33" x2="101" y2="23" stroke-width="1.8" />
    <line x1="569" y1="33" x2="579" y2="23" stroke-width="1.8" />
    <!-- Extension lines -->
    <line x1="96" y1="38" x2="96" y2="20" opacity="0.4" stroke-width="0.75" />
    <line x1="574" y1="38" x2="574" y2="20" opacity="0.4" stroke-width="0.75" />
    <!-- Dimension Pill Label -->
    <rect x="290" y="16" width="90" height="22" rx="4" fill="#0c1527" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1" />
    <text x="335" y="31" fill="#38bdf8" font-size="10" font-weight="700" text-anchor="middle" letter-spacing="0.5">
      {w_m:.2f} m
    </text>
  </g>

  <!-- Left Vertical Dimension -->
  <g stroke="#38bdf8" stroke-width="1.2">
    <line x1="68" y1="56" x2="68" y2="376" opacity="0.85" />
    <!-- 45-deg Architectural Slash Ticks -->
    <line x1="63" y1="61" x2="73" y2="51" stroke-width="1.8" />
    <line x1="63" y1="381" x2="73" y2="371" stroke-width="1.8" />
    <!-- Extension lines -->
    <line x1="78" y1="56" x2="60" y2="56" opacity="0.4" stroke-width="0.75" />
    <line x1="78" y1="376" x2="60" y2="376" opacity="0.4" stroke-width="0.75" />
    <!-- Dimension Pill Label (Rotated) -->
    <g transform="translate(68, 216)">
      <rect x="-42" y="-11" width="84" height="22" rx="4" fill="#0c1527" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1" transform="rotate(-90)" />
      <text x="0" y="4" fill="#38bdf8" font-size="10" font-weight="700" text-anchor="middle" letter-spacing="0.5" transform="rotate(-90)">
        {l_m:.2f} m
      </text>
    </g>
  </g>

  <!-- ── ROOM FLOOR & AMBIENT DEPTH ── -->
  <!-- Parquet/Tile Floor Texture -->
  <rect x="96" y="56" width="478" height="320" rx="2" fill="url(#parquet_{uid})" />
  <!-- Inner Ambient Perimeter Vignette -->
  <rect x="96" y="56" width="478" height="320" fill="none" stroke="rgba(0, 0, 0, 0.35)" stroke-width="6" />

  <!-- ── ARCHITECTURAL CAVITY WALLS (Double Line Composite) ── -->
  <!-- Solid Structural Core -->
  <rect x="90" y="50" width="490" height="332" fill="none" stroke="#1e293b" stroke-width="10" rx="3" />
  <!-- Exterior Structural Line -->
  <rect x="85" y="45" width="500" height="342" fill="none" stroke="#475569" stroke-width="1" rx="4" />
  <!-- Interior Plaster Casing Line -->
  <rect x="95" y="55" width="480" height="322" fill="none" stroke="#64748b" stroke-width="1.2" rx="2" />
"""

    # ── ENSUITE BATHROOM (KM DALAM) ──
    if has_bm:
        svg += f"""
  <!-- 🚿 ENSUITE BATHROOM COMPARTMENT (Architectural Precision) -->
  <g id="ensuite_bathroom" filter="url(#drop_shadow_{uid})">
    <!-- Bathroom Boundary Walls -->
    <rect x="{bm_x}" y="{bm_y}" width="144" height="132" fill="url(#bm_tile_{uid})" stroke="#334155" stroke-width="5" />
    <rect x="{bm_x}" y="{bm_y}" width="144" height="132" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.6" />
    
    <!-- Walk-in Glass Shower Cubicle -->
    <rect x="{bm_x + 72}" y="{bm_y + 8}" width="64" height="64" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="1.5" />
    <!-- Glass Shower Screen -->
    <line x1="{bm_x + 72}" y1="{bm_y + 8}" x2="{bm_x + 72}" y2="{bm_y + 72}" stroke="#38bdf8" stroke-width="2" />
    <!-- Overhead Rain Shower Head -->
    <circle cx="{bm_x + 104}" cy="{bm_y + 40}" r="9" fill="none" stroke="#94a3b8" stroke-width="1.5" />
    <circle cx="{bm_x + 104}" cy="{bm_y + 40}" r="3" fill="#38bdf8" />
    <!-- Stainless Linear Floor Drain -->
    <rect x="{bm_x + 128}" y="{bm_y + 16}" width="4" height="48" rx="1" fill="#64748b" />

    <!-- Wall-Hung Modern Toilet (WC) -->
    <rect x="{bm_x + 10}" y="{bm_y + 8}" width="34" height="14" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="1" />
    <!-- Dual Flush Button Plate -->
    <rect x="{bm_x + 22}" y="{bm_y + 10}" width="10" height="4" rx="1" fill="#94a3b8" />
    <!-- Ergonomic Ceramic Toilet Bowl -->
    <path d="M {bm_x + 13} {bm_y + 22} C {bm_x + 13} {bm_y + 50} {bm_x + 41} {bm_y + 50} {bm_x + 41} {bm_y + 22} Z" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" />
    <ellipse cx="{bm_x + 27}" cy="{bm_y + 34}" rx="8" ry="10" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="0.8" />

    <!-- Floating Vanity Basin Unit -->
    <rect x="{bm_x + 10}" y="{bm_y + 84}" width="48" height="38" rx="3" fill="#1e293b" stroke="#64748b" stroke-width="1.2" />
    <rect x="{bm_x + 16}" y="{bm_y + 90}" width="36" height="24" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
    <!-- Chrome Mixer Faucet -->
    <circle cx="{bm_x + 19}" cy="{bm_y + 102}" r="2.5" fill="#38bdf8" />
    <line x1="{bm_x + 19}" y1="{bm_y + 102}" x2="{bm_x + 25}" y2="{bm_y + 102}" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" />

    <!-- Bathroom Door Opening & 90-deg Swing Arc -->
    <rect x="{bm_x + 88}" y="{bm_y + 128}" width="38" height="6" fill="#090e17" />
    <path d="M {bm_x + 88} {bm_y + 128} A 34 34 0 0 0 {bm_x + 122} {bm_y + 94}" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2.5 2.5" opacity="0.75" />
    <line x1="{bm_x + 88}" y1="{bm_y + 128}" x2="{bm_x + 122}" y2="{bm_y + 128}" stroke="#e2e8f0" stroke-width="2.5" stroke-linecap="round" />
  </g>
"""

    # ── CAMERA BLIND SPOT / UNSURE ZONE (FROSTED ARCHITECTURAL BLUR) ──
    if unsure_zone:
        svg += f"""
  <!-- 🌫️ CAMERA BLIND SPOT (FROSTED ARCHITECTURAL BLUR) -->
  <g id="unsure_zone" opacity="0.95">
    <!-- Blurred Backdrop -->
    <rect x="{uz_x}" y="{uz_y}" width="{uz_w}" height="{uz_h}" rx="6" fill="rgba(15, 23, 42, 0.85)" filter="url(#frost_blur_{uid})" />
    <!-- Diagonal 45-deg Architectural Hatching -->
    <rect x="{uz_x}" y="{uz_y}" width="{uz_w}" height="{uz_h}" rx="6" fill="url(#blind_hatch_{uid})" stroke="rgba(244, 63, 94, 0.45)" stroke-width="1.2" stroke-dasharray="4 3" />
    
    <!-- Minimalist Architectural Badge -->
    <rect x="{uz_x + 10}" y="{uz_y + (uz_h - 32)//2}" width="{uz_w - 20}" height="32" rx="5" fill="rgba(15, 23, 42, 0.94)" stroke="rgba(244, 63, 94, 0.5)" stroke-width="1" />
    <text x="{uz_x + uz_w/2}" y="{uz_y + (uz_h - 32)//2 + 14}" fill="#fda4af" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="0.5">
      ⚲ CAMERA BLIND SPOT
    </text>
    <text x="{uz_x + uz_w/2}" y="{uz_y + (uz_h - 32)//2 + 25}" fill="#94a3b8" font-size="6.8" font-weight="500" text-anchor="middle">
      Di Luar Sudut Kamera • AI Presisi
    </text>
  </g>
"""

    # ── DESIGNER AREA RUG ──
    svg += f"""
  <!-- Designer Area Rug -->
  <rect x="{rug_x}" y="{rug_y}" width="{rug_w}" height="{rug_h}" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(148, 163, 184, 0.2)" stroke-width="1" stroke-dasharray="4 3" />
"""

    # ── LUXURY BED UNIT (100% PRECISE ARCHITECTURAL CAD SYMBOL) ──
    svg += f"""
  <!-- 🛏️ MASTER BED CAD BLOCK (Visual Twin with Real Photo) -->
  <g id="bed_unit" filter="url(#drop_shadow_{uid})">
    <!-- Solid Walnut / Oak Headboard -->
    <rect x="{bed_x}" y="{bed_y - 8}" width="{bcfg['w']}" height="10" rx="3" fill="#3b271d" stroke="#78350f" stroke-width="1.2" />
    
    <!-- Reading Lamp Warm Ambient Glow Spots -->
    <circle cx="{bed_x + 14}" cy="{bed_y - 3}" r="16" fill="url(#lamp_glow_{uid})" />
    <circle cx="{bed_x + bcfg['w'] - 14}" cy="{bed_y - 3}" r="16" fill="url(#lamp_glow_{uid})" />
    <circle cx="{bed_x + 14}" cy="{bed_y - 3}" r="3" fill="#fef08a" stroke="#d97706" stroke-width="1" />
    <circle cx="{bed_x + bcfg['w'] - 14}" cy="{bed_y - 3}" r="3" fill="#fef08a" stroke="#d97706" stroke-width="1" />

    <!-- Crisp White Bed Sheet / Base Mattress -->
    <rect x="{bed_x + 2}" y="{bed_y}" width="{bcfg['w'] - 4}" height="{bcfg['l']}" rx="5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" />

    <!-- Plush Architectural Duvet (Matching Real Photo Blanket Hex) -->
    <rect x="{bed_x + 2}" y="{bed_y + 48}" width="{bcfg['w'] - 4}" height="{bcfg['l'] - 50}" rx="4" fill="{blanket_hex}" stroke="rgba(0,0,0,0.15)" stroke-width="1" />
    
    <!-- Duvet Fold Turnback Line (Linen Underlay) -->
    <path d="M {bed_x + 2} {bed_y + 48} Q {bed_x + (bcfg['w']/2)} {bed_y + 54} {bed_x + bcfg['w'] - 2} {bed_y + 48}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
    
    <!-- Duvet Bed Runner / Accent Throw (Photo Accent Hex) -->
    <rect x="{bed_x + 2}" y="{bed_y + bcfg['l'] - 38}" width="{bcfg['w'] - 4}" height="28" fill="{blanket_accent}" opacity="0.88" />
    <line x1="{bed_x + 2}" y1="{bed_y + bcfg['l'] - 38}" x2="{bed_x + bcfg['w'] - 2}" y2="{bed_y + bcfg['l'] - 38}" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
"""

    # Pillows (1 or 2 based on spec)
    if pillows == 1:
        svg += f"""
    <!-- Single Ergonomic Pillow with Seam Stitch -->
    <rect x="{bed_x + (bcfg['w']//2) - 26}" y="{bed_y + 8}" width="52" height="28" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
    <path d="M {bed_x + (bcfg['w']//2) - 18} {bed_y + 22} Q {bed_x + (bcfg['w']//2)} {bed_y + 25} {bed_x + (bcfg['w']//2) + 18} {bed_y + 22}" fill="none" stroke="#cbd5e1" stroke-width="1" />
"""
    else:
        p_w = min(48, (bcfg["w"] - 22) // 2)
        svg += f"""
    <!-- Dual Hotel King Pillows with Seam Stitches -->
    <rect x="{bed_x + 7}" y="{bed_y + 8}" width="{p_w}" height="28" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
    <path d="M {bed_x + 15} {bed_y + 22} Q {bed_x + 7 + p_w/2} {bed_y + 25} {bed_x + 7 + p_w - 8} {bed_y + 22}" fill="none" stroke="#cbd5e1" stroke-width="1" />
    
    <rect x="{bed_x + bcfg['w'] - 7 - p_w}" y="{bed_y + 8}" width="{p_w}" height="28" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
    <path d="M {bed_x + bcfg['w'] - p_w + 1} {bed_y + 22} Q {bed_x + bcfg['w'] - 7 - p_w/2} {bed_y + 25} {bed_x + bcfg['w'] - 15} {bed_y + 22}" fill="none" stroke="#cbd5e1" stroke-width="1" />
"""

    svg += "  </g>\n"

    # Bedside Tables (Nakas)
    for nx, ny in nakas_items:
        svg += f"""
  <!-- Bedside Table (Nakas) -->
  <g filter="url(#drop_shadow_{uid})">
    <rect x="{nx}" y="{ny}" width="28" height="28" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1.2" />
    <circle cx="{nx + 14}" cy="{ny + 14}" r="5.5" fill="#fef08a" stroke="#d97706" stroke-width="1" opacity="0.85" />
    <circle cx="{nx + 14}" cy="{ny + 14}" r="2" fill="#d97706" />
  </g>
"""

    # ── WARDROBE (LEMARI) ──
    if has_wardrobe:
        svg += f"""
  <!-- 🚪 WARDROBE (Sliding Doors with Hanger Rail) -->
  <g id="wardrobe" filter="url(#drop_shadow_{uid})">
    <rect x="{wardrobe_x}" y="{wardrobe_y}" width="112" height="48" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
    <!-- Hanger Rail Line -->
    <line x1="{wardrobe_x + 8}" y1="{wardrobe_y + 24}" x2="{wardrobe_x + 104}" y2="{wardrobe_y + 24}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="2 3" />
    <!-- Clothes Hangers CAD Ticks -->
    <line x1="{wardrobe_x + 26}" y1="{wardrobe_y + 16}" x2="{wardrobe_x + 34}" y2="{wardrobe_y + 32}" stroke="#94a3b8" stroke-width="1" />
    <line x1="{wardrobe_x + 48}" y1="{wardrobe_y + 16}" x2="{wardrobe_x + 56}" y2="{wardrobe_y + 32}" stroke="#94a3b8" stroke-width="1" />
    <line x1="{wardrobe_x + 70}" y1="{wardrobe_y + 16}" x2="{wardrobe_x + 78}" y2="{wardrobe_y + 32}" stroke="#94a3b8" stroke-width="1" />
    <line x1="{wardrobe_x + 90}" y1="{wardrobe_y + 16}" x2="{wardrobe_x + 98}" y2="{wardrobe_y + 32}" stroke="#94a3b8" stroke-width="1" />
    <!-- Sliding Track Center Line -->
    <line x1="{wardrobe_x + 56}" y1="{wardrobe_y}" x2="{wardrobe_x + 56}" y2="{wardrobe_y + 48}" stroke="#38bdf8" stroke-width="1.5" />
    <circle cx="{wardrobe_x + 52}" cy="{wardrobe_y + 24}" r="2" fill="#38bdf8" />
    <circle cx="{wardrobe_x + 60}" cy="{wardrobe_y + 24}" r="2" fill="#38bdf8" />
  </g>
"""

    # ── WORK DESK & ERGONOMIC CHAIR ──
    if has_desk:
        svg += f"""
  <!-- 🖥️ WORK DESK & ERGONOMIC CHAIR -->
  <g id="desk_setup" filter="url(#drop_shadow_{uid})">
    <!-- Desk Surface -->
    <rect x="{desk_x}" y="{desk_y}" width="108" height="50" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
    <!-- Laptop CAD Block -->
    <rect x="{desk_x + 38}" y="{desk_y + 8}" width="28" height="18" rx="2" fill="#0f172a" stroke="#60a5fa" stroke-width="1" />
    <rect x="{desk_x + 40}" y="{desk_y + 10}" width="24" height="13" rx="1" fill="#38bdf8" opacity="0.65" />
    <!-- Minimalist Desk Lamp -->
    <circle cx="{desk_x + 18}" cy="{desk_y + 16}" r="5" fill="#fef08a" stroke="#d97706" stroke-width="1" opacity="0.85" />
    <!-- Notepad & Pen -->
    <rect x="{desk_x + 82}" y="{desk_y + 12}" width="14" height="20" rx="1" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8" />
    
    <!-- Ergonomic Swivel Chair with Armrests -->
    <ellipse cx="{desk_x + 52}" cy="{desk_y + 60}" rx="14" ry="11" fill="#334155" stroke="#94a3b8" stroke-width="1.2" />
    <!-- Curved Mesh Backrest -->
    <path d="M {desk_x + 38} {desk_y + 66} Q {desk_x + 52} {desk_y + 70} {desk_x + 66} {desk_y + 66}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
    <!-- Left & Right Armrests -->
    <line x1="{desk_x + 36}" y1="{desk_y + 54}" x2="{desk_x + 36}" y2="{desk_y + 64}" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
    <line x1="{desk_x + 68}" y1="{desk_y + 54}" x2="{desk_x + 68}" y2="{desk_y + 64}" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
  </g>
"""

    # ── AC UNIT (SPLIT WALL UNIT) ──
    if has_ac:
        svg += f"""
  <!-- ❄️ AC INDOOR SPLIT UNIT -->
  <g id="ac_unit">
    <rect x="{ac_x}" y="52" width="76" height="14" rx="2" fill="#f8fafc" stroke="#0284c7" stroke-width="1.5" />
    <!-- Air Deflector Vane -->
    <line x1="{ac_x + 6}" y1="62" x2="{ac_x + 70}" y2="62" stroke="#cbd5e1" stroke-width="1.5" />
    <!-- Gentle Airflow Direction Dashes -->
    <line x1="{ac_x + 18}" y1="66" x2="{ac_x + 14}" y2="74" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="2 2" />
    <line x1="{ac_x + 38}" y1="66" x2="{ac_x + 38}" y2="76" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="2 2" />
    <line x1="{ac_x + 58}" y1="66" x2="{ac_x + 62}" y2="74" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="2 2" />
    <!-- Minimalist LED Dot -->
    <circle cx="{ac_x + 66}" cy="58" r="1.5" fill="#22c55e" />
  </g>
"""

    # ── MINI FRIDGE (IF PRESENT) ──
    if has_fridge:
        svg += f"""
  <!-- 🧊 MINI FRIDGE -->
  <g id="fridge" filter="url(#drop_shadow_{uid})">
    <rect x="{fridge_x}" y="{fridge_y}" width="36" height="38" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
    <line x1="{fridge_x + 30}" y1="{fridge_y + 8}" x2="{fridge_x + 30}" y2="{fridge_y + 24}" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
    <!-- Subtle Frost Icon -->
    <circle cx="{fridge_x + 18}" cy="{fridge_y + 19}" r="3" fill="none" stroke="#38bdf8" stroke-width="0.8" opacity="0.6" />
  </g>
"""

    # ── WINDOW OPENINGS & ARCHITECTURAL LIGHT CONE ──
    if has_win_left:
        svg += f"""
  <!-- 🪟 WINDOW (LEFT WALL) -->
  <g id="window_left">
    <!-- Light Ray into Room -->
    <polygon points="95,140 180,120 180,260 95,240" fill="url(#win_light_{uid})" opacity="0.45" />
    <!-- Outer Sill -->
    <rect x="83" y="140" width="4" height="100" fill="#94a3b8" />
    <!-- Double Glazing Panes -->
    <rect x="87" y="140" width="8" height="100" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" />
    <line x1="91" y1="140" x2="91" y2="240" stroke="#ffffff" stroke-width="1.5" />
    <!-- Frame Mullions -->
    <line x1="87" y1="190" x2="95" y2="190" stroke="#38bdf8" stroke-width="1.5" />
  </g>
"""
    elif has_win_right:
        svg += f"""
  <!-- 🪟 WINDOW (RIGHT WALL) -->
  <g id="window_right">
    <!-- Light Ray into Room -->
    <polygon points="575,140 490,120 490,260 575,240" fill="url(#win_light_{uid})" opacity="0.45" />
    <!-- Outer Sill -->
    <rect x="583" y="140" width="4" height="100" fill="#94a3b8" />
    <!-- Double Glazing Panes -->
    <rect x="575" y="140" width="8" height="100" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" />
    <line x1="579" y1="140" x2="579" y2="240" stroke="#ffffff" stroke-width="1.5" />
    <!-- Frame Mullions -->
    <line x1="575" y1="190" x2="583" y2="190" stroke="#38bdf8" stroke-width="1.5" />
  </g>
"""
    else: # Top Window
        svg += f"""
  <!-- 🪟 WINDOW (TOP WALL) -->
  <g id="window_top">
    <!-- Light Ray into Room -->
    <polygon points="{win_top_x},55 {win_top_x - 30},140 {win_top_x + 110},140 {win_top_x + 80},55" fill="url(#win_light_{uid})" opacity="0.45" />
    <!-- Outer Sill -->
    <rect x="{win_top_x}" y="43" width="80" height="4" fill="#94a3b8" />
    <!-- Double Glazing Panes -->
    <rect x="{win_top_x}" y="47" width="80" height="8" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" />
    <line x1="{win_top_x}" y1="51" x2="{win_top_x + 80}" y2="51" stroke="#ffffff" stroke-width="1.5" />
    <!-- Frame Mullion -->
    <line x1="{win_top_x + 40}" y1="47" x2="{win_top_x + 40}" y2="55" stroke="#38bdf8" stroke-width="1.5" />
  </g>
"""

    # ── MAIN ENTRANCE DOOR & 90-DEG SWING ARC ──
    svg += f"""
  <!-- 🚪 MAIN ENTRANCE DOORWAY (Skala Standar 900mm) -->
  <g id="main_door">
    <!-- Wall Opening Void -->
    <rect x="{door_x}" y="368" width="56" height="12" fill="#090e17" />
    <!-- Door Frame Jambs -->
    <rect x="{door_x - 3}" y="366" width="4" height="14" fill="#94a3b8" />
    <rect x="{door_x + 55}" y="366" width="4" height="14" fill="#94a3b8" />
    <!-- 90-deg Door Swing Arc (Architectural Hairline) -->
    <path d="M {door_x} 372 A 50 50 0 0 1 {door_x + 50} 322" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.75" />
    <!-- Door Leaf Solid Plank with Handle -->
    <line x1="{door_x}" y1="372" x2="{door_x}" y2="322" stroke="#f8fafc" stroke-width="3.5" stroke-linecap="round" />
    <circle cx="{door_x + 6}" cy="332" r="1.8" fill="#38bdf8" />
  </g>

  <!-- ── SWISS ARCHITECTURAL TITLE BLOCK (CARTOUCHE) ── -->
  <!-- Positioned in bottom-right corner: 100% unobtrusive, floor remains pristine! -->
  <g id="title_block" transform="translate(430, 386)">
    <rect x="0" y="0" width="234" height="42" rx="6" fill="rgba(12, 21, 39, 0.96)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1" />
    <text x="12" y="14" fill="#f8fafc" font-size="9" font-weight="800" letter-spacing="0.5">
      UNIT {room_number} • {area_m2:.1f} m²
    </text>
    <text x="12" y="26" fill="#38bdf8" font-size="7.5" font-weight="700">
      {bcfg['label']}
    </text>
    <text x="12" y="36" fill="#94a3b8" font-size="6.8" font-weight="500">
      {km_label} • SKALA 1:50
    </text>
    <!-- Micro CAD Version Seal -->
    <rect x="184" y="8" width="40" height="26" rx="4" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="0.8" />
    <text x="204" y="20" fill="#38bdf8" font-size="6.5" font-weight="800" text-anchor="middle">CAD</text>
    <text x="204" y="29" fill="#4ade80" font-size="5.8" font-weight="700" text-anchor="middle">VERIFIED</text>
  </g>

  <!-- ── MINIMALIST ARCHITECTURAL COMPASS (NORTH INDICATOR) ── -->
  <g id="north_compass" transform="translate(620, 72)">
    <circle cx="16" cy="16" r="14" fill="rgba(12, 21, 39, 0.9)" stroke="rgba(148, 163, 184, 0.4)" stroke-width="1" />
    <!-- Fine Crosshairs -->
    <line x1="16" y1="4" x2="16" y2="28" stroke="rgba(148, 163, 184, 0.3)" stroke-width="0.75" />
    <line x1="4" y1="16" x2="28" y2="16" stroke="rgba(148, 163, 184, 0.3)" stroke-width="0.75" />
    <!-- North Arrow Needle -->
    <polygon points="16,6 19,16 16,14 13,16" fill="#38bdf8" />
    <polygon points="16,26 19,16 16,18 13,16" fill="#475569" />
    <!-- North 'U' Letter -->
    <text x="16" y="2" fill="#38bdf8" font-size="7.5" font-weight="900" text-anchor="middle">U</text>
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
        
    print(f"Regenerating 500 luxury architectural CAD blueprints...")
    with ThreadPoolExecutor(max_workers=16) as pool:
        list(pool.map(worker, rooms))
        
    elapsed = round(time.time() - start, 2)
    print(f"✓ Successfully regenerated all {len(rooms)} blueprint SVGs in {elapsed}s!")

if __name__ == "__main__":
    main()
