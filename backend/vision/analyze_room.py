#!/usr/bin/env python3
"""
KostKu Local Computer Vision Room Spatial Analyzer (OpenCV + NumPy)
Reads JSON from stdin:
  {
    "imageBase64": "data:image/...;base64,...",
    "imageUrl": "https://...",
    "dimensions": "3.5m x 4.0m",
    "facilities": ["AC", "Kamar Mandi Dalam"]
  }
Outputs structured 2D CAD floorPlan JSON to stdout.
"""

import base64
import ipaddress
import json
import math
import re
import socket
import sys
import time
import urllib.parse
import urllib.request

import cv2
import numpy as np


MAX_IMAGE_BYTES = 8 * 1024 * 1024
URL_TIMEOUT_SEC = 6.0


def rgb_to_hex(rgb):
    r, g, b = [max(0, min(255, int(round(v)))) for v in rgb]
    return f"#{r:02x}{g:02x}{b:02x}"


def color_dist(c1, c2):
    return math.sqrt(sum((float(a) - float(b)) ** 2 for a, b in zip(c1, c2)))


def is_private_ip(ip_str):
    try:
        ip_obj = ipaddress.ip_address(ip_str)
        return (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        )
    except ValueError:
        return True


def validate_safe_url(url):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only http/https image URLs are allowed")
    host = (parsed.hostname or "").strip().lower()
    if not host:
        raise ValueError("Invalid URL hostname")
    if host in ("localhost", "localhost.localdomain") or host.endswith(".local"):
        raise ValueError("Loopback/local host blocked")

    # Reject literal private IPs immediately
    try:
        ipaddress.ip_address(host)
        if is_private_ip(host):
            raise ValueError("Private IP blocked")
    except ValueError as exc:
        if "blocked" in str(exc):
            raise
        # Resolve DNS to prevent SSRF via private DNS A/AAAA records
        try:
            infos = socket.getaddrinfo(host, None)
            for info in infos:
                addr = info[4][0]
                if is_private_ip(addr):
                    raise ValueError("Resolved private IP blocked")
        except socket.gaierror as gai_err:
            raise ValueError(f"DNS resolution failed: {gai_err}")


def load_image_from_payload(payload):
    raw_bytes = None
    image_b64 = payload.get("imageBase64")
    image_url = payload.get("imageUrl")

    if isinstance(image_b64, str) and image_b64.strip():
        s = image_b64.strip()
        if "," in s and s.lower().startswith("data:"):
            s = s.split(",", 1)[1]
        raw_bytes = base64.b64decode(s, validate=False)
        if len(raw_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("Base64 image exceeds 8MB limit")
    elif isinstance(image_url, str) and image_url.strip():
        url = image_url.strip()
        validate_safe_url(url)
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "KostKu-CV-Analyzer/2.0"},
        )
        with urllib.request.urlopen(req, timeout=URL_TIMEOUT_SEC) as resp:
            chunks = []
            total = 0
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_IMAGE_BYTES:
                    raise ValueError("Remote image exceeds 8MB limit")
                chunks.append(chunk)
            raw_bytes = b"".join(chunks)
    else:
        raise ValueError("imageBase64 or imageUrl is required")

    arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Failed to decode image buffer")
    return bgr


def kmeans_palette(rgb_pixels, k=2):
    if rgb_pixels.shape[0] == 0:
        return [(148, 163, 184)] * k, [1.0 / k] * k
    sample = rgb_pixels
    if sample.shape[0] > 6000:
        step = max(1, sample.shape[0] // 6000)
        sample = sample[::step]
    k_eff = min(k, sample.shape[0])
    data = np.float32(sample)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 16, 1.0)
    _, labels, centers = cv2.kmeans(
        data, k_eff, None, criteria, 3, cv2.KMEANS_PP_CENTERS
    )
    counts = np.bincount(labels.flatten(), minlength=k_eff)
    order = np.argsort(-counts)
    total = float(counts.sum()) or 1.0
    ordered_colors = [tuple(float(v) for v in centers[idx]) for idx in order]
    ordered_weights = [float(counts[idx]) / total for idx in order]
    while len(ordered_colors) < k:
        ordered_colors.append(ordered_colors[0])
        ordered_weights.append(0.0)
    return ordered_colors, ordered_weights


