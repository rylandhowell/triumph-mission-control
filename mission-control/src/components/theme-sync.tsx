"use client";

import { useEffect } from "react";

export function ThemeSync() {
  useEffect(() => {
    const saved = localStorage.getItem("mission-theme") || "dark";
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  return null;
}
