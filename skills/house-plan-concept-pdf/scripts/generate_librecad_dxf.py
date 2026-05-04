#!/usr/bin/env python3
"""
Professional DXF Generator for LibreCAD/AutoCAD
Creates architectural-quality plan sets with proper layers, blocks, and dimensions
"""

import argparse
import json
import math
from pathlib import Path
import ezdxf
from ezdxf import units
from ezdxf.math import Vec2


def create_layer(doc, name, color, linetype="CONTINUOUS", lineweight=25):
    """Create standardized layer"""
    if name not in doc.layers:
        layer = doc.layers.add(name)
        layer.color = color
        layer.linetype = linetype
        layer.lineweight = lineweight
    return doc.layers.get(name)


def add_wall(msp, p1, p2, thickness=6.0, layer="A-WALL-FULL"):
    """Add double-line wall representation"""
    x1, y1 = p1
    x2, y2 = p2
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    if length == 0:
        return
    ux, uy = -dy/length, dx/length
    offset = thickness / 2
    
    # Two parallel lines
    msp.add_line((x1 + ux*offset, y1 + uy*offset), 
                 (x2 + ux*offset, y2 + uy*offset), dxfattribs={"layer": layer})
    msp.add_line((x1 - ux*offset, y1 - uy*offset), 
                 (x2 - ux*offset, y2 - uy*offset), dxfattribs={"layer": layer})


def add_door(msp, x, y, width, height, swing_right=True, rotation=0, layer="A-DOOR"):
    """Add architectural door symbol with swing arc"""
    # Door frame
    msp.add_line((x, y), (x + width, y), dxfattribs={"layer": layer})
    msp.add_line((x, y), (x, y + height), dxfattribs={"layer": layer})
    msp.add_line((x + width, y), (x + width, y + height), dxfattribs={"layer": layer})
    
    # Swing arc
    if swing_right:
        arc = msp.add_arc((x, y), radius=width, start_angle=0, end_angle=90, 
                         dxfattribs={"layer": layer})
    else:
        arc = msp.add_arc((x + width, y), radius=width, start_angle=90, end_angle=180,
                         dxfattribs={"layer": layer})


def add_window(msp, x, y, width, height, layer="A-WIND"):
    """Add window with glazing line"""
    msp.add_line((x, y), (x + width, y), dxfattribs={"layer": layer})
    msp.add_line((x, y + height), (x + width, y + height), dxfattribs={"layer": layer})
    msp.add_line((x, y), (x, y + height), dxfattribs={"layer": layer})
    msp.add_line((x + width, y), (x + width, y + height), dxfattribs={"layer": layer})
    # Glazing line
    msp.add_line((x, y + height/2), (x + width, y + height/2), 
                dxfattribs={"layer": layer})


def add_dimension_h(msp, p1, p2, offset, text, layer="A-DIMS"):
    """Add horizontal dimension"""
    x1, y1 = p1
    x2, y2 = p2
    y_dim = max(y1, y2) + offset
    
    # Extension lines
    msp.add_line((x1, y1), (x1, y_dim + 6), dxfattribs={"layer": layer})
    msp.add_line((x2, y2), (x2, y_dim + 6), dxfattribs={"layer": layer})
    
    # Dimension line
    msp.add_line((x1, y_dim), (x2, y_dim), dxfattribs={"layer": layer})
    
    # Tick marks
    msp.add_line((x1, y_dim - 2), (x1, y_dim + 2), dxfattribs={"layer": layer})
    msp.add_line((x2, y_dim - 2), (x2, y_dim + 2), dxfattribs={"layer": layer})
    
    # Text
    mid_x = (x1 + x2) / 2
    msp.add_text(text, height=12, dxfattribs={
        "layer": layer,
        "insert": (mid_x - len(text)*3, y_dim + 4),
        "style": "STANDARD"
    })


