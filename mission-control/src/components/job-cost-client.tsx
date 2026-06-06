"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { jobs as houseJobs, quotes } from "@/lib/mission-data";

type Category = "Site/Precon" | "Shell" | "MEP" | "Interior" | "Exterior";

type LineItemBudget = { name: string; budget: number };

type JobBudget = {
  id: string;
  jobName: string;
  sourceJobId?: string;
  lineItems: Record<Category, LineItemBudget[]>;
  totalBudget: number;
};

type ActualEntry = {
  id: string;
  jobId: string;
  date: string;
  category: Category;
  lineItem: string;
  description: string;
  amount: number;
};

type FeeSummary = {
  hardCost: number;
  overheadAmount: number;
  overheadPct: number;
  profitAmount: number;
  profitPct: number;
};

const STORAGE_KEY = "mission-control-job-cost-v2";
const ESTIMATOR_EXPORT_KEY = "mission-control-estimator-line-items-v1";
const categories: Category[] = ["Site/Precon", "Shell", "MEP", "Interior", "Exterior"];

const defaultLineItems: Record<Category, string[]> = {
  "Site/Precon": ["Termite spray", "Permits", "Stakeout survey", "Grading / dirt work", "Dumpster", "Final clean"],
  Shell: ["Monolithic slab labor", "Footings / foundation / slab", "Pump truck for concrete", "Form labor", "Framing materials", "Framing labor", "Windows & exterior doors", "Fireplace", "Roofing"],
  MEP: ["HVAC", "Electrical labor", "Electrical fixtures", "Insulation", "Plumbing fixtures"],
  Interior: ["Drywall hang & finish", "Drywall materials", "Interior doors & trim materials", "Trim labor", "Painting", "Cabinets", "Granite / quartz", "Floors / tile / backsplash", "Floors & showers labor", "Appliances allowance"],
  Exterior: ["Eaves / porch / Hardie / shutters", "Brick materials", "Masonry sand", "Brick labor", "Garage doors"],
};

const createDefaultLineItems = (): Record<Category, LineItemBudget[]> => {
  const result = {} as Record<Category, LineItemBudget[]>;
  for (const cat of categories) {
    result[cat] = defaultLineItems[cat].map((name) => ({ name, budget: 0 }));
  }
  return result;
};

const defaultMikeJonesBudget: JobBudget = {
  id: "job-205",
  sourceJobId: "job-205",
  jobName: "Mike Jones House",
  lineItems: {
    "Site/Precon": [
      { name: "Permits", budget: 750 },
      { name: "Stakeout survey", budget: 800 },
      { name: "Grading / dirt work", budget: 8500 },
      { name: "Rough cleaning / power washing", budget: 1600 },
      { name: "Final clean", budget: 750 },
      { name: "Portable toilet", budget: 580 },
      { name: "Dumpster", budget: 1400 },
      { name: "Window protection", budget: 2495 },
      { name: "Landscape allowance", budget: 4500 },
      { name: "Driveway / sidewalks allowance", budget: 5000 },
      { name: "Septic / sewage allowance", budget: 6500 },
      { name: "Door locks / knobs / bath hardware", budget: 1150 },
      { name: "Shower door", budget: 1100 },
      { name: "Termite bond", budget: 776 },
      { name: "Blower door test", budget: 250 },
      { name: "Building overhead fee (5%)", budget: 12379.97 },
      { name: "Builder fee (15%)", budget: 38996.91 },
    ],
    Shell: [
      { name: "Footings / foundation / slab", budget: 11500 },
      { name: "Pump truck for concrete", budget: 1630 },
      { name: "Framing materials", budget: 27368.43 },
      { name: "Framing labor", budget: 13800 },
      { name: "Windows & exterior doors", budget: 5450 },
      { name: "Fireplace", budget: 0 },
      { name: "Roofing", budget: 4950 },
    ],
    MEP: [
      { name: "HVAC", budget: 12500 },
      { name: "Plumbing labor", budget: 9850 },
      { name: "Plumbing fixtures", budget: 4800 },
      { name: "Electrical labor", budget: 8500 },
      { name: "Electrical fixtures", budget: 3000 },
      { name: "Insulation", budget: 7250 },
    ],
    Interior: [
      { name: "Drywall hang & finish", budget: 4500 },
      { name: "Drywall materials", budget: 2800 },
      { name: "Interior doors & trim materials", budget: 5000 },
      { name: "Trim labor", budget: 4000 },
      { name: "Painting", budget: 13900 },
      { name: "Cabinets", budget: 20955 },
      { name: "Granite / quartz", budget: 4000 },
      { name: "Floors / tile showers / backsplash materials", budget: 9000 },
      { name: "Floors & showers labor", budget: 7500 },
      { name: "Appliances allowance", budget: 6500 },
    ],
    Exterior: [
      { name: "Eaves / porch / Hardie / shutters", budget: 16845 },
      { name: "Brick materials", budget: 1800 },
      { name: "Masonry sand", budget: 850 },
      { name: "Brick labor", budget: 3200 },
    ],
  },
  totalBudget: 298976.31,
};

