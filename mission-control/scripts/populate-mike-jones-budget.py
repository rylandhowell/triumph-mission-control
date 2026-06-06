#!/usr/bin/env python3
"""
Populate Mike Jones budget with corrected amounts from extracted budget sheet
"""
import json
import subprocess

def run_js(js_code):
    """Run JavaScript in Safari's Mission Control tab."""
    script = f'''tell application "Safari"
        set targetTab to missing value
        repeat with w in windows
            repeat with t in tabs of w
                if (URL of t contains "triumph-mission-control.vercel.app") then
                    set targetTab to t
                    set current tab of w to t
                    set index of w to 1
                    exit repeat
                end if
            end repeat
            if targetTab is not missing value then exit repeat
        end repeat
        if targetTab is missing value then
            set targetTab to (make new document with properties {{URL:"https://triumph-mission-control.vercel.app"}})
            delay 2
        end if
        return do JavaScript {json.dumps(js_code)} in targetTab
    end tell'''
    return subprocess.check_output(['osascript', '-e', script], text=True).strip()


# Mike Jones budget data - corrected from DocVision extraction + manual fixes
mike_jones_budget = {
    "id": "mike-jones-house",
    "jobName": "Mike Jones House",
    "sourceJobId": "job-205",
    "lineItems": {
        "Site/Precon": [
            {"name": "Termite spray", "budget": 776},
            {"name": "Permits", "budget": 750},
            {"name": "Stakeout survey", "budget": 800},  # Fixed: was 8500
            {"name": "Grading / dirt work", "budget": 8500},
            {"name": "Dumpster", "budget": 1400},
            {"name": "Final clean", "budget": 750},
            {"name": "Land clearing / tree removal", "budget": 0},  # N/A
            {"name": "Rough cleaning / power washing", "budget": 1600},
            {"name": "Portable toilet", "budget": 580},
            {"name": "Window protection", "budget": 2495},
            {"name": "Landscape allowance", "budget": 4500},
            {"name": "Driveway / sidewalks allowance", "budget": 5000},
            {"name": "Septic / sewage allowance", "budget": 6500},
            {"name": "Door locks / knobs / bath hardware", "budget": 1150},
            {"name": "Shower door", "budget": 1100},
            {"name": "Blower door test", "budget": 250},
        ],
        "Shell": [
            {"name": "Footings / foundation / slab", "budget": 11500},  # Fixed: was 1630
            {"name": "Pump truck for concrete", "budget": 1630},  # This is likely the correct assignment
            {"name": "Framing materials", "budget": 27368.43},  # Fixed: was 13800
            {"name": "Framing labor", "budget": 13800},  # Fixed: was 4950
            {"name": "Windows & exterior doors", "budget": 5450},
            {"name": "Fireplace", "budget": 0},  # N/A
            {"name": "Roofing", "budget": 12500},
        ],
        "MEP": [
            {"name": "HVAC", "budget": 8500},
            {"name": "Electrical labor", "budget": 7250},
            {"name": "Electrical fixtures", "budget": 6500},
            {"name": "Insulation", "budget": 4500},
            {"name": "Plumbing fixtures", "budget": 3000},
            {"name": "Plumbing labor", "budget": 9850},  # This assignment
        ],
        "Interior": [
            {"name": "Drywall hang & finish", "budget": 2800},
            {"name": "Drywall materials", "budget": 5000},
            {"name": "Interior doors & trim materials", "budget": 4000},
            {"name": "Trim labor", "budget": 13900},
            {"name": "Painting", "budget": 16845},
            {"name": "Cabinets", "budget": 20955},
            {"name": "Granite / quartz", "budget": 4000},
            {"name": "Floors / tile / backsplash", "budget": 7500},
            {"name": "Floors & showers labor", "budget": 4800},
            {"name": "Appliances allowance", "budget": 3500},  # Estimated
        ],
        "Exterior": [
            {"name": "Eaves / porch / Hardie / shutters", "budget": 1800},
            {"name": "Brick materials", "budget": 850},
            {"name": "Masonry sand", "budget": 3200},
            {"name": "Brick labor", "budget": 9000},
            {"name": "Garage doors", "budget": 0},  # N/A
        ],
    },
    "totalBudget": 247599.43
}

# Calculate total from line items
total = sum(
    item["budget"] 
    for cat in mike_jones_budget["lineItems"].values() 
    for item in cat
)
mike_jones_budget["totalBudget"] = round(total, 2)

print(f"Total budget calculated: ${mike_jones_budget['totalBudget']:,.2f}")

# Build JavaScript to inject into Mission Control
js = f"""
(() => {{
    const STORAGE_KEY = "missio…t-v2";
    const budget = {json.dumps(mike_jones_budget)};
    
    // Load existing jobs
    let data = {{ jobs: [], actuals: [] }};
    try {{
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) data = JSON.parse(saved);
    }} catch {{}}
    
    // Remove existing Mike Jones if present
    data.jobs = data.jobs.filter(j => j.id !== budget.id && j.jobName !== budget.jobName);
    
    // Add updated budget
    data.jobs.push(budget);
    
    // Save
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    return JSON.stringify({{
        status: "saved",
        job: budget.jobName,
        total: budget.totalBudget,
        categories: Object.keys(budget.lineItems).map(cat => ({{
            category: cat,
            items: budget.lineItems[cat].length,
            subtotal: budget.lineItems[cat].reduce((s, i) => s + i.budget, 0)
        }}))
    }});
}})();
"""

result = run_js(js)
print(result)
print("\nMike Jones budget populated successfully!")
