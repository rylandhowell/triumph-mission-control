import Link from "next/link";
import { navItems, jobs, schedule } from "@/lib/mission-data";

export function Sidebar({ currentPath }: { currentPath: string }) {
  return (
    <aside className="mission-panel hidden w-72 shrink-0 p-5 lg:block">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Triumph Homes</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Mission Control</h1>
        <p className="mt-2 text-sm text-zinc-400">Operations dashboard for jobs, schedule, and blockers.</p>
      </div>

      <nav className="mt-8 space-y-2 text-sm">
        {navItems.map((item) => {
          const active = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-3 py-2 transition ${
                active
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Today</p>
        <p className="mt-2 text-sm text-zinc-300">{jobs.length} active jobs</p>
        <p className="mt-1 text-sm text-zinc-300">{schedule.length} scheduled items</p>
        <p className="mt-1 text-sm text-zinc-300">2 client decisions waiting</p>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Quick links</p>
        <div className="mt-3 space-y-2 text-sm text-zinc-300">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.slug}`} className="block rounded-xl px-2 py-2 hover:bg-white/5">
              {job.name}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
