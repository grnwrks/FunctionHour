import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getSupportMetrics } from "@/lib/supportObservability";

function getAllowedAdminIds() {
  return new Set(
    (process.env.SUPPORT_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">
        {value}
      </p>
      {note ? (
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function SupportAdminPage() {
  const session = await auth();
  const allowedAdminIds = getAllowedAdminIds();

  if (!session.userId || !allowedAdminIds.has(session.userId)) {
    notFound();
  }

  const metrics = getSupportMetrics();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Internal admin
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-950 dark:text-white">
          Support assistant health
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Runtime counters for the current application instance. No conversation transcripts are stored here.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Chat requests" value={metrics.chatRequests} />
        <MetricCard
          label="Success rate"
          value={metrics.successRate === null ? "—" : `${metrics.successRate}%`}
        />
        <MetricCard
          label="Helpful rate"
          value={metrics.helpfulRate === null ? "—" : `${metrics.helpfulRate}%`}
          note={`${metrics.feedbackTotal} feedback response${metrics.feedbackTotal === 1 ? "" : "s"}`}
        />
        <MetricCard label="Escalations" value={metrics.escalations} />
        <MetricCard label="Failures" value={metrics.chatFailures} />
        <MetricCard label="Rate limited" value={metrics.rateLimited} />
        <MetricCard label="Helpful" value={metrics.feedbackHelpful} />
        <MetricCard label="Not helpful" value={metrics.feedbackUnhelpful} />
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300">
        <p>
          Last activity: {metrics.lastActivityAt ?? "No assistant activity recorded on this instance yet."}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          These counters are in-memory and reset when the server instance restarts or scales. They are intended for MVP diagnostics, not long-term analytics.
        </p>
      </section>
    </main>
  );
}
