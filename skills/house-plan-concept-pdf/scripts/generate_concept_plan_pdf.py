#!/usr/bin/env python3
import argparse, json
from pathlib import Path

W, H = 612, 792


def esc(s):
    return str(s).replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def txt(x, y, s, size=9):
    return f"BT /F1 {size} Tf {x:.1f} {y:.1f} Td ({esc(s)}) Tj ET"


def rect(x, y, w, h, lw=1):
    return f"{lw} w {x:.1f} {y:.1f} {w:.1f} {h:.1f} re S"


def line(x1, y1, x2, y2, lw=1):
    return f"{lw} w {x1:.1f} {y1:.1f} m {x2:.1f} {y2:.1f} l S"


def circle(cx, cy, r, lw=1):
    # Bezier approximation for full circle
    k = 0.5522847498 * r
    return "\n".join([
        f"{lw} w",
        f"{cx+r:.1f} {cy:.1f} m",
        f"{cx+r:.1f} {cy+k:.1f} {cx+k:.1f} {cy+r:.1f} {cx:.1f} {cy+r:.1f} c",
        f"{cx-k:.1f} {cy+r:.1f} {cx-r:.1f} {cy+k:.1f} {cx-r:.1f} {cy:.1f} c",
        f"{cx-r:.1f} {cy-k:.1f} {cx-k:.1f} {cy-r:.1f} {cx:.1f} {cy-r:.1f} c",
        f"{cx+k:.1f} {cy-r:.1f} {cx+r:.1f} {cy-k:.1f} {cx+r:.1f} {cy:.1f} c S",
    ])


def dim_h(x1, x2, y, label):
    return [line(x1, y, x2, y, 0.8), line(x1, y-3, x1, y+3, 0.8), line(x2, y-3, x2, y+3, 0.8), txt((x1+x2)/2-24, y+5, label, 8)]


def dim_v(y1, y2, x, label):
    return [line(x, y1, x, y2, 0.8), line(x-3, y1, x+3, y1, 0.8), line(x-3, y2, x+3, y2, 0.8), txt(x+5, (y1+y2)/2, label, 8)]


def grid_bubble(x, y, tag):
    return [circle(x, y, 9, 1), txt(x-2.8, y-3, tag, 8)]


def title_block(spec, sheet):
    o = [rect(36, 24, 540, 62, 1.2), line(420, 24, 420, 86, 1), line(500, 24, 500, 86, 1), line(36, 54, 576, 54, 1)]
    o += [txt(42, 66, 'TRIUMPH HOMES - CONCEPT PLAN SET', 10), txt(42, 44, spec.get('project_name', 'Project'), 9)]
    o += [txt(425, 66, 'SHEET', 8), txt(425, 44, sheet, 12), txt(505, 66, 'DATE', 8), txt(505, 44, spec.get('date', '2026-05-03'), 9)]
    return o


def room_label(r):
    if r.get('dim'):
        return r['name'], r['dim']
    return r['name'], ''


def page_cover(spec):
    o = [txt(40, 760, 'RESIDENTIAL CONCEPT PLAN SET', 20)]
    o += [txt(40, 736, spec.get('project_name', 'PROJECT'), 14)]
    o += [txt(40, 718, spec.get('subtitle', 'Mobile, Alabama'), 10)]

    o += [rect(40, 560, 532, 130, 1.5)]
    o += [txt(52, 668, 'PROJECT DATA', 10)]
    lines = [
        f"Heated Area: {spec.get('heated_sf', 1800)} SF",
        f"Footprint: {spec.get('footprint', "64' x 40'")}",
        f"Parking: {spec.get('parking', '2-car carport 22x24')}",
        f"Porch: {spec.get('porch', "Rear 10' x 16' covered")}",
        f"Style: {spec.get('style', 'Craftsman')}",
        f"Roof: {spec.get('roof', 'Architectural shingles')}",
        f"HVAC: {spec.get('hvac', '16+ SEER2 variable-speed')}",
    ]
    y = 648
    for ln in lines:
        o += [txt(56, y, ln, 9)]
        y -= 14

    o += [rect(40, 360, 532, 180, 1.2), txt(52, 520, 'SHEET INDEX', 10)]
    idx = [
        'T-1  COVER + PROJECT DATA',
        'A-1  ARCHITECTURAL FLOOR PLAN',
        'A-2  EXTERIOR ELEVATIONS',
        'A-3  ROOM SCHEDULE + SPEC SUMMARY',
    ]
    y = 500
    for i in idx:
        o += [txt(56, y, i, 9)]
        y -= 16

    o += [txt(40, 330, 'THIS DOCUMENT IS A CONCEPT SET FOR PRICING / DESIGN DIRECTION ONLY.', 8)]
    o += [txt(40, 318, 'NOT FOR CONSTRUCTION. NOT FOR PERMIT. FINAL DRAWINGS REQUIRE ARCH/ENGINEERING REVIEW.', 8)]

    o += title_block(spec, 'T-1')
    return '\n'.join(o)


