#!/usr/bin/env python3
"""
Architectural concept plan generator - matches professional plan set style
Portrait letter format, right-side title band, detailed dimensions
"""
import argparse, json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

W, H = letter  # 612 x 792
MARGIN = 36
TITLE_W = 96  # Right side title band width


def draw_text(c, x, y, text, size=9, bold=False):
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, y, text)


def title_band(c, sheet, project, project_num="TDS-2026-001"):
    x = W - TITLE_W - MARGIN + 8
    y = H - MARGIN
    h = H - 2 * MARGIN
    
    c.setLineWidth(1.5)
    c.rect(W - TITLE_W - MARGIN, MARGIN, TITLE_W, h)
    
    # Company header
    draw_text(c, x, y - 24, "TRIUMPH", 11, True)
    draw_text(c, x, y - 38, "HOMES", 11, True)
    draw_text(c, x, y - 52, "CONCEPT", 9)
    draw_text(c, x, y - 64, "PLAN SET", 9)
    
    c.line(W - TITLE_W - MARGIN, H - MARGIN - 80, W - MARGIN, H - MARGIN - 80)
    
    # Sheet number (big)
    draw_text(c, x, y - 110, "SHEET", 9, True)
    draw_text(c, x + 8, y - 145, sheet, 28, True)
    
    c.line(W - TITLE_W - MARGIN, H - MARGIN - 160, W - MARGIN, H - MARGIN - 160)
    
    # Project info
    draw_text(c, x, y - 180, "PROJECT", 9, True)
    draw_text(c, x, y - 195, project[:20], 9)
    draw_text(c, x, y - 210, project_num, 9)
    
    c.line(W - TITLE_W - MARGIN, H - MARGIN - 240, W - MARGIN, H - MARGIN - 240)
    
    draw_text(c, x, y - 260, "DATE", 9, True)
    draw_text(c, x, y - 275, "05/03/26", 9)
    
    c.line(W - TITLE_W - MARGIN, H - MARGIN - 320, W - MARGIN, H - MARGIN - 320)
    
    draw_text(c, x, y - 345, "CONCEPT", 8, True)
    draw_text(c, x, y - 358, "ONLY - NOT", 8, True)
    draw_text(c, x, y - 371, "FOR CONST", 8, True)


def dim_line_h(c, x1, x2, y, label):
    c.setLineWidth(0.8)
    c.line(x1, y - 4, x1, y + 10)
    c.line(x2, y - 4, x2, y + 10)
    c.line(x1, y + 8, x2, y + 8)
    c.line(x1, y + 6, x1, y + 10)
    c.line(x2, y + 6, x2, y + 10)
    draw_text(c, (x1 + x2) / 2 - 15, y + 12, label, 8)


def dim_line_v(c, x, y1, y2, label):
    c.setLineWidth(0.8)
    c.line(x - 10, y1, x + 4, y1)
    c.line(x - 10, y2, x + 4, y2)
    c.line(x - 8, y1, x - 8, y2)
    c.saveState()
    c.translate(x - 16, (y1 + y2) / 2)
    c.rotate(90)
    draw_text(c, -15, -2, label, 8)
    c.restoreState()


def room(c, x, y, w, h, name, dims=""):
    c.setLineWidth(1.5)
    c.rect(x, y, w, h)
    draw_text(c, x + 4, y + h - 12, name.upper(), 9, True)
    if dims:
        draw_text(c, x + 4, y + 4, dims, 8)


def door_arc(c, x, y, w, h, swing_right=True):
    c.setLineWidth(1)
    c.line(x, y, x + w, y)
    c.line(x, y, x, y + h)
    c.line(x + w, y, x + w, y + h)
    r = min(w, h)
    if swing_right:
        c.arc(x, y, x + 2*r, y + 2*r, 180, -90)
    else:
        c.arc(x - r, y, x + r, y + 2*r, 0, 90)


def window(c, x, y, w, h):
    c.setLineWidth(1.5)
    c.rect(x, y, w, h)
    c.line(x + 4, y + h/2, x + w - 4, y + h/2)


