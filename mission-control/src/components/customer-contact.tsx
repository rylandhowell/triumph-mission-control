"use client";

import { useEffect, useState } from "react";

type CustomerContact = {
  name: string;
  phone: string;
  email: string;
};

const emptyContact: CustomerContact = {
  name: "",
  phone: "",
  email: "",
};

export function CustomerContactCard({ jobId }: { jobId: string }) {
  const [contact, setContact] = useState<CustomerContact>(emptyContact);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`job-${jobId}-customer-contact`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      setContact({
        name: parsed.name || "",
        phone: parsed.phone || "",
        email: parsed.email || "",
      });
    } catch {
      // ignore
    }
  }, [jobId]);

  useEffect(() => {
    localStorage.setItem(`job-${jobId}-customer-contact`, JSON.stringify(contact));
  }, [contact, jobId]);

  return (
    <section className="mission-panel p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Customer contact</p>
      <h3 className="mt-1 text-xl font-semibold">Customer Contact</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          value={contact.name}
          onChange={(e) => setContact((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <input
          value={contact.phone}
          onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="Phone number"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <input
          value={contact.email}
          onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
      </div>
    </section>
  );
}
