"use client";

import { useEffect, useState } from "react";

type CustomerContact = {
  name: string;
  phone: string;
  email: string;
};

type CustomerContactsState = {
  primary: CustomerContact;
  secondary: CustomerContact;
  showSecondary: boolean;
};

const emptyContact: CustomerContact = {
  name: "",
  phone: "",
  email: "",
};

const emptyState: CustomerContactsState = {
  primary: { ...emptyContact },
  secondary: { ...emptyContact },
  showSecondary: false,
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function CustomerContactCard({ jobId }: { jobId: string }) {
  const [contacts, setContacts] = useState<CustomerContactsState>(emptyState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`job-${jobId}-customer-contact`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      // Backward compatibility: old single-contact shape
      if ("name" in parsed || "phone" in parsed || "email" in parsed) {
        setContacts({
          primary: {
            name: parsed.name || "",
            phone: parsed.phone || "",
            email: parsed.email || "",
          },
          secondary: { ...emptyContact },
          showSecondary: false,
        });
        return;
      }

      setContacts({
        primary: {
          name: parsed.primary?.name || "",
          phone: parsed.primary?.phone || "",
          email: parsed.primary?.email || "",
        },
        secondary: {
          name: parsed.secondary?.name || "",
          phone: parsed.secondary?.phone || "",
          email: parsed.secondary?.email || "",
        },
        showSecondary: !!parsed.showSecondary || !!parsed.secondary?.name || !!parsed.secondary?.phone || !!parsed.secondary?.email,
      });
    } catch {
      // ignore
    }
  }, [jobId]);

  useEffect(() => {
    localStorage.setItem(`job-${jobId}-customer-contact`, JSON.stringify(contacts));
  }, [contacts, jobId]);

  const setField = (slot: "primary" | "secondary", key: keyof CustomerContact, value: string) => {
    setContacts((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        [key]: value,
      },
    }));
  };

  return (
    <section className="mission-panel p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Customer contact</p>
      <h3 className="mt-1 text-xl font-semibold">Customer Contact</h3>

      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-sm text-zinc-400">Contact 1</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={contacts.primary.name}
              onChange={(e) => setField("primary", "name", e.target.value)}
              placeholder="Name"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              value={contacts.primary.phone}
              onChange={(e) => setField("primary", "phone", formatPhone(e.target.value))}
              placeholder="(251) 555-1234"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              value={contacts.primary.email}
              onChange={(e) => setField("primary", "email", e.target.value)}
              placeholder="Email"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {!contacts.showSecondary ? (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setContacts((prev) => ({ ...prev, showSecondary: true }))}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Add Contact
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm text-zinc-400">Contact 2</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={contacts.secondary.name}
                onChange={(e) => setField("secondary", "name", e.target.value)}
                placeholder="Name"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={contacts.secondary.phone}
                onChange={(e) => setField("secondary", "phone", formatPhone(e.target.value))}
                placeholder="(251) 555-1234"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={contacts.secondary.email}
                onChange={(e) => setField("secondary", "email", e.target.value)}
                placeholder="Email"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
