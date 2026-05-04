"use client";

import { useEffect, useMemo, useState } from "react";

type Category = "Site/Precon" | "Shell" | "MEP" | "Interior" | "Exterior";

type LineItemBudget = { name: string; budget: number };

type JobBudget = {
  id: string;
  jobName: string;
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

const formatCurrency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
const getBurnColor = (pct: number) => (pct < 80 ? "text-emerald-400" : pct < 95 ? "text-amber-400" : "text-rose-400");
const getBurnBg = (pct: number) => (pct < 80 ? "bg-emerald-500/20 border-emerald-500/30" : pct < 95 ? "bg-amber-500/20 border-amber-500/30" : "bg-rose-500/20 border-rose-500/30");

export function JobCostClient() {
  const [jobs, setJobs] = useState<JobBudget[]>(() => {
    if (typeof window === "undefined") return [];
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) { const p = JSON.parse(saved); return p.jobs || []; } } catch {}
    return [];
  });
  const [actuals, setActuals] = useState<ActualEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) { const p = JSON.parse(saved); return p.actuals || []; } } catch {}
    return [];
  });
  const [activeJobId, setActiveJobId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) { const p = JSON.parse(saved); return p.jobs?.[0]?.id || ""; } } catch {}
    return "";
  });
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddActual, setShowAddActual] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobLineItems, setNewJobLineItems] = useState<Record<Category, LineItemBudget[]>>(createDefaultLineItems());
  const [actualDate, setActualDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [actualCategory, setActualCategory] = useState<Category>("Site/Precon");
  const [actualLineItem, setActualLineItem] = useState("");
  const [actualDesc, setActualDesc] = useState("");
  const [actualAmount, setActualAmount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs, actuals }));
  }, [jobs, actuals]);

  const activeJob = useMemo(() => jobs.find((j) => j.id === activeJobId), [jobs, activeJobId]);
  const jobActuals = useMemo(() => actuals.filter((a) => a.jobId === activeJobId), [actuals, activeJobId]);

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
    if (!activeJob) return [] as { category: Category; name: string; budget: number }[];
    return categories.flatMap((cat) =>
      activeJob.lineItems[cat].map((item) => ({ category: cat, name: item.name, budget: item.budget || 0 }))
    );
  }, [activeJob]);

  const alerts = useMemo(() => {
    const list: { message: string; severity: "warning" | "danger" }[] = [];
    for (const cat of categories) {
      const b = burnByCategory[cat]; if (!b) continue;
      if (b.pct >= 100) list.push({ message: `${cat} over budget`, severity: "danger" });
      else if (b.pct >= 80) list.push({ message: `${cat} at ${b.pct}%`, severity: "warning" });
    }
    return list;
  }, [burnByCategory]);

  const updateLineItemBudget = (cat: Category, index: number, value: number) => {
    setNewJobLineItems((prev) => {
      const next = { ...prev };
      next[cat] = prev[cat].map((item, i) => (i === index ? { ...item, budget: value } : item));
      return next;
    });
  };

  const addJob = () => {
    const total = Object.values(newJobLineItems).reduce((sum, items) => sum + items.reduce((s, i) => s + (i.budget || 0), 0), 0);
    const job: JobBudget = { id: crypto.randomUUID(), jobName: newJobName || "Untitled Job", lineItems: JSON.parse(JSON.stringify(newJobLineItems)), totalBudget: total };
    setJobs((prev) => [...prev, job]);
    setActiveJobId(job.id);
    setShowAddJob(false);
    setNewJobName("");
    setNewJobLineItems(createDefaultLineItems());
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
    if (!activeJobId) return;
    const entry: ActualEntry = { id: crypto.randomUUID(), jobId: activeJobId, date: actualDate, category: actualCategory, lineItem: actualLineItem || "Other", description: actualDesc || "Expense", amount: actualAmount || 0 };
    setActuals((prev) => [...prev, entry]);
    setShowAddActual(false);
    setActualDesc("");
    setActualAmount(0);
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

          <div class="footer">Prepared by Triumph Homes Inc • Mobile & Baldwin County, Alabama</div>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  return (
    <div className="space-y-6">
      <section className="mission-panel p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Job Cost</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Live Budget Tracker</h2>
            <p className="mt-2 text-sm text-zinc-400">Track actual spend vs budget by line item. Alerts at 80% and 100%. (v2.1)</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={activeJobId} onChange={(e) => setActiveJobId(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
              <option value="">Select job</option>
              {jobs.map((j) => (<option key={j.id} value={j.id}>{j.jobName}</option>))}
            </select>
            {activeJob ? (
              <button onClick={printHomeownerPdf} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Printable PDF</button>
            ) : null}
            <button onClick={() => setShowAddJob(true)} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20">Add job budget</button>
          </div>
        </div>
      </section>

      {alerts.length > 0 && (<section className="space-y-2">{alerts.map((a, i) => (<div key={i} className={`rounded-xl border px-4 py-3 text-sm ${a.severity === "danger" ? "border-rose-500/30 bg-rose-500/10 text-rose-100" : "border-amber-500/30 bg-amber-500/10 text-amber-100"}`}>{a.message}</div>))}</section>)}

      {!activeJob && !showAddJob && (
        <section className="mission-panel p-6 text-center">
          <p className="text-zinc-400">Select a job above or click &quot;Add job budget&quot; to start tracking.</p>
        </section>
      )}

      {activeJob && (<>
        <section className="mission-panel p-6">
          <h3 className="text-lg font-semibold">Overall Burn</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4"><p className="text-sm text-zinc-400">Budget</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(totalBurn.budget)}</p></div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4"><p className="text-sm text-zinc-400">Spent</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(totalBurn.spent)}</p></div>
            <div className={`rounded-xl border p-4 ${getBurnBg(totalBurn.pct)}`}><p className="text-sm text-zinc-300">Burn %</p><p className={`mt-1 text-2xl font-semibold ${getBurnColor(totalBurn.pct)}`}>{totalBurn.pct}%</p></div>
          </div>
        </section>

        <section className={`mission-panel p-6 ${getBurnBg(totalBurn.pct)}`}>
          <h3 className="text-lg font-semibold">Line Item Cost Tracking</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Budget</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(totalBurn.budget)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Actual Cost</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(totalBurn.spent)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Over / Under</p>
              <p className={`mt-1 text-lg font-semibold ${totalBurn.spent > totalBurn.budget ? "text-rose-400" : "text-emerald-400"}`}>
                {totalBurn.spent > totalBurn.budget ? "+" : ""}{formatCurrency(totalBurn.spent - totalBurn.budget)}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="hidden md:grid md:grid-cols-5 gap-4 px-3 pb-2 text-xs uppercase tracking-wider text-zinc-500">
              <div>Line Item</div>
              <div>Category</div>
              <div className="text-right">Budget</div>
              <div className="text-right">Actual Cost</div>
              <div className="text-right">Over/Under</div>
            </div>
            {flatLineItems.map((item) => {
              const spent = jobActuals
                .filter((a) => a.category === item.category && a.lineItem === item.name)
                .reduce((sum, a) => sum + a.amount, 0);
              const variance = spent - item.budget;
              const isOver = variance > 0;
              return (
                <div key={`${item.category}-${item.name}`} className="grid grid-cols-2 md:grid-cols-5 gap-4 rounded-lg border border-white/10 bg-black/30 px-3 py-3">
                  <div><p className="text-sm text-zinc-200">{item.name}</p></div>
                  <div><p className="text-xs text-zinc-500 md:hidden">Category: </p><p className="text-sm text-zinc-400">{item.category}</p></div>
                  <div className="text-right md:text-right text-left"><p className="text-xs text-zinc-500 md:hidden">Budget: </p><p className="text-sm text-zinc-200">{formatCurrency(item.budget)}</p></div>
                  <div className="text-right"><p className="text-xs text-zinc-500 md:hidden">Actual Cost: </p><p className="text-sm text-zinc-200">{formatCurrency(spent)}</p></div>
                  <div className="text-right"><p className="text-xs text-zinc-500 md:hidden">Over/Under: </p><p className={`text-sm font-medium ${isOver ? "text-rose-400" : "text-emerald-400"}`}>{isOver ? "+" : ""}{formatCurrency(variance)}</p></div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mission-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Actuals</h3>
            <button onClick={() => setShowAddActual(true)} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20">Add actual</button>
          </div>
          <div className="mt-4 space-y-2">
            {jobActuals.length === 0 ? (<p className="text-sm text-zinc-400">No actuals logged for this job yet.</p>) : (
              jobActuals.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <div><p className="text-sm text-zinc-200">{a.description}</p><p className="text-xs text-zinc-500">{a.date} · {a.category} · {a.lineItem}</p></div>
                  <p className="text-sm font-medium">{formatCurrency(a.amount)}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </>)}

      {showAddJob && (
        <section className="mission-panel p-6">
          <h3 className="text-lg font-semibold">Add Job Budget</h3>
          <div className="mt-4 space-y-4">
            <label className="block"><span className="text-sm text-zinc-300">Job name</span><input value={newJobName} onChange={(e) => setNewJobName(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
            <div>
              <button onClick={importFromEstimator} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20">Import budgets from Estimator</button>
            </div>
            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat}>
                  <h4 className="text-sm font-medium text-zinc-300">{cat}</h4>
                  <div className="mt-2 space-y-3">
                    {newJobLineItems[cat].map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                        <span className="text-sm text-zinc-200 flex-1">{item.name}</span>
                        <input type="number" value={item.budget} onChange={(e) => updateLineItemBudget(cat, idx, Number(e.target.value) || 0)} className="w-40 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-right" placeholder="Budget" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
          <h3 className="text-lg font-semibold">Add Actual</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="text-sm text-zinc-300">Date</span><input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
            <label className="block"><span className="text-sm text-zinc-300">Category</span>
              <select value={actualCategory} onChange={(e) => { setActualCategory(e.target.value as Category); setActualLineItem(""); }} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </label>
            <label className="block"><span className="text-sm text-zinc-300">Line Item</span>
              <select value={actualLineItem} onChange={(e) => setActualLineItem(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <option value="">Select line item</option>
                {activeJob?.lineItems[actualCategory]?.map((item) => (<option key={item.name} value={item.name}>{item.name}</option>))}
              </select>
            </label>
            <label className="block"><span className="text-sm text-zinc-300">Description</span><input value={actualDesc} onChange={(e) => setActualDesc(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
            <label className="block"><span className="text-sm text-zinc-300">Amount</span><input type="number" value={actualAmount} onChange={(e) => setActualAmount(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={addActual} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20">Save actual</button>
            <button onClick={() => setShowAddActual(false)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">Cancel</button>
          </div>
        </section>
      )}
    </div>
  );
}
