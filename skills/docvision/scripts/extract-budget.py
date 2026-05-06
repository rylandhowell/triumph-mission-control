#!/usr/bin/env python3
"""
DocVision Budget Extractor: Specialized for construction budget sheets
Extracts line items with amounts, validates against totals
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path
import re


def extract_words(image_path: str) -> list:
    """Extract all text with positions using Vision."""
    swift = '''
import Foundation
import Vision
import AppKit

let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("[]"); exit(0)
}

struct Word: Codable {
    let text: String
    let x: Double
    let y: Double
    let centerX: Double
    let centerY: Double
}

var words: [Word] = []
let req = VNRecognizeTextRequest { request, error in
    guard let results = request.results as? [VNRecognizedTextObservation] else { return }
    for obs in results {
        guard let cand = obs.topCandidates(1).first else { continue }
        let b = obs.boundingBox
        // Flip y coordinate (Vision uses bottom-left)
        let y = 1.0 - b.origin.y - b.size.height
        words.append(Word(
            text: cand.string,
            x: Double(b.origin.x),
            y: Double(y),
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
        f.write(swift)
        swift_path = f.name
    
    try:
        result = subprocess.run(['swift', swift_path, image_path],
                              capture_output=True, text=True, timeout=60)
        return json.loads(result.stdout) if result.returncode == 0 else []
    finally:
        Path(swift_path).unlink(missing_ok=True)


def find_amount_column(words: list) -> list:
    """Identify words in the right-side amount column."""
    # Find dollar amounts
    amount_words = []
    for w in words:
        text = w['text'].strip()
        if re.match(r'^\$?[\d,]+\.?\d*$', text) or text.upper() in ('N/A', 'NA'):
            amount_words.append(w)
    
    if not amount_words:
        return []
    
    # Amounts are usually in a narrow column on the right
    # Find the cluster of x positions for amounts
    xs = [w['centerX'] for w in amount_words]
    xs.sort()
    
    # Find dense cluster (amounts should be roughly aligned)
    if len(xs) >= 3:
        # Use median x as center of amount column
        median_x = xs[len(xs) // 2]
    else:
        median_x = sum(xs) / len(xs) if xs else 0.7
    
    # Identify amount column (within 15% of median)
    tolerance = 0.15
    amounts = [w for w in amount_words if abs(w['centerX'] - median_x) < tolerance]
    
    return sorted(amounts, key=lambda w: w['y'])


def find_description_column(words: list, amount_column: list) -> list:
    """Identify words in the left-side description column."""
    # Amount column center
    if amount_column:
        amount_center = sum(w['centerX'] for w in amount_column) / len(amount_column)
        # Descriptions are to the left of amount column
        desc_words = [w for w in words if w['centerX'] < amount_center - 0.1]
    else:
        # Default: left 60% of page
        desc_words = [w for w in words if w['centerX'] < 0.6]
    
    return sorted(desc_words, key=lambda w: w['y'])


def group_into_lines(words: list, y_threshold: float = 0.02) -> list:
    """Group words into lines based on y-position."""
    if not words:
        return []
    
    words = sorted(words, key=lambda w: w['y'])
    lines = []
    current_line = [words[0]]
    
    for w in words[1:]:
        if abs(w['y'] - current_line[0]['y']) < y_threshold:
            current_line.append(w)
        else:
            lines.append(sorted(current_line, key=lambda w: w['x']))
            current_line = [w]
    
    if current_line:
        lines.append(sorted(current_line, key=lambda w: w['x']))
    
    return lines


def parse_amount(text: str) -> float:
    """Parse dollar amount."""
    text = text.strip()
    if text.upper() in ('N/A', 'NA', '-'):
        return None
    
    match = re.search(r'\$?([\d,]+\.?\d*)', text.replace(',', ''))
    if match:
        try:
            return float(match.group(1).replace(',', ''))
        except ValueError:
            pass
    return None


def match_lines_to_amounts(desc_lines: list, amount_lines: list) -> list:
    """Match description lines to nearest amount lines by vertical position."""
    results = []
    
    for d_line in desc_lines:
        d_text = ' '.join(w['text'] for w in d_line).strip()
        d_text = re.sub(r'\s+', ' ', d_text)
        d_y = sum(w['centerY'] for w in d_line) / len(d_line)
        
        # Find closest amount line
        best_amount = None
        best_diff = float('inf')
        
        for a_line in amount_lines:
            a_text = ' '.join(w['text'] for w in a_line).strip()
            a_y = sum(w['centerY'] for w in a_line) / len(a_line)
            diff = abs(a_y - d_y)
            
            if diff < best_diff and diff < 0.04:  # Within 4% of page height
                best_diff = diff
                best_amount = a_text
        
        amount = parse_amount(best_amount) if best_amount else None
        
        # Skip header lines and junk
        if len(d_text) > 3 and not any(skip in d_text.lower() for skip in 
                                         ['cost estimate sheet', 'page', 'date']):
            results.append({
                'description': d_text,
                'amount': amount,
                'amount_text': best_amount
            })
    
    return results


def main():
    parser = argparse.ArgumentParser(description='Extract budget from image')
    parser.add_argument('image', help='Path to image')
    parser.add_argument('--total', type=float, help='Expected total for validation')
    args = parser.parse_args()
    
    print(f"Processing {args.image}...", file=sys.stderr)
    
    words = extract_words(args.image)
    print(f"Extracted {len(words)} words", file=sys.stderr)
    
    amount_column = find_amount_column(words)
    print(f"Found {len(amount_column)} amounts", file=sys.stderr)
    
    desc_column = find_description_column(words, amount_column)
    print(f"Found {len(desc_column)} description words", file=sys.stderr)
    
    amount_lines = group_into_lines(amount_column)
    desc_lines = group_into_lines(desc_column)
    
    print(f"Grouped into {len(amount_lines)} amount rows, {len(desc_lines)} desc rows", file=sys.stderr)
    
    table = match_lines_to_amounts(desc_lines, amount_lines)
    
    total = sum(r['amount'] for r in table if r['amount'])
    
    print()
    print(f"{'Line Item':<50} {'Amount':>12}")
    print("-" * 64)
    for row in table:
        desc = row['description'][:48]
        amt = f"${row['amount']:,.2f}" if row['amount'] else "N/A"
        print(f"{desc:<50} {amt:>12}")
    
    print("-" * 64)
    print(f"{'Total:':<50} ${total:,.2f}")
    
    if args.total:
        diff = abs(total - args.total)
        print(f"{'Expected:':<50} ${args.total:,.2f}")
        print(f"{'Status:':<50} {'✓ MATCH' if diff < 1 else '✗ MISMATCH'} (diff: ${diff:,.2f})")
    
    return 0 if not args.total else (0 if abs(total - args.total) < 1 else 1)


if __name__ == '__main__':
    sys.exit(main())
