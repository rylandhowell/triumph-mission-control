#!/usr/bin/env python3
"""
Professional Architectural Plan PDF Generator
Creates high-quality floor plans and elevations
"""

import argparse
import json
import math
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

W, H = 612, 792  # letter size
MARGIN = 36
TITLE_W = 100


def load_spec(path):
    with open(path) as f:
        return json.load(f)


def draw_text(c, x, y, text, size=9, bold=False):
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, y, text)


def draw_double_wall(c, x, y, w, h, thickness=4):
    """Draw wall as thick outline"""
    c.setLineWidth(thickness)
    c.rect(x, y, w, h)


def draw_door(c, x, y, width, height, swing_right=True):
    """Draw door with swing arc"""
    c.setLineWidth(1)
    # Door frame
    c.line(x, y, x + width, y)
    c.line(x, y, x, y + height)
    c.line(x + width, y, x + width, y + height)
    # Swing arc
    r = min(width, height)
    if swing_right:
        c.arc(x, y, x + 2*r, y + 2*r, 180, -90)
    else:
        c.arc(x - r, y, x + r, y + 2*r, 0, 90)


def draw_window(c, x, y, w, h):
    """Draw window with glazing line"""
    c.setLineWidth(1.5)
    c.rect(x, y, w, h)
    c.line(x + 2, y + h/2, x + w - 2, y + h/2)


def draw_dim_arrow(c, x, y, vertical=False):
    """Draw dimension arrow tick"""
    c.setLineWidth(0.6)
    if vertical:
        c.line(x - 3, y, x + 3, y)
    else:
        c.line(x, y - 3, x, y + 3)


def draw_dimension_h(c, x1, x2, y, label):
    """Horizontal dimension with extension lines"""
    c.setLineWidth(0.5)
    # Extension lines
    c.line(x1, y - 5, x1, y + 12)
    c.line(x2, y - 5, x2, y + 12)
    # Dimension line
    c.line(x1, y + 8, x2, y + 8)
    # Arrows
    draw_dim_arrow(c, x1, y + 8)
    draw_dim_arrow(c, x2, y + 8)
    # Label
    draw_text(c, (x1 + x2)/2 - 20, y + 10, label, 8)


def draw_dimension_v(c, x, y1, y2, label):
    """Vertical dimension"""
    c.setLineWidth(0.5)
    c.line(x - 12, y1, x + 5, y1)
    c.line(x - 12, y2, x + 5, y2)
    c.line(x - 8, y1, x - 8, y2)
    draw_dim_arrow(c, x - 8, y1, True)
    draw_dim_arrow(c, x - 8, y2, True)
    c.saveState()
    c.translate(x - 14, (y1 + y2)/2)
    c.rotate(90)
    draw_text(c, -15, -2, label, 8)
    c.restoreState()


def draw_grid_bubble(c, x, y, label):
    """Grid bubble circle with letter/number"""
    c.setLineWidth(0.8)
    c.circle(x, y, 10, stroke=1, fill=0)
    draw_text(c, x - 4, y - 3, label, 9, True)


def title_block(c, sheet, project):
    """Right side title block"""
    bx = W - TITLE_W - MARGIN
    by = MARGIN
    bw = TITLE_W
    bh = H - 2 * MARGIN
    
    c.setLineWidth(1.5)
    c.rect(bx, by, bw, bh)
    
    # Header lines
    c.line(bx, H - MARGIN - 70, bx + bw, H - MARGIN - 70)
    c.line(bx, H - MARGIN - 140, bx + bw, H - MARGIN - 140)
    c.line(bx, H - MARGIN - 220, bx + bw, H - MARGIN - 220)
    c.line(bx, H - MARGIN - 300, bx + bw, H - MARGIN - 300)
    
    # Company
    draw_text(c, bx + 8, H - MARGIN - 25, "TRIUMPH", 11, True)
    draw_text(c, bx + 8, H - MARGIN - 40, "HOMES", 11, True)
    draw_text(c, bx + 8, H - MARGIN - 55, "CONCEPT", 9)
    
    # Sheet
    draw_text(c, bx + 8, H - MARGIN - 95, "SHEET", 10, True)
    draw_text(c, bx + 8, H - MARGIN - 130, sheet, 28, True)
    
    # Project
    draw_text(c, bx + 8, H - MARGIN - 175, "PROJECT", 9, True)
    draw_text(c, bx + 8, H - MARGIN - 190, project[:18], 9)
    
    # Date
    draw_text(c, bx + 8, H - MARGIN - 255, "DATE", 9, True)
    draw_text(c, bx + 8, H - MARGIN - 270, "05/03/26", 9)
    
    # Disclaimer
    draw_text(c, bx + 8, MARGIN + 45, "NOT FOR", 8, True)
    draw_text(c, bx + 8, MARGIN + 32, "CONSTRUCTION", 8, True)


