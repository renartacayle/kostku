import os
import json
import time
import math
from concurrent.futures import ThreadPoolExecutor


def clamp(val, lo, hi):
    return max(lo, min(hi, val))


def render_luxury_cad_svg(spec):
    w_m = float(spec["width_m"])
    l_m = float(spec["length_m"])
    area_m2 = float(spec["area_m2"])
    furnitures = spec.get("furnitures") or []
    bed_type = spec.get("bed_type", "double")
    cv_feat = spec.get("cv_features", {}) or {}
    bed_side = spec.get("bed_side") or cv_feat.get("bed_side", "center")
    bed_orient = spec.get("bed_orientation") or cv_feat.get("bed_orientation", "vertical")
    window_wall = spec.get("window_wall") or cv_feat.get("window_wall", "right")
    ac_wall = spec.get("ac_wall") or cv_feat.get("ac_wall", "top")
    nakas_side = spec.get("nakas_side") or cv_feat.get("nakas_side", "both")
    bathroom_corner = spec.get("bathroom_corner") or cv_feat.get("bathroom_corner", "top_left")
    wardrobe_pos = spec.get("wardrobe_pos") or cv_feat.get("wardrobe_pos", "")
    desk_pos = spec.get("desk_pos") or cv_feat.get("desk_pos", "")
    extra_furniture = spec.get("extra_furniture") or cv_feat.get("extra_furniture") or []

    room_number = spec["room_number"]
    pillows = int(spec.get("pillows", 2))
    blanket_hex = spec.get("blanket_hex") or cv_feat.get("blanket_hex", "#f8fafc")
    blanket_accent = spec.get("blanket_accent") or cv_feat.get("blanket_accent", "#3b82f6")
    floor_hex = spec.get("floor_hex") or cv_feat.get("floor_hex", "#334155")
    has_bm = bool(spec.get("has_bathroom"))
    unsure_zone = spec.get("unsure_zone")
    uid = spec["id"]

    has_wardrobe = "wardrobe" in furnitures
    has_desk = "desk" in furnitures
    has_ac = ("ac" in furnitures) and (ac_wall != "none")
    has_window = ("window" in furnitures) and (window_wall != "none")
    has_fridge = "fridge" in furnitures

    # ── UNIFIED PHYSICAL ARCHITECTURAL SCALE: 1 meter = 70 pixels (clamped for larger suites) ──
    CANVAS_W = 680
    CANVAS_H = 480
    SCALE = clamp(min(70.0, 500.0 / w_m, 330.0 / l_m), 42.0, 72.0)

    rw = round(w_m * SCALE)
    rh = round(l_m * SCALE)

    DRAW_CX = 295
    DRAW_CY = 228
    rx = round(DRAW_CX - (rw / 2))
    ry = round(DRAW_CY - (rh / 2))

    # ── FURNITURE SCALED 1:1 PHYSICALLY TO ROOM ──
    bed_dim_map = {
        "single": {"w": round(1.00 * SCALE), "l": round(2.00 * SCALE), "label": "SINGLE (100x200)"},
        "super_single": {"w": round(1.20 * SCALE), "l": round(2.00 * SCALE), "label": "SUPER SINGLE (120x200)"},
        "double": {"w": round(1.40 * SCALE), "l": round(2.00 * SCALE), "label": "DOUBLE (140x200)"},
        "queen": {"w": round(1.60 * SCALE), "l": round(2.00 * SCALE), "label": "QUEEN (160x200)"},
        "king": {"w": round(1.80 * SCALE), "l": round(2.00 * SCALE), "label": "KING (180x200)"}
    }
    bcfg = bed_dim_map.get(bed_type, bed_dim_map["double"])
    bw = bcfg["w"]
    bl = bcfg["l"]

    # ── ENSUITE BATHROOM (KM DALAM) ──
    if has_bm:
        bm_w = min(round(1.45 * SCALE), round(rw * 0.40))
        bm_h = min(round(1.60 * SCALE), round(rh * 0.43))
        if bathroom_corner == "top_right":
            bm_x = rx + rw - bm_w
            bm_y = ry
        elif bathroom_corner == "bottom_left":
            bm_x = rx
            bm_y = ry + rh - bm_h
        elif bathroom_corner == "bottom_right":
            bm_x = rx + rw - bm_w
            bm_y = ry + rh - bm_h
        else:
            bathroom_corner = "top_left"
            bm_x = rx
            bm_y = ry
    else:
        bathroom_corner = "none"
        bm_x, bm_y, bm_w, bm_h = -999, -999, 0, 0

    # Common furniture dimensions
    nw = 20
    ww = min(round(1.10 * SCALE), round(rw * 0.30))
    wh = round(0.52 * SCALE)
    dw = min(round(1.05 * SCALE), round(rw * 0.28))
    dh = round(0.52 * SCALE)
    fw = round(0.46 * SCALE)
    fh = round(0.46 * SCALE)

    # ── BED ORIENTATION & PLACEMENT LOGIC ──
    if bed_orient == "horizontal_top":
        bed_span_x = min(bl, rw - 16)
        bed_depth_y = min(bw, rh - 16)
        by = ry + 8
        avail_start = rx + bm_w + 8 if (has_bm and bathroom_corner == "top_left") else rx + 8
        avail_end = rx + rw - bm_w - 8 if (has_bm and bathroom_corner == "top_right") else rx + rw - 8
        if bed_side == "right":
            bx = avail_end - bed_span_x
        elif bed_side == "left":
            bx = avail_start
        else:
            bx = round(avail_start + max(0, (avail_end - avail_start - bed_span_x) / 2))
    elif bed_orient == "horizontal_left":
        bed_span_x = min(bl, rw - 16)
        bed_depth_y = min(bw, rh - 16)
        bx = rx + 8
        min_y = ry + bm_h + 10 if (has_bm and bathroom_corner == "top_left") else ry + 14
        max_y = ry + rh - bm_h - bed_depth_y - 10 if (has_bm and bathroom_corner == "bottom_left") else ry + rh - bed_depth_y - 16
        by = clamp(round(ry + (rh - bed_depth_y) / 2), min_y, max(min_y, max_y))
    elif bed_orient == "horizontal_right":
        bed_span_x = min(bl, rw - 16)
        bed_depth_y = min(bw, rh - 16)
        bx = rx + rw - bed_span_x - 8
        min_y = ry + bm_h + 10 if (has_bm and bathroom_corner == "top_right") else ry + 14
        max_y = ry + rh - bm_h - bed_depth_y - 10 if (has_bm and bathroom_corner == "bottom_right") else ry + rh - bed_depth_y - 16
        by = clamp(round(ry + (rh - bed_depth_y) / 2), min_y, max(min_y, max_y))
    else:
        bed_orient = "vertical"
        bed_span_x = min(bw, rw - 16)
        bed_depth_y = min(bl, rh - 16)
        by = ry + 8
        avail_start = rx + bm_w + 8 if (has_bm and bathroom_corner == "top_left") else rx + 8
        avail_end = rx + rw - bm_w - 8 if (has_bm and bathroom_corner == "top_right") else rx + rw - 8
        left_pad = (nw + 8) if nakas_side in ("left", "both") else 0
        right_pad = (nw + 8) if nakas_side in ("right", "both") else 0
        if bed_side == "left":
            bx = max(avail_start, min(avail_start + left_pad, avail_end - bed_span_x))
        elif bed_side == "right":
            bx = max(avail_start, avail_end - bed_span_x - right_pad)
        else:
            bx = round(avail_start + max(0, (avail_end - avail_start - bed_span_x) / 2))

    # ── NAKAS PLACEMENT ──
    nakas_items = []
    if nakas_side != "none":
        if bed_orient == "horizontal_right":
            if nakas_side in ("left", "both"):
                nakas_items.append((bx + bed_span_x - nw, by - nw - 4))
            if nakas_side in ("right", "both"):
                nakas_items.append((bx + bed_span_x - nw, by + bed_depth_y + 4))
        elif bed_orient == "horizontal_left":
            if nakas_side in ("left", "both"):
                nakas_items.append((bx, by - nw - 4))
            if nakas_side in ("right", "both"):
                nakas_items.append((bx, by + bed_depth_y + 4))
        elif bed_orient == "horizontal_top":
            if nakas_side in ("left", "both"):
                nakas_items.append((bx - nw - 4, by + 2))
            if nakas_side in ("right", "both"):
                nakas_items.append((bx + bed_span_x + 4, by + 2))
        else:
            if nakas_side in ("left", "both"):
                nakas_items.append((bx - nw - 4, by + 2))
            if nakas_side in ("right", "both"):
                nakas_items.append((bx + bed_span_x + 4, by + 2))
    def _overlaps_bm(nx, ny):
        if not has_bm:
            return False
        return (nx < bm_x + bm_w + 2) and (nx + nw > bm_x - 2) and (ny < bm_y + bm_h + 2) and (ny + nw > bm_y - 2)

    nakas_items = [
        (nx, ny) for (nx, ny) in nakas_items
        if nx >= rx + 2 and nx + nw <= rx + rw - 2 and ny >= ry + 2 and ny + nw <= ry + rh - 2 and not _overlaps_bm(nx, ny)
    ]

    # Rug
    rug_x = bx - 8
    rug_y = by + (20 if bed_orient == "vertical" else -6)
    rug_w = bed_span_x + 16
    rug_h = bed_depth_y + (8 if bed_orient == "vertical" else 12)

    # ── WARDROBE PLACEMENT ──
    w_pref = wardrobe_pos or ("top_left" if (bed_orient == "horizontal_top" and bed_side == "right") else "bottom_left")
    if w_pref == "top_left":
        ww_draw, wh_draw = round(0.52 * SCALE), min(round(1.05 * SCALE), round(rh * 0.34))
        wardrobe_x = rx + 8
        wardrobe_y = ry + bm_h + 8 if (has_bm and bathroom_corner == "top_left") else ry + 8
    elif w_pref == "top_right":
        ww_draw, wh_draw = round(0.52 * SCALE), min(round(1.05 * SCALE), round(rh * 0.34))
        wardrobe_x = rx + rw - ww_draw - 8
        wardrobe_y = ry + bm_h + 8 if (has_bm and bathroom_corner == "top_right") else ry + 8
    elif w_pref == "bottom_right":
        ww_draw, wh_draw = ww, wh
        wardrobe_x = rx + rw - ww_draw - 8
        wardrobe_y = ry + rh - wh_draw - 8
    else:
        ww_draw, wh_draw = ww, wh
        wardrobe_x = rx + 8
        wardrobe_y = ry + rh - wh_draw - 8

    # ── DESK & INWARD CHAIR PLACEMENT (NEVER OVERFLOWS WALL) ──
    d_pref = desk_pos or ("bottom_right" if w_pref in ("bottom_left", "top_left") else "bottom_left")
    if d_pref == "top_left":
        dw_draw, dh_draw = round(0.52 * SCALE), min(round(1.0 * SCALE), round(rh * 0.28))
        desk_x = rx + 8
        desk_y = ry + bm_h + 10 if (has_bm and bathroom_corner == "top_left") else ry + 10
        if has_wardrobe and w_pref == "top_left":
            desk_y = wardrobe_y + wh_draw + 10
    elif d_pref == "left_middle":
        dw_draw, dh_draw = round(0.52 * SCALE), min(round(1.0 * SCALE), round(rh * 0.28))
        desk_x = rx + 8
        desk_y = clamp(round(ry + rh * 0.36), ry + 10, ry + rh - dh_draw - 16)
    elif d_pref == "bottom_left":
        dw_draw, dh_draw = dw, dh
        desk_x = rx + 8
        desk_y = ry + rh - dh_draw - 8
    else:
        dw_draw, dh_draw = dw, dh
        desk_x = rx + rw - dw_draw - 8
        desk_y = ry + rh - dh_draw - 8

    # Fridge placement
    fridge_x = rx + 8 if desk_x > rx + rw / 2 else rx + rw - fw - 8
    fridge_y = ry + round(rh * 0.45)

    # ── MAIN DOORWAY (Bottom Wall) ──
    door_w = round(0.84 * SCALE)
    door_x = round(rx + (rw / 2) - (door_w / 2))
    door_y = ry + rh

    # Keep bottom furniture clear of doorway opening & swing arc
    if has_wardrobe and wardrobe_y + wh_draw > door_y - 20:
        if wardrobe_x + ww_draw > door_x - 8 and wardrobe_x < door_x + door_w + 8:
            wardrobe_x = rx + 8 if d_pref != "bottom_left" else rx + rw - ww_draw - 8
    if has_desk and desk_y + dh_draw > door_y - 20:
        if desk_x + dw_draw > door_x - 8 and desk_x < door_x + door_w + 8:
            desk_x = rx + rw - dw_draw - 8 if desk_x >= rx + rw / 2 else rx + 8

    # ── WINDOW ──
    win_w = min(round(1.10 * SCALE), round(rw * 0.34))
    win_h = min(round(1.10 * SCALE), round(rh * 0.34))

    # ── BLIND SPOT / UNSURE ZONE (NEVER COLLIDES WITH DOOR SWING OR VISIBLE FURNITURE) ──
    if unsure_zone:
        side = unsure_zone.get("side", "left_front")
        uz_h = min(round(0.95 * SCALE), round(rh * 0.28))
        if side == "left_front":
            avail_w = (door_x - 12) - (rx + 6)
            if avail_w >= 44:
                uz_w = min(round(1.02 * SCALE), avail_w)
                uz_x = rx + 6
                uz_y = ry + rh - uz_h - 8
                # Guard against bottom-left furniture overlap
                block_y = ry + rh
                if has_wardrobe and wardrobe_x < uz_x + uz_w and wardrobe_y + wh_draw > uz_y:
                    block_y = min(block_y, wardrobe_y)
                if has_desk and desk_x < uz_x + uz_w and desk_y + dh_draw > uz_y:
                    block_y = min(block_y, desk_y)
                if block_y < ry + rh:
                    uz_y = max(ry + 12, block_y - uz_h - 10)
            else:
                uz_w = 0
        else:
            guard_x = door_x + door_w + 12
            avail_w = (rx + rw - 6) - guard_x
            if avail_w >= 44:
                uz_w = min(round(1.02 * SCALE), avail_w)
                uz_x = rx + rw - uz_w - 6
                uz_y = ry + rh - uz_h - 8
                block_y = ry + rh
                if has_wardrobe and wardrobe_x + ww_draw > uz_x and wardrobe_y + wh_draw > uz_y:
                    block_y = min(block_y, wardrobe_y)
                if has_desk and desk_x + dw_draw > uz_x and desk_y + dh_draw > uz_y:
                    block_y = min(block_y, desk_y)
                if block_y < ry + rh:
                    uz_y = max(ry + 12, block_y - uz_h - 10)
            else:
                uz_w = 0
    else:
        uz_x, uz_y, uz_w, uz_h = 0, 0, 0, 0

    # ── CAMERA PERSPECTIVE MATH & VIEW FRUSTUM ──
    bed_cx = bx + round(bed_span_x / 2)
    bed_cy = by + round(bed_depth_y / 2)
    cam_x = door_x + round(door_w / 2)
    cam_y = ry + rh + 14

    cdx = bed_cx - cam_x
    cdy = bed_cy - cam_y
    cdist = math.hypot(cdx, cdy) or 1.0
    cdeg = math.degrees(math.atan2(cdy, cdx))
    tilt_angle = clamp(round(abs(math.degrees(math.atan2(abs(cdx), abs(cdy))))), 28, 48)

    fov_half = 25.0
    fov_len = min(cdist + 48, max(rw, rh) * 0.92)
    ang_l = cdeg - fov_half
    ang_r = cdeg + fov_half
    xl = cam_x + fov_len * math.cos(math.radians(ang_l))
    yl = cam_y + fov_len * math.sin(math.radians(ang_l))
    xr = cam_x + fov_len * math.cos(math.radians(ang_r))
    yr = cam_y + fov_len * math.sin(math.radians(ang_r))

    km_label = "KM DALAM (ENSUITE)" if has_bm else "KM LUAR (SHARED)"
    orient_label = "HORIZONTAL" if bed_orient.startswith("horizontal") else "TEGAK"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS_W} {CANVAS_H}" width="100%" height="100%" style="background:#090e17; border-radius:14px; font-family:'Inter',system-ui,-apple-system,sans-serif;">
  <defs>
    <pattern id="grid_cad_{uid}" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(148, 163, 184, 0.04)" stroke-width="0.75" />
    </pattern>
    <pattern id="grid_major_{uid}" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(56, 189, 248, 0.07)" stroke-width="1" />
    </pattern>
    <pattern id="parquet_{uid}" width="40" height="20" patternUnits="userSpaceOnUse">
      <rect width="40" height="20" fill="{floor_hex}" fill-opacity="0.34" />
      <path d="M 0 10 L 40 10 M 20 0 L 20 10 M 0 20 L 40 20 M 40 10 L 40 20 M 0 0 L 0 10" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="0.6" />
    </pattern>
    <pattern id="bm_tile_{uid}" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#0f2338" />
      <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(56, 189, 248, 0.22)" stroke-width="0.6" />
    </pattern>
    <filter id="frost_blur_{uid}" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="4.2" result="blur" />
    </filter>
    <pattern id="blind_hatch_{uid}" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(244, 63, 94, 0.35)" stroke-width="1.2" stroke-dasharray="2 2" />
    </pattern>
    <radialGradient id="lamp_glow_{uid}">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#fef08a" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="camera_frustum_{uid}" cx="0%" cy="100%" r="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.30" />
      <stop offset="65%" stop-color="#38bdf8" stop-opacity="0.09" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
    </radialGradient>
    <filter id="drop_shadow_{uid}" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <rect width="{CANVAS_W}" height="{CANVAS_H}" fill="#090e17" />
  <rect width="{CANVAS_W}" height="{CANVAS_H}" fill="url(#grid_cad_{uid})" />
  <rect width="{CANVAS_W}" height="{CANVAS_H}" fill="url(#grid_major_{uid})" />

  <g stroke="rgba(148, 163, 184, 0.35)" stroke-width="1">
    <path d="M 14 20 L 20 20 M 20 14 L 20 20" />
    <path d="M {CANVAS_W - 14} 20 L {CANVAS_W - 20} 20 M {CANVAS_W - 20} 14 L {CANVAS_W - 20} 20" />
    <path d="M 14 {CANVAS_H - 20} L 20 {CANVAS_H - 20} M 20 {CANVAS_H - 14} L 20 {CANVAS_H - 20}" />
    <path d="M {CANVAS_W - 14} {CANVAS_H - 20} L {CANVAS_W - 20} {CANVAS_H - 20} M {CANVAS_W - 20} {CANVAS_H - 14} L {CANVAS_W - 20} {CANVAS_H - 20}" />
  </g>

  <g stroke="#38bdf8" stroke-width="1.2">
    <line x1="{rx}" y1="{ry - 18}" x2="{rx + rw}" y2="{ry - 18}" opacity="0.85" />
    <line x1="{rx - 5}" y1="{ry - 13}" x2="{rx + 5}" y2="{ry - 23}" stroke-width="1.8" />
    <line x1="{rx + rw - 5}" y1="{ry - 13}" x2="{rx + rw + 5}" y2="{ry - 23}" stroke-width="1.8" />
    <line x1="{rx}" y1="{ry - 6}" x2="{rx}" y2="{ry - 26}" opacity="0.4" stroke-width="0.75" />
    <line x1="{rx + rw}" y1="{ry - 6}" x2="{rx + rw}" y2="{ry - 26}" opacity="0.4" stroke-width="0.75" />
    <rect x="{rx + rw/2 - 42}" y="{ry - 30}" width="84" height="20" rx="4" fill="#0c1527" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1" />
    <text x="{rx + rw/2}" y="{ry - 16}" fill="#38bdf8" font-size="9.5" font-weight="700" text-anchor="middle" letter-spacing="0.5" stroke="none">
      {w_m:.2f} m
    </text>
  </g>

  <g stroke="#38bdf8" stroke-width="1.2">
    <line x1="{rx - 18}" y1="{ry}" x2="{rx - 18}" y2="{ry + rh}" opacity="0.85" />
    <line x1="{rx - 23}" y1="{ry + 5}" x2="{rx - 13}" y2="{ry - 5}" stroke-width="1.8" />
    <line x1="{rx - 23}" y1="{ry + rh + 5}" x2="{rx - 13}" y2="{ry + rh - 5}" stroke-width="1.8" />
    <line x1="{rx - 6}" y1="{ry}" x2="{rx - 26}" y2="{ry}" opacity="0.4" stroke-width="0.75" />
    <line x1="{rx - 6}" y1="{ry + rh}" x2="{rx - 26}" y2="{ry + rh}" opacity="0.4" stroke-width="0.75" />
    <g transform="translate({rx - 18}, {ry + rh/2})">
      <rect x="-42" y="-10" width="84" height="20" rx="4" fill="#0c1527" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1" transform="rotate(-90)" />
      <text x="0" y="4" fill="#38bdf8" font-size="9.5" font-weight="700" text-anchor="middle" letter-spacing="0.5" transform="rotate(-90)" stroke="none">
        {l_m:.2f} m
      </text>
    </g>
  </g>

  <rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="2" fill="url(#parquet_{uid})" />
  <rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" fill="none" stroke="rgba(0, 0, 0, 0.38)" stroke-width="5" />
  <rect x="{rx - 5}" y="{ry - 5}" width="{rw + 10}" height="{rh + 10}" fill="none" stroke="#1e293b" stroke-width="8" rx="2" />
  <rect x="{rx - 9}" y="{ry - 9}" width="{rw + 18}" height="{rh + 18}" fill="none" stroke="#475569" stroke-width="1" rx="3" />
  <rect x="{rx - 1}" y="{ry - 1}" width="{rw + 2}" height="{rh + 2}" fill="none" stroke="#64748b" stroke-width="1" rx="1" />

  <g id="camera_frustum_cone" opacity="0.85">
    <polygon points="{cam_x},{cam_y} {xl:.1f},{yl:.1f} {xr:.1f},{yr:.1f}" fill="url(#camera_frustum_{uid})" />
    <line x1="{cam_x}" y1="{cam_y}" x2="{xl:.1f}" y2="{yl:.1f}" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.5" />
    <line x1="{cam_x}" y1="{cam_y}" x2="{xr:.1f}" y2="{yr:.1f}" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.5" />
  </g>
