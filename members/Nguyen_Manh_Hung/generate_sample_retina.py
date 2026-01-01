from PIL import Image, ImageDraw, ImageFilter
import math

"""Generate a synthetic fundus-like image for quick testing.
Creates 'retina.jpg' in the current directory.
"""

W = 1024
H = 1024
bg_color = (20, 20, 20)
center = (W//2, H//2)

im = Image.new('RGB', (W, H), (0,0,0))
d = ImageDraw.Draw(im)

# radial gradient (reddish)
for r in range(max(center), 0, -1):
    f = r / max(center)
    rcol = int(10 + (200 * (1 - f)))
    gcol = int(10 + (80 * (1 - f)))
    bcol = int(10 + (50 * (1 - f)))
    d.ellipse([center[0]-r, center[1]-r, center[0]+r, center[1]+r], outline=None, fill=(rcol, gcol, bcol))

# draw optic disc (bright circle)
od_r = 80
d.ellipse([center[0]+120-od_r, center[1]-50-od_r, center[0]+120+od_r, center[1]-50+od_r], fill=(255,240,200))

# draw some vessel-like curves
import random
random.seed(1)

def draw_vessel(start, angle, length, width):
    x,y = start
    path = []
    for i in range(length):
        dx = math.cos(angle + (random.random()-0.5)*0.6) * (1 + i*0.01)
        dy = math.sin(angle + (random.random()-0.5)*0.6) * (1 + i*0.01)
        x += dx*6
        y += dy*6
        path.append((x,y))
    # draw thicker to thinner
    for w in range(width, 0, -1):
        d.line(path, fill=(30,20,20), width=w)

# generate vessels from near optic disc
for a in range(-120, 120, 15):
    ang = math.radians(a)
    sx = center[0]+120
    sy = center[1]-50
    draw_vessel((sx,sy), ang, length=120 + abs(a)//2, width=3 if abs(a)%30==0 else 2)

# blur slightly
im = im.filter(ImageFilter.GaussianBlur(radius=1.2))

# add slight noise
import numpy as np
arr = np.array(im).astype('uint8')
noise = (np.random.randn(H, W, 1) * 6).astype('int')
arr = np.clip(arr + noise, 0, 255).astype('uint8')
im = Image.fromarray(arr)

out_path = 'retina.jpg'
im.save(out_path, quality=85)
print('Saved sample retina to', out_path)