const formatCurrency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v);
const formatPercent = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
const getBurnColor = (pct: number) => (pct < 80 ? "text-emerald-400" : pct < 95 ? "text-amber-400" : "text-rose-400");
const getBurnBg = (pct: number) => (pct < 80 ? "bg-emerald-500/20 border-emerald-500/30" : pct < 95 ? "bg-amber-500/20 border-amber-500/30" : "bg-rose-500/20 border-rose-500/30");

const getPercentFromName = (name: string) => {
  const match = name.match(/\((\d+(?:\.\d+)?)%\)/);
  return match ? Number(match[1]) : null;
};

const summarizeFees = (job: JobBudget, fallbackQuote?: (typeof quotes)[number]): FeeSummary => {
  const items = categories.flatMap((cat) => job.lineItems[cat]);
  const overheadItems = items.filter((item) => /overhead/i.test(item.name));
  const profitItems = items.filter((item) => /builder fee|profit/i.test(item.name));
  const overheadAmount = overheadItems.reduce((sum, item) => sum + (item.budget || 0), 0) || fallbackQuote?.overhead || 0;
  const profitAmount = profitItems.reduce((sum, item) => sum + (item.budget || 0), 0) || fallbackQuote?.fee || 0;
  const hardCost = fallbackQuote?.subtotal || Math.max(job.totalBudget - overheadAmount - profitAmount, 0);
  const explicitOverheadPct = overheadItems.map((item) => getPercentFromName(item.name)).find((pct) => pct !== null);
  const explicitProfitPct = profitItems.map((item) => getPercentFromName(item.name)).find((pct) => pct !== null);

  return {
    hardCost,
    overheadAmount,
    overheadPct: explicitOverheadPct ?? (hardCost > 0 ? (overheadAmount / hardCost) * 100 : 0),
    profitAmount,
    profitPct: explicitProfitPct ?? (hardCost > 0 ? (profitAmount / hardCost) * 100 : 0),
  };
};

