#!/usr/bin/env python3
"""
Analyze architectural PDF drawing style for replication
"""

import subprocess
import json
import os

def get_pdf_info():
    """Extract basic PDF metadata"""
    try:
        result = subprocess.run(['pdfinfo', 'tmp/jones-Final-1.pdf'], 
                              capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        return f"Error: {e}"

def extract_pages():
    """Convert first few pages to images for analysis"""
    os.makedirs('tmp/pdf_analysis', exist_ok=True)
    
    # Convert first 3 pages at lower resolution for analysis
    for page in range(1, 4):
        try:
            subprocess.run(['pdftoppm', '-png', '-r', '72', 
                          '-f', str(page), '-l', str(page),
                          'tmp/jones-Final-1.pdf', 
                          f'tmp/pdf_analysis/page_{page:02d}'], 
                         capture_output=True, text=True)
        except Exception as e:
            print(f"Error converting page {page}: {e}")

def analyze_text_structure():
    """Analyze text content for patterns"""
    try:
        result = subprocess.run(['pdftotext', 'tmp/jones-Final-1.pdf', '-'], 
                              capture_output=True, text=True)
        text = result.stdout
        
        # Look for common architectural terms
        patterns = {
            'scale_indicators': ['SCALE:', 'SCALE ', 'Scales:', 'Scale:'],
            'drawing_types': ['PLAN', 'ELEVATION', 'SECTION', 'DETAIL'],
            'sheet_info': ['SHEET', 'SHT', 'of'],
            'dimensions': ['FT', 'IN', 'feet', 'inches', '×', 'x'],
            'drawing_titles': ['RESIDENCE', 'HOME', 'HOUSE', 'BUILDING'],
            'revisions': ['REVISION', 'REV', 'ISSUE'],
            'dates': ['DATE', 'Date'],
            'project_info': ['PROJECT', 'CLIENT', 'OWNER', 'DRAWN BY', 'CHECKED BY']
        }
        
        mapper = {}
        for category, terms in patterns.items():
            matches = []
            for term in terms:
                if term.upper() in text.upper():
                    # Find context around matches
                    lines = text.split('\n')
                    for i, line in enumerate(lines):
                        if term.upper() in line.upper():
                            context = lines[max(0,i-2):i+3]
                            matches.append({
                                'term': term,
                                'line': line.strip(),
                                'context': [c.strip() for c in context]
                            })
            mapper[category] = matches
        
        return mapper
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    print("=== PDF Style Analysis ===\n")
    
    # Get basic info
    info = get_pdf_info()
    print("PDF INFO:")
    print(info)
    print("\n" + "="*50 + "\n")
    
    # Analyze text structure
    print("TEXT STRUCTURE ANALYSIS:")
    analysis = analyze_text_structure()
    for category, matches in analysis.items():
        if matches:
            print(f"{category.replace('_', ' ').title()}:")
            for match in matches[:3]:  # Limit to first 3
                print(f"  - {match['line']}")
            print()

    # Extract pages
    print("Extracting pages for visual analysis...")
    extract_pages()
    print("Pages extracted to tmp/pdf_analysis/")