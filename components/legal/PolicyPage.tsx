import Link from "next/link";
import type { ReactNode } from "react";

type PolicySection = {
  title: string;
  content: ReactNode;
};

type PolicyPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  sections: PolicySection[];
};

export default function PolicyPage({
  eyebrow,
  title,
  summary,
  sections,
}: PolicyPageProps) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="text-sm font-semibold text-orange-400 transition hover:text-orange-300"
        >
          ← Back to Function Hour
        </Link>

        <header className="mt-10 border-b border-white/10 pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            {summary}
          </p>
          <p className="mt-5 text-sm text-zinc-500">
            Effective August 3, 2026 · Function Hour
          </p>
        </header>

        <div className="space-y-10 py-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-white">{section.title}</h2>
              <div className="mt-3 space-y-3 text-base leading-7 text-zinc-300">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <aside className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-6">
          <h2 className="font-bold text-white">Questions?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Contact Function Hour at{" "}
            <a
              href="mailto:support@functionhour.com"
              className="font-semibold text-orange-400 hover:text-orange-300"
            >
              support@functionhour.com
            </a>{" "}
            or{" "}
            <a
              href="tel:+15043967476"
              className="font-semibold text-orange-400 hover:text-orange-300"
            >
              504-396-7476
            </a>
            .
          </p>
        </aside>
      </div>
    </main>
  );
}