def add_dimension_v(msp, p1, p2, offset, text, layer="A-DIMS"):
    """Add vertical dimension"""
    x1, y1 = p1
    x2, y2 = p2
    x_min = min(x1, x2)
    x_dim = x_min - offset
    
    # Extension lines
    msp.add_line((x1, y1), (x_dim - 6, y1), dxfattribs={"layer": layer})
    msp.add_line((x2, y2), (x_dim - 6, y2), dxfattribs={"layer": layer})
    
    # Dimension line
    msp.add_line((x_dim, y1), (x_dim, y2), dxfattribs={"layer": layer})
    
    # Text (rotated)
    mid_y = (y1 + y2) / 2
    msp.add_text(text, height=12, rotation=90, dxfattribs={
        "layer": layer,
        "insert": (x_dim - 4, mid_y - len(text)*6),
        "style": "STANDARD"
    })


def add_room_label(msp, x, y, name, dims="", layer="A-ANNO-TEXT"):
    """Add room name and dimensions"""
    msp.add_text(name.upper(), height=18, dxfattribs={
        "layer": layer,
        "insert": (x, y),
        "style": "STANDARD",
        "thickness": 1
    })
    if dims:
        msp.add_text(dims, height=12, dxfattribs={
            "layer": layer,
            "insert": (x, y - 16),
            "style": "STANDARD"
        })


def add_grid_bubble(msp, x, y, label, layer="A-GRID"):
    """Add grid circle with letter/number"""
    msp.add_circle((x, y), radius=10, dxfattribs={"layer": layer})
    msp.add_text(label, height=11, dxfattribs={
        "layer": layer,
        "insert": (x - 4, y - 4),
        "style": "STANDARD"
    })


