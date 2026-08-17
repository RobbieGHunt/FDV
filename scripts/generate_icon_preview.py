import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image
import os

# Create 512x512 canvas
dpi = 100
fig = plt.figure(figsize=(5.12, 5.12), dpi=dpi, facecolor='none')
ax = fig.add_axes([0, 0, 1, 1], facecolor='none')
ax.set_xlim(0, 512)
ax.set_ylim(0, 512)
ax.axis('off')

# 1. Background Squircle (fills out nicely with rounded corners)
squircle = patches.FancyBboxPatch(
    (14, 14), 484, 484,
    boxstyle="round,pad=0,rounding_size=108",
    facecolor='#16181f',
    edgecolor='#2e323e',
    linewidth=3.0,
    zorder=1
)
ax.add_patch(squircle)

# 2. Geometry: Maximize usage of the entire squircle space (no text at bottom)
origin_x, origin_y = 75, 80
max_x, max_y = 445, 445

x_vals = np.linspace(origin_x - 10, max_x - 20, 500)

# Primary Teal Peak (tall and prominent)
mu1 = 230
sigma1 = 52
amp1 = 300
y_teal = origin_y + amp1 * np.exp(-0.5 * ((x_vals - mu1) / sigma1) ** 2)

# Secondary Coral Peak (medium deconvolution peak)
mu2 = 335
sigma2 = 46
amp2 = 205
y_coral = origin_y + amp2 * np.exp(-0.5 * ((x_vals - mu2) / sigma2) ** 2)

# 3. White Dashed Vertical Drop Lines (Thick & Clear, zorder=2)
ax.plot([mu1, mu1], [origin_y, origin_y + amp1], color='#ffffff', lw=5.0, ls=(0, (3, 3)), zorder=2, alpha=0.95)
ax.plot([mu2, mu2], [origin_y, origin_y + amp2], color='#ffffff', lw=5.0, ls=(0, (3, 3)), zorder=2, alpha=0.95)

# 4. Bold Smooth Curves (lw=11.0, zorder=3)
ax.plot(x_vals, y_teal, color='#00adb5', lw=11.5, zorder=3, solid_capstyle='round')
ax.plot(x_vals, y_coral, color='#ff5722', lw=11.5, zorder=3, solid_capstyle='round')

# 5. Bold Peak Apex Dots with Matching Outer Ring Border (zorder=4)
# Teal Peak: White center + Teal border ring
ax.plot(mu1, origin_y + amp1, marker='o', markersize=23, markerfacecolor='#ffffff', markeredgecolor='#00adb5', markeredgewidth=6.5, zorder=4)

# Coral Peak: White center + Coral border ring
ax.plot(mu2, origin_y + amp2, marker='o', markersize=23, markerfacecolor='#ffffff', markeredgecolor='#ff5722', markeredgewidth=6.5, zorder=4)

# 6. Coordinate Axes on TOP Layer (zorder=5, bold & clean)
# Horizontal X-Axis Line & Arrowhead
ax.plot([origin_x - 20, max_x], [origin_y, origin_y], color='#ffffff', lw=7.5, zorder=5, solid_capstyle='butt')
arrow_x = patches.Polygon([[max_x, origin_y - 14], [max_x + 25, origin_y], [max_x, origin_y + 14]], color='#ffffff', zorder=5)
ax.add_patch(arrow_x)

# Vertical Y-Axis Line & Arrowhead
ax.plot([origin_x, origin_x], [origin_y - 20, max_y], color='#ffffff', lw=7.5, zorder=5, solid_capstyle='butt')
arrow_y = patches.Polygon([[origin_x - 14, max_y], [origin_x, max_y + 25], [origin_x + 14, max_y]], color='#ffffff', zorder=5)
ax.add_patch(arrow_y)

# X-Axis Ticks (Bold, on top)
for x_tick in np.linspace(origin_x + 55, max_x - 45, 5):
    ax.plot([x_tick, x_tick], [origin_y - 12, origin_y + 12], color='#ffffff', lw=5.0, zorder=5)

# Y-Axis Ticks (Bold, on top)
for y_tick in np.linspace(origin_y + 60, max_y - 45, 4):
    ax.plot([origin_x - 12, origin_x + 12], [y_tick, y_tick], color='#ffffff', lw=5.0, zorder=5)

# Output Paths
assets_dir = r"c:\Users\robhu413\Documents\Python Scripts\FDV\FDV-App\assets"
os.makedirs(assets_dir, exist_ok=True)
preview_path = os.path.join(assets_dir, "icon_preview.png")

artifact_dir = r"C:\Users\robhu413\.gemini\antigravity\brain\32461789-ba1a-41fb-81b8-ee3bd2fc5107"
artifact_png = os.path.join(artifact_dir, "fdv_icon_preview.png")

plt.savefig(preview_path, dpi=dpi, transparent=True)
plt.savefig(artifact_png, dpi=dpi, transparent=True)
plt.close()

print(f"Generated bold high-visibility preview: {preview_path}")
