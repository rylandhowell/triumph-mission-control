"use client";

import { useEffect, useState, useCallback } from "react";

export function useCloudState<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  // Load from cloud
  useEffect(() => {
    let active = true;
    
    const load = async () => {
      try {
        // Try cloud first
        const res = await fetch(`/api/state?key=${encodeURIComponent(key)}`, { cache: "no-store" });
        if (res.ok) {
          const result = await res.json();
          if (active && result.data !== undefined) {
            setData(result.data);
            setLoaded(true);
            return;
          }
        }
      } catch {
        // ignore
      }
      
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (active) {
            setData(parsed);
            // Migrate to cloud
            await fetch(`/api/state`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key, data: parsed }),
            });
          }
        }
      } catch {
        // ignore
      }
      
      if (active) setLoaded(true);
    };
    
    void load();
    
    // Poll for updates every 2 seconds
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/state?key=${encodeURIComponent(key)}`, { cache: "no-store" });
        if (res.ok) {
          const result = await res.json();
          if (result.data !== undefined) {
            setData(result.data);
          }
        }
      } catch {
        // ignore
      }
    }, 2000);
    
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [key]);

  // Save to cloud
  const setCloudData = useCallback(async (newData: T | ((prev: T) => T)) => {
    const resolved = typeof newData === "function" 
      ? (newData as (prev: T) => T)(data) 
      : newData;
    
    setData(resolved);
    
    // Save to both cloud and localStorage
    try {
      localStorage.setItem(key, JSON.stringify(resolved));
      await fetch(`/api/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, data: resolved }),
      });
    } catch {
      // ignore
    }
  }, [key, data]);

  return [data, setCloudData, loaded] as const;
}