def page1(spec):
    o = [txt(40, 760, 'ARCHITECTURAL FLOOR PLAN', 16), txt(40, 744, 'Concept Layout - Not for Permit/Construction', 9)]

    px, py, pw, ph = 60, 170, 492, 535

    # Main wall outline (thicker)
    o += [rect(px, py, pw, ph, 2.2)]

    # Grid references
    for x, tag in [(px, 'A'), (px + pw * 0.33, 'B'), (px + pw * 0.66, 'C'), (px + pw, 'D')]:
        o += [line(x, py-14, x, py+ph+14, 0.35)]
        o += grid_bubble(x, py+ph+24, tag)
        o += grid_bubble(x, py-24, tag)
    for y, tag in [(py, '1'), (py + ph * 0.33, '2'), (py + ph * 0.66, '3'), (py + ph, '4')]:
        o += [line(px-14, y, px+pw+14, y, 0.35)]
        o += grid_bubble(px-24, y, tag)
        o += grid_bubble(px+pw+24, y, tag)

    # Porch zones
    o += [rect(px+180, py+ph, 132, 22, 1), txt(px+198, py+ph+6, 'FRONT PORCH', 8)]
    o += [rect(px+160, py-22, 170, 22, 1), txt(px+194, py-15, 'REAR PORCH 10x16', 8)]

    # Draw rooms
    room_boxes = []
    for i, r in enumerate(spec.get('rooms', []), start=1):
        x = px + r['x'] * pw
        y = py + r['y'] * ph
        w = r['w'] * pw
        h = r['h'] * ph
        room_boxes.append((x, y, w, h, i, r))
        o += [rect(x, y, w, h, 0.9), txt(x+4, y+h-12, room_label(r)[0], 8)]
        if room_label(r)[1]:
            o += [txt(x+4, y+6, room_label(r)[1], 8)]

    # Door swings (schematic)
    o += [line(px+246, py+ph, px+246, py+ph-20, 1.2), line(px+246, py+ph-20, px+270, py+ph-20, 0.8)]  # front door leaf
    o += [line(px+250, py, px+250, py+20, 1.2), line(px+250, py+20, px+276, py+20, 0.8)]            # rear door leaf

    # Window tags
    win_tags = [('W1', px+86, py+ph), ('W2', px+410, py+ph), ('W3', px+80, py), ('W4', px+420, py)]
    for tag, x, y in win_tags:
        o += [txt(x, y+10 if y > py else y-12, tag, 7)]

    # Dimensions and callouts
    o += dim_h(px, px+pw, py+ph+34, spec.get('footprint', "64' x 40'"))
    o += dim_v(py, py+ph, px-30, "40'-0\"")
    o += [line(px+pw, py+385, px+pw+48, py+430, 0.8), txt(px+pw+52, py+434, '2-CAR CARPORT', 8), txt(px+pw+52, py+422, spec.get('parking', "22' x 24'"), 8)]

    o += [txt(60, 136, f"Style: {spec.get('style', 'Craftsman')} | Roof: {spec.get('roof', 'Arch Shingle')} | HVAC: {spec.get('hvac', '16+ SEER2 Variable')}", 8)]
    o += [txt(60, 124, 'Foundation: Raised slab recommended 8-12 in above grade for Gulf Coast drainage resilience.', 8)]
    o += [txt(60, 112, 'Scale: Diagrammatic (NTS). Verify all final dimensions with construction drawings.', 8)]

    o += title_block(spec, 'A-1')
    return '\n'.join(o)


