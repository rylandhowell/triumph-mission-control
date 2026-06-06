export type Task = {
  id: string;
  title: string;
  owner: string;
  due: string;
  status: "Done" | "In progress" | "Queued" | "At risk";
};

export type Job = {
  id: string;
  name: string;
  slug: string;
  location: string;
  client: string;
  stage: string;
  progress: number;
  status: string;
  next: string;
  color: string;
  budget: string;
  tasks: Task[];
};

export type ScheduleItem = {
  id: string;
  house: string;
  time: string;
  title: string;
  type: string;
  tone: string;
  day: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
  category: string;
};

export const buildChecklist: ChecklistItem[] = [
  { id: "c1", text: "Install job box and sign", completed: false, category: "Pre-construction" },
  { id: "c2", text: "Get permit", completed: false, category: "Pre-construction" },
  { id: "c3", text: "Construction entrance gravel/silt fence if needed", completed: false, category: "Pre-construction" },
  { id: "c4", text: "Stake out survey/verify perk test", completed: false, category: "Pre-construction" },
  { id: "c5", text: "Install temp pole", completed: false, category: "Pre-construction" },
  { id: "c6", text: "Get water meter installed and get power hooked up to temp pole (ask customer to call)", completed: false, category: "Pre-construction" },
  { id: "c7", text: "Porta potty & dumpster", completed: false, category: "Pre-construction" },
  { id: "c8", text: "Get dirt work done", completed: false, category: "Foundation" },
  { id: "c9", text: "Get form package delivered", completed: false, category: "Foundation" },
  { id: "c10", text: "Get dumpster", completed: false, category: "Foundation" },
  { id: "c11", text: "Dig footers and form", completed: false, category: "Foundation" },
  { id: "c12", text: "Get dirt plumbing", completed: false, category: "Foundation" },
  { id: "c13", text: "Pack foundation", completed: false, category: "Foundation" },
  { id: "c14", text: "Wrap/rebar/wire foundation", completed: false, category: "Foundation" },
  { id: "c15", text: "Electrical floorplugs & Ground rod", completed: false, category: "Foundation" },
  { id: "c16", text: "GET INSPECTION", completed: false, category: "Foundation" },
  { id: "c17", text: "Line pump truck and concrete up (let Abel know)", completed: false, category: "Foundation" },
  { id: "c18", text: "Pour slab", completed: false, category: "Foundation" },
  { id: "c19", text: "Order framing package", completed: false, category: "Framing" },
  { id: "c20", text: "Make sure windows are ordered", completed: false, category: "Framing" },
  { id: "c21", text: "Start framing", completed: false, category: "Framing" },
  { id: "c22", text: "ORDER FIREPLACE", completed: false, category: "Framing" },
  { id: "c23", text: "Check on framing/figure out where to put AC walkway", completed: false, category: "Framing" },
  { id: "c24", text: "See where we are putting the water heater", completed: false, category: "Framing" },
  { id: "c25", text: "Strapping inspection", completed: false, category: "Framing" },
  { id: "c26", text: "Sheathing/nail pattern inspection", completed: false, category: "Framing" },
  { id: "c27", text: "Install fireplace", completed: false, category: "Framing" },
  { id: "c28", text: "Order metal roof for after fortified inspection", completed: false, category: "Roofing" },
  { id: "c29", text: "Take roof deck tape pics / ice and water shield pictures", completed: false, category: "Roofing" },
  { id: "c30", text: "Take button cap pictures", completed: false, category: "Roofing" },
  { id: "c31", text: "Install windows and doors", completed: false, category: "Exterior" },
  { id: "c32", text: "Termite spray", completed: false, category: "Exterior" },
  { id: "c33", text: "Install window protection", completed: false, category: "Exterior" },
  { id: "c34", text: "Fortified framing/roof inspection", completed: false, category: "Roofing" },
  { id: "c35", text: "Shingle roof or metal", completed: false, category: "Roofing" },
  { id: "c36", text: "Install temp locks", completed: false, category: "Exterior" },
  { id: "c37", text: "Plumbing top out", completed: false, category: "Rough-in" },
  { id: "c38", text: "AC rough in", completed: false, category: "Rough-in" },
  { id: "c39", text: "Electrical rough in", completed: false, category: "Rough-in" },
  { id: "c40", text: "Make sure all rough ins passed", completed: false, category: "Rough-in" },
  { id: "c41", text: "Order brick/sand", completed: false, category: "Exterior" },
  { id: "c42", text: "Schedule insulation", completed: false, category: "Insulation" },
  { id: "c43", text: "Framing inspection", completed: false, category: "Framing" },
  { id: "c45", text: "Order trim", completed: false, category: "Interior" },
  { id: "c46", text: "Order Sheetrock", completed: false, category: "Interior" },
  { id: "c47", text: "Insulate house", completed: false, category: "Insulation" },
  { id: "c48", text: "Brick house", completed: false, category: "Exterior" },
  { id: "c49", text: "Vinyl siding/hardy", completed: false, category: "Exterior" },
  { id: "c50", text: "Vinyl eves", completed: false, category: "Exterior" },
  { id: "c51", text: "Rough grade/clean up", completed: false, category: "Site" },
  { id: "c52", text: "Pre Sheetrock inspection", completed: false, category: "Inspections" },
  { id: "c53", text: "Sheetrock house (hang and finish)", completed: false, category: "Interior" },
  { id: "c54", text: "Measure for cabinets", completed: false, category: "Interior" },
  { id: "c55", text: "Trim house", completed: false, category: "Interior" },
  { id: "c56", text: "Paint ceilings and trim", completed: false, category: "Interior" },
  { id: "c57", text: "Install garage doors", completed: false, category: "Exterior" },
  { id: "c58", text: "Line up granite to be templated", completed: false, category: "Interior" },
  { id: "c59", text: "Install cabinets", completed: false, category: "Interior" },
  { id: "c60", text: "Install AC units", completed: false, category: "Mechanical" },
  { id: "c61", text: "Electrical trim out", completed: false, category: "Electrical" },
  { id: "c62", text: "Get power turned on", completed: false, category: "Electrical" },
  { id: "c63", text: "Install permanent exterior doors", completed: false, category: "Exterior" },
  { id: "c64", text: "Install exterior door knobs", completed: false, category: "Exterior" },
  { id: "c65", text: "Start up AC units", completed: false, category: "Mechanical" },
  { id: "c66", text: "Tile showers", completed: false, category: "Interior" },
  { id: "c67", text: "Blower door inspection", completed: false, category: "Inspections" },
  { id: "c68", text: "Install granite", completed: false, category: "Interior" },
  { id: "c69", text: "Pour Driveway", completed: false, category: "Site" },
  { id: "c70", text: "Grade for landscaping", completed: false, category: "Site" },
  { id: "c71", text: "Install flooring", completed: false, category: "Interior" },
  { id: "c72", text: "Plumbing trim out", completed: false, category: "Plumbing" },
  { id: "c73", text: "Make sure Final plumbing, electrical, and mechanical passes", completed: false, category: "Inspections" },
  { id: "c74", text: "Landscaping", completed: false, category: "Site" },
  { id: "c75", text: "Install shoemould and finish trim/knobs & closet rods", completed: false, category: "Interior" },
  { id: "c76", text: "Final paint", completed: false, category: "Interior" },
  { id: "c77", text: "Blower door test", completed: false, category: "Inspections" },
  { id: "c78", text: "Line up final clean", completed: false, category: "Finish" },
  { id: "c79", text: "Energy efficiency test inspection", completed: false, category: "Inspections" },
  { id: "c80", text: "Final inspection/CO", completed: false, category: "Inspections" },
  { id: "c81", text: "Fortified inspection", completed: false, category: "Inspections" },
];

