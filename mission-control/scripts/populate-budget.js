const STORAGE_KEY = 'mission-control-job-cost-v2';

const budget = {
  id: 'mike-jones-house-budget',
  jobName: 'Mike Jones House',
  sourceJobId: 'job-205',
  lineItems: {
    'Site/Precon': [
      { name: 'Termite spray', budget: 776 },
      { name: 'Permits', budget: 750 },
      { name: 'Stakeout survey', budget: 800 },
      { name: 'Grading / dirt work', budget: 8500 },
      { name: 'Dumpster', budget: 1400 },
      { name: 'Final clean', budget: 750 },
      { name: 'Rough cleaning / power washing', budget: 1600 },
      { name: 'Portable toilet', budget: 580 },
      { name: 'Window protection', budget: 2495 },
      { name: 'Landscape allowance', budget: 4500 },
      { name: 'Driveway / sidewalks allowance', budget: 5000 },
      { name: 'Septic / sewage allowance', budget: 6500 },
      { name: 'Door locks / knobs / bath hardware', budget: 1150 },
      { name: 'Shower door', budget: 1100 },
      { name: 'Blower door test', budget: 250 },
    ],
    Shell: [
      { name: 'Footings / foundation / slab', budget: 11500 },
      { name: 'Pump truck for concrete', budget: 1630 },
      { name: 'Framing materials', budget: 27368.43 },
      { name: 'Framing labor', budget: 13800 },
      { name: 'Windows & exterior doors', budget: 5450 },
      { name: 'Roofing', budget: 4950 },
    ],
    MEP: [
      { name: 'HVAC', budget: 12500 },
      { name: 'Electrical labor', budget: 8500 },
      { name: 'Electrical fixtures', budget: 3000 },
      { name: 'Insulation', budget: 7250 },
      { name: 'Plumbing fixtures', budget: 4800 },
      { name: 'Plumbing labor', budget: 9850 },
    ],
    Interior: [
      { name: 'Drywall hang & finish', budget: 4500 },
      { name: 'Drywall materials', budget: 2800 },
      { name: 'Interior doors & trim materials', budget: 5000 },
      { name: 'Trim labor', budget: 4000 },
      { name: 'Painting', budget: 13900 },
      { name: 'Cabinets', budget: 20955 },
      { name: 'Granite / quartz', budget: 4000 },
      { name: 'Floors / tile / backsplash', budget: 9000 },
      { name: 'Floors & showers labor', budget: 7500 },
      { name: 'Appliances allowance', budget: 6500 },
    ],
    Exterior: [
      { name: 'Eaves / porch / Hardie / shutters', budget: 16845 },
      { name: 'Brick materials', budget: 1800 },
      { name: 'Masonry sand', budget: 850 },
      { name: 'Brick labor', budget: 3200 },
      { name: 'Floors / tile showers / backsplash materials', budget: 9000 },
    ],
  },
  totalBudget: 247599.43,
  overheadFee: 12379.97,
  builderFee: 38996.91,
  grandTotal: 298976.31,
};

let data = { jobs: [], actuals: [] };
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) data = JSON.parse(saved);
} catch {}

data.jobs = data.jobs.filter(j => j.id !== budget.id && j.jobName !== budget.jobName);
data.jobs.push(budget);
localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const total = Object.values(budget.lineItems)
  .flat()
  .reduce((s, i) => s + i.budget, 0);

console.log('Saved Mike Jones House budget');
console.log('Line items:', Object.values(budget.lineItems).flat().length);
console.log('Total:', total.toFixed(2));
