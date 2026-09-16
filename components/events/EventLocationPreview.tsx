"use client";

import { MapPin } from "lucide-react";

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
    venueName || location || [city, state].filter(Boolean).join(", ");

  const encoded = encodeURIComponent(displayLocation || "");

  if (!displayLocation) return null;

  return (
    <section className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111] p-5 sm:mt-6 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-black">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Location
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              {displayLocation}
            </h2>
            {(city || state) && (
              <p className="mt-1 text-sm text-white/50">
                {[city, state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-black text-white transition hover:bg-white hover:text-black"
        >
          Get directions
        </a>
      </div>
    </section>
  );
}
