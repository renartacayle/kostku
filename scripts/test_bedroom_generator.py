import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

def create_bedroom_photo(seed_id, width=640, height=480):
    rng = random.Random(seed_id)
    
    # Color palettes
    palettes = [
        {"name": "Warm Earth", "wall_back": (242, 238, 231), "wall_left": (228, 222, 214), "floor": (180, 140, 100), "bed_sheet": (245, 245, 250), "blanket": (190, 150, 110), "wood": (120, 80, 50), "curtain": (210, 180, 140)},
        {"name": "Modern Industrial", "wall_back": (220, 225, 230), "wall_left": (195, 202, 210), "floor": (150, 155, 160), "bed_sheet": (250, 250, 250), "blanket": (50, 60, 75), "wood": (70, 75, 80), "curtain": (90, 100, 115)},
        {"name": "Japandi Linen", "wall_back": (248, 246, 240), "wall_left": (235, 232, 224), "floor": (210, 185, 150), "bed_sheet": (255, 255, 255), "blanket": (160, 175, 155), "wood": (160, 130, 95), "curtain": (225, 220, 210)},
        {"name": "Pastel Putri", "wall_back": (253, 244, 246), "wall_left": (245, 230, 235), "floor": (220, 195, 170), "bed_sheet": (255, 255, 255), "blanket": (230, 160, 180), "wood": (140, 100, 70), "curtain": (240, 200, 215)},
        {"name": "Nordic Blue", "wall_back": (238, 242, 248), "wall_left": (220, 228, 238), "floor": (170, 140, 110), "bed_sheet": (250, 250, 252), "blanket": (55, 100, 150), "wood": (100, 75, 55), "curtain": (110, 140, 180)}
    ]
    pal = rng.choice(palettes)
    
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Room Corner Geometry
    cx = rng.randint(200, 250)
    cy_floor = rng.randint(250, 280)
    cy_ceil = rng.randint(40, 65)
    
    # Ceiling
    draw.polygon([(0, 0), (width, 0), (width, 70), (cx, cy_ceil), (0, 0)], fill=(250, 250, 252))
    
    # Left Wall
    draw.polygon([(0, 0), (cx, cy_ceil), (cx, cy_floor), (0, 360)], fill=pal["wall_left"])
    
    # Back Wall
    draw.polygon([(cx, cy_ceil), (width, 70), (width, 310), (cx, cy_floor)], fill=pal["wall_back"])
    
    # Floor with parquet plank perspective
    floor_pts = [(0, 360), (cx, cy_floor), (width, 310), (width, height), (0, height)]
    draw.polygon(floor_pts, fill=pal["floor"])
    
    # Floor parquet lines
    for fx in range(-100, width + 200, 45):
        draw.line([(fx, height), (cx, cy_floor)], fill=(int(pal["floor"][0]*0.88), int(pal["floor"][1]*0.88), int(pal["floor"][2]*0.88)), width=1)
    
    # Baseboards
    draw.line([(0, 360), (cx, cy_floor)], fill=(80, 60, 40), width=4)
    draw.line([(cx, cy_floor), (width, 310)], fill=(80, 60, 40), width=4)
    
    # Corner shadow line
    draw.line([(cx, cy_ceil), (cx, cy_floor)], fill=(int(pal["wall_left"][0]*0.75), int(pal["wall_left"][1]*0.75), int(pal["wall_left"][2]*0.75)), width=2)
    
    # ── Window on Left Wall with Daylight ─────────────────────────
    win_pts = [(40, 110), (160, 85), (160, 230), (40, 275)]
    draw.polygon(win_pts, fill=(210, 235, 255))
    # Window Frame
    draw.polygon(win_pts, outline=(100, 110, 120), width=3)
    # Window divider lines
    draw.line([(100, 98), (100, 252)], fill=(120, 130, 140), width=2)
    draw.line([(40, 192), (160, 158)], fill=(120, 130, 140), width=2)
    # Window daylight glow
    draw.polygon([(10, 100), (35, 95), (35, 290), (10, 295)], fill=(240, 245, 255))
    
    # ── Springbed on Back Wall ─────────────────────────────────────
    bed_x1 = cx + rng.randint(40, 70)
    bed_w = rng.randint(180, 240)
    bed_x2 = bed_x1 + bed_w
    
    # Bed Headboard against back wall
    hb_top_y = cy_floor - rng.randint(90, 115)
    hb_pts = [(bed_x1, hb_top_y), (bed_x2, hb_top_y + int((310-cy_floor)*(bed_w/(width-cx)))), 
              (bed_x2, cy_floor + int((310-cy_floor)*(bed_w/(width-cx)))), (bed_x1, cy_floor)]
    draw.polygon(hb_pts, fill=pal["wood"], outline=(int(pal["wood"][0]*0.8), int(pal["wood"][1]*0.8), int(pal["wood"][2]*0.8)), width=2)
    
    # Mattress 3D Box
    mat_top_pts = [
        (bed_x1 + 5, cy_floor - 25),
        (bed_x2 - 5, cy_floor - 15),
        (bed_x2 + 30, cy_floor + 110),
        (bed_x1 - 25, cy_floor + 100)
    ]
    draw.polygon(mat_top_pts, fill=pal["bed_sheet"], outline=(210, 215, 225), width=2)
    
    # Mattress Front & Side Thickness
    mat_front = [
        (bed_x1 - 25, cy_floor + 100),
        (bed_x2 + 30, cy_floor + 110),
        (bed_x2 + 30, cy_floor + 140),
        (bed_x1 - 25, cy_floor + 130)
    ]
    draw.polygon(mat_front, fill=(int(pal["bed_sheet"][0]*0.88), int(pal["bed_sheet"][1]*0.88), int(pal["bed_sheet"][2]*0.88)), outline=(180, 185, 195))
    
    mat_side = [
        (bed_x1 - 25, cy_floor + 100),
        (bed_x1 + 5, cy_floor - 25),
        (bed_x1 + 5, cy_floor + 5),
        (bed_x1 - 25, cy_floor + 130)
    ]
    draw.polygon(mat_side, fill=(int(pal["bed_sheet"][0]*0.82), int(pal["bed_sheet"][1]*0.82), int(pal["bed_sheet"][2]*0.82)))
    
    # Bed Blanket / Bed Runner
    blanket_pts = [
        (bed_x1 - 10, cy_floor + 45),
        (bed_x2 + 15, cy_floor + 55),
        (bed_x2 + 30, cy_floor + 110),
        (bed_x1 - 25, cy_floor + 100)
    ]
    draw.polygon(blanket_pts, fill=pal["blanket"])
    
    # Pillows
    draw.rounded_rectangle([bed_x1 + 20, cy_floor - 20, bed_x1 + 80, cy_floor + 15], radius=6, fill=(255, 255, 255), outline=(200, 205, 215))
    draw.rounded_rectangle([bed_x1 + 95, cy_floor - 15, bed_x1 + 155, cy_floor + 20], radius=6, fill=(255, 255, 255), outline=(200, 205, 215))
    
    # Bolster
    draw.rounded_rectangle([bed_x1 + 60, cy_floor + 15, bed_x1 + 140, cy_floor + 35], radius=8, fill=(245, 248, 252), outline=(195, 200, 210))
    
    # ── Study Desk & Chair (Right or Left side) ───────────────────
    desk_x1 = bed_x2 + 20
    if desk_x1 + 80 < width:
        desk_x2 = min(width - 15, desk_x1 + 75)
        desk_top = [
            (desk_x1, cy_floor + 25),
            (desk_x2, cy_floor + 35),
            (desk_x2 + 10, cy_floor + 85),
            (desk_x1 - 5, cy_floor + 75)
        ]
        draw.polygon(desk_top, fill=(int(pal["wood"][0]*1.1), int(pal["wood"][1]*1.1), int(pal["wood"][2]*1.1)), outline=(80, 50, 30))
        # Desk legs
        draw.line([(desk_x1 - 5, cy_floor + 75), (desk_x1 - 5, cy_floor + 160)], fill=(40, 40, 45), width=3)
        draw.line([(desk_x2 + 10, cy_floor + 85), (desk_x2 + 10, cy_floor + 170)], fill=(40, 40, 45), width=3)
        # Laptop on desk
        draw.rectangle([desk_x1 + 15, cy_floor + 45, desk_x1 + 45, cy_floor + 65], fill=(180, 190, 200), outline=(120, 130, 140))
        draw.polygon([(desk_x1 + 15, cy_floor + 45), (desk_x1 + 45, cy_floor + 45), (desk_x1 + 45, cy_floor + 25), (desk_x1 + 15, cy_floor + 25)], fill=(30, 40, 60))
        # Glowing laptop screen
        draw.rectangle([desk_x1 + 18, cy_floor + 28, desk_x1 + 42, cy_floor + 42], fill=(56, 189, 248))
    
    # ── AC Unit on Back Wall ──────────────────────────────────────
    ac_x = cx + rng.randint(80, 180)
    draw.rounded_rectangle([ac_x, 90, ac_x + 90, 118], radius=4, fill=(250, 252, 255), outline=(200, 210, 220), width=1)
    draw.line([(ac_x + 8, 112), (ac_x + 82, 112)], fill=(160, 175, 190), width=2)
    # AC power led
    draw.ellipse([ac_x + 78, 100, ac_x + 82, 104], fill=(74, 222, 128))
    
    # ── Wall Framed Art ───────────────────────────────────────────
    art_x = cx + 80
    art_y = 135
    draw.rectangle([art_x, art_y, art_x + 75, art_y + 45], fill=(230, 235, 240), outline=(50, 40, 30), width=3)
    draw.ellipse([art_x + 20, art_y + 12, art_x + 45, art_y + 35], fill=(int(pal["blanket"][0]*0.9), int(pal["blanket"][1]*0.9), int(pal["blanket"][2]*0.9)))
    
    # ── Subtle Camera Sensor Noise (Realistic Photo Look) ─────────
    pixels = img.load()
    for y in range(0, height, 2):
        for x in range(0, width, 2):
            noise = rng.randint(-5, 5)
            r, g, b = pixels[x, y]
            pixels[x, y] = (max(0, min(255, r + noise)), max(0, min(255, g + noise)), max(0, min(255, b + noise)))
            
    return img

test_img = create_bedroom_photo(1)
test_img.save("stress_test_500/photos/test_001.jpg", "JPEG", quality=90)
print("Sample room photo generated successfully: stress_test_500/photos/test_001.jpg")