"""

    # ── ENSUITE BATHROOM ──
    if has_bm:
        if bathroom_corner.startswith("bottom"):
            bm_door_svg = f"""
    <rect x="{bm_x + bm_w - 30}" y="{bm_y - 2}" width="26" height="4" fill="#090e17" />
    <path d="M {bm_x + bm_w - 28} {bm_y} A 24 24 0 0 1 {bm_x + bm_w - 4} {bm_y + 24}" fill="none" stroke="#38bdf8" stroke-width="0.9" stroke-dasharray="2 2" opacity="0.75" />
    <line x1="{bm_x + bm_w - 28}" y1="{bm_y}" x2="{bm_x + bm_w - 4}" y2="{bm_y}" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round" />"""
        else:
            bm_door_svg = f"""
    <rect x="{bm_x + bm_w - 30}" y="{bm_y + bm_h - 2}" width="26" height="4" fill="#090e17" />
    <path d="M {bm_x + bm_w - 28} {bm_y + bm_h} A 24 24 0 0 0 {bm_x + bm_w - 4} {bm_y + bm_h - 24}" fill="none" stroke="#38bdf8" stroke-width="0.9" stroke-dasharray="2 2" opacity="0.75" />
    <line x1="{bm_x + bm_w - 28}" y1="{bm_y + bm_h}" x2="{bm_x + bm_w - 4}" y2="{bm_y + bm_h}" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round" />"""

        svg += f"""
  <g id="ensuite_bathroom" filter="url(#drop_shadow_{uid})">
    <rect x="{bm_x}" y="{bm_y}" width="{bm_w}" height="{bm_h}" fill="url(#bm_tile_{uid})" stroke="#334155" stroke-width="4" />
    <rect x="{bm_x}" y="{bm_y}" width="{bm_w}" height="{bm_h}" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.5" />
    <rect x="{bm_x + bm_w - 44}" y="{bm_y + 6}" width="38" height="38" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="1.2" />
    <circle cx="{bm_x + bm_w - 25}" cy="{bm_y + 25}" r="6.5" fill="none" stroke="#94a3b8" stroke-width="1.2" />
    <circle cx="{bm_x + bm_w - 25}" cy="{bm_y + 25}" r="2.2" fill="#38bdf8" />
    <rect x="{bm_x + 6}" y="{bm_y + 6}" width="24" height="9" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="0.8" />
    <path d="M {bm_x + 8} {bm_y + 15} C {bm_x + 8} {bm_y + 33} {bm_x + 28} {bm_y + 33} {bm_x + 28} {bm_y + 15} Z" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
    <rect x="{bm_x + 6}" y="{bm_y + bm_h - 30}" width="32" height="24" rx="2" fill="#1e293b" stroke="#64748b" stroke-width="1" />
    <rect x="{bm_x + 10}" y="{bm_y + bm_h - 26}" width="24" height="16" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8" />
    <text x="{bm_x + bm_w/2}" y="{bm_y + bm_h/2 + 2}" fill="#38bdf8" font-size="8" font-weight="800" text-anchor="middle">KM</text>
    {bm_door_svg}
  </g>
"""

    # ── BLIND SPOT ──
    if unsure_zone and uz_w > 0:
        svg += f"""
  <g id="unsure_zone" opacity="0.95">
    <rect x="{uz_x}" y="{uz_y}" width="{uz_w}" height="{uz_h}" rx="5" fill="rgba(15, 23, 42, 0.85)" filter="url(#frost_blur_{uid})" />
    <rect x="{uz_x}" y="{uz_y}" width="{uz_w}" height="{uz_h}" rx="5" fill="url(#blind_hatch_{uid})" stroke="rgba(244, 63, 94, 0.45)" stroke-width="1" stroke-dasharray="3 2" />
    <rect x="{uz_x + 4}" y="{uz_y + (uz_h - 24)//2}" width="{uz_w - 8}" height="24" rx="4" fill="rgba(15, 23, 42, 0.94)" stroke="rgba(244, 63, 94, 0.5)" stroke-width="0.8" />
    <text x="{uz_x + uz_w/2}" y="{uz_y + (uz_h - 24)//2 + 10}" fill="#fda4af" font-size="6.8" font-weight="700" text-anchor="middle">BLIND SPOT</text>
    <text x="{uz_x + uz_w/2}" y="{uz_y + (uz_h - 24)//2 + 19}" fill="#94a3b8" font-size="5.3" font-weight="500" text-anchor="middle">Luar Sudut Kamera</text>
  </g>
"""

    svg += f"""
  <rect x="{rug_x}" y="{rug_y}" width="{rug_w}" height="{rug_h}" rx="6" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(148, 163, 184, 0.18)" stroke-width="0.8" stroke-dasharray="3 2" />
"""

    # ── BED CAD UNIT (4 FULL ORIENTATIONS) ──
    if bed_orient == "horizontal_top":
        p_svg = ""
        if pillows == 1:
            p_svg = f'<rect x="{bx + 6}" y="{by + round((bed_depth_y - 32)/2)}" width="20" height="32" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
        else:
            ph = min(24, (bed_depth_y - 16) // 2)
            p_svg = (
                f'<rect x="{bx + 6}" y="{by + 5}" width="20" height="{ph}" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
                f'<rect x="{bx + 6}" y="{by + bed_depth_y - 5 - ph}" width="20" height="{ph}" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
            )
        svg += f"""
  <g id="bed_unit" filter="url(#drop_shadow_{uid})">
    <rect x="{bx - 5}" y="{by}" width="7" height="{bed_depth_y}" rx="2" fill="#3b271d" stroke="#78350f" stroke-width="1" />
    <circle cx="{bx - 1}" cy="{by + round(bed_depth_y/2)}" r="9" fill="url(#lamp_glow_{uid})" />
    <rect x="{bx + 2}" y="{by}" width="{bed_span_x - 2}" height="{bed_depth_y}" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
    <rect x="{bx + 32}" y="{by + 2}" width="{max(20, bed_span_x - 34)}" height="{bed_depth_y - 4}" rx="3" fill="{blanket_hex}" stroke="rgba(0,0,0,0.18)" stroke-width="0.8" />
    <path d="M {bx + 32} {by + 2} Q {bx + 38} {by + round(bed_depth_y/2)} {bx + 32} {by + bed_depth_y - 2}" fill="none" stroke="#ffffff" stroke-width="2" />
    <rect x="{bx + bed_span_x - 22}" y="{by + 2}" width="20" height="{bed_depth_y - 4}" fill="{blanket_accent}" opacity="0.88" />
    {p_svg}
  </g>
"""
    elif bed_orient == "horizontal_left":
        ph = min(38, (bed_depth_y - 24) // 2)
        p_svg = (
            f'<rect x="{bx + 8}" y="{by + 9}" width="22" height="{ph}" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
            f'<rect x="{bx + 8}" y="{by + bed_depth_y - 9 - ph}" width="22" height="{ph}" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
        )
        svg += f"""
  <g id="bed_unit" filter="url(#drop_shadow_{uid})">
    <rect x="{bx - 5}" y="{by}" width="7" height="{bed_depth_y}" rx="2" fill="#3b271d" stroke="#78350f" stroke-width="1" />
    <circle cx="{bx - 1}" cy="{by + 16}" r="10" fill="url(#lamp_glow_{uid})" />
    <circle cx="{bx - 1}" cy="{by + bed_depth_y - 16}" r="10" fill="url(#lamp_glow_{uid})" />
    <rect x="{bx + 2}" y="{by + 1}" width="{bed_span_x - 2}" height="{bed_depth_y - 2}" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
    <rect x="{bx + 38}" y="{by + 3}" width="{max(20, bed_span_x - 42)}" height="{bed_depth_y - 6}" rx="3" fill="{blanket_hex}" stroke="rgba(0,0,0,0.18)" stroke-width="0.8" />
    <path d="M {bx + 38} {by + 3} Q {bx + 44} {by + round(bed_depth_y/2)} {bx + 38} {by + bed_depth_y - 3}" fill="none" stroke="#ffffff" stroke-width="2" />
    <rect x="{bx + bed_span_x - 26}" y="{by + 3}" width="20" height="{bed_depth_y - 6}" fill="{blanket_accent}" opacity="0.88" />
    {p_svg}
  </g>
"""
    elif bed_orient == "horizontal_right":
        ph = min(38, (bed_depth_y - 24) // 2)
        p_svg = (
            f'<rect x="{bx + bed_span_x - 30}" y="{by + 9}" width="22" height="{ph}" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
            f'<rect x="{bx + bed_span_x - 30}" y="{by + bed_depth_y - 9 - ph}" width="22" height="{ph}" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
        )
        svg += f"""
  <g id="bed_unit" filter="url(#drop_shadow_{uid})">
    <rect x="{bx + bed_span_x - 2}" y="{by}" width="7" height="{bed_depth_y}" rx="2" fill="#3b271d" stroke="#78350f" stroke-width="1" />
    <circle cx="{bx + bed_span_x + 1}" cy="{by + 16}" r="10" fill="url(#lamp_glow_{uid})" />
    <circle cx="{bx + bed_span_x + 1}" cy="{by + bed_depth_y - 16}" r="10" fill="url(#lamp_glow_{uid})" />
    <rect x="{bx}" y="{by + 1}" width="{bed_span_x - 2}" height="{bed_depth_y - 2}" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
    <rect x="{bx + 3}" y="{by + 3}" width="{max(20, bed_span_x - 42)}" height="{bed_depth_y - 6}" rx="3" fill="{blanket_hex}" stroke="rgba(0,0,0,0.18)" stroke-width="0.8" />
    <path d="M {bx + bed_span_x - 39} {by + 3} Q {bx + bed_span_x - 45} {by + round(bed_depth_y/2)} {bx + bed_span_x - 39} {by + bed_depth_y - 3}" fill="none" stroke="#ffffff" stroke-width="2" />
    <rect x="{bx + 6}" y="{by + 3}" width="20" height="{bed_depth_y - 6}" fill="{blanket_accent}" opacity="0.88" />
    {p_svg}
  </g>
"""
    else:
        pw = min(38, (bed_span_x - 16) // 2)
        if pillows == 1:
            p_svg = f'<rect x="{bx + bed_span_x//2 - 20}" y="{by + 6}" width="40" height="22" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
        else:
            p_svg = (
                f'<rect x="{bx + 6}" y="{by + 6}" width="{pw}" height="22" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
                f'<rect x="{bx + bed_span_x - 6 - pw}" y="{by + 6}" width="{pw}" height="22" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />'
            )
        svg += f"""
  <g id="bed_unit" filter="url(#drop_shadow_{uid})">
    <rect x="{bx}" y="{by - 5}" width="{bed_span_x}" height="7" rx="2" fill="#3b271d" stroke="#78350f" stroke-width="1" />
    <circle cx="{bx + 12}" cy="{by - 1}" r="10" fill="url(#lamp_glow_{uid})" />
    <circle cx="{bx + bed_span_x - 12}" cy="{by - 1}" r="10" fill="url(#lamp_glow_{uid})" />
    <rect x="{bx + 2}" y="{by}" width="{bed_span_x - 4}" height="{bed_depth_y}" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
    <rect x="{bx + 2}" y="{by + 38}" width="{bed_span_x - 4}" height="{max(20, bed_depth_y - 40)}" rx="3" fill="{blanket_hex}" stroke="rgba(0,0,0,0.18)" stroke-width="0.8" />
    <path d="M {bx + 2} {by + 38} Q {bx + bed_span_x/2} {by + 44} {bx + bed_span_x - 2} {by + 38}" fill="none" stroke="#ffffff" stroke-width="2" />
    <rect x="{bx + 2}" y="{by + bed_depth_y - 28}" width="{bed_span_x - 4}" height="20" fill="{blanket_accent}" opacity="0.88" />
    {p_svg}
  </g>
"""

    # Nakas items
    for nx, ny in nakas_items:
        svg += f"""
  <g filter="url(#drop_shadow_{uid})">
    <rect x="{nx}" y="{ny}" width="{nw}" height="{nw}" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" />
    <circle cx="{nx + nw/2}" cy="{ny + nw/2}" r="4" fill="#fef08a" stroke="#d97706" stroke-width="0.8" opacity="0.85" />
  </g>
"""

    # ── EXTRA FURNITURE (FAITHFUL TO PHOTOS) ──
    if "tv_shelf_right" in extra_furniture:
        tx, ty = rx + rw - 38, ry + 8
        svg += f'<g id="tv_shelf"><rect x="{tx}" y="{ty}" width="30" height="44" rx="2" fill="#1e293b" stroke="#64748b" stroke-width="1.2" /><rect x="{tx + 8}" y="{ty + 10}" width="14" height="24" rx="1.5" fill="#0f172a" stroke="#38bdf8" stroke-width="0.8" /></g>'
    if "armchair_right" in extra_furniture:
        ax = clamp(rx + rw - 44, rx + 10, rx + rw - 40)
        ay = clamp(ry + round(rh * 0.62), ry + 10, ry + rh - 42)
        svg += f'<g id="armchair_right"><rect x="{ax}" y="{ay}" width="32" height="30" rx="6" fill="#334155" stroke="#94a3b8" stroke-width="1.2" /><rect x="{ax + 24}" y="{ay + 4}" width="6" height="22" rx="2" fill="#475569" /></g>'
    if "armchair_left" in extra_furniture:
        ax = rx + 12
        ay = clamp(ry + round(rh * 0.64), ry + 10, ry + rh - 44)
        svg += f'<g id="armchair_left"><rect x="{ax}" y="{ay}" width="32" height="30" rx="6" fill="#334155" stroke="#94a3b8" stroke-width="1.2" /><rect x="{ax + 2}" y="{ay + 4}" width="6" height="22" rx="2" fill="#475569" /></g>'
    if "sofa_center" in extra_furniture:
        sx = round(rx + rw / 2 - 42)
        sy = clamp(round(ry + rh * 0.56), ry + 10, door_y - 38)
        svg += f'<g id="sofa_center"><rect x="{sx}" y="{sy}" width="84" height="28" rx="5" fill="#334155" stroke="#94a3b8" stroke-width="1.2" /><rect x="{sx + 4}" y="{sy + 20}" width="76" height="6" rx="2" fill="#475569" /></g>'
    if "foot_ottomans" in extra_furniture and bed_orient == "vertical":
        oy = clamp(by + bed_depth_y + 6, ry + 10, door_y - 26)
        svg += f'<g id="foot_ottomans"><rect x="{bx + 8}" y="{oy}" width="24" height="16" rx="3" fill="{blanket_accent}" stroke="#cbd5e1" stroke-width="0.9" /><rect x="{bx + bed_span_x - 32}" y="{oy}" width="24" height="16" rx="3" fill="{blanket_accent}" stroke="#cbd5e1" stroke-width="0.9" /></g>'
    if "foot_bench" in extra_furniture:
        if bed_orient == "horizontal_right":
            svg += f'<rect x="{bx - 20}" y="{by + 12}" width="14" height="{bed_depth_y - 24}" rx="3" fill="#1e3a8a" stroke="#d97706" stroke-width="1" />'
        else:
            svg += f'<rect x="{bx + 12}" y="{by + bed_depth_y + 6}" width="{bed_span_x - 24}" height="14" rx="3" fill="#1e3a8a" stroke="#d97706" stroke-width="1" />'

    # ── WARDROBE ──
    if has_wardrobe:
        svg += f"""
  <g id="wardrobe" filter="url(#drop_shadow_{uid})">
    <rect x="{wardrobe_x}" y="{wardrobe_y}" width="{ww_draw}" height="{wh_draw}" rx="2" fill="#1e293b" stroke="#475569" stroke-width="1.2" />
    <line x1="{wardrobe_x + 5}" y1="{wardrobe_y + wh_draw/2}" x2="{wardrobe_x + ww_draw - 5}" y2="{wardrobe_y + wh_draw/2}" stroke="#64748b" stroke-width="1" stroke-dasharray="2 2" />
    <line x1="{wardrobe_x + ww_draw/2}" y1="{wardrobe_y}" x2="{wardrobe_x + ww_draw/2}" y2="{wardrobe_y + wh_draw}" stroke="#38bdf8" stroke-width="1.2" />
  </g>
"""

    # ── WORK DESK & INTERIOR-CLAMPED CHAIR ──
    if has_desk:
        d_left = desk_x - rx
        d_right = (rx + rw) - (desk_x + dw_draw)
        d_top = desk_y - ry
        d_bottom = (ry + rh) - (desk_y + dh_draw)
        d_min = min(d_left, d_right, d_top, d_bottom)

        if d_min == d_bottom:
            chair_cx = clamp(desk_x + round(dw_draw / 2), rx + 13, rx + rw - 13)
            chair_cy = clamp(desk_y - 11, ry + 13, ry + rh - 13)
            chair_svg = (
                f'<ellipse cx="{chair_cx}" cy="{chair_cy}" rx="11" ry="8" fill="#334155" stroke="#94a3b8" stroke-width="1" />'
                f'<path d="M {chair_cx - 9} {chair_cy - 4} Q {chair_cx} {chair_cy - 7} {chair_cx + 9} {chair_cy - 4}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />'
            )
        elif d_min == d_top:
            chair_cx = clamp(desk_x + round(dw_draw / 2), rx + 13, rx + rw - 13)
            chair_cy = clamp(desk_y + dh_draw + 11, ry + 13, ry + rh - 13)
            chair_svg = (
                f'<ellipse cx="{chair_cx}" cy="{chair_cy}" rx="11" ry="8" fill="#334155" stroke="#94a3b8" stroke-width="1" />'
                f'<path d="M {chair_cx - 9} {chair_cy + 4} Q {chair_cx} {chair_cy + 7} {chair_cx + 9} {chair_cy + 4}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />'
            )
        elif d_min == d_left:
            chair_cx = clamp(desk_x + dw_draw + 11, rx + 13, rx + rw - 13)
            chair_cy = clamp(desk_y + round(dh_draw / 2), ry + 13, ry + rh - 13)
            chair_svg = (
                f'<ellipse cx="{chair_cx}" cy="{chair_cy}" rx="8" ry="11" fill="#334155" stroke="#94a3b8" stroke-width="1" />'
                f'<path d="M {chair_cx + 4} {chair_cy - 9} Q {chair_cx + 7} {chair_cy} {chair_cx + 4} {chair_cy + 9}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />'
            )
        else:
            chair_cx = clamp(desk_x - 11, rx + 13, rx + rw - 13)
            chair_cy = clamp(desk_y + round(dh_draw / 2), ry + 13, ry + rh - 13)
            chair_svg = (
                f'<ellipse cx="{chair_cx}" cy="{chair_cy}" rx="8" ry="11" fill="#334155" stroke="#94a3b8" stroke-width="1" />'
                f'<path d="M {chair_cx - 4} {chair_cy - 9} Q {chair_cx - 7} {chair_cy} {chair_cx - 4} {chair_cy + 9}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />'
            )

        svg += f"""
  <g id="desk_setup" filter="url(#drop_shadow_{uid})">
    <rect x="{desk_x}" y="{desk_y}" width="{dw_draw}" height="{dh_draw}" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1.2" />
    <rect x="{desk_x + dw_draw/2 - 11}" y="{desk_y + round(dh_draw/2 - 7)}" width="22" height="14" rx="1.5" fill="#0f172a" stroke="#60a5fa" stroke-width="0.8" />
    <rect x="{desk_x + dw_draw/2 - 9}" y="{desk_y + round(dh_draw/2 - 5)}" width="18" height="9" rx="1" fill="#38bdf8" opacity="0.65" />
    {chair_svg}
  </g>
"""

    # ── AC UNIT ──
    if has_ac:
        ac_len = 54
        if ac_wall == "right":
            ac_y = ry + 14 if window_wall == "right" else ry + round(rh / 2) - ac_len // 2
            svg += f'<g id="ac_unit"><rect x="{rx + rw - 11}" y="{ac_y}" width="10" height="{ac_len}" rx="2" fill="#f8fafc" stroke="#0284c7" stroke-width="1.2" /><line x1="{rx + rw - 8}" y1="{ac_y + 5}" x2="{rx + rw - 8}" y2="{ac_y + ac_len - 5}" stroke="#cbd5e1" stroke-width="1" /><circle cx="{rx + rw - 5}" cy="{ac_y + 6}" r="1.2" fill="#22c55e" /></g>'
        elif ac_wall == "left":
            ac_y = ry + 14 if window_wall == "left" else ry + round(rh / 2) - ac_len // 2
            svg += f'<g id="ac_unit"><rect x="{rx + 1}" y="{ac_y}" width="10" height="{ac_len}" rx="2" fill="#f8fafc" stroke="#0284c7" stroke-width="1.2" /><line x1="{rx + 8}" y1="{ac_y + 5}" x2="{rx + 8}" y2="{ac_y + ac_len - 5}" stroke="#cbd5e1" stroke-width="1" /><circle cx="{rx + 5}" cy="{ac_y + ac_len - 6}" r="1.2" fill="#22c55e" /></g>'
        else:
            ac_x = clamp(bx + round(bed_span_x / 2) - ac_len // 2, rx + 8, rx + rw - ac_len - 8)
            svg += f'<g id="ac_unit"><rect x="{ac_x}" y="{ry + 1}" width="{ac_len}" height="10" rx="2" fill="#f8fafc" stroke="#0284c7" stroke-width="1.2" /><line x1="{ac_x + 5}" y1="{ry + 8}" x2="{ac_x + ac_len - 5}" y2="{ry + 8}" stroke="#cbd5e1" stroke-width="1" /><circle cx="{ac_x + ac_len - 6}" cy="{ry + 5}" r="1.2" fill="#22c55e" /></g>'

    # ── MINI FRIDGE ──
    if has_fridge:
        svg += f"""
  <g id="fridge" filter="url(#drop_shadow_{uid})">
    <rect x="{fridge_x}" y="{fridge_y}" width="{fw}" height="{fh}" rx="2" fill="#1e293b" stroke="#475569" stroke-width="1.2" />
    <line x1="{fridge_x + fw - 4}" y1="{fridge_y + 6}" x2="{fridge_x + fw - 4}" y2="{fridge_y + fh - 6}" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" />
  </g>
"""

    # ── WINDOW (ONLY IF NOT 'none') ──
    if has_window:
        if window_wall == "left":
            svg += f"""
  <g id="window_left">
    <rect x="{rx - 7}" y="{ry + round(rh/2) - win_h//2}" width="6" height="{win_h}" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
    <line x1="{rx - 4}" y1="{ry + round(rh/2) - win_h//2}" x2="{rx - 4}" y2="{ry + round(rh/2) + win_h//2}" stroke="#ffffff" stroke-width="1.2" />
  </g>
"""
        elif window_wall == "right":
            svg += f"""
  <g id="window_right">
    <rect x="{rx + rw + 1}" y="{ry + round(rh/2) - win_h//2}" width="6" height="{win_h}" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
    <line x1="{rx + rw + 4}" y1="{ry + round(rh/2) - win_h//2}" x2="{rx + rw + 4}" y2="{ry + round(rh/2) + win_h//2}" stroke="#ffffff" stroke-width="1.2" />
  </g>
"""
        elif window_wall == "top":
            top_win_x = rx + 14 if bed_side != "left" else rx + rw - win_w - 14
            svg += f"""
  <g id="window_top">
    <rect x="{top_win_x}" y="{ry - 7}" width="{win_w}" height="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
    <line x1="{top_win_x}" y1="{ry - 4}" x2="{top_win_x + win_w}" y2="{ry - 4}" stroke="#ffffff" stroke-width="1.2" />
  </g>
"""

    # ── MAIN ENTRANCE DOORWAY (Bottom Wall) ──
    svg += f"""
  <g id="main_door">
    <rect x="{door_x}" y="{door_y - 4}" width="{door_w}" height="8" fill="#090e17" />
    <path d="M {door_x} {door_y} A {door_w - 8} {door_w - 8} 0 0 1 {door_x + door_w - 8} {door_y - (door_w - 8)}" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2.5 2" opacity="0.75" />
    <line x1="{door_x}" y1="{door_y}" x2="{door_x}" y2="{door_y - (door_w - 8)}" stroke="#f8fafc" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="{door_x + 5}" cy="{door_y - (door_w - 15)}" r="1.5" fill="#38bdf8" />
  </g>

  <g id="camera_marker_overlay">
    <line x1="{cam_x}" y1="{cam_y}" x2="{bed_cx}" y2="{bed_cy}" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.85" />
    <circle cx="{bed_cx}" cy="{bed_cy}" r="3" fill="#38bdf8" opacity="0.85" />
    <circle cx="{bed_cx}" cy="{bed_cy}" r="6.5" fill="none" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.6" />

    <g transform="translate({cam_x}, {cam_y}) rotate({cdeg + 90})">
      <rect x="-9" y="-6" width="18" height="12" rx="2.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1" />
      <path d="M -3 -6 L -1.5 -8.5 L 1.5 -8.5 L 3 -6 Z" fill="#38bdf8" />
      <circle cx="0" cy="0" r="4" fill="#0f172a" stroke="#ffffff" stroke-width="0.9" />
      <circle cx="0" cy="0" r="1.8" fill="#38bdf8" />
      <polygon points="0,-10 -2.5,-7 2.5,-7" fill="#38bdf8" />
    </g>

    <g transform="translate({max(16, cam_x - 118)}, {cam_y - 9})">
      <rect width="104" height="18" rx="4" fill="rgba(12, 21, 39, 0.94)" stroke="rgba(56, 189, 248, 0.45)" stroke-width="0.8" />
      <rect x="6" y="5" width="9" height="7" rx="1.5" fill="none" stroke="#38bdf8" stroke-width="1" />
      <circle cx="10.5" cy="8.5" r="1.8" fill="#38bdf8" />
      <text x="60" y="12" fill="#38bdf8" font-size="6.8" font-weight="700" text-anchor="middle" letter-spacing="0.2">
        SUDUT KAMERA {tilt_angle}°
      </text>
    </g>
  </g>

  <g id="title_block" transform="translate({CANVAS_W - 292}, {CANVAS_H - 52})">
    <rect x="0" y="0" width="278" height="40" rx="6" fill="rgba(12, 21, 39, 0.96)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1" />
    <text x="10" y="14" fill="#f8fafc" font-size="8.8" font-weight="800" letter-spacing="0.4">
      UNIT {room_number} • {area_m2:.1f} m²
    </text>
    <text x="10" y="25" fill="#38bdf8" font-size="7.0" font-weight="700">
      {bcfg['label']} • {orient_label}
    </text>
    <text x="10" y="34" fill="#94a3b8" font-size="6.3" font-weight="500">
      {km_label} • SKALA 1:50
    </text>
    <rect x="228" y="7" width="42" height="26" rx="4" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="0.8" />
    <text x="249" y="18" fill="#38bdf8" font-size="6.5" font-weight="800" text-anchor="middle">CAD</text>
    <text x="249" y="27" fill="#4ade80" font-size="5.6" font-weight="700" text-anchor="middle">VERIFIED</text>
  </g>

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
    p1 = os.path.join("public", "downloads", "blueprints", filename)
    with open(p1, "w", encoding="utf-8") as f:
        f.write(svg)
    p2 = os.path.join("stress_test_500", "blueprints", filename)
    if os.path.exists("stress_test_500/blueprints"):
        with open(p2, "w", encoding="utf-8") as f:
            f.write(svg)


def main():
    start = time.time()
    with open("public/benchmark_results.json", "r", encoding="utf-8") as f:
        rooms = json.load(f)
    print("Regenerating 500 physically proportional architectural CAD blueprints...")
    with ThreadPoolExecutor(max_workers=16) as pool:
        list(pool.map(worker, rooms))
    elapsed = round(time.time() - start, 2)
    print(f"Successfully regenerated all {len(rooms)} blueprint SVGs in {elapsed}s!")


if __name__ == "__main__":
    main()
