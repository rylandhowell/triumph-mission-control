# DocVision Skill

Reliable document and image text extraction for Mission Control and other use cases.

## Purpose

Extract structured data from photos, scanned documents, and screenshots with higher accuracy than basic OCR by using multiple strategies and validation.

## When to Use

- Reading handwritten or printed budget sheets
- Extracting tabular data (rows/columns of numbers)
- Processing construction estimates, invoices, receipts
- Any time standard OCR returns garbled or misaligned results

## Tools Provided

- `scripts/extract-document.py` — Multi-engine document OCR with table detection
- `scripts/align-grid.py` — Reconstruct table rows/columns from messy OCR
- `scripts/validate-numbers.py` — Cross-check extracted amounts against known totals

## Usage

```bash
# Extract from single image
python3 skills/docvision/scripts/extract-document.py path/to/photo.jpg

# Extract with validation (checks sum against expected total)
python3 skills/docvision/scripts/extract-document.py path/to/photo.jpg --validate-against 247599.43

# Process multiple angles and pick best result
python3 skills/docvision/scripts/extract-document.py path/to/photo.jpg --multi-angle
```

## Output Format

```json
{
  "items": [
    {"description": "Cabinets", "amount": 20955.00, "confidence": 0.98},
    {"description": "Permits", "amount": 750.00, "confidence": 0.95}
  ],
  "total_extracted": 247599.43,
  "validation_match": true,
  "method": "vision_framework"
}
```

## Integration with Mission Control

Extracted data can be piped directly into the budget tracker:

```bash
python3 skills/docvision/scripts/extract-document.py budget-photo.jpg | \
  node mission-control/scripts/import-budget.js
```

## Notes

- Requires macOS (uses Vision framework)
- Falls back to Tesseract on non-macOS systems
- Higher accuracy on printed text vs handwritten
- Multi-angle mode helps with rotated or skewed photos
