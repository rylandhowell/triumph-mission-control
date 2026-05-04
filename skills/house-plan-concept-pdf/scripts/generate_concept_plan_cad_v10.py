#!/usr/bin/env python3
"""
Architectural-quality concept plan generator (v10)
Targets professional CAD-like output with proper symbols, lineweights, and detailing.
"""
import argparse, json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black

# ARCH D landscape
W, H = 2592, 1728
MARGIN = 60


def setup_canvas(path):
    c = canvas.Canvas(path, pagesize=(W, H))
    c.setTitle("Concept Plan Set")
    return c


def draw_text(c, x, y, text, size=18, bold=False):
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, y, text)


def title_block_vertical(c, sheet, project, date):
    bw, bh, bx, by = 280, H - 2 * MARGIN, W - MARGIN - 280, MARGIN
    c.setLineWidth(2)
    c.rect(bx, by, bw, bh)
    c.line(bx, by + 180, bx + bw, by + 180)
    c.line(bx, by + 360, bx + bw, by + 360)
    
    draw_text(c, bx + 18, by + bh - 36, "TRIUMPH HOMES", 22, True)
    draw_text(c, bx + 18, by + bh - 64, "CONCEPT PLAN", 12)
    
    draw_text(c, bx + 18, by + 320, "SHEET", 12, True)
    draw_text(c, bx + 18, by + 280, sheet, 40, True)
    
    draw_text(c, bx + 18, by + 220, "PROJECT", 12, True)
    draw_text(c, bx + 18, by + 195, project[:25], 11)
    
    draw_text(c, bx + 18, by + 140, "DATE", 12, True)
    draw_text(c, bx + 18, by + 115, date, 11)
    
    draw_text(c, bx + 18, by + 60, "NOT FOR CONSTRUCTION", 10, True)


def wall_double(c, x, y, w, h, thick=6):
    c.setLineWidth(thick)
    c.rect(x, y, w, h)


def door_swing(c, x, y, width, height, swing="R"):
    c.setLineWidth(2)
    c.line(x, y, x + width, y)
    c.line(x, y, x, y + height)
    c.line(x + width, y, x + width, y + height)
    r = width
    if swing == "R":
        c.arc(x, y, x + 2 * r, y + 2 * r, 180, -90)
    else:
        c.arc(x - r, y, x + r, y + 2 * r, 0, 90)


def window_symbol(c, x, y, w, h, thick=3):
    c.setLineWidth(thick)
    c.rect(x, y, w, h)
    c.line(x, y + h / 2, x + w, y + h / 2)


def dimension_chain_h(c, x1, x2, y, label):
    c.setLineWidth(1.2)
    c.line(x1, y, x2, y)
    c.line(x1, y - 4, x1, y + 4)
    c.line(x2, y - 4, x2, y + 4)
    draw_text(c, (x1 + x2) / 2 - 40, y + 8, label, 12, True)


def dimension_chain_v(c, x, y1, y2, label):
    c.setLineWidth(1.2)
    c.line(x, y1, x, y2)
    c.line(x - 4, y1, x + 4, y1)
    c.line(x - 4, y2, x + 4, y2)
    draw_text(c, x + 10, (y1 + y2) / 2, label, 12, True)


def draw_cover(c, spec):
    px, py, pw, ph = MARGIN, MARGIN, W - MARGIN * 2 - 300, H - MARGIN * 2
    c.setLineWidth(3)
    c.rect(px, py, pw, ph)
    
    draw_text(c, px + 50, py + ph - 100, "CONCEPT PLAN SET", 54, True)
    draw_text(c, px + 50, py + ph - 170, spec["project_name"], 28, True)
    draw_text(c, px + 50, py + ph - 210, spec.get("subtitle", "Mobile, Alabama"), 16)
    
    c.setLineWidth(2)
    c.rect(px + 50, py + 150, pw - 100, 320)
    draw_text(c, px + 70, py + 435, "PROJECT DATA", 16, True)
    
    data = [
        f"Heated Area: {spec.get('heated_sf', 1800)} SF",
        f"Footprint: {spec.get('footprint', '64 x 40')}",
        f"Style: {spec.get('style', 'Craftsman')} / {spec.get('roof', 'Arch shingles')}",
        f"HVAC: {spec.get('hvac', '16+ SEER2 variable')}",
    ]
    y = py + 390
    for line in data:
        draw_text(c, px + 70, y, line, 14)
        y -= 36
    
    title_block_vertical(c, "T-1", spec["project_name"], spec.get("date", "2026-05-03"))


