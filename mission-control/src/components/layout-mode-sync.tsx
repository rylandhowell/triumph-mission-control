"use client";

import { useEffect } from "react";

type StoredSettings = {
  mobileFriendly?: boolean;
};

export function LayoutModeSync() {
  useEffect(() => {
    const profile = localStorage.getItem("mission-active-profile") || "ryland";
    const saved = localStorage.getItem(`settings-${profile}`);

    if (!saved) {
      document.documentElement.classList.toggle("mission-mobile", true);
      return;
    }

    try {
      const next = JSON.parse(saved) as StoredSettings;
      document.documentElement.classList.toggle("mission-mobile", next.mobileFriendly ?? true);
    } catch {
      document.documentElement.classList.toggle("mission-mobile", true);
    }
  }, []);

  return null;
}
