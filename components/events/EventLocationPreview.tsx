"use client";

type Props = {
  location?: string;
  venueName?: string;
  city?: string;
  state?: string;
};

export default function EventLocationPreview({
  location,
  venueName,
  city,
  state,
}: Props) {
  const displayLocation =
    venueName ||
    location ||
    [city, state].filter(Boolean).join(", ");

  const encoded = encodeURIComponent(displayLocation || "");

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Event Location
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Venue & Area
          </h2>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
        >
          Open Directions
        </a>
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 shadow-[0_0_80px_rgba(255,255,255,0.03)]">
        {/* Glow */}
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-3xl" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        {/* Pin */}
        <div className="relative flex min-h-[420px] flex-col items-center justify-center px-8 py-16 text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-white/20" />

            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white text-4xl shadow-2xl">
              📍
            </div>
          </div>

          <h3 className="mt-10 max-w-2xl text-4xl font-black tracking-tight text-white md:text-5xl">
            {displayLocation || "Venue Coming Soon"}
          </h3>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/50">
            Explore the venue area, nearby nightlife, parking,
            restaurants, and local experiences before the event begins.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {city && (
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white">
                🌆 {city}
              </div>
            )}

            {state && (
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white">
                🗺 {state}
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