def draw_t1(c, spec):
    x, y = MARGIN, MARGIN
    w = W - 2*MARGIN - TITLE_W
    h = H - 2*MARGIN
    
    c.setLineWidth(2)
    c.rect(x, y, w, h)
    
    # Sheet Index box
    c.setLineWidth(1)
    c.rect(x + 40, y + h - 200, w - 80, 120)
    draw_text(c, x + w/2 - 40, y + h - 60, "SHEET INDEX", 12, True)
    
    sheets = [
        "T-1   TITLE PAGE & FRONT ELEVATION",
        "A-1   FLOOR PLAN",
        "A-2   EXTERIOR ELEVATIONS", 
        "A-3   ROOM SCHEDULE",
    ]
    yy = y + h - 95
    for s in sheets:
        draw_text(c, x + 60, yy, s, 10)
        yy -= 18
    
    # Front elevation placeholder
    c.setLineWidth(1.5)
    c.rect(x + 60, y + 80, w - 120, 260)
    draw_text(c, x + w/2 - 60, y + 60, "FRONT ELEVATION", 10, True)
    
    title_band(c, "T-1", spec["project_name"])


def draw_a1(c, spec):
    x, y = MARGIN, MARGIN
    w = W - 2*MARGIN - TITLE_W
    h = H - 2*MARGIN
    
    c.setLineWidth(2)
    c.rect(x, y, w, h)
    
    draw_text(c, x + 30, y + h - 30, "FLOOR PLAN", 14, True)
    draw_text(c, x + w - 150, y + h - 30, 'SCALE: 1/4" = 1\'-0"', 9)
    
    # Plan geometry area
    px, py = x + 50, y + 80
    pw, ph = w - 100, h - 140
    
    # Outer walls (thick)
    c.setLineWidth(4)
    c.rect(px, py, pw, ph)
    
    # Vertical dimension lines
    dim_line_v(c, px - 25, py, py + ph * 0.25, "12'-0\"")
    dim_line_v(c, px - 25, py + ph * 0.25, py + ph * 0.55, "15'-0\"")
    dim_line_v(c, px - 25, py + ph * 0.55, py + ph * 0.80, "14'-0\"")
    dim_line_v(c, px - 25, py + ph * 0.80, py + ph, "10'-0\"")
    dim_line_v(c, px - 45, py, py + ph, "41'-0\"")
    
    # Horizontal dimension lines
    dim_line_h(c, px, px + pw * 0.22, py + ph + 20, "14'-0\"")
    dim_line_h(c, px + pw * 0.22, px + pw * 0.48, py + ph + 20, "18'-0\"")
    dim_line_h(c, px + pw * 0.48, px + pw * 0.78, py + ph + 20, "16'-0\"")
    dim_line_h(c, px + pw * 0.78, px + pw, py + ph + 20, "12'-0\"")
    dim_line_h(c, px, px + pw, py + ph + 40, "60'-0\"")
    
    # Rooms
    room(c, px, py + ph * 0.55, pw * 0.22, ph * 0.45, "MASTER BED", "14'-0 x 18'-6\"")
    room(c, px + pw * 0.22, py + ph * 0.55, pw * 0.26, ph * 0.45, "MASTER BATH", "16'-0 x 18'-6\"")
    room(c, px + pw * 0.48, py + ph * 0.55, pw * 0.30, ph * 0.45, "KITCHEN", "18'-0 x 18'-6\"")
    room(c, px + pw * 0.78, py + ph * 0.55, pw * 0.22, ph * 0.45, "PANTRY", "12'-0 x 18'-6\"")
    
    room(c, px, py + ph * 0.25, pw * 0.22, ph * 0.30, "BED 2", "14'-0 x 12'-0\"")
    room(c, px + pw * 0.22, py + ph * 0.25, pw * 0.56, ph * 0.30, "LIVING ROOM", "34'-0 x 12'-0\"")
    room(c, px + pw * 0.78, py + ph * 0.25, pw * 0.22, ph * 0.30, "BED 3", "12'-0 x 12'-0\"")
    
    room(c, px, py, pw * 0.22, ph * 0.25, "LAUNDRY", "14'-0 x 10'-0\"")
    room(c, px + pw * 0.22, py, pw * 0.56, ph * 0.25, "DINING", "34'-0 x 10'-0\"")
    room(c, px + pw * 0.78, py, pw * 0.22, ph * 0.25, "MUD", "12'-0 x 10'-0\"")
    
    # Doors
    door_arc(c, px + pw * 0.48, py + ph * 0.25, 30, 30)
    door_arc(c, px + pw * 0.22, py + ph * 0.25, 30, 30)
    
    # Windows
    window(c, px + 40, py + ph - 8, 60, 8)
    window(c, px + pw * 0.30, py + ph - 8, 80, 8)
    
    title_band(c, "A-1", spec["project_name"])