def parse_dimensions(dim_str):
    if not isinstance(dim_str, str):
        return 3.5, 4.0, "3.5m x 4.0m"
    m = re.search(r"([\d.]+)\s*m?\s*[xX*]\s*([\d.]+)", dim_str)
    if not m:
        return 3.5, 4.0, "3.5m x 4.0m"
    w = max(2.2, min(8.0, float(m.group(1))))
    l = max(2.2, min(9.0, float(m.group(2))))
    return w, l, f"{w:.1f}m x {l:.1f}m"


def classify_floor(floor_rgb, hsv_strip):
    avg_s = float(np.mean(hsv_strip[:, :, 1]))
    avg_h = float(np.mean(hsv_strip[:, :, 0]))
    avg_v = float(np.mean(hsv_strip[:, :, 2]))
    v_std = float(np.std(hsv_strip[:, :, 2]))

    r, g, b = floor_rgb
    if avg_s > 28 and (4 <= avg_h <= 26) and r > g >= b:
        return "Dark Timber Floor" if avg_v < 115 else "Warm Parquet Wood"
    if avg_s > 36:
        return "Soft Carpet"
    if avg_v > 175 and v_std < 38:
        return "Ceramic Tile"
    if avg_v < 110:
        return "Dark Parquet Wood"
    if v_std > 28 and r > b:
        return "Parquet Wood"
    return "Concrete Screed"


