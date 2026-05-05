import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { ThemeSync } from "@/components/theme-sync";

export function AppShell({ currentPath, children }: { currentPath: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100">
      <ThemeSync />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Sidebar currentPath={currentPath} />
        <div className="flex-1 space-y-6">{children}</div>
      </main>
    </div>
  );
}