def draw_a2(c, spec):
    x, y = MARGIN, MARGIN
    w = W - 2*MARGIN - TITLE_W
    h = H - 2*MARGIN
    
    c.setLineWidth(2)
    c.rect(x, y, w, h)
    
    draw_text(c, x + 30, y + h - 30, "EXTERIOR ELEVATIONS", 14, True)
    
    # Front elevation
    ex, ey = x + 40, y + h - 280
    ew, eh = w - 80, 180
    c.setLineWidth(1.5)
    c.rect(ex, ey, ew, eh)
    draw_text(c, ex + 10, ey + 10, "FRONT ELEVATION", 9, True)
    
    # Roof line
    c.setLineWidth(2.5)
    c.line(ex + 30, ey + eh - 40, ex + ew/2, ey + eh - 10)
    c.line(ex + ew/2, ey + eh - 10, ex + ew - 30, ey + eh - 40)
    
    # Windows
    window(c, ex + 60, ey + 60, 40, 50)
    window(c, ex + 120, ey + 60, 40, 50)
    window(c, ex + ew - 160, ey + 60, 40, 50)
    window(c, ex + ew - 100, ey + 60, 40, 50)
    
    # Door
    door_arc(c, ex + ew/2 - 20, ey + 40, 40, 60)
    
    # Rear elevation
    rx, ry = x + 40, y + 60
    rw, rh = w - 80, 160
    c.rect(rx, ry, rw, rh)
    draw_text(c, rx + 10, ry + 10, "REAR ELEVATION", 9, True)
    
    c.setLineWidth(2.5)
    c.line(rx + 20, ry + rh - 30, rx + rw - 20, ry + rh - 30)
    
    title_band(c, "A-2", spec["project_name"])


def draw_a3(c, spec):
    x, y = MARGIN, MARGIN
    w = W - 2*MARGIN - TITLE_W
    h = H - 2*MARGIN
    
    c.setLineWidth(2)
    c.rect(x, y, w, h)
    
    draw_text(c, x + 30, y + h - 30, "ROOM SCHEDULE", 14, True)
    
    # Schedule table
    sx, sy = x + 40, y + 80
    sw, sh = w - 80, h - 140
    
    c.setLineWidth(1.5)
    c.rect(sx, sy, sw, sh)
    c.line(sx, sy + sh - 40, sx + sw, sy + sh - 40)
    c.line(sx + 200, sy, sx + 200, sy + sh)
    c.line(sx + 340, sy, sx + 340, sy + sh)
    
    draw_text(c, sx + 20, sy + sh - 25, "ROOM", 10, True)
    draw_text(c, sx + 210, sy + sh - 25, "SIZE", 10, True)
    draw_text(c, sx + 350, sy + sh - 25, "NOTES", 10, True)
    
    rooms = [
        ("MASTER BEDROOM", "14'-0 x 18'-6", ""),
        ("MASTER BATH", "16'-0 x 18'-6", ""),
        ("BEDROOM 2", "14'-0 x 12'-0", ""),
        ("BEDROOM 3", "12'-0 x 12'-0", ""),
        ("KITCHEN", "18'-0 x 18'-6", ""),
        ("PANTRY", "12'-0 x 18'-6", ""),
        ("LIVING ROOM", "34'-0 x 12'-0", ""),
        ("DINING", "34'-0 x 10'-0", ""),
        ("LAUNDRY", "14'-0 x 10'-0", ""),
        ("MUD", "12'-0 x 10'-0", ""),
    ]
    
    yy = sy + sh - 60
    c.setLineWidth(0.5)
    for name, size, note in rooms:
        if yy < sy + 20:
            break
        c.line(sx, yy - 5, sx + sw, yy - 5)
        draw_text(c, sx + 20, yy, name, 9)
        draw_text(c, sx + 210, yy, size, 9)
        draw_text(c, sx + 350, yy, note, 9)
        yy -= 22
    
    title_band(c, "A-3", spec["project_name"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    a = ap.parse_args()
    
    spec = json.loads(Path(a.input).read_text())
    out = Path(a.output)
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
