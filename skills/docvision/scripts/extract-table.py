#!/usr/bin/env python3
"""
DocVision Table Extractor: Extracts two-column tables (items left, amounts right)
Optimized for budget sheets, estimates, and line-item documents
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path
import re


def vision_with_positions(image_path: str) -> list:
    """Extract text with precise bounding box coordinates."""
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

struct Word: Codable {
    let text: String
    let x: Double
    let y: Double
    let w: Double
    let h: Double
    let centerX: Double
    let centerY: Double
}

var words: [Word] = []
let req = VNRecognizeTextRequest { request, error in
    guard let results = request.results as? [VNRecognizedTextObservation] else { return }
    for obs in results {
        guard let cand = obs.topCandidates(1).first else { continue }
        let b = obs.boundingBox
        // Vision uses bottom-left origin, flip y
        let y = 1.0 - b.origin.y - b.size.height
        words.append(Word(
            text: cand.string,
            x: Double(b.origin.x),
            y: Double(y),
            w: Double(b.size.width),
            h: Double(b.size.height),
            centerX: Double(b.origin.x + b.size.width/2),
            centerY: Double(y + b.size.height/2)
        ))
    }
}
req.recognitionLevel = .accurate
let handler = VNImageRequestHandler(cgImage: cg)
try? handler.perform([req])

print(String(data: try! JSONEncoder().encode(words), encoding: .utf8)!)
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
        print(f"Error: {e}", file=sys.stderr)
        return []
    finally:
        Path(swift_path).unlink(missing_ok=True)


def find_columns(words: list) -> tuple:
    """Identify left (descriptions) and right (amounts) columns."""
    if not words:
        return [], []
    
    # Get x distribution
    xs = [w['centerX'] for w in words]
    min_x, max_x = min(xs), max(xs)
    
    # Find gap in x distribution (column separator)
    sorted_words = sorted(words, key=lambda w: w['centerX'])
    gap_threshold = 0.15  # 15% of page width
    
    best_gap = None
    for i in range(len(sorted_words) - 1):
        gap = sorted_words[i + 1]['centerX'] - sorted_words[i]['centerX']
        if gap > gap_threshold and (best_gap is None or gap > best_gap[0]):
            best_gap = (gap, (sorted_words[i]['centerX'] + sorted_words[i+1]['centerX']) / 2)
    
    if best_gap:
        split_x = best_gap[1]
        left_col = [w for w in words if w['centerX'] < split_x]
        right_col = [w for w in words if w['centerX'] >= split_x]
    else:
        # Default: split at 60% of width
        split_x = min_x + (max_x - min_x) * 0.6
        left_col = [w for w in words if w['centerX'] < split_x]
        right_col = [w for w in words if w['centerX'] >= split_x]
    
    return left_col, right_col


def cluster_by_row(items: list, threshold: float = 0.025) -> list:
    """Group items into rows by y-position."""
    if not items:
        return []
    
    sorted_items = sorted(items, key=lambda w: w['y'])
    rows = []
    current_row = [sorted_items[0]]
    
    for item in sorted_items[1:]:
        if abs(item['y'] - current_row[0]['y']) < threshold:
            current_row.append(item)
        else:
            rows.append(sorted(current_row, key=lambda w: w['x']))
            current_row = [item]
    
    if current_row:
        rows.append(sorted(current_row, key=lambda w: w['x']))
    
    return rows


def parse_amount(text: str) -> float:
    """Extract dollar amount from text."""
    # Match $X,XXX.XX or $XXXX.XX
    match = re.search(r'\$([\d,]+\.?\d*)', text.replace(',', ''))
    if match:
        try:
            return float(match.group(1).replace(',', ''))
        except ValueError:
            pass
    
    # Match N/A or variations
    if re.search(r'^(N/?A|n/?a|\-)$', text.strip()):
        return None
    
    return None


def is_amount(text: str) -> bool:
    """Check if text looks like a dollar amount."""
    return bool(re.search(r'^\$?[\d,]+\.?\d*$', text.strip())) or \
           text.strip().upper() in ('N/A', 'NA', '-')


def build_table(left_col: list, right_col: list) -> list:
    """Match left column descriptions to right column amounts by row."""
    left_rows = cluster_by_row(left_col)
    right_rows = cluster_by_row(right_col)
    
    results = []
    
    # Match rows by similar y position
    for l_row in left_rows:
        desc = ' '.join(w['text'] for w in l_row).strip()
        desc = re.sub(r'\s+', ' ', desc)
        
        # Find matching right row by closest y-center
        l_y = sum(w['centerY'] for w in l_row) / len(l_row)
        
        best_match = None
        best_diff = float('inf')
        
        for r_row in right_rows:
            r_y = sum(w['centerY'] for w in r_row) / len(r_row)
            diff = abs(r_y - l_y)
            if diff < best_diff:
                best_diff = diff
                best_match = r_row
        
        amount = None
        if best_match and best_diff < 0.05:  # Within 5% of page height
            amount_text = ' '.join(w['text'] for w in best_match).strip()
            amount = parse_amount(amount_text)
        
        # Filter out header/footer-ish items
        if len(desc) > 3 and not desc.lower().startswith('page'):
            results.append({
                'description': desc,
                'amount': amount,
                'amount_text': amount_text if best_match else None
            })
    
    return results


def main():
    parser = argparse.ArgumentParser(description='Extract two-column table from document')
    parser.add_argument('image', help='Path to image file')
    parser.add_argument('--validate', type=float, help='Expected total to validate against')
    parser.add_argument('--output', choices=['json', 'text', 'csv'], default='text')
    args = parser.parse_args()
    
    print(f"Processing {args.image}...", file=sys.stderr)
    words = vision_with_positions(args.image)
    
    if not words:
        print("Failed to extract text", file=sys.stderr)
        sys.exit(1)
    
    print(f"Found {len(words)} text elements", file=sys.stderr)
    
    left_col, right_col = find_columns(words)
    print(f"Left column: {len(left_col)}, Right column: {len(right_col)}", file=sys.stderr)
    
    table = build_table(left_col, right_col)
    
    total = sum(r['amount'] for r in table if r['amount'])
    
    result = {
        'rows': table,
        'total': round(total, 2),
        'row_count': len(table),
        'with_amounts': sum(1 for r in table if r['amount'])
    }
    
    if args.validate:
        result['expected'] = args.validate
        result['difference'] = round(abs(total - args.validate), 2)
        result['match'] = result['difference'] < 1.0
    
    if args.output == 'json':
        print(json.dumps(result, indent=2))
    elif args.output == 'csv':
        print("Description,Amount")
        for row in table:
            amt = f"${row['amount']:,.2f}" if row['amount'] else "N/A"
            desc = row['description'].replace('"', '""')
            print(f'"{desc}",{amt}')
    else:
        print(f"\n{'Description':<55} {'Amount':>15}")
        print("-" * 72)
        for row in table:
            desc = row['description'][:53]
            amt = f"${row['amount']:,.2f}" if row['amount'] else "N/A"
            print(f"{desc:<55} {amt:>15}")
        print("-" * 72)
        print(f"{'Total:':<55} ${total:,.2f}")
        
        if args.validate:
            status = "✓ MATCH" if result.get('match') else "✗ MISMATCH"
            print(f"\nExpected: ${args.validate:,.2f}")
            print(f"Status: {status} (diff: ${result['difference']:,.2f})")


if __name__ == '__main__':
    main()
