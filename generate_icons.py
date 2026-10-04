import os
from PIL import Image, ImageDraw, ImageFont

def create_gradient_icon(size, is_maskable=False):
    # Create image with RGBA
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background gradient
    # Deep slate/indigo to vibrant royal blue (#0f172a -> #2563eb -> #38bdf8)
    corner_radius = int(size * 0.22) if not is_maskable else 0
    padding = int(size * 0.08) if is_maskable else 0
    
    # Draw rounded rect or full rect for background
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    
    # Linear gradient simulation
    c1 = (15, 23, 42)    # #0f172a
    c2 = (37, 99, 235)   # #2563eb
    c3 = (99, 102, 241)  # #6366f1
    
    for y in range(size):
        ratio = y / float(size)
        if ratio < 0.5:
            r2 = ratio * 2
            r = int(c1[0] + (c2[0] - c1[0]) * r2)
            g = int(c1[1] + (c2[1] - c1[1]) * r2)
            b = int(c1[2] + (c2[2] - c1[2]) * r2)
        else:
            r2 = (ratio - 0.5) * 2
            r = int(c2[0] + (c3[0] - c2[0]) * r2)
            g = int(c2[1] + (c3[1] - c2[1]) * r2)
            b = int(c3[2] + (c3[2] - c2[2]) * r2)
        bg_draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
        
    # Mask for rounded corners if not maskable
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    if is_maskable:
        mask_draw.rectangle([0, 0, size, size], fill=255)
    else:
        mask_draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=255)
        
    img.paste(bg, (0, 0), mask)
    draw = ImageDraw.Draw(img)
    
    # Draw building / house emblem
    scale = size / 512.0
    cx = size // 2
    cy = int(size * 0.52)
    
    # Outer glow / subtle ring
    glow_color = (255, 255, 255, 30)
    draw.ellipse([cx - int(170 * scale), cy - int(170 * scale), cx + int(170 * scale), cy + int(170 * scale)], outline=glow_color, width=int(3 * scale))
    
    # Roof (Modern stylized triangular polygon with thickness)
    roof_top = (cx, int(cy - 120 * scale))
    roof_left = (int(cx - 130 * scale), int(cy - 20 * scale))
    roof_right = (int(cx + 130 * scale), int(cy - 20 * scale))
    
    # Roof lines
    roof_color = (255, 255, 255, 245)
    accent_cyan = (56, 189, 248, 255)
    
    # Draw roof polygon
    draw.polygon([roof_top, roof_left, (int(cx - 95 * scale), int(cy - 20 * scale)), 
                  (cx, int(cy - 85 * scale)), (int(cx + 95 * scale), int(cy - 20 * scale)), roof_right], fill=roof_color)
    
    # House body
    body_left = int(cx - 95 * scale)
    body_right = int(cx + 95 * scale)
    body_top = int(cy - 15 * scale)
    body_bottom = int(cy + 120 * scale)
    body_radius = int(14 * scale)
    
    draw.rounded_rectangle([body_left, body_top, body_right, body_bottom], radius=body_radius, fill=(255, 255, 255, 230))
    
    # Modern Door with Arch
    door_w = int(45 * scale)
    door_h = int(68 * scale)
    door_left = cx - door_w // 2
    door_right = cx + door_w // 2
    door_bottom = body_bottom
    door_top = body_bottom - door_h
    door_color = (30, 41, 59, 255) # dark slate
    
    draw.rounded_rectangle([door_left, door_top, door_right, door_bottom], radius=int(12 * scale), fill=door_color)
    
    # Door knob / accent
    knob_r = max(2, int(4 * scale))
    knob_x = door_right - int(12 * scale)
    knob_y = door_top + door_h // 2
    draw.ellipse([knob_x - knob_r, knob_y - knob_r, knob_x + knob_r, knob_y + knob_r], fill=accent_cyan)
    
    # Windows (2 modern square windows on left and right)
    win_size = int(32 * scale)
    win_y = int(body_top + 25 * scale)
    win_left_x = int(body_left + 20 * scale)
    win_right_x = int(body_right - 20 * scale - win_size)
    win_radius = int(6 * scale)
    
    draw.rounded_rectangle([win_left_x, win_y, win_left_x + win_size, win_y + win_size], radius=win_radius, fill=accent_cyan)
    draw.rounded_rectangle([win_right_x, win_y, win_right_x + win_size, win_y + win_size], radius=win_radius, fill=accent_cyan)
    
    # Sparkle / Star on the top right
    star_x = int(cx + 105 * scale)
    star_y = int(cy - 90 * scale)
    star_r = int(12 * scale)
    draw.ellipse([star_x - star_r, star_y - star_r, star_x + star_r, star_y + star_r], fill=(253, 224, 71, 240))
    
    return img

os.makedirs('public', exist_ok=True)

# Generate icons
icon_512 = create_gradient_icon(512, is_maskable=False)
icon_512.save('public/icon-512.png', 'PNG')

icon_maskable_512 = create_gradient_icon(512, is_maskable=True)
icon_maskable_512.save('public/icon-maskable-512.png', 'PNG')

icon_192 = create_gradient_icon(192, is_maskable=False)
icon_192.save('public/icon-192.png', 'PNG')

icon_apple = create_gradient_icon(180, is_maskable=False)
icon_apple.save('public/apple-touch-icon.png', 'PNG')

icon_64 = create_gradient_icon(64, is_maskable=False)
icon_64.save('public/favicon.png', 'PNG')
icon_64.save('public/favicon.ico', 'ICO')

print("All PWA icons generated successfully!")
