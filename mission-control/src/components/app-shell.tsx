import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { ThemeSync } from "@/components/theme-sync";
import { LayoutModeSync } from "@/components/layout-mode-sync";
import { LeadsSubmitNotifier } from "@/components/leads-submit-notifier";

export function AppShell({ currentPath, children }: { currentPath: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100">
      <ThemeSync />
      <LayoutModeSync />
      <LeadsSubmitNotifier />
      <main className="mission-main mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-3 sm:px-6 lg:flex-row lg:gap-6 lg:px-8 lg:py-4">
        <Sidebar currentPath={currentPath} />
        <div className="mission-content min-w-0 flex-1 space-y-4 lg:space-y-6">{children}</div>
      </main>
    </div>
  );
}