def draw_t1(c, spec):
    """Cover sheet"""
    x, y = MARGIN, MARGIN
    w = W - 2*MARGIN - TITLE_W
    h = H - 2*MARGIN
    
    c.setLineWidth(2)
    c.rect(x, y, w, h)
    
    # Title
    draw_text(c, x + 40, y + h - 80, "CONCEPT PLAN SET", 22, True)
    draw_text(c, x + 40, y + h - 110, spec["project_name"], 16, True)
    draw_text(c, x + 40, y + h - 135, spec.get("subtitle", "Mobile, Alabama"), 11)
    
    # Sheet index
    c.setLineWidth(1)
    c.rect(x + 40, y + h - 280, w - 80, 100)
    draw_text(c, x + w/2 - 35, y + h - 195, "SHEET INDEX", 11, True)
    sheets = ["T-1  COVER PAGE", "A-1  FLOOR PLAN", "A-2  ELEVATIONS", "A-3  SCHEDULE"]
    for i, s in enumerate(sheets):
        draw_text(c, x + 55, y + h - 220 - i*16, s, 10)
    
    # Front elevation sketch area
    c.rect(x + 60, y + 60, w - 120, 160)
    draw_text(c, x + w/2 - 55, y + 45, "FRONT ELEVATION", 10, True)
    
    title_block(c, "T-1", spec["project_name"])


