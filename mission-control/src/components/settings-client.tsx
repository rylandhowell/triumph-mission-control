"use client";

import { useEffect, useState } from "react";

type UserSettings = {
  name: string;
  theme: "dark" | "light";
  defaultView: "overview" | "calendar" | "subs";
  notifications: boolean;
  compactMode: boolean;
};

const defaultSettings: UserSettings = {
  name: "Ryland",
  theme: "dark",
  defaultView: "overview",
  notifications: true,
  compactMode: false,
};

export function SettingsClient() {
  const [profile, setProfile] = useState("ryland");
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem(`settings-${profile}`);
    if (saved) {
      try {
        const next = { ...defaultSettings, ...JSON.parse(saved) } as UserSettings;
        setSettings(next);
        document.documentElement.classList.toggle("dark", next.theme === "dark");
        return;
      } catch {
        // ignore
      }
    }
    const theme = (localStorage.getItem("mission-theme") as UserSettings["theme"]) || defaultSettings.theme;
    const next = { ...defaultSettings, theme };
    setSettings(next);
    document.documentElement.classList.toggle("dark", next.theme === "dark");
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(`settings-${profile}`, JSON.stringify(settings));
    localStorage.setItem("mission-theme", settings.theme);
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [profile, settings]);

  return (
    <div className="space-y-6">
      <section className="mission-panel p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Settings</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Personal preferences</h2>
        <p className="mt-2 text-sm text-zinc-400">Each profile keeps its own settings.</p>
      </section>

      <section className="mission-panel space-y-4 p-6">
        <label className="block text-sm text-zinc-400">Profile</label>
        <select value={profile} onChange={(e) => setProfile(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
          <option value="ryland">Ryland</option>
          <option value="office">Office</option>
          <option value="assistant">Assistant</option>
        </select>

        <label className="block text-sm text-zinc-400">Display name</label>
        <input value={settings.name} onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />

        <label className="block text-sm text-zinc-400">Theme</label>
        <select value={settings.theme} onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value as UserSettings["theme"] }))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>

        <label className="block text-sm text-zinc-400">Default page</label>
        <select value={settings.defaultView} onChange={(e) => setSettings((s) => ({ ...s, defaultView: e.target.value as UserSettings["defaultView"] }))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
          <option value="overview">Overview</option>
          <option value="calendar">Calendar</option>
          <option value="subs">Subs</option>
        </select>

        <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <span>Notifications</span>
          <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings((s) => ({ ...s, notifications: e.target.checked }))} className="h-4 w-4 accent-emerald-500" />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <span>Compact mode</span>
          <input type="checkbox" checked={settings.compactMode} onChange={(e) => setSettings((s) => ({ ...s, compactMode: e.target.checked }))} className="h-4 w-4 accent-emerald-500" />
        </label>
      </section>
    </div>
  );
}