def create_floor_plan(doc, spec):
    """Generate floor plan layout"""
    msp = doc.modelspace()
    
    # Setup layers
    create_layer(doc, "A-WALL-FULL", 7, lineweight=35)  # Thick walls
    create_layer(doc, "A-WALL-PART", 8, lineweight=25)  # Partition walls  
    create_layer(doc, "A-DOOR", 2, lineweight=20)
    create_layer(doc, "A-WIND", 4, lineweight=20)
    create_layer(doc, "A-DIMS", 3, lineweight=13)
    create_layer(doc, "A-ANNO-TEXT", 1, lineweight=18)
    create_layer(doc, "A-GRID", 5, lineweight=13)
    
    # Plan origin (left-bottom of drawing area)
    ox, oy = 100, 100
    # Scale: 1 unit = 1 inch on paper (will be printed at 1/4" = 1')
    # So house dimensions in inches
    pw = 60 * 12  # 60 feet = 720 inches
    ph = 48 * 12  # 48 feet = 576 inches
    
    # Outer walls (double line)
    wall_thick = 6
    corners = [
        (ox, oy), (ox + pw, oy), 
        (ox + pw, oy + ph), (ox, oy + ph), (ox, oy)
    ]
    for i in range(len(corners)-1):
        add_wall(msp, corners[i], corners[i+1], wall_thick)
    
    # Grid lines
    grid_x = [ox, ox + pw*0.22, ox + pw*0.48, ox + pw*0.78, ox + pw]
    grid_y = [oy, oy + ph*0.25, oy + ph*0.55, oy + ph*0.80, oy + ph]
    
    for gx in grid_x[1:-1]:
        msp.add_line((gx, oy-20), (gx, oy+ph+20), dxfattribs={"layer": "A-GRID"})
    for gy in grid_y[1:-1]:
        msp.add_line((ox-20, gy), (ox+pw+20, gy), dxfattribs={"layer": "A-GRID"})
    
    # Grid bubbles
    labels_x = ["A", "B", "C", "D", "E"]
    labels_y = ["1", "2", "3", "4", "5"]
    for i, gx in enumerate(grid_x):
        add_grid_bubble(msp, gx, oy + ph + 35, labels_x[i])
        add_grid_bubble(msp, gx, oy - 35, labels_x[i])
    for i, gy in enumerate(grid_y):
        add_grid_bubble(msp, ox - 35, gy, labels_y[i])
        add_grid_bubble(msp, ox + pw + 35, gy, labels_y[i])
    
    # Room partitions
    # Vertical
    msp.add_line((ox + pw*0.22, oy), (ox + pw*0.22, oy + ph), dxfattribs={"layer": "A-WALL-PART"})
    msp.add_line((ox + pw*0.48, oy), (ox + pw*0.48, oy + ph), dxfattribs={"layer": "A-WALL-PART"})
    msp.add_line((ox + pw*0.78, oy), (ox + pw*0.78, oy + ph), dxfattribs={"layer": "A-WALL-PART"})
    
    # Horizontal  
    msp.add_line((ox, oy + ph*0.25), (ox + pw, oy + ph*0.25), dxfattribs={"layer": "A-WALL-PART"})
    msp.add_line((ox, oy + ph*0.55), (ox + pw, oy + ph*0.55), dxfattribs={"layer": "A-WALL-PART"})
    msp.add_line((ox, oy + ph*0.80), (ox + pw, oy + ph*0.80), dxfattribs={"layer": "A-WALL-PART"})
    
    # Room labels
    rooms_data = [
        (ox + pw*0.11, oy + ph*0.90, "MASTER", "14'-0 x 10'-6"),
        (ox + pw*0.35, oy + ph*0.90, "MASTER BATH", "16'-0 x 10'-6"),
        (ox + pw*0.63, oy + ph*0.90, "KITCHEN", "18'-0 x 10'-6"),
        (ox + pw*0.89, oy + ph*0.90, "PANTRY", "12'-0 x 10'-6"),
        (ox + pw*0.11, oy + ph*0.675, "BED 2", "14'-0 x 15'-0"),
        (ox + pw*0.50, oy + ph*0.675, "LIVING ROOM", "34'-0 x 15'-0"),
        (ox + pw*0.89, oy + ph*0.675, "BED 3", "12'-0 x 15'-0"),
        (ox + pw*0.11, oy + ph*0.40, "LAUNDRY", "14'-0 x 12'-0"),
        (ox + pw*0.50, oy + ph*0.40, "DINING", "34'-0 x 12'-0"),
        (ox + pw*0.89, oy + ph*0.40, "MUD", "12'-0 x 12'-0"),
    ]
    for rx, ry, name, dims in rooms_data:
        add_room_label(msp, rx-35, ry+10, name, dims)
    
    # Doors
    add_door(msp, ox + pw*0.22 - 28, oy + ph*0.55, 28, 28)
    add_door(msp, ox + pw*0.48 - 28, oy + ph*0.55, 28, 28)
    add_door(msp, ox + pw*0.48 - 28, oy + ph*0.80, 28, 28)
    
    # Windows
    add_window(msp, ox + 50, oy + ph - 6, 60, 6)
    add_window(msp, ox + pw*0.30, oy + ph - 6, 70, 6)
    add_window(msp, ox + pw*0.58, oy + ph - 6, 70, 6)
    
    # Dimensions horizontal
    add_dimension_h(msp, (ox, oy), (ox + pw*0.22, oy), 40, "14'-0")
    add_dimension_h(msp, (ox + pw*0.22, oy), (ox + pw*0.48, oy), 40, "18'-0")
    add_dimension_h(msp, (ox + pw*0.48, oy), (ox + pw*0.78, oy), 40, "16'-0")
    add_dimension_h(msp, (ox + pw*0.78, oy), (ox + pw, oy), 40, "12'-0")
    add_dimension_h(msp, (ox, oy), (ox + pw, oy), 65, "60'-0")
    
    # Dimensions vertical
    add_dimension_v(msp, (ox, oy), (ox, oy + ph*0.25), 50, "12'-0")
    add_dimension_v(msp, (ox, oy + ph*0.25), (ox, oy + ph*0.55), 50, "15'-0")
    add_dimension_v(msp, (ox, oy + ph*0.55), (ox, oy + ph*0.80), 50, "15'-0")
    add_dimension_v(msp, (ox, oy + ph*0.80), (ox, oy + ph), 50, "12'-0")
    add_dimension_v(msp, (ox, oy), (ox, oy + ph), 75, "54'-0")
    
    return doc