def draw_a1(c, spec):
    """Floor plan with full dimensions"""
    x, y = MARGIN, MARGIN
    w = W - 2*MARGIN - TITLE_W
    h = H - 2*MARGIN
    
    c.setLineWidth(2)
    c.rect(x, y, w, h)
    draw_text(c, x + 30, y + h - 30, "FLOOR PLAN", 13, True)
    draw_text(c, x + w - 120, y + h - 30, '1/4" = 1\'-0"', 9)
    
    # Plan area
    px, py = x + 55, y + 70
    pw, ph = w - 100, h - 130
    
    # Grid lines
    grid_x = [px, px + pw*0.22, px + pw*0.48, px + pw*0.78, px + pw]
    grid_y = [py, py + ph*0.25, py + ph*0.55, py + ph*0.80, py + ph]
    
    c.setLineWidth(0.3)
    for gx in grid_x[1:-1]:
        c.line(gx, py - 15, gx, py + ph + 15)
    for gy in grid_y[1:-1]:
        c.line(px - 15, gy, px + pw + 15, gy)
    
    # Grid bubbles
    for i, gx in enumerate(grid_x):
        draw_grid_bubble(c, gx, py + ph + 28, chr(65+i))
        draw_grid_bubble(c, gx, py - 28, chr(65+i))
    for i, gy in enumerate(grid_y):
        draw_grid_bubble(c, px - 28, gy, str(i+1))
        draw_grid_bubble(c, px + pw + 28, gy, str(i+1))
    
    # Outer walls (thick doubled)
    draw_double_wall(c, px, py, pw, ph, 5)
    
    # Rooms
    rooms = [
        (px, py + ph*0.80, pw*0.22, ph*0.20, "MASTER", "14'-0 x 10'-6"),
        (px + pw*0.22, py + ph*0.80, pw*0.26, ph*0.20, "MASTER BATH", "16'-0 x 10'-6"),
        (px + pw*0.48, py + ph*0.80, pw*0.30, ph*0.20, "KITCHEN", "18'-0 x 10'-6"),
        (px + pw*0.78, py + ph*0.80, pw*0.22, ph*0.20, "PANTRY", "12'-0 x 10'-6"),
        (px, py + ph*0.55, pw*0.22, ph*0.25, "BED 2", "14'-0 x 15'-0"),
        (px + pw*0.22, py + ph*0.55, pw*0.56, ph*0.25, "LIVING", "34'-0 x 15'-0"),
        (px + pw*0.78, py + ph*0.55, pw*0.22, ph*0.25, "BED 3", "12'-0 x 15'-0"),
        (px, py + ph*0.25, pw*0.22, ph*0.30, "LAUNDRY", "14'-0 x 12'-0"),
        (px + pw*0.22, py + ph*0.25, pw*0.56, ph*0.30, "DINING", "34'-0 x 12'-0"),
        (px + pw*0.78, py + ph*0.25, pw*0.22, ph*0.30, "MUD", "12'-0 x 12'-0"),
        (px, py, pw*0.22, ph*0.25, "GARAGE", "14'-0 x 10'-0"),
        (px + pw*0.22, py, pw*0.56, ph*0.25, "WORKSHOP", "34'-0 x 10'-0"),
        (px + pw*0.78, py, pw*0.22, ph*0.25, "STORAGE", "12'-0 x 10'-0"),
    ]
    
    for rx, ry, rw, rh, name, dims in rooms:
        c.setLineWidth(1)
        c.rect(rx, ry, rw, rh)
        draw_text(c, rx + 4, ry + rh - 12, name, 8, True)
        if dims:
            draw_text(c, rx + 4, ry + 4, dims, 7)
    
    # Dimensions horizontal
    draw_dimension_h(c, px, px + pw*0.22, py + ph + 18, "14'-0")
    draw_dimension_h(c, px + pw*0.22, px + pw*0.48, py + ph + 18, "18'-0")
    draw_dimension_h(c, px + pw*0.48, px + pw*0.78, py + ph + 18, "16'-0")
    draw_dimension_h(c, px + pw*0.78, px + pw, py + ph + 18, "12'-0")
    draw_dimension_h(c, px, px + pw, py + ph + 35, "60'-0")
    
    # Dimensions vertical
    draw_dimension_v(c, px - 22, py, py + ph*0.25, "10'-0")
    draw_dimension_v(c, px - 22, py + ph*0.25, py + ph*0.55, "12'-0")
    draw_dimension_v(c, px - 22, py + ph*0.55, py + ph*0.80, "15'-0")
    draw_dimension_v(c, px - 22, py + ph*0.80, py + ph, "10'-6")
    draw_dimension_v(c, px - 40, py, py + ph, "47'-6")
    
    # Doors and windows
    draw_door(c, px + pw*0.48, py + ph*0.55, 28, 28)
    draw_door(c, px + pw*0.22, py + ph*0.25, 28, 28)
    draw_window(c, px + 35, py + ph - 6, 50, 6)
    draw_window(c, px + pw*0.30, py + ph - 6, 60, 6)
    
    title_block(c, "A-1", spec["project_name"])