export const navItems = [
  { label: "Overview", href: "/" },
  { label: "Calendar", href: "/calendar" },
  { label: "Estimator", href: "/estimator" },
  { label: "Quotes", href: "/quotes" },
  { label: "Job Cost", href: "/job-cost" },
  { label: "Foreman Chat", href: "/foreman-chat" },
  { label: "Subs", href: "/subs" },
  { label: "Files", href: "/files" },
  { label: "Settings", href: "/settings" },
  { label: "Leads Insights", href: "/insights" },
];

export type QuoteLineItem = {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  notes?: string;
};

export type Quote = {
  id: string;
  jobId: string;
  jobName: string;
  clientName: string;
  quoteDate: string;
  expirationDate: string;
  status: "Draft" | "Sent" | "Approved" | "Declined";
  lineItems: QuoteLineItem[];
  subtotal: number;
  overhead: number;
  fee: number;
  total: number;
  notes: string;
};

export const quotes: Quote[] = [
  {
    id: "quote-001",
    jobId: "job-201",
    jobName: "Brenton House",
    clientName: "Brenton",
    quoteDate: "2026-05-01",
    expirationDate: "2026-06-01",
    status: "Draft",
    subtotal: 247599.43,
    overhead: 12379.97,
    fee: 38996.91,
    total: 298976.31,
    notes: "Cost estimate based on current material pricing. Subject to change.",
    lineItems: [
      { id: "li-001", category: "Site Work", description: "Permits", quantity: 1, unit: "ls", unitCost: 0, total: 0, notes: "" },
      { id: "li-002", category: "Site Work", description: "Stakeout/Survey", quantity: 1, unit: "ls", unitCost: 750, total: 750 },
      { id: "li-003", category: "Site Work", description: "Grading/Tractor Work/Dirt", quantity: 1, unit: "ls", unitCost: 4000, total: 4000 },
      { id: "li-004", category: "Foundation", description: "Footings, Foundation, Slab Poured", quantity: 1, unit: "ls", unitCost: 20955, total: 20955 },
      { id: "li-005", category: "Foundation", description: "Pump Truck for Concrete", quantity: 1, unit: "ls", unitCost: 1750, total: 1750 },
      { id: "li-006", category: "Plumbing", description: "Plumbing Labor", quantity: 1, unit: "ls", unitCost: 800, total: 800 },
      { id: "li-007", category: "Framing", description: "Framing Materials", quantity: 1, unit: "ls", unitCost: 13800, total: 13800 },
      { id: "li-008", category: "Framing", description: "Framing Labor", quantity: 1, unit: "ls", unitCost: 18000, total: 18000 },
      { id: "li-009", category: "Roofing", description: "Roofing", quantity: 1, unit: "ls", unitCost: 9000, total: 9000 },
      { id: "li-010", category: "HVAC", description: "HVAC Labor", quantity: 1, unit: "ls", unitCost: 3200, total: 3200 },
      { id: "li-011", category: "Electrical", description: "Electrical Labor", quantity: 1, unit: "ls", unitCost: 7500, total: 7500 },
      { id: "li-012", category: "Insulation", description: "Insulation", quantity: 1, unit: "ls", unitCost: 4800, total: 4800 },
      { id: "li-013", category: "Drywall", description: "Drywall Hang and Finish", quantity: 1, unit: "ls", unitCost: 3000, total: 3000 },
      { id: "li-014", category: "Drywall", description: "Drywall Materials", quantity: 1, unit: "ls", unitCost: 6500, total: 6500 },
      { id: "li-015", category: "Interior", description: "Interior Doors and Trim Materials", quantity: 1, unit: "ls", unitCost: 1800, total: 1800 },
      { id: "li-016", category: "Interior", description: "Trim Labor", quantity: 1, unit: "ls", unitCost: 850, total: 850 },
      { id: "li-017", category: "Interior", description: "Paint", quantity: 1, unit: "ls", unitCost: 9000, total: 9000 },
      { id: "li-018", category: "Masonry", description: "Block Materials", quantity: 1, unit: "ls", unitCost: 3200, total: 3200 },
      { id: "li-019", category: "Masonry", description: "Masonry and Brick Labor", quantity: 1, unit: "ls", unitCost: 7500, total: 7500 },
      { id: "li-020", category: "Flooring", description: "Floors and Showers Labor", quantity: 1, unit: "ls", unitCost: 6500, total: 6500 },
      { id: "li-021", category: "Fixtures", description: "Appliances", quantity: 1, unit: "ls", unitCost: 580, total: 580 },
      { id: "li-022", category: "Site Work", description: "Final Clean", quantity: 1, unit: "ls", unitCost: 1400, total: 1400 },
      { id: "li-023", category: "Site Work", description: "Portable Toilet", quantity: 1, unit: "ls", unitCost: 2495, total: 2495 },
      { id: "li-024", category: "Site Work", description: "Dumpster", quantity: 1, unit: "ls", unitCost: 6500, total: 6500 },
      { id: "li-025", category: "Site Work", description: "Window Protection", quantity: 1, unit: "ls", unitCost: 5000, total: 5000 },
      { id: "li-026", category: "Exterior", description: "Landscape Allowance", quantity: 1, unit: "ls", unitCost: 2500, total: 2500 },
      { id: "li-027", category: "Site Work", description: "Driveway and Sidewalks", quantity: 1, unit: "ls", unitCost: 750, total: 750 },
      { id: "li-028", category: "Site Work", description: "Septic/Sewer", quantity: 1, unit: "ls", unitCost: 580, total: 580 },
      { id: "li-029", category: "Hardware", description: "Door Locks/Knobs/Bath Hardware", quantity: 1, unit: "ls", unitCost: 1400, total: 1400 },
      { id: "li-030", category: "Hardware", description: "Shower Door", quantity: 1, unit: "ls", unitCost: 2495, total: 2495 },
      { id: "li-031", category: "Protection", description: "Termite Bond", quantity: 1, unit: "ls", unitCost: 6500, total: 6500 },
      { id: "li-032", category: "Testing", description: "Blower Door Test", quantity: 1, unit: "ls", unitCost: 250, total: 250 },
    ],
  },
  {
    id: "quote-002",
    jobId: "job-202",
    jobName: "Dempsey House",
    clientName: "Dempsey",
    quoteDate: "2026-04-15",
    expirationDate: "2026-05-15",
    status: "Sent",
    subtotal: 285000,
    overhead: 14250,
    fee: 45000,
    total: 344250,
    notes: "Gulf Shores location premium. Hurricane-rated windows included.",
    lineItems: [
      { id: "li-101", category: "Site Work", description: "Permits and Fees", quantity: 1, unit: "ls", unitCost: 2500, total: 2500 },
      { id: "li-102", category: "Site Work", description: "Site Survey and Stakeout", quantity: 1, unit: "ls", unitCost: 1200, total: 1200 },
      { id: "li-103", category: "Site Work", description: "Land Clearing and Grading", quantity: 1, unit: "ls", unitCost: 6500, total: 6500 },
      { id: "li-104", category: "Foundation", description: "Foundation and Slab", quantity: 1, unit: "ls", unitCost: 24000, total: 24000 },
      { id: "li-105", category: "Framing", description: "Framing Package", quantity: 1, unit: "ls", unitCost: 38000, total: 38000 },
      { id: "li-106", category: "Exterior", description: "Hurricane Windows and Doors", quantity: 1, unit: "ls", unitCost: 28000, total: 28000 },
      { id: "li-107", category: "Roofing", description: "Metal Roof System", quantity: 1, unit: "ls", unitCost: 18000, total: 18000 },
      { id: "li-108", category: "Masonry", description: "Brick and Stone Exterior", quantity: 1, unit: "ls", unitCost: 22000, total: 22000 },
      { id: "li-109", category: "HVAC", description: "HVAC System", quantity: 1, unit: "ls", unitCost: 12000, total: 12000 },
      { id: "li-110", category: "Electrical", description: "Electrical Complete", quantity: 1, unit: "ls", unitCost: 18500, total: 18500 },
      { id: "li-111", category: "Plumbing", description: "Plumbing Complete", quantity: 1, unit: "ls", unitCost: 14500, total: 14500 },
      { id: "li-112", category: "Interior", description: "Drywall and Paint", quantity: 1, unit: "ls", unitCost: 16000, total: 16000 },
      { id: "li-113", category: "Interior", description: "Flooring", quantity: 1, unit: "ls", unitCost: 22000, total: 22000 },
      { id: "li-114", category: "Interior", description: "Kitchen and Bath", quantity: 1, unit: "ls", unitCost: 35000, total: 35000 },
    ],
  },
  {
    id: "quote-003",
    jobId: "job-203",
    jobName: "Hogue House",
    clientName: "Hogue",
    quoteDate: "2026-05-05",
    expirationDate: "2026-06-05",
    status: "Draft",
    subtotal: 310000,
    overhead: 15500,
    fee: 48000,
    total: 373500,
    notes: "Fairhope custom build with upgraded finishes.",
    lineItems: [
      { id: "li-201", category: "Site Work", description: "Site Prep and Utilities", quantity: 1, unit: "ls", unitCost: 8500, total: 8500 },
      { id: "li-202", category: "Foundation", description: "Foundation with Stem Walls", quantity: 1, unit: "ls", unitCost: 26500, total: 26500 },
      { id: "li-203", category: "Framing", description: "Framing and Sheathing", quantity: 1, unit: "ls", unitCost: 42000, total: 42000 },
      { id: "li-204", category: "Exterior", description: "Windows and Exterior Doors", quantity: 1, unit: "ls", unitCost: 24000, total: 24000 },
      { id: "li-205", category: "Roofing", description: "Architectural Shingles", quantity: 1, unit: "ls", unitCost: 14500, total: 14500 },
      { id: "li-206", category: "Masonry", description: "Brick Veneer", quantity: 1, unit: "ls", unitCost: 19000, total: 19000 },
      { id: "li-207", category: "HVAC", description: "Two-Zone HVAC", quantity: 1, unit: "ls", unitCost: 14500, total: 14500 },
      { id: "li-208", category: "Electrical", description: "Electrical with Generator Prep", quantity: 1, unit: "ls", unitCost: 20500, total: 20500 },
      { id: "li-209", category: "Plumbing", description: "Plumbing with Tankless Water Heater", quantity: 1, unit: "ls", unitCost: 16500, total: 16500 },
      { id: "li-210", category: "Interior", description: "Drywall and Finish", quantity: 1, unit: "ls", unitCost: 18500, total: 18500 },
      { id: "li-211", category: "Interior", description: "Custom Cabinetry", quantity: 1, unit: "ls", unitCost: 42000, total: 42000 },
      { id: "li-212", category: "Interior", description: "Quartz Countertops", quantity: 1, unit: "ls", unitCost: 18000, total: 18000 },
      { id: "li-213", category: "Interior", description: "Hardwood and Tile Flooring", quantity: 1, unit: "ls", unitCost: 28000, total: 28000 },
    ],
  },
];

