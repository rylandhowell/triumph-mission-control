"use client";

import { useEffect, useMemo, useState } from "react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

const formatNumberWithCommas = (value: string): string => {
  const parts = value.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

type Confidence = "low" | "medium" | "high";
type BudgetCategory = { id: string; name: string; amount: number };

const STORAGE_KEY = "mission-estimator-v2";

const readSaved = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function EstimatorClient() {
  const saved = readSaved();

  const [heatedSqft, setHeatedSqft] = useState(saved?.heatedSqft ?? 2100);
  const [underRoofSqft, setUnderRoofSqft] = useState(saved?.underRoofSqft ?? 2600);
  const [garageSqft, setGarageSqft] = useState(saved?.garageSqft ?? 500);

  const [wallHeightFt, setWallHeightFt] = useState(saved?.wallHeightFt ?? 9);
  const [drywallSqft, setDrywallSqft] = useState(saved?.drywallSqft ?? 6300);
  const [brickSqft, setBrickSqft] = useState(saved?.brickSqft ?? 1820);
  const [windowDoorCount, setWindowDoorCount] = useState(saved?.windowDoorCount ?? 34);

  const [drywallRate, setDrywallRate] = useState(saved?.drywallRate ?? 2.6);
  const [brickRate, setBrickRate] = useState(saved?.brickRate ?? 9.5);
  const [windowDoorUnit, setWindowDoorUnit] = useState(saved?.windowDoorUnit ?? 420);
  const [baseSiteCost, setBaseSiteCost] = useState(saved?.baseSiteCost ?? 34801);
  const [overheadPct, setOverheadPct] = useState(saved?.overheadPct ?? 5);
  const [builderFeePct, setBuilderFeePct] = useState(saved?.builderFeePct ?? 15);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(saved?.budgetCategories ?? []);
  const [newBudgetName, setNewBudgetName] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState<string>("");
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});

  const [planFiles, setPlanFiles] = useState<File[]>([]);
  const [takeoffLoading, setTakeoffLoading] = useState(false);
  const [takeoffMessage, setTakeoffMessage] = useState<string>("");
  const [takeoffJobId, setTakeoffJobId] = useState<string>("");
  const [takeoffConfidence, setTakeoffConfidence] = useState<Confidence | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          heatedSqft,
          underRoofSqft,
          garageSqft,
          wallHeightFt,
          drywallSqft,
          brickSqft,
          windowDoorCount,
          drywallRate,
          brickRate,
          windowDoorUnit,
          baseSiteCost,
          overheadPct,
          builderFeePct,
          budgetCategories,
        })
      );
    } catch {}
  }, [
    heatedSqft,
    underRoofSqft,
    garageSqft,
    wallHeightFt,
    drywallSqft,
    brickSqft,
    windowDoorCount,
    drywallRate,
    brickRate,
    windowDoorUnit,
    baseSiteCost,
    overheadPct,
    builderFeePct,
    budgetCategories,
  ]);

  const calculations = useMemo(() => {
    const framingShellAllowance = (heatedSqft + garageSqft) * 26;
    const drywallCost = drywallSqft * drywallRate;
    const brickCost = brickSqft * brickRate;
    const windowDoorCost = windowDoorCount * windowDoorUnit;
    const customBudgetTotal = budgetCategories.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const hardCost = baseSiteCost + framingShellAllowance + drywallCost + brickCost + windowDoorCost + customBudgetTotal;
    const overheadFee = hardCost * (overheadPct / 100);
    const builderFee = hardCost * (builderFeePct / 100);
    const clientQuote = hardCost + overheadFee + builderFee;

    return {
      framingShellAllowance,
      drywallCost,
      brickCost,
      windowDoorCost,
      customBudgetTotal,
      summary: { hardCost, overheadFee, builderFee, clientQuote },
    };
  }, [
    heatedSqft,
    garageSqft,
    drywallSqft,
    drywallRate,
    brickSqft,
    brickRate,
    windowDoorCount,
    windowDoorUnit,
    baseSiteCost,
    overheadPct,
    builderFeePct,
    budgetCategories,
  ]);

  const addBudgetCategory = () => {
    const name = newBudgetName.trim();
    if (!name) return;
    const amount = parseFloat(newBudgetAmount.replace(/[^0-9.]/g, "")) || 0;
    setBudgetCategories((prev) => [...prev, { id: `cat_${Date.now()}`, name, amount }]);
    setNewBudgetName("");
    setNewBudgetAmount("");
  };

  const handleBudgetAmountChange = (id: string, rawValue: string) => {
    const sanitized = rawValue.replace(/[^0-9.]/g, "");
    setBudgetInputs((prev) => ({ ...prev, [id]: sanitized }));
    const value = parseFloat(sanitized) || 0;
    setBudgetCategories((prev) => prev.map((item) => (item.id === id ? { ...item, amount: value } : item)));
  };

  const updateBudgetCategory = (id: string, patch: Partial<BudgetCategory>) => {
    setBudgetCategories((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeBudgetCategory = (id: string) => {
    setBudgetCategories((prev) => prev.filter((item) => item.id !== id));
  };

  const runPlanTakeoff = async () => {
    if (!planFiles.length) return setTakeoffMessage("Attach at least one plan PDF first.");

    setTakeoffLoading(true);
    setTakeoffMessage("");
    setTakeoffConfidence(null);
    try {
      const form = new FormData();
      planFiles.forEach((f) => form.append("files", f));
      form.append("heatedSqft", String(heatedSqft));
      form.append("underRoofSqft", String(underRoofSqft));

      const res = await fetch("/api/estimator/takeoff/enqueue", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setTakeoffMessage(data?.error || `Takeoff enqueue failed (${res.status}).`);

      setTakeoffJobId(data?.jobId || "");
      setTakeoffMessage("Takeoff queued. Processing...");
      await fetch("/api/estimator/takeoff/worker", { method: "POST" });
    } catch {
      setTakeoffMessage("Takeoff failed. Check connection and try again.");
    } finally {
      setTakeoffLoading(false);
    }
  };

  useEffect(() => {
    if (!takeoffJobId) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/estimator/takeoff/status?jobId=${encodeURIComponent(takeoffJobId)}`);
        const data = await res.json();
        if (!res.ok || !data?.job) return;

        const job = data.job;
        if (job.status === "queued") return setTakeoffMessage("Takeoff queued...");
        if (job.status === "processing") return setTakeoffMessage("Takeoff processing...");
        if (job.status === "failed") {
          setTakeoffMessage(job.error || "Takeoff failed.");
          setTakeoffJobId("");
          return;
        }

        if (job.status === "done") {
          const out = job.result || {};
          if (typeof out?.wallHeightFt === "number" && out.wallHeightFt > 0) setWallHeightFt(Number(out.wallHeightFt));
          if (typeof out?.drywallSqft === "number" && out.drywallSqft > 0) setDrywallSqft(Math.round(out.drywallSqft));
          if (typeof out?.brickSqft === "number" && out.brickSqft > 0) setBrickSqft(Math.round(out.brickSqft));
          if (typeof out?.windowDoorCount === "number" && out.windowDoorCount > 0) setWindowDoorCount(Math.round(out.windowDoorCount));
          if (["low", "medium", "high"].includes(out?.confidence)) setTakeoffConfidence(out.confidence as Confidence);
          setTakeoffMessage(out?.message || "Takeoff complete. Review and adjust rates.");
          setTakeoffJobId("");
        }
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [takeoffJobId]);

  const confidenceClass =
    takeoffConfidence === "high"
      ? "text-emerald-300"
      : takeoffConfidence === "medium"
        ? "text-amber-300"
        : "text-rose-300";

  return (
    <div className="space-y-6">
      <section className="mission-panel p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Triumph Estimator</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Quote Builder</h2>
        <p className="mt-2 text-sm text-zinc-400">Upload plan PDF, pull takeoff quantities, then price from real rates.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input type="file" accept=".pdf" multiple onChange={(e) => setPlanFiles(Array.from(e.target.files || []))} className="text-sm" />
          <button onClick={runPlanTakeoff} disabled={takeoffLoading} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50">
            {takeoffLoading ? "Queueing..." : "Run Plan Takeoff"}
          </button>
          {planFiles.length ? <span className="text-xs text-zinc-400">{planFiles.length} file(s) selected</span> : null}
        </div>
        {takeoffMessage ? <p className="mt-2 text-sm text-zinc-300">{takeoffMessage}</p> : null}
        {takeoffConfidence ? <p className={`mt-1 text-xs uppercase tracking-wider ${confidenceClass}`}>Takeoff confidence: {takeoffConfidence}</p> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="mission-panel p-6 space-y-4">
          <h3 className="text-lg font-semibold">Project Inputs</h3>
          <label className="block"><span className="text-sm text-zinc-300">Heated sqft</span><input type="number" value={heatedSqft} onChange={(e) => setHeatedSqft(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          <label className="block"><span className="text-sm text-zinc-300">Under roof sqft</span><input type="number" value={underRoofSqft} onChange={(e) => setUnderRoofSqft(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          <label className="block"><span className="text-sm text-zinc-300">Garage sqft</span><input type="number" value={garageSqft} onChange={(e) => setGarageSqft(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
        </section>

        <section className="mission-panel p-6 space-y-4">
          <h3 className="text-lg font-semibold">Takeoff Quantities</h3>
          <label className="block"><span className="text-sm text-zinc-300">Wall height (ft)</span><input type="number" value={wallHeightFt} onChange={(e) => setWallHeightFt(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          <label className="block"><span className="text-sm text-zinc-300">Drywall sqft</span><input type="number" value={drywallSqft} onChange={(e) => setDrywallSqft(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          <label className="block"><span className="text-sm text-zinc-300">Brick sqft</span><input type="number" value={brickSqft} onChange={(e) => setBrickSqft(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          <label className="block"><span className="text-sm text-zinc-300">Windows + doors count</span><input type="number" value={windowDoorCount} onChange={(e) => setWindowDoorCount(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
        </section>

        <section className="mission-panel p-6 space-y-4">
          <h3 className="text-lg font-semibold">Rates & Fees</h3>
          <label className="block"><span className="text-sm text-zinc-300">Drywall $/sqft</span><input type="number" step="0.01" value={drywallRate} onChange={(e) => setDrywallRate(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          <label className="block"><span className="text-sm text-zinc-300">Brick $/sqft</span><input type="number" step="0.01" value={brickRate} onChange={(e) => setBrickRate(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          <label className="block"><span className="text-sm text-zinc-300">Window/door allowance each</span><input type="number" value={windowDoorUnit} onChange={(e) => setWindowDoorUnit(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          <label className="block"><span className="text-sm text-zinc-300">Base site/precon allowance</span><input type="number" value={baseSiteCost} onChange={(e) => setBaseSiteCost(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-zinc-300">Overhead %</span><input type="number" step="0.1" value={overheadPct} onChange={(e) => setOverheadPct(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
            <label className="block"><span className="text-sm text-zinc-300">Builder fee %</span><input type="number" step="0.1" value={builderFeePct} onChange={(e) => setBuilderFeePct(Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2" /></label>
          </div>

          <div className="mt-2 border-t border-white/10 pt-3">
            <p className="text-sm font-medium text-zinc-200">Budget Categories</p>
            <p className="text-xs text-zinc-500">Add one-off lines like pool, septic upgrade, driveway upgrade, etc.</p>
            <div className="mt-2 grid grid-cols-[1fr_130px_auto] gap-2">
              <input
                type="text"
                placeholder="Category name"
                value={newBudgetName}
                onChange={(e) => setNewBudgetName(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              />
              <div className="flex items-center rounded-xl border border-white/10 bg-black/30 px-3">
                <span className="text-zinc-400">$</span>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={newBudgetAmount ? formatNumberWithCommas(newBudgetAmount) : ""}
                  onChange={(e) => setNewBudgetAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full bg-transparent px-2 py-2 outline-none"
                />
              </div>
              <button type="button" onClick={addBudgetCategory} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
                Add
              </button>
            </div>

            <div className="mt-2 space-y-2">
              {budgetCategories.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_130px_auto] gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateBudgetCategory(item.id, { name: e.target.value })}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                  />
                  <div className="flex items-center rounded-xl border border-white/10 bg-black/30 px-3">
                    <span className="text-zinc-400">$</span>
                    <input
                      inputMode="decimal"
                      value={budgetInputs[item.id] ? formatNumberWithCommas(budgetInputs[item.id]) : (item.amount === 0 ? "" : formatNumberWithCommas(String(item.amount)))}
                      onChange={(e) => handleBudgetAmountChange(item.id, e.target.value)}
                      className="w-full bg-transparent px-2 py-2 outline-none"
                    />
                  </div>
                  <button type="button" onClick={() => removeBudgetCategory(item.id)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="mission-panel p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-zinc-400">Base site + precon</span><span>{formatCurrency(baseSiteCost)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Framing/shell allowance</span><span>{formatCurrency(calculations.framingShellAllowance)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Drywall ({drywallSqft.toLocaleString()} × {drywallRate})</span><span>{formatCurrency(calculations.drywallCost)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Brick ({brickSqft.toLocaleString()} × {brickRate})</span><span>{formatCurrency(calculations.brickCost)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Windows/doors ({windowDoorCount} × {windowDoorUnit})</span><span>{formatCurrency(calculations.windowDoorCost)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Custom budget categories</span><span>{formatCurrency(calculations.customBudgetTotal)}</span></div>
          <div className="mt-2 border-t border-white/10 pt-2 flex justify-between"><span className="text-zinc-400">Hard Cost</span><span className="font-medium">{formatCurrency(calculations.summary.hardCost)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Overhead ({overheadPct}%)</span><span className="font-medium">{formatCurrency(calculations.summary.overheadFee)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Builder Fee ({builderFeePct}%)</span><span className="font-medium">{formatCurrency(calculations.summary.builderFee)}</span></div>
          <div className="border-t border-white/10 pt-2 flex justify-between text-lg font-semibold"><span>Client Quote</span><span>{formatCurrency(calculations.summary.clientQuote)}</span></div>
        </div>
      </section>
    </div>
  );
}