def page2(spec):
    o = [txt(40, 760, 'EXTERIOR ELEVATIONS', 16), txt(40, 744, 'Craftsman Concept - Front and Rear', 9)]

    # FRONT elevation
    fx, fy, fw, fh = 60, 428, 492, 250
    o += [rect(fx, fy, fw, fh, 1.5), txt(fx+8, fy+8, 'FRONT ELEVATION', 9)]
    o += [line(fx+22, fy+168, fx+168, fy+220, 2), line(fx+168, fy+220, fx+310, fy+168, 2), line(fx+310, fy+168, fx+470, fy+168, 2)]
    o += [line(fx+192, fy+158, fx+245, fy+192, 1.2), line(fx+245, fy+192, fx+298, fy+158, 1.2)]
    o += [rect(fx+206, fy+28, 16, 118, 1), rect(fx+286, fy+28, 16, 118, 1), rect(fx+234, fy+28, 38, 92, 1)]
    for x in [fx+42, fx+92, fx+388, fx+438]:
        o += [rect(x, fy+62, 34, 34, 1)]
    o += [txt(fx+366, fy+40, 'Siding + shaker gable accents', 8)]

    # REAR elevation
    rx, ry, rw, rh = 60, 136, 492, 250
    o += [rect(rx, ry, rw, rh, 1.5), txt(rx+8, ry+8, 'REAR ELEVATION', 9)]
    o += [line(rx+30, ry+168, rx+246, ry+222, 2), line(rx+246, ry+222, rx+462, ry+168, 2)]
    o += [rect(rx+170, ry+30, 160, 75, 1), txt(rx+184, ry+38, 'COVERED PORCH', 8), rect(rx+226, ry+104, 40, 90, 1)]
    for x in [rx+60, rx+108, rx+392, rx+440]:
        o += [rect(x, ry+84, 32, 32, 1)]

    o += [txt(60, 112, 'Concept cues: tapered columns, low-slope intersecting gables, balanced opening pattern.', 8)]
    o += [txt(60, 100, 'Not engineered. Final facade proportions and structure by architect/engineer.', 8)]
    o += title_block(spec, 'A-2')
    return '\n'.join(o)


def page3(spec):
    o = [txt(40, 760, 'ROOM SCHEDULE + SPEC SUMMARY', 16), rect(40, 110, 532, 620, 1.2)]
    o += [line(40, 700, 572, 700, 1), txt(48, 708, 'Room', 9), txt(282, 708, 'Size', 9), txt(374, 708, 'Notes', 9)]

    y = 678
    for r in spec.get('rooms', []):
        if y < 150:
            break
        o += [line(40, y-8, 572, y-8, 0.4), txt(48, y, r.get('name', ''), 9), txt(282, y, r.get('dim', '-'), 9), txt(374, y, r.get('note', ''), 8)]
        y -= 24

    notes = [
        f"Heated SF target: {spec.get('heated_sf', 1800)}",
        f"Footprint target: {spec.get('footprint', "64' x 40'")}",
        f"Parking: {spec.get('parking', '2-car carport 22x24')}",
        f"Porch: {spec.get('porch', "10' x 16' rear covered")}",
        'Primary bath: custom shower. Hall bath: tub/shower unit.',
        'Windows: standard energy package + shutters.',
        'Design intent: pricing + layout direction only; not permit-ready documents.'
    ]
    o += [txt(48, 274, 'Assumptions', 10)]
    yy = 254
    for n in notes:
        o += [txt(56, yy, n, 8)]
        yy -= 14

    o += title_block(spec, 'A-3')
    return '\n'.join(o)


def write_pdf(streams, out):
    objs = []
    def add(s):
        objs.append(s)
        return len(objs)

    font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    content = [add(f"<< /Length {len(s.encode())} >>\nstream\n{s}\nendstream") for s in streams]
    pages = [add(f"<< /Type /Page /Parent 0 0 R /MediaBox [0 0 {W} {H}] /Resources << /Font << /F1 {font} 0 R >> >> /Contents {cid} 0 R >>") for cid in content]
    pages_obj = add(f"<< /Type /Pages /Kids [{' '.join(f'{p} 0 R' for p in pages)}] /Count {len(pages)} >>")
    for p in pages:
        objs[p-1] = objs[p-1].replace('/Parent 0 0 R', f'/Parent {pages_obj} 0 R')
    root = add(f"<< /Type /Catalog /Pages {pages_obj} 0 R >>")

    b = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    offs = [0]
    for i, o in enumerate(objs, 1):
        offs.append(len(b))
        b.extend(f'{i} 0 obj\n{o}\nendobj\n'.encode())
    x = len(b)
    b.extend(f'xref\n0 {len(objs)+1}\n'.encode())
    b.extend(b'0000000000 65535 f \n')
    for i in range(1, len(objs)+1):
        b.extend(f'{offs[i]:010d} 00000 n \n'.encode())
    b.extend(f'trailer\n<< /Size {len(objs)+1} /Root {root} 0 R >>\nstartxref\n{x}\n%%EOF\n'.encode())
    out.write_bytes(b)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--output', required=True)
    args = ap.parse_args()
    spec = json.loads(Path(args.input).read_text())
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    write_pdf([page_cover(spec), page1(spec), page2(spec), page3(spec)], out)
    print(out)


if __name__ == '__main__':
    main()