export const jobs: Job[] = [
  {
    id: "job-209",
    name: "Mertz House",
    slug: "mertz-house",
    location: "TBD",
    client: "Mertz",
    stage: "Pre-construction",
    progress: 0,
    status: "New job",
    next: "Add job details - TBD",
    color: "bg-cyan-400",
    budget: "TBD",
    tasks: [
      { id: "t28", title: "Add job location", owner: "Ryland", due: "TBD", status: "Queued" },
      { id: "t29", title: "Add budget and scope", owner: "Ryland", due: "TBD", status: "Queued" },
      { id: "t30", title: "Start pre-construction checklist", owner: "Ryland", due: "TBD", status: "Queued" },
    ],
  },
  {
    id: "job-208",
    name: "Chatmon House",
    slug: "chatmon-house",
    location: "Box Road, Mobile",
    client: "Chatmon",
    stage: "Pre-construction",
    progress: 0,
    status: "Initial planning",
    next: "Site visit · This week",
    color: "bg-emerald-400",
    budget: "$320,000",
    tasks: [
      { id: "t18", title: "Initial site visit", owner: "Ryland", due: "This week", status: "Queued" },
      { id: "t19", title: "Site survey and stakeout", owner: "Surveyor", due: "Next week", status: "Queued" },
      { id: "t20", title: "Get permit", owner: "Office", due: "Following week", status: "Queued" },
      { id: "t21", title: "Construction entrance gravel/silt fence if needed", owner: "Site prep", due: "Following week", status: "Queued" },
      { id: "t22", title: "Install job box and sign", owner: "Site prep", due: "Following week", status: "Queued" },
      { id: "t23", title: "Stake out survey/verify perk test", owner: "Surveyor", due: "Following week", status: "Queued" },
      { id: "t24", title: "Install temp pole", owner: "Site prep", due: "Following week", status: "Queued" },
      { id: "t25", title: "Get water meter installed and get power hooked up to temp pole (ask customer to call else they pay)", owner: "Customer", due: "Following week", status: "Queued" },
      { id: "t26", title: "Porta potty & dumpster", owner: "Site prep", due: "Following week", status: "Queued" },
      { id: "t27", title: "Get dirt work done", owner: "Excavation", due: "Following week", status: "Queued" },
    ],
  },
  {
    id: "job-207",
    name: "Gereau House",
    slug: "gereau-house",
    location: "Hampton Road, Mobile",
    client: "Gereau Family",
    stage: "Pre-construction",
    progress: 0,
    status: "Plans received",
    next: "Cost estimate · This week",
    color: "bg-blue-400",
    budget: "$475,000",
    tasks: [
      { id: "t14", title: "Review house plans (3,292 sq ft)", owner: "Ryland", due: "Today", status: "In progress" },
      { id: "t15", title: "Build cost estimate", owner: "Ryland", due: "This week", status: "Queued" },
      { id: "t16", title: "Site survey and stakeout", owner: "Surveyor", due: "Next week", status: "Queued" },
      { id: "t17", title: "Permit application", owner: "Office", due: "Following week", status: "Queued" },
    ],
  },
  {
    id: "job-201",
    name: "Brenton House",
    slug: "brenton-house",
    location: "Grand Bay",
    client: "Brenton",
    stage: "Pre-construction",
    progress: 5,
    status: "Permits pending",
    next: "Permit submission · TBD",
    color: "bg-emerald-400",
    budget: "$325,000",
    tasks: [
      { id: "t1", title: "Finalize plans", owner: "Ryland", due: "This week", status: "In progress" },
      { id: "t2", title: "Permit application", owner: "Office", due: "Next week", status: "Queued" },
    ],
  },
  {
    id: "job-202",
    name: "Dempsey House",
    slug: "dempsey-house",
    location: "Gulf Shores",
    client: "Dempsey",
    stage: "Pre-construction",
    progress: 0,
    status: "Planning",
    next: "Initial consultation · TBD",
    color: "bg-amber-400",
    budget: "$385,000",
    tasks: [
      { id: "t3", title: "Site survey", owner: "Surveyor", due: "Next week", status: "Queued" },
      { id: "t4", title: "Draft land clearing plan", owner: "Ryland", due: "Following week", status: "Queued" },
    ],
  },
  {
    id: "job-203",
    name: "Hogue House",
    slug: "hogue-house",
    location: "Fairhope",
    client: "Hogue",
    stage: "Pre-construction",
    progress: 10,
    status: "Selections",
    next: "Design center appointment · TBD",
    color: "bg-purple-400",
    budget: "$410,000",
    tasks: [
      { id: "t5", title: "Review floor plan options", owner: "Client", due: "This week", status: "In progress" },
      { id: "t6", title: "Schedule selections meeting", owner: "Office", due: "Next week", status: "Queued" },
    ],
  },
  {
    id: "job-204",
    name: "Tanner House",
    slug: "tanner-house",
    location: "Fairhope",
    client: "Tanner",
    stage: "Foundation",
    progress: 15,
    status: "On track",
    next: "Footing inspection · TBD",
    color: "bg-sky-400",
    budget: "$350,000",
    tasks: [],
  },
  {
    id: "job-205",
    name: "Mike Jones House",
    slug: "mike-jones-house",
    location: "Mobile",
    client: "Mike Jones",
    stage: "Pre-construction",
    progress: 0,
    status: "Planning",
    next: "Initial consultation · TBD",
    color: "bg-rose-400",
    budget: "$295,000",
    tasks: [
      { id: "t9", title: "Initial site visit", owner: "Ryland", due: "This week", status: "Queued" },
      { id: "t10", title: "Discuss budget and scope", owner: "Client", due: "Following week", status: "Queued" },
    ],
  },
];