export function JobCostClient() {
  const [jobs, setJobs] = useState<JobBudget[]>([]);
  const [actuals, setActuals] = useState<ActualEntry[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddActual, setShowAddActual] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudgetLineItems, setEditBudgetLineItems] = useState<Record<Category, LineItemBudget[]> | null>(null);
  const [editBudgetInputs, setEditBudgetInputs] = useState<Record<string, string>>({});
  const [newJobName, setNewJobName] = useState("");
  const [newJobLineItems, setNewJobLineItems] = useState<Record<Category, LineItemBudget[]>>(createDefaultLineItems());
  const [newJobLineItemInputs, setNewJobLineItemInputs] = useState<Partial<Record<Category, Record<string, string>>>>({});
  const [budgetSearch, setBudgetSearch] = useState("");
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState<"all" | Category>("all");
  const [newBudgetItemCategory, setNewBudgetItemCategory] = useState<Category>("Site/Precon");
  const [newBudgetItemName, setNewBudgetItemName] = useState("");
  const [newBudgetItemAmount, setNewBudgetItemAmount] = useState("");
  const [actualDate, setActualDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [actualCategory, setActualCategory] = useState<Category>("Site/Precon");
  const [actualLineItem, setActualLineItem] = useState("");
  const [actualDesc, setActualDesc] = useState("");
  const [actualAmountInput, setActualAmountInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [editingActualId, setEditingActualId] = useState<string | null>(null);
  const [editActualDate, setEditActualDate] = useState("");
  const [editActualCategory, setEditActualCategory] = useState<Category>("Site/Precon");
  const [editActualLineItem, setEditActualLineItem] = useState("");
  const [editActualDesc, setEditActualDesc] = useState("");
  const [editActualAmountInput, setEditActualAmountInput] = useState("");

  const persistJobCostData = useCallback(async (nextJobs: JobBudget[], nextActuals: ActualEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs: nextJobs, actuals: nextActuals }));
    const res = await fetch("/api/job-cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobs: nextJobs, actuals: nextActuals }),
    });
    if (!res.ok) throw new Error("Job cost save failed");
  }, []);

  // Load from cloud on mount
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/job-cost", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (!active) return;
        let loadedJobs = data.jobs || [];
        if (!loadedJobs.length) loadedJobs = [defaultMikeJonesBudget];
        setJobs(loadedJobs);
        setActuals(data.actuals || []);
        setActiveJobId(loadedJobs?.[0]?.id || `catalog:${houseJobs[0]?.id ?? ""}`);
      } catch {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const p = JSON.parse(saved);
            let loadedJobs = p.jobs || [];
            if (!loadedJobs.length) loadedJobs = [defaultMikeJonesBudget];
            setJobs(loadedJobs);
            setActuals(p.actuals || []);
            setActiveJobId(loadedJobs?.[0]?.id || `catalog:${houseJobs[0]?.id ?? ""}`);
          }
        } catch {}
      }
      if (active) setLoaded(true);
    };
    load();
    return () => { active = false; };
  }, []);

  // Save to cloud whenever data changes
  useEffect(() => {
    if (!loaded) return;
    const save = async () => {
      setSaveStatus("saving");
      try {
        await persistJobCostData(jobs, actuals);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    };
    void save();
  }, [jobs, actuals, loaded, persistJobCostData]);

  const isCatalogSelection = activeJobId.startsWith("catalog:");
  const selectedCatalogJobId = isCatalogSelection ? activeJobId.replace("catalog:", "") : "";
  const selectedCatalogJob = useMemo(() => houseJobs.find((j) => j.id === selectedCatalogJobId) || null, [selectedCatalogJobId]);
  const activeJob = useMemo(() => jobs.find((j) => j.id === activeJobId || (!!j.sourceJobId && j.sourceJobId === selectedCatalogJobId)), [jobs, activeJobId, selectedCatalogJobId]);
  const activeQuote = useMemo(() => {
    const sourceJobId = activeJob?.sourceJobId || activeJob?.id || selectedCatalogJobId;
    return quotes.find((quote) => quote.jobId === sourceJobId);
  }, [activeJob, selectedCatalogJobId]);
  const activeJobKey = activeJob?.id || activeJobId;
  const jobActuals = useMemo(() => actuals.filter((a) => a.jobId === activeJobKey), [actuals, activeJobKey]);
  const feeSummary = useMemo(() => (activeJob ? summarizeFees(activeJob, activeQuote) : null), [activeJob, activeQuote]);

  const burnByCategory = useMemo(() => {
    if (!activeJob) return {} as Record<Category, { spent: number; budget: number; pct: number }>;
    const result = {} as Record<Category, { spent: number; budget: number; pct: number }>;
    for (const cat of categories) {
      const spent = jobActuals.filter((a) => a.category === cat).reduce((sum, a) => sum + a.amount, 0);
      const budget = activeJob.lineItems[cat].reduce((sum, i) => sum + (i.budget || 0), 0);
      result[cat] = { spent, budget, pct: budget > 0 ? Math.round((spent / budget) * 100) : 0 };
    }
    return result;
  }, [activeJob, jobActuals]);

  const totalBurn = useMemo(() => {
    if (!activeJob) return { spent: 0, budget: 0, pct: 0 };
    const spent = Object.values(burnByCategory).reduce((sum, b) => sum + b.spent, 0);
    return { spent, budget: activeJob.totalBudget, pct: activeJob.totalBudget > 0 ? Math.round((spent / activeJob.totalBudget) * 100) : 0 };
  }, [burnByCategory, activeJob]);

  const flatLineItems = useMemo(() => {
    const source = isEditingBudget && editBudgetLineItems ? editBudgetLineItems : activeJob?.lineItems;
    if (!source) return [] as { category: Category; name: string; budget: number }[];
    return categories.flatMap((cat) => source[cat].map((item) => ({ category: cat, name: item.name, budget: item.budget || 0 })));
  }, [activeJob, isEditingBudget, editBudgetLineItems]);

  const updateLineItemBudget = (cat: Category, index: number, value: number) => {
    setNewJobLineItems((prev) => {
      const next = { ...prev };
      next[cat] = prev[cat].map((item, i) => (i === index ? { ...item, budget: value } : item));
      return next;
    });
  };

  const formatNumberWithCommas = (value: string): string => {
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleBudgetInputChange = (cat: Category, itemName: string, rawValue: string) => {
    const sanitized = rawValue.replace(/[^0-9.]/g, "");
    setNewJobLineItemInputs((prev) => ({
      ...prev,
      [cat]: { ...(prev[cat] || {}), [itemName]: sanitized },
    }));
    const value = parseFloat(sanitized) || 0;
    const idx = newJobLineItems[cat].findIndex((i) => i.name === itemName);
    if (idx !== -1) updateLineItemBudget(cat, idx, value);
  };

  const addJob = () => {
    const total = Object.values(newJobLineItems).reduce((sum, items) => sum + items.reduce((s, i) => s + (i.budget || 0), 0), 0);
    const sourceJobId = selectedCatalogJob?.id;
    const fallbackName = selectedCatalogJob?.name || "Untitled Job";
    const id = sourceJobId || crypto.randomUUID();
    const job: JobBudget = {
      id,
      sourceJobId,
      jobName: newJobName || fallbackName,
      lineItems: JSON.parse(JSON.stringify(newJobLineItems)),
      totalBudget: total,
    };
    setJobs((prev) => {
      const withoutExisting = prev.filter((j) => j.id !== id && j.sourceJobId !== sourceJobId);
      return [...withoutExisting, job];
    });
    setActiveJobId(job.id);
    setShowAddJob(false);
    setNewJobName("");
    setNewJobLineItems(createDefaultLineItems());
    setNewJobLineItemInputs({});
  };

  const importFromEstimator = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(ESTIMATOR_EXPORT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { items?: { name: string; category: Category; amount: number }[] };
      if (!parsed.items?.length) return;

      setNewJobLineItems((prev) => {
        const next = createDefaultLineItems();
        for (const cat of categories) {
          next[cat] = next[cat].map((li) => {
            const match = parsed.items?.find((i) => i.category === cat && i.name === li.name);
            return match ? { ...li, budget: match.amount || 0 } : li;
          });
        }
        return { ...prev, ...next };
      });
    } catch {
      // ignore malformed snapshot
    }
  };

  const addActual = () => {
    if (!activeJobKey) return;
    const amount = Number(String(actualAmountInput).replace(/[$,\s]/g, "")) || 0;
    const entry: ActualEntry = { id: crypto.randomUUID(), jobId: activeJobKey, date: actualDate, category: actualCategory, lineItem: actualLineItem || "Other", description: actualDesc || "Expense", amount };
    setActuals((prev) => [...prev, entry]);
    setShowAddActual(false);
    setActualDesc("");
    setActualAmountInput("");
  };

  const startEditActual = (entry: ActualEntry) => {
    setEditingActualId(entry.id);
    setEditActualDate(entry.date);
    setEditActualCategory(entry.category);
    setEditActualLineItem(entry.lineItem);
    setEditActualDesc(entry.description);
    setEditActualAmountInput(String(entry.amount));
  };

  const saveEditActual = () => {
    if (!editingActualId) return;
    const amount = Number(String(editActualAmountInput).replace(/[$,\s]/g, "")) || 0;
    setActuals((prev) =>
      prev.map((a) =>
        a.id === editingActualId
          ? {
              ...a,
              date: editActualDate || a.date,
              category: editActualCategory,
              lineItem: editActualLineItem || "Other",
              description: editActualDesc || "Expense",
              amount,
            }
          : a,
      ),
    );
    setEditingActualId(null);
  };

  const deleteActual = (id: string) => {
    setActuals((prev) => prev.filter((a) => a.id !== id));
    if (editingActualId === id) setEditingActualId(null);
  };

  const startEditBudget = () => {
    if (!activeJob) return;
    setEditBudgetLineItems(JSON.parse(JSON.stringify(activeJob.lineItems)));
    setEditBudgetInputs({});
    setIsEditingBudget(true);
  };

  const saveEditBudget = () => {
    if (!activeJob || !editBudgetLineItems) return;
    const totalBudget = Object.values(editBudgetLineItems).reduce(
      (sum, items) => sum + items.reduce((s, i) => s + (i.budget || 0), 0),
      0,
    );
    setJobs((prev) => {
      const nextJobs = prev.map((j) =>
        j.id === activeJob.id
          ? { ...j, lineItems: JSON.parse(JSON.stringify(editBudgetLineItems)), totalBudget }
          : j,
      );
      setSaveStatus("saving");
      void persistJobCostData(nextJobs, actuals).then(
        () => setSaveStatus("saved"),
        () => setSaveStatus("error"),
      );
      return nextJobs;
    });
    setIsEditingBudget(false);
    setEditBudgetLineItems(null);
    setEditBudgetInputs({});
    setNewBudgetItemName("");
    setNewBudgetItemAmount("");
  };

  const cancelEditBudget = () => {
    setIsEditingBudget(false);
    setEditBudgetLineItems(null);
    setEditBudgetInputs({});
    setNewBudgetItemName("");
    setNewBudgetItemAmount("");
  };

  const addBudgetCategoryToExistingJob = () => {
    if (!editBudgetLineItems) return;
    const name = newBudgetItemName.trim();
    if (!name) return;
    const amount = Number(newBudgetItemAmount.replace(/[^0-9.]/g, "")) || 0;
    setEditBudgetLineItems((prev) => {
      if (!prev) return prev;
      const exists = prev[newBudgetItemCategory].some((li) => li.name.toLowerCase() === name.toLowerCase());
      if (exists) return prev;
      return {
        ...prev,
        [newBudgetItemCategory]: [...prev[newBudgetItemCategory], { name, budget: amount }],
      };
    });
    setNewBudgetItemName("");
    setNewBudgetItemAmount("");
  };

  const updateExistingBudgetLineItem = (cat: Category, name: string, value: number) => {
    setEditBudgetLineItems((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [cat]: prev[cat].map((li) => (li.name === name ? { ...li, budget: value } : li)),
      };
    });
  };

  const handleEditBudgetInputChange = (cat: Category, itemName: string, rawValue: string) => {
    const sanitized = rawValue.replace(/[^0-9.]/g, "");
    const key = `${cat}:${itemName}`;
    setEditBudgetInputs((prev) => ({ ...prev, [key]: sanitized }));
    const value = parseFloat(sanitized) || 0;
    updateExistingBudgetLineItem(cat, itemName, value);
  };

  const removeExistingBudgetLineItem = (cat: Category, name: string) => {
    setEditBudgetLineItems((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [cat]: prev[cat].filter((li) => li.name !== name),
      };
    });
  };

  const printHomeownerPdf = () => {
    if (!activeJob) return;

    const rows = flatLineItems
      .map((item) => {
        const spent = jobActuals
          .filter((a) => a.category === item.category && a.lineItem === item.name)
          .reduce((sum, a) => sum + a.amount, 0);
        const variance = spent - item.budget;
        const varianceColor = variance > 0 ? "#b91c1c" : "#166534";
        return `
          <tr>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td class="num">${formatCurrency(item.budget)}</td>
            <td class="num">${formatCurrency(spent)}</td>
            <td class="num" style="color:${varianceColor}">${variance > 0 ? "+" : ""}${formatCurrency(variance)}</td>
          </tr>
        `;
      })
      .join("");

    const totalVariance = totalBurn.spent - totalBurn.budget;
    const now = new Date().toLocaleDateString();
    const reportFeeSummary = feeSummary || summarizeFees(activeJob, activeQuote);

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${activeJob.jobName} - Budget Report</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 28px; }
            .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 24px; }
            .muted { color: #6b7280; font-size: 12px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0 20px; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
            .card h3 { margin: 0 0 6px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; }
            .card p { margin: 0; font-size: 18px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; }
            th { background: #f9fafb; text-align: left; }
            .num { text-align: right; white-space: nowrap; }
            .fee-summary { margin-top: 16px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .fee-summary h2 { margin: 0 0 10px; font-size: 14px; }
            .fee-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .fee-label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
            .fee-value { margin-top: 4px; font-size: 16px; font-weight: 700; }
            .footer { margin-top: 14px; font-size: 11px; color: #6b7280; }
            @media print { body { margin: 16px; } }
          </style>
        </head>
        <body>
          <div class="head">
            <div>
              <h1>Triumph Homes Inc</h1>
              <div class="muted">Homeowner Budget & Cost Report</div>
            </div>
            <div class="muted">${activeJob.jobName}<br/>Generated: ${now}</div>
          </div>

          <div class="summary">
            <div class="card"><h3>Budget</h3><p>${formatCurrency(totalBurn.budget)}</p></div>
            <div class="card"><h3>Actual Cost</h3><p>${formatCurrency(totalBurn.spent)}</p></div>
            <div class="card"><h3>Over / Under</h3><p style="color:${totalVariance > 0 ? "#b91c1c" : "#166534"}">${totalVariance > 0 ? "+" : ""}${formatCurrency(totalVariance)}</p></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Line Item</th>
                <th>Category</th>
                <th class="num">Budget</th>
                <th class="num">Actual Cost</th>
                <th class="num">Over / Under</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="fee-summary">
            <h2>Profit & Overhead</h2>
            <div class="fee-grid">
              <div>
                <div class="fee-label">Hard Cost Basis</div>
                <div class="fee-value">${formatCurrency(reportFeeSummary.hardCost)}</div>
              </div>
              <div>
                <div class="fee-label">Overhead Percentage Fee</div>
                <div class="fee-value">${formatPercent(reportFeeSummary.overheadPct)} / ${formatCurrency(reportFeeSummary.overheadAmount)}</div>
              </div>
              <div>
                <div class="fee-label">Profit Percentage Fee</div>
                <div class="fee-value">${formatPercent(reportFeeSummary.profitPct)} / ${formatCurrency(reportFeeSummary.profitAmount)}</div>
              </div>
            </div>
          </div>

          <div class="footer">For questions, contact your project manager. Prices are estimates; final amounts may vary based on selections and site conditions.</div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      <section className="mission-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Job cost tracking</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Budget vs Actual</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAddJob(true)} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20">Add Job Budget</button>
            <button
              onClick={() => {
                if (!activeJob && isCatalogSelection) {
                  setShowAddJob(true);
                  return;
                }
                setShowAddActual(true);
              }}
              disabled={!activeJob && !isCatalogSelection}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Add Actual Cost
            </button>
          </div>
        </div>
        
        {/* Job selector */}
        <div className="mt-6">
          <label className="text-sm text-zinc-400">Select Job</label>
          <select value={activeJobId} onChange={(e) => setActiveJobId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <option value="">-- Select a job --</option>
            {houseJobs
              .filter((job) => !jobs.some((b) => b.sourceJobId === job.id || b.id === job.id))
              .map((job) => (
                <option key={`catalog-${job.id}`} value={`catalog:${job.id}`}>{job.name}</option>
              ))}
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.jobName}</option>
            ))}
          </select>
        </div>

        {!activeJob && isCatalogSelection && selectedCatalogJob && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            No budget setup yet for <strong>{selectedCatalogJob.name}</strong>. Click <strong>Add Job Budget</strong> to create it.
          </div>
        )}

        {activeJob && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-zinc-400">Budget</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalBurn.budget)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-zinc-400">Actual Spent</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalBurn.spent)}</p>
            </div>
            <div className={`rounded-xl border p-4 ${getBurnBg(totalBurn.pct)}`}>
              <p className="text-sm text-zinc-400">Burn %</p>
              <p className={`mt-1 text-2xl font-semibold ${getBurnColor(totalBurn.pct)}`}>{totalBurn.pct}%</p>
            </div>
          </div>
        )}
      </section>

      {showAddJob && (
        <section className="mission-panel p-6">
          <h3 className="text-lg font-semibold">Add Job Budget</h3>
          <div className="mt-4 space-y-4">
            <input value={newJobName} onChange={(e) => setNewJobName(e.target.value)} placeholder="Job name" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" />
            <div className="flex gap-2">
              <button onClick={importFromEstimator} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm hover:bg-white/5">Import from Estimator</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBudgetCategoryFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs ${budgetCategoryFilter === "all" ? "bg-white text-black" : "border border-white/10 bg-black/30"}`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBudgetCategoryFilter(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs ${budgetCategoryFilter === cat ? "bg-white text-black" : "border border-white/10 bg-black/30"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              value={budgetSearch}
              onChange={(e) => setBudgetSearch(e.target.value)}
              placeholder="Search line item..."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
            <div className="space-y-6">
              {categories.map((cat) => {
                if (budgetCategoryFilter !== "all" && budgetCategoryFilter !== cat) return null;
                const filtered = newJobLineItems[cat]
                  .filter((item) => {
                    const q = budgetSearch.trim().toLowerCase();
                    if (!q) return true;
                    return item.name.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
                  });
                if (filtered.length === 0) return null;
                return (
                  <div key={cat}>
                    <h4 className="text-sm font-medium text-zinc-300">{cat}</h4>
                    <div className="mt-2 space-y-3">
                      {filtered.map((item) => (
                        <div key={item.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                          <span className="text-sm text-zinc-200 flex-1">{item.name}</span>
                          <div className="ml-3 flex w-40 items-center rounded-xl border border-white/10 bg-black/40 px-3">
                            <span className="text-zinc-400">$</span>
                            <input
                              inputMode="decimal"
                              value={newJobLineItemInputs[cat]?.[item.name] ? formatNumberWithCommas(newJobLineItemInputs[cat][item.name]) : (item.budget === 0 ? "" : formatNumberWithCommas(String(item.budget)))}
                              onChange={(e) => handleBudgetInputChange(cat, item.name, e.target.value)}
                              className="w-full bg-transparent px-2 py-2 text-right outline-none"
                              placeholder=""
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={addJob} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20">Save job</button>
              <button onClick={() => setShowAddJob(false)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">Cancel</button>
            </div>
          </div>
        </section>
      )}

      {showAddActual && activeJob && (
        <section className="mission-panel p-6">
          <h3 className="text-lg font-semibold">Add Actual Cost</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="text-sm text-zinc-300">Date</span><input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
            <label className="block"><span className="text-sm text-zinc-300">Category</span>
              <select value={actualCategory} onChange={(e) => { setActualCategory(e.target.value as Category); setActualLineItem(""); }} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={`quick-${c}`}
                    type="button"
                    onClick={() => { setActualCategory(c); setActualLineItem(""); }}
                    className={`rounded-lg px-2.5 py-1 text-xs ${actualCategory === c ? "bg-white text-black" : "border border-white/10 bg-black/30"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </label>
            <label className="block"><span className="text-sm text-zinc-300">Line Item</span>
              <select value={actualLineItem} onChange={(e) => setActualLineItem(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <option value="">Select line item</option>
                {activeJob?.lineItems[actualCategory]?.map((item) => (<option key={item.name} value={item.name}>{item.name}</option>))}
              </select>
            </label>
            <label className="block"><span className="text-sm text-zinc-300">Description</span><input value={actualDesc} onChange={(e) => setActualDesc(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
            <label className="block">
              <span className="text-sm text-zinc-300">Amount</span>
              <div className="mt-1 flex items-center rounded-xl border border-white/10 bg-black/30 px-3">
                <span className="text-zinc-400">$</span>
                <input
                  inputMode="decimal"
                  value={actualAmountInput}
                  onChange={(e) => setActualAmountInput(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder=""
                  className="w-full bg-transparent px-2 py-2 outline-none"
                />
              </div>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={addActual} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20">Save actual</button>
            <button onClick={() => setShowAddActual(false)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">Cancel</button>
          </div>
        </section>
      )}

      {activeJob && (
        <section className="mission-panel p-6">
          <h3 className="text-lg font-semibold">Cost Breakdown</h3>

          <div className="mt-2 flex items-center justify-between">
            <h4 className="text-base font-semibold">Line Item Breakdown</h4>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs ${
                  saveStatus === "error"
                    ? "text-rose-300"
                    : saveStatus === "saving"
                      ? "text-amber-300"
                      : "text-zinc-500"
                }`}
              >
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : ""}
              </span>
              {!isEditingBudget ? (
                <button onClick={startEditBudget} className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100">Edit Budget</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveEditBudget} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100">Save Budget</button>
                  <button onClick={cancelEditBudget} className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs">Cancel</button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[180px_1fr_140px_auto]">
              <select
                value={newBudgetItemCategory}
                onChange={(e) => setNewBudgetItemCategory(e.target.value as Category)}
                disabled={!isEditingBudget}
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm disabled:opacity-50"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                value={newBudgetItemName}
                onChange={(e) => setNewBudgetItemName(e.target.value)}
                placeholder="New budget category name"
                disabled={!isEditingBudget}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm disabled:opacity-50"
              />
              <input
                value={newBudgetItemAmount}
                onChange={(e) => setNewBudgetItemAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Amount"
                disabled={!isEditingBudget}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm disabled:opacity-50"
              />
              <button
                onClick={() => {
                  if (!isEditingBudget) {
                    startEditBudget();
                    return;
                  }
                  addBudgetCategoryToExistingJob();
                }}
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"
              >
                {isEditingBudget ? "Add Category" : "Edit Budget to Add"}
              </button>
            </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-black/30 text-zinc-300">
                <tr>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Line Item</th>
                  <th className="px-3 py-2 text-right">Budget</th>
                  <th className="px-3 py-2 text-right">Actual</th>
                  <th className="px-3 py-2 text-right">Over/Under</th>
                  {isEditingBudget ? <th className="px-3 py-2 text-right">Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {flatLineItems.map((item) => {
                  const spent = jobActuals
                    .filter((a) => a.category === item.category && a.lineItem === item.name)
                    .reduce((sum, a) => sum + a.amount, 0);
                  const variance = spent - item.budget;
                  return (
                    <tr key={`${item.category}-${item.name}`} className="border-t border-white/10">
                      <td className="px-3 py-2 text-zinc-400">{item.category}</td>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2 text-right">
                        {isEditingBudget && editBudgetLineItems ? (
                          <div className="ml-auto flex w-32 items-center justify-end rounded border border-white/10 bg-black/30 px-2 py-1">
                            <span className="text-zinc-400">$</span>
                            <input
                              inputMode="decimal"
                              value={editBudgetInputs[`${item.category}:${item.name}`] ? formatNumberWithCommas(editBudgetInputs[`${item.category}:${item.name}`]) : ((editBudgetLineItems[item.category].find((li) => li.name === item.name)?.budget || 0) === 0 ? "" : formatNumberWithCommas(String(editBudgetLineItems[item.category].find((li) => li.name === item.name)?.budget || "")))}
                              onChange={(e) => handleEditBudgetInputChange(item.category, item.name, e.target.value)}
                              className="w-full bg-transparent px-1 text-right outline-none"
                            />
                          </div>
                        ) : (
                          formatCurrency(item.budget)
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">{formatCurrency(spent)}</td>
                      <td className={`px-3 py-2 text-right ${variance > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                        {variance > 0 ? "+" : ""}{formatCurrency(variance)}
                      </td>
                      {isEditingBudget ? (
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => removeExistingBudgetLineItem(item.category, item.name)}
                            className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                          >
                            Delete
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {feeSummary && (
            <div className="mt-3 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Hard Cost Basis</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(feeSummary.hardCost)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Overhead Percentage Fee</p>
                <p className="mt-1 text-lg font-semibold">{formatPercent(feeSummary.overheadPct)} / {formatCurrency(feeSummary.overheadAmount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Profit Percentage Fee</p>
                <p className="mt-1 text-lg font-semibold">{formatPercent(feeSummary.profitPct)} / {formatCurrency(feeSummary.profitAmount)}</p>
              </div>
            </div>
          )}

          <h4 className="mt-8 text-base font-semibold">Actual Cost Entries</h4>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-black/30 text-zinc-300">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Line Item</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobActuals.length === 0 ? (
                  <tr className="border-t border-white/10">
                    <td colSpan={6} className="px-3 py-4 text-center text-zinc-500">No actual costs yet.</td>
                  </tr>
                ) : (
                  jobActuals
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((entry) => {
                      const isEditing = editingActualId === entry.id;
                      return (
                        <tr key={entry.id} className="border-t border-white/10">
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input type="date" value={editActualDate} onChange={(e) => setEditActualDate(e.target.value)} className="rounded border border-white/10 bg-black/30 px-2 py-1" />
                            ) : entry.date}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <select value={editActualCategory} onChange={(e) => setEditActualCategory(e.target.value as Category)} className="rounded border border-white/10 bg-black/30 px-2 py-1">
                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            ) : entry.category}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input value={editActualLineItem} onChange={(e) => setEditActualLineItem(e.target.value)} className="w-full rounded border border-white/10 bg-black/30 px-2 py-1" />
                            ) : entry.lineItem}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input value={editActualDesc} onChange={(e) => setEditActualDesc(e.target.value)} className="w-full rounded border border-white/10 bg-black/30 px-2 py-1" />
                            ) : entry.description}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <div className="ml-auto flex w-32 items-center justify-end rounded border border-white/10 bg-black/30 px-2 py-1">
                                <span className="text-zinc-400">$</span>
                                <input value={editActualAmountInput} onChange={(e) => setEditActualAmountInput(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-transparent px-1 text-right outline-none" />
                              </div>
                            ) : formatCurrency(entry.amount)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button onClick={saveEditActual} className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">Save</button>
                                <button onClick={() => setEditingActualId(null)} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-xs">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => startEditActual(entry)} className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">Edit</button>
                                <button onClick={() => deleteActual(entry.id)} className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200">Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          <button onClick={printHomeownerPdf} className="mt-6 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm hover:bg-white/5">Print PDF Report</button>
        </section>
      )}
    </div>
  );
}
