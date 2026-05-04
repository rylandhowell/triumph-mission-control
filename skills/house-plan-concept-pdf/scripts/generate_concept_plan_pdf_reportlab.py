#!/usr/bin/env python3
import argparse, json
from pathlib import Path
from reportlab.pdfgen import canvas

# ARCH D landscape: 36 x 24 in
W, H = 2592, 1728
M = 48
TBW = 360  # right title block band


def txt(c, x, y, s, size=20, bold=False):
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, y, s)


def title_band(c, sheet, project, subtitle, date):
    x = W - M - TBW
    y = M
    w = TBW
    h = H - 2 * M
    c.setLineWidth(2)
    c.rect(x, y, w, h)

    # Section splits
    c.setLineWidth(1)
    c.line(x, y + 260, x + w, y + 260)
    c.line(x, y + 520, x + w, y + 520)
    c.line(x, y + 780, x + w, y + 780)

    txt(c, x + 18, y + h - 36, "TRIUMPH HOMES", 20, True)
    txt(c, x + 18, y + h - 62, "CONCEPT PLAN SET", 12, False)

    txt(c, x + 18, y + 740, "PROJECT", 11, True)
    txt(c, x + 18, y + 716, project, 11)
    txt(c, x + 18, y + 696, subtitle, 10)

    txt(c, x + 18, y + 480, "SHEET", 11, True)
    txt(c, x + 18, y + 450, sheet, 28, True)

    txt(c, x + 18, y + 220, "DATE", 11, True)
    txt(c, x + 18, y + 198, date, 11)

    txt(c, x + 18, y + 88, "CONCEPT ONLY - NOT FOR CONSTRUCTION", 9, True)


def plan_area():
    return M, M, W - TBW - 2 * M - 24, H - 2 * M


def draw_cover(c, s):
    px, py, pw, ph = plan_area()
    c.setLineWidth(2)
    c.rect(px, py, pw, ph)

    txt(c, px + 40, py + ph - 70, "RESIDENTIAL CONCEPT SET", 44, True)
    txt(c, px + 40, py + ph - 116, s["project_name"], 24, True)
    txt(c, px + 40, py + ph - 146, s.get("subtitle", "Mobile, Alabama"), 15)

    c.setLineWidth(1.5)
    c.rect(px + 40, py + ph - 520, pw - 80, 320)
    txt(c, px + 56, py + ph - 238, "PROJECT DATA", 14, True)

    rows = [
        f"Heated Area: {s.get('heated_sf', 1800)} SF",
        f"Footprint: {s.get('footprint', "64' x 40'")}",
        f"Parking: {s.get('parking', '2-car carport 22x24')}",
        f"Porch: {s.get('porch', "Rear 10' x 16' covered")}",
        f"Style/Roof: {s.get('style', 'Craftsman')} / {s.get('roof', 'Architectural shingles')}",
        f"HVAC: {s.get('hvac', '16+ SEER2 variable-speed')}",
    ]
    y = py + ph - 274
    for r in rows:
        txt(c, px + 60, y, r, 13)
        y -= 34

    c.rect(px + 40, py + 120, pw - 80, 300)
    txt(c, px + 56, py + 388, "SHEET INDEX", 14, True)
    for i, line in enumerate([
        "T-1  COVER + PROJECT DATA",
        "A-1  ARCHITECTURAL FLOOR PLAN",
        "A-2  EXTERIOR ELEVATIONS",
        "A-3  ROOM SCHEDULE + SPEC SUMMARY",
    ]):
        txt(c, px + 60, py + 350 - i * 42, line, 12)

    title_band(c, "T-1", s["project_name"], s.get("subtitle", ""), s.get("date", "2026-05-03"))


def draw_floor(c, s):
    px, py, pw, ph = plan_area()
    c.setLineWidth(2)
    c.rect(px, py, pw, ph)
    txt(c, px + 28, py + ph - 42, "ARCHITECTURAL FLOOR PLAN", 20, True)

    ox, oy, ow, oh = px + 90, py + 110, pw - 180, ph - 240

    # outer walls
    c.setLineWidth(5)
    c.rect(ox, oy, ow, oh)

    # porches
    c.setLineWidth(2)
    c.rect(ox + ow * 0.36, oy + oh, ow * 0.24, 44)
    txt(c, ox + ow * 0.41, oy + oh + 14, "FRONT PORCH", 10, True)
    c.rect(ox + ow * 0.33, oy - 44, ow * 0.28, 44)
    txt(c, ox + ow * 0.39, oy - 29, "REAR PORCH 10x16", 10, True)

    # rooms
    c.setLineWidth(2)
    for r in s.get("rooms", []):
        x = ox + r["x"] * ow
        y = oy + r["y"] * oh
        w = r["w"] * ow
        h = r["h"] * oh
        c.rect(x, y, w, h)
        txt(c, x + 8, y + h - 18, r["name"].upper(), 10, True)
        if r.get("dim"):
            txt(c, x + 8, y + 10, r["dim"], 9)

    # dimensions
    c.setLineWidth(1)
    c.line(ox, oy + oh + 70, ox + ow, oy + oh + 70)
    c.line(ox, oy + oh + 64, ox, oy + oh + 76)
    c.line(ox + ow, oy + oh + 64, ox + ow, oy + oh + 76)
    txt(c, ox + ow / 2 - 70, oy + oh + 82, s.get("footprint", "64' x 40'"), 10, True)

    c.line(ox - 70, oy, ox - 70, oy + oh)
    c.line(ox - 76, oy, ox - 64, oy)
    c.line(ox - 76, oy + oh, ox - 64, oy + oh)
    txt(c, ox - 62, oy + oh / 2, "40'-0\"", 10, True)

    txt(c, px + 28, py + 26, "NTS - CONCEPT ONLY. FINAL DIMENSIONS/ENGINEERING BY ARCHITECT & ENGINEER.", 9)
    title_band(c, "A-1", s["project_name"], s.get("subtitle", ""), s.get("date", "2026-05-03"))


