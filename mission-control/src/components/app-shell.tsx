import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export function AppShell({ currentPath, children }: { currentPath: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Sidebar currentPath={currentPath} />
        <div className="flex-1 space-y-6">{children}</div>
      </main>
    </div>
  );
}