def create_elevations(doc):
    """Generate elevation views"""
    msp = doc.modelspace()
    
    create_layer(doc, "A-ELEV-OTLN", 7, lineweight=30)
    create_layer(doc, "A-ELEV-WIND", 4, lineweight=20)
    
    # Front elevation
    ex, ey = 100, 850
    ew, eh = 400, 200
    
    # Ground and roof
    msp.add_line((ex, ey), (ex + ew, ey), dxfattribs={"layer": "A-ELEV-OTLN"})
    msp.add_line((ex, ey + eh), (ex + ew, ey + eh), dxfattribs={"layer": "A-ELEV-OTLN"})
    # Roof pitch
    msp.add_line((ex + 30, ey + eh), (ex + ew/2, ey + eh + 40), dxfattribs={"layer": "A-ELEV-OTLN"})
    msp.add_line((ex + ew/2, ey + eh + 40), (ex + ew - 30, ey + eh), dxfattribs={"layer": "A-ELEV-OTLN"})
    
    # Sides
    msp.add_line((ex, ey), (ex, ey + eh), dxfattribs={"layer": "A-ELEV-OTLN"})
    msp.add_line((ex + ew, ey), (ex + ew, ey + eh), dxfattribs={"layer": "A-ELEV-OTLN"})
    
    # Windows
    msp.add_line((ex + 60, ey + 50), (ex + 100, ey + 50), dxfattribs={"layer": "A-ELEV-WIND"})
    msp.add_line((ex + 60, ey + 50), (ex + 60, ey + 100), dxfattribs={"layer": "A-ELEV-WIND"})
    msp.add_line((ex + 100, ey + 50), (ex + 100, ey + 100), dxfattribs={"layer": "A-ELEV-WIND"})
    msp.add_line((ex + 60, ey + 100), (ex + 100, ey + 100), dxfattribs={"layer": "A-ELEV-WIND"})
    
    msp.add_line((ex + ew - 140, ey + 50), (ex + ew - 100, ey + 50), dxfattribs={"layer": "A-ELEV-WIND"})
    msp.add_line((ex + ew - 140, ey + 50), (ex + ew - 140, ey + 100), dxfattribs={"layer": "A-ELEV-WIND"})
    msp.add_line((ex + ew - 100, ey + 50), (ex + ew - 100, ey + 100), dxfattribs={"layer": "A-ELEV-WIND"})
    msp.add_line((ex + ew - 140, ey + 100), (ex + ew - 100, ey + 100), dxfattribs={"layer": "A-ELEV-WIND"})
    
    # Door
    msp.add_line((ex + ew/2 - 20, ey), (ex + ew/2 + 20, ey), dxfattribs={"layer": "A-ELEV-OTLN"})
    msp.add_line((ex + ew/2 - 20, ey), (ex + ew/2 - 20, ey + 80), dxfattribs={"layer": "A-ELEV-OTLN"})
    msp.add_line((ex + ew/2 + 20, ey), (ex + ew/2 + 20, ey + 80), dxfattribs={"layer": "A-ELEV-OTLN"})
    
    # Add text labels
    msp.add_text("FRONT ELEVATION", height=20, dxfattribs={
        "insert": (ex + 10, ey - 30),
        "style": "STANDARD"
    })
    
    return doc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()
    
    spec = json.loads(Path(args.input).read_text())
    
    # Create new DXF document
    doc = ezdxf.new("R2018", setup=True)
    doc.units = 1  # 1 = inches in AutoCAD units
    
    # Add text style
    doc.styles.add("STANDARD", font="arial.ttf")
    
    # Create layout
    doc = create_floor_plan(doc, spec)
    doc = create_elevations(doc)
    
    # Save DXF
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    doc.saveas(str(out))
    print(out)


if __name__ == "__main__":
    main()