def draw_elev(c, s):
    px, py, pw, ph = plan_area()
    c.setLineWidth(2)
    c.rect(px, py, pw, ph)
    txt(c, px + 28, py + ph - 42, "EXTERIOR ELEVATIONS", 20, True)

    # Front frame
    fx, fy, fw, fh = px + 80, py + ph / 2 + 20, pw - 160, ph / 2 - 110
    c.setLineWidth(1.8)
    c.rect(fx, fy, fw, fh)
    txt(c, fx + 8, fy + 8, "FRONT ELEVATION", 10, True)
    c.setLineWidth(3)
    c.line(fx + 30, fy + fh * 0.55, fx + fw * 0.36, fy + fh * 0.82)
    c.line(fx + fw * 0.36, fy + fh * 0.82, fx + fw * 0.62, fy + fh * 0.55)
    c.line(fx + fw * 0.62, fy + fh * 0.55, fx + fw - 30, fy + fh * 0.55)

    c.setLineWidth(1.5)
    c.rect(fx + fw * 0.43, fy + 24, 24, fh * 0.46)
    c.rect(fx + fw * 0.55, fy + 24, 24, fh * 0.46)
    c.rect(fx + fw * 0.49, fy + 24, 58, fh * 0.35)

    # Rear frame
    rx, ry, rw, rh = px + 80, py + 80, pw - 160, ph / 2 - 150
    c.setLineWidth(1.8)
    c.rect(rx, ry, rw, rh)
    txt(c, rx + 8, ry + 8, "REAR ELEVATION", 10, True)
    c.setLineWidth(3)
    c.line(rx + 30, ry + rh * 0.58, rx + rw * 0.50, ry + rh * 0.84)
    c.line(rx + rw * 0.50, ry + rh * 0.84, rx + rw - 30, ry + rh * 0.58)
    c.setLineWidth(1.5)
    c.rect(rx + rw * 0.38, ry + 24, rw * 0.24, rh * 0.34)

    title_band(c, "A-2", s["project_name"], s.get("subtitle", ""), s.get("date", "2026-05-03"))


def draw_schedule(c, s):
    px, py, pw, ph = plan_area()
    c.setLineWidth(2)
    c.rect(px, py, pw, ph)
    txt(c, px + 28, py + ph - 42, "ROOM SCHEDULE + SPEC SUMMARY", 20, True)

    tx, ty, tw, th = px + 60, py + 90, pw - 120, ph - 180
    c.setLineWidth(1.5)
    c.rect(tx, ty, tw, th)
    c.line(tx, ty + th - 40, tx + tw, ty + th - 40)
    c.line(tx + 340, ty, tx + 340, ty + th)
    c.line(tx + 540, ty, tx + 540, ty + th)
    txt(c, tx + 10, ty + th - 26, "ROOM", 11, True)
    txt(c, tx + 350, ty + th - 26, "SIZE", 11, True)
    txt(c, tx + 550, ty + th - 26, "NOTES", 11, True)

    y = ty + th - 66
    for r in s.get("rooms", []):
        c.line(tx, y - 12, tx + tw, y - 12)
        txt(c, tx + 10, y, r.get("name", ""), 10)
        txt(c, tx + 350, y, r.get("dim", "-"), 10)
        y -= 36
        if y < ty + 180:
            break

    txt(c, tx + 10, ty + 120, f"Heated SF: {s.get('heated_sf', 1800)}", 10)
    txt(c, tx + 10, ty + 98, f"Footprint: {s.get('footprint', "64' x 40'")}", 10)
    txt(c, tx + 10, ty + 76, f"Parking: {s.get('parking', '2-car carport 22x24')}", 10)
    txt(c, tx + 10, ty + 54, "Concept set only. Not permit-ready.", 10, True)

    title_band(c, "A-3", s["project_name"], s.get("subtitle", ""), s.get("date", "2026-05-03"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    a = ap.parse_args()
    s = json.loads(Path(a.input).read_text())

    out = Path(a.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(out), pagesize=(W, H))

    draw_cover(c, s); c.showPage()
    draw_floor(c, s); c.showPage()
    draw_elev(c, s); c.showPage()
    draw_schedule(c, s); c.showPage()
    c.save()
    print(out)


if __name__ == "__main__":
    main()
