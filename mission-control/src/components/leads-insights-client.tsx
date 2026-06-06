"use client";

import { useEffect, useMemo, useState } from "react";

type Insights = {
  totals: { pageViews: number; ctaClicks: number; formStarts: number; formSubmits: number };
  daily: Record<string, { pageViews: number; ctaClicks: number; formStarts: number; formSubmits: number }>;
  updatedAt: string | null;
  error?: string;
};

type Submission = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  buildLocation: string;
  details: string;
  contacted?: boolean;
  contactedAt?: string | null;
  notes?: string;
};

const empty: Insights = {
  totals: { pageViews: 0, ctaClicks: 0, formStarts: 0, formSubmits: 0 },
  daily: {},
  updatedAt: null,
};

export function LeadsInsightsClient() {
  const [data, setData] = useState<Insights>(empty);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [search, setSearch] = useState("");
  const [viewCount, setViewCount] = useState<"5" | "10" | "20" | "all">("all");
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ name: "", phone: "", email: "", buildLocation: "", details: "" });

  useEffect(() => {
    fetch("/api/leads-insights", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d || empty))
      .finally(() => setLoading(false));

    fetch("/api/leads-submissions", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSubmissions(Array.isArray(d?.submissions) ? d.submissions : []))
      .catch(() => setSubmissions([]));
  }, []);

  const rates = useMemo(() => {
    const views = data.totals.pageViews || 0;
    const starts = data.totals.formStarts || 0;
    const submits = data.totals.formSubmits || 0;
    return {
      startRate: views ? Math.round((starts / views) * 100) : 0,
      submitRate: views ? Math.round((submits / views) * 100) : 0,
    };
  }, [data]);

  const recentDays = useMemo(() => Object.entries(data.daily || {}).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 30), [data.daily]);

  const filteredSubmissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = !q
      ? submissions
      : submissions.filter((s) =>
          [s.name, s.phone, s.email, s.buildLocation, s.details].some((v) => (v || "").toLowerCase().includes(q)),
        );

    if (viewCount === "all") return base;
    const n = Number(viewCount);
    return base.slice(0, n);
  }, [submissions, search, viewCount]);

  const patchSubmission = async (id: string, payload: Record<string, unknown>) => {
    const previous = submissions;
    setSubmissions((curr) =>
      curr.map((s) => {
        if (s.id !== id) return s;
        const next: Submission = { ...s, ...(payload as Partial<Submission>) };
        if (Object.prototype.hasOwnProperty.call(payload, "contacted")) {
          next.contactedAt = payload.contacted ? new Date().toISOString() : null;
        }
        return next;
      }),
    );

    try {
      const r = await fetch("/api/leads-submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const json = await r.json();
      if (!r.ok || json?.ok === false) throw new Error(json?.error || "Update failed");
    } catch {
      setSubmissions(previous);
    }
  };

  const deleteSubmission = async (id: string) => {
    const previous = submissions;
    setSubmissions((curr) => curr.filter((s) => s.id !== id));
    try {
      const r = await fetch("/api/leads-submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await r.json();
      if (!r.ok || json?.ok === false) throw new Error(json?.error || "Delete failed");
    } catch {
      setSubmissions(previous);
    }
  };

  const addManualSubmission = async () => {
    if (!manual.name && !manual.phone && !manual.email) return;
    const payload = { ...manual };
    const r = await fetch("/api/leads-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await r.json();
    if (!r.ok || json?.ok === false) return;

    setManual({ name: "", phone: "", email: "", buildLocation: "", details: "" });
    setManualOpen(false);
    const fresh = await fetch("/api/leads-submissions", { cache: "no-store" }).then((x) => x.json());
    setSubmissions(Array.isArray(fresh?.submissions) ? fresh.submissions : []);
  };

  return (
    <div className="space-y-6">
      <section className="mission-panel p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Website Ads Performance</p>
        <h1 className="mt-2 text-3xl font-semibold">Leads Site Insights</h1>
        <p className="mt-2 text-sm text-zinc-400">Clicks and engagement on triumphhomesinc.com</p>
        {data.updatedAt ? <p className="mt-2 text-xs text-zinc-500">Last updated: {new Date(data.updatedAt).toLocaleString()}</p> : null}
        {data.error ? <p className="mt-2 text-xs text-amber-300">Note: {data.error}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Page Views" value={data.totals.pageViews} loading={loading} />
        <Card label="Start Your Build Clicks" value={data.totals.ctaClicks} loading={loading} />
        <Card label="Form Starts" value={data.totals.formStarts} loading={loading} />
        <Card
          label="Form Submits"
          value={data.totals.formSubmits}
          loading={loading}
          clickable
          onClick={async () => {
            const next = !showSubmissions;
            setShowSubmissions(next);
            if (next) {
              setSearch("");
              try {
                const r = await fetch("/api/leads-submissions", { cache: "no-store" });
                const d = await r.json();
                setSubmissions(Array.isArray(d?.submissions) ? d.submissions : []);
              } catch {
                setSubmissions([]);
              }
            }
          }}
          helper="View all forms"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card label="Form Start Rate" value={`${rates.startRate}%`} loading={loading} />
        <Card label="Form Submit Rate" value={`${rates.submitRate}%`} loading={loading} />
      </section>

      {showSubmissions ? (
        <section className="mission-panel p-6">
          <h2 className="text-lg font-semibold">Submitted lead forms</h2>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-zinc-400">Newest first</p>
              <select
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs"
                value={viewCount}
                onChange={(e) => setViewCount(e.target.value as "5" | "10" | "20" | "all")}
              >
                <option value="5">5 forms</option>
                <option value="10">10 forms</option>
                <option value="20">20 forms</option>
                <option value="all">All forms</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setManualOpen((s) => !s)}
              className="rounded-lg border border-cyan-300/40 bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100"
            >
              {manualOpen ? "Close Manual Entry" : "Add Submission"}
            </button>
          </div>
          {manualOpen ? (
            <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-2">
              <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Name" value={manual.name} onChange={(e)=>setManual((m)=>({...m,name:e.target.value}))} />
              <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Phone" value={manual.phone} onChange={(e)=>setManual((m)=>({...m,phone:e.target.value}))} />
              <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Email" value={manual.email} onChange={(e)=>setManual((m)=>({...m,email:e.target.value}))} />
              <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Build Location" value={manual.buildLocation} onChange={(e)=>setManual((m)=>({...m,buildLocation:e.target.value}))} />
              <textarea className="sm:col-span-2 h-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Notes/details" value={manual.details} onChange={(e)=>setManual((m)=>({...m,details:e.target.value}))} />
              <div className="sm:col-span-2">
                <button type="button" onClick={addManualSubmission} className="rounded-lg border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-100">Save Submission</button>
              </div>
            </div>
          ) : null}
          <input
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm"
            placeholder="Search name, phone, email, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mt-4 space-y-3">
            {filteredSubmissions.length ? (
              filteredSubmissions.map((s) => (
                <article key={s.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-zinc-500">{new Date(s.createdAt).toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => patchSubmission(s.id, { contacted: !Boolean(s.contacted) })}
                        className={`rounded-lg border px-3 py-1 text-xs ${s.contacted ? "border-emerald-300/40 bg-emerald-500/20 text-emerald-200" : "border-white/20 bg-white/5 text-zinc-200"}`}
                      >
                        {s.contacted ? "Contacted" : "Not Contacted"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this form submission?")) deleteSubmission(s.id);
                        }}
                        className="rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-1 text-xs text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-base font-semibold">{s.name || "No name"}</p>
                  <p className="text-sm text-zinc-300">{s.phone || "No phone"} · {s.email || "No email"}</p>
                  {s.buildLocation ? <p className="text-sm text-zinc-400">Build location: {s.buildLocation}</p> : null}
                  {s.details ? <p className="mt-2 text-sm text-zinc-300">{s.details}</p> : null}
                  <div className="mt-3">
                    <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-zinc-500">Notes</label>
                    <textarea
                      className="h-20 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                      placeholder="Add notes for this lead..."
                      value={s.notes || ""}
                      onChange={(e) => setSubmissions((curr) => curr.map((x) => (x.id === s.id ? { ...x, notes: e.target.value } : x)))}
                      onBlur={(e) => patchSubmission(s.id, { notes: e.target.value })}
                    />
                  </div>
                  {s.contacted && s.contactedAt ? <p className="mt-2 text-xs text-emerald-300">Contacted: {new Date(s.contactedAt).toLocaleString()}</p> : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No matching submissions.</p>
            )}
          </div>
        </section>
      ) : null}

      <section className="mission-panel p-6">
        <h2 className="text-lg font-semibold">Last 30 days</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Views</th>
                <th className="pb-2 pr-4">CTA Clicks</th>
                <th className="pb-2 pr-4">Form Starts</th>
                <th className="pb-2 pr-4">Form Submits</th>
              </tr>
            </thead>
            <tbody>
              {recentDays.length ? (
                recentDays.map(([day, d]) => (
                  <tr key={day} className="border-t border-white/10">
                    <td className="py-2 pr-4">{day}</td>
                    <td className="py-2 pr-4">{d.pageViews || 0}</td>
                    <td className="py-2 pr-4">{d.ctaClicks || 0}</td>
                    <td className="py-2 pr-4">{d.formStarts || 0}</td>
                    <td className="py-2 pr-4">{d.formSubmits || 0}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="py-2 text-zinc-500" colSpan={5}>No data yet. Visits and form activity will show up automatically.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  loading,
  clickable,
  onClick,
  helper,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  helper?: string;
}) {
  return (
    <article
      className={`mission-panel p-5 ${clickable ? "cursor-pointer transition hover:border-cyan-300/40" : ""}`}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{loading ? "…" : value}</p>
      {helper ? <p className="mt-2 text-xs text-zinc-500">{helper}</p> : null}
    </article>
  );
}
