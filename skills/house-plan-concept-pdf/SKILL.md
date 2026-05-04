---
name: house-plan-concept-pdf
description: Create professional-looking concept floor-plan and elevation PDFs for residential homes using local Python-only vector generation (no external libraries). Use when the user asks for printable house plans/elevations, concept sheets, or cleaner drawing output from option selections and room schedules.
---

Build clean concept-plan PDFs with scaled room blocks, labeled dimensions, and simple front/rear elevation schematics.

## Required workflow

1. Collect missing inputs in one message if needed:
   - Heated SF target
   - Bed/bath count
   - Exterior style
   - Foundation + parking type
   - Porch requirements
   - Any fixed room sizes
2. Write a structured JSON spec file in `tmp/`.
3. Run `scripts/generate_concept_plan_pdf.py` with that JSON.
4. Verify output exists and is multi-page PDF.
5. Deliver PDF with a short disclaimer: concept only, not permit-ready.

## Commands

```bash
python3 skills/house-plan-concept-pdf/scripts/generate_concept_plan_pdf.py \
  --input tmp/plan-spec.json \
  --output tmp/plan-concept.pdf
```

## Output standard

- Page 1: Title block + floor plan with room labels and dimensions.
- Page 2: Front and rear concept elevations.
- Page 3 (optional): Room schedule and assumptions.
- Use consistent line weights and clean spacing.
- Include basic scale note and disclaimer.

## Quality gate

- Confirm all requested custom options are reflected.
- Confirm dimension strings are present on plan page.
- Confirm PDF opens and page count matches expectation.
- If geometry conflicts, call it out instead of faking precision.

## Notes

- Keep this positioned as concept/pre-construction documentation.
- Do not present as stamped or permit-ready drawings.
