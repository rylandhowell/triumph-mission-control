import { AppShell } from "@/components/app-shell";

export default function LeadsPage() {
  return (
    <AppShell currentPath="/leads">
      <section className="mission-panel overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="p-8 sm:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Triumph Homes · Mobile & Baldwin County</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Build a custom home that fits your life — without getting lost in the process.
            </h1>
            <p className="mt-5 max-w-xl text-base text-zinc-300 sm:text-lg">
              We handle custom homes from budget-friendly to high-end luxury across Grand Bay, Mobile County, and Baldwin County.
              Clear communication. Real timelines. Quality craftsmanship.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-zinc-200">Custom Homes</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-zinc-200">New Construction</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-zinc-200">From Ground-Up</span>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-2xl font-semibold text-white">30+</p>
                <p className="mt-1 text-sm text-zinc-400">Local builds managed</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-2xl font-semibold text-white">1:1</p>
                <p className="mt-1 text-sm text-zinc-400">Direct PM communication</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-2xl font-semibold text-white">Fast</p>
                <p className="mt-1 text-sm text-zinc-400">Quote response turnaround</p>
              </div>
            </div>
          </div>

          <div className="border-l border-white/10 bg-black/25 p-8 sm:p-10">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <h2 className="text-2xl font-semibold text-white">Get a custom home quote</h2>
              <p className="mt-2 text-sm text-zinc-400">Tell us about your project. We’ll follow up with next steps.</p>

              <form className="mt-6 space-y-4">
                <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" placeholder="Full name" />
                <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" placeholder="Phone" />
                <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" placeholder="Email" />
                <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" placeholder="Build location (city/area)" />
                <div className="grid grid-cols-2 gap-3">
                  <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" placeholder="Heated sq ft" />
                  <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" placeholder="Budget range" />
                </div>
                <textarea
                  className="h-28 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                  placeholder="Tell us what you want to build"
                />
                <button
                  type="button"
                  className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-300"
                >
                  Request Quote
                </button>
                <p className="text-xs text-zinc-500">No spam. Just project follow-up.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="mission-panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Step 1</p>
          <h3 className="mt-2 text-xl font-semibold">Plan review</h3>
          <p className="mt-2 text-sm text-zinc-400">We review your floor plan, budget, lot, and must-haves to scope your build correctly.</p>
        </article>
        <article className="mission-panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Step 2</p>
          <h3 className="mt-2 text-xl font-semibold">Transparent estimate</h3>
          <p className="mt-2 text-sm text-zinc-400">You get a line-by-line estimate with realistic allowances and timeline expectations.</p>
        </article>
        <article className="mission-panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Step 3</p>
          <h3 className="mt-2 text-xl font-semibold">Build with updates</h3>
          <p className="mt-2 text-sm text-zinc-400">We keep communication direct and simple from dirt work to final walkthrough.</p>
        </article>
      </section>
    </AppShell>
  );
}
