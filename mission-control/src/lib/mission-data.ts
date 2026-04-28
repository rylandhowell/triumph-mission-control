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
  { label: "Subs", href: "/subs" },
  { label: "Files", href: "/files" },
  { label: "Settings", href: "/settings" },
];

export const jobs: Job[] = [
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
    tasks: [
      { id: "t7", title: "Clear lot", owner: "Site team", due: "This week", status: "In progress" },
      { id: "t8", title: "Mark foundation layout", owner: "Ryland", due: "Next week", status: "Queued" },
    ],
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
