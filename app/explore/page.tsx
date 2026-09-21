import Link from "next/link";

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Explore</p>
        <h1 className="mt-4 text-2xl sm:text-3xl sm:text-5xl font-black">Discover what’s happening.</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Browse nightlife, festivals, pop-ups, networking events, and cultural experiences.
        </p>
        <Link href="/events" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-bold text-black">
          Browse Events
        </Link>

          <Link
            href="/recommendations"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-orange-300 bg-orange-50 px-5 py-3.5 text-sm font-bold text-orange-950 shadow-lg shadow-orange-500/10 transition hover:scale-[1.01] hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-100 dark:hover:bg-orange-500/20 sm:py-3"
          >
            AI picks
          </Link>

      </section>
    </main>
  );
}
