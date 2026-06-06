"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useRef, useState } from "react";

type HousePlan = {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  sizeBytes?: number;
};

export function JobHousePlans({ jobId }: { jobId: string }) {
  const [plans, setPlans] = useState<HousePlan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const savePlans = async (nextPlans: HousePlan[]) => {
    setPlans(nextPlans);
    try {
      await fetch("/api/job-houseplans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, plans: nextPlans }),
      });
    } catch {
      // keep local state, retry on next edit
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/job-houseplans?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" });
        const data = res.ok ? await res.json() : { plans: [] };
        if (active && Array.isArray(data?.plans)) setPlans(data.plans);
      } catch {
        // ignore
      } finally {
        if (active) setLoaded(true);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [jobId]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const added: HousePlan[] = [];
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `houseplans/${jobId}/${Date.now()}-${safeName}`;
        const blob = await upload(path, file, {
          access: "private",
          handleUploadUrl: "/api/blob/upload",
          multipart: true,
        });

        added.push({
          id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          name: file.name,
          url: blob.url,
          uploadedAt: new Date().toISOString(),
          sizeBytes: file.size,
        });
      }
      await savePlans([...added, ...plans]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removePlan = async (id: string) => {
    const next = plans.filter((p) => p.id !== id);
    await savePlans(next);
  };

  const sorted = useMemo(
    () => [...plans].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
    [plans]
  );

  const formatSize = (size?: number) => {
    if (!size) return "";
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!loaded) return <p className="text-sm text-zinc-500">Loading house plans...</p>;

  return (
    <div id="house-plans" className="space-y-4 scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Documents</p>
          <h3 className="mt-1 text-xl font-semibold">House Plans</h3>
          <p className="mt-1 text-sm text-zinc-400">Upload PDFs, images, or plan files so they are always on this job page.</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-60"
        >
          {busy ? "Uploading..." : "+ Upload House Plan"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.dxf,.dwg"
          onChange={(e) => void uploadFiles(e.target.files)}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
      ) : null}

      {!sorted.length ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
          No house plans uploaded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((plan) => (
            <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">{plan.name}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(plan.uploadedAt).toLocaleString()} {plan.sizeBytes ? `· ${formatSize(plan.sizeBytes)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a href={plan.url} target="_blank" rel="noreferrer" className="rounded border border-white/20 px-3 py-1.5 text-xs text-cyan-200 hover:bg-white/5">
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => void removePlan(plan.id)}
                  className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