def draw_a2(c, spec):
    """Elevations"""
    x, y = MARGIN, MARGIN
    w = W - 2*MARGIN - TITLE_W
    h = H - 2*MARGIN
    
    c.setLineWidth(2)
    c.rect(x, y, w, h)
    draw_text(c, x + 30, y + h - 30, "EXTERIOR ELEVATIONS", 13, True)
    
    # Front elevation
    ex, ey = x + 30, y + h - 260
    ew, eh = w - 60, 180
    c.setLineWidth(1)
    c.rect(ex, ey, ew, eh)
    draw_text(c, ex + 8, ey + 8, "FRONT", 9, True)
    
    # Ground line
    c.setLineWidth(2)
    c.line(ex + 10, ey + 20, ex + ew - 10, ey + 20)
    
    # Roof
    c.line(ex + 30, ey + eh - 30, ex + ew/2, ey + eh - 5)
    c.line(ex + ew/2, ey + eh - 5, ex + ew - 30, ey + eh - 30)
    
    # Windows
    draw_window(c, ex + 50, ey + 50, 36, 48)
    draw_window(c, ex + 100, ey + 50, 36, 48)
    draw_window(c, ex + ew - 140, ey + 50, 36, 48)
    draw_window(c, ex + ew - 90, ey + 50, 36, 48)
    
    # Door
    draw_door(c, ex + ew/2 - 18, ey + 20, 36, 60)
    
    # Rear elevation
    rx, ry = x + 30, y + 50
    rw, rh = w - 60, 140
    c.rect(rx, ry, rw, rh)
    draw_text(c, rx + 8, ry + 8, "REAR", 9, True)
    c.setLineWidth(2)
    c.line(rx + 15, ry + 20, rx + rw - 15, ry + 20)
    c.line(rx + 25, ry + rh - 25, rx + rw - 25, ry + rh - 25)
    
    title_block(c, "A-2", spec["project_name"])


def draw_a3(c, spec):
    """Room schedule"""
    x, y = MARGIN, MARGIN
    w = W - 2*MARGIN - TITLE_W
    h = H - 2*MARGIN
    
    c.setLineWidth(2)
    c.rect(x, y, w, h)
    draw_text(c, x + 30, y + h - 30, "ROOM SCHEDULE", 13, True)
    
    # Table
    sx, sy = x + 30, y + 60
    sw, sh = w - 60, h - 110
    c.setLineWidth(1.2)
    c.rect(sx, sy, sw, sh)
    c.line(sx, sy + sh - 30, sx + sw, sy + sh - 30)
    c.line(sx + 180, sy, sx + 180, sy + sh)
    c.line(sx + 300, sy, sx + 300, sy + sh)
    
    draw_text(c, sx + 10, sy + sh - 20, "ROOM", 10, True)
    draw_text(c, sx + 190, sy + sh - 20, "SIZE", 10, True)
    draw_text(c, sx + 310, sy + sh - 20, "NOTES", 10, True)
    
    rooms = [
        ("MASTER BEDROOM", "14'-0 x 18'-6", ""),
        ("MASTER BATH", "16'-0 x 18'-6", ""),
        ("BEDROOM 2", "14'-0 x 15'-0", ""),
        ("BEDROOM 3", "12'-0 x 15'-0", ""),
        ("KITCHEN", "18'-0 x 18'-6", ""),
        ("PANTRY", "12'-0 x 18'-6", ""),
        ("LIVING ROOM", "34'-0 x 15'-0", ""),
        ("DINING", "34'-0 x 12'-0", ""),
        ("LAUNDRY", "14'-0 x 12'-0", ""),
        ("MUD ROOM", "12'-0 x 12'-0", ""),
    ]
    
    yy = sy + sh - 50
    c.setLineWidth(0.4)
    for name, size, note in rooms:
        if yy < sy + 20:
            break
        c.line(sx, yy - 2, sx + sw, yy - 2)
        draw_text(c, sx + 10, yy, name, 9)
        draw_text(c, sx + 190, yy, size, 9)
        draw_text(c, sx + 310, yy, note, 9)
        yy -= 20
    
    title_block(c, "A-3", spec["project_name"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()
    
    spec = load_spec(args.input)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    
    c = canvas.Canvas(str(out), pagesize=letter)
    draw_t1(c, spec)
    c.showPage()
    draw_a1(c, spec)
    c.showPage()
    draw_a2(c, spec)
    c.showPage()
    draw_a3(c, spec)
    c.showPage()
    c.save()
    print(out)


if __name__ == "__main__":
    main()