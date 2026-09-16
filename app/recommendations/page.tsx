"use client";

import Link from "next/link";

const signals = [
  { title: "Popular near you", description: "Upcoming experiences with the strongest local interest." },
  { title: "Nightlife with momentum", description: "Parties, concerts, and late-night events drawing a crowd." },
  { title: "Hosts to watch", description: "Upcoming releases from active Function Hour organizers." },
  { title: "More like your favorites", description: "Browse events related to the experiences you save and explore." },
];

export default function RecommendationsPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-18%] top-[-10%] h-[420px] w-[420px] rounded-full bg-orange-500/15 blur-[120px]" />
        <div className="absolute right-[-18%] top-[18%] h-[420px] w-[420px] rounded-full bg-violet-500/15 blur-[120px]" />
      </div>

      <section className="mx-auto max-w-6xl">
        <Link href="/events" className="text-sm text-white/50 hover:text-white">
          ← Back to events
        </Link>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:rounded-3xl sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.35em] text-orange-300/70">
            Function Hour Signal Engine
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            Recommended for your crowd rhythm.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            Explore upcoming experiences selected from current event activity,
            local interest, and the categories people are discovering now.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {signals.map((item, idx) => (
              <div
                key={item.title}
              data-rank={idx + 1}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div className="mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-orange-400 to-violet-400" />
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/events"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-black shadow-lg shadow-white/10 transition hover:scale-[1.01] hover:bg-orange-100 sm:py-3"
            >
              Explore events
            </Link>

            <Link
              href="/map"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 px-5 py-3.5 text-sm font-bold text-white/80 transition hover:bg-white/10 sm:py-3"
            >
              Open crowd map
            </Link>
          </div>
        </div>
      </section>

      <div className="h-10 sm:hidden" />
    </main>
  );
}
