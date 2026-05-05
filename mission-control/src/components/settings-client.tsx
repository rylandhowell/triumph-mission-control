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
  const fieldClass = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 dark:border-white/10 dark:bg-black/30 dark:text-zinc-100 dark:placeholder:text-zinc-500";
  const labelClass = "block text-sm text-zinc-700 dark:text-zinc-300";
  const toggleRowClass = "flex items-center justify-between rounded-lg border border-zinc-300 bg-white/80 px-3 py-2 text-sm text-zinc-800 dark:border-white/10 dark:bg-black/20 dark:text-zinc-100";

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
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Each profile keeps its own settings.</p>
      </section>

      <section className="mission-panel space-y-4 p-6">
        <label className={labelClass}>Profile</label>
        <select value={profile} onChange={(e) => setProfile(e.target.value)} className={fieldClass}>
          <option value="ryland">Ryland</option>
          <option value="office">Office</option>
          <option value="assistant">Assistant</option>
        </select>

        <label className={labelClass}>Display name</label>
        <input value={settings.name} onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))} className={fieldClass} />

        <label className={labelClass}>Theme</label>
        <select value={settings.theme} onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value as UserSettings["theme"] }))} className={fieldClass}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>

        <label className={labelClass}>Default page</label>
        <select value={settings.defaultView} onChange={(e) => setSettings((s) => ({ ...s, defaultView: e.target.value as UserSettings["defaultView"] }))} className={fieldClass}>
          <option value="overview">Overview</option>
          <option value="calendar">Calendar</option>
          <option value="subs">Subs</option>
        </select>

        <label className={toggleRowClass}>
          <span>Notifications</span>
          <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings((s) => ({ ...s, notifications: e.target.checked }))} className="h-4 w-4 accent-emerald-500" />
        </label>

        <label className={toggleRowClass}>
          <span>Compact mode</span>
          <input type="checkbox" checked={settings.compactMode} onChange={(e) => setSettings((s) => ({ ...s, compactMode: e.target.checked }))} className="h-4 w-4 accent-emerald-500" />
        </label>
      </section>
    </div>
  );
}