def draw_floor_plan(c, spec):
    px, py, pw, ph = MARGIN, MARGIN, W - MARGIN * 2 - 300, H - MARGIN * 2
    c.setLineWidth(3)
    c.rect(px, py, pw, ph)
    
    draw_text(c, px + 40, py + ph - 50, "FLOOR PLAN", 32, True)
    
    ox, oy, ow, oh = px + 100, py + 120, pw - 200, ph - 280
    wall_double(c, ox, oy, ow, oh, 8)
    
    rooms = spec.get("rooms", [])
    for r in rooms:
        x, y = ox + r["x"] * ow, oy + r["y"] * oh
        w, h = r["w"] * ow, r["h"] * oh
        c.setLineWidth(2)
        c.rect(x, y, w, h)
        draw_text(c, x + 12, y + h - 24, r["name"].upper(), 13, True)
        if r.get("dim"):
            draw_text(c, x + 12, y + 14, r["dim"], 11)
    
    dimension_chain_h(c, ox, ox + ow, oy + oh + 60, spec.get("footprint", "64' x 40'"))
    dimension_chain_v(c, ox - 60, oy, oy + oh, "40'-0\"")
    
    title_block_vertical(c, "A-1", spec["project_name"], spec.get("date", "2026-05-03"))


def draw_elevations(c, spec):
    px, py, pw, ph = MARGIN, MARGIN, W - MARGIN * 2 - 300, H - MARGIN * 2
    c.setLineWidth(3)
    c.rect(px, py, pw, ph)
    
    draw_text(c, px + 40, py + ph - 50, "ELEVATIONS", 32, True)
    
    fw, fh = (pw - 120) / 2, ph - 220
    fx, fy = px + 60, py + ph - 100 - fh
    
    c.setLineWidth(2)
    c.rect(fx, fy, fw, fh)
    draw_text(c, fx + 12, fy + 12, "FRONT", 12, True)
    wall_double(c, fx + 40, fy + 40, fw - 80, fh - 80, 6)
    window_symbol(c, fx + fw * 0.3, fy + fh * 0.4, 60, 70)
    door_swing(c, fx + fw * 0.6, fy + 40, 60, 70, "R")
    
    rx = fx + fw + 60
    c.rect(rx, fy, fw, fh)
    draw_text(c, rx + 12, fy + 12, "REAR", 12, True)
    wall_double(c, rx + 40, fy + 40, fw - 80, fh - 80, 6)
    window_symbol(c, rx + fw * 0.25, fy + fh * 0.45, 50, 60)
    window_symbol(c, rx + fw * 0.65, fy + fh * 0.45, 50, 60)
    
    title_block_vertical(c, "A-2", spec["project_name"], spec.get("date", "2026-05-03"))


def draw_schedule(c, spec):
    px, py, pw, ph = MARGIN, MARGIN, W - MARGIN * 2 - 300, H - MARGIN * 2
    c.setLineWidth(3)
    c.rect(px, py, pw, ph)
    
    draw_text(c, px + 40, py + ph - 50, "ROOM SCHEDULE", 32, True)
    
    c.setLineWidth(2)
    c.rect(px + 60, py + 80, pw - 120, ph - 180)
    c.line(px + 60, py + ph - 130, px + pw - 60, py + ph - 130)
    c.line(px + 360, py + 80, px + 360, py + ph - 130)
    c.line(px + 560, py + 80, px + 560, py + ph - 130)
    
    draw_text(c, px + 80, py + ph - 115, "ROOM", 13, True)
    draw_text(c, px + 380, py + ph - 115, "SIZE", 13, True)
    draw_text(c, px + 580, py + ph - 115, "NOTES", 13, True)
    
    y = py + ph - 160
    c.setLineWidth(0.8)
    for r in spec.get("rooms", []):
        c.line(px + 60, y - 8, px + pw - 60, y - 8)
        draw_text(c, px + 80, y, r.get("name", ""), 12)
        draw_text(c, px + 380, y, r.get("dim", "-"), 12)
        y -= 36
        if y < py + 150:
            break
    
    title_block_vertical(c, "A-3", spec["project_name"], spec.get("date", "2026-05-03"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    a = ap.parse_args()
    
    spec = json.loads(Path(a.input).read_text())
    out = Path(a.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    
    c = setup_canvas(str(out))
    draw_cover(c, spec)
    c.showPage()
    draw_floor_plan(c, spec)
    c.showPage()
    draw_elevations(c, spec)
    c.showPage()
    draw_schedule(c, spec)
    c.showPage()
    c.save()
    
    print(out)


if __name__ == "__main__":
    main()
