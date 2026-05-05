"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SubRecord = {
  id: string;
  name: string;
  trade: string;
  phone: string;
  email: string;
  glPolicy: string;
  glExpires: string;
  wcPolicy: string;
  wcExpires: string;
  notes: string;
};

const emptySub = (): SubRecord => ({
  id: crypto.randomUUID(),
  name: "",
  trade: "",
  phone: "",
  email: "",
  glPolicy: "",
  glExpires: "",
  wcPolicy: "",
  wcExpires: "",
  notes: "",
});

const daysUntil = (dateStr: string) => {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(`${dateStr}T00:00:00`);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : null;
};

export function SubsClient() {
  const [rows, setRows] = useState<SubRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [quick, setQuick] = useState({ name: "", trade: "", phone: "", email: "" });
  const localKey = "subs-insurance-cache";
  const rowsRef = useRef<SubRecord[]>([]);

  const pushRows = async (nextRows: SubRecord[]) => {
    try {
      await fetch("/api/subs-insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: nextRows }),
      });
    } catch {
      // ignore
    }
  };

  const uploadInsurance = async (id: string, type: "gl" | "wc", file: File) => {
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("type", type);

      const res = await fetch("/api/subs-insurance/extract", { method: "POST", body });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.found || !data?.expirationDate) return;

      setRows((prev) => {
        const next = prev.map((r) => {
          if (r.id !== id) return r;
          return type === "gl" ? { ...r, glExpires: data.expirationDate } : { ...r, wcExpires: data.expirationDate };
        });
        localStorage.setItem(localKey, JSON.stringify(next));
        void pushRows(next);
        return next;
      });
      setDirty(true);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;

    const localRaw = localStorage.getItem(localKey);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        if (Array.isArray(parsed)) setRows(parsed);
      } catch {
        // ignore
      }
    }

    const load = async () => {
      try {
        const res = await fetch("/api/subs-insurance", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.rows)) {
          setRows(data.rows);
          localStorage.setItem(localKey, JSON.stringify(data.rows));
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoaded(true);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded || !dirty) return;
    localStorage.setItem(localKey, JSON.stringify(rows));
  }, [rows, loaded, dirty]);

  useEffect(() => {
    if (!loaded) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch("/api/subs-insurance", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.rows)) return;

        const current = JSON.stringify(rowsRef.current);
        const incoming = JSON.stringify(data.rows);
        if (current !== incoming) {
          setRows(data.rows);
          localStorage.setItem(localKey, JSON.stringify(data.rows));
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => clearInterval(iv);
  }, [loaded]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const alerts = useMemo(() => {
    return rows
      .flatMap((sub) => {
        const glDays = daysUntil(sub.glExpires);
        const wcDays = daysUntil(sub.wcExpires);
        return [
          glDays !== null ? { sub: sub.name || "Unnamed sub", type: "GL", days: glDays } : null,
          wcDays !== null ? { sub: sub.name || "Unnamed sub", type: "WC", days: wcDays } : null,
        ].filter((x): x is { sub: string; type: string; days: number } => !!x);
      })
      .filter((x) => x.days <= 30)
      .sort((a, b) => a.days - b.days);
  }, [rows]);

  const setCell = (id: string, key: keyof SubRecord, value: string) => {
    setDirty(true);
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, [key]: value } : r));
      localStorage.setItem(localKey, JSON.stringify(next));
      void pushRows(next);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <section className="mission-panel p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Subs</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sub Contacts + Insurance Tracker</h2>
            <p className="mt-2 text-sm text-zinc-400">Track contact info plus General Liability and Workers Comp expiration dates.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDirty(true);
              setRows((prev) => {
                const next = [...prev, emptySub()];
                localStorage.setItem(localKey, JSON.stringify(next));
                void pushRows(next);
                return next;
              });
            }}
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"
          >
            Add blank row
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <input value={quick.name} onChange={(e) => setQuick((q) => ({ ...q, name: e.target.value }))} placeholder="Sub name" className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          <input value={quick.trade} onChange={(e) => setQuick((q) => ({ ...q, trade: e.target.value }))} placeholder="Trade" className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          <input value={quick.phone} onChange={(e) => setQuick((q) => ({ ...q, phone: e.target.value }))} placeholder="Phone" className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          <input
            value={quick.email}
            onChange={(e) => setQuick((q) => ({ ...q, email: e.target.value }))}
            placeholder="Email"
            className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const name = quick.name.trim();
              if (!name) return;
              setDirty(true);
              setRows((prev) => {
                const next = [{ ...emptySub(), name, trade: quick.trade.trim(), phone: quick.phone.trim(), email: quick.email.trim() }, ...prev];
                localStorage.setItem(localKey, JSON.stringify(next));
                void pushRows(next);
                return next;
              });
              setQuick({ name: "", trade: "", phone: "", email: "" });
            }}
          />
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              const name = quick.name.trim();
              if (!name) return;
              setDirty(true);
              setRows((prev) => {
                const next = [{ ...emptySub(), name, trade: quick.trade.trim(), phone: quick.phone.trim(), email: quick.email.trim() }, ...prev];
                localStorage.setItem(localKey, JSON.stringify(next));
                void pushRows(next);
                return next;
              });
              setQuick({ name: "", trade: "", phone: "", email: "" });
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Add Sub
          </button>
        </div>
      </section>

      <section className="mission-panel p-6">
        <h3 className="text-lg font-semibold">Insurance alerts (next 30 days)</h3>
        {alerts.length ? (
          <div className="mt-3 space-y-2 text-sm">
            {alerts.map((a, i) => (
              <div key={`${a.sub}-${a.type}-${i}`} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-100">
                {a.sub}: {a.type} {a.days < 0 ? `expired ${Math.abs(a.days)} day(s) ago` : `expires in ${a.days} day(s)`}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">No expirations in the next 30 days.</p>
        )}
      </section>

      <section className="mission-panel overflow-hidden bg-[#09090b] p-3">
        <div className="overflow-x-auto overflow-y-hidden rounded-xl bg-[#09090b] pb-2">
        <table className="min-w-[1400px] w-full text-sm bg-[#09090b]">
          <thead className="text-zinc-400">
            <tr className="border-b border-white/10">
              {[
                "Sub",
                "Trade",
                "Email",
                "GL Policy",
                "GL Expires",
                "GL File",
                "WC Policy",
                "WC Expires",
                "WC File",
                "Notes",
                "",
              ].map((h) => (
                <th key={h} className="bg-[#09090b] px-2 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 bg-[#09090b]">
                <td className="bg-[#09090b] p-2"><input value={r.name} onChange={(e) => setCell(r.id, "name", e.target.value)} className="w-40 rounded border border-white/10 bg-black/30 px-2 py-1" /></td>
                <td className="bg-[#09090b] p-2"><input value={r.trade} onChange={(e) => setCell(r.id, "trade", e.target.value)} className="w-32 rounded border border-white/10 bg-black/30 px-2 py-1" /></td>
                <td className="bg-[#09090b] p-2"><input value={r.email} onChange={(e) => setCell(r.id, "email", e.target.value)} className="w-44 rounded border border-white/10 bg-black/30 px-2 py-1" /></td>
                <td className="bg-[#09090b] p-2"><input value={r.glPolicy} onChange={(e) => setCell(r.id, "glPolicy", e.target.value)} className="w-36 rounded border border-white/10 bg-black/30 px-2 py-1" /></td>
                <td className="bg-[#09090b] p-2">
                  <input type="date" value={r.glExpires} onChange={(e) => setCell(r.id, "glExpires", e.target.value)} className="w-36 rounded border border-white/10 bg-black/30 px-2 py-1" style={{ colorScheme: "dark" }} />
                </td>
                <td className="bg-[#09090b] p-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadInsurance(r.id, "gl", file);
                      e.currentTarget.value = "";
                    }}
                    className="w-44 rounded border border-white/10 bg-black/30 p-1 text-xs text-zinc-300 file:mr-2 file:rounded file:border-0 file:bg-zinc-700 file:px-2 file:py-1 file:text-xs file:text-zinc-100"
                    style={{ colorScheme: "dark" }}
                  />
                </td>
                <td className="bg-[#09090b] p-2"><input value={r.wcPolicy} onChange={(e) => setCell(r.id, "wcPolicy", e.target.value)} className="w-36 rounded border border-white/10 bg-black/30 px-2 py-1" /></td>
                <td className="bg-[#09090b] p-2">
                  <input type="date" value={r.wcExpires} onChange={(e) => setCell(r.id, "wcExpires", e.target.value)} className="w-36 rounded border border-white/10 bg-black/30 px-2 py-1" style={{ colorScheme: "dark" }} />
                </td>
                <td className="bg-[#09090b] p-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadInsurance(r.id, "wc", file);
                      e.currentTarget.value = "";
                    }}
                    className="w-44 rounded border border-white/10 bg-black/30 p-1 text-xs text-zinc-300 file:mr-2 file:rounded file:border-0 file:bg-zinc-700 file:px-2 file:py-1 file:text-xs file:text-zinc-100"
                    style={{ colorScheme: "dark" }}
                  />
                </td>
                <td className="bg-[#09090b] p-2"><input value={r.notes} onChange={(e) => setCell(r.id, "notes", e.target.value)} className="w-56 rounded border border-white/10 bg-black/30 px-2 py-1" /></td>
                <td className="bg-[#09090b] p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDirty(true);
                      setRows((prev) => {
                        const next = prev.filter((x) => x.id !== r.id);
                        localStorage.setItem(localKey, JSON.stringify(next));
                        void pushRows(next);
                        return next;
                      });
                    }}
                    className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}
