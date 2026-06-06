"use client";

import { useMemo, useState } from "react";
import { Quote, QuoteLineItem } from "@/lib/mission-data";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStatusColor(status: Quote["status"]) {
  switch (status) {
    case "Approved": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "Sent": return "bg-sky-500/20 text-sky-300 border-sky-500/30";
    case "Declined": return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    default: return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  }
}

export function QuotesClient({ quotes }: { quotes: Quote[] }) {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(quotes[0]?.id || "");

  const selectedQuote = useMemo(() => {
    return quotes.find((q) => q.id === selectedQuoteId) || quotes[0];
  }, [selectedQuoteId, quotes]);

  const groupedLineItems = useMemo(() => {
    if (!selectedQuote) return {};
    const groups: Record<string, QuoteLineItem[]> = {};
    selectedQuote.lineItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [selectedQuote]);

  if (!selectedQuote) {
    return (
      <div className="mission-panel p-8 text-center">
        <p className="text-zinc-400">No quotes available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with dropdown */}
      <section className="mission-panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Manual Quotes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Quote Details</h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-400">Select Job:</label>
            <select
              value={selectedQuoteId}
              onChange={(e) => setSelectedQuoteId(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm focus:border-cyan-500/50 focus:outline-none"
            >
              {quotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.jobName} — {q.clientName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quote summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-zinc-500 uppercase">Client</p>
            <p className="mt-1 text-lg font-medium">{selectedQuote.clientName}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-zinc-500 uppercase">Quote Date</p>
            <p className="mt-1 text-lg font-medium">{formatDate(selectedQuote.quoteDate)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-zinc-500 uppercase">Expires</p>
            <p className="mt-1 text-lg font-medium">{formatDate(selectedQuote.expirationDate)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-zinc-500 uppercase">Status</p>
            <span className={`mt-1 inline-block rounded-md border px-3 py-1 text-sm ${getStatusColor(selectedQuote.status)}`}>
              {selectedQuote.status}
            </span>
          </div>
        </div>

        {selectedQuote.notes && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-zinc-500 uppercase">Notes</p>
            <p className="mt-1 text-sm text-zinc-300">{selectedQuote.notes}</p>
          </div>
        )}
      </section>

      {/* Line Items */}
      <section className="mission-panel overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold">Line Items</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-zinc-400">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-left font-medium">Unit</th>
                <th className="px-4 py-3 text-right font-medium">Unit Cost</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedLineItems).map(([category, items]) => (
                items.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-white/5 ${idx === items.length - 1 ? 'border-b-white/10' : ''} bg-[#09090b]`}
                  >
                    {idx === 0 && (
                      <td rowSpan={items.length} className="px-4 py-3 align-top font-medium text-cyan-400 bg-[#09090b]">
                        {category}
                      </td>
                    )}
                    <td className="px-4 py-3 bg-[#09090b]">{item.description}</td>
                    <td className="px-4 py-3 text-right bg-[#09090b]">{item.quantity}</td>
                    <td className="px-4 py-3 text-zinc-400 bg-[#09090b]">{item.unit}</td>
                    <td className="px-4 py-3 text-right bg-[#09090b]">{formatCurrency(item.unitCost)}</td>
                    <td className="px-4 py-3 text-right font-medium bg-[#09090b]">{formatCurrency(item.total)}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs bg-[#09090b]">{item.notes || "—"}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Summary */}
      <section className="mission-panel p-6">
        <h3 className="text-lg font-semibold mb-4">Quote Summary</h3>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex justify-between gap-8 sm:w-72">
            <span className="text-zinc-400">Subtotal</span>
            <span className="font-medium">{formatCurrency(selectedQuote.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-8 sm:w-72">
            <span className="text-zinc-400">Overhead (5%)</span>
            <span className="font-medium">{formatCurrency(selectedQuote.overhead)}</span>
          </div>
          <div className="flex justify-between gap-8 sm:w-72">
            <span className="text-zinc-400">Builder Fee (15%)</span>
            <span className="font-medium">{formatCurrency(selectedQuote.fee)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-8 sm:w-72 border-t border-white/10 pt-2">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-bold text-emerald-400">{formatCurrency(selectedQuote.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
