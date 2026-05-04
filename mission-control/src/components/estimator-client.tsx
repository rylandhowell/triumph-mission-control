"use client";

import { useMemo, useState } from "react";

type SiteCondition = "easy" | "normal" | "hard";
type FinishTier = "good" | "better" | "best";

type CostItem = {
  name: string;
  amount: number;
  category: "Site/Precon" | "Shell" | "MEP" | "Interior" | "Exterior";
};

const BASE_ITEMS: CostItem[] = [
  { name: "Permits", amount: 1500, category: "Site/Precon" },
  { name: "Termite spray", amount: 1300, category: "Site/Precon" },
  { name: "Stakeout survey", amount: 800, category: "Site/Precon" },
  { name: "Grading / dirt work", amount: 12000, category: "Site/Precon" },
  { name: "Footings / foundation / slab", amount: 27000, category: "Shell" },
  { name: "Monolithic slab labor", amount: 4200, category: "Shell" },
  { name: "Pump truck for concrete", amount: 1900, category: "Shell" },
  { name: "Form labor", amount: 14400, category: "Shell" },
  { name: "Framing materials", amount: 48900, category: "Shell" },
  { name: "Framing labor", amount: 30100, category: "Shell" },
  { name: "Windows & exterior doors", amount: 10387.3, category: "Shell" },
  { name: "Fireplace", amount: 5000, category: "Interior" },
  { name: "Roofing", amount: 10000, category: "Exterior" },
  { name: "HVAC", amount: 12100, category: "MEP" },
  { name: "Electrical labor", amount: 15500, category: "MEP" },
  { name: "Insulation", amount: 10762, category: "MEP" },
  { name: "Drywall hang & finish", amount: 11300, category: "Interior" },
  { name: "Drywall materials", amount: 5378.54, category: "Interior" },
  { name: "Interior doors & trim materials", amount: 9628.67, category: "Interior" },
  { name: "Trim labor", amount: 7100, category: "Interior" },
  { name: "Painting", amount: 22000, category: "Interior" },
  { name: "Cabinets", amount: 37408, category: "Interior" },
  { name: "Granite / quartz", amount: 7300, category: "Interior" },
  { name: "Eaves / porch / Hardie / shutters", amount: 18500, category: "Exterior" },
  { name: "Brick materials", amount: 9800, category: "Exterior" },
  { name: "Masonry sand", amount: 850, category: "Exterior" },
  { name: "Brick labor", amount: 9800, category: "Exterior" },
  { name: "Floors / tile / backsplash materials", amount: 15000, category: "Interior" },
  { name: "Floors & showers labor", amount: 10050, category: "Interior" },
  { name: "Plumbing fixtures", amount: 13000, category: "MEP" },
  { name: "Electrical fixtures", amount: 50000, category: "MEP" },
  { name: "Appliances allowance", amount: 7500, category: "Interior" },
  { name: "Garage doors", amount: 3515, category: "Exterior" },
  { name: "Dumpster", amount: 1950, category: "Site/Precon" },
  { name: "Final clean", amount: 775, category: "Interior" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const ESTIMATOR_EXPORT_KEY = "mission-control-estimator-line-items-v1";

export function EstimatorClient() {
  const [planFiles, setPlanFiles] = useState<File[]>([]);
  const [takeoffStatus, setTakeoffStatus] = useState<string>("");
  const [takeoffConfidence, setTakeoffConfidence] = useState<"low" | "medium" | "high" | null>(null);
  const [takeoffMeta, setTakeoffMeta] = useState<string>("");
  const [wallHeightFt, setWallHeightFt] = useState(10);
  const [ceilingAdjustmentPct, setCeilingAdjustmentPct] = useState(0);
  const [drywallSqft, setDrywallSqft] = useState(7000);
  const [brickSqft, setBrickSqft] = useState(1800);
  const [windowDoorCount, setWindowDoorCount] = useState(22);
  const [heatedSqft, setHeatedSqft] = useState(2100);
  const [underRoofSqft, setUnderRoofSqft] = useState(2600);
  const [garageSqft, setGarageSqft] = useState(1000);
  const [lowerLevelSqft, setLowerLevelSqft] = useState(2100);
  const [brickThousands, setBrickThousands] = useState(0);
  const [brickSteps, setBrickSteps] = useState(0);
  const [brickFireplaces, setBrickFireplaces] = useState(0);
  const [rowlockFt, setRowlockFt] = useState(0);
  const [customShowers, setCustomShowers] = useState(1);
  const [siteCondition, setSiteCondition] = useState<SiteCondition>("normal");
  const [finishTier, setFinishTier] = useState<FinishTier>("better");
  const [ownerUpgrades, setOwnerUpgrades] = useState(0);
  const [markupPct, setMarkupPct] = useState(20);
  const [calibrationPct, setCalibrationPct] = useState(9);
  const [showLineItems, setShowLineItems] = useState(false);

  const estimateLineItemAmount = (item: CostItem) => {
    const sqftScale = heatedSqft > 0 ? heatedSqft / 2100 : 1;
    let scaled = item.amount * sqftScale;

    const drywallMaterialRate = 5378.54 / 7000;
    const drywallLaborRate = 11300 / 7000;
    const brickMaterialRate = 9800 / 1800;
    const brickLaborRate = 9800 / 1800;
    const windowsDoorsRate = 10387.3 / 22;

    if (item.name === "Drywall materials") {
      const adjustedDrywallSqft = drywallSqft * (1 + ceilingAdjustmentPct / 100);
      scaled = drywallMaterialRate * adjustedDrywallSqft;
    }
    if (item.name === "Drywall hang & finish") {
      const adjustedDrywallSqft = drywallSqft * (1 + ceilingAdjustmentPct / 100);
      scaled = drywallLaborRate * adjustedDrywallSqft;
    }
    if (item.name === "Brick materials") scaled = brickMaterialRate * brickSqft;
    if (item.name === "Brick labor") {
      if (brickThousands > 0 || brickSteps > 0 || brickFireplaces > 0 || rowlockFt > 0) {
        scaled = brickThousands * 400 + brickSteps * 400 + brickFireplaces * 500 + rowlockFt * 4;
      } else {
        scaled = brickLaborRate * brickSqft;
      }
    }
    if (item.name === "Windows & exterior doors") scaled = windowsDoorsRate * windowDoorCount;
    if (item.name === "Permits") scaled = underRoofSqft * 0.42;
    if (item.name === "Termite spray") scaled = underRoofSqft * 0.5;
    if (item.name === "Monolithic slab labor") scaled = lowerLevelSqft * 2;
    if (item.name === "Electrical fixtures") scaled = heatedSqft * 2.25;
    if (item.name === "Masonry sand") scaled = 850;
    if (item.name === "Appliances allowance") scaled = 7500;
    if (item.name === "Floors / tile / backsplash materials") scaled = heatedSqft * 5 + 500 + 500 + customShowers * 2500;
    if (item.name === "Floors & showers labor") scaled = 0;
    if (item.name === "Dumpster") scaled = 1950;
    if (item.name === "Final clean") scaled = (heatedSqft + garageSqft) * 0.25;

    if (item.category === "Shell") {
      scaled *= siteCondition === "easy" ? 0.97 : siteCondition === "hard" ? 1.1 : 1;
    }
    if (item.category === "Exterior") {
      scaled *= underRoofSqft / 2600;
    }
    if (item.category === "Interior") {
      scaled *= finishTier === "good" ? 0.93 : finishTier === "best" ? 1.12 : 1;
    }

    return Math.max(0, Math.round(scaled));
  };

  const saveLineItemsForJobCost = () => {
    if (typeof window === "undefined") return;
    const items = BASE_ITEMS.map((item) => ({
      name: item.name,
      category: item.category,
      amount: estimateLineItemAmount(item),
    }));
    localStorage.setItem(
      ESTIMATOR_EXPORT_KEY,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        heatedSqft,
        underRoofSqft,
        items,
      })
    );
  };

  const runPlanTakeoff = async () => {
    if (!planFiles.length) {
      setTakeoffStatus("Upload at least one plan PDF first.");
      setTakeoffConfidence(null);
      return;
    }

    setTakeoffStatus("Reading plan PDFs...");
    setTakeoffConfidence(null);

    try {
      const body = new FormData();
      for (const file of planFiles) body.append("files", file);
      body.append("heatedSqft", String(heatedSqft));
      body.append("underRoofSqft", String(underRoofSqft));

      const res = await fetch("/api/estimator/plan-takeoff", {
        method: "POST",
        body,
      });

      if (!res.ok) throw new Error("Takeoff request failed");
      const data = await res.json();

      if (typeof data.wallHeightFt === "number") setWallHeightFt(data.wallHeightFt);
      if (typeof data.drywallSqft === "number") setDrywallSqft(data.drywallSqft);
      if (typeof data.brickSqft === "number") setBrickSqft(data.brickSqft);
      if (typeof data.windowDoorCount === "number") setWindowDoorCount(data.windowDoorCount);
      if (typeof data.ceilingAdjustmentPct === "number") setCeilingAdjustmentPct(data.ceilingAdjustmentPct);

      setTakeoffConfidence(data.confidence ?? "low");
      setTakeoffStatus(data.message ?? "Plan takeoff completed.");
      setTakeoffMeta(
        data.extraction
          ? `Windows/doors: ${data.extraction.windowDoorSource}${data.extraction.usedBrickFallback ? " · Brick: fallback used" : ""}`
          : ""
      );
    } catch {
      setTakeoffStatus("Could not auto-read this PDF set. Keep values manual for this plan.");
      setTakeoffConfidence("low");
      setTakeoffMeta("");
    }
  };

  const calc = useMemo(() => {
    const baseSqft = 2100;
    const sqftScale = heatedSqft > 0 ? heatedSqft / baseSqft : 1;

    const siteMultiplier = siteCondition === "easy" ? 0.97 : siteCondition === "hard" ? 1.1 : 1;
    const finishMultiplier = finishTier === "good" ? 0.93 : finishTier === "best" ? 1.12 : 1;

    const categoryTotals: Record<string, number> = {
      "Site/Precon": 0,
      Shell: 0,
      MEP: 0,
      Interior: 0,
      Exterior: 0,
    };

    const drywallMaterialRate = 5378.54 / 7000;
    const drywallLaborRate = 11300 / 7000;
    const brickMaterialRate = 9800 / 1800;
    const brickLaborRate = 9800 / 1800;
    const windowsDoorsRate = 10387.3 / 22;

    for (const item of BASE_ITEMS) {
      let scaled = item.amount * sqftScale;

      if (item.name === "Drywall materials") {
        const adjustedDrywallSqft = drywallSqft * (1 + ceilingAdjustmentPct / 100);
        scaled = drywallMaterialRate * adjustedDrywallSqft;
      }

      if (item.name === "Drywall hang & finish") {
        const adjustedDrywallSqft = drywallSqft * (1 + ceilingAdjustmentPct / 100);
        scaled = drywallLaborRate * adjustedDrywallSqft;
      }

      if (item.name === "Brick materials") {
        scaled = brickMaterialRate * brickSqft;
      }

      if (item.name === "Brick labor") {
        if (brickThousands > 0 || brickSteps > 0 || brickFireplaces > 0 || rowlockFt > 0) {
          scaled = brickThousands * 400 + brickSteps * 400 + brickFireplaces * 500 + rowlockFt * 4;
        } else {
          scaled = brickLaborRate * brickSqft;
        }
      }

      if (item.name === "Windows & exterior doors") {
        scaled = windowsDoorsRate * windowDoorCount;
      }

      if (item.name === "Permits") {
        scaled = underRoofSqft * 0.42;
      }

      if (item.name === "Termite spray") {
        scaled = underRoofSqft * 0.5;
      }

      if (item.name === "Monolithic slab labor") {
        scaled = lowerLevelSqft * 2;
      }

      if (item.name === "Electrical fixtures") {
        scaled = heatedSqft * 2.25;
      }

      if (item.name === "Masonry sand") {
        scaled = 850;
      }

      if (item.name === "Appliances allowance") {
        scaled = 7500;
      }

      if (item.name === "Floors / tile / backsplash materials") {
        scaled = heatedSqft * 5 + 500 + 500 + customShowers * 2500;
      }

      if (item.name === "Floors & showers labor") {
        scaled = 0;
      }

      if (item.name === "Dumpster") {
        scaled = 1950;
      }

      if (item.name === "Final clean") {
        scaled = (heatedSqft + garageSqft) * 0.25;
      }

      categoryTotals[item.category] += scaled;
    }

    const shellAdjusted = categoryTotals.Shell * siteMultiplier;
    const exteriorAdjusted = categoryTotals.Exterior * (underRoofSqft / 2600);
    const interiorAdjusted = categoryTotals.Interior * finishMultiplier;

    const hardCost =
      categoryTotals["Site/Precon"] + shellAdjusted + categoryTotals.MEP + interiorAdjusted + exteriorAdjusted + ownerUpgrades;

    const calibration = hardCost * (calibrationPct / 100);
    const calibratedCost = hardCost + calibration;
    const markup = calibratedCost * (markupPct / 100);
    const clientQuote = calibratedCost + markup;

    return {
      categoryTotals: {
        "Site/Precon": categoryTotals["Site/Precon"],
        Shell: shellAdjusted,
        MEP: categoryTotals.MEP,
        Interior: interiorAdjusted,
        Exterior: exteriorAdjusted,
      },
      hardCost,
      calibration,
      calibratedCost,
      markup,
      clientQuote,
      sqftScale,
    };
  }, [
    heatedSqft,
    underRoofSqft,
    garageSqft,
    lowerLevelSqft,
    brickThousands,
    brickSteps,
    brickFireplaces,
    rowlockFt,
    customShowers,
    siteCondition,
    finishTier,
    ownerUpgrades,
    markupPct,
    calibrationPct,
    drywallSqft,
    brickSqft,
    windowDoorCount,
    ceilingAdjustmentPct,
  ]);

  return (
    <>
      <section className="mission-panel p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Triumph Estimator v1</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Custom Home Quote Builder</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Uses your real line-item pricing baseline. Goal is conservative quoting so you do not get caught short.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="mission-panel p-6 space-y-5">
          <h3 className="text-lg font-semibold">Inputs</h3>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Plan PDFs</p>
              <p className="text-xs text-zinc-500">
                Upload floor plans/elevations so we can measure sheetrock, brick, windows, and openings per house.
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => setPlanFiles(Array.from(e.target.files ?? []))}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
            {planFiles.length > 0 ? (
              <div className="space-y-1 text-xs text-zinc-300">
                {planFiles.map((file) => (
                  <div key={`${file.name}-${file.size}`}>{file.name}</div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No plan PDFs uploaded yet.</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={runPlanTakeoff}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"
              >
                Auto-fill takeoff from PDFs
              </button>
              {takeoffConfidence ? (
                <span className="text-xs text-cyan-200/80">Confidence: {takeoffConfidence}</span>
              ) : null}
            </div>
            {takeoffStatus ? <p className="text-xs text-zinc-400">{takeoffStatus}</p> : null}
            {takeoffMeta ? <p className="text-xs text-zinc-500">{takeoffMeta}</p> : null}
            <p className="text-xs text-amber-300/90">
              Auto-read complete. Verify extracted quantities against plan callouts before final quote.
            </p>
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-cyan-100">Plan-derived takeoff inputs</p>
              <p className="text-xs text-cyan-200/80">Use values from the uploaded plan set (wall heights + ceiling details).</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-200">Wall height (ft)</span>
                <input
                  type="number"
                  value={wallHeightFt}
                  onChange={(e) => setWallHeightFt(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-zinc-200">Non-flat ceiling add %</span>
                <input
                  type="number"
                  value={ceilingAdjustmentPct}
                  onChange={(e) => setCeilingAdjustmentPct(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-zinc-200">Drywall takeoff area (sq ft)</span>
              <input
                type="number"
                value={drywallSqft}
                onChange={(e) => setDrywallSqft(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-zinc-200">Brick takeoff area (sq ft)</span>
              <input
                type="number"
                value={brickSqft}
                onChange={(e) => setBrickSqft(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-zinc-200">Windows + exterior doors count</span>
              <input
                type="number"
                value={windowDoorCount}
                onChange={(e) => setWindowDoorCount(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-200">Brick quantity (thousands)</span>
                <input
                  type="number"
                  value={brickThousands}
                  onChange={(e) => setBrickThousands(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-200">Brick steps (count)</span>
                <input
                  type="number"
                  value={brickSteps}
                  onChange={(e) => setBrickSteps(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-200">Brick fireplaces (count)</span>
                <input
                  type="number"
                  value={brickFireplaces}
                  onChange={(e) => setBrickFireplaces(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-200">Row lock feet</span>
                <input
                  type="number"
                  value={rowlockFt}
                  onChange={(e) => setRowlockFt(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                />
              </label>
            </div>

            <p className="text-xs text-cyan-200/80">
              Wall height is captured from plans for visibility and will be used directly once PDF auto-read parsing is wired.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Heated sq ft</span>
            <input
              type="number"
              value={heatedSqft}
              onChange={(e) => setHeatedSqft(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Total under roof sq ft</span>
            <input
              type="number"
              value={underRoofSqft}
              onChange={(e) => setUnderRoofSqft(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Lower level sq ft</span>
              <input
                type="number"
                value={lowerLevelSqft}
                onChange={(e) => setLowerLevelSqft(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Garage sq ft</span>
              <input
                type="number"
                value={garageSqft}
                onChange={(e) => setGarageSqft(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Custom showers (count)</span>
            <input
              type="number"
              value={customShowers}
              onChange={(e) => setCustomShowers(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Site condition</span>
            <select
              value={siteCondition}
              onChange={(e) => setSiteCondition(e.target.value as SiteCondition)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            >
              <option value="easy">Easy lot</option>
              <option value="normal">Normal lot</option>
              <option value="hard">Hard lot (extra dirt/complex)</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Finish tier</span>
            <select
              value={finishTier}
              onChange={(e) => setFinishTier(e.target.value as FinishTier)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            >
              <option value="good">Good</option>
              <option value="better">Better (default)</option>
              <option value="best">Best</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Owner upgrades allowance</span>
            <input
              type="number"
              value={ownerUpgrades}
              onChange={(e) => setOwnerUpgrades(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Markup %</span>
              <input
                type="number"
                value={markupPct}
                onChange={(e) => setMarkupPct(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Calibration % (Crabtree)</span>
              <input
                type="number"
                value={calibrationPct}
                onChange={(e) => setCalibrationPct(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>
          </div>

          <p className="text-xs text-zinc-500">Baseline model from your 2,100 sf custom home pricing list.</p>
        </div>

        <div className="mission-panel p-6 space-y-4">
          <h3 className="text-lg font-semibold">Quote Summary</h3>
          <div>
            <button
              type="button"
              onClick={() => setShowLineItems((prev) => !prev)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
            >
              {showLineItems ? "Hide" : "Show"} estimated line items by category
            </button>
            <button
              type="button"
              onClick={saveLineItemsForJobCost}
              className="ml-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"
            >
              Save line items for Job Cost
            </button>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">Site / Precon</span><span>{formatCurrency(calc.categoryTotals["Site/Precon"])}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Shell</span><span>{formatCurrency(calc.categoryTotals.Shell)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">MEP</span><span>{formatCurrency(calc.categoryTotals.MEP)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Interior</span><span>{formatCurrency(calc.categoryTotals.Interior)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Exterior</span><span>{formatCurrency(calc.categoryTotals.Exterior)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Owner upgrades</span><span>{formatCurrency(ownerUpgrades)}</span></div>
          </div>

          {showLineItems ? (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="mb-3 text-sm font-medium">Estimated line items</div>
              <div className="max-h-72 space-y-2 overflow-auto pr-1 text-sm">
                {(["Site/Precon", "Shell", "MEP", "Interior", "Exterior"] as const).map((category) => (
                  <div key={category} className="rounded-lg border border-white/10 p-3">
                    <div className="mb-2 text-xs uppercase tracking-[0.15em] text-zinc-400">{category}</div>
                    <div className="space-y-1">
                      {BASE_ITEMS.filter((item) => item.category === category).map((item) => {
                        const amount = estimateLineItemAmount(item);

                        return (
                          <div key={item.name} className="flex justify-between gap-3">
                            <span className="text-zinc-300">{item.name}</span>
                            <span className="text-zinc-100">{formatCurrency(amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">Internal target cost</span><span>{formatCurrency(calc.hardCost)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Calibration buffer</span><span>{formatCurrency(calc.calibration)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Calibrated cost</span><span>{formatCurrency(calc.calibratedCost)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Markup</span><span>{formatCurrency(calc.markup)}</span></div>
            <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-lg font-semibold">
              <span>Client quote</span>
              <span>{formatCurrency(calc.clientQuote)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
            Conservative mode is ON. Current pricing protects margin with markup.
          </div>
        </div>
      </section>
    </>
  );
}