def analyze_room_image(bgr, dimensions_str, facilities):
    t0 = time.perf_counter()

    resized_bgr = cv2.resize(bgr, (360, 270), interpolation=cv2.INTER_AREA)
    rgb = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2GRAY)
    h_img, w_img = gray.shape

    cues = []

    # ── 1. Floor Palette (Bottom strip y: 0.80..0.98, x: 0.12..0.88) ──
    y0_f, y1_f = int(0.80 * h_img), int(0.98 * h_img)
    x0_f, x1_f = int(0.12 * w_img), int(0.88 * w_img)
    floor_patch_rgb = rgb[y0_f:y1_f, x0_f:x1_f]
    floor_patch_hsv = hsv[y0_f:y1_f, x0_f:x1_f]
    floor_colors, _ = kmeans_palette(floor_patch_rgb.reshape(-1, 3), k=2)
    dom_floor_rgb = floor_colors[0]
    floor_hex = rgb_to_hex(dom_floor_rgb)
    floor_type = classify_floor(dom_floor_rgb, floor_patch_hsv)
    cues.append(f"Lantai {floor_type} ({floor_hex})")

    # ── 2. Window Light Wall (Upper walls y: 0.04..0.58) ──
    wy0, wy1 = int(0.04 * h_img), int(0.58 * h_img)
    win_zones = {
        "left": (0, int(0.28 * w_img)),
        "top": (int(0.28 * w_img), int(0.72 * w_img)),
        "right": (int(0.72 * w_img), w_img),
    }
    win_scores = {}
    for z_name, (zx0, zx1) in win_zones.items():
        z_hsv = hsv[wy0:wy1, zx0:zx1]
        bright_natural = (z_hsv[:, :, 2] > 215) & (z_hsv[:, :, 1] < 55)
        ultra_bright = z_hsv[:, :, 2] > 238
        score = float(np.mean(bright_natural | ultra_bright))
        win_scores[z_name] = score

    best_win_wall = max(win_scores, key=win_scores.get)
    if win_scores[best_win_wall] < 0.045:
        window_wall = "none"
    else:
        window_wall = best_win_wall
        cues.append(f"Cahaya jendela kuat di dinding {window_wall} ({win_scores[window_wall]:.2f})")

    # ── 3. Bed Mask, Position, Orientation & Blanket Palette ──
    edges = cv2.Canny(gray, 45, 135)
    # Softness map (textiles have smooth local patches + distinct brightness or saturation vs dark floor)
    blur_gray = cv2.GaussianBlur(gray, (9, 9), 0)
    edge_density = cv2.blur(edges.astype(np.float32) / 255.0, (17, 17))
    textile_coherence = np.clip(1.0 - edge_density * 2.4, 0.05, 1.0)

    by0, by1 = int(0.42 * h_img), int(0.88 * h_img)
    col_ranges = {
        "left": (0, int(0.38 * w_img)),
        "center": (int(0.31 * w_img), int(0.69 * w_img)),
        "right": (int(0.62 * w_img), w_img),
    }

    # Combine textile coherence with bedding saliency (light sheets/duvet or saturated blankets in lower half)
    v_norm = hsv[:, :, 2].astype(np.float32) / 255.0
    s_norm = hsv[:, :, 1].astype(np.float32) / 255.0
    bed_saliency = textile_coherence * (0.45 + 0.35 * v_norm + 0.20 * s_norm)
    zone_mask = bed_saliency[by0:by1, :]

    col_means = {}
    for cname, (cx0, cx1) in col_ranges.items():
        col_means[cname] = float(np.mean(zone_mask[:, cx0:cx1]))

    # Horizontal centroid weighted by top quartile saliency pixels
    thresh = float(np.percentile(zone_mask, 62))
    active_bed_mask = (zone_mask >= thresh).astype(np.float32)
    xs = np.linspace(0.0, 1.0, w_img, dtype=np.float32)[None, :]
    mass_sum = float(np.sum(active_bed_mask * zone_mask)) or 1.0
    centroid_x = float(np.sum(active_bed_mask * zone_mask * xs)) / mass_sum

    if centroid_x < 0.41:
        bed_side = "left"
    elif centroid_x > 0.59:
        bed_side = "right"
    else:
        bed_side = "center"

    # Estimate vertical span and structural Hough lines in y: 0.20..0.80
    hy0, hy1 = int(0.20 * h_img), int(0.80 * h_img)
    hough_edges = edges[hy0:hy1, :]
    lines = cv2.HoughLinesP(
        hough_edges, rho=1, theta=np.pi / 180.0, threshold=28, minLineLength=24, maxLineGap=10
    )

    horiz_weight = 0.0
    diag_left_down = 0.0   # slope dy/dx > 0 or tilting from top-left to bottom-right
    diag_right_down = 0.0  # slope opposite
    if lines is not None:
        for lx1, ly1, lx2, ly2 in np.reshape(lines, (-1, 4)):
            dx = float(lx2 - lx1)
            dy = float(ly2 - ly1)
            length = math.hypot(dx, dy)
            if length < 12:
                continue
            angle = math.degrees(math.atan2(dy, dx))
            # normalize to [-90, 90]
            if angle > 90:
                angle -= 180
            elif angle < -90:
                angle += 180
            abs_ang = abs(angle)
            mid_x = (lx1 + lx2) / (2.0 * w_img)
            if abs_ang < 14.0:
                horiz_weight += length
            elif 15.0 <= abs_ang <= 60.0:
                if angle > 0:
                    diag_left_down += length * (1.2 if mid_x > 0.5 else 0.8)
                else:
                    diag_right_down += length * (1.2 if mid_x < 0.5 else 0.8)

    # Check active bed vertical thickness ratio & side luminance height
    row_profile = np.mean(active_bed_mask, axis=1)
    active_rows = np.where(row_profile > 0.25)[0]
    bed_v_span = (len(active_rows) / float(by1 - by0)) if len(active_rows) > 0 else 0.55

    left_upper_v = float(np.mean(hsv[int(0.25 * h_img):int(0.55 * h_img), 0:int(0.30 * w_img), 2]))
    right_upper_v = float(np.mean(hsv[int(0.25 * h_img):int(0.55 * h_img), int(0.70 * w_img):w_img, 2]))

    total_diag = diag_left_down + diag_right_down
    if horiz_weight > max(120.0, total_diag * 1.45) and bed_v_span < 0.56 and bed_side != "center":
        bed_orientation = "horizontal_top"
    elif total_diag > 150.0 and total_diag > horiz_weight * 0.85:
        if diag_right_down > diag_left_down * 1.25 and right_upper_v >= left_upper_v - 10:
            bed_orientation = "horizontal_right"
        elif diag_left_down > diag_right_down * 1.25 and left_upper_v >= right_upper_v - 10:
            bed_orientation = "horizontal_left"
        else:
            bed_orientation = "vertical"
    else:
        bed_orientation = "vertical"

    # Bed bbox inside lower-middle zone for blanket K-means and span width
    col_profile = np.mean(active_bed_mask, axis=0)
    active_cols = np.where(col_profile > 0.22)[0]
    if len(active_cols) >= 12:
        bx0 = max(0, int(active_cols[0]))
        bx1 = min(w_img, int(active_cols[-1]) + 1)
    else:
        bx0, bx1 = int(0.22 * w_img), int(0.78 * w_img)

    bed_width_ratio = (bx1 - bx0) / float(w_img)

    # Check pillow brightness in top slice of detected bed zone
    py0, py1 = int(0.42 * h_img), int(0.58 * h_img)
    pillow_slice_v = hsv[py0:py1, bx0:bx1, 2]
    pillow_slice_s = hsv[py0:py1, bx0:bx1, 1]
    bright_pillow = (pillow_slice_v > 185) & (pillow_slice_s < 65)
    pillow_x_frac = float(np.mean(bright_pillow)) if bright_pillow.size > 0 else 0.0

    # Parse room dimensions for sensible physical sizing
    dim_w, dim_l, dim_norm = parse_dimensions(dimensions_str)
    area_m2 = dim_w * dim_l

    if bed_width_ratio < 0.42 and area_m2 <= 10.0:
        bed_type = "single"
        pillows = 1
    elif bed_width_ratio < 0.54 and area_m2 <= 12.5 and pillow_x_frac < 0.26:
        bed_type = "super_single"
        pillows = 1
    elif bed_width_ratio < 0.68 or area_m2 <= 15.5:
        bed_type = "double" if bed_width_ratio < 0.62 else "queen"
        pillows = 2
    else:
        bed_type = "king" if area_m2 >= 18.0 else "queen"
        pillows = 2

    if bed_orientation == "vertical" and bed_type in ("double", "queen", "king") and 0.34 <= centroid_x <= 0.66:
        bed_side = "center"
    cues.append(f"Posisi kasur {bed_side} ({bed_orientation})")

    # K-means (K=3) on bed region for blanketHex & blanketAccent
    bed_patch_rgb = rgb[int(0.48 * h_img):int(0.86 * h_img), bx0:bx1]
    bed_colors, _ = kmeans_palette(bed_patch_rgb.reshape(-1, 3), k=3)
    blanket_rgb = bed_colors[0]
    blanket_hex = rgb_to_hex(blanket_rgb)

    accent_rgb = bed_colors[1]
    best_dist = color_dist(blanket_rgb, accent_rgb)
    for cand in bed_colors[1:]:
        d = color_dist(blanket_rgb, cand)
        if d > best_dist:
            best_dist = d
            accent_rgb = cand

    if best_dist < 28.0:
        # Derive harmonic contrast accent so runner never disappears into duvet
        r, g, b = blanket_rgb
        if (r + g + b) / 3.0 > 155:
            accent_rgb = (max(25, r - 85), max(35, g - 75), max(45, b - 65))
        else:
            accent_rgb = (min(245, r + 75), min(245, g + 75), min(245, b + 80))
    blanket_accent = rgb_to_hex(accent_rgb)
    cues.append(f"Palet sprei {blanket_hex} / aksen {blanket_accent}")

    # ── 4. Facilities Reconciliation & AC / KM Dalam Strict Rules ──
    fac_list = [str(f).strip().lower() for f in (facilities or []) if f]

    # Critical KM Luar bug fix: avoid matching "Dapur Bersama" or "Kulkas Bersama" as outdoor bathroom
    mentions_outside_bm = any(
        k in f
        for f in fac_list
        for k in (
            "km luar",
            "kamar mandi luar",
            "mandi luar",
            "shared bath",
            "shared bathroom",
            "kamar mandi bersama",
            "km bersama",
        )
    )
    mentions_ensuite_bm = any(
        k in f
        for f in fac_list
        for k in ("km dalam", "kamar mandi dalam", "ensuite", "en-suite", "water heater", "bathtub")
    )
    has_bathroom = bool(mentions_ensuite_bm and not mentions_outside_bm)

    if has_bathroom:
        if bed_side != "left" and bed_orientation != "horizontal_left":
            bathroom_corner = "top_left"
        else:
            bathroom_corner = "top_right"
        cues.append(f"KM Dalam terdeteksi ({bathroom_corner})")
    else:
        bathroom_corner = "none"

    # AC detection: facilities first OR white horizontal rect in y: 0.02..0.26 with aspect > 2.6
    mentions_ac = any(
        re.search(r"\bac\b|air\s*cond|inverter|pendingin", f) for f in fac_list
    )
    detected_ac_wall = None
    top_band_hsv = hsv[int(0.02 * h_img):int(0.26 * h_img), :]
    ac_white_mask = ((top_band_hsv[:, :, 2] > 180) & (top_band_hsv[:, :, 1] < 42)).astype(np.uint8) * 255
    contours, _ = cv2.findContours(ac_white_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        cx, cy, cw, ch = cv2.boundingRect(cnt)
        if ch >= 6 and cw >= 26 and (cw / float(ch)) > 2.6 and (cw * ch) < (w_img * h_img * 0.06):
            mid = (cx + cw / 2.0) / float(w_img)
            detected_ac_wall = "left" if mid < 0.28 else ("right" if mid > 0.72 else "top")
            break

    has_ac = bool(mentions_ac or detected_ac_wall)
    if not has_ac:
        ac_wall = "none"
    elif detected_ac_wall:
        ac_wall = detected_ac_wall
        if ac_wall == window_wall and window_wall != "top":
            ac_wall = "top"
    else:
        if window_wall in ("left", "right"):
            ac_wall = "top"
        elif bed_side == "left":
            ac_wall = "right"
        else:
            ac_wall = "top"

    if has_ac and ac_wall != "none":
        cues.append(f"AC dipasang di dinding {ac_wall}")

    # Nakas selection matching bed side & size
    if bed_type == "single":
        nakas_side = "left" if bed_side == "center" else "none"
    elif bed_side == "left":
        nakas_side = "right"
    elif bed_side == "right":
        nakas_side = "left"
    else:
        nakas_side = "both"

    # Furnitures assembly
    furnitures = ["wardrobe", "desk"]
    if not fac_list:
        furnitures = ["wardrobe", "desk"]
    else:
        has_wardrobe = any("lemari" in f or "wardrobe" in f for f in fac_list) or True
        has_desk = any("meja" in f or "desk" in f or "belajar" in f or "kerja" in f for f in fac_list) or True
        furnitures = []
        if has_wardrobe:
            furnitures.append("wardrobe")
        if has_desk:
            furnitures.append("desk")

    if window_wall != "none":
        furnitures.append("window")
    if has_ac:
        furnitures.append("ac")
    if has_bathroom:
        furnitures.append("bathroom")
    if any("kulkas" in f or "fridge" in f for f in fac_list):
        furnitures.append("fridge")

    # Deduplicate preserving order
    furnitures = list(dict.fromkeys(furnitures))

    # ── 5. Camera Blind Spot (Unsure Zone) ──
    if bed_side == "right" or window_wall == "right":
        unsure_zone = {"side": "left_front", "label": "Area Foyer / Luar Sudut Kamera"}
    elif bed_side == "left" or window_wall == "left":
        unsure_zone = {"side": "right_front", "label": "Area Foyer / Luar Sudut Kamera"}
    else:
        unsure_zone = {"side": "left_front", "label": "Area Foyer / Luar Sudut Kamera"}

    # Wardrobe & Desk placement opposite conflicting walls
    wardrobe_pos = "bottom_left" if bed_side != "left" else "bottom_right"
    if has_bathroom and bathroom_corner == "top_left" and wardrobe_pos == "bottom_left":
        wardrobe_pos = "bottom_left"
    desk_pos = "bottom_right" if wardrobe_pos == "bottom_left" else "bottom_left"
    if window_wall == "left" and not has_bathroom:
        desk_pos = "bottom_left"
        wardrobe_pos = "bottom_right"

    latency_ms = round((time.perf_counter() - t0) * 1000.0, 1)
    confidence_pct = round(min(99.2, 87.5 + len(cues) * 2.1), 1)

    return {
        "dimensions": dim_norm,
        "bedType": bed_type,
        "pillows": pillows,
        "bedSide": bed_side,
        "bedOrientation": bed_orientation,
        "nakasSide": nakas_side,
        "windowWall": window_wall,
        "acWall": ac_wall,
        "bathroomCorner": bathroom_corner,
        "doorPosition": "bottom_center",
        "wardrobePos": wardrobe_pos,
        "deskPos": desk_pos,
        "furnitures": furnitures,
        "blanketHex": blanket_hex,
        "blanketAccent": blanket_accent,
        "floorHex": floor_hex,
        "floorType": floor_type,
        "unsureZone": unsure_zone,
        "generated": True,
        "mode": "ai",
        "cvAnalyzed": True,
        "cvMeta": {
            "engine": "KostKu-OpenCV-Spatial-v2",
            "confidencePct": confidence_pct,
            "latencyMs": latency_ms,
            "detectedCues": cues,
        },
    }


def main():
    try:
        raw_stdin = sys.stdin.read()
        payload = json.loads(raw_stdin) if raw_stdin.strip() else {}
        bgr = load_image_from_payload(payload)
        result = analyze_room_image(
            bgr,
            payload.get("dimensions", "3.5m x 4.0m"),
            payload.get("facilities", []),
        )
        print(json.dumps({"success": True, "floorPlan": result}))
    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