export const priorities = [
  {
    title: "Chasing subs",
    count: 4,
    detail: "Electrical trim, tile, insulation, final grade",
  },
  {
    title: "Client approvals",
    count: 2,
    detail: "Lighting package and exterior stain sample",
  },
  {
    title: "Risk items",
    count: 3,
    detail: "Rain delay, window lead time, permit callback",
  },
];

export const schedule: ScheduleItem[] = [
  {
    id: "s1",
    house: "Tanner",
    time: "7:30 AM",
    title: "Lot clearing starts",
    type: "Site",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    day: "Mon",
  },
  {
    id: "s2",
    house: "All Houses",
    time: "10:00 AM",
    title: "Morning review — new starts",
    type: "Ops",
    tone: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    day: "Mon",
  },
  {
    id: "s3",
    house: "Hogue",
    time: "1:00 PM",
    title: "Design selections walkthrough",
    type: "Client",
    tone: "border-purple-500/30 bg-purple-500/10 text-purple-200",
    day: "Mon",
  },
  {
    id: "s4",
    house: "Dempsey",
    time: "2:30 PM",
    title: "Site survey coordination",
    type: "Ops",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    day: "Mon",
  },
  {
    id: "s5",
    house: "Brenton",
    time: "9:00 AM",
    title: "Plan review & permit checklist",
    type: "Ops",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    day: "Tue",
  },
  {
    id: "s6",
    house: "Tanner",
    time: "11:00 AM",
    title: "Foundation layout markout",
    type: "Site",
    tone: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    day: "Tue",
  },
  {
    id: "s7",
    house: "Mike Jones",
    time: "3:00 PM",
    title: "Initial consultation",
    type: "Client",
    tone: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    day: "Tue",
  },
];

export const henrySteps = [
  { label: "App shell", status: "Done" },
  { label: "Jobs board", status: "Done" },
  { label: "Calendar filters", status: "In progress" },
  { label: "Status feed", status: "Queued" },
];

export function getJobBySlug(slug: string) {
  return jobs.find((job) => job.slug === slug);
}
