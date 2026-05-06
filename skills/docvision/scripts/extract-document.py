#!/usr/bin/env python3
"""
DocVision: Reliable document text extraction
Uses macOS Vision framework with fallback to Tesseract
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path


def vision_extract(image_path: str) -> list:
    """Extract text using macOS Vision framework with position data."""
    swift_code = '''
import Foundation
import Vision
import AppKit

let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("[]")
    exit(0)
}

struct Item: Codable {
    let text: String
    let x: Double
    let y: Double
    let w: Double
    let h: Double
}

var items: [Item] = []
let req = VNRecognizeTextRequest { request, error in
    guard let results = request.results as? [VNRecognizedTextObservation] else { return }
    for obs in results {
        guard let cand = obs.topCandidates(1).first else { continue }
        let b = obs.boundingBox
        items.append(Item(
            text: cand.string,
            x: Double(b.origin.x),
            y: Double(b.origin.y),
            w: Double(b.size.width),
            h: Double(b.size.height)
        ))
    }
}
req.recognitionLevel = .accurate
let handler = VNImageRequestHandler(cgImage: cg)
try? handler.perform([req])

let encoder = JSONEncoder()
let data = try! encoder.encode(items)
print(String(data: data, encoding: .utf8)!)
'''
    with tempfile.NamedTemporaryFile(mode='w', suffix='.swift', delete=False) as f:
        f.write(swift_code)
        swift_path = f.name
    
    try:
        result = subprocess.run(
            ['swift', swift_path, image_path],
            capture_output=True, text=True, timeout=60
        )
        return json.loads(result.stdout) if result.returncode == 0 else []
    except Exception as e:
        print(f"Vision error: {e}", file=sys.stderr)
        return []
    finally:
        Path(swift_path).unlink(missing_ok=True)


def tesseract_extract(image_path: str) -> str:
    """Fallback: Extract text using Tesseract."""
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / 'output'
        subprocess.run(
            ['tesseract', image_path, str(out), '--psm', '6'],
            capture_output=True, timeout=30
        )
        txt_file = out.with_suffix('.txt')
        return txt_file.read_text() if txt_file.exists() else ''


def align_table(items: list) -> list:
    """Align Vision results into table rows based on y-position clustering."""
    if not items:
        return []
    
    # Sort by y position (top to bottom)
    sorted_items = sorted(items, key=lambda x: -x['y'])
    
    # Group into rows by y-position similarity
    rows = []
    current_row = []
    prev_y = None
    y_threshold = 0.02  # 2% of image height
    
    for item in sorted_items:
        y = item['y']
        if prev_y is None or abs(y - prev_y) > y_threshold:
            if current_row:
                # Sort row by x position (left to right)
                rows.append(sorted(current_row, key=lambda x: x['x']))
            current_row = [item]
        else:
            current_row.append(item)
        prev_y = y
    
    if current_row:
        rows.append(sorted(current_row, key=lambda x: x['x']))
    
    return rows


def extract_amounts(rows: list) -> list:
    """Extract line items with amounts from table rows."""
    import re
    results = []
    
    for row in rows:
        # Join all text in row
        full_text = ' '.join(item['text'] for item in row)
        
        # Look for dollar amounts
        amounts = re.findall(r'\$[\d,]+\.?\d*', full_text)
        amount = None
        for a in amounts:
            try:
                amount = float(a.replace('$', '').replace(',', ''))
                break
            except ValueError:
                continue
        
        # Description is text without the amount, clean up
        desc = re.sub(r'\$[\d,]+\.?\d*', '', full_text).strip()
        desc = re.sub(r'\s+', ' ', desc)
        
        if desc and len(desc) > 2:
            results.append({
                'description': desc,
                'amount': amount,
                'raw': full_text
            })
    
    return results


def validate(items: list, expected_total: float = None) -> dict:
    """Validate extracted numbers match expected total."""
    total = sum(item['amount'] for item in items if item['amount'])
    
    result = {
        'items': items,
        'total_extracted': round(total, 2),
        'count': len(items),
        'with_amounts': sum(1 for i in items if i['amount'])
    }
    
    if expected_total:
        result['expected'] = expected_total
        result['difference'] = round(abs(total - expected_total), 2)
        result['valid'] = result['difference'] < 1.0
    
    return result


def main():
    parser = argparse.ArgumentParser(description='Extract structured data from documents')
    parser.add_argument('image', help='Path to image file')
    parser.add_argument('--validate-against', type=float, help='Expected total to validate')
    parser.add_argument('--output', choices=['json', 'txt'], default='json')
    args = parser.parse_args()
    
    # Extract with Vision
    items = vision_extract(args.image)
    
    if not items:
        print("Vision extraction failed, trying Tesseract fallback...", file=sys.stderr)
        text = tesseract_extract(args.image)
        print(text)
        return
    
    # Align into table
    rows = align_table(items)
    results = extract_amounts(rows)
    
    # Validate if expected total provided
    output = validate(results, args.validate_against)
    
    if args.output == 'json':
        print(json.dumps(output, indent=2))
    else:
        for item in output['items']:
            amt = f"${item['amount']:,.2f}" if item['amount'] else "N/A"
            print(f"{item['description']:<50} {amt}")
        print(f"\nTotal: ${output['total_extracted']:,.2f}")


if __name__ == '__main__':
    main()
