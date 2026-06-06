(() => {
    const STORAGE_KEY = "mission-control-job-cost-v2";
    const budget = {
        "id": "mike-jones-house-budget",
        "jobName": "Mike Jones House",
        "sourceJobId": "job-205",
        "lineItems": {
            "Site/Precon": [
                {"name": "Termite spray", "budget": 776},
                {"name": "Permits", "budget": 750},
                {"name": "Stakeout survey", "budget": 800},
                {"name": "Grading / dirt work", "budget": 8500},
                {"name": "Dumpster", "budget": 1400},
                {"name": "Final clean", "budget": 750},
                {"name": "Land clearing / tree removal", "budget": 0},
                {"name": "Rough cleaning / power washing", "budget": 1600},
                {"name": "Portable toilet", "budget": 580},
                {"name": "Window protection", "budget": 2495},
                {"name": "Landscape allowance", "budget": 4500},
                {"name": "Driveway / sidewalks allowance", "budget": 5000},
                {"name": "Septic / sewage allowance", "budget": 6500},
                {"name": "Door locks / knobs / bath hardware", "budget": 1150},
                {"name": "Shower door", "budget": 1100},
                {"name": "Blower door test", "budget": 250}
            ],
            "Shell": [
                {"name": "Footings / foundation / slab", "budget": 11500},
                {"name": "Pump truck for concrete", "budget": 1630},
                {"name": "Framing materials", "budget": 27368.43},
                {"name": "Framing labor", "budget": 13800},
                {"name": "Windows & exterior doors", "budget": 5450},
                {"name": "Fireplace", "budget": 0},
                {"name": "Roofing", "budget": 12500}
            ],
            "MEP": [
                {"name": "HVAC", "budget": 8500},
                {"name": "Electrical labor", "budget": 7250},
                {"name": "Electrical fixtures", "budget": 6500},
                {"name": "Insulation", "budget": 4500},
                {"name": "Plumbing fixtures", "budget": 3000},
                {"name": "Plumbing labor", "budget": 9850}
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
                {"name": "Appliances allowance", "budget": 3500}
            ],
            "Exterior": [
                {"name": "Eaves / porch / Hardie / shutters", "budget": 1800},
                {"name": "Brick materials", "budget": 850},
                {"name": "Masonry sand", "budget": 3200},
                {"name": "Brick labor", "budget": 9000},
                {"name": "Garage doors", "budget": 0}
            ]
        },
        "totalBudget": 246149.43
    };
    
    let data = { jobs: [], actuals: [] };
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) data = JSON.parse(saved);
    } catch {}
    
    data.jobs = data.jobs.filter(j => j.id !== budget.id && j.jobName !== budget.jobName);
    data.jobs.push(budget);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    const total = Object.values(budget.lineItems).flat().reduce((s, i) => s + i.budget, 0);
    return JSON.stringify({
        status: "saved",
        job: budget.jobName,
        total: total.toFixed(2),
        items: Object.values(budget.lineItems).flat().length
    });
})();
